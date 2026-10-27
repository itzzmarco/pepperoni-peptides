import type { LegalKey, Peptide, Tier } from '../lib/types';
import { LEGAL, TIERS } from '../data/reference';

export function TierChip({ t }: { t: Tier }) {
  return (
    <span className="chip tier" data-t={t}>
      <span className="dot" />T{t} · {TIERS[t].label}
    </span>
  );
}

/** Five rungs; more filled rungs means stronger evidence. Always paired with a text label nearby. */
export function Ladder({ t, wide }: { t: Tier; wide?: boolean }) {
  return (
    <span className={`ladder${wide ? ' wide' : ''}`} data-t={t} role="img" aria-label={`Evidence tier ${t} of 5: ${TIERS[t].label}`}>
      <i /><i /><i /><i /><i />
    </span>
  );
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

export function SeqStrip({ p }: { p: Peptide }) {
  if (!p.seq) return null;
  const toks = Array.isArray(p.seq) ? p.seq : p.seq.split('');
  if (toks.length > 44) return <div className="seq-text" title="Amino-acid sequence">{toks.join('')}</div>;
  return (
    <div className="seq" aria-label={`Sequence ${toks.join(' ')}`}>
      {toks.map((t, i) => (
        <span key={i} className={t.length > 1 ? 'mod' : ''}>
          {t}
        </span>
      ))}
    </div>
  );
}
