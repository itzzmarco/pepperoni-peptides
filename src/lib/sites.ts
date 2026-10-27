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

/** Belly clock: 12 spots in a ring around the navel, 12 toward the chest. Moving one hour clockwise each dose rotates sites. */
export const BELLY = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => ({ k: `belly-${h}`, h, label: `Belly, ${h} o'clock` }));

export const SITE_LABEL: Record<string, string> = Object.fromEntries([...SITES, ...BELLY].map(s => [s.k, s.label]));

export const bellyHour = (site: string) => BELLY.find(b => b.k === site)?.h ?? null;

/** The belly-clock hour of this regimen's most recent dose there. `doses` is newest first, as the store keeps it. */
export const lastBellyHour = (rid: string, doses: { rid: string; site: string }[]) => {
  const d = doses.find(x => x.rid === rid && bellyHour(x.site));
  return d ? bellyHour(d.site) : null;
};

/** One hour clockwise from the last belly dose; with no history, the hour rested longest (12 first). */
export function nextBellyHour(lastHour: number | null, last: Record<string, Date>): number {
  if (lastHour) return (lastHour % 12) + 1;
  return BELLY.slice().sort((a, b) => (last[a.k]?.getTime() ?? 0) - (last[b.k]?.getTime() ?? 0))[0].h;
}

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

/** Least recently used site first; never-used sites come before any used one. */
export function suggestSite(last: Record<string, Date>): string {
  return SITES.slice().sort((a, b) => (last[a.k]?.getTime() ?? 0) - (last[b.k]?.getTime() ?? 0))[0].k;
}
