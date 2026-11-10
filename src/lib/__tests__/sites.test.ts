import { describe, expect, it } from 'vitest';
import { SITES, nextSite, siteLabel, sitePlan, suggestSite } from '../sites';
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

describe('nextSite (each peptide keeps its own rotation)', () => {
  const r = { id: 't', route: SC, compoundId: 'tirzepatide' };
  const at = (daysAgo: number) => new Date(Date.parse('2026-11-06T23:00:00Z') - daysAgo * 86400000).toISOString();
  const shot = (site: string, daysAgo: number, rid = 't') => ({ rid, site, at: at(daysAgo) });

  it("starts a new peptide on the belly and names the label's sites", () => {
    const s = nextSite(r, [])!;
    expect(s).toMatchObject({ site: 'abd-ur', hour: null });
    expect(s.why).toMatch(/label/);
  });

  it("stays in the areas this peptide has been going into, moving to the spot rested longest", () => {
    const doses = [shot('abd-ll', 7), shot('abd-ur', 14), shot('abd-ul', 21), shot('abd-lr', 28)];
    const s = nextSite(r, doses)!;
    expect(s.site).toBe('abd-lr');
    expect(s.why).toBe('Rested longest of your belly spots');
    // Never-used thighs aren't pushed on someone who only uses the belly.
    expect(s.site.startsWith('abd-')).toBe(true);
  });

  it('follows the belly clock one hour on when the last shot used it', () => {
    const s = nextSite(r, [shot('belly-3', 7), shot('belly-2', 14)])!;
    expect(s).toMatchObject({ site: 'belly-4', hour: 4, fromHour: 3 });
    expect(nextSite(r, [shot('belly-3', 7)], 'map')!.hour).toBeNull();
  });

  it("counts other peptides' recent shots so the skin gets a rest, but not their areas", () => {
    const doses = [shot('abd-ur', 1, 'other'), shot('abd-ul', 7), shot('abd-ur', 14)];
    expect(nextSite(r, doses)!.site).toBe('abd-lr');
  });

  it('uses muscle sites for muscle shots and nothing for pills', () => {
    expect(nextSite({ ...r, route: IM }, [])!.site).toBe('arm-r');
    expect(nextSite({ ...r, route: 'Oral' }, [])).toBeNull();
  });
});
