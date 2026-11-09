import type { Route } from '../App';

const ICON = {
  today: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  trends: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  learn: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  peptides: 'M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2M8.5 2h7M14.5 16h-5',
};
/** Grid column of each tab. Column 2 is the log button, so the indicator never lands there. */
const COL: Record<keyof typeof ICON, number> = { today: 0, trends: 1, learn: 3, peptides: 4 };

function Tab({ k, label, current }: { k: keyof typeof ICON; label: string; current: string }) {
  const on = current === k;
  return (
    <a href={`#${k}`} aria-current={on ? 'page' : undefined}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON[k]} /></svg>
      {label}
    </a>
  );
}

/** Floating glass tab bar; the dark button in the middle logs the next due dose. A pill slides to the current tab. */
export function TabBar({ current, onLog, inert }: { current: Route; onLog: () => void; inert?: boolean }) {
  const col = COL[current as keyof typeof COL];
  // The pill slides only between tabs on the same side of the log button. Crossing it, the pill is remounted
  // (a new key per side) so it fades in at the new tab instead of sliding through the button.
  const side = col == null ? null : col < 2 ? 'l' : 'r';
  return (
    <nav className="tabbar" aria-label="Main" inert={inert}>
      {side != null && <span key={side} className="tab-ind" aria-hidden="true" style={{ ['--k' as string]: col }} />}
      <Tab k="today" label="Today" current={current} />
      <Tab k="trends" label="Trends" current={current} />
      <button className="log" type="button" onClick={onLog} aria-label="Log a dose">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <Tab k="learn" label="Learn" current={current} />
      <Tab k="peptides" label="Peptides" current={current} />
    </nav>
  );
}
