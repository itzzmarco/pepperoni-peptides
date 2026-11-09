import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { store, useLedger } from '../lib/store';
import { leftToday, upcoming } from '../lib/schedule';
import { drugAmount, isVolumeUnit } from '../lib/doseMath';
import { checkRegimen } from '../lib/vial';
import { DAY, dayKey, fmtDay, fmtNum, fmtShort, fmtTime, startOfDay } from '../lib/format';
import { adherence, topEffects, usualMinutes } from '../lib/insights';
import { nextSite, siteLabel } from '../lib/sites';
import { placeLabels } from '../lib/trackLabels';
import { PEP } from '../data/peptides';
import { TIERS } from '../data/reference';
import { configured, useAccount } from '../lib/account';
import { firstName, usePartners, weighIns, weightChange } from '../lib/partner';
import { DeviceLogPrompt } from '../sheets/AccountSheet';
import { SiteFigure, doseText, whenNext } from '../components/NextShot';
import { useCountUp } from '../components/Motion';
import { IlloStart } from '../components/Illustration';
import { Glp1Alert, regName } from './PeptidesView';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const rise = (i) => ({ ['--i']: i });
/** Width (px) of one time label's box under the track, and of the pinned "12 AM" at the end. */
const LABEL = 54, END_LABEL = 40;
/** Today's doses on a 6 AM to midnight track: filled dots are logged, rings are still due (at the usual time).
    Times sit in boxes kept inside the card, with a label-wide gap between them (placeLabels). */
function DayBar({ done, todo, now }) {
    const ref = useRef(null);
    const [width, setWidth] = useState(248);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        setWidth(el.clientWidth);
        if (typeof ResizeObserver === 'undefined')
            return;
        const ro = new ResizeObserver(() => setWidth(el.clientWidth));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const A = 6 * 60, B = 24 * 60;
    const pos = (d) => Math.min(100, Math.max(0, ((d.getHours() * 60 + d.getMinutes() - A) / (B - A)) * 100));
    const nowPct = pos(now);
    const marks = [...done.map(d => ({ d, done: true })), ...todo.map(d => ({ d, done: false }))].sort((a, b) => a.d.getTime() - b.d.getTime());
    const { lefts, showEnd } = placeLabels(marks.map(m => (pos(m.d) / 100) * width), width, LABEL, END_LABEL);
    const desc = [...done.map(d => `logged at ${fmtTime(d)}`), ...todo.map(d => `due around ${fmtTime(d)}`)].join(', ');
    return (_jsxs("div", { ref: ref, className: "daybar", role: "img", "aria-label": `Today: ${desc}. It's ${fmtTime(now)}.`, children: [_jsx("div", { className: "track" }), _jsx("div", { className: "fill grow", style: { width: `${nowPct}%` } }), nowPct > 0 && nowPct < 100 && _jsx("div", { className: "now pop", style: { left: `${nowPct}%`, ...rise(8) }, children: _jsx("span", { children: "Now" }) }), marks.map((m, i) => (_jsxs("span", { children: [_jsx("span", { className: `mark pop ${m.done ? 'done' : 'todo'}`, style: { left: `${pos(m.d)}%`, ...rise(4 + i) }, children: m.done && _jsx("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M5 12.5l4.5 4.5L19 7.5" }) }) }), lefts[i] != null && _jsx("span", { className: "t", style: { left: lefts[i], width: LABEL, color: m.done ? undefined : 'var(--on-dark)', fontWeight: m.done ? 400 : 600 }, children: fmtTime(m.d) })] }, i))), showEnd && _jsx("span", { className: "t end", children: "12 AM" })] }));
}
/** Today's doses as a ring: the arc is the share logged, the count sits in the middle and the label reads it out.
    The arc sweeps to a new share (useCountUp, so reduced motion jumps), like the stats around it count up. */
function TodayRing({ done, total }) {
    const share = useCountUp(Math.min(1, done / total) * 100);
    return (_jsxs("span", { className: "today-ring pop", role: "img", "aria-label": `${done} of ${total} today`, style: rise(3), children: [_jsxs("svg", { viewBox: "0 0 72 72", width: "76", height: "76", "aria-hidden": "true", children: [_jsx("circle", { cx: "36", cy: "36", r: "30", className: "track" }), share > 0 && _jsx("circle", { cx: "36", cy: "36", r: "30", className: "arc", pathLength: 100, strokeDasharray: `${share} 100` })] }), _jsxs("b", { className: "num", "aria-hidden": "true", children: [done, _jsxs("small", { children: ["/", total] })] })] }));
}
function NextUp({ r, st, actions, doneToday, dueToday, todo, done, now, site }) {
    const { math, checks } = checkRegimen(r);
    const usual = todo[0];
    const total = doneToday + dueToday;
    return (_jsxs("section", { className: "tile dark rise", "aria-label": "Next dose", style: rise(2), children: [_jsxs("div", { className: "spread", children: [_jsx("span", { className: "eyebrow", children: "Next up" }), _jsx("span", { className: "sub num", children: st.text })] }), _jsxs("div", { className: "next-hero", children: [_jsxs("div", { className: "stack gap-2", children: [_jsx("span", { className: "next-name", children: regName(r) }), _jsxs("span", { className: "next-dose", children: [fmtNum(Number(r.dose), 3), " ", r.unit] }), _jsx("span", { className: "sub", children: [usual && st.s !== 'ok' ? `Usually around ${fmtTime(usual)}` : '', math ? (isVolumeUnit(r.unit) ? `about ${drugAmount(math.doseMg, PEP[r.compoundId]?.defaultUnit)}` : `draw ${fmtNum(math.units, 1)} units`) : checks.length ? 'check the vial details' : '', site ? siteLabel(site.site, r.route) : r.route].filter(Boolean).join(' · ') })] }), total > 0 && _jsx(TodayRing, { done: doneToday, total: total })] }), (done.length > 0 || todo.length > 0) && _jsx(DayBar, { done: done, todo: todo, now: now }), _jsxs("button", { className: "btn", onClick: () => actions.logDose(r), children: [_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M12 5v14M5 12h14" }) }), "Log now"] })] }));
}
export function TodayView(actions) {
    const { regimens, doses, checkins } = useLedger();
    const acct = useAccount();
    const signedIn = !!acct.user;
    const seenHere = acct.seenHere;
    const now = new Date();
    const today = dayKey(now);
    const list = upcoming(regimens, doses, now);
    const next = list[0];
    const late = list.filter(x => x.st.s === 'late').length;
    // Every dose still scheduled today, the evening dose of a twice-daily regimen included.
    const left = leftToday(list, now);
    const loggedToday = doses.filter(d => dayKey(new Date(d.at)) === today);
    const usualToday = (r) => {
        const m = usualMinutes(r.id, doses);
        return m == null ? null : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, m);
    };
    const todo = [...list.filter(x => x.st.s === 'due' || x.st.s === 'late').map(x => usualToday(x.r))].filter((d) => !!d && dayKey(d) === today);
    const done = loggedToday.map(d => new Date(d.at));
    const adh = adherence(regimens, doses, now);
    const pct = useCountUp(adh.pct == null ? 0 : Math.round(adh.pct * 100));
    const week = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
        return { d, on: doses.some(x => dayKey(new Date(x.at)) === dayKey(d)), today: i === 6 };
    });
    // Every weigh-in in the latest one's unit, so a switch between lb and kg never shows up as a jump.
    const wUnit = checkins.find(c => c.weight)?.weightUnit ?? 'lb';
    const weights = weighIns(checkins, wUnit, now.getTime() - 90 * DAY);
    const wNow = weights[weights.length - 1], wFirst = weights[0];
    const wShown = useCountUp(wNow?.w ?? 0, wFirst?.w ?? 0, 1100);
    const wChange = wNow && wFirst && wNow !== wFirst ? wNow.w - wFirst.w : null;
    const wMin = Math.min(...weights.map(w => w.w)), wMax = Math.max(...weights.map(w => w.w));
    const spark = weights.slice(-12).map((w, i, a) => `${(i / Math.max(1, a.length - 1)) * 120},${4 + (1 - (w.w - wMin) / Math.max(0.1, wMax - wMin)) * 20}`).join(' ');
    const effects = topEffects(checkins, startOfDay(now).getTime() - 6 * DAY);
    const checkedIn = checkins.find(c => dayKey(new Date(c.at)) === today);
    const lastFlag = checkins.find(c => c.flags.length && Date.now() - new Date(c.at).getTime() < 2 * DAY);
    // Each injected peptide's next spot in its own rotation (belly clock or body map), soonest due first.
    const shots = list.flatMap(x => { const s = nextSite(x.r, doses); return s ? [{ r: x.r, s }] : []; }).slice(0, 3);
    const comingUp = list.find(x => x !== next && x.st.s === 'ok');
    const learnP = next ? PEP[next.r.compoundId] : undefined;
    // A linked partner's latest weight and next shot, view only.
    const { partners, logs } = usePartners();
    const partner = partners[0];
    const pLog = partner ? logs[partner.id] : undefined;
    const pUnit = wNow ? wUnit : pLog?.checkins.find(c => c.weightUnit)?.weightUnit ?? 'lb';
    const pW = pLog ? weightChange(pLog.checkins, pUnit, now.getTime() - 90 * DAY) : null;
    const pNext = pLog ? upcoming(pLog.regimens, pLog.doses, now)[0] : undefined;
    const hour = now.getHours();
    const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    let line1, line2;
    const hasLog = regimens.length > 0 || doses.length > 0 || checkins.length > 0;
    // Signed out on a site with accounts, an empty log usually means "sign in", not "start over".
    const offerSignIn = configured && !signedIn && !regimens.length;
    if (!regimens.length && offerSignIn && seenHere) {
        line1 = "You're signed out.";
        line2 = 'Sign in to see your log.';
    }
    // No regimens: the start card below is the call to action, so the title is just the greeting.
    else if (!regimens.length) {
        line1 = hasLog ? 'Nothing to take yet.' : 'Welcome.';
        line2 = '';
    }
    else if (late) {
        line1 = `${plural(late, 'dose')} overdue.`;
        line2 = 'Log it when you take it.';
    }
    else if (left) {
        line1 = adh.pct == null || adh.pct >= 0.8 ? "You're on track." : "Here's today.";
        line2 = `${plural(left, 'dose')} left today.`;
    }
    else {
        line1 = "You're all set today.";
        line2 = next?.st.due ? `Next: ${regName(next.r)}, ${fmtShort(next.st.due)}.` : 'Nothing scheduled.';
    }
    return (_jsxs("section", { className: "view", children: [_jsxs("header", { className: "head", children: [_jsx("div", { className: "spread rise mid", children: _jsxs("span", { className: "stack gap-1", children: [_jsx("span", { className: "greet", children: hello }), _jsx("span", { className: "eyebrow", children: fmtDay(now) })] }) }), _jsxs("h1", { className: "rise", style: rise(1), children: [line1, line2 && _jsxs(_Fragment, { children: [_jsx("br", {}), _jsx("span", { className: "soft", children: line2 })] })] })] }), lastFlag && (_jsxs("div", { className: "alert danger", role: "alert", children: [_jsxs("b", { children: ["You reported an emergency symptom on ", fmtDay(new Date(lastFlag.at)), "."] }), _jsxs("span", { children: [lastFlag.flags.join('; '), ". If it's still happening, call 911 or go to an emergency room. For a possible poisoning or overdose, call Poison Control at 1-800-222-1222."] })] })), !store.persistent && (_jsxs("div", { className: "alert warn", children: [_jsx("b", { children: "This browser isn't saving your log." }), _jsx("span", { children: "Private browsing or blocked site storage stops saving. Entries will disappear when you close the tab, so export before you leave." })] })), _jsx(DeviceLogPrompt, { onToday: true }), _jsx(Glp1Alert, { regimens: regimens }), next ? (_jsx(NextUp, { r: next.r, st: next.st, actions: actions, now: now, done: done, todo: todo, site: shots.find(x => x.r === next.r)?.s ?? null, doneToday: loggedToday.length, dueToday: left })) : offerSignIn && seenHere ? (_jsxs("section", { className: "tile dark empty rise", style: rise(2), children: [_jsx(IlloStart, {}), _jsx("span", { className: "eyebrow", children: "Signed out" }), _jsx("h3", { children: "Sign in and your peptides, shots and weights come back." }), _jsx("span", { className: "sub", children: "Your log is saved in your account. Anything added while signed out stays on this device only, so sign in before you log." }), _jsxs("div", { className: "row-wrap", children: [_jsx("button", { className: "btn", onClick: actions.signIn, children: "Sign in" }), _jsx("button", { className: "btn glass", onClick: actions.addRegimen, children: "Add a peptide anyway" })] })] })) : (_jsxs("section", { className: "tile dark empty rise", style: rise(2), children: [_jsx(IlloStart, {}), _jsx("span", { className: "eyebrow", children: "Start your log" }), _jsx("h3", { children: "Track a peptide or medication your clinician prescribed." }), _jsxs("span", { className: "sub", children: ["You'll see what's due, how consistent you've been, and where to inject next. ", signedIn ? 'It syncs to your account, and only you can see it.' : 'Nothing leaves this device.'] }), _jsxs("div", { className: "row-wrap", children: [_jsx("button", { className: "btn", onClick: actions.addRegimen, children: "Add a peptide" }), offerSignIn && _jsx("button", { className: "btn glass", onClick: actions.signIn, children: "I have an account" })] })] })), hasLog && (_jsxs("div", { className: "bento quad", children: [_jsxs("a", { href: "#trends", className: "tile mint row-2 rise", style: rise(3), children: [_jsx("span", { className: "label", children: "Adherence" }), _jsx("span", { className: "big", children: adh.pct == null ? '–' : `${Math.round(pct)}%` }), _jsx("span", { className: "sub", style: { color: 'var(--mint-2)' }, children: adh.expected ? `${adh.logged} of ${adh.expected} doses · 4 weeks` : 'Log a few doses to see this.' }), _jsx("span", { className: "dots7", role: "img", "aria-label": `Last 7 days: dose logged on ${week.filter(w => w.on).length}`, children: week.map((w, i) => _jsx("i", { className: `pop${w.on ? ' on' : ''}${w.today && !w.on ? ' today' : ''}`, style: rise(i), title: fmtDay(w.d) }, i)) })] }), _jsxs("a", { href: "#trends", className: "tile lilac rise gap-2", style: rise(4), children: [_jsx("span", { className: "label", children: "Weight" }), wNow ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "stat", children: [wShown.toFixed(1), _jsxs("small", { children: [" ", wUnit] })] }), weights.length > 1 && _jsx("svg", { className: "spark", viewBox: "0 0 120 28", preserveAspectRatio: "none", "aria-hidden": "true", children: _jsx("polyline", { className: "draw", pathLength: 1, points: spark }) }), _jsx("span", { className: "sub", children: wChange != null ? `${wChange > 0 ? '+' : '−'}${Math.abs(wChange).toFixed(1)} since ${fmtShort(wFirst.at)}` : 'Add more check-ins for a trend.' })] })) : _jsx("span", { className: "sub", children: "Add your weight in a daily check-in." })] }), _jsxs("a", { href: "#trends", className: "tile peach rise gap-2", style: rise(5), children: [_jsx("span", { className: "label", children: "Side effects" }), effects.length ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "tile-title", children: effects[0][0] }), _jsxs("span", { className: "sub", children: [plural(effects[0][1], 'day'), " this week", effects.length > 1 ? `, plus ${effects.length - 1} more` : ''] })] })) : _jsx("span", { className: "sub", children: "None logged this week." })] }), partner && (_jsxs("a", { href: "#partner", className: "tile span-2 partner-tile rise", style: rise(6), children: [_jsx("span", { className: "avatar", "aria-hidden": "true", children: firstName(partner.name)[0] }), _jsxs("span", { className: "stack gap-1", style: { flex: 1, minWidth: 0 }, children: [_jsxs("span", { className: "label", children: [firstName(partner.name), " \u00B7 partner"] }), _jsx("span", { className: "tile-title", children: pW ? _jsxs(_Fragment, { children: [fmtNum(pW.last.w, 1), _jsxs("small", { className: "sub", children: [" ", pUnit] }), pW.count > 1 && _jsxs("span", { className: "sub", children: [" \u00B7 ", pW.change > 0 ? '+' : pW.change < 0 ? '−' : '', Math.abs(pW.change).toFixed(1), " since ", fmtShort(pW.first.at)] })] }) : 'No weigh-ins yet' }), pNext && _jsxs("span", { className: "sub", children: [regName(pNext.r), " \u00B7 ", pNext.st.text] })] }), _jsx("span", { className: "arrow", "aria-hidden": "true", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M5 12h14M13 6l6 6-6 6" }) }) })] })), shots.map(({ r, s: sug }, i) => (_jsxs("button", { type: "button", className: "tile sky span-2 rise row-tile gap-4", style: rise(6 + i), onClick: () => actions.logDose(r), "aria-label": `Next shot of ${regName(r)}: ${siteLabel(sug.site, r.route)}, ${whenNext(r, doses, now)}. Log it.`, children: [_jsx(SiteFigure, { s: sug, size: 76 }), _jsxs("span", { className: "stack gap-1", style: { minWidth: 0 }, children: [_jsxs("span", { className: "label", children: ["Next shot \u00B7 ", regName(r)] }), _jsx("span", { className: "tile-title", children: siteLabel(sug.site, r.route) }), _jsxs("span", { className: "sub", style: { color: 'var(--ink-2)', fontWeight: 600 }, children: [whenNext(r, doses, now), " \u00B7 ", doseText(r)] }), _jsx("span", { className: "sub", children: sug.why })] })] }, r.id))), _jsxs("button", { type: "button", className: `tile rise gap-2${comingUp?.st.due ? '' : ' wide-sm'}`, style: rise(7), onClick: actions.checkin, children: [_jsx("span", { className: "label", children: "Check-in" }), checkedIn ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "tile-title", children: "Done today" }), _jsxs("span", { className: "sub", children: [checkedIn.overall ? `Feeling ${checkedIn.overall}/5 · ` : '', fmtTime(new Date(checkedIn.at))] })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "tile-title", children: "How do you feel?" }), _jsx("span", { className: "sub", children: "Takes 30 seconds" })] }))] }), comingUp?.st.due && (_jsxs("a", { href: "#peptides", className: "tile rise gap-2", style: rise(8), children: [_jsx("span", { className: "label", children: "Coming up" }), _jsx("span", { className: "tile-title", children: regName(comingUp.r) }), _jsxs("span", { className: "sub", children: [fmtDay(comingUp.st.due), " \u00B7 ", fmtNum(Number(comingUp.r.dose), 3), " ", comingUp.r.unit] })] })), _jsxs("a", { href: learnP ? `#${learnP.id}` : '#calculator', className: `tile lemon rise row-tile gap-4 ${comingUp?.st.due ? 'span-2' : 'wide-sm'}`, style: rise(9), children: [_jsxs("span", { className: "stack gap-2", style: { flex: 1, minWidth: 0, overflowWrap: 'anywhere' }, children: [_jsx("span", { className: "label", children: learnP ? `Evidence · Tier ${learnP.tier} ${TIERS[learnP.tier].label}` : 'Guide' }), _jsx("span", { className: "tile-title", children: learnP ? `What the research says about ${learnP.name}` : 'Dose math, step by step' })] }), _jsx("span", { className: "arrow", "aria-hidden": "true", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M5 12h14M13 6l6 6-6 6" }) }) })] })] }))] }));
}
