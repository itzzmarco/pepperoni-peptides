import { useSyncExternalStore } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_KEY, countItems, kv, readLedger, store } from './store';
import { Sync, syncStateKey, type PulledItem, type Remote, type SyncStatus } from './sync';

/**
 * Optional accounts, so a log can follow a person across devices. Each account sees only its own
 * log: the server's row-level security limits every read and write to the signed-in user.
 * Without the two settings below the app runs exactly as before, saving only on this device.
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const configured = !!(URL && KEY);

const AUTH_KEY = 'peptide-ledger:auth';
const TABLE = 'ledger_items';
const PAGE = 1000;
/** How often to look for changes made on the person's other devices while the app is open. */
const POLL_MS = 90_000;
const RETRY_MS = 30_000;

export const accountKey = (uid: string) => `${STORAGE_KEY}:${uid}`;
const keptKey = (uid: string) => `peptide-ledger:device-kept:${uid}`;

export interface AccountState {
  configured: boolean;
  user: { id: string; email: string } | null;
  status: SyncStatus;
  error: string;
  pending: number;
  lastSynced: string | null;
  /** Entries saved on this device while signed out, which can be moved into the account. */
  deviceItems: number;
  /** True once the person chose to leave those entries on the device. */
  deviceKept: boolean;
  /** Opened from a password-reset email, so the next step is choosing a new password. */
  recovering: boolean;
  /** A problem reported by a link from an email or a Google sign-in that came back with an error. */
  linkError: string;
  /** True when the Supabase project has Google sign-in turned on. */
  google: boolean;
}

let state: AccountState = {
  configured, user: null, status: 'idle', error: '', pending: 0, lastSynced: null,
  deviceItems: 0, deviceKept: false, recovering: false, linkError: linkErrorFromUrl(), google: false,
};
const listeners = new Set<() => void>();
function patch(p: Partial<AccountState>) {
  state = { ...state, ...p };
  listeners.forEach(l => l());
}

/**
 * The Supabase client loads in its own chunk after the app is on screen, so people who never
 * sign in don't wait for it. If it can't load (offline on a first visit), the next sync tries again.
 */
let client: Promise<SupabaseClient> | null = null;
function getClient(): Promise<SupabaseClient> {
  if (!client) {
    client = import('@supabase/supabase-js').then(({ createClient }) => {
      const sb = createClient(URL!, KEY!, { auth: { storageKey: AUTH_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      sb.auth.onAuthStateChange(onAuth);
      return sb;
    });
    client.catch(() => { client = null; });
  }
  return client;
}

let sync: Sync | null = null;
let ready = false;
let debounce: ReturnType<typeof setTimeout> | undefined;
let retry: ReturnType<typeof setTimeout> | undefined;

function remoteFor(uid: string): Remote {
  return {
    async pull(since) {
      const out: PulledItem[] = [];
      for (let from = 0; ; from += PAGE) {
        const sb = await getClient();
        let q = sb.from(TABLE).select('kind,id,data,deleted,updated_at').eq('user_id', uid);
        if (since) q = q.gt('updated_at', since);
        const { data, error } = await q.order('updated_at').order('kind').order('id').range(from, from + PAGE - 1);
        if (error) throw error;
        out.push(...(data as PulledItem[]));
        if (data.length < PAGE) return out;
      }
    },
    async push(items) {
      const sb = await getClient();
      const { error } = await sb.from(TABLE).upsert(items.map(i => ({ user_id: uid, ...i })), { onConflict: 'user_id,kind,id' });
      if (error) throw error;
    },
  };
}

function fromSync() {
  if (!sync) return;
  patch({ status: sync.status, error: sync.error, pending: sync.pendingCount, lastSynced: sync.lastSynced });
  clearTimeout(retry);
  if (sync.status === 'offline' || sync.status === 'error') retry = setTimeout(runSync, RETRY_MS);
}

function deviceInfo(uid: string) {
  const device = readLedger(kv, STORAGE_KEY);
  const n = device ? countItems(device) : 0;
  let kept = false;
  try { kept = n > 0 && kv?.getItem(keptKey(uid)) === String(n); } catch { /* storage blocked */ }
  return { deviceItems: n, deviceKept: kept };
}

/** Switches the app to this person's log and starts syncing it. */
function attach(user: { id: string; email?: string | null }) {
  const email = user.email ?? '';
  if (sync && state.user?.id === user.id) {
    if (email !== state.user.email) patch({ user: { id: user.id, email } });
    return;
  }
  if (state.user) detach(false);
  store.switchTo(accountKey(user.id));
  sync = new Sync(store, kv, remoteFor(user.id), user.id);
  sync.subscribe(fromSync);
  store.onLocalChange = keys => {
    sync?.mark(keys);
    clearTimeout(debounce);
    debounce = setTimeout(runSync, 800);
  };
  patch({ user: { id: user.id, email }, ...deviceInfo(user.id) });
  fromSync();
}

/**
 * Back to this device's own log. The account's copy is removed from the device unless it holds
 * changes that haven't reached the server yet; those stay so they can sync at the next sign-in.
 */
function detach(discardUnsynced: boolean) {
  const uid = state.user?.id;
  const keep = !discardUnsynced && !!sync?.pendingCount;
  sync?.stop();
  sync = null;
  store.onLocalChange = null;
  store.switchTo(STORAGE_KEY);
  clearTimeout(debounce);
  clearTimeout(retry);
  if (uid && !keep) {
    try {
      kv?.removeItem(accountKey(uid));
      kv?.removeItem(syncStateKey(uid));
    } catch { /* storage blocked */ }
  }
  patch({ user: null, status: 'idle', error: '', pending: 0, lastSynced: null, deviceItems: 0, deviceKept: false, recovering: false });
}

function runSync() {
  if (!sync) return;
  if (ready) void sync.run();
  // Not ready means the client hasn't loaded or reported the saved session yet; loading it reports it.
  else getClient().catch(() => patch({ status: 'offline' }));
}

/** Reads the saved session without waiting, so a signed-in person never sees the device log flash first. */
function storedUser(): { id: string; email?: string } | null {
  try {
    const s = JSON.parse(kv?.getItem(AUTH_KEY) ?? 'null') as Session | null;
    return s?.user?.id ? s.user : null;
  } catch {
    return null;
  }
}

function linkErrorFromUrl() {
  if (typeof window === 'undefined') return '';
  // Supabase reports a failed link or Google sign-in in the hash or the query string.
  const p = new URLSearchParams(`${window.location.search.slice(1)}&${window.location.hash.slice(1)}`);
  const d = p.get('error_description');
  if (!d) return '';
  window.history.replaceState(null, '', window.location.pathname);
  return p.get('error_code') === 'otp_expired' ? 'That email link has expired or was already used. Sign in, or use "Forgot password?" for a new one.' : d;
}

function onAuth(event: string, session: Session | null) {
  // Supabase asks that nothing awaits its client inside this callback, so the work runs on the next tick.
  setTimeout(() => {
    if (event === 'PASSWORD_RECOVERY') patch({ recovering: true });
    if (session?.user) attach(session.user);
    // Opening the app offline with an expired token reports no session while it's still saved.
    // Stay signed in then; only a real sign-out, or a session Supabase threw away, signs out here.
    else if (state.user && (event === 'SIGNED_OUT' || !storedUser())) detach(false);
    if (event === 'INITIAL_SESSION') ready = true;
    runSync();
  }, 0);
}

if (configured && typeof window !== 'undefined') {
  const saved = storedUser();
  if (saved) attach(saved);
  // Load the client now if someone is signed in or arrived from an email link; otherwise when they open the sheet.
  if (saved || /access_token|error_description/.test(window.location.hash)) void getClient().catch(() => {});
  window.addEventListener('online', runSync);
  // Signing in or out in another tab: load the client here too so it reports the change.
  window.addEventListener('storage', e => { if (e.key === AUTH_KEY) warmUp(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') runSync(); });
  setInterval(() => { if (document.visibilityState === 'visible') runSync(); }, POLL_MS);
}

/* Actions used by the account sheet. Each resolves to an error message, or '' on success. */

const appUrl = () => window.location.origin + window.location.pathname;

function message(e: { code?: string; message?: string; status?: number } | null | undefined): string {
  if (!e) return '';
  switch (e.code) {
    case 'invalid_credentials': return "That email and password don't match an account.";
    case 'user_already_exists':
    case 'email_exists': return 'There is already an account with that email. Sign in instead.';
    case 'signup_disabled': return 'New accounts are turned off for this app. Ask the person who set it up.';
    case 'weak_password': return 'Choose a longer password: at least 8 characters.';
    case 'email_not_confirmed': return 'Confirm your email first, using the link we sent, then sign in.';
    case 'email_address_not_authorized': return "This app can't send email to that address yet. Ask the person who set it up to reset your password.";
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'Too many tries in a short time. Wait a few minutes and try again.';
    case 'same_password': return 'That is already your password. Choose a new one.';
  }
  const m = e.message ?? '';
  if (/fetch|network|load failed/i.test(m)) return "Couldn't reach the server. Check your connection and try again.";
  return m || 'Something went wrong. Try again.';
}

/** Asks the project which sign-in methods are on, so the Google button only shows once Google is set up. */
let providers: Promise<void> | null = null;
function checkProviders() {
  providers ??= fetch(`${URL}/auth/v1/settings`, { headers: { apikey: KEY! } })
    .then(r => r.json())
    .then(j => patch({ google: !!j?.external?.google }))
    .catch(() => { providers = null; });
}

/** Starts loading the client before the person needs it, for example when the account sheet opens. */
export function warmUp() {
  if (!configured) return;
  void getClient().catch(() => {});
  checkProviders();
}

/** Runs an auth call, turning a client that won't load into the usual offline message. */
async function withAuth<T>(fn: (sb: SupabaseClient) => Promise<T>): Promise<T | { error: { message: string } }> {
  try {
    return await fn(await getClient());
  } catch {
    return { error: { message: 'Failed to fetch' } };
  }
}

export async function signIn(email: string, password: string) {
  const { error } = await withAuth(sb => sb.auth.signInWithPassword({ email: email.trim(), password }));
  return message(error);
}

/** Leaves for Google's sign-in page; Google sends the person back here signed in. */
export async function signInWithGoogle() {
  const { error } = await withAuth(sb => sb.auth.signInWithOAuth({
    provider: 'google',
    // Always show Google's account picker, so two people sharing a device each pick their own account.
    options: { redirectTo: appUrl(), queryParams: { prompt: 'select_account' } },
  }));
  return message(error);
}

/** Resolves to 'confirm' when the project requires confirming the email before the first sign-in. */
export async function signUp(email: string, password: string) {
  const res = await withAuth(sb => sb.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: appUrl() } }));
  if (res.error) return message(res.error);
  return 'data' in res && res.data.session ? '' : 'confirm';
}

export async function sendReset(email: string) {
  const { error } = await withAuth(sb => sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl() }));
  return message(error);
}

export async function setPassword(password: string) {
  const { error } = await withAuth(sb => sb.auth.updateUser({ password }));
  if (!error) patch({ recovering: false });
  return message(error);
}

/**
 * Signs out on this device only. Tries to send unsynced changes first; resolves to the number
 * still unsent if that fails, so the sheet can ask before they are dropped.
 */
export async function signOut(discardUnsynced = false): Promise<number> {
  if (sync?.pendingCount && !discardUnsynced) {
    await sync.run();
    if (sync?.pendingCount) return sync.pendingCount;
  }
  detach(true);
  const { error } = await withAuth(sb => sb.auth.signOut({ scope: 'local' }));
  if (error) {
    // Signing out offline fails at the server, so forget the session on this device by hand.
    try { kv?.removeItem(AUTH_KEY); } catch { /* storage blocked */ }
    window.location.reload();
  }
  return 0;
}

export function syncNow() {
  ready = true;
  runSync();
}

/** Moves the entries saved on this device while signed out into the signed-in account. */
export function moveDeviceLog(): number {
  const device = readLedger(kv, STORAGE_KEY);
  if (!device || !state.user) return 0;
  const added = store.importBackup(device) ?? 0;
  try { kv?.removeItem(STORAGE_KEY); } catch { /* storage blocked */ }
  patch({ deviceItems: 0, deviceKept: false });
  return added;
}

/** Leaves the device's signed-out entries where they are and stops offering to move them. */
export function keepDeviceLog() {
  if (!state.user) return;
  try { kv?.setItem(keptKey(state.user.id), String(state.deviceItems)); } catch { /* storage blocked */ }
  patch({ deviceKept: true });
}

export function clearLinkError() {
  patch({ linkError: '' });
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
export const useAccount = () => useSyncExternalStore(subscribe, () => state);
