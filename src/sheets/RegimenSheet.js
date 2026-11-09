import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { samePeptide, store, useLedger } from '../lib/store';
import { DAY_SHORT, FREQS, WEEK, freqText, weekdaysOf } from '../lib/schedule';
import { configured, useAccount } from '../lib/account';
import { SYRINGE_UNITS, drugAmount, isVolumeUnit } from '../lib/doseMath';
import { checkDose } from '../lib/vial';
import { dayKey, fmtNum, newId } from '../lib/format';
import { PEP, PEPTIDES } from '../data/peptides';
import { FAMILIES, LEGAL, TIERS } from '../data/reference';
import { ROUTES, SOURCES, UNREGULATED_SOURCE } from '../data/options';
import { measuresFor } from '../data/measures';
import { Sheet } from '../components/Sheet';
import { UnitOptions, UsualUnits } from '../components/UnitPicker';
import { useToast } from '../components/Toast';
import { FamilyGlyph } from '../components/FamilyGlyph';
import { TierChip } from '../components/Chips';
import { regName } from '../views/PeptidesView';
import { matches } from '../views/LibraryView';
const OTHER = '__other';
export const isRisky = (p) => !!p && (p.tier >= 3 || ['restricted', 'unapproved', 'investigational', 'pending', 'interim'].includes(p.legal));
function Caution({ p }) {
    if (!p || !isRisky(p))
        return null;
    return (_jsxs("div", { className: `alert ${p.tier >= 4 ? 'danger' : 'warn'}`, children: [_jsxs("b", { children: [p.name, ": Tier ", p.tier, " (", TIERS[p.tier].label, ") \u00B7 ", LEGAL[p.legal]?.label] }), _jsxs("span", { children: [TIERS[p.tier].long, ". Logging it here doesn't make it safer. Share this log with a clinician who knows you're using it."] }), p.avoid?.length ? _jsxs("span", { children: [_jsx("b", { children: "Avoid if:" }), " ", p.avoid.slice(0, 3).join('; ')] }) : null, _jsxs("a", { href: `#${p.id}`, children: ["Read the full ", p.name, " entry"] })] }));
}
/**
 * The compound picker: a search box over the library, each row with its family glyph and evidence tier like the Learn
 * cards. Once something is chosen it folds to that one row and a Change button. `field` carries the error wiring.
 */
function CompoundPicker({ pick, onPick, field }) {
    const [finding, setFinding] = useState(!pick);
    const [q, setQ] = useState('');
    const change = useRef(null);
    const moved = useRef(false);
    useEffect(() => { if (!finding && moved.current)
        change.current?.focus(); }, [finding]);
    const p = PEP[pick];
    const found = PEPTIDES.filter(x => matches(x, { q, fam: 'all', tier: 'all', legal: 'all' }));
    const take = (v) => { onPick(v); setQ(''); moved.current = true; setFinding(false); };
    const row = (v, x) => (_jsxs("button", { type: "button", className: "find-row", "aria-pressed": pick === v, onClick: () => take(v), children: [x && _jsx(FamilyGlyph, { family: x.family, size: 36 }), _jsxs("span", { className: "nm", children: [x ? x.name : 'Something else (type the name)', x && _jsxs("span", { className: "meta", children: [_jsx(TierChip, { t: x.tier }), _jsx("small", { children: FAMILIES[x.family]?.name })] })] })] }, v));
    return (_jsxs("div", { className: "field", children: [_jsx("span", { id: "r-compound-l", children: "Peptide or medication" }), !finding ? (_jsxs("div", { className: "picked", children: [p && _jsx(FamilyGlyph, { family: p.family, size: 36 }), _jsxs("span", { className: "nm", children: [_jsx("b", { children: p ? p.name : 'Something else' }), p && _jsx(TierChip, { t: p.tier })] }), _jsx("button", { ref: change, type: "button", className: "btn quiet sm", onClick: () => setFinding(true), "aria-label": "Change peptide", children: "Change" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "search", children: [_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "m21 21-4.3-4.3" })] }), _jsx("input", { type: "search", id: "r-compound", ...field, "aria-label": "Search peptides", value: q, onChange: e => setQ(e.target.value), placeholder: "Search name, nickname or goal", autoComplete: "off" })] }), _jsxs("div", { className: "find-list", role: "group", "aria-labelledby": "r-compound-l", children: [found.map(x => row(x.id, x)), !found.length && _jsx("p", { className: "small muted find-none", children: "No matches" }), row(OTHER)] })] }))] }));
}
/** The unit a new regimen starts with: how the compound is usually measured. */
const startUnit = (compoundId) => measuresFor(compoundId)[0]?.u ?? PEP[compoundId]?.defaultUnit;
export function blankRegimen(compoundId = '') {
    const p = PEP[compoundId];
    return {
        id: newId(), compoundId, name: '', dose: '', unit: startUnit(compoundId) ?? 'mg', freq: 'weekly', everyDays: '',
        route: p?.defaultRoute ?? 'Subcutaneous injection', prescriber: '', source: '', start: dayKey(new Date()),
        vialMg: '', diluentMl: '', notes: '',
    };
}
/** `onLog` opens the dose sheet for a peptide already tracked; `onSignIn` opens sign-in. */
export function RegimenSheet({ initial, isNew, onClose, onSaved, onLog, onSignIn }) {
    const toast = useToast();
    const { regimens, doses } = useLedger();
    const signedIn = !!useAccount().user;
    const [r, setR] = useState(initial);
    const [pick, setPick] = useState(initial.compoundId || (initial.name ? OTHER : ''));
    const [ack, setAck] = useState(false);
    // A rejected save names the field at fault: its error shows right under it, and focus moves there so the message
    // is on screen even with the sticky Save row below.
    const [err, setErr] = useState(null);
    useEffect(() => {
        if (!err)
            return;
        const el = document.getElementById(err.at);
        const target = el?.matches('input, select, textarea, button') ? el : el?.querySelector('button');
        target?.scrollIntoView({ block: 'center' });
        target?.focus({ preventScroll: true });
    }, [err]);
    const errFor = (at) => err?.at === at ? _jsx("p", { id: "r-err", className: "small field-err", role: "alert", children: err.msg }) : null;
    const invalid = (at) => err?.at === at ? { 'aria-invalid': true, 'aria-describedby': 'r-err' } : {};
    const [armed, setArmed] = useState(false);
    const firstTime = isNew && regimens.length === 0;
    const p = PEP[pick];
    const set = (k) => (e) => setR({ ...r, [k]: e.target.value });
    const { math, checks } = checkDose({ ...r, compoundId: p ? pick : '' }, r.dose, r.unit);
    const volume = isVolumeUnit(r.unit);
    // Changing the unit of a regimen that has history: offer to relabel the doses logged in the old unit.
    const oldUnitDoses = isNew || r.unit === initial.unit ? [] : doses.filter(x => x.rid === r.id && x.unit === initial.unit);
    const [relabel, setRelabel] = useState(false);
    // Adding something already in the list is usually someone looking for where to log today's dose.
    const already = isNew && pick ? regimens.find(x => !x.paused && samePeptide(x, { compoundId: p ? pick : '', name: pick === OTHER ? r.name : '' })) : undefined;
    // Choosing set weekdays starts with today's day ticked, so there's always at least one.
    const setFreq = (freq) => setR(cur => ({ ...cur, freq, weekdays: freq === 'days' && !weekdaysOf(cur).length ? [new Date().getDay()] : cur.weekdays }));
    const toggleDay = (d) => setR(cur => {
        const has = weekdaysOf(cur).includes(d);
        return { ...cur, weekdays: has ? weekdaysOf(cur).filter(x => x !== d) : [...weekdaysOf(cur), d] };
    });
    const choose = (v) => {
        setPick(v);
        const np = PEP[v];
        setR(cur => ({ ...cur, compoundId: np ? v : '', route: isNew && np?.defaultRoute ? np.defaultRoute : cur.route, unit: isNew && np ? startUnit(v) ?? cur.unit : cur.unit }));
    };
    const submit = (e) => {
        e.preventDefault();
        const out = { ...r, compoundId: p ? pick : '', name: pick === OTHER ? r.name.trim() : '', prescriber: r.prescriber.trim(), notes: r.notes.trim(), weekdays: r.freq === 'days' ? weekdaysOf(r) : undefined };
        const problem = !out.compoundId && !out.name ? [pick === OTHER ? 'r-name' : 'r-compound', 'Choose a peptide or type a name.']
            : !(Number(out.dose) > 0) ? ['r-dose', 'Enter the dose you were prescribed.']
                : out.freq === 'custom' && !(Number(out.everyDays) >= 1) ? ['r-every', 'Enter how many days between doses.']
                    : out.freq === 'days' && !weekdaysOf(out).length ? ['r-days', 'Choose at least one day of the week.']
                        : firstTime && !ack ? ['r-ack', "Please confirm you understand this log isn't medical advice."] : null;
        if (problem) {
            setErr({ at: problem[0], msg: problem[1] });
            return;
        }
        if (isNew)
            out.createdAt = new Date().toISOString();
        const relabeled = relabel ? oldUnitDoses.map(x => ({ ...x, unit: out.unit })) : [];
        if (relabeled.length)
            store.applyBatch({ doses: relabeled });
        store.saveRegimen(out);
        toast(isNew ? `Tracking ${regName(out)}.` : relabeled.length ? `Saved, and ${relabeled.length === 1 ? '1 past dose' : `${relabeled.length} past doses`} now say ${out.unit}.` : 'Saved.');
        onSaved(out);
    };
    return (_jsx(Sheet, { onClose: onClose, label: isNew ? 'Track a peptide' : 'Edit regimen', children: _jsxs("form", { className: "stack gap-4", onSubmit: submit, noValidate: true, children: [_jsxs("div", { className: "sheet-head", children: [_jsxs("div", { children: [_jsx("h2", { children: isNew ? 'Track a peptide' : `Edit ${regName(initial)}` }), _jsx("p", { className: "small muted mt-1", children: "Enter what your prescriber told you. This app doesn't suggest doses." })] }), _jsx("button", { type: "button", className: "icon-btn", onClick: onClose, "aria-label": "Close", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }) }) })] }), firstTime && configured && !signedIn && onSignIn && (_jsxs("div", { className: "alert info", role: "note", children: [_jsx("b", { children: "Have an account? Sign in first." }), _jsx("span", { children: "You're signed out, so what you add here stays on this device only. Signing in brings back the peptides, shots and weights already in your account." }), _jsx("div", { className: "mt-2", children: _jsx("button", { type: "button", className: "btn sm", onClick: onSignIn, children: "Sign in" }) })] })), _jsxs("section", { className: "tile", "aria-labelledby": "r-what-h", children: [_jsx("h3", { id: "r-what-h", className: "eyebrow", children: "Peptide" }), _jsx(CompoundPicker, { pick: pick, onPick: choose, field: invalid('r-compound') }), errFor('r-compound'), pick === OTHER && _jsxs("label", { className: "field", children: [_jsx("span", { children: "Name" }), _jsx("input", { type: "text", id: "r-name", ...invalid('r-name'), value: r.name, onChange: set('name'), maxLength: 80 })] }), errFor('r-name'), already && (_jsxs("div", { className: "alert info", role: "status", children: [_jsxs("b", { children: ["You already track ", regName(already), ": ", fmtNum(Number(already.dose), 3), " ", already.unit, ", ", freqText(already).toLowerCase(), "."] }), _jsx("span", { children: "To record a dose you just took, log it there so it stays with your history. Add it again here only for a second, separate regimen." }), onLog && _jsx("div", { className: "mt-2", children: _jsxs("button", { type: "button", className: "btn sm", onClick: () => onLog(already), children: ["Log a ", regName(already), " dose"] }) })] })), _jsx(Caution, { p: p })] }), _jsxs("section", { className: "tile lilac", "aria-labelledby": "r-dose-h", children: [_jsx("h3", { id: "r-dose-h", className: "eyebrow", style: { color: 'var(--lilac-ink)' }, children: "Prescribed" }), _jsxs("div", { className: "grid-2", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Dose" }), _jsx("input", { type: "number", id: "r-dose", ...invalid('r-dose'), step: "any", min: "0", inputMode: "decimal", value: r.dose, onChange: set('dose') })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Unit" }), _jsx("select", { id: "r-unit", value: r.unit, onChange: set('unit'), children: _jsx(UnitOptions, { compoundId: p ? pick : '' }) })] })] }), errFor('r-dose'), _jsx(UsualUnits, { compoundId: p ? pick : '', value: r.unit, onPick: u => setR({ ...r, unit: u }) }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "How it's taken" }), _jsx("select", { id: "r-route", value: r.route, onChange: set('route'), children: ROUTES.map(x => _jsx("option", { children: x }, x)) })] })] }), _jsxs("section", { className: "tile sky", "aria-labelledby": "r-when-h", children: [_jsx("h3", { id: "r-when-h", className: "eyebrow", style: { color: 'var(--sky-ink)' }, children: "Schedule" }), _jsxs("div", { className: "grid-2", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "How often" }), _jsx("select", { id: "r-freq", value: r.freq, onChange: e => setFreq(e.target.value), children: FREQS.map(f => _jsx("option", { value: f.k, children: f.label }, f.k)) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Start date" }), _jsx("input", { type: "date", id: "r-start", value: r.start, onChange: set('start') })] })] }), r.freq === 'days' && (_jsxs("div", { className: "field", children: [_jsx("span", { id: "r-days-h", children: "Which days?" }), _jsx("div", { className: "row-wrap weekdays", id: "r-days", role: "group", "aria-labelledby": "r-days-h", ...(err?.at === 'r-days' ? { 'aria-describedby': 'r-err' } : {}), children: WEEK.map(d => _jsx("button", { type: "button", className: "fchip", "aria-pressed": weekdaysOf(r).includes(d), onClick: () => toggleDay(d), children: DAY_SHORT[d] }, d)) }), errFor('r-days'), _jsx("small", { children: "For 5 days on, 2 off, pick Mon to Fri. Due days follow the calendar, so a late dose doesn't move the next one." })] })), r.freq === 'custom' && _jsxs("label", { className: "field", children: [_jsx("span", { children: "Every how many days?" }), _jsx("input", { type: "number", id: "r-every", ...invalid('r-every'), min: "1", step: "1", value: r.everyDays, onChange: set('everyDays') })] }), errFor('r-every')] }), _jsxs("section", { className: "tile", "aria-labelledby": "r-src-h", children: [_jsx("h3", { id: "r-src-h", className: "eyebrow", children: "Source" }), _jsxs("div", { className: "grid-2", children: [_jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Prescribed by ", _jsx("small", { children: "(optional)" })] }), _jsx("input", { type: "text", id: "r-prescriber", value: r.prescriber, onChange: set('prescriber'), maxLength: 80, placeholder: "Clinician or clinic" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Where it comes from" }), _jsxs("select", { id: "r-source", value: r.source, onChange: set('source'), children: [_jsx("option", { value: "", children: "Choose\u2026" }), SOURCES.map(s => _jsx("option", { children: s }, s))] })] })] }), r.source === UNREGULATED_SOURCE && (_jsxs("div", { className: "alert warn", children: [_jsx("b", { children: "Products from online vendors aren't regulated." }), _jsx("span", { children: "Independent tests have found wrong amounts, impurities, and bacterial endotoxin in \"research use only\" vials. A licensed pharmacy is the safer route when one is available." })] }))] }), _jsx("div", { className: "tile lilac", children: _jsxs("details", { open: !!r.vialMg || isVolumeUnit(r.unit) || checks.length > 0, children: [_jsx("summary", { className: "small", style: { cursor: 'pointer' }, children: volume ? _jsxs(_Fragment, { children: [_jsx("b", { children: "Vial details" }), " Add them to see how much drug each dose is"] }) : _jsxs(_Fragment, { children: [_jsx("b", { children: "Mixing from powder?" }), " Add vial details to see units per dose"] }) }), _jsxs("div", { className: "grid-2 mt-3", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: volume ? 'Drug in vial (mg)' : 'Powder in vial (mg)' }), _jsx("input", { type: "number", id: "r-vial", step: "any", min: "0", value: r.vialMg, onChange: set('vialMg') })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: volume ? 'Liquid in vial (mL)' : 'Water added (mL)' }), _jsx("input", { type: "number", id: "r-ml", step: "any", min: "0", value: r.diluentMl, onChange: set('diluentMl') })] })] }), _jsx("p", { className: "xsmall muted mt-2", children: "Measured the water with an insulin syringe? 100 units = 1 mL." }), checks.map(c => (_jsxs("div", { className: "alert danger mt-3", role: "alert", children: [_jsx("b", { children: c.title }), _jsx("span", { children: c.body }), c.fix && (_jsx("div", { className: "mt-2", children: _jsx("button", { type: "button", className: "btn sm", onClick: () => {
                                                setR(cur => ({ ...cur, ...c.fix.set }));
                                                // Doses saved as mg that were really syringe units are the same mix-up, so fix them too by default.
                                                if (c.fix.set.unit === SYRINGE_UNITS)
                                                    setRelabel(true);
                                            }, children: c.fix.label }) }))] }, c.title))), _jsx("p", { className: "small muted mt-2", children: math && volume
                                    ? _jsxs(_Fragment, { children: ["Concentration ", fmtNum(math.conc, 3), " mg/mL. Each ", r.unit === 'mL' ? `${fmtNum(Number(r.dose), 3)} mL dose` : `${fmtNum(Number(r.dose), 3)}-unit dose (${fmtNum(math.vol, 3)} mL)`, " is ", _jsx("b", { className: "mono", children: drugAmount(math.doseMg, p?.defaultUnit) }), ", about ", fmtNum(Math.floor(math.perVial), 0), " doses per vial."] })
                                    : math ? _jsxs(_Fragment, { children: ["Concentration ", fmtNum(math.conc, 3), " mg/mL. Each dose is ", _jsxs("b", { className: "mono", children: [fmtNum(math.units, 1), " units"] }), " (", fmtNum(math.vol, 3), " mL) on a U-100 syringe, about ", fmtNum(Math.floor(math.perVial), 0), " doses per vial."] })
                                        : checks.length ? 'Fix the numbers above to see the dose math.'
                                            : volume ? 'Enter the mg of drug in the vial and the mL of liquid in it. If you mixed it yourself, that\'s the powder and the water you added.'
                                                : 'Enter the dose in mcg or mg plus the vial details.' })] }) }), oldUnitDoses.length > 0 && (_jsx("div", { className: "checks block", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", id: "r-relabel", checked: relabel, onChange: e => setRelabel(e.target.checked) }), " Also change the ", oldUnitDoses.length === 1 ? 'dose' : `${oldUnitDoses.length} doses`, " you logged in ", initial.unit, " to ", r.unit, ". Only if they were saved in the wrong unit; the amounts stay the same."] }) })), _jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Notes ", _jsx("small", { children: "(optional)" })] }), _jsx("textarea", { id: "r-notes", maxLength: 500, value: r.notes, onChange: set('notes') })] }), firstTime && (_jsx("div", { className: "checks block", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", id: "r-ack", ...invalid('r-ack'), checked: ack, onChange: e => setAck(e.target.checked) }), " I understand this log isn't medical advice and won't tell me what dose to take."] }) })), errFor('r-ack'), _jsxs("div", { className: "sheet-foot", children: [!isNew && (_jsx("button", { type: "button", className: `btn ${armed ? 'danger' : 'quiet'}`, onClick: () => { if (armed) {
                                store.deleteRegimen(r.id);
                                toast('Removed. Logged doses stay in your history.');
                                onSaved();
                            }
                            else
                                setArmed(true); }, children: armed ? 'Delete it? Tap again' : 'Delete' })), _jsx("button", { type: "button", className: "btn ghost", onClick: onClose, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn", children: isNew ? 'Start tracking' : 'Save' })] })] }) }));
}
