import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LEGAL, TIERS } from '../data/reference';
export function TierChip({ t }) {
    return (_jsxs("span", { className: "chip tier", "data-t": t, children: [_jsx("span", { className: "dot" }), "T", t, " \u00B7 ", TIERS[t].label] }));
}
/** Five rungs; more filled rungs means stronger evidence. Always paired with a text label nearby. */
export function Ladder({ t, wide }) {
    return (_jsxs("span", { className: `ladder${wide ? ' wide' : ''}`, "data-t": t, role: "img", "aria-label": `Evidence tier ${t} of 5: ${TIERS[t].label}`, children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }));
}
export function LegalChip({ k }) {
    const l = LEGAL[k];
    if (!l)
        return null;
    return (_jsx("span", { className: "chip legal", "data-l": k, title: l.long, children: l.label }));
}
export function WadaChip({ w }) {
    if (!w)
        return null;
    return (_jsxs("span", { className: "chip wada", title: "World Anti-Doping Agency status", children: ["WADA: ", w] }));
}
export function SeqStrip({ p }) {
    if (!p.seq)
        return null;
    const toks = Array.isArray(p.seq) ? p.seq : p.seq.split('');
    if (toks.length > 44)
        return _jsx("div", { className: "seq-text", title: "Amino-acid sequence", children: toks.join('') });
    return (_jsx("div", { className: "seq", "aria-label": `Sequence ${toks.join(' ')}`, children: toks.map((t, i) => (_jsx("span", { className: t.length > 1 ? 'mod' : '', children: t }, i))) }));
}
