import type { LegalKey, Tier } from '../lib/types';
import { LEGAL, TIERS } from '../data/reference';

export function TierChip({ t }: { t: Tier }) {
  return (
    <span className="chip tier" data-t={t}>
      <span className="dot" />T{t} · {TIERS[t].label}
    </span>
  );
}

/** Five rungs; more filled rungs means stronger evidence. Always paired with a text label nearby; `labelled` adds that
 *  label itself ("T3 · Label" beside the rungs), so the rungs are then hidden from screen readers to avoid saying it twice. */
export function Ladder({ t, wide, labelled }: { t: Tier; wide?: boolean; labelled?: boolean }) {
  const rungs = (
    <span className={`ladder${wide ? ' wide' : ''}`} data-t={t} {...(labelled ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `Evidence tier ${t} of 5: ${TIERS[t].label}` })}>
      <i /><i /><i /><i /><i />
    </span>
  );
  if (!labelled) return rungs;
  return <span className="ladder-l" data-t={t}>{rungs}<span><span className="sr-only">Evidence tier </span>T{t} · {TIERS[t].label}</span></span>;
}

export function LegalChip({ k }: { k: LegalKey }) {
  const l = LEGAL[k];
  if (!l) return null;
  return (
    <span className="chip legal" data-l={k} title={l.long}>
      {l.label}
    </span>
  );
}

export function WadaChip({ w }: { w?: string }) {
  if (!w) return null;
  return (
    <span className="chip wada" title="World Anti-Doping Agency status">
      WADA: {w}
    </span>
  );
}
