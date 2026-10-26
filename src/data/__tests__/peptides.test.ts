import { describe, expect, it } from 'vitest';
import type { Peptide } from '../../lib/types';
import { PEPTIDES } from '../peptides';
import { FAMILIES, LEGAL, SAFETY, TIERS, TIMELINE } from '../reference';
import { ROUTES, UNITS } from '../options';

const EXPECTED_IDS = [
  'bpc-157', 'tb-500', 'wolverine-stack', 'ara-290', 'kpv', 'thymosin-alpha-1', 'thymalin', 'vip', 'll-37',
  'semaglutide', 'tirzepatide', 'retatrutide', 'cagrilintide', 'eloralintide', 'at7687', 'aod-9604', 'hgh-frag-176-191', '5-amino-1mq', 'l-carnitine', 'lipo-injections',
  'igf-1-lr3', 'tesamorelin', 'sermorelin', 'cjc-1295', 'ipamorelin', 'cjc-ipamorelin', 'ghrp-2', 'ghrp-6', 'mk-677', 'somatropin',
  'ghk-cu', 'ghk-cu-injectable', 'ahk-cu', 'snap-8', 'melanotan-2', 'afamelanotide', 'glow-klow', 'bremelanotide', 'kisspeptin',
  'semax', 'adamax', 'selank', 'dihexa', 'dsip', 'cerebrolysin', 'cortexin', 'p21', 'pe-22-28',
  'glutathione', 'ss-31', 'mots-c', 'epitalon', 'foxo4-dri', 'nad',
];

/** Field length limits from src/data/compounds/AUTHORING.md */
const LIMITS: Partial<Record<keyof Peptide, number>> = { summary: 240, mechanism: 400, claim: 220, shows: 320, status: 200 };

const strings = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

describe('peptide library', () => {
  it('has every planned entry exactly once', () => {
    const ids = PEPTIDES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it.each(PEPTIDES.map(p => [p.id, p] as const))('%s is well-formed', (_id, p) => {
    expect(FAMILIES[p.family]).toBeDefined();
    expect(LEGAL[p.legal]).toBeDefined();
    expect(TIERS[p.tier]).toBeDefined();
    expect(p.summary.trim().length).toBeGreaterThan(20);
    for (const [k, max] of Object.entries(LIMITS)) {
      const v = p[k as keyof Peptide];
      if (typeof v === 'string') expect(v.length, `${k} length`).toBeLessThanOrEqual(max!);
    }
    p.evidence?.forEach(e => expect(e.length).toBeLessThanOrEqual(220));
    if (p.defaultRoute) expect(ROUTES).toContain(p.defaultRoute);
    if (p.defaultUnit) expect(UNITS).toContain(p.defaultUnit);
    expect(p.sources?.length ?? 0, 'sources').toBeGreaterThanOrEqual(2);
    p.sources?.forEach(s => {
      expect(s.t.trim()).not.toBe('');
      expect(() => new URL(s.u)).not.toThrow();
      expect(s.u.startsWith('https://') || s.u.startsWith('http://')).toBe(true);
    });
    strings(p).forEach(s => expect(s, 'no em-dashes').not.toMatch(/—/));
  });

  it('gives every unapproved or risky compound red flags to watch for', () => {
    const risky = PEPTIDES.filter(p => p.tier >= 3 && p.legal !== 'cosmetic' && p.legal !== 'supplement');
    risky.forEach(p => expect(p.redFlags?.length ?? 0, p.id).toBeGreaterThan(0));
  });
});

describe('reference content', () => {
  it('has a filled-in safety center and timeline', () => {
    expect(SAFETY.cards.length).toBeGreaterThanOrEqual(6);
    expect(SAFETY.questions.length).toBeGreaterThanOrEqual(5);
    expect(SAFETY.legalIntro).not.toBe('');
    expect(TIMELINE.length).toBeGreaterThanOrEqual(10);
    [...strings(SAFETY), ...strings(TIMELINE), ...strings(LEGAL)].forEach(s => expect(s).not.toMatch(/—/));
  });
});
