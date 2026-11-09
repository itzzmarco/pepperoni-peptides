import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { store, useLedger } from '../lib/store';
import { dayKey, fmtDay, fmtNum } from '../lib/format';
import { dayAt, dueDayKeys, monthGrid, parsePasted, planBackfill, readWeight, weightsByDay } from '../lib/backfill';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { prefersReducedMotion } from '../components/Motion';
import { regName } from '../views/PeptidesView';
import { convertWeight } from '../lib/partner';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
/** A day-to-day change bigger than this is flagged as a possible typo. */
const JUMP = 0.05;
/**
 * Fill in past days from a paper log: a month grid laid out like a wall calendar. Tap a day and type its
 * weight (Enter moves to the next day), or pick a peptide and tap the days it was taken. Nothing is saved
 * until Save, so the whole month can be checked against the paper first.
 */
export function BackfillSheet({ onClose }) {
    const toast = useToast();
    const ledger = useLedger();
    const { regimens, doses, checkins } = ledger;
    const now = new Date();
    const [ym, setYm] = useState(() => ({ y: now.getFullYear(), m: now.getMonth() }));
    const [mode, setMode] = useState('weight');
    const [weights, setWeights] = useState({});
    const [ticks, setTicks] = useState({});
    const [unit, setUnit] = useState(() => checkins.find(c => c.weightUnit)?.weightUnit ?? 'lb');
    const [paste, setPaste] = useState('');
    const [bad, setBad] = useState([]);
    const box = useRef(null);
    const tile = useRef(null);
    // The day being typed in. Its typo and jump warnings wait until you move on, so "3" on the way to "311" isn't flagged.
    const [editing, setEditing] = useState(null);
    // The day the editor under the calendar is set to. The grid cells are too narrow on a phone for a readable input.
    const [pick, setPick] = useState(() => dayKey(now));
    const saved = useMemo(() => weightsByDay(checkins), [checkins]);
    const cells = monthGrid(ym.y, ym.m, now);
    const open = cells.filter(c => c && !c.future).map(c => c);
    const sel = open.find(c => c.key === pick) ?? open[open.length - 1];
    const plan = useMemo(() => planBackfill(ledger, { weights, doses: ticks, unit }, new Date(), regName), [ledger, weights, ticks, unit]);
    const nWeights = plan.saveCheckins.length + plan.deleteCheckins.length;
    const nDoses = plan.addDoses.length;
    const invalid = Object.entries(weights).filter(([, v]) => Number.isNaN(readWeight(v))).map(([k]) => k);
    const pending = nWeights + nDoses;
    // A saved weight in the unit picked here, so a 220 lb entry never reads as 220 kg. Converted values round to 0.1.
    const savedW = (key) => {
        const c = saved.get(key);
        if (!c)
            return undefined;
        const from = c.weightUnit ?? unit;
        return from === unit ? c.weight : Math.round(convertWeight(c.weight, from, unit) * 10) / 10;
    };
    const shown = (key) => (key in weights ? weights[key] : saved.has(key) ? String(savedW(key)) : '');
    // Every day's weight as it would be after saving, for spotting typos like 231 for 213.
    const after = useMemo(() => {
        const m = new Map();
        for (const k of saved.keys())
            m.set(k, savedW(k));
        for (const [k, v] of Object.entries(weights)) {
            const w = readWeight(v);
            if (w == null || Number.isNaN(w))
                m.delete(k);
            else
                m.set(k, w);
        }
        return m;
    }, [saved, weights, unit]);
    const jumpFrom = (key) => {
        const v = after.get(key);
        if (v == null)
            return null;
        const d = dayAt(key);
        for (let i = 1; i <= 14; i++) {
            const k = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i));
            const p = after.get(k);
            if (p != null)
                return Math.abs(v - p) / p > JUMP ? [k, p] : null;
        }
        return null;
    };
    const setWeight = (key, v) => {
        const next = { ...weights };
        const had = savedW(key);
        if (had != null ? readWeight(v) === had : !v.trim())
            delete next[key];
        else
            next[key] = v;
        setWeights(next);
    };
    const r = regimens.find(x => x.id === mode);
    const logged = useMemo(() => new Set(r ? doses.filter(d => d.rid === r.id).map(d => dayKey(new Date(d.at))) : []), [doses, r]);
    const ticked = new Set(r ? ticks[r.id] ?? [] : []);
    const due = r ? dueDayKeys(r, doses, cells) : new Set();
    const dueOpen = [...due].filter(k => !logged.has(k) && !ticked.has(k));
    const toggle = (key) => {
        if (!r)
            return;
        if (logged.has(key)) {
            toast('Already logged. To remove it, delete it under History on Trends.');
            return;
        }
        setTicks({ ...ticks, [r.id]: ticked.has(key) ? [...ticked].filter(k => k !== key) : [...ticked, key] });
    };
    const isThisMonth = ym.y === now.getFullYear() && ym.m === now.getMonth();
    const step = (n) => setYm(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }));
    const title = new Date(ym.y, ym.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    // Enter (or Next on a phone keyboard) moves the editor on to the next day.
    const onKey = (e) => {
        if (e.key !== 'Enter' || !sel)
            return;
        e.preventDefault();
        const next = open[open.indexOf(sel) + 1];
        if (next) {
            setPick(next.key);
            setEditing(next.key);
        }
        else
            e.currentTarget.blur();
    };
    const choose = (key) => { setPick(key); box.current?.focus(); };
    const fill = () => {
        const { values, bad } = parsePasted(paste, new Date());
        setBad(bad);
        if (!values.length) {
            toast('No dates with weights found. Try one day per line, like 9/7 213.');
            return;
        }
        const next = { ...weights };
        for (const [k, v] of values) {
            if (saved.has(k) && savedW(k) === readWeight(v))
                delete next[k];
            else
                next[k] = v;
        }
        setWeights(next);
        setMode('weight');
        const firstKey = values.map(([k]) => k).sort()[0];
        const first = dayAt(firstKey);
        setYm({ y: first.getFullYear(), m: first.getMonth() });
        setPick(firstKey);
        setPaste('');
        tile.current?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        toast(`Filled in ${plural(values.length, 'day')}${bad.length ? `, skipped ${plural(bad.length, 'line')}` : ''}. Check them, then save.`);
    };
    // Sheet re-focuses itself whenever onClose changes, so this must keep one identity while typing.
    // With unsaved entries, the first close (Escape, scrim, close button, Cancel, a drag) arms a confirmation in the footer
    // instead of leaving; a second close, or Discard, leaves. Any new edit disarms it.
    const pendingRef = useRef(0);
    pendingRef.current = pending;
    const [leaving, setLeaving] = useState(false);
    const leavingRef = useRef(false);
    leavingRef.current = leaving;
    const keep = useRef(null);
    const close = useCallback(() => {
        if (pendingRef.current && !leavingRef.current) {
            setLeaving(true);
            return;
        }
        onClose();
    }, [onClose]);
    useEffect(() => { setLeaving(false); }, [weights, ticks]);
    useEffect(() => { if (leaving)
        keep.current?.focus(); }, [leaving]);
    const save = () => {
        if (invalid.length) {
            const d = dayAt(invalid.sort()[0]);
            setYm({ y: d.getFullYear(), m: d.getMonth() });
            setPick(invalid[0]);
            setMode('weight');
            toast(`${fmtDay(d)} doesn't look like a weight. Fix or clear it first.`);
            return;
        }
        if (!pending) {
            onClose();
            return;
        }
        store.applyBatch({ checkins: plan.saveCheckins, deleteCheckins: plan.deleteCheckins, doses: plan.addDoses });
        toast(`Saved ${[nWeights && plural(nWeights, 'weight'), nDoses && plural(nDoses, 'dose')].filter(Boolean).join(' and ')}.`);
        onClose();
    };
    const tint = r ? 'mint' : 'lilac';
    return (_jsxs(Sheet, { onClose: close, label: "Fill in past days", children: [_jsxs("div", { className: "sheet-head", children: [_jsxs("div", { className: "stack gap-1", children: [_jsx("span", { className: "eyebrow", children: "Back-track" }), _jsx("h2", { children: "Fill in past days" }), _jsx("p", { className: "small muted", children: "Copy from a paper log one month at a time. Nothing saves until you tap Save." })] }), _jsx("button", { type: "button", className: "icon-btn", onClick: close, "aria-label": "Close", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }) }) })] }), regimens.length > 0 && (_jsxs("div", { className: "pick", role: "group", "aria-label": "What to fill in", style: { margin: '0 -16px', padding: '0 16px 2px' }, children: [_jsx("button", { type: "button", className: "fchip", "aria-pressed": mode === 'weight', onClick: () => setMode('weight'), children: "Weight" }), regimens.map(x => (_jsxs("button", { type: "button", className: "fchip", "aria-pressed": mode === x.id, onClick: () => setMode(x.id), children: [regName(x), (ticks[x.id]?.length ?? 0) > 0 && _jsxs("span", { className: "bf-badge", children: ["+", ticks[x.id].length] })] }, x.id)))] })), _jsxs("section", { ref: tile, className: `tile ${tint} bf`, "aria-label": r ? `${regName(r)} doses, ${title}` : `Weights, ${title}`, children: [_jsxs("div", { className: "spread mid", children: [_jsx("button", { type: "button", className: "icon-btn", onClick: () => step(-1), "aria-label": "Previous month", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M15 6l-6 6 6 6" }) }) }), _jsx("h3", { className: "bf-title", "aria-live": "polite", children: title }), _jsx("button", { type: "button", className: "icon-btn", onClick: () => step(1), disabled: isThisMonth, "aria-label": "Next month", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M9 6l6 6-6 6" }) }) })] }), _jsx("p", { className: "small", style: { color: 'var(--ink-2)' }, children: r ? `Tap each day you took ${regName(r)}. It's logged as ${fmtNum(Number(r.dose), 3)} ${r.unit} at your usual time.` : 'Tap a day, then type its weight. Enter jumps to the next day.' }), _jsxs("div", { className: "bf-grid", children: [['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => _jsx("span", { className: "bf-wd", "aria-hidden": "true", children: d }, i)), cells.map((c, i) => {
                                if (!c)
                                    return _jsx("span", {}, `x${i}`);
                                const n = c.date.getDate();
                                if (c.future)
                                    return _jsx("span", { className: "bf-cell future", "aria-hidden": "true", children: _jsx("span", { className: "bf-d", children: n }) }, c.key);
                                if (r) {
                                    const on = logged.has(c.key) || ticked.has(c.key);
                                    const cls = ['bf-cell', 'dose', logged.has(c.key) && 'logged', ticked.has(c.key) && 'new', due.has(c.key) && 'due', c.today && 'today'].filter(Boolean).join(' ');
                                    return (_jsxs("button", { type: "button", className: cls, "aria-pressed": on, onClick: () => toggle(c.key), "aria-label": `${fmtDay(c.date)}${logged.has(c.key) ? ', already logged' : due.has(c.key) ? ', due by schedule' : ''}`, children: [_jsx("span", { className: "bf-d", children: n }), on && _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M5 12.5l4.5 4.5L19 7.5" }) })] }, c.key));
                                }
                                const v = shown(c.key);
                                const changed = c.key in weights;
                                const settled = editing !== c.key;
                                const wrong = settled && changed && Number.isNaN(readWeight(weights[c.key]));
                                const jump = settled && !wrong && jumpFrom(c.key);
                                const cls = ['bf-cell', saved.has(c.key) && !changed && 'saved', changed && 'changed', wrong && 'wrong', jump && 'jump', c.today && 'today'].filter(Boolean).join(' ');
                                return (_jsxs("button", { type: "button", className: `${cls} wt${sel?.key === c.key ? ' sel' : ''}`, "aria-pressed": sel?.key === c.key, onClick: () => choose(c.key), "aria-label": `${fmtDay(c.date)}, ${v ? `${v} ${unit}` : 'no weight'}`, title: jump ? `Big change from ${fmtDay(dayAt(jump[0]))} (${jump[1]}). Double-check.` : undefined, children: [_jsx("span", { className: "bf-d", children: n }), _jsx("span", { className: "bf-v", children: v })] }, c.key));
                            })] }), !r && sel && (_jsxs("label", { className: "field bf-edit", children: [_jsxs("span", { children: ["Weight on ", fmtDay(sel.date)] }), _jsx("input", { ref: box, type: "text", inputMode: "decimal", enterKeyHint: "next", autoComplete: "off", maxLength: 6, value: shown(sel.key), "aria-invalid": (editing !== sel.key && sel.key in weights && Number.isNaN(readWeight(weights[sel.key]))) || undefined, onChange: e => setWeight(sel.key, e.target.value), onKeyDown: onKey, onFocus: () => setEditing(sel.key), onBlur: () => setEditing(null) })] })), r ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "legend", style: { color: 'var(--mint-2)' }, children: [_jsxs("span", { children: [_jsx("i", { style: { background: 'var(--mint-ink)' } }), "Already logged"] }), _jsxs("span", { children: [_jsx("i", { style: { background: 'var(--mint-ink)', boxShadow: 'inset 0 0 0 2px var(--accent)' } }), "Adding"] }), due.size > 0 && _jsxs("span", { children: [_jsx("i", { style: { boxShadow: 'inset 0 -3px 0 var(--mint-ink)', background: 'var(--surface)' } }), "Due by schedule"] })] }), dueOpen.length > 1 && (_jsxs("button", { type: "button", className: "btn soft sm self-start", onClick: () => setTicks({ ...ticks, [r.id]: [...ticked, ...dueOpen] }), children: ["Tick all ", dueOpen.length, " due days in ", new Date(ym.y, ym.m, 1).toLocaleDateString(undefined, { month: 'long' })] }))] })) : (_jsxs("div", { className: "spread mid gap-2", children: [_jsxs("div", { className: "legend", style: { color: 'var(--ink-2)' }, children: [_jsxs("span", { children: [_jsx("i", { className: "bf-key saved" }), "Saved"] }), _jsxs("span", { children: [_jsx("i", { className: "bf-key changed" }), "New or changed"] }), _jsxs("span", { children: [_jsx("i", { className: "bf-key jump" }), "Big jump, check it"] })] }), _jsxs("label", { className: "bf-unit", children: [_jsx("span", { className: "xsmall", children: "Unit" }), _jsxs("select", { value: unit, onChange: e => setUnit(e.target.value), "aria-label": "Weight unit", children: [_jsx("option", { children: "lb" }), _jsx("option", { children: "kg" })] })] })] }))] }), _jsxs("details", { className: "tile bf-paste", children: [_jsx("summary", { children: "Paste a list of weights instead" }), _jsxs("p", { className: "small muted", children: ["One day per line: a date, then the weight. Dates are month/day, like ", _jsx("span", { className: "mono", children: "9/7 213" }), ", ", _jsx("span", { className: "mono", children: "Sep 7 213" }), " or ", _jsx("span", { className: "mono", children: "2026-09-07 213" }), ". The days fill in above so you can check them before saving."] }), _jsx("textarea", { value: paste, onChange: e => setPaste(e.target.value), rows: 5, placeholder: '9/7 213\n9/8 211\n9/9 210', "aria-label": "Pasted weights" }), bad.length > 0 && _jsxs("p", { className: "alert warn small", children: [_jsxs("b", { children: ["Skipped ", plural(bad.length, 'line'), " I couldn't read"] }), _jsxs("span", { className: "mono", children: [bad.slice(0, 5).join(' · '), bad.length > 5 ? ' …' : ''] })] }), _jsx("button", { type: "button", className: "btn soft sm self-start", onClick: fill, disabled: !paste.trim(), children: "Fill in the days" })] }), _jsxs("div", { className: "sheet-foot", children: [_jsx("p", { className: "sr-only", role: "status", children: leaving ? `Leave without saving? ${pending} ${pending === 1 ? 'entry' : 'entries'} you filled in will be lost.` : '' }), leaving ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "small", "aria-hidden": "true", style: { flex: '1 1 100%' }, children: [_jsx("b", { children: "Leave without saving?" }), " ", pending, " ", pending === 1 ? 'entry' : 'entries', " you filled in will be lost."] }), _jsx("button", { ref: keep, type: "button", className: "btn ghost", onClick: () => setLeaving(false), children: "Keep editing" }), _jsx("button", { type: "button", className: "btn danger", onClick: onClose, style: { flex: '1 1 160px' }, children: "Discard and leave" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn ghost", onClick: close, children: "Cancel" }), _jsx("button", { type: "button", className: "btn", onClick: save, disabled: !pending && !invalid.length, style: { flex: '1 1 160px' }, children: invalid.length ? `Fix ${plural(invalid.length, 'day')} first` : pending ? `Save ${[nWeights && plural(nWeights, 'weight'), nDoses && plural(nDoses, 'dose')].filter(Boolean).join(' and ')}` : 'Nothing to save yet' })] }))] })] }));
}
