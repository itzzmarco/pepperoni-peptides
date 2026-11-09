import type { DoseEntry, Regimen } from '../lib/types';
import { regimenStatus } from '../lib/schedule';
import { checkRegimen } from '../lib/vial';
import { SYRINGE_UNITS } from '../lib/doseMath';
import { fmtNum } from '../lib/format';
import { SITES, nextSite, siteLabel, type NextSite } from '../lib/sites';
import { MiniClock } from './BellyClock';
import { BodyFigure } from './BodyMap';

/** Where each site sits on the small figure (viewBox 200 x 300, same as the body map). Buttocks are shown at the hips. */
const POS: Record<string, [number, number]> = {
  ...Object.fromEntries(SITES.filter(s => 'x' in s).map(s => [s.k, [(s as { x: number }).x * 2, (s as { y: number }).y * 3]])),
  'glute-r': [84, 178],
  'glute-l': [116, 178],
};

/** A small front-facing figure with one spot filled in: the next place to inject. */
export function MiniBody({ site, height = 76 }: { site: string; height?: number }) {
  const p = POS[site];
  return (
    <svg className="minibody" width={(height * 2) / 3} height={height} viewBox="0 0 200 300" aria-hidden="true">
      <BodyFigure />
      {p && <circle className="next pop" cx={p[0]} cy={p[1]} r="17" style={{ ['--i' as string]: 4 }} />}
      {p && site.startsWith('glute-') && <circle className="behind" cx={p[0]} cy={p[1]} r="27" />}
    </svg>
  );
}

/** The clock face or the figure for a suggested spot. */
export function SiteFigure({ s, size = 76 }: { s: NextSite; size?: number }) {
  return s.hour ? <MiniClock hour={s.hour} size={size} /> : <MiniBody site={s.site} height={size} />;
}

/** When this regimen's next dose is, in a few words. */
export function whenNext(r: Regimen, doses: DoseEntry[], now = new Date()) {
  const st = regimenStatus(r, doses, now);
  if (st.s === 'ok') return st.text.startsWith('Next: ') ? st.text.slice(6).replace(/^t/, 'T') : st.text;
  if (st.s === 'due' && !st.last) return 'Due now';
  return st.text;
}

/** The amount for one dose, with the syringe draw when it's measured some other way. */
export function doseText(r: Regimen) {
  const { math } = checkRegimen(r);
  const amount = `${fmtNum(Number(r.dose), 3)} ${r.unit}`;
  return math && r.unit !== SYRINGE_UNITS && r.unit !== 'mL' ? `${amount} · draw ${fmtNum(math.units, 1)} units` : amount;
}

/**
 * This peptide's next shot at a glance: the spot on a small figure (or the belly clock), the day, and
 * the amount. Nothing for doses that aren't injected or regimens that are paused.
 */
export function NextShot({ r, doses }: { r: Regimen; doses: DoseEntry[] }) {
  const s = r.paused ? null : nextSite(r, doses);
  if (!s) return null;
  return (
    <div className="nextshot" aria-label={`Next shot: ${siteLabel(s.site, r.route)}, ${whenNext(r, doses)}`}>
      <SiteFigure s={s} size={72} />
      <span className="stack gap-1 min-0">
        <span className="label">Next shot · {whenNext(r, doses)}</span>
        <b style={{ fontSize: 'var(--fs-lg)', lineHeight: 1.25 }}>{s.hour ? `Belly, ${s.hour} o'clock` : siteLabel(s.site, r.route)}</b>
        <span className="small tone-ink">{doseText(r)} · {s.why}</span>
      </span>
    </div>
  );
}
