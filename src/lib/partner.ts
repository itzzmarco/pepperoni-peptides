import { useEffect, useSyncExternalStore } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Checkin, Ledger } from './types';
import { kv, normalize } from './store';
import { configured, currentUserId, getClient, partnersKey, useAccount } from './account';

/**
 * Partners: two accounts linked with an invite code can each read the other's log. Reading is all:
 * the server's row-level security lets only the owner add, change or delete entries. The partner's
 * log is fetched whole when a screen needs it (at most once a minute) and kept on this device so it
 * still shows offline. Signing out removes that copy.
 */

export interface Partner {
  id: string;
  /** Their Google name, or their email if they have none. */
  name: string;
  since: string;
}

export interface PartnerState {
  uid: string | null;
  partners: Partner[];
  logs: Record<string, Ledger>;
  fetchedAt: number;
  loading: boolean;
  error: string;
}

const emptyLedger = (): Ledger => ({ version: 1, regimens: [], doses: [], checkins: [] });
const EMPTY: PartnerState = { uid: null, partners: [], logs: {}, fetchedAt: 0, loading: false, error: '' };
const REFRESH_MS = 60_000;
const PAGE = 1000;

interface Row { kind: string; id: string; data: unknown; deleted: boolean }
const LIST = { regimen: 'regimens', dose: 'doses', checkin: 'checkins' } as const;

/** Turns a partner's rows from the server into a log, leaving out deleted items. */
export function rowsToLedger(rows: Row[]): Ledger {
  const lists = { regimens: [] as unknown[], doses: [] as unknown[], checkins: [] as unknown[] };
  for (const r of rows) {
    const k = LIST[r.kind as keyof typeof LIST];
    if (!k || r.deleted || !r.data || typeof r.data !== 'object' || (r.data as { id?: unknown }).id !== r.id) continue;
    lists[k].push(r.data);
  }
  return normalize(lists) ?? emptyLedger();
}

/** What to call a partner day to day: the first word of their name, or the start of their email. */
export function firstName(name: string): string {
  const n = name.trim();
  if (!n) return 'Your partner';
  if (n.includes('@')) {
    const w = n.split('@')[0].split(/[._+-]/)[0];
    return w ? w[0].toUpperCase() + w.slice(1) : n;
  }
  return n.split(/\s+/)[0];
}

/** An invite code as typed: letters and digits only, upper case, at most 6. */
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
/** An invite code in two halves, easy to read out: K7Q 4MX. */
export const showCode = (c: string) => (c.length === 6 ? `${c.slice(0, 3)} ${c.slice(3)}` : c);

/** Turns a server or network error into something a person can act on. */
export function partnerError(e: unknown): string {
  const err = (e ?? {}) as { code?: string; message?: string };
  const m = err.message ?? String(e ?? '');
  // The database step from the pull request hasn't been run: the table or functions don't exist yet.
  if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(err.code ?? '') || /could not find the (function|table)|does not exist/i.test(m)) {
    return "Partner linking isn't set up on the server yet. The partner step needs to be run in Supabase first.";
  }
  if (/fetch|network|load failed/i.test(m)) return "Couldn't reach the server. Check your connection and try again.";
  return m || 'Something went wrong. Try again.';
}

let state: PartnerState = EMPTY;
const listeners = new Set<() => void>();
function set(p: Partial<PartnerState>) {
  state = { ...state, ...p };
  listeners.forEach(l => l());
}

function fromCache(uid: string): PartnerState {
  try {
    const raw = kv?.getItem(partnersKey(uid));
    if (raw) {
      const c = JSON.parse(raw) as { partners?: Partner[]; logs?: Record<string, unknown> };
      const logs = Object.fromEntries(Object.entries(c.logs ?? {}).map(([k, v]) => [k, normalize(v) ?? emptyLedger()]));
      return { ...EMPTY, uid, partners: Array.isArray(c.partners) ? c.partners : [], logs };
    }
  } catch { /* unreadable cache: fetch fresh */ }
  return { ...EMPTY, uid };
}

function toCache() {
  if (!state.uid) return;
  try { kv?.setItem(partnersKey(state.uid), JSON.stringify({ partners: state.partners, logs: state.logs })); } catch { /* storage full or blocked */ }
}

async function pullLog(sb: SupabaseClient, partnerId: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from('ledger_items').select('kind,id,data,deleted').eq('user_id', partnerId)
      .order('kind').order('id').range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data as Row[]));
    if (data.length < PAGE) return out;
  }
}

let inflight: Promise<void> | null = null;

/** Fetches the partner list and each partner's log. Skipped if done in the last minute, unless forced. */
export function refreshPartners(force = false): Promise<void> {
  const uid = currentUserId();
  if (!configured || !uid) return Promise.resolve();
  if (state.uid !== uid) set(fromCache(uid));
  if (inflight) return inflight;
  if (!force && Date.now() - state.fetchedAt < REFRESH_MS) return Promise.resolve();
  set({ loading: true });
  inflight = (async () => {
    try {
      const sb = await getClient();
      const { data, error } = await sb.from('partners').select('partner_id,partner_name,created_at').order('created_at');
      if (error) throw error;
      const partners: Partner[] = (data as { partner_id: string; partner_name: string; created_at: string }[])
        .map(r => ({ id: r.partner_id, name: r.partner_name, since: r.created_at }));
      const logs: Record<string, Ledger> = {};
      for (const p of partners) logs[p.id] = rowsToLedger(await pullLog(sb, p.id));
      if (currentUserId() !== uid) return;
      set({ partners, logs, fetchedAt: Date.now(), loading: false, error: '' });
      toCache();
    } catch (e) {
      if (currentUserId() === uid) set({ loading: false, error: partnerError(e), fetchedAt: Date.now() });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Makes an invite code for the partner to enter. Replaces any earlier code. */
export async function createInvite(): Promise<{ code?: string; error?: string }> {
  try {
    const sb = await getClient();
    const { data, error } = await sb.rpc('create_partner_invite');
    if (error) throw error;
    return { code: String(data) };
  } catch (e) {
    return { error: partnerError(e) };
  }
}

/** Links with whoever made `code`. Resolves to their name. */
export async function acceptInvite(code: string): Promise<{ name?: string; error?: string }> {
  try {
    const sb = await getClient();
    // Answers {name} or {error}. A wrong code is an answer, not a failure, so the server can count it.
    const { data, error } = await sb.rpc('link_partner', { invite_code: cleanCode(code) });
    if (error) throw error;
    const res = (data ?? {}) as { name?: string; error?: string };
    if (res.error) return { error: res.error };
    await refreshPartners(true);
    return { name: String(res.name ?? '') };
  } catch (e) {
    return { error: partnerError(e) };
  }
}

/** Ends the link for both people. Resolves to an error message, or '' on success. */
export async function unlinkPartner(id: string): Promise<string> {
  try {
    const sb = await getClient();
    const { error } = await sb.rpc('unlink_partner', { partner: id });
    if (error) throw error;
    const logs = { ...state.logs };
    delete logs[id];
    set({ partners: state.partners.filter(p => p.id !== id), logs });
    toCache();
    return '';
  } catch (e) {
    return partnerError(e);
  }
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

/** Partner list and logs for the signed-in person, fetched when a screen using it opens. */
export function usePartners(): PartnerState {
  const uid = useAccount().user?.id ?? null;
  const s = useSyncExternalStore(subscribe, () => state);
  useEffect(() => { if (uid) void refreshPartners(); }, [uid]);
  return uid && s.uid === uid ? s : EMPTY;
}

/* Weight helpers shared by Today and the partner screen. */

const LB_PER_KG = 2.20462;
export const convertWeight = (w: number, from = 'lb', to = 'lb') =>
  from === to ? w : from === 'kg' && to === 'lb' ? w * LB_PER_KG : from === 'lb' && to === 'kg' ? w / LB_PER_KG : w;

/** Weigh-ins on or after `since`, oldest first, in `unit`. */
export function weighIns(checkins: Checkin[], unit: string, since = 0) {
  return checkins
    .filter(c => c.weight && c.weight > 0 && new Date(c.at).getTime() >= since)
    .map(c => ({ at: new Date(c.at), w: convertWeight(c.weight!, c.weightUnit ?? unit, unit) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** First and latest weigh-in on or after `since`, and the change between them. */
export function weightChange(checkins: Checkin[], unit: string, since = 0) {
  const w = weighIns(checkins, unit, since);
  if (!w.length) return null;
  const first = w[0], last = w[w.length - 1];
  return { first, last, change: last.w - first.w, count: w.length };
}
