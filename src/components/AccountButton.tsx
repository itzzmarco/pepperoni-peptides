import { useAccount } from '../lib/account';

const LABEL = { idle: 'Signed in', syncing: 'Syncing', synced: 'Synced', offline: 'Offline', error: 'Sync issue' } as const;

/** Top-bar pill: where the log is saved, and the way into the account sheet. */
export function AccountButton({ onOpen }: { onOpen: () => void }) {
  const acct = useAccount();
  if (!acct.configured) {
    return (
      <span className="sync" title="Your log is saved only in this browser. Nothing is sent to a server.">
        <i /><span className="hide-sm">Saved on this device</span><span className="show-sm">On device</span>
      </span>
    );
  }
  if (!acct.user) {
    return (
      <button className="sync" onClick={onOpen} title="Your log is saved only on this device. Sign in to sync it across your devices.">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
        <span className="hide-sm">On this device ·&nbsp;</span>Sign in
      </button>
    );
  }
  const pending = acct.pending ? `, ${acct.pending} waiting to send` : '';
  // Offline and sync issue keep their word on phones too: a dot colour alone doesn't say what's wrong.
  const warn = acct.status === 'offline' || acct.status === 'error';
  return (
    <button className="sync" data-s={acct.status} onClick={onOpen} aria-label={`Account: ${acct.user.email}. ${LABEL[acct.status]}${pending}`} title={`${acct.user.email} · ${LABEL[acct.status]}${pending}`}>
      {/* At phone width a healthy pill is an icon button (person and status dot), so the wordmark keeps its line; the label stays in aria-label. */}
      {!warn && <svg className="show-sm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>}
      <i /><span className={warn ? undefined : 'hide-sm'}>{LABEL[acct.status]}</span>
    </button>
  );
}
