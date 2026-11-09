import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Regimen } from './lib/types';
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

const ROUTES = ['today', 'trends', 'learn', 'peptides', 'calculator', 'safety', 'partner'] as const;
export type Route = (typeof ROUTES)[number];
/** Links from before the redesign keep working. */
const ALIASES: Record<string, Route> = { log: 'today', library: 'learn' };

/** Hash routes work on any static host: #today, #trends, #learn, #peptides, #calculator, #safety, or a peptide id such as #bpc-157. */
function parseHash(): { tab: Route; id: string | null } {
  const h = decodeURIComponent(window.location.hash.slice(1));
  if (PEP[h]) return { tab: 'learn', id: h };
  if ((ROUTES as readonly string[]).includes(h)) return { tab: h as Route, id: null };
  return { tab: ALIASES[h] ?? 'today', id: null };
}

type SheetState =
  // `back` reopens that regimen's dose sheet when the edit started there.
  | { kind: 'regimen'; r: Regimen; isNew: boolean; back?: boolean }
  | { kind: 'dose'; r: Regimen }
  | { kind: 'checkin' }
  | { kind: 'backfill' }
  | { kind: 'account' }
  | null;

/** What the compact bar says once a page's own title has scrolled under it. */
const TITLES: Record<Route, string> = { today: 'Today', trends: 'Trends', learn: 'Learn', peptides: 'Peptides', calculator: 'Dose math', safety: 'Safety & law', partner: 'Partner' };

export function App() {
  const [route, setRoute] = useState(parseHash);
  const [sheet, setSheet] = useState<SheetState>(null);
  const { regimens, doses } = useLedger();
  const { recovering, linkError } = useAccount();
  // A password-reset link, or an email link that failed, lands here: open the account sheet to finish.
  useEffect(() => {
    if (recovering || linkError) setSheet({ kind: 'account' });
  }, [recovering, linkError]);
  useEffect(() => {
    // Fade the new route in while the top bar and tab bar stay put; reduced motion keeps the instant swap.
    // First-paint reveals (.rise) switch off for the rest of the session once a fade is used, so the root fade is the only page motion.
    // The switch flips inside the swap, after the old page is snapshotted, so the page being left never moves.
    // A second tap while a fade is still running swaps at once instead of starting another one (see transitionGate).
    // The old page is snapshotted where the user was looking (the card they just tapped); the scroll to the top
    // happens inside the update, so only the new screen opens at the top.
    let fade = false;
    const swap = () => {
      if (fade) document.documentElement.dataset.routed = '';
      setRoute(parseHash()); setSheet(null); window.scrollTo(0, 0);
    };
    const go = transitionGate(swap);
    const onHash = () => {
      const start = viewTransition();
      fade = !!start;
      go(start ? update => start(() => flushSync(update)) : null);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // The glass top bar picks up a hairline once the page scrolls under it, and the page's name once its title has gone.
  const [scrolled, setScrolled] = useState(false);
  const [titled, setTitled] = useState(false);
  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 8); setTitled(window.scrollY > 120); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // A closed sheet stays mounted (same instance, so focus return still works) while its exit plays.
  // Swapping straight to another sheet skips the exit; reduced motion unmounts at once.
  const [shown, setShown] = useState<SheetState>(null);
  if (sheet && sheet !== shown) setShown(sheet);
  else if (!sheet && shown && prefersReducedMotion()) setShown(null);
  const closing = !sheet && !!shown;
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => setShown(null), exitMs());
    return () => clearTimeout(t);
  }, [closing]);
  const close = useCallback(() => setSheet(null), []);
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
  // The middle tab-bar button logs whatever is overdue or due first, else the next dose coming up.
  const logNext = () => {
    const r = upcoming(regimens, doses)[0]?.r;
    if (r) actions.logDose(r);
    else actions.addRegimen();
  };

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
  return (
    <>
      <header className="topbar gutter" inert={bg} data-scrolled={scrolled ? 'true' : undefined} data-titled={titled ? '' : undefined}>
        <div className="wrap">
          <div className="row">
            <a className="brand" href="#today" aria-label="Peptide Ledger, today">
              {/* The installed icon's vial, drawn the same way: a pink cap on a dark rounded tile. */}
              <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="7" fill="var(--dark)" />
                <rect x="10" y="4" width="12" height="5" rx="1.5" fill="var(--brand)" />
                <rect x="11.5" y="9" width="9" height="2.5" fill="var(--on-dark-3)" />
                <path d="M9 13.5 Q9 12 10.5 12 H21.5 Q23 12 23 13.5 V25 Q23 28 20 28 H12 Q9 28 9 25 Z" fill="var(--on-dark)" />
                <path d="M10.3 21 H21.7 V25 Q21.7 26.7 20 26.7 H12 Q10.3 26.7 10.3 25 Z" fill="var(--on-dark-3)" />
              </svg>
              <span className="brand-text">
                <span className="wordmark">Peptide Ledger</span>
                <span className="bar-title" aria-hidden="true">{route.id ? PEP[route.id].name : TITLES[route.tab]}</span>
              </span>
            </a>
            <AccountButton onOpen={() => setSheet({ kind: 'account' })} />
            <ThemeToggle />
          </div>
        </div>
      </header>
      {/* Outside the sticky bar: it greets every route at the top, then scrolls away so only the brand row stays pinned. */}
      <div className="gutter" inert={bg}>
        <div className="wrap">
          <p className="notice" role="note">
            <b>Education only.</b>
            <span>Not medical advice. Most peptides here aren't FDA-approved for what's promoted online. Emergency: 911.</span>
          </p>
        </div>
      </div>
      <main className="gutter" inert={bg}>
        <div className="wrap">{view}</div>
      </main>
      <footer className="foot gutter" inert={bg}>
        <div className="wrap">
          <p><b>Peptide Ledger</b> is an educational reference and personal journal. It does not diagnose, treat, or recommend doses, and it does not sell or endorse any product. Information reflects sources reviewed through {AS_OF}; rules and evidence change, so check the linked sources and ask your clinician or pharmacist.</p>
          <p>US Poison Control: 1-800-222-1222 · Emergency: 911 · Suicide &amp; Crisis Lifeline: 988</p>
        </div>
      </footer>
      <div className="app-end" />
      <TabBar current={route.id ? 'learn' : tab} onLog={logNext} inert={bg} />
      <SheetClosing.Provider value={closing}>
        {shown?.kind === 'regimen' && (shown.back
          ? <RegimenSheet initial={shown.r} isNew={false} onClose={() => setSheet({ kind: 'dose', r: shown.r })} onSaved={x => setSheet(x ? { kind: 'dose', r: x } : null)} />
          : <RegimenSheet initial={shown.r} isNew={shown.isNew} onClose={close} onSaved={goPeptides} onLog={actions.logDose} onSignIn={actions.signIn} />)}
        {shown?.kind === 'dose' && <DoseSheet r={shown.r} onClose={close} onFix={r => setSheet({ kind: 'regimen', r, isNew: false, back: true })} />}
        {shown?.kind === 'checkin' && <CheckinSheet onClose={close} onBackfill={() => setSheet({ kind: 'backfill' })} />}
        {shown?.kind === 'backfill' && <BackfillSheet onClose={close} />}
        {shown?.kind === 'account' && <AccountSheet onClose={close} />}
      </SheetClosing.Provider>
    </>
  );
}
