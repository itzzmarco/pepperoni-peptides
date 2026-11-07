import { describe, expect, it } from 'vitest';
import { dueDayKeys, monthGrid, parsePasted, planBackfill, readWeight, weightsByDay } from '../backfill';
import { LedgerStore, normalize } from '../store';
import { dayKey } from '../format';
import { MemoryKV, check, dose, reg } from './helpers';

const NOW = new Date(2026, 10, 1, 15, 0); // Sun Nov 1 2026, 3 pm local
const local = (m: number, d: number, h = 12) => new Date(2026, m, d, h).toISOString();

describe('monthGrid', () => {
  it('lays a month out Sunday first, like a paper calendar', () => {
    const sep = monthGrid(2026, 8, NOW);
    // Sept 1 2026 is a Tuesday: two blanks, then day 1.
    expect(sep.slice(0, 2)).toEqual([null, null]);
    expect(sep[2]!.key).toBe('2026-09-01');
    expect(sep.filter(Boolean)).toHaveLength(30);
  });

  it('marks today and the days after it', () => {
    const nov = monthGrid(2026, 10, NOW).filter(Boolean);
    expect(nov[0]).toMatchObject({ key: '2026-11-01', today: true, future: false });
    expect(nov[1]!.future).toBe(true);
  });
});

describe('readWeight', () => {
  it('reads plain and decimal weights, and rejects typos', () => {
    expect(readWeight('213')).toBe(213);
    expect(readWeight(' 213,4 ')).toBe(213.4);
    expect(readWeight('')).toBeNull();
    expect(Number.isNaN(readWeight('2130'))).toBe(true);
    expect(Number.isNaN(readWeight('abc'))).toBe(true);
    expect(Number.isNaN(readWeight('3'))).toBe(true);
  });
});

describe('parsePasted', () => {
  it('reads US month/day, ISO and month-name dates, one per line', () => {
    const { values, bad } = parsePasted('9/7 213\n9/8/2026: 211\n2026-09-09 210\nSep 10 210 lb\nSept. 11, 2026 - 211.5', NOW);
    expect(values).toEqual([
      ['2026-09-07', '213'], ['2026-09-08', '211'], ['2026-09-09', '210'], ['2026-09-10', '210'], ['2026-09-11', '211.5'],
    ]);
    expect(bad).toEqual([]);
  });

  it('puts a date without a year in the most recent past', () => {
    expect(parsePasted('12/25 200', NOW).values[0][0]).toBe('2025-12-25');
  });

  it('skips lines without a weight, impossible dates and future days', () => {
    const { values, bad } = parsePasted('9/26\n2/30 200\n11/5/2026 300\nhello\n10/31 297', NOW);
    expect(values).toEqual([['2026-10-31', '297']]);
    expect(bad).toEqual(['9/26', '2/30 200', '11/5/2026 300', 'hello']);
    // Without a year, 11/5 means the most recent Nov 5, a year back.
    expect(parsePasted('11/5 300', NOW).values).toEqual([['2025-11-05', '300']]);
  });
});

describe('dueDayKeys', () => {
  it('lines a weekly schedule up on the first logged dose, before and after it', () => {
    const r = { ...reg('r1'), freq: 'weekly', start: '2026-10-30' };
    const doses = [dose('a', local(8, 14, 9))]; // Monday Sept 14
    const keys = [...dueDayKeys(r, doses, monthGrid(2026, 8, NOW))];
    expect(keys).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']);
  });

  it('uses the start date when nothing is logged, and gives no hints for 3 times a week', () => {
    const r = { ...reg('r1'), freq: 'weekly', start: '2026-09-07' };
    expect(dueDayKeys(r, [], monthGrid(2026, 9, NOW)).has('2026-10-05')).toBe(true);
    expect(dueDayKeys({ ...r, freq: '3w' }, [], monthGrid(2026, 9, NOW)).size).toBe(0);
  });
});

describe('planBackfill', () => {
  const ledger = normalize({
    regimens: [{ ...reg('r1'), name: 'Tirz', dose: '2.5', unit: 'mg' }],
    doses: [dose('d1', local(8, 14, 9))],
    checkins: [
      { ...check('c1', local(8, 8, 8)), weight: 211, weightUnit: 'lb' },
      { ...check('c2', local(8, 9, 8)), weight: 210, weightUnit: 'lb', overall: 4 },
      { ...check('c3', local(8, 10, 20)), overall: 3 },
    ],
  })!;

  it('creates a check-in at noon for a new day and leaves unchanged days alone', () => {
    const p = planBackfill(ledger, { weights: { '2026-09-07': '213', '2026-09-08': '211' }, doses: {}, unit: 'lb' }, NOW);
    expect(p.saveCheckins).toHaveLength(1);
    expect(p.saveCheckins[0]).toMatchObject({ weight: 213, weightUnit: 'lb', effects: [], flags: [] });
    expect(dayKey(new Date(p.saveCheckins[0].at))).toBe('2026-09-07');
    expect(new Date(p.saveCheckins[0].at).getHours()).toBe(12);
  });

  it('updates a saved weight in place and adds a weight to a check-in already on that day', () => {
    const p = planBackfill(ledger, { weights: { '2026-09-08': '212', '2026-09-10': '210' }, doses: {}, unit: 'lb' }, NOW);
    expect(p.saveCheckins.map(c => [c.id, c.weight])).toEqual([['c1', 212], ['c3', 210]]);
    expect(p.saveCheckins[1].overall).toBe(3);
  });

  it('clearing a weight deletes a weight-only check-in but keeps one with other answers', () => {
    const p = planBackfill(ledger, { weights: { '2026-09-08': '', '2026-09-09': ' ' }, doses: {}, unit: 'lb' }, NOW);
    expect(p.deleteCheckins).toEqual(['c1']);
    expect(p.saveCheckins).toHaveLength(1);
    expect(p.saveCheckins[0]).toMatchObject({ id: 'c2', overall: 4 });
    expect(p.saveCheckins[0].weight).toBeUndefined();
  });

  it('skips typos and future days', () => {
    const p = planBackfill(ledger, { weights: { '2026-09-07': '2130', '2026-11-02': '200' }, doses: {}, unit: 'lb' }, NOW);
    expect(p.saveCheckins).toHaveLength(0);
  });

  it('adds ticked doses at the regimen\'s usual time with its saved dose, once per day', () => {
    const p = planBackfill(ledger, { weights: {}, doses: { r1: ['2026-09-07', '2026-09-07', '2026-09-14', '2026-09-21'] }, unit: 'lb' }, NOW);
    expect(p.addDoses.map(d => dayKey(new Date(d.at)))).toEqual(['2026-09-07', '2026-09-21']);
    expect(p.addDoses[0]).toMatchObject({ rid: 'r1', name: 'Tirz', amount: '2.5', unit: 'mg', site: '', notes: 'Filled in later' });
    expect(new Date(p.addDoses[0].at).getHours()).toBe(9);
  });
});

describe('store.applyBatch', () => {
  it('saves many items in one change and reports every key to sync', () => {
    const s = new LedgerStore(new MemoryKV());
    s.addCheckin({ ...check('old', local(8, 8)), weight: 211 });
    let calls = 0;
    let keys: string[] = [];
    s.subscribe(() => calls++);
    s.onLocalChange = k => { keys = k; };
    s.applyBatch({
      checkins: [{ ...check('new', local(8, 7)), weight: 213 }],
      deleteCheckins: ['old'],
      doses: [dose('d1', local(8, 7, 9)), dose('d2', local(8, 14, 9))],
    });
    expect(calls).toBe(1);
    expect(keys).toEqual(['checkin:new', 'dose:d1', 'dose:d2', 'checkin:old']);
    expect(s.get().checkins.map(c => c.id)).toEqual(['new']);
    expect(s.get().doses.map(d => d.id)).toEqual(['d2', 'd1']);
    expect(weightsByDay(s.get().checkins).get('2026-09-07')?.weight).toBe(213);
  });
});
