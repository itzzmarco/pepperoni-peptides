import { DAY, fmtShort } from '../lib/format';
import { SITES, SITE_LABEL, suggestSite } from '../lib/sites';
import { CheckIcon } from './Icons';

/** Front-facing figure with tappable injection sites colored by how recently each was used. */
export function BodyMap({ selected, onSelect, last }: { selected: string; onSelect: (k: string) => void; last: Record<string, Date> }) {
  const age = (k: string) => (!last[k] ? 'never' : Date.now() - last[k].getTime() < 7 * DAY ? 'fresh' : 'rested');
  const lastTxt = (k: string) => (last[k] ? `last used ${fmtShort(last[k])}` : 'not used yet');
  const pick = (k: string) => onSelect(selected === k ? '' : k);
  const next = suggestSite(last);
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
        {SITES.filter(s => 'x' in s).map(s => (
          <button
            key={s.k} type="button" className="site"
            style={{ left: `${(s as { x: number }).x}%`, top: `${(s as { y: number }).y}%` }}
            data-age={age(s.k)} data-next={s.k === next && !selected ? '' : undefined} aria-pressed={selected === s.k}
            aria-label={`${s.label}, ${lastTxt(s.k)}${s.k === next ? ', suggested' : ''}`} title={`${s.label}: ${lastTxt(s.k)}`}
            onClick={() => pick(s.k)}
          >
            <i>{selected === s.k && <CheckIcon size={14} />}</i>
          </button>
        ))}
      </div>
      <div className="row-wrap" style={{ justifyContent: 'center' }}>
        {SITES.filter(s => !('x' in s)).map(s => (
          <button key={s.k} type="button" className="fchip" aria-pressed={selected === s.k} onClick={() => pick(s.k)}>
            {s.label} <span className="xsmall">{lastTxt(s.k)}</span>
          </button>
        ))}
      </div>
      <div className="site-legend">
        <span><i data-age="fresh" />Used in the last week</span>
        <span><i data-age="rested" />Rested a week or more</span>
        <span><i data-age="never" />Not used yet</span>
      </div>
      <p className="site-status" role="status">
        {selected
          ? <span><b>{SITE_LABEL[selected]}</b> <span className="muted">· {lastTxt(selected)}</span></span>
          : <span>Suggested next: <b>{SITE_LABEL[next]}</b> <span className="muted">· {lastTxt(next)}. Rotating sites helps prevent lumps.</span></span>}
        {selected && selected === next && <span className="tag">Suggested</span>}
      </p>
    </div>
  );
}
