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

  it('puts an apostrophe before text a spreadsheet would run as a formula, and leaves numbers and dates alone', () => {
    const risky: Ledger = {
      version: 1,
      regimens: [{ ...ledger.regimens[0], compoundId: '', name: '@SUM(A1)', prescriber: '', source: '+cmd', notes: '-2+3' }],
      doses: [{ ...ledger.doses[0], amount: '-2.5', notes: '=HYPERLINK("http://x.test","open")' }],
      checkins: [{ ...ledger.checkins[0], weight: -1.5, effects: ['=1+1', 'Nausea'] }],
    };
    const out = ledgerToCsv(risky, () => undefined).split('\n');
    const [, r, c, d] = out.map(parseRow);
    const col = (row: string[], name: string) => row[CSV_HEADER.indexOf(name)];

    expect(col(d, 'notes')).toBe(`'=HYPERLINK("http://x.test","open")`);
    expect(out[3]).toContain(`"'=HYPERLINK(""http://x.test"",""open"")"`);
    expect(col(r, 'name')).toBe("'@SUM(A1)");
    expect(col(r, 'emergency_symptoms_or_source')).toBe("'+cmd");
    expect(col(r, 'notes')).toBe("'-2+3");
    expect(col(c, 'side_effects_or_frequency')).toBe("'=1+1; Nausea");

    expect(col(d, 'amount')).toBe('-2.5');
    expect(col(c, 'weight')).toBe('-1.5');
    expect(col(r, 'date_time')).toBe('2026-10-01');
    expect(col(d, 'date_time')).toBe('2026-10-01T09:00:00.000Z');
    out.forEach(l => expect(parseRow(l)).toHaveLength(CSV_HEADER.length));
  });
});
