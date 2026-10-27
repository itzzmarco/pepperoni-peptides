import type { Checkin, DoseEntry, Regimen } from './types';
import { intervalDays } from './schedule';
import { DAY, dayKey, startOfDay } from './format';

/**
 * Logged vs expected doses over the last `days` days. Expected doses are the due times that have
 * already passed, counted on each regimen's own interval from its first logged dose, so a dose due
 * later today doesn't count against anyone. Paused, as-needed and never-logged regimens are left out.
 */
export function adherence(regimens: Regimen[], doses: DoseEntry[], now = new Date(), days = 28) {
  const from = startOfDay(now).getTime() - (days - 1) * DAY;
  const t = now.getTime();
  let logged = 0, expected = 0;
  for (const r of regimens) {
    const iv = intervalDays(r);
    if (r.paused || !iv) continue;
    const mine = doses.filter(d => d.rid === r.id).map(d => new Date(d.at).getTime());
    if (!mine.length) continue;
    const t0 = Math.min(...mine), step = iv * DAY;
    const due = Math.max(0, Math.floor((t - t0) / step) - Math.max(0, Math.ceil((from - t0) / step)) + 1);
    expected += due;
    logged += Math.min(due, mine.filter(x => x >= from && x <= t).length);
  }
  return { logged, expected, pct: expected ? logged / expected : null };
}

/** Days (local date keys) with at least one logged dose, optionally for one regimen. */
export const doseDays = (doses: DoseEntry[], rid?: string) =>
  new Set(doses.filter(d => !rid || d.rid === rid).map(d => dayKey(new Date(d.at))));

/** Days (local date keys) whose check-in listed any side effect. */
export const effectDays = (checkins: Checkin[]) => new Set(checkins.filter(c => c.effects.length).map(c => dayKey(new Date(c.at))));

/** Of the side-effect days between `from` and `to`, how many came on a dose day or within `window` days after one. */
export function effectsNearDoses(doseSet: Set<string>, effectSet: Set<string>, from: Date, to: Date, window = 2) {
  let total = 0, near = 0;
  for (let d = startOfDay(from); d <= to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    if (!effectSet.has(dayKey(d))) continue;
    total++;
    for (let k = 0; k <= window; k++) {
      if (doseSet.has(dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - k)))) { near++; break; }
    }
  }
  return { total, near };
}

export type PatternCell = { date: Date; dose: boolean; effect: boolean; future: boolean };

/** The last `weeks` calendar weeks, Monday first, ending with the current week. */
export function patternWeeks(doseSet: Set<string>, effectSet: Set<string>, now = new Date(), weeks = 4): PatternCell[][] {
  const today = startOfDay(now);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7) - 7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + w * 7 + i);
      const k = dayKey(date);
      return { date, dose: doseSet.has(k), effect: effectSet.has(k), future: date > today };
    }),
  );
}

/** Side effects by number of days logged since `since`, most frequent first. */
export function topEffects(checkins: Checkin[], since: number): [string, number][] {
  const n: Record<string, number> = {};
  for (const c of checkins) {
    if (new Date(c.at).getTime() < since) continue;
    for (const e of new Set(c.effects)) n[e] = (n[e] ?? 0) + 1;
  }
  return Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Injections per site since `since`, most used first. */
export function siteCounts(doses: DoseEntry[], since: number): [string, number][] {
  const n: Record<string, number> = {};
  for (const d of doses) if (d.site && new Date(d.at).getTime() >= since) n[d.site] = (n[d.site] ?? 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Time of day of a regimen's most recent dose, as minutes after midnight, or null. */
export function usualMinutes(rid: string, doses: DoseEntry[]): number | null {
  const d = doses.find(x => x.rid === rid);
  if (!d) return null;
  const t = new Date(d.at);
  return t.getHours() * 60 + t.getMinutes();
}

/** GLP-1 receptor agonists in the library. Approved GLP-1 labels (Wegovy, Zepbound) don't recommend combining them. */
export const GLP1 = new Set(['semaglutide', 'tirzepatide', 'retatrutide']);

/** Active regimens that are GLP-1 agonists, when more than one distinct compound is being tracked. */
export function glp1Overlap(regimens: Regimen[]) {
  const hits = regimens.filter(r => !r.paused && GLP1.has(r.compoundId));
  return new Set(hits.map(r => r.compoundId)).size > 1 ? hits : [];
}
