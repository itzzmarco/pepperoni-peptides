export class MemoryKV {
    data = new Map();
    fail = false;
    getItem(k) { return this.data.get(k) ?? null; }
    setItem(k, v) {
        if (this.fail)
            throw new Error('QuotaExceededError');
        this.data.set(k, v);
    }
    removeItem(k) { this.data.delete(k); }
}
export const reg = (id) => ({
    id, compoundId: '', name: 'Test', dose: '1', unit: 'mg', freq: 'weekly', everyDays: '', route: 'Oral',
    prescriber: '', source: '', start: '2026-10-01', vialMg: '', diluentMl: '', notes: '',
});
export const dose = (id, at) => ({ id, rid: 'r1', name: 'Test', at, amount: '1', unit: 'mg', route: 'Oral', site: '', notes: '' });
export const check = (id, at) => ({ id, at, effects: [], flags: [], notes: '' });
