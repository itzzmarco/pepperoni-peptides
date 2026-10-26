import { describe, expect, it } from 'vitest';
import type { Ledger } from '../types';
import { CSV_HEADER, ledgerToCsv } from '../csv';

const ledger: Ledger = {
  version: 1,
  regimens: [{ id: 'r1', compoundId: 'tirzepatide', name: '', dose: '2.5', unit: 'mg', freq: 'weekly', everyDays: '', route: 'Subcutaneous injection', prescriber: 'Dr. Lee', source: 'Retail pharmacy (prescription)', start: '2026-10-01', vialMg: '', diluentMl: '', notes: 'Take with food, "slowly"' }],
  doses: [
    { id: 'd1', rid: 'r1', name: 'Tirzepatide', at: '2026-10-01T09:00:00.000Z', amount: '2.5', unit: 'mg', route: 'Subcutaneous injection', site: 'abd-ll', notes: '' },
    { id: 'd2', rid: 'r1', name: 'Tirzepatide', at: '2026-10-08T09:00:00.000Z', amount: '2.5', unit: 'mg', route: 'Subcutaneous injection', site: 'thigh-r', notes: 'mild, itchy' },
  ],
  checkins: [{ id: 'c1', at: '2026-10-05T09:00:00.000Z', overall: 4, weight: 180, weightUnit: 'lb', effects: ['Nausea', 'Headache'], flags: [], notes: '' }],
};

/** Minimal RFC 4180 row parser, enough to count and read cells. */
function parseRow(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

describe('ledgerToCsv', () => {
  const lines = ledgerToCsv(ledger, id => (id === 'tirzepatide' ? 'Tirzepatide' : undefined)).split('\n');

  it('writes a header, then regimens, then entries newest first', () => {
    expect(lines[0]).toBe(CSV_HEADER.join(','));
    expect(lines).toHaveLength(5);
    expect(lines.slice(1).map(l => l.split(',')[0])).toEqual(['regimen', 'dose', 'check-in', 'dose']);
    expect(lines[2]).toContain('2026-10-08');
  });

  it('every row has one cell per column', () => {
    lines.forEach(l => expect(parseRow(l)).toHaveLength(CSV_HEADER.length));
  });

  it('quotes cells with commas or quotes and spells out sites', () => {
    expect(lines[1]).toContain('"Prescriber: Dr. Lee | Take with food, ""slowly"""');
    expect(parseRow(lines[1]).at(-1)).toBe('Prescriber: Dr. Lee | Take with food, "slowly"');
    expect(lines[2]).toContain('Right thigh');
    expect(lines[2]).toContain('"mild, itchy"');
    expect(lines[3]).toContain('Nausea; Headache');
  });
});
