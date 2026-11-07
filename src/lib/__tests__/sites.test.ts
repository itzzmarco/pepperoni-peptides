import { describe, expect, it } from 'vitest';
import { SITES, siteLabel, sitePlan, suggestSite } from '../sites';
import { PEP } from '../../data/peptides';

const SC = 'Subcutaneous injection', IM = 'Intramuscular injection';
const keys = new Set<string>(SITES.map(s => s.k));

describe('sitePlan', () => {
  it('has no sites for doses that are not injected', () => {
    for (const r of ['Oral', 'Nasal spray', 'Topical', 'IV (in clinic)', 'Sublingual', 'Other']) expect(sitePlan(r, 'bpc-157')).toBeNull();
  });

  it('keeps muscle shots out of the belly', () => {
    const p = sitePlan(IM, 'thymalin')!;
    expect(p.belly).toBe(false);
    expect(p.sites.some(k => k.startsWith('abd-'))).toBe(false);
    expect(p.sites).toEqual(expect.arrayContaining(['arm-r', 'thigh-l', 'glute-r']));
  });

  it('starts shots under the skin on the belly, and leaves out the buttocks unless a label allows them', () => {
    const p = sitePlan(SC, 'bpc-157')!;
    expect(p.sites[0]).toBe('abd-ur');
    expect(p.sites.some(k => k.startsWith('glute-'))).toBe(false);
    expect(sitePlan(SC, 'somatropin')!.sites).toContain('glute-l');
  });

  it('follows the label where one names the sites', () => {
    expect(sitePlan(SC, 'tesamorelin')!.sites.every(k => k.startsWith('abd-'))).toBe(true);
    expect(sitePlan(SC, 'bremelanotide')!.sites.some(k => k.startsWith('arm-'))).toBe(false);
    expect(sitePlan(SC, 'tirzepatide')!.short).toMatch(/label/);
    for (const id of ['tirzepatide', 'semaglutide', 'tesamorelin', 'bremelanotide', 'somatropin']) {
      expect(PEP[id], id).toBeTruthy();
      for (const k of sitePlan(SC, id)!.sites) expect(keys.has(k), `${id}: ${k}`).toBe(true);
    }
  });
});

describe('suggestSite and siteLabel', () => {
  it('suggests the allowed site rested longest', () => {
    const plan = sitePlan(SC, 'tirzepatide')!;
    expect(suggestSite({}, plan.sites)).toBe('abd-ur');
    const now = Date.parse('2026-11-01T12:00:00Z');
    const last: Record<string, Date> = {};
    plan.sites.forEach((k, i) => { last[k] = new Date(now - (10 - i) * 86400000); });
    last['glute-r'] = new Date(now - 100 * 86400000);
    expect(suggestSite(last, plan.sites)).toBe('abd-ur');
    last['abd-ur'] = new Date(now);
    expect(suggestSite(last, plan.sites)).toBe('abd-ul');
  });

  it('names arm and thigh sites for the kind of injection', () => {
    expect(siteLabel('arm-r', SC)).toBe('Back of right upper arm');
    expect(siteLabel('arm-l', IM)).toBe('Left upper arm (deltoid)');
    expect(siteLabel('thigh-r', IM)).toBe('Right outer thigh');
    expect(siteLabel('abd-ll', SC)).toBe('Abdomen, lower left');
  });
});
