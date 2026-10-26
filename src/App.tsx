import { useCallback, useEffect, useState } from 'react';
import type { Checkin, Regimen } from './lib/types';
import { PEP } from './data/peptides';
import { AS_OF } from './data/reference';
import { LogView } from './views/LogView';
import { LibraryView } from './views/LibraryView';
import { CalculatorView } from './views/CalculatorView';
import { SafetyView } from './views/SafetyView';
import { RegimenSheet, blankRegimen } from './sheets/RegimenSheet';
import { DoseSheet } from './sheets/DoseSheet';
import { CheckinSheet } from './sheets/CheckinSheet';
import { ThemeToggle } from './components/ThemeToggle';
import { BookIcon, LockIcon, LogIcon, PhoneIcon, ShieldIcon, SyringeIcon } from './components/Icons';

/** [route, label in the top bar, label in the phone tab bar, icon] */
const TABS = [
  ['log', 'My log', 'Log', LogIcon],
  ['library', 'Library', 'Library', BookIcon],
  ['calculator', 'Dose math', 'Dose math', SyringeIcon],
  ['safety', 'Safety & law', 'Safety', ShieldIcon],
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
  | { kind: 'checkin'; c?: Checkin }
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
    checkin: (c?: Checkin) => setSheet({ kind: 'checkin', c }),
  };

  let view;
  if (route.tab === 'library') view = <LibraryView selected={route.id} onTrack={id => setSheet({ kind: 'regimen', r: blankRegimen(id), isNew: true })} />;
  else if (route.tab === 'calculator') view = <CalculatorView />;
  else if (route.tab === 'safety') view = <SafetyView />;
  else view = <LogView {...actions} />;

  // While a sheet is open, the page behind it is inert: not focusable and hidden from screen readers.
  const bg = sheet ? true : undefined;
  return (
    <>
      <header className="masthead" inert={bg}>
        <div className="wrap gutter mast-row">
          <a className="brand" href="#log" aria-label="Peptide Ledger home">
            <svg width="20" height="23" viewBox="0 0 26 30" aria-hidden="true">
              <rect x="6" y="1" width="14" height="6" rx="2" fill="var(--accent)" />
              <rect x="8" y="7" width="10" height="3" fill="#8F949B" />
              <path d="M5 12 Q5 10 7 10 H19 Q21 10 21 12 V26 Q21 29 18 29 H8 Q5 29 5 26 Z" fill="#FFFFFF" stroke="#15171A" strokeWidth="1.8" />
              <path d="M6.5 22 H19.5 V26 Q19.5 27.5 18 27.5 H8 Q6.5 27.5 6.5 26 Z" fill="var(--accent)" opacity=".35" />
            </svg>
            <b>Peptide Ledger</b>
          </a>
          <nav className="tabs" aria-label="Sections">
            {TABS.map(([k, label]) => (
              <a key={k} className="tab" href={`#${k}`} aria-current={route.tab === k ? 'page' : undefined}>{label}</a>
            ))}
          </nav>
          <div className="mast-tools">
            <span className="sync" title="Your log is saved only in this browser. Nothing is sent to a server.">
              <LockIcon /><span className="hide-sm">Saved on this device</span><span className="show-sm">On device</span>
            </span>
            <span className="hide-sm"><ThemeToggle /></span>
            <a className="help-btn" href="#safety"><PhoneIcon /><span>Help</span></a>
          </div>
        </div>
      </header>
      <div className="notice" role="note" inert={bg}>
        <div className="wrap gutter">
          <b>Education only.</b> <span>Not medical advice. Most peptides here are not FDA-approved for the uses promoted online. Talk to a licensed clinician before starting or changing anything.</span>
        </div>
      </div>
      <main className="gutter" inert={bg}>
        <div className="wrap">{view}</div>
      </main>
      <footer className="foot gutter" inert={bg}>
        <div className="wrap">
          <p><b>Peptide Ledger</b> is an educational reference and personal journal. It does not diagnose, treat, or recommend doses, and it does not sell or endorse any product. Information reflects sources reviewed through {AS_OF}; rules and evidence change, so check the linked sources and ask your clinician or pharmacist.</p>
          <p>US Poison Control: 1-800-222-1222 · Emergency: 911 · Suicide &amp; Crisis Lifeline: 988</p>
          <div className="show-sm-block"><ThemeToggle /></div>
        </div>
      </footer>
      <nav className="tabbar" aria-label="Sections" inert={bg}>
        {TABS.map(([k, , short, Icon]) => (
          <a key={k} className="tabbar-item" href={`#${k}`} aria-current={route.tab === k ? 'page' : undefined}>
            <span className="tabbar-icon"><Icon size={22} /></span>
            {short}
          </a>
        ))}
      </nav>
      {sheet?.kind === 'regimen' && <RegimenSheet initial={sheet.r} isNew={sheet.isNew} onClose={close} onSaved={goLog} />}
      {sheet?.kind === 'dose' && <DoseSheet r={sheet.r} onClose={close} />}
      {sheet?.kind === 'checkin' && <CheckinSheet initial={sheet.c} onClose={close} />}
    </>
  );
}
