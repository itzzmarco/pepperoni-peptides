import type { DoseEntry, Regimen } from './types';
import { DAY, daysBetween, dayKey, fmtDay, fmtShort, fmtTime, startOfDay } from './format';

export const FREQS = [
  { k: 'daily', label: 'Once a day', days: 1 },
  { k: 'bid', label: 'Twice a day', days: 0.5 },
  { k: 'eod', label: 'Every other day', days: 2 },
  { k: '3w', label: '3 times a week', days: 7 / 3 },
  { k: '2w', label: 'Twice a week', days: 3.5 },
  { k: 'weekly', label: 'Once a week', days: 7 },
  { k: 'biweekly', label: 'Every 2 weeks', days: 14 },
  { k: 'monthly', label: 'Once a month', days: 30 },
  { k: 'custom', label: 'Every N days', days: null },
  { k: 'days', label: 'Certain days', days: null },
  { k: 'prn', label: 'As needed', days: null },
] as const;

const FREQ: Record<string, (typeof FREQS)[number]> = Object.fromEntries(FREQS.map(f => [f.k, f]));

/** Days of the week in the order people read a week, Monday first. */
export const WEEK = [1, 2, 3, 4, 5, 6, 0];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The chosen days of the week, valid and in week order. */
export const weekdaysOf = (r: Pick<Regimen, 'weekdays'>) => WEEK.filter(d => (r.weekdays ?? []).includes(d));

/** "Mon, Wed, Fri", "Mon to Fri", or "Every day". */
export function weekdayText(days: number[]): string {
  const set = WEEK.filter(d => days.includes(d));
  if (set.length === 7) return 'Every day';
  if (set.length === 5 && [1, 2, 3, 4, 5].every(d => set.includes(d))) return 'Mon to Fri';
  return set.map(d => DAY_SHORT[d]).join(', ');
}

type Sched = Pick<Regimen, 'freq' | 'everyDays' | 'weekdays'>;

export function freqText(r: Sched): string {
  if (r.freq === 'custom') return `Every ${Number(r.everyDays)} days`;
  if (r.freq === 'days') return weekdaysOf(r).length ? weekdayText(weekdaysOf(r)) : 'Certain days';
  return FREQ[r.freq]?.label ?? '';
}

/** Days between doses. For set weekdays it's the average gap, which is what spacing-based helpers need. */
export function intervalDays(r: Sched): number | null {
  if (r.freq === 'custom') return Number(r.everyDays) > 0 ? Number(r.everyDays) : null;
  if (r.freq === 'days') return weekdaysOf(r).length ? 7 / weekdaysOf(r).length : null;
  return FREQ[r.freq]?.days ?? null;
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** The same clock time as `like` (or midnight) on day `d`. */
const sameTime = (d: Date, like?: Date) => (like ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), like.getHours(), like.getMinutes()) : d);

/**
 * Set weekdays follow the calendar, not the last dose: a late Monday shot doesn't move Wednesday's.
 * A scheduled day that passed with no dose since shows as late until the next scheduled day arrives.
 */
function weekdayStatus(r: Regimen, last: Date | undefined, now: Date): RegimenStatus {
  const set = weekdaysOf(r);
  if (!set.length) return { s: 'prn', text: last ? `Last ${fmtShort(last)}` : 'Choose the days', last };
  if (!last) return { s: 'due', text: 'Not logged yet' };
  const today = startOfDay(now);
  let prev = today;
  while (!set.includes(prev.getDay())) prev = addDays(prev, -1);
  let next = addDays(today, 1);
  while (!set.includes(next.getDay())) next = addDays(next, 1);
  if (startOfDay(last) < prev) {
    if (prev.getTime() === today.getTime()) return { s: 'due', text: 'Due today', last, due: sameTime(today, last) };
    const ago = daysBetween(prev, today);
    return { s: 'late', text: `Due ${ago} day${ago === 1 ? '' : 's'} ago`, last, due: sameTime(prev, last) };
  }
  return { s: 'ok', text: daysBetween(today, next) === 1 ? 'Next: tomorrow' : `Next: ${fmtDay(next)}`, last, due: sameTime(next, last) };
}

/** True when a set-weekday regimen is scheduled on this day. */
export const scheduledOn = (r: Regimen, d: Date) => r.freq === 'days' && weekdaysOf(r).includes(d.getDay());

export type DueState = 'paused' | 'prn' | 'due' | 'ok' | 'late';
export interface RegimenStatus {
  s: DueState;
  text: string;
  last?: Date;
  due?: Date;
}

/** Where a regimen stands relative to its schedule, from its most recent logged dose. */
export function regimenStatus(r: Regimen, doses: DoseEntry[], now = new Date()): RegimenStatus {
  if (r.paused) return { s: 'paused', text: 'Paused' };
  const iv = intervalDays(r);
  let last: Date | undefined;
  for (const d of doses) {
    if (d.rid !== r.id) continue;
    const t = new Date(d.at);
    if (!last || t > last) last = t;
  }
  if (r.freq === 'days') return weekdayStatus(r, last, now);
  if (!iv) return { s: 'prn', text: last ? `Last ${fmtShort(last)}` : 'As needed', last };
  if (!last) return { s: 'due', text: 'Not logged yet' };
  const due = new Date(last.getTime() + iv * DAY);
  if (iv < 1) {
    return now >= due ? { s: 'due', text: 'Due now', last, due } : { s: 'ok', text: `Next ${fmtTime(due)}`, last, due };
  }
  const d = daysBetween(now, due);
  if (d > 0) return { s: 'ok', text: d === 1 ? 'Next: tomorrow' : `Next: ${fmtDay(due)}`, last, due };
  if (d === 0) return { s: 'due', text: 'Due today', last, due };
  return { s: 'late', text: `Due ${-d} day${d === -1 ? '' : 's'} ago`, last, due };
}

const RANK: Record<DueState, number> = { late: 0, due: 1, ok: 2, prn: 3, paused: 4 };

/** Active regimens with their status, overdue first, then due, then by next due date. */
export function upcoming(regimens: Regimen[], doses: DoseEntry[], now = new Date()) {
  return regimens
    .filter(r => !r.paused)
    .map(r => ({ r, st: regimenStatus(r, doses, now) }))
    .sort((a, b) => RANK[a.st.s] - RANK[b.st.s] || (a.st.due?.getTime() ?? Infinity) - (b.st.due?.getTime() ?? Infinity));
}

/** The last `n` days (oldest first) with whether a dose of this regimen was logged that day. */
export function adherenceDays(rid: string, doses: DoseEntry[], n = 28, now = new Date()) {
  const on = new Set(doses.filter(d => d.rid === rid).map(d => dayKey(new Date(d.at))));
  const today = startOfDay(now);
  const out: { date: Date; on: boolean; today: boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push({ date, on: on.has(dayKey(date)), today: i === 0 });
  }
  return out;
}
