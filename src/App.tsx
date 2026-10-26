import { useCallback, useEffect, useState } from 'react';
import type { Regimen } from './lib/types';
import { PEP } from './data/peptides';
import { AS_OF } from './data/reference';
import { LogView } from './views/LogView';
import { LibraryView } from './views/LibraryView';
import { PeptideDetail } from './views/PeptideDetail';
import { CalculatorView } from './views/CalculatorView';
import { SafetyView } from './views/SafetyView';
import { RegimenSheet, blankRegimen } from './sheets/RegimenSheet';
import { DoseSheet } from './sheets/DoseSheet';
import { CheckinSheet } from './sheets/CheckinSheet';
import { ThemeToggle } from './components/ThemeToggle';

const TABS = [
  ['log', 'My log'],
  ['library', 'Library'],
  ['calculator', 'Dose math'],
  ['safety', 'Safety & law'],
] as const;
type Tab = (typeof TABS)[number][0];

/** Hash routes work on any static host: #log, #library, #calculator, #safety, or a peptide id such as #bpc-157. */
function parseHash(): { tab: Tab; id: string | null } {
  const h = decodeURIComponent(window.location.hash.slice(1));
  if (PEP[h]) return { tab: 'library', id: h };
  if (TABS.some(([k]) => k === h)) return { tab: h as Tab, id: null };
  return { tab: 'log', id: null };
}

type SheetState =
  | { kind: 'regimen'; r: Regimen; isNew: boolean }
  | { kind: 'dose'; r: Regimen }
  | { kind: 'checkin' }
  | null;

export function App() {
  const [route, setRoute] = useState(parseHash);
  const [sheet, setSheet] = useState<SheetState>(null);
  useEffect(() => {
    const onHash = () => { setRoute(parseHash()); setSheet(null); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const close = useCallback(() => setSheet(null), []);
  const goLog = useCallback(() => {
    setSheet(null);
    if (window.location.hash !== '#log') window.location.hash = 'log';
  }, []);

  const actions = {
    addRegimen: () => setSheet({ kind: 'regimen', r: blankRegimen(), isNew: true }),
    editRegimen: (r: Regimen) => setSheet({ kind: 'regimen', r, isNew: false }),
    logDose: (r: Regimen) => setSheet({ kind: 'dose', r }),
    checkin: () => setSheet({ kind: 'checkin' }),
  };

  let view;
  if (route.tab === 'library') view = route.id ? <PeptideDetail p={PEP[route.id]} onTrack={id => setSheet({ kind: 'regimen', r: blankRegimen(id), isNew: true })} /> : <LibraryView />;
  else if (route.tab === 'calculator') view = <CalculatorView />;
  else if (route.tab === 'safety') view = <SafetyView />;
  else view = <LogView {...actions} />;

  // While a sheet is open, the page behind it is inert: not focusable and hidden from screen readers.
  const bg = sheet ? true : undefined;
  return (
    <>
      <header className="masthead" inert={bg}>
        <div className="wrap gutter">
          <div className="row">
            <a className="brand" href="#log" aria-label="Peptide Ledger home">
              <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true">
                <rect x="6" y="1" width="14" height="6" rx="2" fill="var(--accent)" />
                <rect x="8" y="7" width="10" height="3" fill="var(--ink-3)" />
                <path d="M5 12 Q5 10 7 10 H19 Q21 10 21 12 V26 Q21 29 18 29 H8 Q5 29 5 26 Z" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="1.6" />
                <path d="M6.5 22 H19.5 V26 Q19.5 27.5 18 27.5 H8 Q6.5 27.5 6.5 26 Z" fill="var(--ink-3)" opacity=".5" />
              </svg>
              <b>Peptide Ledger</b>
            </a>
            <span className="sync" data-mode="local" title="Your log is saved only in this browser. Nothing is sent to a server.">
              <i /><span className="hide-sm">Saved on this device</span><span className="show-sm">On device</span>
            </span>
            <ThemeToggle />
          </div>
          <nav className="tabs" aria-label="Sections">
            {TABS.map(([k, label]) => (
              <a key={k} className="tab" href={`#${k}`} aria-current={route.tab === k ? 'page' : undefined}>{label}</a>
            ))}
          </nav>
        </div>
      </header>
      <div className="notice" role="note" inert={bg}>
        <div className="wrap gutter">
          <b>Education only.</b>
          <span>Not medical advice. Most peptides here are not FDA-approved for the uses promoted online. Talk to a licensed clinician before starting or changing anything. Emergency: call 911.</span>
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
      {sheet?.kind === 'regimen' && <RegimenSheet initial={sheet.r} isNew={sheet.isNew} onClose={close} onSaved={goLog} />}
      {sheet?.kind === 'dose' && <DoseSheet r={sheet.r} onClose={close} />}
      {sheet?.kind === 'checkin' && <CheckinSheet onClose={close} />}
    </>
  );
}
