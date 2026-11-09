import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { store, useLedger } from '../lib/store';
import { configured, useAccount } from '../lib/account';
import { adherenceDays, freqText, regimenStatus } from '../lib/schedule';
import { firstReminder, googleLink, icsFile, rrule, timesPerDay } from '../lib/calendar';
import { download } from '../lib/download';
import { drugAmount, isVolumeUnit } from '../lib/doseMath';
import { checkRegimen } from '../lib/vial';
import { fmtDay, fmtNum } from '../lib/format';
import { glp1Overlap, usualMinutes } from '../lib/insights';
import { PEP } from '../data/peptides';
import { UNREGULATED_SOURCE } from '../data/options';
import { LegalChip, TierChip } from '../components/Chips';
import { useToast } from '../components/Toast';
import { IlloShelf } from '../components/Illustration';
import { NextShot } from '../components/NextShot';
export const regName = (r) => PEP[r.compoundId]?.name ?? (r.name || 'Unnamed');
export function Strip({ rid, doses }) {
    const days = adherenceDays(rid, doses);
    const count = days.filter(d => d.on).length;
    return (_jsxs("div", { className: "stack gap-2", children: [_jsx("div", { className: "strip", role: "img", "aria-label": `Doses logged on ${count} of the last 28 days`, children: days.map((d, i) => (_jsx("i", { className: `pop${d.on ? ' on' : ''}${d.today ? ' today' : ''}`, style: { ['--i']: i }, title: `${fmtDay(d.date)}${d.on ? ': dose logged' : ''}` }, d.date.getTime()))) }), _jsxs("div", { className: "strip-legend", children: [_jsx("span", { children: "4 weeks ago" }), _jsx("span", { children: "Today" })] })] }));
}
/** The label-mandated warning when two different GLP-1 medicines are tracked at the same time. */
export function Glp1Alert({ regimens }) {
    const hits = glp1Overlap(regimens);
    if (!hits.length)
        return null;
    const names = [...new Set(hits.map(regName))];
    return (_jsxs("div", { className: "alert caution", role: "note", children: [_jsxs("b", { children: [names.join(' and '), " are both GLP-1 medicines."] }), _jsx("span", { children: "The FDA labels for approved GLP-1 medicines don't recommend using one together with another GLP-1 medicine. If you're switching, pause the old one here. Ask your prescriber which one to continue." })] }));
}
const hhmm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
/** Calendar reminders for one regimen: pick the time, then add it to Google Calendar or download an .ics. */
function Reminders({ r, doses }) {
    const toast = useToast();
    const rule = rrule(r);
    const usual = usualMinutes(r.id, doses);
    const first = usual ?? 9 * 60;
    const [times, setTimes] = useState(() => (timesPerDay(r) === 2 ? [hhmm(first), hhmm(first + 12 * 60)] : [hhmm(first)]));
    if (!rule) {
        return (_jsxs("div", { className: "inset small", role: "note", children: ["Calendar reminders need fixed days. Tap ", _jsx("b", { children: "Edit" }), " and set ", _jsx("b", { children: "How often" }), " to ", _jsx("b", { children: "Certain days" }), " (for example Mon and Thu) to add them."] }));
    }
    const due = regimenStatus(r, doses).due;
    const rem = {
        title: `${regName(r)} · ${fmtNum(Number(r.dose), 3)} ${r.unit}`,
        url: `${window.location.origin}${window.location.pathname}#today`,
        rule,
        starts: times.map(t => firstReminder(r, due, t)),
        uid: r.id,
    };
    const label = (i) => (times.length > 1 ? (i === 0 ? 'First dose' : 'Second dose') : 'Remind me at');
    return (_jsxs("div", { className: "inset stack reminders gap-3 reveal", children: [_jsx("div", { className: "row-wrap", children: times.map((t, i) => (_jsxs("label", { className: "field", style: { minWidth: 140 }, children: [_jsx("span", { children: label(i) }), _jsx("input", { type: "time", id: `rem-${r.id}-${i}`, value: t, onChange: e => setTimes(times.map((x, j) => (j === i ? e.target.value : x))) })] }, i))) }), _jsxs("div", { className: "row-wrap", children: [times.map((_, i) => (_jsx("a", { className: "btn sm", href: googleLink(rem, i), target: "_blank", rel: "noopener", children: times.length > 1 ? `Google Calendar (${i === 0 ? 'first' : 'second'})` : 'Google Calendar' }, i))), _jsx("button", { type: "button", className: "btn ghost sm", onClick: () => {
                            download(`${regName(r).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-reminders.ics`, icsFile(rem), 'text/calendar');
                            toast('Calendar file saved. Open it to add the reminders.');
                        }, children: "Apple or other calendar" })] }), _jsxs("p", { className: "xsmall muted", children: ["Starts ", rem.starts[0].toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), ", then ", freqText(r).toLowerCase(), ". Your calendar sends the reminder, with the peptide's name and dose. If you change the schedule here, add it again and delete the old one."] })] }));
}
function RegimenCard({ r, doses, actions, i = 0 }) {
    const toast = useToast();
    const [remind, setRemind] = useState(false);
    const [more, setMore] = useState(false);
    const p = PEP[r.compoundId];
    const st = regimenStatus(r, doses);
    const { math, checks } = checkRegimen(r);
    const pause = (_jsx("button", { className: r.paused ? 'btn sm' : 'btn quiet sm', onClick: () => { store.saveRegimen({ ...r, paused: !r.paused }); toast(r.paused ? 'Resumed.' : 'Paused. Your history is kept.'); }, children: r.paused ? 'Resume' : 'Pause' }));
    return (_jsxs("article", { className: `tile regimen rise${r.paused ? ' paused' : ''}`, style: { ['--i']: i + 2 }, children: [_jsxs("div", { className: "top", children: [_jsxs("div", { className: "stack gap-1", children: [_jsx("h3", { children: regName(r) }), _jsxs("div", { className: "dose", children: [fmtNum(Number(r.dose), 3), " ", r.unit, " \u00B7 ", freqText(r), " \u00B7 ", r.route] })] }), _jsx("span", { className: "due", "data-s": st.s, children: st.text })] }), math && (_jsx("div", { className: "inset small", style: { background: 'var(--lilac)' }, children: isVolumeUnit(r.unit)
                    ? _jsxs(_Fragment, { children: ["Each dose is about ", _jsx("b", { className: "mono", children: drugAmount(math.doseMg, p?.defaultUnit) }), " (", fmtNum(Number(r.vialMg)), " mg in ", fmtNum(Number(r.diluentMl)), " mL). Confirm with your pharmacist."] })
                    : _jsxs(_Fragment, { children: ["Draw ", _jsxs("b", { className: "mono", children: [fmtNum(math.units, 1), " units"] }), " on a U-100 syringe (", fmtNum(Number(r.vialMg)), " mg vial + ", fmtNum(Number(r.diluentMl)), " mL). Confirm with your pharmacist."] }) })), checks.length > 0 && (_jsxs("div", { className: "alert danger", children: [_jsx("b", { children: "The dose and vial numbers don't add up." }), _jsxs("span", { children: [checks[0].title, " Tap Edit to check them."] }), _jsx("div", { className: "mt-1", children: _jsx("button", { type: "button", className: "btn sm", onClick: () => actions.editRegimen(r), children: "Edit" }) })] })), _jsx(NextShot, { r: r, doses: doses }), p && _jsxs("div", { className: "row-wrap", children: [_jsx(TierChip, { t: p.tier }), _jsx(LegalChip, { k: p.legal })] }), r.prescriber && _jsxs("div", { className: "small muted", children: ["Prescribed by ", r.prescriber] }), r.source === UNREGULATED_SOURCE && (_jsxs("div", { className: "alert warn", children: [_jsx("b", { children: "Unregulated source." }), _jsx("span", { children: "Products sold online as \"research use only\" aren't checked for identity, dose, sterility, or endotoxin. See Safety for testing data." })] })), _jsx(Strip, { rid: r.id, doses: doses }), remind && _jsx(Reminders, { r: r, doses: doses }), _jsxs("div", { className: "row-wrap", children: [r.paused ? pause : _jsx("button", { className: "btn sm", onClick: () => actions.logDose(r), children: "Log dose" }), _jsxs("button", { type: "button", className: "btn quiet sm", "aria-expanded": more, "aria-controls": `more-${r.id}`, onClick: () => setMore(!more), children: ["More", _jsx("svg", { className: "chev", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M6 9l6 6 6-6" }) })] })] }), more && (_jsxs("div", { className: "row-wrap reveal", id: `more-${r.id}`, children: [_jsx("button", { className: "btn ghost sm", onClick: () => actions.editRegimen(r), children: "Edit" }), !r.paused && r.freq !== 'prn' && _jsx("button", { className: "btn quiet sm", "aria-expanded": remind, onClick: () => setRemind(!remind), children: "Reminders" }), !r.paused && pause, p && _jsxs("a", { className: "btn quiet sm", href: `#${p.id}`, children: ["About ", p.name] })] }))] }));
}
const lsGet = (k) => { try {
    return localStorage.getItem(k);
}
catch {
    return null;
} };
const lsSet = (k, v) => { try {
    localStorage.setItem(k, v);
}
catch { /* storage blocked */ } };
export function PeptidesView(actions) {
    const { regimens, doses } = useLedger();
    const signedIn = !!useAccount().user;
    const [introHidden, setIntroHidden] = useState(() => lsGet('pl-intro-hidden') === '1');
    const active = regimens.filter(r => !r.paused);
    const paused = regimens.filter(r => r.paused);
    const due = active.filter(r => ['due', 'late'].includes(regimenStatus(r, doses).s)).length;
    const plus = _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M12 5v14M5 12h14" }) });
    return (_jsxs("section", { className: "view", children: [regimens.length === 0 ? (_jsxs("div", { className: "empty rise", children: [_jsx(IlloShelf, {}), _jsx("span", { className: "eyebrow", children: "Your peptides" }), _jsxs("h1", { children: ["Nothing tracked yet.", _jsx("br", {}), _jsx("span", { className: "soft", children: "Add what you were prescribed." })] }), _jsx("p", { className: "muted small", children: "Each one gets a due-date status, a 4-week history strip, and injection-site rotation." }), _jsxs("div", { className: "row-wrap", children: [_jsxs("button", { className: "btn", onClick: actions.addRegimen, children: [plus, "Add a peptide"] }), _jsx("a", { className: "btn ghost", href: "#learn", children: "Browse the library" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("header", { className: "head rise", children: [_jsx("span", { className: "eyebrow", children: "Your peptides" }), _jsxs("h1", { children: [active.length, " being tracked.", _jsx("br", {}), _jsx("span", { className: "soft", children: due ? `${due} due today.` : 'Nothing due today.' })] })] }), _jsxs("div", { className: "head-actions rise", style: { ['--i']: 1 }, children: [_jsxs("button", { className: "btn", onClick: actions.addRegimen, children: [plus, "Add a peptide"] }), _jsx("a", { className: "btn ghost", href: "#learn", children: "Browse the library" })] })] })), _jsx(Glp1Alert, { regimens: regimens }), !(introHidden && regimens.length) && (_jsxs("section", { className: "tile lemon rise", "aria-label": "About this log", style: { ['--i']: 2 }, children: [_jsxs("div", { className: "spread", children: [_jsx("h3", { children: "Before you start" }), regimens.length > 0 && _jsx("button", { className: "btn quiet sm", onClick: () => { lsSet('pl-intro-hidden', '1'); setIntroHidden(true); }, children: "Hide" })] }), _jsxs("ul", { className: "small bullets", children: [_jsx("li", { children: "This is a journal for doses and symptoms, built to share with your clinician. It never suggests a dose; enter the one you were prescribed." }), _jsx("li", { children: signedIn
                                    ? 'Your log syncs to your account, so it follows you to any device you sign in on. Only you can see it. Use Export on Trends to keep a copy.'
                                    : configured
                                        ? "Signed out, everything you enter stays in this browser on this device. Sign in (top right) to sync it across your devices; each person in your home can have their own account. Use Export on Trends to keep a copy."
                                        : "Everything you enter stays in this browser on this device. There's no account and no server. Use Export on Trends to keep a copy." }), _jsx("li", { children: "Most peptides promoted online are unapproved, and products sold as \"research use only\" aren't tested for what's in the vial. Check the library before you log something new." }), _jsx("li", { children: "If you feel seriously unwell, stop and get help. The daily check-in flags emergency symptoms." })] })] })), regimens.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "cols", children: active.map((r, i) => _jsx(RegimenCard, { r: r, doses: doses, actions: actions, i: i }, r.id)) }), paused.length > 0 && (_jsxs("details", { className: "tile", children: [_jsxs("summary", { className: "spread", style: { alignItems: 'center', flexWrap: 'nowrap' }, children: [_jsxs("b", { children: ["Paused (", paused.length, ")"] }), _jsx("span", { className: "arrow", "aria-hidden": "true", children: _jsx("svg", { className: "chev", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M9 6l6 6-6 6" }) }) })] }), _jsx("div", { className: "stack", children: paused.map(r => _jsx(RegimenCard, { r: r, doses: doses, actions: actions }, r.id)) })] }))] }))] }));
}
