import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PEPTIDES } from '../data/peptides';
import { AS_OF, FAMILIES, LEGAL, TIERS } from '../data/reference';
import { fmtNum } from '../lib/format';
import { Ladder, LegalChip, TierChip } from '../components/Chips';
import { FamilyGlyph } from '../components/FamilyGlyph';
import { IlloSearch } from '../components/Illustration';
import { prefersReducedMotion, viewTransition } from '../components/Motion';
const TIER_LIST = [1, 2, 3, 4, 5];
const FILTER_KEY = 'pl-lib';
/** Kept in memory for this visit only (never stored): the query, and where the page was when a profile was opened,
    so coming back from a profile shows the same results at the same place. */
const back = { q: '', y: null };
function loadFilters() {
    const base = { q: '', fam: 'all', tier: 'all', legal: 'all' };
    try {
        return { ...base, ...JSON.parse(localStorage.getItem(FILTER_KEY) || '{}'), q: back.q };
    }
    catch {
        return { ...base, q: back.q };
    }
}
export function matches(p, f) {
    if (f.fam !== 'all' && p.family !== f.fam)
        return false;
    if (f.tier !== 'all' && String(p.tier) !== f.tier)
        return false;
    if (f.legal !== 'all' && p.legal !== f.legal)
        return false;
    const q = f.q.trim().toLowerCase();
    if (!q)
        return true;
    const hay = [p.name, ...(p.aka ?? []), FAMILIES[p.family]?.name, p.summary, ...(p.goals ?? [])].join(' ').toLowerCase();
    return q.split(/\s+/).every(w => hay.includes(w));
}
/** Top 10 by engagement, each bar colored by evidence tier: the most-hyped compounds sit low on the ladder. */
function TopChart() {
    const top = PEPTIDES.filter(p => p.popularity).sort((a, b) => b.popularity - a.popularity).slice(0, 10);
    if (!top.length)
        return null;
    const step = 5000;
    const ticksMax = Math.ceil(Math.max(...top.map(p => p.popularity)) / step) * step;
    const ticks = [];
    for (let t = 0; t <= ticksMax; t += step)
        ticks.push(t);
    const pct = (v) => (v / ticksMax) * 100;
    return (_jsxs("section", { className: "tile rise", style: { ['--i']: 2 }, children: [_jsxs("div", { className: "stack gap-1", children: [_jsx("span", { className: "eyebrow", children: "Hype vs evidence" }), _jsx("h3", { children: "The most-discussed peptides mostly have the weakest evidence" }), _jsx("p", { className: "small muted", children: "30-day engagement on Reddit and YouTube as of October 2026 (from the source overview, via humanpeptides.fyi), colored by evidence tier." })] }), _jsx("div", { className: "legend", children: TIER_LIST.map(t => _jsxs("span", { children: [_jsx("i", { style: { background: `var(--t${t})` } }), "T", t, " ", TIERS[t].label] }, t)) }), _jsxs("div", { className: "hbar", role: "list", "aria-label": "Top 10 peptides by engagement, with evidence tier", style: { gridTemplateRows: `repeat(${top.length}, auto) auto` }, children: [_jsx("div", { className: "hbar-grid", "aria-hidden": "true", style: { gridRow: `1 / ${top.length + 1}` }, children: ticks.map(t => _jsx("span", { style: { left: `${pct(t)}%` } }, t)) }), top.map((p, i) => (_jsxs("a", { className: "hbar-row", role: "listitem", href: `#${p.id}`, style: { gridRow: i + 1 }, title: `${p.name}: ${fmtNum(p.popularity, 0)} engagement points, Tier ${p.tier} (${TIERS[p.tier].label})`, children: [_jsx("span", { className: "hbar-label", children: p.name }), _jsxs("span", { className: "hbar-track", children: [_jsx("span", { className: "hbar-fill grow", style: { width: `max(${pct(p.popularity)}%, 4px)`, background: `var(--t${p.tier})`, ['--i']: i } }), _jsxs("span", { className: "hbar-val", style: { left: `max(${pct(p.popularity)}%, 4px)` }, children: [fmtNum(p.popularity, 0), " \u00B7 T", p.tier] })] })] }, p.id))), _jsx("div", { className: "hbar-axis", "aria-hidden": "true", style: { gridRow: top.length + 1 }, children: ticks.map(t => _jsx("span", { style: { left: `${pct(t)}%` }, children: t ? `${t / 1000}K` : '0' }, t)) })] })] }));
}
function TierOverview() {
    return (_jsx("div", { className: "tiers", children: TIER_LIST.map(t => (_jsxs("div", { className: "tier-row", children: [_jsxs("div", { className: "what", children: [_jsx(Ladder, { t: t }), _jsxs("b", { children: ["Tier ", t, ": ", TIERS[t].label] }), _jsx("span", { children: TIERS[t].long })] }), _jsx("div", { className: "names", children: PEPTIDES.filter(p => p.tier === t).map(p => _jsx("a", { href: `#${p.id}`, children: p.name }, p.id)) })] }, t))) }));
}
/** A sideways-scrolling chip row. Its name stays pinned at the start; its right edge fades and shows an arrow only while more chips sit off screen. */
function FilterRow({ label, children }) {
    const ref = useRef(null);
    const [more, setMore] = useState(false);
    const check = useCallback(() => {
        const el = ref.current;
        if (el)
            setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);
    useEffect(() => {
        // Back on Learn with a filter kept from before: bring its chip into view so the choice isn't hidden off the row's end.
        const el = ref.current, on = el?.querySelector('[aria-pressed="true"]');
        if (el && on) {
            const past = on.getBoundingClientRect().right - el.getBoundingClientRect().right;
            if (past > 0)
                el.scrollLeft += past + 48;
        }
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [check]);
    // While chips sit off screen a round arrow at the end says so, and a tap brings the next ones in.
    const next = () => ref.current?.scrollBy({ left: ref.current.clientWidth * 0.7, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    return (_jsxs("div", { className: "filter-wrap", children: [_jsxs("div", { className: "filter-row", ref: ref, onScroll: check, "data-more": more || undefined, children: [_jsx("span", { className: "label muted", children: label }), children] }), more && (_jsx("button", { type: "button", className: "filter-more", onClick: next, "aria-label": `More ${label} filters`, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M9 6l6 6-6 6" }) }) }))] }));
}
const GUIDES = [
    { href: '#calculator', tone: 'lilac', title: 'Dose math, step by step', icon: 'M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2M8.5 2h7M14.5 16h-5' },
    { href: '#safety', tone: 'peach', title: 'Safety & law', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];
/** How long typing must pause before the grid follows the search box in one transition. */
const SETTLE_MS = 180;
export function LibraryView() {
    const [f, setRaw] = useState(loadFilters);
    // Searching or filtering moves the cards instead of snapping them: the box and chips update at once, and the grid
    // follows inside a view transition where each card has its own name (see :root[data-filtering] in styles.css), so
    // cards that stay slide and the rest fade. Reduced motion, or no view transitions, updates the grid at once.
    // Typing waits for a short pause (SETTLE_MS) so a word animates the grid once, not once per keystroke; chips move it at once.
    const [applied, setApplied] = useState(f);
    const seq = useRef(0);
    const typing = useRef(undefined);
    useEffect(() => () => clearTimeout(typing.current), []);
    const apply = (next) => {
        const start = viewTransition();
        if (!start) {
            setApplied(next);
            return;
        }
        const root = document.documentElement, mine = ++seq.current;
        const done = () => { if (mine === seq.current)
            delete root.dataset.filtering; };
        root.dataset.filtering = '';
        try {
            start(() => flushSync(() => setApplied(next))).finished.then(done, done);
        }
        catch {
            done();
            setApplied(next);
        }
    };
    const setF = (next) => {
        setRaw(next);
        clearTimeout(typing.current);
        if (next.q !== f.q && viewTransition())
            typing.current = setTimeout(() => apply(next), SETTLE_MS);
        else
            apply(next);
    };
    useEffect(() => {
        back.q = f.q;
        try {
            localStorage.setItem(FILTER_KEY, JSON.stringify({ ...f, q: '' }));
        }
        catch { /* storage blocked */ }
    }, [f]);
    // Back from a profile: return to the spot it was opened from. A layout effect, so it lands before the route fade's
    // new snapshot and after App's scroll to the top.
    useLayoutEffect(() => {
        if (back.y != null)
            window.scrollTo(0, back.y);
        back.y = null;
    }, []);
    // Any link to a profile (cards, chart rows, tier lists) remembers where the page was.
    const remember = (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (a && !GUIDES.some(g => g.href === a.getAttribute('href')))
            back.y = window.scrollY;
    };
    const list = useMemo(() => PEPTIDES.filter(p => matches(p, applied)).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || a.name.localeCompare(b.name)), [applied]);
    const chip = (key, val, label, dot) => (_jsxs("button", { className: "fchip", "aria-pressed": f[key] === val, onClick: () => setF({ ...f, [key]: val }), children: [dot && _jsx("span", { style: { width: 8, height: 8, borderRadius: '50%', background: dot } }), label] }, String(val)));
    const usedLegal = Object.keys(LEGAL).filter(k => PEPTIDES.some(p => p.legal === k));
    const trialBacked = PEPTIDES.filter(p => p.tier <= 2).length;
    // A button, not a #tiers link: the hash is the route, so a fragment link would leave Learn.
    const showTiers = () => {
        const d = document.getElementById('tiers');
        if (!d)
            return;
        d.open = true;
        d.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        d.querySelector('summary')?.focus({ preventScroll: true });
    };
    return (_jsxs("section", { className: "view", onClickCapture: remember, children: [_jsxs("header", { className: "head rise", children: [_jsx("span", { className: "eyebrow", children: "Learn" }), _jsxs("h1", { children: ["What the evidence says.", _jsx("br", {}), _jsxs("span", { className: "soft", children: [PEPTIDES.length, " peptides, graded."] })] }), _jsxs("p", { children: ["Compounds that trend online, with what studies show, how they're regulated in the US, and the warning signs to know. Updated ", AS_OF, "."] }), _jsx("nav", { className: "row-wrap", "aria-label": "Guides", children: GUIDES.map(g => (_jsxs("a", { href: g.href, className: "btn soft sm", children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: `var(--${g.tone}-ink)`, strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: g.icon }) }), g.title] }, g.href))) })] }), _jsxs("div", { className: "section-title", children: [_jsx("h2", { children: "Library" }), _jsx("span", { className: "count", "aria-live": "polite", children: list.length === PEPTIDES.length ? `All ${list.length}` : `${list.length} of ${PEPTIDES.length}` })] }), _jsxs("div", { className: "search", children: [_jsx("label", { className: "sr-only", htmlFor: "lib-q", children: "Search peptides" }), _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "m21 21-4.3-4.3" })] }), _jsx("input", { type: "search", id: "lib-q", value: f.q, onChange: e => setF({ ...f, q: e.target.value }), placeholder: "Search name, nickname or goal", autoComplete: "off" })] }), _jsxs("div", { className: "filters", children: [_jsxs(FilterRow, { label: "Evidence", children: [chip('tier', 'all', 'All'), TIER_LIST.map(t => chip('tier', `${t}`, `T${t} ${TIERS[t].label}`, `var(--t${t})`))] }), _jsxs(FilterRow, { label: "Category", children: [chip('fam', 'all', 'All'), Object.keys(FAMILIES).map(k => chip('fam', k, FAMILIES[k].name))] }), _jsxs(FilterRow, { label: "US status", children: [chip('legal', 'all', 'All'), usedLegal.map(k => chip('legal', k, LEGAL[k].label))] }), _jsx("button", { type: "button", className: "linkish small", style: { justifySelf: 'start', minHeight: 44 }, onClick: showTiers, children: "What do tiers mean?" })] }), _jsx("div", { className: "cards", children: list.length ? list.map(p => (_jsxs("a", { className: "card", href: `#${p.id}`, style: { ['--vt']: `c-${p.id}` }, children: [_jsxs("div", { className: "card-top", children: [_jsx(FamilyGlyph, { family: p.family, size: 36 }), _jsx(Ladder, { t: p.tier })] }), _jsxs("div", { children: [_jsx("span", { className: "fam", children: FAMILIES[p.family]?.name }), _jsx("h3", { children: p.name }), p.aka?.length ? _jsx("div", { className: "aka", children: p.aka.slice(0, 2).join(' · ') }) : null] }), _jsx("p", { className: "sum", children: p.summary }), _jsxs("div", { className: "row-wrap", children: [_jsx(TierChip, { t: p.tier }), _jsx(LegalChip, { k: p.legal })] })] }, p.id))) : (_jsxs("div", { className: "empty", style: { gridColumn: '1 / -1' }, children: [_jsx(IlloSearch, {}), _jsx("span", { className: "eyebrow", children: "Library" }), _jsx("h3", { children: "No matches" }), _jsx("p", { className: "small muted", children: "Try a different word or clear a filter." }), _jsx("button", { className: "btn", onClick: () => setF({ q: '', fam: 'all', tier: 'all', legal: 'all' }), children: "Clear filters" })] })) }), _jsxs("details", { className: "tile mint", id: "tiers", children: [_jsxs("summary", { className: "spread", style: { alignItems: 'center', flexWrap: 'nowrap' }, children: [_jsxs("span", { className: "stack gap-1", children: [_jsx("span", { className: "label", children: "How evidence tiers work" }), _jsxs("span", { className: "tile-title", children: ["Only ", trialBacked, " of ", PEPTIDES.length, " have randomized human trials"] })] }), _jsx("span", { className: "arrow", "aria-hidden": "true", children: _jsx("svg", { className: "chev", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M9 6l6 6-6 6" }) }) })] }), _jsx(TierOverview, {})] }), _jsx(TopChart, {})] }));
}
