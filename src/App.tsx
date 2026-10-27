import { useCallback, useEffect, useState } from 'react';
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
import { RegimenSheet, blankRegimen } from './sheets/RegimenSheet';
import { DoseSheet } from './sheets/DoseSheet';
import { CheckinSheet } from './sheets/CheckinSheet';
import { ThemeToggle } from './components/ThemeToggle';
import { TabBar } from './components/TabBar';

const ROUTES = ['today', 'trends', 'learn', 'peptides', 'calculator', 'safety'] as const;
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
  | { kind: 'regimen'; r: Regimen; isNew: boolean }
  | { kind: 'dose'; r: Regimen }
  | { kind: 'checkin' }
  | null;

export function App() {
  const [route, setRoute] = useState(parseHash);
  const [sheet, setSheet] = useState<SheetState>(null);
  const { regimens, doses } = useLedger();
  useEffect(() => {
    const onHash = () => { setRoute(parseHash()); setSheet(null); window.scrollTo(0, 0); };
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
  };
  // The middle tab-bar button logs whatever is overdue or due first, else the next dose coming up.
  const logNext = () => {
    const r = upcoming(regimens, doses)[0]?.r;
    if (r) actions.logDose(r);
    else actions.addRegimen();
  };

  let view;
  if (route.id) view = <PeptideDetail p={PEP[route.id]} onTrack={id => setSheet({ kind: 'regimen', r: blankRegimen(id), isNew: true })} onLog={actions.logDose} />;
  else if (route.tab === 'trends') view = <TrendsView />;
  else if (route.tab === 'learn') view = <LibraryView />;
  else if (route.tab === 'peptides') view = <PeptidesView {...actions} />;
  else if (route.tab === 'calculator') view = <CalculatorView />;
  else if (route.tab === 'safety') view = <SafetyView />;
  else view = <TodayView {...actions} />;

  // While a sheet is open, the page behind it is inert: not focusable and hidden from screen readers.
  const bg = sheet ? true : undefined;
  const tab = route.tab === 'calculator' || route.tab === 'safety' ? 'learn' : route.tab;
  return (
    <>
      <header className="topbar gutter" inert={bg}>
        <div className="wrap">
          <div className="row">
            <a className="brand" href="#today" aria-label="Peptide Ledger, today">
              <svg width="22" height="26" viewBox="0 0 26 30" aria-hidden="true">
                <rect x="6" y="1" width="14" height="6" rx="2" fill="var(--sky-ink)" />
                <rect x="8" y="7" width="10" height="3" fill="var(--ink-4)" />
                <path d="M5 12 Q5 10 7 10 H19 Q21 10 21 12 V26 Q21 29 18 29 H8 Q5 29 5 26 Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.8" />
                <path d="M6.5 22 H19.5 V26 Q19.5 27.5 18 27.5 H8 Q6.5 27.5 6.5 26 Z" fill="var(--lilac-line)" opacity=".6" />
              </svg>
              Peptide Ledger
            </a>
            <span className="sync" title="Your log is saved only in this browser. Nothing is sent to a server.">
              <i /><span className="hide-sm">Saved on this device</span><span className="show-sm">On device</span>
            </span>
            <ThemeToggle />
          </div>
          <p className="notice" role="note">
            <b>Education only.</b>
            <span>Not medical advice. Most peptides here aren't FDA-approved for what's promoted online. Emergency: 911.</span>
          </p>
        </div>
      </header>
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
      {sheet?.kind === 'regimen' && <RegimenSheet initial={sheet.r} isNew={sheet.isNew} onClose={close} onSaved={goPeptides} />}
      {sheet?.kind === 'dose' && <DoseSheet r={sheet.r} onClose={close} />}
      {sheet?.kind === 'checkin' && <CheckinSheet onClose={close} />}
    </>
  );
}
