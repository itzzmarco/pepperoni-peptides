import { useId } from 'react';
import { DAY, fmtShort } from '../lib/format';
import { Cast, Defs } from './Illustration';
import { SITES, siteLabel, suggestSite, type SitePlan } from '../lib/sites';

/** The front-facing figure as one silhouette (viewBox 200 x 300), drawn in the empty-state illustrations' light: a sheen
 *  from the top left, a shade toward the feet, a cast shadow down and to the right, and a soft shadow on the ground. */
const BODY = 'M100 10C88 10 82 19 82 28C82 37 86 43 91 46L91 51C84 55 70 54 60 56C47 58 38 65 36 78L22 154C21 166 40 168 42 157L54 84C56 78 61 77 62 84C63 110 66 140 66 158C66 170 67 180 69 192L72 282C72 292 96 292 96 282L98 204C98 198 100 196 100 196C100 196 102 198 102 204L104 282C104 292 128 292 128 282L131 192C133 180 134 170 134 158C134 140 137 110 138 84C139 77 144 78 146 84L158 157C160 168 179 166 178 154L164 78C162 65 153 58 140 56C130 54 116 55 109 51L109 46C114 43 118 37 118 28C118 19 112 10 100 10Z';
export function BodyFigure() {
  const u = useId();
  return (
    <>
      <Defs u={u} />
      <ellipse cx="100" cy="290" rx="44" ry="5" fill="var(--illo-shade)" />
      <Cast><path d={BODY} /></Cast>
      <path d={BODY} fill="var(--surface)" />
      <path d={BODY} fill={`url(#${u}illo-hi)`} />
      <path d={BODY} fill={`url(#${u}illo-lo)`} />
      <path d={BODY} fill="none" stroke="var(--illo-line)" strokeOpacity=".3" strokeWidth="1.2" />
    </>
  );
}

/**
 * Front-facing figure with tappable injection sites: peach if used in the last 3 days, dashed ring on the suggested one.
 * Only the sites that fit this kind of injection (`plan`) are shown. `suggested` is this peptide's
 * next spot in its own rotation; without it, the allowed site rested longest.
 */
export function BodyMap({ selected, onSelect, last, plan, route, suggested }: {
  selected: string; onSelect: (k: string) => void; last: Record<string, Date>; plan: SitePlan; route: string; suggested?: string;
}) {
  const shown = SITES.filter(s => plan.sites.includes(s.k));
  const label = (k: string) => siteLabel(k, route);
  const age = (k: string) => (!last[k] ? 'never' : Date.now() - last[k].getTime() < 3 * DAY ? 'fresh' : 'rested');
  const lastTxt = (k: string) => (last[k] ? `last used ${fmtShort(last[k])}` : 'not used yet');
  const pick = (k: string) => onSelect(selected === k ? '' : k);
  const next = suggested && plan.sites.includes(suggested) ? suggested : suggestSite(last, plan.sites);
  return (
    <div className="stack gap-3">
      <div className="bodymap">
        <svg viewBox="0 0 200 300" aria-hidden="true">
          <BodyFigure />
          <text x="22" y="292" style={{ fontSize: 'var(--fs-2xs)', fill: 'var(--ink-3)' }}>your right</text>
          <text x="178" y="292" textAnchor="end" style={{ fontSize: 'var(--fs-2xs)', fill: 'var(--ink-3)' }}>your left</text>
        </svg>
        {shown.filter(s => 'x' in s).map(s => (
          <button
            key={s.k} type="button" className="site"
            style={{ left: `${(s as { x: number }).x}%`, top: `${(s as { y: number }).y}%` }}
            data-age={age(s.k)} data-next={s.k === next && selected !== s.k ? true : undefined} aria-pressed={selected === s.k}
            aria-label={`${label(s.k)}, ${lastTxt(s.k)}${s.k === next ? ', suggested' : ''}`} title={`${label(s.k)}: ${lastTxt(s.k)}`}
            onClick={() => pick(s.k)}
          />
        ))}
      </div>
      <div className="row-wrap" style={{ justifyContent: 'center' }}>
        {shown.filter(s => !('x' in s)).map(s => (
          <button key={s.k} type="button" className="fchip" aria-pressed={selected === s.k} onClick={() => pick(s.k)}>
            {label(s.k)} <span className="xsmall" style={{ opacity: .75 }}>{lastTxt(s.k)}</span>
          </button>
        ))}
      </div>
      <div className="site-legend">
        <span><i style={{ background: 'var(--peach)', border: '2px solid var(--peach)' }} />Used in last 3 days</span>
        <span><i style={{ background: 'var(--surface)', border: '2px dashed var(--sky-ink)' }} />Suggested</span>
      </div>
      <p className="small center tone-ink">{plan.note}</p>
      {!selected && <p className="small center tone-ink">Suggested next: <b>{label(next)}</b>. Rotating sites helps prevent lumps and scarring.</p>}
    </div>
  );
}
