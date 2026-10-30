import type { Checkin, DoseEntry, Regimen } from '../types';

export class MemoryKV {
  data = new Map<string, string>();
  fail = false;
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) {
    if (this.fail) throw new Error('QuotaExceededError');
    this.data.set(k, v);
  }
  removeItem(k: string) { this.data.delete(k); }
}

export const reg = (id: string): Regimen => ({
  id, compoundId: '', name: 'Test', dose: '1', unit: 'mg', freq: 'weekly', everyDays: '', route: 'Oral',
  prescriber: '', source: '', start: '2026-10-01', vialMg: '', diluentMl: '', notes: '',
});
export const dose = (id: string, at: string): DoseEntry => ({ id, rid: 'r1', name: 'Test', at, amount: '1', unit: 'mg', route: 'Oral', site: '', notes: '' });
export const check = (id: string, at: string): Checkin => ({ id, at, effects: [], flags: [], notes: '' });
