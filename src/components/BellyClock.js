import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BELLY } from '../lib/sites';
const C = 130, R = 104;
const at = (h, r, nudge = 0) => {
    const deg = (h % 12) * 30 + nudge, a = (deg * Math.PI) / 180;
    return { x: C + r * Math.sin(a), y: C - r * Math.cos(a), deg };
};
/** Spot positions as a share of the face, so the clock can shrink to fit a narrow card. */
const pct = (v) => `${((v / (2 * C)) * 100).toFixed(2)}%`;
/**
 * Twelve injection spots around the navel, read like a clock with 12 toward the chest. The arrow runs
 * clockwise from the last spot this regimen used to the suggested next one.
 */
export function BellyClock({ selected, next, recent, onSelect }) {
    const last = recent[0];
    const p0 = last ? at(last, 74, 5) : null, p1 = at(next, 74, -7);
    return (_jsxs("div", { className: "clock", role: "group", "aria-label": "Belly clock injection sites", children: [_jsxs("svg", { width: "100%", height: "100%", viewBox: "0 0 260 260", "aria-hidden": "true", children: [_jsx("circle", { className: "face", cx: C, cy: C, r: "128" }), _jsx("circle", { className: "ring", cx: C, cy: C, r: "74" }), _jsx("circle", { className: "zone", cx: C, cy: C, r: "40" }), _jsx("text", { x: C, y: "103", textAnchor: "middle", children: "~2 in" }), _jsx("circle", { className: "navel", cx: C, cy: C, r: "7" }), _jsx("text", { x: C, y: "152", textAnchor: "middle", children: "Navel" }), p0 && last !== next && (_jsxs("g", { children: [_jsx("path", { className: "arc draw", pathLength: 1, d: `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A 74 74 0 ${((next - last + 12) % 12) > 6 ? 1 : 0} 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}` }), _jsx("polygon", { className: "tipmark", points: "-4,-6 7,0 -4,6", transform: `translate(${p1.x.toFixed(1)} ${p1.y.toFixed(1)}) rotate(${p1.deg})` })] }, `${last}-${next}`))] }), BELLY.map(({ h, k }, i) => {
                const p = at(h, R), rank = recent.indexOf(h) + 1;
                return (_jsx("button", { type: "button", className: "hour pop", style: { left: pct(p.x), top: pct(p.y), ['--i']: i }, "data-recent": rank > 0 && rank <= 3 ? rank : undefined, "data-next": h === next && selected !== h ? true : undefined, "aria-pressed": selected === h, onClick: () => onSelect(h), "aria-label": `${h} o'clock${rank === 1 ? ', your last spot' : rank > 1 ? ', used recently' : ''}${h === next ? ', next clockwise' : ''}`, children: h }, k));
            })] }));
}
/** A small read-only clock face for the Today tile, with the suggested hour filled in. */
export function MiniClock({ hour, size = 72 }) {
    const dot = (h) => {
        const a = ((h % 12) * Math.PI) / 6;
        return { cx: 27 + 20 * Math.sin(a), cy: 27 - 20 * Math.cos(a) };
    };
    return (_jsxs("svg", { className: "miniclock", width: size, height: size, viewBox: "0 0 54 54", "aria-hidden": "true", children: [_jsx("circle", { className: "face", cx: "27", cy: "27", r: "26" }), BELLY.filter(b => b.h !== hour).map(b => _jsx("circle", { className: "h", r: "3", ...dot(b.h) }, b.h)), _jsx("circle", { className: "navel", cx: "27", cy: "27", r: "3" }), _jsx("circle", { className: "next pop", r: "5", ...dot(hour), style: { ['--i']: 6 } })] }));
}
