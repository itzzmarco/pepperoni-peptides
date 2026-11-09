import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { fmtShort } from '../lib/format';
/**
 * Line with area wash, end label, and a tooltip for the picked point. The panel title names the series.
 * An optional second series (`points2`) draws as a second line in another color, without the wash.
 * Pointer: touching or hovering the chart and sliding along it snaps the tip to the nearest point (vertical drags still scroll).
 * Keyboard: the chart is one tab stop; arrow keys (and Home/End) step through every point in time order and
 * show the same tip, which a live region reads out. A visually hidden list carries every plotted value.
 */
export function LineChart({ points, points2 = [], y0, y1, ticks, x0, x1, label, fmt = String }) {
    // Draw at the container's real pixel width so labels stay at text size instead of scaling with the SVG.
    const wrap = useRef(null);
    const [W, setW] = useState(520);
    useLayoutEffect(() => {
        const el = wrap.current;
        if (!el)
            return;
        const measure = () => setW(Math.max(240, Math.round(el.clientWidth)));
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const H = 160, L = 30, R = 12, T = 14, B = 24;
    const byX = (a, b) => a.x.getTime() - b.x.getTime();
    const pts = points.slice().sort(byX);
    const pts2 = points2.slice().sort(byX);
    const xs = [...pts, ...pts2].map(p => p.x.getTime());
    const lo = x0 ?? Math.min(...xs), hi = x1 ?? Math.max(...xs);
    const sx = (x) => L + (hi === lo ? (W - L - R) / 2 : ((x - lo) / (hi - lo)) * (W - L - R));
    const sy = (y) => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
    const path = (ps) => ps.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x.getTime()).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ');
    const d = path(pts);
    const last = pts[pts.length - 1];
    const lx = sx(last.x.getTime());
    const last2 = pts2[pts2.length - 1];
    // Every point of both series in time order: the keyboard walks this list, the hidden list reads it out.
    const all = [...pts, ...pts2].sort(byX);
    const [sel, setSel] = useState(null);
    const picked = sel != null ? all[Math.min(sel, all.length - 1)] : undefined;
    // The tip wraps inside the chart and is kept whole by its measured width, so a long readout never leaves the screen.
    const tipRef = useRef(null);
    const [tipW, setTipW] = useState(0);
    useLayoutEffect(() => { setTipW(tipRef.current?.offsetWidth ?? 0); }, [picked?.tip, W]);
    const fromPointer = (e) => {
        const b = e.currentTarget.getBoundingClientRect();
        if (!b.width)
            return;
        const px = ((e.clientX - b.left) / b.width) * W, py = ((e.clientY - b.top) / b.height) * H;
        // Nearest in time first; where both series share a day, the one nearer the finger.
        let best = 0, bestD = Infinity;
        all.forEach((p, i) => {
            const d = (sx(p.x.getTime()) - px) ** 2 + ((sy(p.y) - py) / 2) ** 2;
            if (d < bestD) {
                bestD = d;
                best = i;
            }
        });
        setSel(best);
    };
    const onKey = (e) => {
        const n = all.length;
        const i = sel ?? n;
        const next = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? Math.min(n - 1, sel == null ? n - 1 : i + 1)
            : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? Math.max(0, i - 1)
                : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
        if (next == null)
            return;
        e.preventDefault();
        setSel(next);
    };
    const dots = (ps, cls) => ps.map((p, i) => {
        const isLast = i === ps.length - 1;
        return (isLast || ps.length < 12) && _jsx("circle", { className: `pt ${cls}`, cx: sx(p.x.getTime()), cy: sy(p.y), r: isLast ? 5 : 4 }, `${cls}${i}`);
    });
    const endLabel = (p, cls, nudge) => {
        const x = sx(p.x.getTime());
        return (_jsx("text", { className: `end ${cls}`, x: Math.min(x + 8, W - R), y: sy(p.y) + nudge, textAnchor: x > W - 60 ? 'end' : 'start', style: { fontWeight: 600 }, children: fmt(p.y) }));
    };
    // Keep the two end labels from landing on each other.
    const close = last2 && Math.abs(sy(last2.y) - sy(last.y)) < 16;
    const above = !last2 || sy(last.y) <= sy(last2.y);
    return (_jsxs("div", { className: "chart-wrap", ref: wrap, tabIndex: 0, role: "group", "aria-label": `${label}. Arrow keys step through the points.`, onKeyDown: onKey, onBlur: () => setSel(null), onPointerDown: fromPointer, onPointerMove: fromPointer, onPointerLeave: e => { if (e.pointerType === 'mouse')
            setSel(null); }, children: [_jsxs("svg", { className: "chart", width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": label, children: [ticks.map(t => (_jsxs("g", { children: [_jsx("line", { className: "grid", x1: L, x2: W - R, y1: sy(t), y2: sy(t) }), _jsx("text", { x: L - 6, y: sy(t) + 4, textAnchor: "end", children: fmt(t) })] }, t))), _jsx("text", { x: L, y: H - 6, children: fmtShort(new Date(lo)) }), _jsx("text", { x: W - R, y: H - 6, textAnchor: "end", children: fmtShort(new Date(hi)) }), pts.length > 1 && (_jsxs(_Fragment, { children: [_jsx("path", { className: "area", d: `${d} L${lx.toFixed(1)} ${sy(y0)} L${sx(pts[0].x.getTime()).toFixed(1)} ${sy(y0)} Z` }), _jsx("path", { className: "ln draw", pathLength: 1, d: d })] })), pts2.length > 1 && _jsx("path", { className: "ln two draw", pathLength: 1, d: path(pts2) }), dots(pts2, 'two'), dots(pts, ''), endLabel(last, '', above || !close ? -8 : 18), last2 && endLabel(last2, 'two', above && close ? 18 : -8), picked && _jsx("circle", { className: "pt-focus", cx: sx(picked.x.getTime()), cy: sy(picked.y), r: 8 })] }), picked && (_jsx("div", { className: "tip", ref: tipRef, "aria-hidden": "true", style: { left: `clamp(${tipW / 2}px, ${(sx(picked.x.getTime()) / W) * 100}%, calc(100% - ${tipW / 2}px))`, top: `${(sy(picked.y) / H) * 100}%` }, children: picked.tip })), _jsx("span", { className: "sr-only", "aria-live": "polite", children: picked?.tip ?? '' }), _jsx("ul", { className: "sr-only", children: all.map((p, i) => _jsx("li", { children: p.tip }, i)) })] }));
}
