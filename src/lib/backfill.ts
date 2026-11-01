import type { Checkin, DoseEntry, Ledger, Regimen } from './types';
import { DAY, dayKey, newId, startOfDay } from './format';
import { intervalDays } from './schedule';
import { usualMinutes } from './insights';

/**
 * "Fill in past days": copy a paper log into the app a month at a time. Weights become check-ins
 * (one per day), and ticked days become doses of a regimen at its usual time. Nothing here touches the
 * store; `planBackfill` turns the edits into items for one `store.applyBatch` call.
 */

export interface DayCell {
  date: Date;
  key: string;
  future: boolean;
  today: boolean;
}

/** One month as a Sunday-first grid, the way US paper calendars are laid out. Null cells are blanks before day 1. */
export function monthGrid(year: number, month: number, now = new Date()): (DayCell | null)[] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const today = startOfDay(now);
  const cells: (DayCell | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let i = 1; i <= days; i++) {
    const date = new Date(year, month, i);
    cells.push({ date, key: dayKey(date), future: date > today, today: date.getTime() === today.getTime() });
  }
  return cells;
}

/** Local noon on a day key: far enough from midnight that the entry stays on the same day in nearby time zones. */
export function dayAt(key: string, minutes = 12 * 60): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 0, minutes);
}

/** The latest check-in with a weight on each day. */
export function weightsByDay(checkins: Checkin[]): Map<string, Checkin> {
  const out = new Map<string, Checkin>();
  for (const c of checkins) {
    if (!(c.weight && c.weight > 0)) continue;
    const k = dayKey(new Date(c.at));
    const had = out.get(k);
    if (!had || c.at > had.at) out.set(k, c);
  }
  return out;
}

/** Reads a typed weight. Returns null for blank, NaN for something that isn't a usable weight. */
export function readWeight(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 20 && n <= 1500 ? Math.round(n * 10) / 10 : NaN;
}

/**
 * Days where a regimen was probably due: same spacing as its schedule, lined up on its first logged dose
 * (or its start date when nothing is logged). Only for whole-day schedules like daily, every other day,
 * weekly or every 2 weeks; "3 times a week" has no fixed days, so it gets no hints.
 */
export function dueDayKeys(r: Regimen, doses: DoseEntry[], cells: (DayCell | null)[]): Set<string> {
  const iv = intervalDays(r);
  const out = new Set<string>();
  if (!iv || iv < 1 || !Number.isInteger(iv)) return out;
  const mine = doses.filter(d => d.rid === r.id).map(d => startOfDay(new Date(d.at)).getTime());
  const anchor = mine.length ? Math.min(...mine) : r.start ? dayAt(r.start, 0).getTime() : NaN;
  if (!Number.isFinite(anchor)) return out;
  for (const c of cells) {
    if (!c || c.future) continue;
    const diff = Math.round((c.date.getTime() - anchor) / DAY);
    if (((diff % iv) + iv) % iv === 0) out.add(c.key);
  }
  return out;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** The most recent date on or before `now` with this month and day, for dates written without a year. */
function recentYear(m: number, d: number, now: Date) {
  const t = new Date(now.getFullYear(), m, d);
  return t > now ? new Date(now.getFullYear() - 1, m, d) : t;
}

function validDate(y: number, m: number, d: number) {
  const t = new Date(y, m, d);
  return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d ? t : null;
}

/**
 * Reads a pasted list, one day per line: "9/7 213", "9/7/2026: 213", "2026-09-07 213" or "Sep 7 213 lb".
 * Dates are US month/day. A date with no year means the most recent one. Lines it can't read come back in `bad`.
 */
export function parsePasted(text: string, now = new Date()): { values: [string, string][]; bad: string[] } {
  const values: [string, string][] = [];
  const bad: string[] = [];
  const today = startOfDay(now);
  for (const raw of text.split(/\r?\n|;/)) {
    const line = raw.trim();
    if (!line) continue;
    let date: Date | null = null;
    let rest = '';
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\b(.*)$/))) {
      date = validDate(+m[1], +m[2] - 1, +m[3]);
      rest = m[4];
    } else if ((m = line.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b(.*)$/))) {
      const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : null;
      date = y ? validDate(y, +m[1] - 1, +m[2]) : validDate(2000, +m[1] - 1, +m[2]) && recentYear(+m[1] - 1, +m[2], today);
      rest = m[4];
    } else if ((m = line.match(/^([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b(.*)$/i))) {
      const mi = MONTHS.indexOf(m[1].toLowerCase());
      if (mi >= 0) date = m[3] ? validDate(+m[3], mi, +m[2]) : validDate(2000, mi, +m[2]) && recentYear(mi, +m[2], today);
      rest = m[4];
    }
    const num = rest.match(/\d+(?:[.,]\d+)?/);
    if (!date || date > today || !num || Number.isNaN(readWeight(num[0]))) {
      bad.push(line);
      continue;
    }
    values.push([dayKey(date), num[0].replace(',', '.')]);
  }
  return { values, bad };
}

export interface BackfillEdits {
  /** Typed weights by day key. A blank string clears a saved weight. */
  weights: Record<string, string>;
  /** Day keys ticked for each regimen id. */
  doses: Record<string, string[]>;
  unit: string;
}

const hasMore = (c: Checkin) =>
  !!(c.overall || c.sleep || c.energy || c.mood || c.appetite || c.effects.length || c.flags.length || c.notes);

/** Turns the edits into check-ins to save or delete and doses to add. Unchanged days produce nothing. */
export function planBackfill(ledger: Ledger, edits: BackfillEdits, now = new Date(), nameOf = (r: Regimen) => r.name || r.compoundId) {
  const saveCheckins: Checkin[] = [];
  const deleteCheckins: string[] = [];
  const addDoses: DoseEntry[] = [];
  const saved = weightsByDay(ledger.checkins);
  const todayKey = dayKey(now);

  for (const [key, text] of Object.entries(edits.weights)) {
    const w = readWeight(text);
    if (Number.isNaN(w) || key > todayKey) continue;
    const had = saved.get(key);
    if (w == null) {
      if (!had) continue;
      if (hasMore(had)) {
        const { weight: _w, weightUnit: _u, ...rest } = had;
        saveCheckins.push(rest);
      } else deleteCheckins.push(had.id);
      continue;
    }
    if (had) {
      if (had.weight === w && (had.weightUnit ?? edits.unit) === edits.unit) continue;
      saveCheckins.push({ ...had, weight: w, weightUnit: edits.unit });
      continue;
    }
    // A check-in already that day (moods, side effects) gets the weight added rather than a second entry.
    const sameDay = ledger.checkins.find(c => dayKey(new Date(c.at)) === key);
    if (sameDay) saveCheckins.push({ ...sameDay, weight: w, weightUnit: edits.unit });
    else {
      const at = key === todayKey ? now : dayAt(key);
      saveCheckins.push({ id: newId(), at: at.toISOString(), weight: w, weightUnit: edits.unit, effects: [], flags: [], notes: '' });
    }
  }

  for (const [rid, keys] of Object.entries(edits.doses)) {
    const r = ledger.regimens.find(x => x.id === rid);
    if (!r) continue;
    const logged = new Set(ledger.doses.filter(d => d.rid === rid).map(d => dayKey(new Date(d.at))));
    const mins = usualMinutes(rid, ledger.doses) ?? 9 * 60;
    for (const key of new Set(keys)) {
      if (logged.has(key) || key > todayKey) continue;
      let at = dayAt(key, mins);
      if (at > now) at = now;
      addDoses.push({
        id: newId(), rid, name: nameOf(r), at: at.toISOString(), amount: r.dose, unit: r.unit, route: r.route, site: '', notes: 'Filled in later',
      });
    }
  }
  return { saveCheckins, deleteCheckins, addDoses };
}
