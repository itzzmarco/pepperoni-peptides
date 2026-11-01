import { describe, expect, it } from 'vitest';
import { PEPTIDES } from '../peptides';
import { MEASURES, measuresFor } from '../measures';
import { UNITS } from '../options';

describe('usual units', () => {
  it('covers every compound in the library, and nothing else', () => {
    expect(Object.keys(MEASURES).sort()).toEqual(PEPTIDES.map(p => p.id).sort());
  });

  it('uses only units the app offers, each once per compound', () => {
    for (const [id, ms] of Object.entries(MEASURES)) {
      expect(ms.length, id).toBeGreaterThan(0);
      for (const m of ms) expect(UNITS, `${id}: ${m.u}`).toContain(m.u);
      expect(new Set(ms.map(m => m.u)).size, id).toBe(ms.length);
    }
  });

  it('names a product form, never an amount', () => {
    for (const [id, ms] of Object.entries(MEASURES)) for (const m of ms) {
      expect(m.how, id).not.toMatch(/\d/);
      expect(m.how.length, `${id}: ${m.how}`).toBeLessThanOrEqual(40);
    }
  });

  it('starts creams on applications and nasal sprays on sprays', () => {
    for (const p of PEPTIDES) {
      if (p.defaultRoute === 'Topical') expect(MEASURES[p.id][0].u, p.id).toBe('application');
      if (p.defaultRoute === 'Nasal spray') expect(MEASURES[p.id][0].u, p.id).toBe('spray');
    }
  });

  it('starts vial-drawn GLP-1s on syringe units, with pens in mg next', () => {
    expect(measuresFor('tirzepatide').map(m => m.u)).toEqual(['units (syringe)', 'mg']);
    expect(measuresFor('semaglutide')[1].how).toMatch(/pens/);
    expect(measuresFor('')).toEqual([]);
  });
});
