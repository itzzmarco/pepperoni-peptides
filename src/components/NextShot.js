import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { regimenStatus } from '../lib/schedule';
import { checkRegimen } from '../lib/vial';
import { SYRINGE_UNITS } from '../lib/doseMath';
import { fmtNum } from '../lib/format';
import { SITES, nextSite, siteLabel } from '../lib/sites';
import { MiniClock } from './BellyClock';
/** Where each site sits on the small figure (viewBox 200 x 300, same as the body map). Buttocks are shown at the hips. */
const POS = {
    ...Object.fromEntries(SITES.filter(s => 'x' in s).map(s => [s.k, [s.x * 2, s.y * 3]])),
    'glute-r': [84, 178],
    'glute-l': [116, 178],
};
/** A small front-facing figure with one spot filled in: the next place to inject. */
export function MiniBody({ site, height = 76 }) {
    const p = POS[site];
    return (_jsxs("svg", { className: "minibody", width: (height * 2) / 3, height: height, viewBox: "0 0 200 300", "aria-hidden": "true", children: [_jsxs("g", { className: "fig", children: [_jsx("circle", { cx: "100", cy: "28", r: "18" }), _jsx("rect", { x: "92", y: "44", width: "16", height: "12", rx: "3" }), _jsx("rect", { x: "36", y: "58", width: "20", height: "104", rx: "10", transform: "rotate(8 46 58)" }), _jsx("rect", { x: "144", y: "58", width: "20", height: "104", rx: "10", transform: "rotate(-8 154 58)" }), _jsx("path", { d: "M62 56 Q100 48 138 56 L134 168 Q100 178 66 168 Z" }), _jsx("rect", { x: "69", y: "166", width: "29", height: "128", rx: "13" }), _jsx("rect", { x: "102", y: "166", width: "29", height: "128", rx: "13" })] }), p && _jsx("circle", { className: "next pop", cx: p[0], cy: p[1], r: "17", style: { ['--i']: 4 } }), p && site.startsWith('glute-') && _jsx("circle", { className: "behind", cx: p[0], cy: p[1], r: "27" })] }));
}
/** The clock face or the figure for a suggested spot. */
export function SiteFigure({ s, size = 76 }) {
    return s.hour ? _jsx(MiniClock, { hour: s.hour, size: size }) : _jsx(MiniBody, { site: s.site, height: size });
}
/** When this regimen's next dose is, in a few words. */
export function whenNext(r, doses, now = new Date()) {
    const st = regimenStatus(r, doses, now);
    if (st.s === 'ok')
        return st.text.startsWith('Next: ') ? st.text.slice(6).replace(/^t/, 'T') : st.text;
    if (st.s === 'due' && !st.last)
        return 'Due now';
    return st.text;
}
/** The amount for one dose, with the syringe draw when it's measured some other way. */
export function doseText(r) {
    const { math } = checkRegimen(r);
    const amount = `${fmtNum(Number(r.dose), 3)} ${r.unit}`;
    return math && r.unit !== SYRINGE_UNITS && r.unit !== 'mL' ? `${amount} · draw ${fmtNum(math.units, 1)} units` : amount;
}
/**
 * This peptide's next shot at a glance: the spot on a small figure (or the belly clock), the day, and
 * the amount. Nothing for doses that aren't injected or regimens that are paused.
 */
export function NextShot({ r, doses }) {
    const s = r.paused ? null : nextSite(r, doses);
    if (!s)
        return null;
    return (_jsxs("div", { className: "nextshot", "aria-label": `Next shot: ${siteLabel(s.site, r.route)}, ${whenNext(r, doses)}`, children: [_jsx(SiteFigure, { s: s, size: 72 }), _jsxs("span", { className: "stack gap-1", style: { minWidth: 0 }, children: [_jsxs("span", { className: "label", children: ["Next shot \u00B7 ", whenNext(r, doses)] }), _jsx("b", { style: { fontSize: 'var(--fs-lg)', lineHeight: 1.25 }, children: s.hour ? `Belly, ${s.hour} o'clock` : siteLabel(s.site, r.route) }), _jsxs("span", { className: "small", style: { color: 'var(--ink-2)' }, children: [doseText(r), " \u00B7 ", s.why] })] })] }));
}
