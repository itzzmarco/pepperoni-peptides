import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ICON = {
    today: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    trends: 'M3 3v18h18M7 15l4-4 3 3 5-6',
    learn: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
    peptides: 'M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2M8.5 2h7M14.5 16h-5',
};
/** Grid column of each tab. Column 2 is the log button, so the indicator never lands there. */
const COL = { today: 0, trends: 1, learn: 3, peptides: 4 };
function Tab({ k, label, current, exact }) {
    const on = current === k;
    // "page" only when this tab is the screen itself; on a screen inside its section (Dose math under Learn) it marks the section.
    return (_jsxs("a", { href: `#${k}`, "aria-current": on ? (exact ? 'page' : 'true') : undefined, children: [_jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: on ? 2.4 : 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: ICON[k] }) }), label] }));
}
/** Floating glass tab bar; the dark button in the middle logs the next due dose. A pill slides to the current tab.
 *  `exact` is false on a screen that belongs to the tab's section without being the tab's own page. */
export function TabBar({ current, exact, onLog, logLabel, inert }) {
    const col = COL[current];
    // One pill stays mounted and slides to every tab. Its track is masked out over the log column, so crossing sides the
    // pill fades out around the log button instead of showing behind it, and never comes to rest there.
    return (_jsxs("nav", { className: "tabbar", "aria-label": "Main", inert: inert, children: [col != null && _jsx("span", { className: "tab-track", children: _jsx("span", { className: "tab-ind", "aria-hidden": "true", style: { ['--k']: col } }) }), _jsx(Tab, { k: "today", label: "Today", current: current, exact: exact }), _jsx(Tab, { k: "trends", label: "Trends", current: current, exact: exact }), _jsx("button", { className: "log", type: "button", onClick: onLog, "aria-label": logLabel, children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M12 5v14M5 12h14" }) }) }), _jsx(Tab, { k: "learn", label: "Learn", current: current, exact: exact }), _jsx(Tab, { k: "peptides", label: "Peptides", current: current, exact: exact })] }));
}
