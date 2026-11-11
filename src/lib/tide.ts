import type { Regimen } from './types';
import { intervalDays, type RegimenStatus } from './schedule';
import { daysBetween } from './format';

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
