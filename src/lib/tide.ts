import type { Regimen } from './types';
import { intervalDays, type RegimenStatus } from './schedule';
import { DAY, daysBetween } from './format';

export interface Tide {
  /** Whole days since the last dose. */
  day: number;
  /** Days between doses. */
  of: number;
  /** How far out the water is: 0 the day a dose goes in, 1 once the next is due. */
  ebb: number;
}

/**
 * Where a regimen is between doses, read as a tide: full the day a dose goes in, then ebbing until the
 * next one is due. Null for as-needed regimens and ones with no dose logged yet.
 */
export function tideOf(r: Pick<Regimen, 'freq' | 'everyDays' | 'weekdays'>, st: Pick<RegimenStatus, 'last'>, now = new Date()): Tide | null {
  const iv = intervalDays(r);
  if (!iv || !st.last) return null;
  const of = Math.max(1, Math.round(iv));
  const day = Math.max(0, daysBetween(st.last, now));
  return { day, of, ebb: Math.min(1, day / of) };
}

/** A few words for where a tide stands: "High tide", "Day 3 of 7", or the schedule's own words once a dose is due. */
export const tideText = (t: Tide | null, st: Pick<RegimenStatus, 's' | 'text'>) =>
  !t || st.s === 'due' || st.s === 'late' ? st.text : t.day === 0 ? 'High tide' : `Day ${t.day} of ${t.of}`;

/**
 * The water level over time for one regimen, from 0 (out) to 1 (high), sampled every `step` ms from `from`
 * to `to`. It is high at each dose, eases out until the next one is due `everyDays` later, and stays out
 * for as long as that dose is overdue. Nothing was due before the first dose, so the samples start there
 * when it falls inside the range, and there are none if no dose has gone in by `to`.
 */
export function tideLevels(doseTimes: number[], everyDays: number, from: number, to: number, step = DAY / 4) {
  const times = doseTimes.slice().sort((a, b) => a - b);
  const out: { t: number; level: number }[] = [];
  if (!times.length || times[0] > to) return out;
  let i = 0;
  for (let t = Math.max(from, times[0]); ; t = Math.min(t + step, to)) {
    while (i + 1 < times.length && times[i + 1] <= t) i++;
    const gone = (t - times[i]) / (everyDays * DAY);
    out.push({ t, level: gone >= 1 ? 0 : (1 + Math.cos(Math.PI * gone)) / 2 });
    if (t >= to) break;
  }
  return out;
}
