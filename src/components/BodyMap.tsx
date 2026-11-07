import { DAY, fmtShort } from '../lib/format';
import { SITES, siteLabel, suggestSite, type SitePlan } from '../lib/sites';

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
    <div className="stack" style={{ gap: 10 }}>
      <div className="bodymap">
        <svg viewBox="0 0 200 300" aria-hidden="true">
          <circle className="head" cx="100" cy="28" r="18" />
          <rect x="92" y="44" width="16" height="12" rx="3" />
          <rect x="36" y="58" width="20" height="104" rx="10" transform="rotate(8 46 58)" />
          <rect x="144" y="58" width="20" height="104" rx="10" transform="rotate(-8 154 58)" />
          <path d="M62 56 Q100 48 138 56 L134 168 Q100 178 66 168 Z" />
          <rect x="69" y="166" width="29" height="128" rx="13" />
          <rect x="102" y="166" width="29" height="128" rx="13" />
          <text x="22" y="292" style={{ fontSize: 10, fill: 'var(--ink-3)' }}>your right</text>
          <text x="178" y="292" textAnchor="end" style={{ fontSize: 10, fill: 'var(--ink-3)' }}>your left</text>
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
        <span><i style={{ background: 'var(--peach)', boxShadow: 'inset 0 0 0 2px var(--peach-bar)' }} />Used in last 3 days</span>
        <span><i style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 2px var(--sky-ink)' }} />Suggested</span>
      </div>
      <p className="small" style={{ textAlign: 'center', color: 'var(--ink-2)' }}>{plan.note}</p>
      {!selected && <p className="small" style={{ textAlign: 'center', color: 'var(--ink-2)' }}>Suggested next: <b>{label(next)}</b>. Rotating sites helps prevent lumps and scarring.</p>}
    </div>
  );
}
