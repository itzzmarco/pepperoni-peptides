import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useLedger } from '../lib/store';
import { useAccount } from '../lib/account';
import { firstName, refreshPartners, usePartners, weighIns, weightChange } from '../lib/partner';
import { adherenceDays, freqText, regimenStatus } from '../lib/schedule';
import { adherence } from '../lib/insights';
import { DAY, dayKey, fmtDay, fmtNum, fmtShort, fmtTime, startOfDay } from '../lib/format';
import { LineChart } from '../components/LineChart';
import { IlloPartner } from '../components/Illustration';
import { regName } from './PeptidesView';
const RANGES = [[30, 'Month'], [90, '3 months'], [0, 'Since start']];
const rise = (i) => ({ ['--i']: i });
const signed = (n, unit) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n).toFixed(1)} ${unit}`;
/** A partner's recent doses and check-ins, newest first, read-only. */
function Recent({ log, name }) {
    const items = [
        ...log.doses.slice(0, 20).map(e => ({ kind: 'dose', at: e.at, e })),
        ...log.checkins.slice(0, 20).map(e => ({ kind: 'check', at: e.at, e })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
    let lastDay = '';
    return (_jsxs("section", { className: "tile rise", "aria-labelledby": "p-recent-h", style: rise(6), children: [_jsxs("h2", { id: "p-recent-h", className: "label", children: [name, "'s recent entries"] }), items.length ? (_jsx("div", { className: "timeline", children: items.map(it => {
                    const d = new Date(it.at), k = dayKey(d);
                    const head = k !== lastDay ? _jsx("div", { className: "tl-day", children: fmtDay(d) }) : null;
                    lastDay = k;
                    return (_jsxs("div", { children: [head, _jsxs("div", { className: "tl-item", style: { gridTemplateColumns: '64px minmax(0, 1fr)' }, children: [_jsx("time", { children: fmtTime(d) }), it.kind === 'dose' ? (_jsxs("div", { className: "what", children: [_jsx("b", { children: it.e.name }), " ", fmtNum(Number(it.e.amount), 3), " ", it.e.unit, _jsx("small", { children: [it.e.route, it.e.notes].filter(Boolean).join(' · ') })] })) : (_jsxs("div", { className: "what", children: [_jsx("b", { children: "Check-in" }), it.e.weight ? ` · ${fmtNum(it.e.weight, 1)} ${it.e.weightUnit ?? ''}` : '', it.e.overall ? ` · feeling ${it.e.overall}/5` : '', (it.e.effects.length > 0 || it.e.notes) && _jsx("small", { children: [it.e.effects.join(', '), it.e.notes].filter(Boolean).join(' · ') }), it.e.flags.length > 0 && _jsxs("small", { className: "flag-text", children: ["Emergency symptom: ", it.e.flags.join('; ')] })] }))] })] }, `${it.kind}${it.e.id}`));
                }) })) : _jsx("p", { className: "small muted", children: "Nothing logged yet." })] }));
}
/**
 * A linked partner's progress, view only: weight change next to yours, their shots and how
 * regularly they've been logged, and their latest entries.
 */
export function PartnerView({ onAccount }) {
    const acct = useAccount();
    const { partners, logs, loading, error, fetchedAt } = usePartners();
    const mine = useLedger();
    const [pick, setPick] = useState(null);
    const [days, setDays] = useState(0);
    const now = new Date();
    if (!acct.configured || !acct.user || !partners.length) {
        // First fetch, before anything has loaded: either page could follow, so show neither page's words yet.
        const first = loading && !!acct.user && !fetchedAt;
        return (_jsxs("section", { className: "view", children: [_jsx("p", { className: "sr-only", "aria-live": "polite", children: first ? 'Checking for a linked partner…' : '' }), first ? (
                /* The shape of the card either answer starts with (art, heading, a line, one control), so nothing jumps far when it lands. */
                _jsxs("div", { className: "skel-page empty", "aria-hidden": "true", children: [_jsx("div", { className: "skel", style: { height: 150, justifySelf: 'stretch', borderRadius: 'var(--r-md)' } }), _jsx("span", { className: "eyebrow", children: "Partner" }), _jsx("div", { className: "skel", style: { height: 30, width: '70%', borderRadius: 'var(--r-sm)' } }), _jsx("div", { className: "skel", style: { height: 18, width: '90%', borderRadius: 'var(--r-sm)' } }), _jsx("div", { className: "skel", style: { height: 48, width: 180, borderRadius: 999 } })] })) : (_jsxs("header", { className: "empty rise", children: [_jsx(IlloPartner, {}), _jsx("span", { className: "eyebrow", children: "Partner" }), _jsx("h1", { children: "Track progress together." }), _jsx("p", { className: "small muted", children: "Link accounts with your partner and you'll each see the other's weight and shots next to your own. Neither of you can change the other's log." }), _jsx("button", { className: "btn", onClick: onAccount, children: acct.user ? 'Link your partner' : 'Sign in to link' })] })), error && _jsxs("p", { className: "alert warn", children: [_jsx("b", { children: "Couldn't load your partner." }), _jsx("span", { children: error })] })] }));
    }
    const p = partners.find(x => x.id === pick) ?? partners[0];
    const log = logs[p.id] ?? { version: 1, regimens: [], doses: [], checkins: [] };
    const name = firstName(p.name);
    const unit = mine.checkins.find(c => c.weightUnit)?.weightUnit ?? log.checkins.find(c => c.weightUnit)?.weightUnit ?? 'lb';
    const since = days ? startOfDay(now).getTime() - (days - 1) * DAY : 0;
    const theirs = weightChange(log.checkins, unit, since);
    const yours = weightChange(mine.checkins, unit, since);
    // Change since each person's first weigh-in in the range, so both lines start at zero.
    const series = (cs, who) => {
        const w = weighIns(cs, unit, since);
        return w.map(x => ({ x: x.at, y: x.w - w[0].w, tip: `${who}, ${fmtShort(x.at)}: ${fmtNum(x.w, 1)} ${unit} (${signed(x.w - w[0].w, unit)})` }));
    };
    const sT = series(log.checkins, name), sY = series(mine.checkins, 'You');
    const ys = [...sT, ...sY].map(x => x.y);
    const lo = Math.floor(Math.min(0, ...ys) - 1), hi = Math.ceil(Math.max(0, ...ys) + 1);
    // Label zero and whichever ends are far enough from it not to collide.
    const ticks = [lo, 0, hi].filter(t => t === 0 || Math.abs(t) >= (hi - lo) * 0.2);
    const x0 = days ? since : Math.min(...[...sT, ...sY].map(x => x.x.getTime()));
    const startDay = theirs ? fmtShort(theirs.first.at) : '';
    const active = log.regimens.filter(r => !r.paused);
    const line2 = theirs && theirs.count > 1
        ? `${theirs.change < 0 ? 'Down' : theirs.change > 0 ? 'Up' : 'Even'}${theirs.change ? ` ${Math.abs(theirs.change).toFixed(1)} ${unit}` : ''} since ${startDay}.`
        : 'No weight trend yet.';
    return (_jsxs("section", { className: "view", children: [_jsxs("header", { className: "head rise", children: [_jsx("span", { className: "eyebrow", children: "Partner \u00B7 view only" }), _jsxs("h1", { children: [name, "'s progress.", _jsx("br", {}), _jsx("span", { className: "soft", children: line2 })] })] }), partners.length > 1 && (_jsx("div", { className: "pick rise", role: "group", "aria-label": "Partner", style: { margin: 0, padding: 0 }, children: partners.map(x => _jsx("button", { type: "button", className: "fchip", "aria-pressed": x.id === p.id, onClick: () => setPick(x.id), children: firstName(x.name) }, x.id)) })), _jsx("div", { className: "seg rise", role: "group", "aria-label": "Time range", style: rise(1), children: RANGES.map(([d, l]) => _jsx("button", { type: "button", "aria-pressed": days === d, onClick: () => setDays(d), children: l }, d)) }), _jsxs("div", { className: "cols", children: [_jsxs("section", { className: "tile lilac rise", "aria-labelledby": "p-wt-h", style: rise(2), children: [_jsxs("div", { className: "spread", children: [_jsx("h2", { id: "p-wt-h", className: "label", children: "Weight change, together" }), _jsx("span", { className: "count", children: unit })] }), _jsxs("div", { className: "together", children: [_jsxs("div", { className: "inset", children: [_jsx("div", { className: "xsmall muted", children: name }), _jsx("b", { className: "num", style: { color: 'var(--peach-ink)' }, children: theirs && theirs.count > 1 ? signed(theirs.change, unit) : '–' }), _jsx("div", { className: "xsmall muted", children: theirs ? `${fmtNum(theirs.last.w, 1)} ${unit} now` : 'No weigh-ins' })] }), _jsxs("div", { className: "inset", children: [_jsx("div", { className: "xsmall muted", children: "You" }), _jsx("b", { className: "num", style: { color: 'var(--lilac-ink)' }, children: yours && yours.count > 1 ? signed(yours.change, unit) : '–' }), _jsx("div", { className: "xsmall muted", children: yours ? `${fmtNum(yours.last.w, 1)} ${unit} now` : 'No weigh-ins' })] })] }), sT.length + sY.length >= 2 && (sY.length || sT.length) ? (_jsxs(_Fragment, { children: [_jsx(LineChart, { points: sY.length ? sY : sT, points2: sY.length ? sT : [], y0: lo, y1: hi, ticks: ticks, x0: x0, x1: now.getTime(), label: `Weight change since the start of the range: you and ${name}`, fmt: v => (v > 0 ? `+${fmtNum(v, 1)}` : fmtNum(v, 1)) }), _jsxs("div", { className: "legend", style: { color: 'var(--ink-2)' }, children: [sY.length > 0 && _jsxs("span", { children: [_jsx("i", { style: { background: 'var(--chart-line)' } }), "You"] }), sT.length > 0 && _jsxs("span", { children: [_jsx("i", { className: sY.length ? 'two' : '', style: sY.length ? undefined : { background: 'var(--chart-line)' } }), name] })] })] })) : _jsx("p", { className: "small muted", children: "Weigh-ins from either of you show up here as a line, starting from zero so you can compare." })] }), _jsxs("section", { className: "tile mint rise", "aria-labelledby": "p-shots-h", style: rise(3), children: [_jsxs("h2", { id: "p-shots-h", className: "label", children: [name, "'s shots"] }), active.length ? active.map(r => {
                                const st = regimenStatus(r, log.doses, now);
                                const adh = adherence([r], log.doses, now, 28);
                                const strip = adherenceDays(r.id, log.doses, 28, now);
                                return (_jsxs("div", { className: "stack gap-2", children: [_jsxs("div", { className: "spread", children: [_jsxs("b", { children: [regName(r), " \u00B7 ", fmtNum(Number(r.dose), 3), " ", r.unit] }), _jsx("span", { className: "sub", style: { color: 'var(--mint-2)' }, children: freqText(r) })] }), _jsxs("div", { className: "spread", style: { color: 'var(--mint-2)' }, children: [_jsx("span", { className: "small", children: st.last ? `Last ${fmtDay(st.last)}` : 'Not logged yet' }), _jsx("span", { className: "small", style: { fontWeight: 600, color: st.s === 'late' ? 'var(--danger)' : 'var(--mint-ink)' }, children: st.text })] }), _jsx("span", { className: "strip28", role: "img", "aria-label": `Last 4 weeks: ${name} logged ${r.name || regName(r)} on ${strip.filter(d => d.on).length} days`, children: strip.map((d, i) => _jsx("i", { className: `${d.on ? 'on' : ''}${d.today ? ' today' : ''}`, title: fmtDay(d.date) }, i)) }), adh.expected > 0 && _jsxs("span", { className: "xsmall", style: { color: 'var(--mint-2)' }, children: [adh.logged, " of ", adh.expected, " due doses logged in 4 weeks"] })] }, r.id));
                            }) : _jsxs("p", { className: "small", style: { color: 'var(--mint-2)' }, children: [name, " isn't tracking a peptide yet."] })] })] }), _jsx(Recent, { log: log, name: name }), _jsxs("div", { className: "spread", style: { alignItems: 'center', padding: '0 4px' }, children: [_jsxs("span", { className: "xsmall muted", children: [loading ? 'Updating…' : fetchedAt ? `Updated ${fmtTime(new Date(fetchedAt))}` : '', error ? ` · ${error}` : ''] }), _jsx("button", { className: "btn quiet sm", onClick: () => void refreshPartners(true), disabled: loading, children: "Refresh" })] }), _jsxs("p", { className: "xsmall muted", style: { padding: '0 4px' }, children: ["You can see ", name, "'s log but can't change it. To stop sharing, unlink in your account."] })] }));
}
