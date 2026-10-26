/** Injection sites on a front-facing figure. x/y are percentages of the body map; buttocks have no front position. */
export const SITES = [
  { k: 'arm-r', label: 'Right upper arm', x: 20.5, y: 31.7 },
  { k: 'arm-l', label: 'Left upper arm', x: 79.5, y: 31.7 },
  { k: 'abd-ur', label: 'Abdomen, upper right', x: 42.5, y: 38.5 },
  { k: 'abd-ul', label: 'Abdomen, upper left', x: 57.5, y: 38.5 },
  { k: 'abd-lr', label: 'Abdomen, lower right', x: 42.5, y: 48.5 },
  { k: 'abd-ll', label: 'Abdomen, lower left', x: 57.5, y: 48.5 },
  { k: 'thigh-r', label: 'Right thigh', x: 42.5, y: 68.5 },
  { k: 'thigh-l', label: 'Left thigh', x: 57.5, y: 68.5 },
  { k: 'glute-r', label: 'Right buttock' },
  { k: 'glute-l', label: 'Left buttock' },
] as const;

export const SITE_LABEL: Record<string, string> = Object.fromEntries(SITES.map(s => [s.k, s.label]));

/** Most recent use of each site across all logged doses. */
export function lastUsedBySite(doses: { site: string; at: string }[]): Record<string, Date> {
  const last: Record<string, Date> = {};
  for (const d of doses) {
    if (!d.site) continue;
    const t = new Date(d.at);
    if (!last[d.site] || t > last[d.site]) last[d.site] = t;
  }
  return last;
}

/** How far back a site counts as part of someone's usual rotation. */
const ROTATION_DAYS = 90;

/**
 * The next site to use. Once someone rotates through two or more sites, suggest the longest-rested of those
 * rather than a spot they never use. Otherwise, least recently used first, with never-used sites before any used one.
 */
export function suggestSite(last: Record<string, Date>, now = new Date()): string {
  const usual = SITES.filter(s => last[s.k] && now.getTime() - last[s.k].getTime() < ROTATION_DAYS * 864e5);
  if (usual.length >= 2) return usual.sort((a, b) => last[a.k].getTime() - last[b.k].getTime())[0].k;
  return SITES.slice().sort((a, b) => (last[a.k]?.getTime() ?? 0) - (last[b.k]?.getTime() ?? 0))[0].k;
}
