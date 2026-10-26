import type { ReactNode } from 'react';
import type { LegalKey, Peptide, Tier } from '../lib/types';
import { LEGAL, TIERS } from '../data/reference';

export function TierChip({ t }: { t: Tier }) {
  return (
    <span className="chip tier" data-t={t}>
      <span className="dot" />T{t} · {TIERS[t].label}
    </span>
  );
}

/** Five rising bars, like signal strength: more filled bars means stronger human evidence. Always paired with a text label nearby. */
export function Ladder({ t, size = 'sm' }: { t: Tier; size?: 'sm' | 'lg' }) {
  return (
    <span className="ladder" data-t={t} data-size={size} role="img" aria-label={`Evidence tier ${t} of 5: ${TIERS[t].label}`}>
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

/** The legal label as colored text, for label-card fields. */
export function LegalText({ k }: { k: LegalKey }) {
  const l = LEGAL[k];
  if (!l) return null;
  return <span className="legal-text" data-l={k} title={l.long}>{l.label}</span>;
}

export function WadaChip({ w }: { w?: string }) {
  if (!w) return null;
  return (
    <span className="chip wada" title="World Anti-Doping Agency status">
      WADA: {w}
    </span>
  );
}

/** A row of labeled fields split by hairlines, like the boxes on a pharmacy label. */
export function Fields({ items, cols, className = '' }: { items: [label: ReactNode, value: ReactNode][]; cols?: string; className?: string }) {
  return (
    <dl className={`fields ${className}`} style={{ gridTemplateColumns: cols ?? `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map(([l, v], i) => (
        <div key={i}><dt>{l}</dt><dd>{v}</dd></div>
      ))}
    </dl>
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
