import { describe, expect, it } from 'vitest';
import type { DoseEntry, Regimen } from '../types';
import { adherence, doseDays, effectsNearDoses, glp1Overlap, patternWeeks } from '../insights';
import { lastBellyHour, nextBellyHour } from '../sites';

const reg = (id: string, freq: string, extra: Partial<Regimen> = {}): Regimen => ({
  id, compoundId: '', name: id, dose: '1', unit: 'mg', freq, everyDays: '', route: 'Subcutaneous injection',
  prescriber: '', source: '', start: '', vialMg: '', diluentMl: '', notes: '', ...extra,
});
const dose = (rid: string, at: Date, site = ''): DoseEntry => ({ id: rid + at.getTime(), rid, name: rid, at: at.toISOString(), amount: '1', unit: 'mg', route: '', site, notes: '' });
const day = (d: number, h = 9) => new Date(2026, 9, d, h); // October 2026

describe('adherence', () => {
  const now = day(27, 10); // Tue Oct 27, 10 AM

  it('counts a weekly regimen as on track when every due dose was logged', () => {
    const doses = [26, 19, 12, 5].map(d => dose('w', day(d, 8)));
    expect(adherence([reg('w', 'weekly')], doses, now)).toEqual({ logged: 4, expected: 4, pct: 1 });
  });

  it("doesn't count a daily dose that isn't due until later today", () => {
    // first dose Oct 13 at 8 PM, daily, two days missed; today's 8 PM dose isn't due yet
    const doses = [26, 25, 24, 23, 21, 20, 19, 18, 17, 15, 14, 13].map(d => dose('d', day(d, 20)));
    const a = adherence([reg('d', 'daily')], doses, now);
    expect(a.expected).toBe(14);
    expect(a.logged).toBe(12);
  });

  it('leaves out paused, as-needed and never-logged regimens', () => {
    const doses = [dose('p', day(20)), dose('n', day(20))];
    expect(adherence([reg('p', 'weekly', { paused: true }), reg('n', 'prn'), reg('x', 'daily')], doses, now).pct).toBeNull();
  });
});

describe('side-effect pattern', () => {
  it('counts side-effect days on or up to two days after a dose', () => {
    const doses = doseDays([dose('w', day(5)), dose('w', day(12))]);
    const effects = new Set(['2026-10-06', '2026-10-07', '2026-10-10', '2026-10-12']);
    expect(effectsNearDoses(doses, effects, day(1), day(27))).toEqual({ total: 4, near: 3 });
  });

  it('lays out whole Monday-first weeks ending this week', () => {
    const weeks = patternWeeks(new Set(['2026-10-26']), new Set(), day(27));
    expect(weeks).toHaveLength(4);
    expect(weeks[0][0].date.getDay()).toBe(1);
    expect(weeks[3][0].dose).toBe(true);
    expect(weeks[3][2].future).toBe(true);
  });
});

describe('belly clock', () => {
  it('moves one hour clockwise from the regimen’s last belly dose, wrapping 12 to 1', () => {
    const doses = [dose('w', day(26), 'belly-12'), dose('x', day(25), 'belly-3'), dose('w', day(19), 'belly-11')];
    expect(lastBellyHour('w', doses)).toBe(12);
    expect(nextBellyHour(12, {})).toBe(1);
    expect(nextBellyHour(lastBellyHour('x', doses), {})).toBe(4);
  });

  it('starts at the hour rested longest when there is no history', () => {
    expect(nextBellyHour(null, {})).toBe(12);
    expect(nextBellyHour(null, { 'belly-12': day(26) })).toBe(1);
  });
});

it('flags two different GLP-1 medicines tracked at once', () => {
  const sema = reg('a', 'weekly', { compoundId: 'semaglutide' });
  const tirz = reg('b', 'weekly', { compoundId: 'tirzepatide' });
  expect(glp1Overlap([sema, tirz])).toHaveLength(2);
  expect(glp1Overlap([sema, { ...tirz, paused: true }])).toHaveLength(0);
  expect(glp1Overlap([sema, { ...sema, id: 'c' }])).toHaveLength(0);
});
