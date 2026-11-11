import { describe, expect, it } from 'vitest';
import { tideOf } from '../tide';

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
