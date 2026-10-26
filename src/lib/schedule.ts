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
  { k: 'prn', label: 'As needed', days: null },
] as const;

const FREQ: Record<string, (typeof FREQS)[number]> = Object.fromEntries(FREQS.map(f => [f.k, f]));

export function freqText(r: Pick<Regimen, 'freq' | 'everyDays'>): string {
  if (r.freq === 'custom') return `Every ${Number(r.everyDays)} days`;
  return FREQ[r.freq]?.label ?? '';
}

export function intervalDays(r: Pick<Regimen, 'freq' | 'everyDays'>): number | null {
  if (r.freq === 'custom') return Number(r.everyDays) > 0 ? Number(r.everyDays) : null;
  return FREQ[r.freq]?.days ?? null;
}

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
