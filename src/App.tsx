import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Regimen } from './lib/types';
import { PEP } from './data/peptides';
import { AS_OF } from './data/reference';
import { useLedger } from './lib/store';
import { upcoming } from './lib/schedule';
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
import { Look } from './components/Look';
import { TabBar } from './components/TabBar';

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
    const swap = () => { setRoute(parseHash()); setSheet(null); window.scrollTo(0, 0); };
    // Where the browser supports it, the old screen drains away and the new one fills in (see "Changing screens" in styles.css).
    const onHash = () => {
      if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) swap();
      else document.startViewTransition(() => flushSync(swap));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
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
  const nextUp = upcoming(regimens, doses)[0];
  const logNext = () => {
    const r = nextUp?.r;
    if (r) actions.logDose(r);
    else actions.addRegimen();
  };

  let view;
  if (route.id) view = <PeptideDetail p={PEP[route.id]} onTrack={id => setSheet({ kind: 'regimen', r: blankRegimen(id), isNew: true })} onLog={actions.logDose} />;
  else if (route.tab === 'trends') view = <TrendsView onBackfill={() => setSheet({ kind: 'backfill' })} />;
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
      <header className="topbar gutter" inert={bg}>
        <div className="wrap">
          <div className="row">
            <a className="brand" href="#today" aria-label="Peptidal, today">
              <svg width="40" height="22" viewBox="0 0 40 22" fill="none" aria-hidden="true">
                <path d="M5.5 11C7.92 7.33 10.33 4 12.75 4S17.58 7.33 20 11s4.83 7 7.25 7 4.83-3.33 7.25-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity=".6" />
                <circle cx="5.5" cy="11" r="4.5" fill="var(--go)" />
                <circle cx="20" cy="11" r="4.5" fill="currentColor" />
                <circle cx="34.5" cy="11" r="4.5" fill="currentColor" />
              </svg>
              peptidal
            </a>
            <AccountButton onOpen={() => setSheet({ kind: 'account' })} />
            <Look />
          </div>
          <p className="notice" role="note">
            <b>Education only.</b>{' '}
            <span>Not medical advice. Most peptides here aren't FDA-approved for what's promoted online. Emergency: 911.</span>
          </p>
        </div>
      </header>
      <main className="gutter" inert={bg}>
        <div className="wrap">{view}</div>
      </main>
      <footer className="foot gutter" inert={bg}>
        <div className="wrap">
          <p><b>Peptidal</b> is an educational reference and personal journal. It does not diagnose, treat, or recommend doses, and it does not sell or endorse any product. Information reflects sources reviewed through {AS_OF}; rules and evidence change, so check the linked sources and ask your clinician or pharmacist.</p>
          <p>US Poison Control: 1-800-222-1222 · Emergency: 911 · Suicide &amp; Crisis Lifeline: 988</p>
        </div>
      </footer>
      <div className="app-end" />
      <TabBar current={route.id ? 'learn' : tab} onLog={logNext} due={nextUp?.st.s === 'due' || nextUp?.st.s === 'late'} inert={bg} />
      {sheet?.kind === 'regimen' && (sheet.back
        ? <RegimenSheet initial={sheet.r} isNew={false} onClose={() => setSheet({ kind: 'dose', r: sheet.r })} onSaved={x => setSheet(x ? { kind: 'dose', r: x } : null)} />
        : <RegimenSheet initial={sheet.r} isNew={sheet.isNew} onClose={close} onSaved={goPeptides} onLog={actions.logDose} onSignIn={actions.signIn} />)}
      {sheet?.kind === 'dose' && <DoseSheet r={sheet.r} onClose={close} onFix={r => setSheet({ kind: 'regimen', r, isNew: false, back: true })} />}
      {sheet?.kind === 'checkin' && <CheckinSheet onClose={close} onBackfill={() => setSheet({ kind: 'backfill' })} />}
      {sheet?.kind === 'backfill' && <BackfillSheet onClose={close} />}
      {sheet?.kind === 'account' && <AccountSheet onClose={close} />}
    </>
  );
}
