import { useEffect, useState } from 'react';
import {
  clearLinkError, keepDeviceLog, moveDeviceLog, sendReset, setPassword, signIn, signInWithGoogle, signOut, signUp, syncNow, useAccount, warmUp,
  type AccountState,
} from '../lib/account';
import { fmtDay, fmtTime } from '../lib/format';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';

type Mode = 'in' | 'up' | 'reset';
const MIN_PW = 8;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Close({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
    </button>
  );
}

/** Email and password fields shared by sign-in, sign-up and reset. */
function Credentials({ mode, email, setEmail, pw, setPw }: { mode: Mode; email: string; setEmail: (v: string) => void; pw: string; setPw: (v: string) => void }) {
  return (
    <>
      <label className="field"><span>Email</span>
        <input type="email" id="a-email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      {mode !== 'reset' && (
        <label className="field"><span>Password {mode === 'up' && <small>(at least {MIN_PW} characters)</small>}</span>
          <input type="password" id="a-password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} required minLength={mode === 'up' ? MIN_PW : undefined} value={pw} onChange={e => setPw(e.target.value)} />
        </label>
      )}
    </>
  );
}

function GoogleButton({ onError }: { onError: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="btn ghost block" disabled={busy} onClick={async () => {
      setBusy(true);
      const err = await signInWithGoogle();
      // On success the page is already on its way to Google.
      if (err) { setBusy(false); onError(err); }
    }}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      {busy ? 'Opening Google…' : 'Continue with Google'}
    </button>
  );
}

function SignedOut({ acct, onClose }: { acct: AccountState; onClose: () => void }) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setNote('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr('Enter your email address.');
    if (mode === 'in' && !pw) return setErr('Enter your password.');
    if (mode === 'up' && pw.length < MIN_PW) return setErr(`Choose a password of at least ${MIN_PW} characters.`);
    setBusy(true);
    const res = mode === 'in' ? await signIn(email, pw) : mode === 'up' ? await signUp(email, pw) : await sendReset(email);
    setBusy(false);
    if (res === 'confirm') return setNote(`We sent a confirmation link to ${email.trim()}. Open it on this device, then you're signed in.`);
    if (res) return setErr(res);
    if (mode === 'reset') return setNote(`If ${email.trim()} has an account, a reset link is on its way. Open it on this device.`);
    clearLinkError();
    toast(mode === 'up' ? 'Account created. Your log now syncs.' : 'Signed in. Your log now syncs.');
  };
  const go = (m: Mode) => { setMode(m); setErr(''); setNote(''); };

  return (
    <form className="stack" style={{ gap: 16 }} onSubmit={submit} noValidate>
      <div className="sheet-head">
        <div>
          <h2>{mode === 'reset' ? 'Reset your password' : 'Sync your log'}</h2>
          <p className="small muted" style={{ marginTop: 4 }}>
            {mode === 'reset'
              ? "Enter your account's email and we'll send a link to choose a new password."
              : 'Sign in to keep your log on all your devices. Everyone in your home gets their own account, and each person sees only their own log.'}
          </p>
        </div>
        <Close onClose={onClose} />
      </div>
      {acct.linkError && <div className="alert caution" role="alert"><b>That sign-in didn't work.</b><span>{acct.linkError}</span></div>}
      {acct.google && mode !== 'reset' && (
        <>
          <GoogleButton onError={setErr} />
          <div className="or" aria-hidden="true"><span>or use email</span></div>
        </>
      )}
      {mode !== 'reset' && (
        <div className="seg" role="group" aria-label="Account">
          <button type="button" aria-pressed={mode === 'in'} onClick={() => go('in')}>Sign in</button>
          <button type="button" aria-pressed={mode === 'up'} onClick={() => go('up')}>Create account</button>
        </div>
      )}
      <Credentials mode={mode} email={email} setEmail={setEmail} pw={pw} setPw={setPw} />
      {err && <div className="alert danger" role="alert"><span>{err}</span></div>}
      {note && <div className="alert good" role="status"><span>{note}</span></div>}
      <div className="sheet-foot" style={{ justifyContent: 'space-between' }}>
        {mode === 'in' ? <button type="button" className="btn quiet sm" onClick={() => go('reset')}>Forgot password?</button>
          : mode === 'reset' ? <button type="button" className="btn quiet sm" onClick={() => go('in')}>Back to sign in</button>
          : <span />}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'One moment…' : mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link'}
        </button>
      </div>
      <p className="xsmall muted">
        Signed out, everything stays on this device only. Signed in, your log is stored with the app's database provider (Supabase) so it can sync. Sign out on a shared device to remove your log from it.
      </p>
    </form>
  );
}

function NewPassword({ onDone, onClose, recovering }: { onDone: () => void; onClose: () => void; recovering: boolean }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < MIN_PW) return setErr(`Choose a password of at least ${MIN_PW} characters.`);
    setBusy(true);
    const res = await setPassword(pw);
    setBusy(false);
    if (res) return setErr(res);
    toast('Password changed.');
    onDone();
  };
  return (
    <form className="stack" style={{ gap: 12 }} onSubmit={submit} noValidate>
      {recovering && (
        <div className="sheet-head">
          <div><h2>Choose a new password</h2><p className="small muted" style={{ marginTop: 4 }}>You're signed in from the reset link. Pick a new password to finish.</p></div>
          <Close onClose={onClose} />
        </div>
      )}
      <label className="field"><span>New password <small>(at least {MIN_PW} characters)</small></span>
        <input type="password" id="a-newpw" autoComplete="new-password" minLength={MIN_PW} value={pw} onChange={e => setPw(e.target.value)} />
      </label>
      {err && <div className="alert danger" role="alert"><span>{err}</span></div>}
      <div className="row-wrap">
        <button type="submit" className="btn sm" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
        {!recovering && <button type="button" className="btn quiet sm" onClick={onDone}>Cancel</button>}
      </div>
    </form>
  );
}

/** Offers to move entries saved while signed out into the account. Shown here and on Today until handled. */
export function DeviceLogPrompt({ onToday = false }: { onToday?: boolean }) {
  const toast = useToast();
  const acct = useAccount();
  if (!acct.user || !acct.deviceItems || (onToday && acct.deviceKept)) return null;
  return (
    <div className="alert info">
      <b>{plural(acct.deviceItems, 'entry', 'entries')} saved on this device before you signed in</b>
      <span>Move them into your account so they sync with the rest of your log. If you leave them here, you'll only see them when you're signed out.</span>
      <div className="row-wrap" style={{ marginTop: 6 }}>
        <button className="btn sm" onClick={() => { const n = moveDeviceLog(); toast(`Moved ${plural(n, 'entry', 'entries')} into your account.`); }}>Move into my account</button>
        {!acct.deviceKept && <button className="btn quiet sm" onClick={keepDeviceLog}>Leave on this device</button>}
      </div>
    </div>
  );
}

const STATUS: Record<AccountState['status'], string> = {
  idle: 'Connecting…',
  syncing: 'Syncing…',
  synced: 'Up to date',
  offline: "Offline. Changes are saved here and will sync when you're back online.",
  error: "Couldn't sync.",
};

function SignedIn({ acct, onClose }: { acct: AccountState; onClose: () => void }) {
  const toast = useToast();
  const [changing, setChanging] = useState(false);
  const [unsent, setUnsent] = useState(0);
  const [busy, setBusy] = useState(false);
  const last = acct.lastSynced ? new Date(acct.lastSynced) : null;

  const out = async (discard = false) => {
    setBusy(true);
    const left = await signOut(discard);
    setBusy(false);
    if (left) return setUnsent(left);
    toast('Signed out. Your log was removed from this device.');
    onClose();
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="sheet-head">
        <div><h2>Your account</h2><p className="small muted" style={{ marginTop: 4, overflowWrap: 'anywhere' }}>{acct.user!.email}</p></div>
        <Close onClose={onClose} />
      </div>

      <DeviceLogPrompt />

      <section className="tile" aria-label="Sync">
        <div className="spread">
          <h3>Sync</h3>
          <span className="chip sync-chip" data-s={acct.status}><i className="dot" />{acct.status === 'synced' ? 'Synced' : acct.status === 'offline' ? 'Offline' : acct.status === 'error' ? 'Sync issue' : 'Syncing'}</span>
        </div>
        <p className="small">{STATUS[acct.status]}{acct.status === 'error' && acct.error ? ` ${acct.error}` : ''}</p>
        <p className="small muted">
          {acct.pending ? `${plural(acct.pending, 'change')} waiting to send. ` : ''}
          {last ? `Last synced ${fmtDay(last)}, ${fmtTime(last)}.` : 'Not synced yet.'}
        </p>
        <div><button className="btn ghost sm" onClick={syncNow} disabled={acct.status === 'syncing'}>Sync now</button></div>
      </section>

      <section className="tile" aria-label="Password">
        {changing ? <NewPassword recovering={false} onDone={() => setChanging(false)} onClose={onClose} /> : (
          <div className="spread" style={{ alignItems: 'center' }}>
            <h3>Password</h3>
            <button className="btn quiet sm" onClick={() => setChanging(true)}>Change password</button>
          </div>
        )}
      </section>

      {unsent > 0 ? (
        <div className="alert caution" role="alert">
          <b>{unsent === 1 ? "1 change hasn't" : `${unsent} changes haven't`} synced yet.</b>
          <span>Signing out now removes them from this device for good. Stay signed in until you're back online to keep them.</span>
          <div className="row-wrap" style={{ marginTop: 6 }}>
            <button className="btn danger sm" disabled={busy} onClick={() => out(true)}>Sign out anyway</button>
            <button className="btn quiet sm" onClick={() => setUnsent(0)}>Stay signed in</button>
          </div>
        </div>
      ) : (
        <div className="spread" style={{ alignItems: 'center', flexWrap: 'nowrap', padding: '0 4px' }}>
          <span className="xsmall muted">Signing out removes your log from this device. It stays safe in your account.</span>
          <button className="btn ghost" disabled={busy} onClick={() => out()}>{busy ? 'Signing out…' : 'Sign out'}</button>
        </div>
      )}
    </div>
  );
}

export function AccountSheet({ onClose }: { onClose: () => void }) {
  const acct = useAccount();
  useEffect(warmUp, []);
  return (
    <Sheet onClose={onClose} label="Account">
      {acct.user && acct.recovering ? <NewPassword recovering onDone={onClose} onClose={onClose} />
        : acct.user ? <SignedIn acct={acct} onClose={onClose} />
        : <SignedOut acct={acct} onClose={onClose} />}
    </Sheet>
  );
}
