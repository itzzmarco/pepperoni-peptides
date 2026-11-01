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

/**
 * Which body-map sites fit an injection, by how it's given and, for approved drugs, by what the label says.
 * Sites are listed in the order to start from (belly first under the skin).
 */
export interface SitePlan {
  sites: string[];
  /** Whether the belly clock applies (any belly site allowed). */
  belly: boolean;
  /** Short list for a card, e.g. "Belly, thighs or back of arms". */
  short: string;
  /** One sentence for the body map. */
  note: string;
}

const ABDOMEN = ['abd-ur', 'abd-ul', 'abd-lr', 'abd-ll'];
const THIGHS = ['thigh-r', 'thigh-l'];
const ARMS = ['arm-r', 'arm-l'];
const GLUTES = ['glute-r', 'glute-l'];

const SUBQ: SitePlan = {
  sites: [...ABDOMEN, ...THIGHS, ...ARMS], belly: true,
  short: 'Belly, thighs or back of arms',
  note: 'Under the skin: the belly (about 2 in or 5 cm from the navel), the front of the thighs, or the back of the upper arms.',
};
const IM: SitePlan = {
  sites: [...ARMS, ...THIGHS, ...GLUTES], belly: false,
  short: 'Upper arm, outer thigh or buttock',
  note: 'Into the muscle: the upper arm (deltoid), the outer thigh, or the buttock. Not the belly.',
};

/** Approved drugs whose labels name the sites. Everything else injected under the skin uses SUBQ. */
const LABELED: Record<string, SitePlan> = {
  tirzepatide: { ...SUBQ, short: 'Belly, thighs or back of arms (label)', note: "The label's sites: belly, front of the thighs, or back of the upper arms. The arm is easier if someone else gives it." },
  semaglutide: { ...SUBQ, short: 'Belly, thighs or upper arms (label)', note: "The label's sites: belly, thighs, or upper arms." },
  tesamorelin: { sites: ABDOMEN, belly: true, short: 'Belly only (Egrifta label)', note: "Egrifta's label: inject into the belly only, rotating spots." },
  bremelanotide: { sites: [...ABDOMEN, ...THIGHS], belly: true, short: 'Belly or thighs (Vyleesi label)', note: "Vyleesi's label: the belly or the front of the thigh." },
  somatropin: { sites: [...ABDOMEN, ...THIGHS, ...ARMS, ...GLUTES], belly: true, short: 'Belly, thighs, arms or buttocks', note: 'Growth hormone labels list the belly, thighs, back of the upper arms and buttocks. Follow the one for your pen.' },
};

/** The sites for a dose given by `route`, or null when it isn't injected. */
export function sitePlan(route: string, compoundId?: string): SitePlan | null {
  if (route === 'Intramuscular injection') return IM;
  if (route !== 'Subcutaneous injection') return null;
  return (compoundId && LABELED[compoundId]) || SUBQ;
}

/** A site's name for this kind of injection: the back of the arm under the skin, the deltoid into the muscle. */
export function siteLabel(k: string, route?: string): string {
  const side = k.endsWith('-r') ? 'right' : 'left';
  if (route === 'Subcutaneous injection' && k.startsWith('arm-')) return `Back of ${side} upper arm`;
  if (route === 'Intramuscular injection' && k.startsWith('arm-')) return `${side === 'right' ? 'Right' : 'Left'} upper arm (deltoid)`;
  if (route === 'Intramuscular injection' && k.startsWith('thigh-')) return `${side === 'right' ? 'Right' : 'Left'} outer thigh`;
  return SITE_LABEL[k] ?? k;
}

/** Least recently used of `allowed` (all sites by default); never-used sites first, in the order given. */
export function suggestSite(last: Record<string, Date>, allowed: readonly string[] = SITES.map(s => s.k)): string {
  return allowed.slice().sort((a, b) => (last[a]?.getTime() ?? 0) - (last[b]?.getTime() ?? 0))[0];
}
