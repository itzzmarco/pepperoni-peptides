import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { UNITS } from '../data/options';
import { measuresFor } from '../data/measures';
import { PEP } from '../data/peptides';
/** Options for a unit <select>: the compound's usual units first, then the rest. */
export function UnitOptions({ compoundId }) {
    const usual = measuresFor(compoundId).map(m => m.u);
    if (!usual.length)
        return _jsx(_Fragment, { children: UNITS.map(u => _jsx("option", { children: u }, u)) });
    return (_jsxs(_Fragment, { children: [_jsx("optgroup", { label: `Usual for ${PEP[compoundId]?.name ?? 'this'}`, children: usual.map(u => _jsx("option", { children: u }, u)) }), _jsx("optgroup", { label: "Other units", children: UNITS.filter(u => !usual.includes(u)).map(u => _jsx("option", { children: u }, u)) })] }));
}
/** One-tap choices showing how a compound is usually measured, and which product form each goes with. */
export function UsualUnits({ compoundId, value, onPick }) {
    const usual = measuresFor(compoundId);
    if (!usual.length)
        return null;
    return (_jsxs("div", { className: "usual-units", children: [_jsxs("span", { className: "xsmall muted", id: "usual-units-h", children: ["How ", PEP[compoundId]?.name ?? 'it', " is usually measured"] }), _jsx("div", { className: "row-wrap", role: "group", "aria-labelledby": "usual-units-h", children: usual.map(m => (_jsxs("button", { type: "button", className: "fchip", "aria-pressed": value === m.u, onClick: () => onPick(m.u), children: [_jsx("b", { children: m.u }), _jsx("small", { children: m.how })] }, m.u))) })] }));
}
