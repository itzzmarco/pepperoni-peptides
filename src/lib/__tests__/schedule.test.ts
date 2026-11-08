import { describe, expect, it } from 'vitest';
import type { DoseEntry, Regimen } from '../types';
import { adherenceDays, freqText, intervalDays, regimenStatus } from '../schedule';

const reg = (over: Partial<Regimen> = {}): Regimen => ({
  id: 'r1', compoundId: 'tirzepatide', name: '', dose: '2.5', unit: 'mg', freq: 'weekly', everyDays: '',
  route: 'Subcutaneous injection', prescriber: '', source: '', start: '2026-10-01', vialMg: '', diluentMl: '', notes: '', ...over,
});
const dose = (at: Date, rid = 'r1'): DoseEntry => ({ id: at.toISOString(), rid, name: 'x', at: at.toISOString(), amount: '2.5', unit: 'mg', route: '', site: '', notes: '' });
const at = (y: number, m: number, d: number, h = 9) => new Date(y, m - 1, d, h);
const NOW = at(2026, 10, 26, 12);

describe('frequency helpers', () => {
  it('describes and measures each schedule', () => {
    expect(freqText(reg())).toBe('Once a week');
    expect(freqText(reg({ freq: 'custom', everyDays: '10' }))).toBe('Every 10 days');
    expect(intervalDays(reg())).toBe(7);
    expect(intervalDays(reg({ freq: 'bid' }))).toBe(0.5);
    expect(intervalDays(reg({ freq: 'custom', everyDays: '0' }))).toBeNull();
    expect(intervalDays(reg({ freq: 'prn' }))).toBeNull();
  });
});

describe('regimenStatus', () => {
  it('reports paused, as-needed and never-logged regimens', () => {
    expect(regimenStatus(reg({ paused: true }), [], NOW).s).toBe('paused');
    expect(regimenStatus(reg({ freq: 'prn' }), [], NOW)).toMatchObject({ s: 'prn', text: 'As needed' });
    expect(regimenStatus(reg(), [], NOW)).toMatchObject({ s: 'due', text: 'Not logged yet' });
  });

  it('uses the most recent dose of this regimen only', () => {
    const doses = [dose(at(2026, 10, 12)), dose(at(2026, 10, 24)), dose(at(2026, 10, 25), 'other')];
    const s = regimenStatus(reg(), doses, NOW);
    expect(s.s).toBe('ok');
    expect(s.last?.getDate()).toBe(24);
    expect(s.due?.getDate()).toBe(31);
  });

  it('says tomorrow, today and late correctly for weekly doses', () => {
    expect(regimenStatus(reg(), [dose(at(2026, 10, 20))], NOW).text).toBe('Next: tomorrow');
    expect(regimenStatus(reg(), [dose(at(2026, 10, 19))], NOW)).toMatchObject({ s: 'due', text: 'Due today' });
    expect(regimenStatus(reg(), [dose(at(2026, 10, 18))], NOW)).toMatchObject({ s: 'late', text: 'Due 1 day ago' });
    expect(regimenStatus(reg(), [dose(at(2026, 10, 15))], NOW)).toMatchObject({ s: 'late', text: 'Due 4 days ago' });
  });

  it('handles twice-daily schedules by the hour', () => {
    expect(regimenStatus(reg({ freq: 'bid' }), [dose(at(2026, 10, 26, 8))], NOW).s).toBe('ok');
    expect(regimenStatus(reg({ freq: 'bid' }), [dose(at(2026, 10, 25, 20))], NOW).s).toBe('due');
  });
});

describe('adherenceDays', () => {
  it('returns n days ending today, marking logged days', () => {
    const days = adherenceDays('r1', [dose(at(2026, 10, 26)), dose(at(2026, 10, 19)), dose(at(2026, 10, 20), 'other')], 28, NOW);
    expect(days).toHaveLength(28);
    expect(days[27]).toMatchObject({ today: true, on: true });
    expect(days[20].on).toBe(true);
    expect(days[21].on).toBe(false);
    expect(days.filter(d => d.on)).toHaveLength(2);
    expect(days[0].date.getDate()).toBe(29);
  });
});

describe('set weekdays', () => {
  // NOW is Mon Oct 26, 2026, noon. Mon/Wed/Fri.
  const mwf = reg({ freq: 'days', weekdays: [5, 1, 3, 3, 9] });

  it('describes the days in week order and ignores bad values', () => {
    expect(freqText(mwf)).toBe('Mon, Wed, Fri');
    expect(freqText(reg({ freq: 'days', weekdays: [1, 2, 3, 4, 5] }))).toBe('Mon to Fri');
    expect(freqText(reg({ freq: 'days', weekdays: [0, 1, 2, 3, 4, 5, 6] }))).toBe('Every day');
    expect(intervalDays(mwf)).toBeCloseTo(7 / 3);
    expect(intervalDays(reg({ freq: 'days', weekdays: [] }))).toBeNull();
  });

  it('is due today on a scheduled day not yet dosed', () => {
    expect(regimenStatus(mwf, [dose(at(2026, 10, 23))], NOW)).toMatchObject({ s: 'due', text: 'Due today' });
  });

  it('moves to the next scheduled day once today is done', () => {
    const s = regimenStatus(mwf, [dose(at(2026, 10, 26, 8))], NOW);
    expect(s).toMatchObject({ s: 'ok' });
    expect(s.due?.getDate()).toBe(28);
    expect(s.due?.getHours()).toBe(8);
  });

  it("follows the calendar: a late dose doesn't move the next one", () => {
    // Monday's dose taken Tuesday: next is still Wednesday.
    const tue = at(2026, 10, 27, 12);
    const s = regimenStatus(mwf, [dose(at(2026, 10, 27, 9))], tue);
    expect(s.text).toBe('Next: tomorrow');
    expect(s.due?.getDate()).toBe(28);
  });

  it('shows a missed scheduled day as late until the next one comes', () => {
    const tue = at(2026, 10, 27, 12);
    expect(regimenStatus(mwf, [dose(at(2026, 10, 23))], tue)).toMatchObject({ s: 'late', text: 'Due 1 day ago' });
    const sun = at(2026, 11, 1, 12);
    expect(regimenStatus(mwf, [dose(at(2026, 10, 28))], sun)).toMatchObject({ s: 'late', text: 'Due 2 days ago' });
    // Monday arrives: the missed Friday drops, today is due.
    expect(regimenStatus(mwf, [dose(at(2026, 10, 28))], at(2026, 11, 2, 12))).toMatchObject({ s: 'due', text: 'Due today' });
  });

  it('asks for days when none are set', () => {
    expect(regimenStatus(reg({ freq: 'days', weekdays: [] }), [], NOW)).toMatchObject({ s: 'prn', text: 'Choose the days' });
  });
});
