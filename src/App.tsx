import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Regimen } from './lib/types';
import { PEP } from './data/peptides';
import { AS_OF } from './data/reference';
import { useLedger } from './lib/store';
import { upcoming } from './lib/schedule';
import { transitionGate } from './lib/routeSwap';
import { TodayView } from './views/TodayView';
import { TrendsView } from './views/TrendsView';
import { PeptidesView, regName } from './views/PeptidesView';
import { LibraryView } from './views/LibraryView';
import { PeptideDetail } from './views/PeptideDetail';
import { CalculatorView } from './views/CalculatorView';
import { SafetyView } from './views/SafetyView';
import { PartnerView } from './views/PartnerView';
import { RegimenSheet, blankRegimen } from './sheets/RegimenSheet';
import { DoseSheet, type DoseDraft } from './sheets/DoseSheet';
import { CheckinSheet } from './sheets/CheckinSheet';
import { BackfillSheet } from './sheets/BackfillSheet';
import { AccountSheet } from './sheets/AccountSheet';
import { useAccount } from './lib/account';
import { AccountButton } from './components/AccountButton';
import { ThemeToggle } from './components/ThemeToggle';
import { TabBar } from './components/TabBar';
import { SheetClosing } from './components/Sheet';
import { openGuard } from './components/LeaveGuard';
import { exitMs, prefersReducedMotion, viewTransition } from './components/Motion';

const ROUTES = ['today', 'trends', 'learn', 'peptides', 'calculator', 'safety', 'partner'] as const;
export type Route = (typeof ROUTES)[number];
/** Links from before the redesign keep working. */
const ALIASES: Record<string, Route> = { log: 'today', library: 'learn' };

/** Hash routes work on any static host: #today, #trends, #learn, #peptides, #calculator, #safety, or a peptide id such as #bpc-157. */
function parseHash(hash = window.location.hash): { tab: Route; id: string | null } {
  const h = decodeURIComponent(hash.slice(1));
  if (PEP[h]) return { tab: 'learn', id: h };
  if ((ROUTES as readonly string[]).includes(h)) return { tab: h as Route, id: null };
  return { tab: ALIASES[h] ?? 'today', id: null };
}

type SheetState =
  // `back` reopens that regimen's dose sheet, with what was typed into it, when the edit started there.
  | { kind: 'regimen'; r: Regimen; isNew: boolean; back?: DoseDraft }
  | { kind: 'dose'; r: Regimen; draft?: DoseDraft }
  | { kind: 'checkin' }
  | { kind: 'backfill' }
  | { kind: 'account' }
  | null;

/** Where each route sits along the tab bar (a profile and the Learn guides sit under Learn, Partner under Today). */
const TAB_POS: Record<Route, number> = { today: 0, partner: 0, trends: 1, learn: 2, calculator: 2, safety: 2, peptides: 3 };
const tabPos = (r: { tab: Route; id: string | null }) => (r.id ? TAB_POS.learn : TAB_POS[r.tab]);

/** What the compact bar says once a page's own title has scrolled under it. */
const TITLES: Record<Route, string> = { today: 'Today', trends: 'Trends', learn: 'Learn', peptides: 'Peptides', calculator: 'Dose math', safety: 'Safety & law', partner: 'Partner' };

export function App() {
  const [route, setRoute] = useState(parseHash);
  const [sheet, setSheet] = useState<SheetState>(null);
  // The bar shows the page's name once its h1 has scrolled under it (see the observer below).
  const [titled, setTitled] = useState(false);
  // The in-app page this history entry was reached from (onHash records it on the entry), so a sub-page's back control
  // returns there; null when the entry before is not this app's (a direct link, a fresh tab).
  const [from, setFrom] = useState<string | null>(() => history.state?.from ?? null);
  const { regimens, doses } = useLedger();
  const { recovering, linkError } = useAccount();
  // A password-reset link, or an email link that failed, lands here: open the account sheet to finish.
  useEffect(() => {
    if (recovering || linkError) setSheet({ kind: 'account' });
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
    // A swap made inside a view transition marks the root "fade": the fade is that page's entrance, so its own
    // first-paint entrances stay off (styles.css), and the new page is captured fully drawn rather than blank.
    let at = parseHash();
    let fading = false;
    let unfade: ReturnType<typeof setTimeout> | undefined;
    const swap = () => {
      const next = parseHash();
      const root = document.documentElement;
      root.dataset.routed = fading ? 'fade' : '';
      const step = tabPos(next) - tabPos(at);
      root.dataset.dir = step > 0 ? 'next' : step < 0 ? 'prev' : at.id && !next.id ? 'back' : 'forward';
      at = next;
      arrived.current = true;
      setRoute(next); setFrom(history.state?.from ?? null); setSheet(null); setTitled(false); window.scrollTo(0, 0);
    };
    const go = transitionGate(swap);
    // The history entry being shown, so a route change held back for an unsaved form can put it back as it was.
    let entry: unknown = history.state;
    const onHash = (e: HashChangeEvent) => {
      // Back, Forward or a link outside an open form with unsaved changes first asks, as closing it would (LeaveGuard):
      // the page being left comes back as the current entry, and Discard and leave goes on to where the person was headed.
      const guard = openGuard.current;
      if (guard?.dirty()) {
        history.pushState(entry, '', e.oldURL);
        guard.ask(() => history.back());
        return;
      }
      // A new entry (a link followed here) remembers the page it came from; an entry revisited with Back or Forward keeps its own.
      if (history.state == null) history.replaceState({ from: new URL(e.oldURL).hash }, '');
      entry = history.state;
      // The page being left is snapshotted with no direction, so a profile's header glyph (named only while data-dir is
      // "forward") stays in the page fade instead of dissolving on its own when no glyph is there to meet it.
      delete document.documentElement.dataset.dir;
      const start = viewTransition();
      clearTimeout(unfade);
      // Once the fade has finished and every entrance it skipped would have ended too, the page goes back to the plain
      // "routed" flag, so content that mounts later (a new card, a range switch) animates in like anywhere else.
      // The skipped entrances ran at zero length rather than not at all (styles.css), so nothing on screen replays.
      const settle = () => { unfade = setTimeout(() => { const root = document.documentElement; if (root.dataset.routed === 'fade') root.dataset.routed = ''; }, 800); };
      go(start ? update => {
        const t = start(() => { fading = true; try { flushSync(update); } finally { fading = false; } });
        t.finished.then(settle, settle);
        return t;
      } : null);
    };
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('hashchange', onHash); clearTimeout(unfade); };
  }, []);
  // Arriving on a route names it in the window title and moves focus to its headline, so keyboard and screen-reader
  // users land on the new page instead of staying in the navigation. The first load keeps focus where the browser put it.
  const arrived = useRef(false);
  const pageName = route.id ? PEP[route.id].name : TITLES[route.tab];
  useEffect(() => {
    document.title = route.tab === 'today' && !route.id ? 'Peptide Ledger' : `${pageName} · Peptide Ledger`;
    if (!arrived.current) return;
    arrived.current = false;
    const main = mainRef.current;
    if (!main) return;
    // A page that already put focus somewhere in itself (Learn, back on the card a profile was opened from) keeps it.
    if (main.contains(document.activeElement)) return;
    const land = (h: HTMLElement) => { h.tabIndex = -1; h.focus({ preventScroll: true }); };
    const h = main.querySelector('h1');
    if (h) { land(h); return; }
    // A page still loading (Partner's skeleton) has no headline yet: land on it when it arrives, unless the user
    // has already moved focus somewhere else by then.
    const from = document.activeElement;
    const mo = new MutationObserver(() => {
      const late = main.querySelector('h1');
      if (!late) return;
      mo.disconnect();
      if (document.activeElement === from || document.activeElement === document.body) land(late);
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
  const barRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  // The bar's real height, larger text and the notch included, as --bar-h, so what pins under it (Learn's finder) and
  // anchored jumps sit flush with its bottom edge instead of assuming a fixed height.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--bar-h', `${bar.offsetHeight}px`));
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);
  // It takes the page's name exactly when the page's own headline (its h1) has slid fully under the bar, however tall
  // the notice or headline are on this screen. A mutation observer follows the h1 when a route or state swaps it,
  // and the observer is rebuilt when the window resizes, since the bar's height sets where "under the bar" starts.
  useEffect(() => {
    const main = mainRef.current;
    if (!main || typeof IntersectionObserver === 'undefined') return;
    let io: IntersectionObserver | null = null, h: Element | null = null;
    const watch = () => {
      const next = main.querySelector('h1');
      if (next === h) return;
      if (h) io?.unobserve(h);
      h = next;
      if (h) io?.observe(h); else setTitled(false);
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
  // Each opening from closed is a new session with its own key, so reopening during an exit (another peptide's dose
  // sheet, say) mounts a fresh form instead of reusing the leaving one.
  const [shown, setShown] = useState<SheetState>(null);
  const [prev, setPrev] = useState<SheetState>(null);
  const [session, setSession] = useState(0);
  if (sheet !== prev) { setPrev(sheet); if (sheet && !prev) setSession(n => n + 1); }
  if (sheet && sheet !== shown) setShown(sheet);
  else if (!sheet && shown && prefersReducedMotion()) setShown(null);
  const closing = !sheet && !!shown;
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => setShown(null), exitMs());
    return () => clearTimeout(t);
  }, [closing]);
  const close = useCallback(() => setSheet(null), []);
  // Closing a regimen edit that started in a dose sheet goes back to that dose sheet. One function for the sheet's whole
  // life, so App re-rendering (a sync status update) never re-runs Sheet's focus effect and pulls the cursor out of a field.
  const backToDose = useCallback(() => setSheet(s => (s?.kind === 'regimen' ? { kind: 'dose', r: s.r, draft: s.back } : s)), []);
  const goPeptides = useCallback(() => {
    setSheet(null);
    if (window.location.hash !== '#peptides') window.location.hash = 'peptides';
  }, []);

  const actions = {
    addRegimen: () => setSheet({ kind: 'regimen', r: blankRegimen(), isNew: true }),
    editRegimen: (r: Regimen) => setSheet({ kind: 'regimen', r, isNew: false }),
    logDose: (r: Regimen) => setSheet({ kind: 'dose', r }),
    checkin: () => setSheet({ kind: 'checkin' }),
    signIn: () => setSheet({ kind: 'account' }),
  };
  // The middle tab-bar button opens the dose sheet on whatever is overdue or due first, else the next dose coming up;
  // the sheet's peptide chips switch to any other. Its visible word is always the short "Log" (a fifth of the bar can't
  // hold a peptide's name whole); its accessible name and the sheet's title say which peptide. With nothing set up it
  // adds a peptide instead, and its word says so.
  const list = upcoming(regimens, doses);
  const dueNow = list.filter(x => x.st.s === 'due' || x.st.s === 'late');
  const nextDue = list[0]?.r;
  const logNext = () => {
    if (nextDue) actions.logDose(nextDue);
    else actions.addRegimen();
  };
  const [logWord, logLabel] = !nextDue ? ['Add', 'Add a peptide']
    : dueNow.length === 1 ? ['Log', `Log ${regName(nextDue)}, due now`]
    : dueNow.length > 1 ? ['Log', `Log a dose, ${dueNow.length} due now`]
    : ['Log', 'Log a dose, none due now'];

  let view;
  if (route.id) view = <PeptideDetail p={PEP[route.id]} onTrack={id => setSheet({ kind: 'regimen', r: blankRegimen(id), isNew: true })} onLog={actions.logDose} />;
  else if (route.tab === 'trends') view = <TrendsView onBackfill={() => setSheet({ kind: 'backfill' })} onAdd={actions.addRegimen} />;
  else if (route.tab === 'learn') view = <LibraryView />;
  else if (route.tab === 'peptides') view = <PeptidesView {...actions} />;
  else if (route.tab === 'calculator') view = <CalculatorView />;
  else if (route.tab === 'safety') view = <SafetyView />;
  else if (route.tab === 'partner') view = <PartnerView onAccount={() => setSheet({ kind: 'account' })} />;
  else view = <TodayView {...actions} />;

  // While a sheet is open, the page behind it is inert: not focusable and hidden from screen readers.
  const bg = sheet ? true : undefined;
  const tab = route.tab === 'calculator' || route.tab === 'safety' ? 'learn' : route.tab === 'partner' ? 'today' : route.tab;
  // A profile and the two guides sit one level under Learn: the bar carries their way back up.
  const sub = !!route.id || route.tab === 'calculator' || route.tab === 'safety';
  // Its way back goes to the page it was opened from, as a native back button does, or up to Learn when there is none.
  const origin = from == null ? null : parseHash(from);
  const backName = origin ? (origin.id ? PEP[origin.id].name : TITLES[origin.tab]) : 'Learn';
  return (
    <>
      <header ref={barRef} className="topbar gutter" inert={bg} data-scrolled={scrolled ? 'true' : undefined} data-titled={titled && !sub ? '' : undefined} data-sub={sub ? '' : undefined}>
        <div className="wrap">
          <div className="row">
            {/* The vial is always the home link, with the wordmark beside it. Two other controls take the wordmark's place,
                each with its own label and never over the vial: on a sub-page a "‹ Learn" link goes back the way the page
                was opened, and on any other page, once the headline scrolls away, the page name with an up arrow scrolls
                back to the top. The wordmark is hidden (not just faded) while either shows, so no tap lands on it. */}
            <div className="brand-wrap">
            <a className="brand" href="#today" aria-label="Peptide Ledger, today">
              {/* The same vial as Today's start card, in the same light: glass lit from the left with a sheen down that side,
                  a liquid line and scale ticks, and a soft floor shadow, on the installed icon's dark tile. */}
              <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
                <defs>
                  <linearGradient id="brand-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--on-dark)" /><stop offset=".6" stopColor="var(--on-dark)" stopOpacity=".92" /><stop offset="1" stopColor="var(--on-dark-3)" /></linearGradient>
                  <linearGradient id="brand-lo" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stopColor="var(--illo-shade-on-dark)" stopOpacity="0" /><stop offset="1" stopColor="var(--illo-shade-on-dark)" /></linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="var(--dark)" />
                <ellipse cx="16" cy="28.6" rx="7.5" ry="1.2" fill="var(--illo-shade-on-dark)" />
                <rect x="10" y="3.5" width="12" height="5" rx="1.5" fill="var(--brand)" />
                <rect x="10" y="3.5" width="12" height="2.2" rx="1.1" fill="var(--on-dark)" opacity=".18" />
                <rect x="11.5" y="8.5" width="9" height="2.5" fill="var(--on-dark-3)" />
                <path d="M9 13.5 Q9 11 11.5 11 H20.5 Q23 11 23 13.5 V25 Q23 28 20 28 H12 Q9 28 9 25 Z" fill="url(#brand-glass)" />
                <path d="M9.8 20.5 H22.2 V25 Q22.2 27.2 20 27.2 H12 Q9.8 27.2 9.8 25 Z" fill="var(--on-dark-3)" />
                <path d="M9.8 20.5 H22.2" stroke="var(--dose-cell)" strokeWidth=".8" />
                <path d="M9 13.5 Q9 11 11.5 11 H20.5 Q23 11 23 13.5 V25 Q23 28 20 28 H12 Q9 28 9 25 Z" fill="url(#brand-lo)" />
                <g stroke="var(--dark)" strokeWidth=".7" strokeLinecap="round" opacity=".35"><path d="M19 15h2.6M19.8 17.5h1.8M19 23h2.6" /></g>
                <path d="M11 14v10" stroke="var(--on-dark)" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="wordmark">Peptide Ledger</span>
            </a>
            <button type="button" className="bar-title" inert={titled && !sub ? undefined : true} aria-label={`${pageName}, back to top`}
              onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}>
              <span>{pageName}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
            </button>
            <a className="bar-back" href={origin ? from! || '#today' : '#learn'} inert={sub ? undefined : true} aria-label={`Back to ${backName}`}
              onClick={origin ? e => { e.preventDefault(); history.back(); } : undefined}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
              <span>{backName}</span>
            </a>
            </div>
            <AccountButton onOpen={() => setSheet({ kind: 'account' })} />
            <ThemeToggle />
          </div>
        </div>
      </header>
      {/* Outside the sticky bar: one quiet line of small print at the top of every route, which scrolls away so only the
          brand row stays pinned and the page's own greeting or hero leads. */}
      <div className="gutter" inert={bg}>
        <div className="wrap">
          <p className="notice" role="note">
            <b>Education only.</b> Not medical advice. Most peptides here aren't FDA-approved for what's promoted online. Emergency: 911.
          </p>
        </div>
      </div>
      <main ref={mainRef} className="gutter" inert={bg}>
        <div className="wrap">{view}</div>
      </main>
      <footer className="foot gutter" inert={bg}>
        <div className="wrap">
          {/* The hotlines stay in view; the long statement folds under one quiet line so it never outweighs a short page. */}
          <p>US Poison Control: 1-800-222-1222 · Emergency: 911 · Suicide &amp; Crisis Lifeline: 988</p>
          <details className="about">
            <summary>About this app <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></summary>
            <p><b>Peptide Ledger</b> is an educational reference and personal journal. It does not diagnose, treat, or recommend doses, and it does not sell or endorse any product. Information reflects sources reviewed through {AS_OF}; rules and evidence change, so check the linked sources and ask your clinician or pharmacist.</p>
          </details>
        </div>
      </footer>
      <div className="app-end" />
      <TabBar current={route.id ? 'learn' : tab} exact={!route.id && tab === route.tab} onLog={logNext} logLabel={logLabel} logWord={logWord} inert={bg} />
      <SheetClosing.Provider key={session} value={closing}>
        {shown?.kind === 'regimen' && (shown.back
          ? <RegimenSheet initial={shown.r} isNew={false} onClose={backToDose} onSaved={x => setSheet(s => (x ? { kind: 'dose', r: x, draft: s?.kind === 'regimen' ? s.back : undefined } : null))} />
          : <RegimenSheet initial={shown.r} isNew={shown.isNew} onClose={close} onSaved={goPeptides} onLog={actions.logDose} onSignIn={actions.signIn} />)}
        {shown?.kind === 'dose' && <DoseSheet r={shown.r} draft={shown.draft} onClose={close} onFix={(r, back) => setSheet({ kind: 'regimen', r, isNew: false, back })} />}
        {shown?.kind === 'checkin' && <CheckinSheet onClose={close} onBackfill={() => setSheet({ kind: 'backfill' })} />}
        {shown?.kind === 'backfill' && <BackfillSheet onClose={close} />}
        {shown?.kind === 'account' && <AccountSheet onClose={close} />}
      </SheetClosing.Provider>
    </>
  );
}
