import { describe, expect, it } from 'vitest';
import { calcAlerts, doseMath, mgInUnits, toMg } from '../doseMath';

describe('toMg', () => {
  it('converts mcg and mg, and refuses units it cannot convert', () => {
    expect(toMg(250, 'mcg')).toBe(0.25);
    expect(toMg(2.5, 'mg')).toBe(2.5);
    expect(toMg(1, 'IU')).toBeNull();
    expect(toMg(1, 'mL')).toBeNull();
  });
});

describe('doseMath', () => {
  it('matches the worked example: 10 mg in 2 mL, 500 mcg dose', () => {
    const m = doseMath(500, 'mcg', 10, 2)!;
    expect(m.conc).toBe(5);
    expect(m.vol).toBeCloseTo(0.1);
    expect(m.units).toBeCloseTo(10);
    expect(m.mcgPerUnit).toBe(50);
    expect(m.perVial).toBeCloseTo(20);
    expect(m.doseMg).toBe(0.5);
  });

  it('matches the FDA-derived examples in the research notes', () => {
    expect(doseMath(250, 'mcg', 5, 2)!.units).toBeCloseTo(10);
    expect(doseMath(250, 'mcg', 10, 2)!.units).toBeCloseTo(5);
    expect(doseMath(1, 'mg', 10, 1)!.mcgPerUnit).toBe(100);
  });

  it('accepts form strings', () => {
    expect(doseMath('2.5', 'mg', '5', '1')!.units).toBeCloseTo(50);
  });

  it('returns null for missing, zero, negative or unconvertible input', () => {
    expect(doseMath('', 'mg', 10, 2)).toBeNull();
    expect(doseMath(1, 'mg', 0, 2)).toBeNull();
    expect(doseMath(1, 'mg', 10, -1)).toBeNull();
    expect(doseMath(1, 'IU', 10, 2)).toBeNull();
    expect(doseMath('abc', 'mg', 10, 2)).toBeNull();
  });
});

describe('mgInUnits', () => {
  it('turns drawn units back into a dose', () => {
    expect(mgInUnits(10, 5)).toBeCloseTo(0.5);
    // The classic 10x error: 50 units drawn instead of 5
    expect(mgInUnits(50, 5) / mgInUnits(5, 5)).toBeCloseTo(10);
  });
});

describe('calcAlerts', () => {
  const tones = (dose: number, unit: string, vial: number, ml: number, syr: number) =>
    calcAlerts(doseMath(dose, unit, vial, ml)!, vial, ml, syr).map(a => a.tone);

  it('is silent for a clean whole-unit draw', () => {
    expect(tones(500, 'mcg', 10, 2, 50)).toEqual([]);
  });

  it('flags a dose bigger than the vial (likely mcg/mg mix-up)', () => {
    const a = calcAlerts(doseMath(20, 'mg', 10, 2)!, 10, 2, 100);
    expect(a[0].tone).toBe('danger');
    expect(a[0].title).toMatch(/larger than the whole vial/);
  });

  it('flags a draw that will not fit the syringe', () => {
    expect(tones(2, 'mg', 10, 2, 30)).toContain('danger');
  });

  it('warns when the draw is under 2 units', () => {
    expect(tones(50, 'mcg', 10, 1, 30)).toContain('warn');
  });

  it('warns on very concentrated solutions', () => {
    expect(calcAlerts(doseMath(5, 'mg', 50, 1)!, 50, 1, 30).some(a => /concentrated/.test(a.title))).toBe(true);
  });

  it('explains rounding to the nearest unit', () => {
    // 240 mcg from 10 mg in 2 mL is 4.8 units
    const a = calcAlerts(doseMath(240, 'mcg', 10, 2)!, 10, 2, 30);
    const info = a.find(x => x.tone === 'info')!;
    expect(info.title).toBe('Rounds to 5 units on the syringe.');
    expect(info.body).toMatch(/4\.2%/);
    expect(tones(300, 'mcg', 10, 3, 30)).toEqual([]);
  });
});
