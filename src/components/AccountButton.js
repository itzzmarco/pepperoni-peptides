import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAccount } from '../lib/account';
const LABEL = { idle: 'Signed in', syncing: 'Syncing', synced: 'Synced', offline: 'Offline', error: 'Sync issue' };
/** Top-bar pill: where the log is saved, and the way into the account sheet. */
export function AccountButton({ onOpen }) {
    const acct = useAccount();
    if (!acct.configured) {
        return (_jsxs("span", { className: "sync", title: "Your log is saved only in this browser. Nothing is sent to a server.", children: [_jsx("i", {}), _jsx("span", { className: "hide-sm", children: "Saved on this device" }), _jsx("span", { className: "show-sm", children: "On device" })] }));
    }
    if (!acct.user) {
        return (_jsxs("button", { className: "sync", onClick: onOpen, title: "Your log is saved only on this device. Sign in to sync it across your devices.", children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" })] }), _jsx("span", { className: "hide-sm", children: "On this device \u00B7\u00A0" }), "Sign in"] }));
    }
    const pending = acct.pending ? `, ${acct.pending} waiting to send` : '';
    // The word shows on phones too, since a dot colour alone can't tell Synced from Syncing. Only below 360px, where the
    // wordmark would be cut, the pill drops to its dot; the word stays in the accessible name and the tooltip.
    return (_jsxs("button", { className: "sync", "data-s": acct.status, onClick: onOpen, "aria-label": `Account: ${acct.user.email}. ${LABEL[acct.status]}${pending}`, title: `${acct.user.email} · ${LABEL[acct.status]}${pending}`, children: [_jsx("i", {}), _jsx("span", { children: LABEL[acct.status] })] }));
}
