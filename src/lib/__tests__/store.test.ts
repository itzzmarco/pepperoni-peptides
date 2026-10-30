import { describe, expect, it } from 'vitest';
import { LedgerStore, STORAGE_KEY, merge, normalize } from '../store';
import { MemoryKV, check, dose, reg } from './helpers';

describe('normalize', () => {
  it('rejects things that are not a ledger', () => {
    expect(normalize(null)).toBeNull();
    expect(normalize('hello')).toBeNull();
    expect(normalize({ foo: 1 })).toBeNull();
  });

  it('drops malformed items, fills missing arrays, and sorts newest first', () => {
    const l = normalize({
      regimens: [reg('a'), { name: 'no id' }],
      doses: [dose('1', '2026-10-01T09:00:00Z'), dose('2', '2026-10-20T09:00:00Z'), { id: 'x' }],
      checkins: [{ id: 'c', at: '2026-10-02T09:00:00Z', notes: '' }],
    })!;
    expect(l.regimens.map(r => r.id)).toEqual(['a']);
    expect(l.doses.map(d => d.id)).toEqual(['2', '1']);
    expect(l.checkins[0]).toMatchObject({ effects: [], flags: [] });
  });
});

describe('merge', () => {
  it('adds only new ids and counts them', () => {
    const base = normalize({ regimens: [reg('a')], doses: [dose('1', '2026-10-01T00:00:00Z')], checkins: [] })!;
    const inc = normalize({ regimens: [reg('a'), reg('b')], doses: [dose('1', '2026-10-01T00:00:00Z'), dose('2', '2026-10-05T00:00:00Z')], checkins: [check('c', '2026-10-03T00:00:00Z')] })!;
    const { ledger, added } = merge(base, inc);
    expect(added).toBe(3);
    expect(ledger.regimens.map(r => r.id)).toEqual(['a', 'b']);
    expect(ledger.doses.map(d => d.id)).toEqual(['2', '1']);
  });
});

describe('LedgerStore', () => {
  it('starts empty, saves to storage, and notifies subscribers', () => {
    const kv = new MemoryKV();
    const s = new LedgerStore(kv);
    let calls = 0;
    s.subscribe(() => calls++);
    s.saveRegimen(reg('a'));
    s.addDose(dose('1', '2026-10-01T00:00:00Z'));
    s.addCheckin(check('c', '2026-10-02T00:00:00Z'));
    expect(calls).toBe(3);
    expect(JSON.parse(kv.getItem(STORAGE_KEY)!).regimens).toHaveLength(1);
    expect(new LedgerStore(kv).get().doses).toHaveLength(1);
  });

  it('updates a regimen in place and keeps doses when a regimen is deleted', () => {
    const s = new LedgerStore(new MemoryKV());
    s.saveRegimen(reg('a'));
    s.saveRegimen({ ...reg('a'), dose: '2' });
    s.addDose(dose('1', '2026-10-01T00:00:00Z'));
    expect(s.get().regimens).toHaveLength(1);
    expect(s.get().regimens[0].dose).toBe('2');
    s.deleteRegimen('a');
    expect(s.get().regimens).toHaveLength(0);
    expect(s.get().doses).toHaveLength(1);
    s.deleteDose('1');
    expect(s.get().doses).toHaveLength(0);
  });

  it('survives corrupt storage', () => {
    const kv = new MemoryKV();
    kv.data.set(STORAGE_KEY, '{not json');
    expect(new LedgerStore(kv).get().regimens).toEqual([]);
  });

  it('keeps working in memory and reports when the browser will not save', () => {
    const kv = new MemoryKV();
    kv.fail = true;
    const s = new LedgerStore(kv);
    s.saveRegimen(reg('a'));
    expect(s.persistent).toBe(false);
    expect(s.get().regimens).toHaveLength(1);
    expect(new LedgerStore(null).get().regimens).toEqual([]);
  });

  it('imports backups, rejecting invalid files', () => {
    const s = new LedgerStore(new MemoryKV());
    s.saveRegimen(reg('a'));
    expect(s.importBackup({ nope: true })).toBeNull();
    expect(s.importBackup(JSON.parse(JSON.stringify({ version: 1, regimens: [reg('a'), reg('b')], doses: [], checkins: [] })))).toBe(1);
    s.clearAll();
    expect(s.get()).toEqual({ version: 1, regimens: [], doses: [], checkins: [] });
  });
});
