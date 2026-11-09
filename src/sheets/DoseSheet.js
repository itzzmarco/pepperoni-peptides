import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { store, useLedger } from '../lib/store';
import { freqText } from '../lib/schedule';
import { drugAmount, isVolumeUnit } from '../lib/doseMath';
import { checkDose } from '../lib/vial';
import { DAY, fmtNum, fmtTime, newId, toLocalInput } from '../lib/format';
import { BELLY, bellyHour, lastUsedBySite, nextBellyHour, nextSite, siteLabel, sitePlan } from '../lib/sites';
import { INJECTABLE, ROUTES } from '../data/options';
import { PEP } from '../data/peptides';
import { BodyMap } from '../components/BodyMap';
import { BellyClock } from '../components/BellyClock';
import { Sheet } from '../components/Sheet';
import { Syringe } from '../components/Syringe';
import { UnitOptions } from '../components/UnitPicker';
import { useToast } from '../components/Toast';
import { regName } from '../views/PeptidesView';
const blank = (r, site = '') => ({ amount: r.dose, unit: r.unit, at: toLocalInput(new Date()), route: r.route, site, notes: '' });
const ago = (t) => {
    const d = Math.round((Date.now() - t.getTime()) / DAY);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};
/** `onFix` opens the regimen's settings, for vial details that don't add up. */
export function DoseSheet({ r: initial, onClose, onFix }) {
    const toast = useToast();
    const { doses, regimens } = useLedger();
    const active = regimens.filter(x => !x.paused);
    const [r, setR] = useState(initial);
    // This peptide's next spot in its own rotation starts out picked. `auto` stays true until the person taps a spot.
    const [first] = useState(() => nextSite(initial, doses));
    const [d, setD] = useState(() => blank(initial, first?.site));
    const [auto, setAuto] = useState(!!first);
    const last = useMemo(() => lastUsedBySite(doses), [doses]);
    // This regimen's belly-clock history, newest first.
    const bellyDoses = useMemo(() => doses.filter(x => x.rid === r.id && bellyHour(x.site)).slice(0, 3), [doses, r.id]);
    const recent = bellyDoses.map(x => bellyHour(x.site));
    const [view, setView] = useState(first?.hour ? 'clock' : 'body');
    const next = nextBellyHour(recent[0] ?? null, last);
    const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
    /** Picks the suggested spot for `x` given this way, and the view it's shown in. */
    const suggest = (x, route, prefer) => {
        const s = nextSite({ ...x, route }, doses, prefer);
        setAuto(!!s);
        if (!prefer)
            setView(s?.hour ? 'clock' : 'body');
        return s?.site ?? '';
    };
    const setRoute = (e) => {
        const route = e.target.value;
        setD({ ...d, route, site: auto || !d.site ? suggest(r, route) : d.site });
    };
    const showView = (v) => {
        setView(v);
        if (auto)
            setD({ ...d, site: suggest(r, d.route, v === 'clock' ? 'clock' : 'map') });
    };
    const pickSite = (site) => { setAuto(false); setD({ ...d, site }); };
    const amt = Number(d.amount);
    const unitDiffers = d.unit !== r.unit;
    const amountDiffers = !unitDiffers && Number(r.dose) > 0 && amt > 0 && Math.abs(amt / Number(r.dose) - 1) > 0.01;
    const injectable = INJECTABLE.has(d.route);
    // Sites that fit how it's given (under the skin or into the muscle) and the drug's label.
    const plan = sitePlan(d.route, r.compoundId);
    const clock = view === 'clock' && !!plan?.belly;
    const siteFits = !d.site || !plan || plan.sites.includes(d.site) || (plan.belly && !!bellyHour(d.site));
    const { math, checks } = checkDose(r, d.amount, d.unit);
    const hour = bellyHour(d.site);
    const switchTo = (x) => {
        setR(x);
        setD(blank(x, suggest(x, x.route)));
    };
    const submit = (e) => {
        e.preventDefault();
        const at = new Date(d.at || Date.now());
        if (isNaN(at.getTime())) {
            toast('Enter a valid date and time.');
            return;
        }
        if (!(amt > 0)) {
            toast('Enter the amount you took.');
            return;
        }
        store.addDose({ id: newId(), rid: r.id, name: regName(r), at: at.toISOString(), amount: d.amount, unit: d.unit, route: d.route, site: injectable && siteFits ? d.site : '', notes: d.notes.trim() });
        toast(`Logged ${regName(r)} at ${fmtTime(at)}.`);
        onClose();
    };
    // Why the picked spot was suggested, for this peptide and this view.
    const why = auto && d.site ? nextSite({ ...r, route: d.route }, doses, clock ? 'clock' : 'map')?.why ?? '' : '';
    let siteNote = '';
    if (auto && why) {
        siteNote = `${why}. Tap another spot if you use a different one.`;
    }
    else if (hour) {
        const ri = recent.indexOf(hour);
        siteNote = hour === next ? `One hour clockwise from ${recent[0] ?? 12} o'clock.` : ri >= 0 ? `Used ${ago(new Date(bellyDoses[ri].at))}. Try ${next} o'clock, the next hour clockwise.` : 'Not used recently.';
    }
    else if (d.site) {
        const t = last[d.site];
        siteNote = t && Date.now() - t.getTime() < 3 * DAY ? 'Used in the last 3 days. Try a different spot to let it recover.' : t ? `Last used ${ago(t)}.` : 'Not used yet.';
    }
    return (_jsx(Sheet, { onClose: onClose, label: `Log ${regName(r)}`, children: _jsxs("form", { className: "stack gap-4", onSubmit: submit, noValidate: true, children: [_jsxs("div", { className: "sheet-head", children: [_jsxs("div", { className: "stack gap-1", children: [_jsx("span", { className: "eyebrow", children: "Log a dose" }), _jsx("h2", { style: { fontSize: 'var(--fs-2xl)' }, children: regName(r) })] }), _jsx("button", { type: "button", className: "icon-btn", onClick: onClose, "aria-label": "Close", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }) }) })] }), active.length > 1 && (_jsx("div", { className: "pick", role: "group", "aria-label": "Peptide", style: { margin: '0 -16px', padding: '0 16px 2px' }, children: active.map(x => _jsx("button", { type: "button", className: "fchip", "aria-pressed": x.id === r.id, onClick: () => x.id !== r.id && switchTo(x), children: regName(x) }, x.id)) })), _jsxs("section", { className: "tile dark", "aria-label": "Prescribed dose", children: [_jsxs("div", { className: "spread", children: [_jsx("span", { className: "eyebrow", children: "Prescribed" }), _jsx("span", { className: "sub", children: freqText(r) })] }), _jsxs("span", { className: "stat", children: [fmtNum(Number(r.dose), 3), _jsxs("small", { children: [" ", r.unit] })] }), math && injectable && (_jsxs("div", { className: "white-inset stack gap-2", children: [isVolumeUnit(d.unit)
                                    ? _jsxs("p", { className: "small", children: ["That's ", _jsx("b", { className: "mono", style: { color: 'var(--lilac-ink)' }, children: drugAmount(math.doseMg, PEP[r.compoundId]?.defaultUnit) }), " (", fmtNum(math.vol, 2), " mL) from a vial with ", fmtNum(Number(r.vialMg)), " mg in ", fmtNum(Number(r.diluentMl)), " mL."] })
                                    : _jsxs("p", { className: "small", children: ["Draw to ", _jsxs("b", { className: "mono", style: { color: 'var(--lilac-ink)' }, children: [fmtNum(math.units, 1), " units"] }), " (", fmtNum(math.vol, 2), " mL) on a U-100 syringe. ", fmtNum(Number(r.vialMg)), " mg vial + ", fmtNum(Number(r.diluentMl)), " mL water."] }), _jsx("div", { className: "syringe-wrap", children: _jsx(Syringe, { units: math.units, cap: math.units > 50 ? 100 : 50 }) }), _jsx("a", { className: "small", href: "#calculator", children: "How this is calculated" })] })), checks.length > 0 && injectable && (_jsxs("div", { className: "alert danger", role: "alert", children: [_jsx("b", { children: "These numbers don't add up, so there's no draw to show." }), checks.map(c => _jsxs("span", { children: [c.title, " ", c.body] }, c.title)), onFix && _jsx("div", { className: "mt-2", children: _jsxs("button", { type: "button", className: "btn sm", onClick: () => onFix(r), children: ["Fix ", regName(r), "'s details"] }) })] }))] }), _jsxs("section", { className: "tile", "aria-label": "What you took", children: [_jsxs("div", { className: "grid-3", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Amount" }), _jsx("input", { type: "number", id: "d-amount", step: "any", min: "0", inputMode: "decimal", value: d.amount, onChange: set('amount') })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Unit" }), _jsx("select", { id: "d-unit", value: d.unit, onChange: set('unit'), children: _jsx(UnitOptions, { compoundId: r.compoundId }) })] })] }), (amountDiffers || unitDiffers) && (_jsx("p", { className: "alert warn", role: "status", children: unitDiffers
                                ? `The unit differs from your saved regimen (${r.unit}). Double-check mcg vs mg.`
                                : `This differs from your saved dose (${fmtNum(Number(r.dose), 3)} ${r.unit}). Only change a dose on your prescriber's advice.` })), _jsxs("div", { className: "grid-2", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "When" }), _jsx("input", { type: "datetime-local", id: "d-at", value: d.at, onChange: set('at') })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "How it was taken" }), _jsx("select", { id: "d-route", value: d.route, onChange: setRoute, children: ROUTES.map(x => _jsx("option", { children: x }, x)) })] })] })] }), injectable && plan && (_jsxs("section", { className: "tile sky", "aria-labelledby": "site-h", children: [_jsx("h3", { id: "site-h", className: "eyebrow", style: { color: 'var(--sky-ink)' }, children: "Injection site" }), plan.belly && (_jsxs("div", { className: "seg", role: "group", "aria-label": "Site view", children: [_jsx("button", { type: "button", "aria-pressed": clock, onClick: () => showView('clock'), children: "Belly clock" }), _jsx("button", { type: "button", "aria-pressed": !clock, onClick: () => showView('body'), children: "Body map" })] })), clock ? (_jsxs(_Fragment, { children: [_jsx(BellyClock, { selected: hour, next: next, recent: recent, onSelect: h => pickSite(hour === h ? '' : `belly-${h}`) }, r.id), _jsx("p", { className: "small", style: { color: 'var(--ink-2)' }, children: "Looking down at your belly, 12 is toward your chest. Move one hour clockwise each injection and stay about 2 in (5 cm) from your navel, or use the spacing your nurse gave you." }), _jsxs("div", { className: "site-legend", style: { justifyContent: 'flex-start' }, children: [_jsxs("span", { children: [_jsx("i", { style: { background: 'var(--sky-ink)' } }), "Selected"] }), _jsxs("span", { children: [_jsx("i", { style: { boxShadow: 'inset 0 0 0 2px var(--sky-ink)', background: 'var(--surface)' } }), "Next clockwise"] }), _jsxs("span", { children: [_jsx("i", { style: { background: 'var(--recent-1)' } }), "Used recently"] })] }), bellyDoses.length > 0 && (_jsxs("div", { className: "recent", children: [_jsx("span", { className: "xsmall", style: { background: 'none', padding: 0, color: 'var(--ink-2)' }, children: "Recent" }), bellyDoses.map(x => _jsxs("span", { children: [bellyHour(x.site), " o'clock \u00B7 ", ago(new Date(x.at))] }, x.id))] }))] })) : (_jsx(BodyMap, { selected: hour ? '' : d.site, onSelect: pickSite, last: last, plan: plan, route: d.route, suggested: nextSite({ ...r, route: d.route }, doses, 'map')?.site })), _jsxs("div", { style: { borderTop: '1px solid color-mix(in srgb, var(--sky-ink) 15%, transparent)', paddingTop: 12 }, children: [_jsxs("p", { className: "spread gap-2", style: { fontWeight: 600, fontSize: 'var(--fs-lg)', justifyContent: 'flex-start' }, children: [d.site && siteFits ? siteLabel(d.site, d.route) : clock ? `Suggested: ${BELLY.find(b => b.h === next).label}` : 'Tap where you injected', auto && d.site && siteFits && _jsx("span", { className: "chip", style: { background: 'var(--surface)', color: 'var(--sky-ink)' }, children: "Next in rotation" })] }), _jsx("p", { className: "small", style: { color: siteNote.startsWith('Used') ? 'var(--peach-ink)' : 'var(--ink-2)' }, children: d.site && siteFits ? siteNote : clock ? (recent[0] ? `One hour clockwise from ${recent[0]} o'clock. Tap the spot you used.` : 'Start anywhere, then move one hour clockwise each time.') : 'Optional, but it powers site rotation.' })] })] })), _jsxs("label", { className: "field tile gap-2", children: [_jsxs("span", { children: ["Notes ", _jsx("small", { children: "(optional)" })] }), _jsx("input", { type: "text", id: "d-notes", maxLength: 200, placeholder: "e.g. new vial, mild sting", value: d.notes, onChange: set('notes') })] }), _jsxs("div", { className: "sheet-foot", children: [_jsx("button", { type: "button", className: "btn ghost", onClick: onClose, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn", children: "Save dose" })] })] }) }));
}
