import { describe, expect, it } from 'vitest';
import src from '../../components/Illustration.tsx?raw';

// AC-19: each empty-state illustration stays under 6KB of source.
const scenes = src.split(/(?=\/\*\*[^/]*\*\/\s*export function Illo)/).slice(1);

describe('empty-state illustrations', () => {
  it('finds the five scenes', () => {
    expect(scenes.map((s: string) => /export function (Illo\w+)/.exec(s)?.[1])).toEqual(['IlloStart', 'IlloShelf', 'IlloSearch', 'IlloTrends', 'IlloPartner']);
  });
  for (const s of scenes) {
    const name = /export function (Illo\w+)/.exec(s)?.[1];
    it(`${name} is under 6KB`, () => {
      const end = s.search(/\n\/\*\*|\nconst |\nexport const /);
      expect(new TextEncoder().encode(end > 0 ? s.slice(0, end) : s).length).toBeLessThan(6 * 1024);
    });
  }
});
