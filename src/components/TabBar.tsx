import type { Route } from '../App';
import { Icon } from './Icon';

/** Grid column of each tab; the log button holds the middle one. */
const SLOT: Record<string, number> = { today: 0, trends: 1, learn: 3, peptides: 4 };

function Tab({ k, label, current }: { k: 'today' | 'trends' | 'learn' | 'peptides'; label: string; current: string }) {
  const on = current === k;
  return (
    <a href={`#${k}`} aria-current={on ? 'page' : undefined}>
      <Icon name={k} />
      {label}
    </a>
  );
}

/** Floating bottom tab bar. A bead slides to the current tab; the white button in the middle logs the next dose and beats while one is due. */
export function TabBar({ current, onLog, due, inert }: { current: Route; onLog: () => void; due?: boolean; inert?: boolean }) {
  return (
    <nav className="tabbar" aria-label="Main" inert={inert} style={{ ['--at' as string]: SLOT[current] ?? 0 }}>
      <i className="at" aria-hidden="true" />
      <Tab k="today" label="Today" current={current} />
      <Tab k="trends" label="Trends" current={current} />
      <button className={`log${due ? ' due' : ''}`} type="button" onClick={onLog} aria-label="Log a dose">
        <Icon name="add" size={34} />
      </button>
      <Tab k="learn" label="Learn" current={current} />
      <Tab k="peptides" label="Peptides" current={current} />
    </nav>
  );
}
