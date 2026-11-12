import { Icon } from './Icon';
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
        <Icon name="account" size={18} />
        <span className="hide-sm">On this device ·&nbsp;</span>Sign in
      </button>
    );
  }
  const pending = acct.pending ? `, ${acct.pending} waiting to send` : '';
  return (
    <button className="sync" data-s={acct.status} onClick={onOpen} aria-label={`Account: ${acct.user.email}. ${LABEL[acct.status]}${pending}`} title={`${acct.user.email} · ${LABEL[acct.status]}${pending}`}>
      <i />{LABEL[acct.status]}
    </button>
  );
}
