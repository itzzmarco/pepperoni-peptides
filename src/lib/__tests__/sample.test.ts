import { describe, expect, it } from 'vitest';
import { LedgerStore } from '../store';
import { SAMPLE_PREFIX, isSample, sampleLedger } from '../sample';
import { regimenStatus } from '../schedule';
import { PEP } from '../../data/peptides';
import { EFFECTS } from '../../data/options';

class MemoryKV {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
}

describe('sampleLedger', () => {
  const now = new Date('2026-10-26T12:00:00');
  const l = sampleLedger(now);

  it('marks every entry as sample data', () => {
    for (const x of [...l.regimens, ...l.doses, ...l.checkins]) expect(x.id.startsWith(SAMPLE_PREFIX)).toBe(true);
  });

  it('only uses an approved drug or a cosmetic, so it never reads as dosing advice', () => {
    for (const r of l.regimens) expect(['approved', 'cosmetic']).toContain(PEP[r.compoundId]?.legal);
  });

  it('points doses at sample regimens and check-in effects at known options', () => {
    const ids = new Set(l.regimens.map(r => r.id));
    for (const d of l.doses) expect(ids.has(d.rid)).toBe(true);
    for (const c of l.checkins) for (const e of c.effects) expect(EFFECTS).toContain(e);
  });

  it('shows a dose due today, so the main card has something to do', () => {
    expect(regimenStatus(l.regimens[0], l.doses, now).s).toBe('due');
  });
});

describe('LedgerStore.clearSample', () => {
  it('removes sample entries and keeps what the person logged', () => {
    const s = new LedgerStore(new MemoryKV());
    s.importBackup(sampleLedger());
    s.addCheckin({ id: 'mine', at: new Date().toISOString(), overall: 3, effects: [], flags: [], notes: '' });
    s.clearSample();
    const { regimens, doses, checkins } = s.get();
    expect(regimens).toHaveLength(0);
    expect(doses).toHaveLength(0);
    expect(checkins.map(c => c.id)).toEqual(['mine']);
    expect([...regimens, ...doses, ...checkins].some(isSample)).toBe(false);
  });
});
