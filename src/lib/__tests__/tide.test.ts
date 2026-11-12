import { describe, expect, it } from 'vitest';
import { tideLevels, tideOf, tideText } from '../tide';

const NOW = new Date(2026, 10, 10, 19, 0);
const ago = (days: number, hour = 8) => new Date(2026, 10, 10 - days, hour);
const weekly = { freq: 'weekly', everyDays: '' };

describe('tideOf', () => {
  it('counts days since the last dose against the days between doses', () => {
    expect(tideOf(weekly, { last: ago(3) }, NOW)).toEqual({ day: 3, of: 7, ebb: 3 / 7 });
  });

  it('is full on the day of a dose, whatever the hour', () => {
    expect(tideOf(weekly, { last: ago(0, 7) }, NOW)?.ebb).toBe(0);
    expect(tideOf({ freq: 'bid', everyDays: '' }, { last: ago(0, 7) }, NOW)).toEqual({ day: 0, of: 1, ebb: 0 });
  });

  it('stays fully out once the next dose is due or overdue', () => {
    expect(tideOf(weekly, { last: ago(7) }, NOW)?.ebb).toBe(1);
    expect(tideOf(weekly, { last: ago(11) }, NOW)).toEqual({ day: 11, of: 7, ebb: 1 });
  });

  it('uses the chosen spacing for custom and set-weekday schedules', () => {
    expect(tideOf({ freq: 'custom', everyDays: '5' }, { last: ago(1) }, NOW)?.of).toBe(5);
    expect(tideOf({ freq: 'days', everyDays: '', weekdays: [1, 3, 5] }, { last: ago(1) }, NOW)?.of).toBe(2);
  });

  it('has no tide for as-needed regimens or before the first dose', () => {
    expect(tideOf({ freq: 'prn', everyDays: '' }, { last: ago(1) }, NOW)).toBeNull();
    expect(tideOf(weekly, {}, NOW)).toBeNull();
  });
});

describe('tideText', () => {
  it('names the day between doses, and high tide on a dose day', () => {
    expect(tideText({ day: 3, of: 7, ebb: 3 / 7 }, { s: 'ok', text: 'Next: Sat, Nov 14' })).toBe('Day 3 of 7');
    expect(tideText({ day: 0, of: 7, ebb: 0 }, { s: 'ok', text: 'Next: Tue, Nov 17' })).toBe('High tide');
  });

  it("uses the schedule's own words once a dose is due, overdue, or has no tide", () => {
    expect(tideText({ day: 7, of: 7, ebb: 1 }, { s: 'due', text: 'Due today' })).toBe('Due today');
    expect(tideText({ day: 9, of: 7, ebb: 1 }, { s: 'late', text: 'Due 2 days ago' })).toBe('Due 2 days ago');
    expect(tideText(null, { s: 'prn', text: 'As needed' })).toBe('As needed');
  });
});

describe('tideLevels', () => {
  const D = 864e5;
  const t0 = new Date(2026, 10, 1).getTime();
  const at = (levels: { t: number; level: number }[], day: number) => levels.find(p => p.t === t0 + day * D)!.level;

  it('is high at a dose, half out midway, and out once the next is due', () => {
    const l = tideLevels([t0], 7, t0, t0 + 10 * D, D / 2);
    expect(at(l, 0)).toBe(1);
    expect(at(l, 3.5)).toBeCloseTo(0.5);
    expect(at(l, 7)).toBe(0);
    expect(at(l, 9)).toBe(0);
  });

  it('comes back in with the next dose and has no water before the first', () => {
    const l = tideLevels([t0 + 2 * D, t0 + 9 * D], 7, t0, t0 + 10 * D, D / 2);
    expect(at(l, 1)).toBe(0);
    expect(at(l, 2)).toBe(1);
    expect(at(l, 8.5)).toBeLessThan(0.1);
    expect(at(l, 9)).toBe(1);
  });

  it('counts a dose from before the range, and always ends on the last moment asked for', () => {
    const l = tideLevels([t0 - D], 2, t0, t0 + 1.3 * D, D / 2);
    expect(at(l, 0)).toBeCloseTo(0.5);
    expect(l[l.length - 1].t).toBe(t0 + 1.3 * D);
  });
});
