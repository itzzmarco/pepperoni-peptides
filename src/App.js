import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { PEP } from './data/peptides';
import { AS_OF } from './data/reference';
import { useLedger } from './lib/store';
import { upcoming } from './lib/schedule';
import { transitionGate } from './lib/routeSwap';
import { TodayView } from './views/TodayView';
import { TrendsView } from './views/TrendsView';
import { PeptidesView } from './views/PeptidesView';
import { LibraryView } from './views/LibraryView';
import { PeptideDetail } from './views/PeptideDetail';
import { CalculatorView } from './views/CalculatorView';
import { SafetyView } from './views/SafetyView';
import { PartnerView } from './views/PartnerView';
import { RegimenSheet, blankRegimen } from './sheets/RegimenSheet';
import { DoseSheet } from './sheets/DoseSheet';
import { CheckinSheet } from './sheets/CheckinSheet';
import { BackfillSheet } from './sheets/BackfillSheet';
import { AccountSheet } from './sheets/AccountSheet';
import { useAccount } from './lib/account';
import { AccountButton } from './components/AccountButton';
import { ThemeToggle } from './components/ThemeToggle';
import { TabBar } from './components/TabBar';
import { SheetClosing } from './components/Sheet';
import { exitMs, prefersReducedMotion, viewTransition } from './components/Motion';
const ROUTES = ['today', 'trends', 'learn', 'peptides', 'calculator', 'safety', 'partner'];
/** Links from before the redesign keep working. */
const ALIASES = { log: 'today', library: 'learn' };
/** Hash routes work on any static host: #today, #trends, #learn, #peptides, #calculator, #safety, or a peptide id such as #bpc-157. */
function parseHash() {
    const h = decodeURIComponent(window.location.hash.slice(1));
    if (PEP[h])
        return { tab: 'learn', id: h };
    if (ROUTES.includes(h))
        return { tab: h, id: null };
    return { tab: ALIASES[h] ?? 'today', id: null };
}
/** Where each route sits along the tab bar (a profile and the Learn guides sit under Learn, Partner under Today). */
const TAB_POS = { today: 0, partner: 0, trends: 1, learn: 2, calculator: 2, safety: 2, peptides: 3 };
const tabPos = (r) => (r.id ? TAB_POS.learn : TAB_POS[r.tab]);
/** What the compact bar says once a page's own title has scrolled under it. */
const TITLES = { today: 'Today', trends: 'Trends', learn: 'Learn', peptides: 'Peptides', calculator: 'Dose math', safety: 'Safety & law', partner: 'Partner' };
export function App() {
    const [route, setRoute] = useState(parseHash);
    const [sheet, setSheet] = useState(null);
    // The bar shows the page's name once its h1 has scrolled under it (see the observer below).
    const [titled, setTitled] = useState(false);
    const { regimens, doses } = useLedger();
    const { recovering, linkError } = useAccount();
    // A password-reset link, or an email link that failed, lands here: open the account sheet to finish.
    useEffect(() => {
        if (recovering || linkError)
            setSheet({ kind: 'account' });
    }, [recovering, linkError]);
    useEffect(() => {
        // Fade the new route in while the top bar and tab bar stay put; reduced motion keeps the instant swap.
        // First-paint reveals (.rise) and count-ups switch off for the rest of the session after the first route change, faded or not,
        // so revisited screens open on their real numbers. The switch flips inside the swap, after the old page is snapshotted,
        // so the page being left never moves.
        // A second tap while a fade is still running swaps at once instead of starting another one (see transitionGate).
        // The old page is snapshotted where the user was looking (the card they just tapped); the scroll to the top
        // happens inside the update, so only the new screen opens at the top.
        // The bar goes back to the wordmark in the same update as the scroll, since every route opens at its top.
        // Leaving a peptide profile is a step back up to Learn, so its fade travels the other way. Moving between tabs,
        // the page shifts the way the tab bar was travelled; within one tab's section it rises as before.
        let at = parseHash();
        const swap = () => {
            const next = parseHash();
            const root = document.documentElement;
            root.dataset.routed = '';
            const step = tabPos(next) - tabPos(at);
            root.dataset.dir = step > 0 ? 'next' : step < 0 ? 'prev' : at.id && !next.id ? 'back' : 'forward';
            at = next;
            arrived.current = true;
            setRoute(next);
            setSheet(null);
            setTitled(false);
            window.scrollTo(0, 0);
        };
        const go = transitionGate(swap);
        const onHash = () => {
            const start = viewTransition();
            go(start ? update => start(() => flushSync(update)) : null);
        };
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    // Arriving on a route names it in the window title and moves focus to its headline, so keyboard and screen-reader
    // users land on the new page instead of staying in the navigation. The first load keeps focus where the browser put it.
    const arrived = useRef(false);
    const pageName = route.id ? PEP[route.id].name : TITLES[route.tab];
    useEffect(() => {
        document.title = route.tab === 'today' && !route.id ? 'Peptide Ledger' : `${pageName} · Peptide Ledger`;
        if (!arrived.current)
            return;
        arrived.current = false;
        const main = mainRef.current;
        if (!main)
            return;
        const land = (h) => { h.tabIndex = -1; h.focus({ preventScroll: true }); };
        const h = main.querySelector('h1');
        if (h) {
            land(h);
            return;
        }
        // A page still loading (Partner's skeleton) has no headline yet: land on it when it arrives, unless the user
        // has already moved focus somewhere else by then.
        const from = document.activeElement;
        const mo = new MutationObserver(() => {
            const late = main.querySelector('h1');
            if (!late)
                return;
            mo.disconnect();
            if (document.activeElement === from || document.activeElement === document.body)
                land(late);
        });
        mo.observe(main, { childList: true, subtree: true });
        return () => mo.disconnect();
    }, [route, pageName]);
    // The glass top bar picks up a hairline once the page scrolls under it.
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    // It takes the page's name exactly when the page's own headline (its h1) has slid fully under the bar, however tall
    // the notice, back row or headline are on this screen. A mutation observer follows the h1 when a route or state swaps it,
    // and the observer is rebuilt when the window resizes, since the bar's height sets where "under the bar" starts.
    const barRef = useRef(null);
    const mainRef = useRef(null);
    useEffect(() => {
        const main = mainRef.current;
        if (!main || typeof IntersectionObserver === 'undefined')
            return;
        let io = null, h = null;
        const watch = () => {
            const next = main.querySelector('h1');
            if (next === h)
                return;
            if (h)
                io?.unobserve(h);
            h = next;
            if (h)
                io?.observe(h);
            else
                setTitled(false);
        };
        const build = () => {
            io?.disconnect();
            const barH = barRef.current?.offsetHeight ?? 0;
            io = new IntersectionObserver(([e]) => setTitled(!e.isIntersecting && e.boundingClientRect.top < barH), { rootMargin: `-${barH}px 0px 0px 0px` });
            h = null;
            watch();
        };
        build();
        const mo = new MutationObserver(watch);
        mo.observe(main, { childList: true, subtree: true });
        window.addEventListener('resize', build);
        return () => { io?.disconnect(); mo.disconnect(); window.removeEventListener('resize', build); };
    }, []);
    // A closed sheet stays mounted (same instance, so focus return still works) while its exit plays.
    // Swapping straight to another sheet skips the exit; reduced motion unmounts at once.
    const [shown, setShown] = useState(null);
    if (sheet && sheet !== shown)
        setShown(sheet);
    else if (!sheet && shown && prefersReducedMotion())
        setShown(null);
    const closing = !sheet && !!shown;
    useEffect(() => {
        if (!closing)
            return;
        const t = setTimeout(() => setShown(null), exitMs());
        return () => clearTimeout(t);
    }, [closing]);
    const close = useCallback(() => setSheet(null), []);
    const goPeptides = useCallback(() => {
        setSheet(null);
        if (window.location.hash !== '#peptides')
            window.location.hash = 'peptides';
    }, []);
    const actions = {
        addRegimen: () => setSheet({ kind: 'regimen', r: blankRegimen(), isNew: true }),
        editRegimen: (r) => setSheet({ kind: 'regimen', r, isNew: false }),
        logDose: (r) => setSheet({ kind: 'dose', r }),
        checkin: () => setSheet({ kind: 'checkin' }),
        signIn: () => setSheet({ kind: 'account' }),
    };
    // The middle tab-bar button logs whatever is overdue or due first, else the next dose coming up.
    // With nothing due the centre button adds a peptide instead, and its name says so.
    const nextDue = upcoming(regimens, doses)[0]?.r;
    const logNext = () => {
        if (nextDue)
            actions.logDose(nextDue);
        else
            actions.addRegimen();
    };
    let view;
    if (route.id)
        view = _jsx(PeptideDetail, { p: PEP[route.id], onTrack: id => setSheet({ kind: 'regimen', r: blankRegimen(id), isNew: true }), onLog: actions.logDose });
    else if (route.tab === 'trends')
        view = _jsx(TrendsView, { onBackfill: () => setSheet({ kind: 'backfill' }), onAdd: actions.addRegimen });
    else if (route.tab === 'learn')
        view = _jsx(LibraryView, {});
    else if (route.tab === 'peptides')
        view = _jsx(PeptidesView, { ...actions });
    else if (route.tab === 'calculator')
        view = _jsx(CalculatorView, {});
    else if (route.tab === 'safety')
        view = _jsx(SafetyView, {});
    else if (route.tab === 'partner')
        view = _jsx(PartnerView, { onAccount: () => setSheet({ kind: 'account' }) });
    else
        view = _jsx(TodayView, { ...actions });
    // While a sheet is open, the page behind it is inert: not focusable and hidden from screen readers.
    const bg = sheet ? true : undefined;
    const tab = route.tab === 'calculator' || route.tab === 'safety' ? 'learn' : route.tab === 'partner' ? 'today' : route.tab;
    return (_jsxs(_Fragment, { children: [_jsx("header", { ref: barRef, className: "topbar gutter", inert: bg, "data-scrolled": scrolled ? 'true' : undefined, "data-titled": titled ? '' : undefined, children: _jsx("div", { className: "wrap", children: _jsxs("div", { className: "row", children: [_jsxs("a", { className: "brand", href: "#today", "aria-label": "Peptide Ledger, today", children: [_jsxs("svg", { width: "26", height: "26", viewBox: "0 0 32 32", "aria-hidden": "true", children: [_jsx("rect", { width: "32", height: "32", rx: "7", fill: "var(--dark)" }), _jsx("rect", { x: "10", y: "4", width: "12", height: "5", rx: "1.5", fill: "var(--brand)" }), _jsx("rect", { x: "11.5", y: "9", width: "9", height: "2.5", fill: "var(--on-dark-3)" }), _jsx("path", { d: "M9 13.5 Q9 12 10.5 12 H21.5 Q23 12 23 13.5 V25 Q23 28 20 28 H12 Q9 28 9 25 Z", fill: "var(--on-dark)" }), _jsx("path", { d: "M10.3 21 H21.7 V25 Q21.7 26.7 20 26.7 H12 Q10.3 26.7 10.3 25 Z", fill: "var(--on-dark-3)" })] }), _jsxs("span", { className: "brand-text", children: [_jsx("span", { className: "wordmark", children: "Peptide Ledger" }), _jsx("span", { className: "bar-title", "aria-hidden": "true", children: pageName })] })] }), _jsx(AccountButton, { onOpen: () => setSheet({ kind: 'account' }) }), _jsx(ThemeToggle, {})] }) }) }), _jsx("div", { className: "gutter", inert: bg, children: _jsx("div", { className: "wrap", children: _jsxs("p", { className: "notice", role: "note", children: [_jsx("b", { children: "Education only." }), " Not medical advice. Most peptides here aren't FDA-approved for what's promoted online. Emergency: 911."] }) }) }), _jsx("main", { ref: mainRef, className: "gutter", inert: bg, children: _jsx("div", { className: "wrap", children: view }) }), _jsx("footer", { className: "foot gutter", inert: bg, children: _jsxs("div", { className: "wrap", children: [_jsxs("p", { children: [_jsx("b", { children: "Peptide Ledger" }), " is an educational reference and personal journal. It does not diagnose, treat, or recommend doses, and it does not sell or endorse any product. Information reflects sources reviewed through ", AS_OF, "; rules and evidence change, so check the linked sources and ask your clinician or pharmacist."] }), _jsx("p", { children: "US Poison Control: 1-800-222-1222 \u00B7 Emergency: 911 \u00B7 Suicide & Crisis Lifeline: 988" })] }) }), _jsx("div", { className: "app-end" }), _jsx(TabBar, { current: route.id ? 'learn' : tab, exact: !route.id && tab === route.tab, onLog: logNext, logLabel: nextDue ? 'Log a dose' : 'Add a peptide', inert: bg }), _jsxs(SheetClosing.Provider, { value: closing, children: [shown?.kind === 'regimen' && (shown.back
                        ? _jsx(RegimenSheet, { initial: shown.r, isNew: false, onClose: () => setSheet({ kind: 'dose', r: shown.r }), onSaved: x => setSheet(x ? { kind: 'dose', r: x } : null) })
                        : _jsx(RegimenSheet, { initial: shown.r, isNew: shown.isNew, onClose: close, onSaved: goPeptides, onLog: actions.logDose, onSignIn: actions.signIn })), shown?.kind === 'dose' && _jsx(DoseSheet, { r: shown.r, onClose: close, onFix: r => setSheet({ kind: 'regimen', r, isNew: false, back: true }) }), shown?.kind === 'checkin' && _jsx(CheckinSheet, { onClose: close, onBackfill: () => setSheet({ kind: 'backfill' }) }), shown?.kind === 'backfill' && _jsx(BackfillSheet, { onClose: close }), shown?.kind === 'account' && _jsx(AccountSheet, { onClose: close })] })] }));
}
