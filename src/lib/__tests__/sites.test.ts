import { describe, expect, it } from 'vitest';
import { lastUsedBySite, suggestSite } from '../sites';

const NOW = new Date(2026, 9, 26, 12);
const ago = (days: number) => new Date(NOW.getTime() - days * 864e5);

describe('suggestSite', () => {
  it('starts with a site never used when there is no rotation yet', () => {
    expect(suggestSite({}, NOW)).toBe('arm-r');
    expect(suggestSite({ 'arm-r': ago(2) }, NOW)).toBe('arm-l');
  });

  it("suggests the longest-rested of the sites someone rotates through, not one they never use", () => {
    const last = { 'thigh-r': ago(7), 'abd-ll': ago(14), 'abd-lr': ago(21), 'thigh-l': ago(28) };
    expect(suggestSite(last, NOW)).toBe('thigh-l');
  });

  it('ignores sites last used more than 90 days ago when picking from the rotation', () => {
    const last = { 'thigh-r': ago(3), 'abd-ll': ago(10), 'arm-l': ago(200) };
    expect(suggestSite(last, NOW)).toBe('abd-ll');
  });
});

describe('lastUsedBySite', () => {
  it('keeps the most recent use of each site and skips doses without one', () => {
    const last = lastUsedBySite([
      { site: 'thigh-r', at: ago(9).toISOString() },
      { site: 'thigh-r', at: ago(2).toISOString() },
      { site: '', at: ago(1).toISOString() },
    ]);
    expect(Object.keys(last)).toEqual(['thigh-r']);
    expect(last['thigh-r'].getTime()).toBe(ago(2).getTime());
  });
});
