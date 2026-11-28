import { useEffect, useRef, useState } from 'react';
import type { Peptide } from '../lib/types';
import { useWidth } from './Motion';

export interface Bead {
  /** Text inside the bead (an amino-acid letter). */
  t?: string;
  /** CSS class: a residue class (aa-*). */
  c: string;
  title?: string;
}

/** The 20 standard amino acids by one-letter code: name and chemical class. */
const AA: Record<string, [name: string, cls: keyof typeof CLASSES]> = {
  A: ['Alanine', 'hy'], V: ['Valine', 'hy'], L: ['Leucine', 'hy'], I: ['Isoleucine', 'hy'], M: ['Methionine', 'hy'],
  F: ['Phenylalanine', 'ar'], W: ['Tryptophan', 'ar'], Y: ['Tyrosine', 'ar'],
  K: ['Lysine', 'po'], R: ['Arginine', 'po'], H: ['Histidine', 'po'],
  D: ['Aspartate', 'ne'], E: ['Glutamate', 'ne'],
  S: ['Serine', 'pl'], T: ['Threonine', 'pl'], N: ['Asparagine', 'pl'], Q: ['Glutamine', 'pl'],
  G: ['Glycine', 'sp'], P: ['Proline', 'sp'], C: ['Cysteine', 'sp'],
};
const CLASSES = {
  hy: 'water-avoiding', ar: 'ring-shaped', po: 'positive charge', ne: 'negative charge', pl: 'water-loving', sp: 'special shape', mod: 'added group',
};
const MODS: Record<string, string> = { Ac: 'Acetyl cap', Cu: 'Copper ion', NH2: 'Amide cap' };

const tokens = (p: Pick<Peptide, 'seq'>) => (!p.seq ? [] : Array.isArray(p.seq) ? p.seq : p.seq.split(''));
const cls = (t: string) => AA[t]?.[1] ?? 'mod';

/** A peptide's sequence as beads, colored by each residue's chemical class. */
export const seqBeads = (p: Pick<Peptide, 'seq'>): Bead[] =>
  tokens(p).map(t => ({ t, c: `aa-${cls(t)}`, title: AA[t] ? `${AA[t][0]} (${t}), ${CLASSES[cls(t)]}` : `${MODS[t] ?? t}, ${CLASSES.mod}` }));

/** A row of small dots: the same residue colors as a fingerprint for a library card. */
export function Dots({ p, max = 16 }: { p: Pick<Peptide, 'seq'>; max?: number }) {
  const b = seqBeads(p);
  if (!b.length) return null;
  return <span className="dots" aria-hidden="true">{b.slice(0, max).map((x, i) => <i key={i} className={x.c} />)}</span>;
}

const still = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Beads on a chain that folds back and forth to fit its container. The chain is built bead by bead on first
 * paint, then drifts as if floating; beads lean away from the pointer. Motion stops when off screen and for
 * reduced motion.
 */
export function Strand({ beads, label, picked, onPick }: {
  beads: Bead[];
  label: string;
  picked?: number | null;
  onPick?: (i: number) => void;
}) {
  const [box, W] = useWidth<HTMLDivElement>();
  const svg = useRef<SVGSVGElement>(null);

  // Layout. A bead is as wide as its longest label needs; rows are 1.25 pitches apart and joined by a half-circle turn.
  const longest = Math.max(1, ...beads.map(b => b.t?.length ?? 0));
  const n = beads.length;
  const d = longest > 2 ? longest * 8 + 14 : 27;
  const pitch = d + 7;
  const per = Math.max(2, Math.floor((W - 4) / pitch - 0.25));
  const rows = Math.ceil(n / per);
  const rowH = pitch * 1.25, amp = Math.min(5, pitch * 0.16);
  const padX = rows > 1 ? rowH / 2 + 2 : d / 2 + 2, padY = d / 2 + amp + 4;
  const H = padY * 2 + (rows - 1) * rowH;
  const base = beads.map((_, i) => {
    const r = Math.floor(i / per), c = i % per;
    return { x: padX + (r % 2 ? per - 1 - c : c) * pitch, y: padY + r * rowH, r };
  });
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => (i === 0 ? `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      : base[i].r === base[i - 1].r ? `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      : `A${rowH / 2} ${rowH / 2} 0 0 ${base[i - 1].r % 2 ? 0 : 1} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)).join('');

  // The drift loop reads the latest layout from a ref and writes straight to the DOM, so React never re-renders per frame.
  const live = useRef({ base, amp, path });
  live.current = { base, amp, path };
  useEffect(() => {
    const el = svg.current;
    if (!el || still()) return;
    const nodes = Array.from(el.querySelectorAll<SVGGElement>('.at'));
    const bond = el.querySelector<SVGPathElement>('.bond');
    const cur = live.current.base.map(p => ({ x: p.x, y: p.y }));
    let ptr: { x: number; y: number } | null = null;
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); ptr = { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const leave = () => { ptr = null; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointercancel', leave);
    let raf = 0, seen = true;
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; });
    io.observe(el);
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const { base: b, amp: a, path: toPath } = live.current;
      if (!seen || b.length !== nodes.length) return;
      for (let i = 0; i < b.length; i++) {
        const ph = t * 0.0017 - i * 0.55;
        let x = b[i].x + Math.cos(ph * 0.6) * a * 0.4, y = b[i].y + Math.sin(ph) * a;
        if (ptr) {
          const dx = x - ptr.x, dy = y - ptr.y, dist = Math.hypot(dx, dy) || 1, reach = 70;
          if (dist < reach) { const f = (1 - dist / reach) ** 2 * 16; x += (dx / dist) * f; y += (dy / dist) * f; }
        }
        const c = cur[i] ?? (cur[i] = { x, y });
        c.x += (x - c.x) * 0.16;
        c.y += (y - c.y) * 0.16;
        nodes[i].setAttribute('transform', `translate(${c.x.toFixed(2)} ${c.y.toFixed(2)})`);
      }
      bond?.setAttribute('d', toPath(cur.slice(0, b.length)));
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', leave);
    };
  }, [n]);

  return (
    <div className="strand-box" ref={box}>
      <svg className="strand" ref={svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <path className="bond draw" pathLength={1} d={path(base)} />
        {beads.map((b, i) => {
          const r = Math.min(d, 27) / 2;
          const wide = (b.t?.length ?? 0) > 2;
          return (
            <g key={i} className="at" transform={`translate(${base[i].x.toFixed(2)} ${base[i].y.toFixed(2)})`}>
              <g className={`bead pop ${b.c}${picked === i ? ' picked' : ''}${onPick ? ' hit' : ''}`} style={{ ['--i' as string]: i }}
                onPointerEnter={onPick && (() => onPick(i))} onClick={onPick && (() => onPick(i))}>
                {b.title && <title>{b.title}</title>}
                {wide ? <rect x={-d / 2} y={-13.5} width={d} height={27} rx={13.5} /> : <circle className={b.c} r={r} />}
                {b.t && <text style={{ fontSize: wide ? 11 : 13 }}>{b.t}</text>}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** A peptide's sequence as a living chain, with the residue under the pointer named below it. */
export function SeqStrand({ p }: { p: Peptide }) {
  const beads = seqBeads(p);
  const [pick, setPick] = useState<number | null>(null);
  if (!beads.length) return null;
  const used = [...new Set(beads.map(b => b.c))];
  return (
    <div className="stack" style={{ gap: 10 }}>
      <Strand beads={beads} label={`Amino-acid sequence: ${beads.map(b => b.t).join(' ')}`} picked={pick} onPick={setPick} />
      <p className="strand-cap" aria-live="polite">
        {pick == null ? `${p.seqNote ?? `${beads.length} residues`}. Point at a bead to name it.` : <><b>{pick + 1}.</b> {beads[pick].title}</>}
      </p>
      <div className="aa-legend" aria-hidden="true">
        {(Object.keys(CLASSES) as (keyof typeof CLASSES)[]).filter(k => used.includes(`aa-${k}`)).map(k => (
          <span key={k}><i className={`aa-${k}`} />{CLASSES[k][0].toUpperCase() + CLASSES[k].slice(1)}</span>
        ))}
      </div>
    </div>
  );
}
