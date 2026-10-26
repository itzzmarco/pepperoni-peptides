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
