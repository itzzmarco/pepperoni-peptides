import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { store, useLedger } from '../lib/store';
import { useAccount } from '../lib/account';
import { intervalDays } from '../lib/schedule';
import { download } from '../lib/download';
import { DAY, dayKey, fmtDay, fmtNum, fmtShort, fmtTime, startOfDay } from '../lib/format';
import { adherence, doseDays, effectDays, effectsNearDoses, patternWeeks, siteCounts, topEffects } from '../lib/insights';
import { SITE_LABEL } from '../lib/sites';
import { ledgerToCsv } from '../lib/csv';
import { PEP } from '../data/peptides';
import { LineChart } from '../components/LineChart';
import { useCountUp } from '../components/Motion';
import { useToast } from '../components/Toast';
import { IlloTrends } from '../components/Illustration';
import { regName } from './PeptidesView';
import { weighIns } from '../lib/partner';
const RANGES = [[7, 'Week'], [30, 'Month'], [90, '3 months']];
const rise = (i) => ({ ['--i']: i });
function DeleteButton({ onConfirm }) {
    const [armed, setArmed] = useState(false);
    return (_jsx("button", { className: `btn sm ${armed ? 'danger' : 'quiet'}`, onClick: () => { if (armed)
            onConfirm();
        else {
            setArmed(true);
            setTimeout(() => setArmed(false), 4000);
        } }, onBlur: () => setArmed(false), "aria-label": armed ? 'Confirm delete' : 'Delete entry', children: armed ? 'Confirm' : 'Delete' }));
}
function ExportPanel({ ledger }) {
    const toast = useToast();
    const file = useRef(null);
    const [wipe, setWipe] = useState(false);
    const signedIn = !!useAccount().user;
    const stamp = dayKey(new Date());
    const empty = !ledger.regimens.length && !ledger.doses.length && !ledger.checkins.length;
    const onImport = async (f) => {
        if (!f)
            return;
        try {
            const added = store.importBackup(JSON.parse(await f.text()));
            toast(added == null ? "That file isn't a Peptide Ledger backup." : `Restored ${added} item${added === 1 ? '' : 's'}.`);
        }
        catch {
            toast("Couldn't read that file. Choose a .json backup exported from this app.");
        }
        if (file.current)
            file.current.value = '';
    };
    return (_jsxs("section", { className: "tile", "aria-labelledby": "share-h", children: [_jsxs("div", { className: "row-wrap nowrap gap-3", children: [_jsx("span", { className: "badge-icon lemon", "aria-hidden": "true", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" }) }) }), _jsx("h3", { id: "share-h", children: "Share with your clinician" })] }), _jsxs("div", { className: "stack", children: [_jsxs("p", { className: "small muted", children: [signedIn ? 'Your log syncs to your account.' : 'Your log lives only in this browser.', " Export a CSV of doses, sites, side effects and weight for an appointment, or a backup you can restore on another device."] }), _jsxs("div", { className: "row-wrap", children: [_jsx("button", { className: "btn sm", disabled: empty, onClick: () => download(`peptide-log-${stamp}.csv`, ledgerToCsv(ledger, id => PEP[id]?.name), 'text/csv'), children: "Export CSV" }), _jsx("button", { className: "btn ghost sm", disabled: empty, onClick: () => download(`peptide-ledger-backup-${stamp}.json`, JSON.stringify(ledger, null, 2), 'application/json'), children: "Download backup" }), _jsx("button", { className: "btn quiet sm", onClick: () => file.current?.click(), children: "Restore backup" }), _jsx("input", { ref: file, type: "file", accept: "application/json,.json", hidden: true, onChange: e => onImport(e.target.files?.[0]) })] }), !empty && (_jsx("div", { className: "row-wrap", children: wipe ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "small", children: signedIn ? 'Erase every regimen, dose, and check-in from your account, on all your devices?' : 'Erase every regimen, dose, and check-in on this device?' }), _jsx("button", { className: "btn danger sm", onClick: () => { store.clearAll(); setWipe(false); toast(signedIn ? 'Your log was erased from your account.' : 'Your log was erased from this device.'); }, children: "Erase everything" }), _jsx("button", { className: "btn quiet sm", onClick: () => setWipe(false), children: "Keep my log" })] })) : (_jsx("button", { className: "btn quiet sm", onClick: () => setWipe(true), children: "Erase my log\u2026" })) }))] })] }));
}
/** How many timeline entries show before "Show all". */
const RECENT = 12;
/** Header chart: one bar per day in the range, as tall as that day's dose count, so the page opens on the shape of the log.
 *  A caption under it gives the total and the range's first and last day, and a hairline at the top marks the busiest day's count.
 *  Pointing, touching or arrowing along the bars reads out one day (a slider for screen readers, so every day is reachable).
 *  With no doses in range it isn't drawn at all. */
function DoseBars({ doses, days, now }) {
    const [sel, setSel] = useState(null);
    const perDay = new Map();
    for (const d of doses) {
        const k = dayKey(new Date(d.at));
        perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }
    const dayAt = (i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1) + i);
    const counts = Array.from({ length: days }, (_, i) => perDay.get(dayKey(dayAt(i))) ?? 0);
    const max = Math.max(1, ...counts);
    const total = counts.reduce((a, b) => a + b, 0);
    if (!total)
        return null;
    const at = sel == null ? null : Math.min(sel, days - 1);
    const dayText = (i) => `${fmtDay(dayAt(i))}: ${counts[i]} dose${counts[i] === 1 ? '' : 's'}`;
    const fromPointer = (e) => {
        const b = e.currentTarget.getBoundingClientRect();
        setSel(Math.max(0, Math.min(days - 1, Math.floor(((e.clientX - b.left) / b.width) * days))));
    };
    const onKey = (e) => {
        const cur = at ?? days - 1;
        const next = { ArrowLeft: cur - 1, ArrowDown: cur - 1, ArrowRight: cur + 1, ArrowUp: cur + 1, Home: 0, End: days - 1 }[e.key];
        if (next == null)
            return;
        e.preventDefault();
        setSel(Math.max(0, Math.min(days - 1, next)));
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "hero-bars", "data-n": days, tabIndex: 0, role: "slider", "aria-label": `Doses logged each day over the last ${days} days, ${total} in total`, "aria-valuemin": 0, "aria-valuemax": days - 1, "aria-valuenow": at ?? days - 1, "aria-valuetext": dayText(at ?? days - 1), onKeyDown: onKey, onPointerDown: fromPointer, onPointerMove: fromPointer, onPointerLeave: e => { if (e.pointerType === 'mouse')
                    setSel(null); }, onBlur: () => setSel(null), children: [_jsxs("span", { className: "hero-max", "aria-hidden": "true", children: [max, " a day"] }), counts.map((n, i) => _jsx("i", { className: `grow up${n ? '' : ' none'}`, "data-on": at === i || undefined, style: { height: n ? `${(n / max) * 100}%` : undefined, ['--i']: Math.round((i / days) * 12) } }, i))] }), _jsxs("div", { className: "hero-cap", "aria-hidden": "true", children: [_jsx("span", { children: fmtShort(dayAt(0)) }), at == null ? _jsxs("span", { children: [_jsxs("b", { children: [total, " dose", total === 1 ? '' : 's'] }), " logged", _jsx("small", { className: "hero-hint", children: "Drag to inspect a day" })] }) : _jsx("span", { children: _jsx("b", { children: dayText(at) }) }), _jsx("span", { children: "Today" })] })] }));
}
function History({ doses, checkins, onBackfill, onAdd, art }) {
    const toast = useToast();
    const [showAll, setShowAll] = useState(false);
    const items = [
        ...doses.slice(0, 80).map(e => ({ kind: 'dose', at: e.at, e })),
        ...checkins.slice(0, 80).map(e => ({ kind: 'check', at: e.at, e })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
    let lastDay = '';
    // Nothing logged yet: the same empty-state card as every other screen (art, title, one line, one action).
    if (!items.length)
        return (_jsxs("section", { className: "empty", "aria-labelledby": "hist-h", children: [art, _jsx("span", { className: "eyebrow", children: "History" }), _jsx("h3", { id: "hist-h", children: "Nothing logged yet" }), _jsx("p", { className: "small muted", children: "Logged doses and check-ins appear here. Kept a paper log before? Fill in past days to bring it in." }), _jsxs("div", { className: "row-wrap", children: [onAdd && _jsx("button", { type: "button", className: "btn", onClick: onAdd, children: "Add a peptide" }), _jsx("button", { type: "button", className: onAdd ? 'btn ghost' : 'btn', onClick: onBackfill, children: "Fill in past days" })] })] }));
    return (_jsxs("section", { className: "tile", "aria-labelledby": "hist-h", children: [_jsxs("div", { className: "spread mid", children: [_jsx("h3", { id: "hist-h", children: "History" }), _jsx("button", { type: "button", className: "btn soft sm", onClick: onBackfill, children: "Fill in past days" })] }), _jsxs("div", { className: "timeline", children: [(showAll ? items : items.slice(0, RECENT)).map(it => {
                        const d = new Date(it.at), k = dayKey(d);
                        const head = k !== lastDay ? _jsx("div", { className: "tl-day", children: fmtDay(d) }) : null;
                        lastDay = k;
                        return (_jsxs("div", { children: [head, _jsxs("div", { className: "tl-item", children: [_jsx("time", { children: fmtTime(d) }), it.kind === 'dose' ? (_jsxs("div", { className: "what", children: [_jsx("b", { children: it.e.name }), " ", fmtNum(Number(it.e.amount), 3), " ", it.e.unit, _jsx("small", { children: [it.e.route, SITE_LABEL[it.e.site], it.e.notes].filter(Boolean).join(' · ') })] })) : (_jsxs("div", { className: "what", children: [_jsx("b", { children: "Check-in" }), " ", it.e.overall ? `feeling ${it.e.overall}/5` : '', it.e.weight ? ` · ${fmtNum(it.e.weight, 1)} ${it.e.weightUnit ?? ''}` : '', _jsxs("small", { children: [it.e.effects.join(', '), it.e.notes ? ` · ${it.e.notes}` : ''] }), it.e.flags.length > 0 && _jsxs("small", { className: "flag-text", children: ["Emergency symptom: ", it.e.flags.join('; ')] })] })), _jsx(DeleteButton, { onConfirm: () => { if (it.kind === 'dose')
                                                store.deleteDose(it.e.id);
                                            else
                                                store.deleteCheckin(it.e.id); toast('Entry deleted.'); } })] })] }, it.e.id));
                    }), items.length > RECENT && (_jsx("button", { className: "btn quiet sm self-start mt-2", onClick: () => setShowAll(!showAll), children: showAll ? 'Show fewer' : `Show all ${items.length} entries` }))] })] }));
}
/** This month as a Monday-first calendar; filled days have at least one logged dose. */
function MonthCalendar({ doses, now }) {
    const on = doseDays(doses);
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const logged = Array.from({ length: now.getDate() }, (_, i) => on.has(dayKey(new Date(now.getFullYear(), now.getMonth(), i + 1)))).filter(Boolean).length;
    // The calendar is always this month, whatever range the card's percentage covers, so it names its month.
    return (_jsxs("div", { className: "stack gap-2", children: [_jsx("span", { className: "cal-month", "aria-hidden": "true", children: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }), _jsxs("div", { className: "cal", role: "img", "aria-label": `${first.toLocaleDateString(undefined, { month: 'long' })}: doses logged on ${logged} of ${now.getDate()} days so far`, children: [['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => _jsx("span", { className: "wd", children: d }, i)), Array.from({ length: lead }, (_, i) => _jsx("span", {}, `x${i}`)), Array.from({ length: days }, (_, i) => {
                        const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
                        const cls = [on.has(dayKey(d)) && 'on', d.getDate() === now.getDate() && 'today', d > now && 'future'].filter(Boolean).join(' ');
                        return _jsx("span", { className: `d pop ${cls}`, style: rise(i * 0.6), children: i + 1 }, i);
                    })] })] }));
}
function Pattern({ doses, checkins, now }) {
    const { regimens } = useLedger();
    const since = startOfDay(now).getTime() - 27 * DAY;
    const withDoses = regimens.filter(r => doses.some(d => d.rid === r.id && new Date(d.at).getTime() >= since));
    const [pick, setPick] = useState(() => (withDoses.find(r => (intervalDays(r) ?? 0) >= 2) ?? withDoses[0])?.id);
    const r = withDoses.find(x => x.id === pick) ?? withDoses[0];
    if (!r)
        return null;
    const dset = doseDays(doses, r.id), eset = effectDays(checkins);
    const weeks = patternWeeks(dset, eset, now);
    const { total, near } = effectsNearDoses(dset, eset, weeks[0][0].date, now);
    const name = regName(r);
    const p = PEP[r.compoundId];
    const sentence = !total
        ? `No side effects logged in the last 4 weeks.`
        : near === total
            ? `All ${total} side-effect days came within 2 days of a ${name} dose.`
            : `${near} of ${total} side-effect days came within 2 days of a ${name} dose.`;
    return (_jsxs("section", { className: "tile dark rise", "aria-labelledby": "pattern-h", style: rise(5), children: [_jsxs("div", { className: "spread", children: [_jsx("h2", { id: "pattern-h", className: "eyebrow", style: { color: 'var(--effect-cell)' }, children: "Pattern" }), _jsxs("span", { className: "sub", children: ["4 weeks from ", fmtShort(weeks[0][0].date)] })] }), withDoses.length > 1 && (_jsx("div", { className: "pick", role: "group", "aria-label": "Compare side effects with", children: withDoses.map(x => _jsx("button", { type: "button", className: "fchip", "aria-pressed": x.id === r.id, onClick: () => setPick(x.id), children: regName(x) }, x.id)) })), _jsx("p", { style: { fontSize: 'var(--fs-lg)', fontWeight: 500, lineHeight: 1.3 }, children: sentence }), _jsxs("div", { className: "pattern", role: "img", "aria-label": `Four weeks, Monday first: ${name} doses and days with side effects. ${sentence}`, children: [_jsx("div", { className: "wk head", "aria-hidden": "true", children: ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => _jsx("span", { children: d }, i)) }), weeks.map((w, wi) => (_jsx("div", { className: "wk", children: w.map((c, i) => (_jsx("span", { className: `c pop${c.future ? ' future' : `${c.dose ? ' dose' : ''}${c.effect ? ' effect' : ''}`}${dayKey(c.date) === dayKey(now) ? ' today' : ''}`, style: rise(wi * 4 + i), title: `${fmtDay(c.date)}${c.dose ? `: ${name} dose` : ''}${c.effect ? `${c.dose ? ',' : ':'} side effect logged` : ''}` }, i))) }, wi))), _jsxs("div", { className: "legend", style: { paddingTop: 4 }, children: [_jsxs("span", { children: [_jsx("i", { style: { background: 'var(--dose-cell)' } }), name, " dose"] }), _jsxs("span", { children: [_jsx("i", { style: { background: 'var(--effect-cell)' } }), "Side effect logged"] })] })] }), _jsx("p", { className: "sub", children: "A pattern in your own log, not proof of cause. Worth bringing to your prescriber." }), p && (_jsxs("a", { className: "btn self-start", href: `#${p.id}`, children: ["What the research says", _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M9 6l6 6-6 6" }) })] }))] }));
}
export function TrendsView({ onBackfill, onAdd }) {
    const ledger = useLedger();
    const { regimens, doses, checkins } = ledger;
    const [days, setDays] = useState(30);
    const now = new Date();
    const since = startOfDay(now).getTime() - (days - 1) * DAY;
    const adh = adherence(regimens, doses, now, days);
    const pct = useCountUp(adh.pct == null ? 0 : Math.round(adh.pct * 100));
    const inRange = checkins.filter(c => new Date(c.at).getTime() >= since);
    // Every weigh-in is shown in the latest one's unit, so switching between lb and kg never reads as a jump in weight.
    const wUnit = checkins.find(c => c.weight)?.weightUnit ?? 'lb';
    const weights = weighIns(checkins, wUnit, since).map(({ at, w }) => ({ x: at, y: w, tip: `${fmtDay(at)}: ${fmtNum(w, 1)} ${wUnit}` }));
    const wSorted = weights.slice().sort((a, b) => a.x.getTime() - b.x.getTime());
    const wFirst = wSorted[0], wLast = wSorted[wSorted.length - 1];
    const change = wSorted.length > 1 ? wLast.y - wFirst.y : null;
    const weeksSpan = wSorted.length > 1 ? (wLast.x.getTime() - wFirst.x.getTime()) / (7 * DAY) : 0;
    const changeShown = useCountUp(change ?? 0);
    const feel = inRange.filter(c => c.overall).map(c => ({ x: new Date(c.at), y: c.overall, tip: `${fmtDay(new Date(c.at))}: ${c.overall}/5` }));
    const effects = topEffects(checkins, since).slice(0, 5);
    const sites = siteCounts(doses, since).slice(0, 6);
    const missed = adh.expected - adh.logged;
    const line1 = adh.pct == null ? 'Your trends.' : adh.pct >= 0.9 ? `A steady ${days === 7 ? 'week' : days === 30 ? 'month' : 'quarter'}.` : adh.pct >= 0.7 ? 'Mostly on schedule.' : 'Some doses slipped.';
    const line2 = [
        change != null && Math.abs(change) >= 0.1 ? `${change < 0 ? 'Down' : 'Up'} ${Math.abs(change).toFixed(1)} ${wUnit}` : '',
        adh.expected ? (missed ? `${missed} dose${missed === 1 ? '' : 's'} missed` : 'no doses missed') : '',
    ].filter(Boolean).join(', ');
    const empty = !regimens.length && !doses.length && !checkins.length;
    return (_jsxs("section", { className: "view", children: [_jsxs("header", { className: `head rise${empty ? '' : ' hero'}`, children: [_jsx("span", { className: "eyebrow", children: empty ? 'Trends' : `Trends · ${RANGES.find(r => r[0] === days)[1]}` }), _jsxs("h1", { children: [line1, line2 && _jsxs(_Fragment, { children: [_jsx("br", {}), _jsxs("span", { className: "soft", children: [line2[0].toUpperCase() + line2.slice(1), "."] })] })] }), !empty && _jsx(DoseBars, { doses: doses, days: days, now: now })] }), empty ? _jsxs(_Fragment, { children: [_jsx(History, { doses: doses, checkins: checkins, onBackfill: onBackfill, onAdd: onAdd, art: _jsx(IlloTrends, {}) }), _jsx(ExportPanel, { ledger: ledger })] }) : _jsxs(_Fragment, { children: [_jsx("div", { className: "seg rise", role: "group", "aria-label": "Time range", style: rise(1), children: RANGES.map(([d, l]) => _jsx("button", { type: "button", "aria-pressed": days === d, onClick: () => setDays(d), children: l }, d)) }), _jsxs("div", { className: "cols", children: [_jsxs("section", { className: "tile mint rise", "aria-labelledby": "adh-h", style: rise(2), children: [_jsxs("div", { className: "spread", style: { alignItems: 'flex-end' }, children: [_jsxs("div", { className: "stack gap-1", children: [_jsx("h2", { id: "adh-h", className: "label", children: "Doses logged" }), _jsx("span", { className: "big", children: adh.pct == null ? '–' : `${Math.round(pct)}%` })] }), _jsx("span", { className: "sub", style: { color: 'var(--mint-2)' }, children: adh.expected ? `${adh.logged} of ${adh.expected} due doses` : 'No scheduled doses yet' })] }), _jsx(MonthCalendar, { doses: doses, now: now }), _jsxs("div", { className: "legend", style: { color: 'var(--mint-2)' }, children: [_jsxs("span", { children: [_jsx("i", { style: { background: 'var(--mint-ink)', borderRadius: 6 } }), "Dose logged"] }), _jsxs("span", { children: [_jsx("i", { style: { boxShadow: 'inset 0 0 0 2px var(--mint-ink)', background: 'var(--surface)', borderRadius: 6 } }), "Today"] })] })] }), _jsxs("section", { className: "tile lilac rise", "aria-labelledby": "wt-h", style: rise(3), children: [_jsxs("div", { className: "spread", style: { alignItems: 'flex-end' }, children: [_jsxs("div", { className: "stack gap-1", children: [_jsx("h2", { id: "wt-h", className: "label", children: "Weight" }), change != null
                                                        ? _jsxs("span", { className: "big", children: [changeShown < 0 ? '−' : '+', Math.abs(changeShown).toFixed(1), _jsxs("small", { children: [" ", wUnit, " ", weeksSpan >= 1.5 ? `in ${Math.round(weeksSpan)} weeks` : ''] })] })
                                                        : _jsx("span", { className: "sub", children: weights.length ? 'Add another weigh-in to see a trend.' : 'No weights logged in this range. Add one in a daily check-in.' })] }), _jsx("button", { type: "button", className: "btn soft sm", onClick: onBackfill, children: "Add past days" })] }), weights.length >= 2 && (() => {
                                        const ys = weights.map(w => w.y);
                                        const lo = Math.floor(Math.min(...ys) - 1), hi = Math.ceil(Math.max(...ys) + 1);
                                        return _jsx(LineChart, { points: weights, y0: lo, y1: hi, ticks: [lo, Math.round((lo + hi) / 2), hi], x0: since, x1: now.getTime(), label: "Weight trend", fmt: v => fmtNum(v, 1) });
                                    })(), change != null && (_jsxs("div", { className: "cols-3", children: [_jsxs("div", { className: "inset", children: [_jsx("div", { className: "xsmall muted", children: "Start" }), _jsxs("b", { className: "num", children: [wFirst.y.toFixed(1), " ", wUnit] })] }), _jsxs("div", { className: "inset", children: [_jsx("div", { className: "xsmall muted", children: "Now" }), _jsxs("b", { className: "num", children: [wLast.y.toFixed(1), " ", wUnit] })] }), _jsxs("div", { className: "inset", children: [_jsx("div", { className: "xsmall muted", children: "Per week" }), _jsx("b", { className: "num", children: weeksSpan >= 1 ? `${change < 0 ? '−' : '+'}${Math.abs(change / weeksSpan).toFixed(1)}` : '–' })] })] }))] }), _jsxs("section", { className: "tile rise", "aria-labelledby": "feel-h", style: { ...rise(4), ['--chart-line']: 'var(--mint-ink)' }, children: [_jsxs("div", { className: "spread", children: [_jsx("h2", { id: "feel-h", className: "label", style: { color: 'var(--mint-ink)' }, children: "How you've felt" }), _jsx("span", { className: "count", children: "1 to 5, from check-ins" })] }), feel.length >= 2
                                        ? _jsx(LineChart, { points: feel, y0: 1, y1: 5, ticks: [1, 3, 5], x0: since, x1: now.getTime(), label: "Overall feeling over time" })
                                        : _jsx("p", { className: "small muted", children: feel.length ? 'Check in on another day to start seeing a trend.' : 'Do a daily check-in to see your trend here.' })] }), _jsxs("section", { className: "tile peach rise", "aria-labelledby": "sx-h", style: rise(5), children: [_jsxs("div", { className: "spread", children: [_jsx("h2", { id: "sx-h", className: "label", children: "Side effects" }), _jsx("span", { className: "count", children: "Days logged" })] }), effects.length ? (_jsx("div", { className: "bars", children: effects.map(([name, n], i) => (_jsxs("div", { children: [_jsxs("div", { className: "spread", children: [_jsx("span", { children: name }), _jsxs("b", { className: "num", children: [n, " day", n === 1 ? '' : 's'] })] }), _jsx("div", { className: "bar", children: _jsx("i", { className: "grow", style: { width: `${(n / effects[0][1]) * 100}%`, ...rise(i) } }) })] }, name))) })) : _jsx("p", { className: "small muted", children: "None logged in this range." })] }), _jsx(Pattern, { doses: doses, checkins: checkins, now: now }), _jsxs("section", { className: "tile sky rise", "aria-labelledby": "rot-h", style: rise(6), children: [_jsxs("div", { className: "spread", children: [_jsx("h2", { id: "rot-h", className: "label", children: "Site rotation" }), _jsx("span", { className: "count", children: "Injections in range" })] }), sites.length ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "sites2", children: sites.map(([k, n], i) => (_jsxs("div", { children: [_jsxs("div", { className: "spread", children: [_jsx("span", { children: SITE_LABEL[k] ?? k }), _jsx("b", { className: "num", children: n })] }), _jsx("div", { className: "bar", children: _jsx("i", { className: "grow", style: { width: `${(n / sites[0][1]) * 100}%`, ...rise(i) } }) })] }, k))) }), _jsx("p", { className: "inset small", children: sites[0][1] >= 3 && days <= 7 ? `${SITE_LABEL[sites[0][0]]} was used ${sites[0][1]} times this week. Give it a rest.` : `Spread across ${siteCounts(doses, since).length} spots. Rotating helps prevent lumps and scarring.` })] })) : _jsx("p", { className: "small muted", children: "Pick a site when you log an injection to see your rotation here." })] })] }), _jsx(ExportPanel, { ledger: ledger }), _jsx(History, { doses: doses, checkins: checkins, onBackfill: onBackfill })] })] }));
}
