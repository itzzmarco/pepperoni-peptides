import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { clearLinkError, inAppBrowser, keepDeviceLog, moveDeviceLog, sendReset, setPassword, signIn, signInWithGoogle, signOut, signUp, syncNow, useAccount, warmUp, } from '../lib/account';
import { fmtDay, fmtShort, fmtTime } from '../lib/format';
import { acceptInvite, cleanCode, createInvite, firstName, refreshPartners, showCode, unlinkPartner, usePartners } from '../lib/partner';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
const MIN_PW = 8;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
function Close({ onClose }) {
    return (_jsx("button", { type: "button", className: "icon-btn", onClick: onClose, "aria-label": "Close", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }) }) }));
}
/** Email and password fields shared by sign-in, sign-up and reset. */
function Credentials({ mode, email, setEmail, pw, setPw }) {
    return (_jsxs(_Fragment, { children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Email" }), _jsx("input", { type: "email", id: "a-email", autoComplete: "email", inputMode: "email", autoCapitalize: "none", spellCheck: false, required: true, value: email, onChange: e => setEmail(e.target.value) })] }), mode !== 'reset' && (_jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Password ", mode === 'up' && _jsxs("small", { children: ["(at least ", MIN_PW, " characters)"] })] }), _jsx("input", { type: "password", id: "a-password", autoComplete: mode === 'up' ? 'new-password' : 'current-password', required: true, minLength: mode === 'up' ? MIN_PW : undefined, value: pw, onChange: e => setPw(e.target.value) })] }))] }));
}
function GoogleButton({ onError }) {
    const [busy, setBusy] = useState(false);
    return (_jsxs("button", { type: "button", className: "btn ghost block", disabled: busy, onClick: async () => {
            setBusy(true);
            const err = await signInWithGoogle();
            // On success the page is already on its way to Google.
            if (err) {
                setBusy(false);
                onError(err);
            }
        }, children: [_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 48 48", "aria-hidden": "true", children: [_jsx("path", { fill: "#EA4335", d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" }), _jsx("path", { fill: "#4285F4", d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" }), _jsx("path", { fill: "#FBBC05", d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" }), _jsx("path", { fill: "#34A853", d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" })] }), busy ? 'Opening Google…' : 'Continue with Google'] }));
}
function SignedOut({ acct, onClose }) {
    const toast = useToast();
    const [mode, setMode] = useState('in');
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [err, setErr] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        setNote('');
        if (!/^\S+@\S+\.\S+$/.test(email.trim()))
            return setErr('Enter your email address.');
        if (mode === 'in' && !pw)
            return setErr('Enter your password.');
        if (mode === 'up' && pw.length < MIN_PW)
            return setErr(`Choose a password of at least ${MIN_PW} characters.`);
        setBusy(true);
        const res = mode === 'in' ? await signIn(email, pw) : mode === 'up' ? await signUp(email, pw) : await sendReset(email);
        setBusy(false);
        if (res === 'confirm')
            return setNote(`We sent a confirmation link to ${email.trim()}. Open it on this device, then you're signed in.`);
        if (res)
            return setErr(res);
        if (mode === 'reset')
            return setNote(`If ${email.trim()} has an account, a reset link is on its way. Open it on this device.`);
        clearLinkError();
        toast(mode === 'up' ? 'Account created. Your log now syncs.' : 'Signed in. Your log now syncs.');
    };
    const go = (m) => { setMode(m); setErr(''); setNote(''); };
    return (_jsxs("form", { className: "stack gap-4", onSubmit: submit, noValidate: true, children: [_jsxs("div", { className: "sheet-head", children: [_jsxs("div", { children: [_jsx("h2", { children: mode === 'reset' ? 'Reset your password' : 'Sync your log' }), _jsx("p", { className: "small muted mt-1", children: mode === 'reset'
                                    ? "Enter your account's email and we'll send a link to choose a new password."
                                    : 'Sign in to keep your log on all your devices. Everyone in your home gets their own account, and each person sees only their own log.' })] }), _jsx(Close, { onClose: onClose })] }), acct.linkError && _jsxs("div", { className: "alert caution", role: "alert", children: [_jsx("b", { children: "That sign-in didn't work." }), _jsx("span", { children: acct.linkError })] }), inAppBrowser() && mode !== 'reset' && (_jsxs("div", { className: "alert caution", role: "note", children: [_jsx("b", { children: "Open this page in Chrome or Samsung Internet first." }), _jsx("span", { children: "It's open inside another app's built-in browser, where Google won't sign you in and your log may not be kept. Tap the menu (\u22EE or \u00B7\u00B7\u00B7) and choose Open in browser." })] })), acct.google && mode !== 'reset' && (_jsxs(_Fragment, { children: [_jsx(GoogleButton, { onError: setErr }), _jsx("div", { className: "or", "aria-hidden": "true", children: _jsx("span", { children: "or use email" }) })] })), mode !== 'reset' && (_jsxs("div", { className: "seg", role: "group", "aria-label": "Account", children: [_jsx("button", { type: "button", "aria-pressed": mode === 'in', onClick: () => go('in'), children: "Sign in" }), _jsx("button", { type: "button", "aria-pressed": mode === 'up', onClick: () => go('up'), children: "Create account" })] })), _jsx(Credentials, { mode: mode, email: email, setEmail: setEmail, pw: pw, setPw: setPw }), err && _jsx("div", { className: "alert danger", role: "alert", children: _jsx("span", { children: err }) }), note && _jsx("div", { className: "alert good", role: "status", children: _jsx("span", { children: note }) }), _jsxs("div", { className: "sheet-foot", style: { justifyContent: 'space-between' }, children: [mode === 'in' ? _jsx("button", { type: "button", className: "btn quiet sm", onClick: () => go('reset'), children: "Forgot password?" })
                        : mode === 'reset' ? _jsx("button", { type: "button", className: "btn quiet sm", onClick: () => go('in'), children: "Back to sign in" })
                            : _jsx("span", {}), _jsx("button", { type: "submit", className: "btn", disabled: busy, children: busy ? 'One moment…' : mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link' })] }), _jsx("p", { className: "xsmall muted", children: "Signed out, everything stays on this device only. Signed in, your log is stored with the app's database provider (Supabase) so it can sync. Sign out on a shared device to remove your log from it." })] }));
}
function NewPassword({ onDone, onClose, recovering }) {
    const toast = useToast();
    const [pw, setPw] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        if (pw.length < MIN_PW)
            return setErr(`Choose a password of at least ${MIN_PW} characters.`);
        setBusy(true);
        const res = await setPassword(pw);
        setBusy(false);
        if (res)
            return setErr(res);
        toast('Password changed.');
        onDone();
    };
    return (_jsxs("form", { className: "stack gap-3", onSubmit: submit, noValidate: true, children: [recovering && (_jsxs("div", { className: "sheet-head", children: [_jsxs("div", { children: [_jsx("h2", { children: "Choose a new password" }), _jsx("p", { className: "small muted mt-1", children: "You're signed in from the reset link. Pick a new password to finish." })] }), _jsx(Close, { onClose: onClose })] })), _jsxs("label", { className: "field", children: [_jsxs("span", { children: ["New password ", _jsxs("small", { children: ["(at least ", MIN_PW, " characters)"] })] }), _jsx("input", { type: "password", id: "a-newpw", autoComplete: "new-password", minLength: MIN_PW, value: pw, onChange: e => setPw(e.target.value) })] }), err && _jsx("div", { className: "alert danger", role: "alert", children: _jsx("span", { children: err }) }), _jsxs("div", { className: "row-wrap", children: [_jsx("button", { type: "submit", className: "btn sm", disabled: busy, children: busy ? 'Saving…' : 'Save password' }), !recovering && _jsx("button", { type: "button", className: "btn quiet sm", onClick: onDone, children: "Cancel" })] })] }));
}
/** Offers to move entries saved while signed out into the account. Shown here and on Today until handled. */
export function DeviceLogPrompt({ onToday = false }) {
    const toast = useToast();
    const acct = useAccount();
    if (!acct.user || !acct.deviceItems || (onToday && acct.deviceKept))
        return null;
    return (_jsxs("div", { className: "alert info", children: [_jsxs("b", { children: [plural(acct.deviceItems, 'entry', 'entries'), " saved on this device before you signed in"] }), _jsx("span", { children: "Move them into your account so they sync with the rest of your log. A peptide your account already tracks isn't added twice; its doses join the one you have. If you leave them here, you'll only see them when you're signed out." }), _jsxs("div", { className: "row-wrap mt-2", children: [_jsx("button", { className: "btn sm", onClick: () => { const n = moveDeviceLog(); toast(`Moved ${plural(n, 'entry', 'entries')} into your account.`); }, children: "Move into my account" }), !acct.deviceKept && _jsx("button", { className: "btn quiet sm", onClick: keepDeviceLog, children: "Leave on this device" })] })] }));
}
/**
 * Link with a partner so each of you can see the other's log. One person makes a code, the other
 * enters it. While a code is showing, the list refreshes every few seconds to catch the link.
 */
function PartnerSection({ onClose }) {
    const toast = useToast();
    const { partners, error } = usePartners();
    const [mode, setMode] = useState('idle');
    const [code, setCode] = useState('');
    const [typed, setTyped] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [armed, setArmed] = useState('');
    // Waiting for the partner to enter the code: check for the new link every 5 seconds.
    useEffect(() => {
        if (mode !== 'code' || !code)
            return;
        const t = setInterval(() => void refreshPartners(true), 5000);
        return () => clearInterval(t);
    }, [mode, code]);
    const linkedCount = partners.length;
    const [seen, setSeen] = useState(linkedCount);
    useEffect(() => {
        if (mode === 'code' && linkedCount > seen) {
            toast(`Linked with ${firstName(partners[partners.length - 1].name)}.`);
            setMode('idle');
            setCode('');
        }
        setSeen(linkedCount);
    }, [linkedCount]); // eslint-disable-line react-hooks/exhaustive-deps
    const makeCode = async () => {
        setBusy(true);
        setErr('');
        const r = await createInvite();
        setBusy(false);
        if (r.error)
            return setErr(r.error);
        setCode(r.code);
        setMode('code');
    };
    const enter = async (e) => {
        e.preventDefault();
        if (cleanCode(typed).length !== 6)
            return setErr('Codes have 6 letters and numbers.');
        setBusy(true);
        setErr('');
        const r = await acceptInvite(typed);
        setBusy(false);
        if (r.error)
            return setErr(r.error);
        toast(`Linked with ${firstName(r.name ?? '')}. You can each see the other's progress now.`);
        setTyped('');
        setMode('idle');
    };
    const unlink = async (id) => {
        setBusy(true);
        const msg = await unlinkPartner(id);
        setBusy(false);
        setArmed('');
        toast(msg || 'Unlinked. Neither of you can see the other\u2019s log now.');
    };
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            toast('Code copied.');
        }
        catch {
            toast(`Your code is ${showCode(code)}.`);
        }
    };
    return (_jsxs("section", { className: "tile", "aria-labelledby": "partner-h", children: [_jsxs("div", { className: "spread", children: [_jsx("h3", { id: "partner-h", children: "Partner" }), linkedCount > 0 && _jsx("span", { className: "chip", children: "View only" })] }), partners.map(p => (_jsxs("div", { className: "partner-row", children: [_jsx("span", { className: "avatar", "aria-hidden": "true", children: firstName(p.name)[0] }), _jsxs("div", { className: "stack", style: { gap: 0, minWidth: 0 }, children: [_jsx("b", { style: { overflowWrap: 'anywhere' }, children: p.name || 'Your partner' }), _jsxs("span", { className: "xsmall muted", children: ["Linked ", fmtShort(new Date(p.since))] })] }), _jsxs("div", { className: "row-wrap", style: { justifyContent: 'flex-end' }, children: [_jsx("a", { className: "btn soft sm", href: "#partner", onClick: onClose, children: "See progress" }), armed === p.id
                                ? _jsx("button", { className: "btn danger sm", disabled: busy, onClick: () => unlink(p.id), children: "Unlink for both" })
                                : _jsx("button", { className: "btn quiet sm", onClick: () => setArmed(p.id), children: "Unlink" })] })] }, p.id))), _jsx("p", { className: "small muted", children: linkedCount
                    ? 'You can each see the other\u2019s whole log: doses, weights, check-ins and notes. Neither of you can change the other\u2019s.'
                    : 'Link with your partner to see each other\u2019s progress. They\u2019ll see your whole log (doses, weights, check-ins and notes) and you\u2019ll see theirs. Neither of you can change the other\u2019s.' }), mode === 'code' && code ? (_jsxs("div", { className: "inset stack gap-2", children: [_jsx("span", { className: "xsmall muted", children: "Your code" }), _jsx("button", { type: "button", className: "code", onClick: copy, "aria-label": `Your code is ${code.split('').join(' ')}. Tap to copy.`, children: showCode(code) }), _jsxs("p", { className: "small", children: ["On your partner's phone: sign in to Peptide Ledger, open the account menu, tap ", _jsx("b", { children: "Enter a code" }), " and type this in. It works once and lasts 2 days."] }), _jsx("p", { className: "xsmall muted", role: "status", children: "Waiting for them to enter it\u2026" }), _jsx("div", { children: _jsx("button", { className: "btn quiet sm", onClick: () => { setMode('idle'); setCode(''); }, children: "Done" }) })] })) : mode === 'enter' ? (_jsxs("form", { className: "stack gap-2", onSubmit: enter, noValidate: true, children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Code from your partner" }), _jsx("input", { type: "text", id: "p-code", className: "code-input", inputMode: "text", autoCapitalize: "characters", autoComplete: "one-time-code", spellCheck: false, maxLength: 7, placeholder: "K7Q 4MX", value: typed, onChange: e => setTyped(e.target.value), autoFocus: true })] }), _jsxs("div", { className: "row-wrap", children: [_jsx("button", { type: "submit", className: "btn sm", disabled: busy, children: busy ? 'Linking…' : 'Link' }), _jsx("button", { type: "button", className: "btn quiet sm", onClick: () => { setMode('idle'); setErr(''); }, children: "Cancel" })] })] })) : linkedCount ? null : (_jsxs("div", { className: "row-wrap", children: [_jsx("button", { className: "btn ghost sm", disabled: busy, onClick: makeCode, children: busy ? 'Making a code…' : 'Get a code to share' }), _jsx("button", { className: "btn quiet sm", onClick: () => { setMode('enter'); setErr(''); }, children: "Enter a code" })] })), (err || error) && _jsx("p", { className: "small", role: "alert", style: { color: 'var(--danger)' }, children: err || error })] }));
}
const STATUS = {
    idle: 'Connecting…',
    syncing: 'Syncing…',
    synced: 'Up to date',
    offline: "Offline. Changes are saved here and will sync when you're back online.",
    error: "Couldn't sync.",
};
function SignedIn({ acct, onClose }) {
    const toast = useToast();
    const [changing, setChanging] = useState(false);
    const [unsent, setUnsent] = useState(0);
    const [busy, setBusy] = useState(false);
    const last = acct.lastSynced ? new Date(acct.lastSynced) : null;
    const out = async (discard = false) => {
        setBusy(true);
        const left = await signOut(discard);
        setBusy(false);
        if (left)
            return setUnsent(left);
        toast('Signed out. Your log was removed from this device.');
        onClose();
    };
    return (_jsxs("div", { className: "stack gap-4", children: [_jsxs("div", { className: "sheet-head", children: [_jsxs("div", { children: [_jsx("h2", { children: "Your account" }), _jsx("p", { className: "small muted mt-1", style: { overflowWrap: 'anywhere' }, children: acct.user.email })] }), _jsx(Close, { onClose: onClose })] }), _jsx(DeviceLogPrompt, {}), _jsxs("section", { className: "tile", "aria-label": "Sync", children: [_jsxs("div", { className: "spread", children: [_jsx("h3", { children: "Sync" }), _jsxs("span", { className: "chip sync-chip", "data-s": acct.status, children: [_jsx("i", { className: "dot" }), acct.status === 'synced' ? 'Synced' : acct.status === 'offline' ? 'Offline' : acct.status === 'error' ? 'Sync issue' : 'Syncing'] })] }), _jsxs("p", { className: "small", children: [STATUS[acct.status], acct.status === 'error' && acct.error ? ` ${acct.error}` : ''] }), _jsxs("p", { className: "small muted", children: [acct.pending ? `${plural(acct.pending, 'change')} waiting to send. ` : '', last ? `Last synced ${fmtDay(last)}, ${fmtTime(last)}.` : 'Not synced yet.'] }), _jsx("div", { children: _jsx("button", { className: "btn ghost sm", onClick: syncNow, disabled: acct.status === 'syncing', children: "Sync now" }) })] }), _jsx(PartnerSection, { onClose: onClose }), _jsx("section", { className: "tile", "aria-label": "Password", children: changing ? _jsx(NewPassword, { recovering: false, onDone: () => setChanging(false), onClose: onClose }) : (_jsxs("div", { className: "spread mid", children: [_jsx("h3", { children: "Password" }), _jsx("button", { className: "btn quiet sm", onClick: () => setChanging(true), children: "Change password" })] })) }), unsent > 0 ? (_jsxs("div", { className: "alert caution", role: "alert", children: [_jsxs("b", { children: [unsent === 1 ? "1 change hasn't" : `${unsent} changes haven't`, " synced yet."] }), _jsx("span", { children: "Signing out now removes them from this device for good. Stay signed in until you're back online to keep them." }), _jsxs("div", { className: "row-wrap mt-2", children: [_jsx("button", { className: "btn danger sm", disabled: busy, onClick: () => out(true), children: "Sign out anyway" }), _jsx("button", { className: "btn quiet sm", onClick: () => setUnsent(0), children: "Stay signed in" })] })] })) : (_jsxs("div", { className: "spread", style: { alignItems: 'center', flexWrap: 'nowrap', padding: '0 4px' }, children: [_jsx("span", { className: "xsmall muted", children: "Signing out removes your log from this device. It stays safe in your account." }), _jsx("button", { className: "btn ghost", disabled: busy, onClick: () => out(), children: busy ? 'Signing out…' : 'Sign out' })] }))] }));
}
export function AccountSheet({ onClose }) {
    const acct = useAccount();
    useEffect(warmUp, []);
    return (_jsx(Sheet, { onClose: onClose, label: "Account", children: acct.user && acct.recovering ? _jsx(NewPassword, { recovering: true, onDone: onClose, onClose: onClose })
            : acct.user ? _jsx(SignedIn, { acct: acct, onClose: onClose })
                : _jsx(SignedOut, { acct: acct, onClose: onClose }) }));
}
