import type { Route } from '../App';

const ICON = {
  today: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  trends: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  learn: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  peptides: 'M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2M8.5 2h7M14.5 16h-5',
};
/** Grid column of each tab on the phone bar. Column 2 is the log button, so the indicator never lands there.
 *  On the desktop rail the log button sits apart at the top, so there the four tabs are rows 0 to 3 (`ROW`). */
const COL: Record<keyof typeof ICON, number> = { today: 0, trends: 1, learn: 3, peptides: 4 };
const ROW: Record<keyof typeof ICON, number> = { today: 0, trends: 1, learn: 2, peptides: 3 };

function Tab({ k, label, current, exact }: { k: keyof typeof ICON; label: string; current: string; exact: boolean }) {
  const on = current === k;
  // "page" only when this tab is the screen itself; on a screen inside its section (Dose math under Learn) it marks the section.
  return (
    <a href={`#${k}`} aria-current={on ? (exact ? 'page' : 'true') : undefined}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON[k]} /></svg>
      {label}
    </a>
  );
}

/** Floating glass tab bar; the labelled button in the middle logs the next due dose, or adds a peptide when none is set up. A pill marks the current tab.
 *  `exact` is false on a screen that belongs to the tab's section without being the tab's own page. */
export function TabBar({ current, exact, onLog, logLabel, logWord, inert }: { current: Route; exact: boolean; onLog: () => void; logLabel: string; logWord: string; inert?: boolean }) {
  const col = COL[current as keyof typeof COL];
  // One pill for every move: it slides from tab to tab. On the phone bar the track is masked over the log button's column
  // (styles.css), so crossing sides it passes out of sight behind the button and never shows or rests there.
  // Its visible word says what a tap does right now; aria-label and the tooltip, which start with that word, name the
  // peptide it will log (the soonest due), so the sheet that opens is no surprise.
  // It is rendered where each layout shows it, top of the rail and middle of the phone bar, with the other copy hidden
  // (display: none, styles.css), so keyboard and switch order always match what is on screen.
  const log = (where: string) => (
    <button className={`log ${where}`} type="button" onClick={onLog} aria-label={logLabel} title={logLabel}>
      <span className="log-dot"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></span>
      {logWord}
    </button>
  );
  return (
    <nav className="tabbar" aria-label="Main" inert={inert}>
      {col != null && <span className="tab-track"><span className="tab-ind" aria-hidden="true" style={{ ['--k' as string]: col, ['--r' as string]: ROW[current as keyof typeof ROW] }} /></span>}
      {log('log-rail')}
      <Tab k="today" label="Today" current={current} exact={exact} />
      <Tab k="trends" label="Trends" current={current} exact={exact} />
      {log('log-bar')}
      <Tab k="learn" label="Learn" current={current} exact={exact} />
      <Tab k="peptides" label="Peptides" current={current} exact={exact} />
    </nav>
  );
}
