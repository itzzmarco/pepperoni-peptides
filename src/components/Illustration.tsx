import { useId, type ReactNode } from 'react';

/**
 * Small empty-state illustrations. Inline SVG coloured only with theme tokens, so they follow
 * light and dark mode and never touch the network. Decorative: the copy next to them says what matters.
 */
type Props = { size?: number };
const svg = (size: number) => ({ width: size, height: size, viewBox: '0 0 96 96', className: 'illo', 'aria-hidden': true as const, focusable: 'false' as const });
/** Every empty state shares one block: the art centred straight on the card, with no plate of its own.
 *  Each drawing is one object in bold, simple shapes, so it still reads as that object at 88px.
 *  All share one light from the top left: a sheen on the lit side and a soft floor shadow under the object. */
const Ground = ({ children }: { children: ReactNode }) => <div className="illo-ground" aria-hidden="true">{children}</div>;
/** Shadow copies of a scene's main shapes, offset away from the top-left light. */
export const Cast = ({ children }: { children: ReactNode }) => <g transform="translate(5 5)" fill="var(--illo-shade)">{children}</g>;
/** The second tone every object gets from the same light: a sheen from the top left (`url(#illo-hi)`), a shade
 *  toward the bottom (`url(#illo-lo)`), and a fine dot texture for paper and walls (`url(#illo-dots)`).
 *  Each instance prefixes its ids with `useId`, so two scenes on one page never share or shadow definitions. */
export const Defs = ({ u }: { u: string }) => (
  <defs>
    <linearGradient id={`${u}illo-hi`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--surface)" stopOpacity=".8" /><stop offset=".5" stopColor="var(--surface)" stopOpacity="0" /></linearGradient>
    <linearGradient id={`${u}illo-lo`} x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stopColor="var(--illo-shade)" stopOpacity="0" /><stop offset="1" stopColor="var(--illo-shade)" /></linearGradient>
    <pattern id={`${u}illo-dots`} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".9" fill="var(--illo-line)" opacity=".16" /></pattern>
  </defs>
);

/** Today, nothing tracked yet. Drawn for the dark instrument card it sits on, in that card's own colours:
 *  a calendar page with the first day checked and the rest still open. */
export function IlloStart({ size = 120 }: Props) {
  const u = useId();
  return (
    <Ground><svg {...svg(size)}>
      <defs>
        <linearGradient id={`${u}st-page`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--on-dark)" stopOpacity=".18" /><stop offset="1" stopColor="var(--on-dark)" stopOpacity=".07" /></linearGradient>
      </defs>
      <ellipse cx="48" cy="88" rx="30" ry="4" fill="var(--illo-shade-on-dark)" />
      <rect x="14" y="14" width="68" height="68" rx="16" fill={`url(#${u}st-page)`} stroke="var(--dark-edge)" strokeWidth="1.5" />
      <path d="M14 30a16 16 0 0 1 16-16h36a16 16 0 0 1 16 16v4H14z" fill="var(--dose-cell)" />
      <g fill="var(--dark)"><circle cx="34" cy="14" r="4" /><circle cx="62" cy="14" r="4" /></g>
      <g fill="var(--on-dark)" opacity=".16">
        <rect x="46" y="42" width="14" height="14" rx="5" /><rect x="64" y="42" width="10" height="14" rx="5" />
        <rect x="24" y="60" width="16" height="14" rx="5" /><rect x="46" y="60" width="14" height="14" rx="5" /><rect x="64" y="60" width="10" height="14" rx="5" />
      </g>
      <rect x="24" y="42" width="16" height="14" rx="5" fill="var(--go)" />
      <path d="M27.5 49l3 3 5.5-6" fill="none" stroke="var(--dark)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg></Ground>
  );
}

/** Glass lit from the left: bright at the lit edge, a little grey toward the far side. */
const Glass = ({ id }: { id: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--surface)" /><stop offset=".55" stopColor="var(--surface)" stopOpacity=".9" /><stop offset="1" stopColor="var(--surface-3)" /></linearGradient>
);
const Fade = ({ id, a, b }: { id: string; a: string; b: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
);

/** Peptides, nothing tracked: one capped vial, a mint fill, and a blank label waiting for a name. */
export function IlloShelf({ size = 120 }: Props) {
  const u = useId();
  return (
    <Ground><svg {...svg(size)}>
      <Defs u={u} />
      <defs>
        <Glass id={`${u}sh-glass`} />
        <Fade id={`${u}sh-liq`} a="var(--mint)" b="var(--mint-ink)" />
      </defs>
      <ellipse cx="48" cy="88" rx="24" ry="4" fill="var(--illo-shade)" />
      <rect x="32" y="8" width="32" height="14" rx="5" fill="var(--sky-ink)" />
      <rect x="36" y="22" width="24" height="7" rx="2" fill="var(--ink-4)" />
      <path d="M26 40q0-11 11-11h22q11 0 11 11v35q0 11-11 11H37q-11 0-11-11z" fill={`url(#${u}sh-glass)`} stroke="var(--illo-line)" strokeWidth="1.5" />
      <path d="M28 58h40v17q0 9-9 9H37q-9 0-9-9z" fill={`url(#${u}sh-liq)`} />
      <rect x="36" y="38" width="24" height="12" rx="3" fill="var(--surface)" stroke="var(--illo-line)" strokeWidth="1" />
      <path d="M40 44h12" stroke="var(--surface-3)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 40v36" stroke="var(--surface)" strokeWidth="4" strokeLinecap="round" opacity=".85" />
    </svg></Ground>
  );
}

/** Learn, no matches: a magnifier whose lens shows nothing under it. */
export function IlloSearch({ size = 120 }: Props) {
  const u = useId();
  return (
    <Ground><svg {...svg(size)}>
      <defs>
        <radialGradient id={`${u}se-lens`} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="var(--surface)" /><stop offset=".7" stopColor="var(--sky)" stopOpacity=".7" /><stop offset="1" stopColor="var(--sky-dot)" stopOpacity=".6" /></radialGradient>
        <Fade id={`${u}se-grip`} a="var(--peach-bar)" b="var(--peach-ink)" />
      </defs>
      <ellipse cx="50" cy="88" rx="30" ry="4" fill="var(--illo-shade)" />
      <path d="M60 60l20 20" stroke={`url(#${u}se-grip)`} strokeWidth="12" strokeLinecap="round" />
      <path d="M54 54l8 8" stroke="var(--ink-3)" strokeWidth="8" strokeLinecap="round" />
      <circle cx="40" cy="40" r="25" fill={`url(#${u}se-lens)`} stroke="var(--ink-2)" strokeWidth="6" />
      <path d="M24 34q4-12 16-15" stroke="var(--surface)" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg></Ground>
  );
}

/** Trends with an empty log: one chart card with a short rising line, its latest point marked. */
export function IlloTrends({ size = 120 }: Props) {
  const u = useId();
  return (
    <Ground><svg {...svg(size)}>
      <Defs u={u} />
      <defs>
        <Fade id={`${u}tr-board`} a="var(--surface)" b="var(--surface-2)" />
        <linearGradient id={`${u}tr-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--lilac-line)" stopOpacity=".35" /><stop offset="1" stopColor="var(--lilac-line)" stopOpacity="0" /></linearGradient>
      </defs>
      <ellipse cx="48" cy="88" rx="32" ry="4" fill="var(--illo-shade)" />
      <rect x="12" y="12" width="72" height="70" rx="16" fill={`url(#${u}tr-board)`} stroke="var(--illo-line)" strokeWidth="1.5" />
      <rect x="12" y="12" width="72" height="70" rx="16" fill={`url(#${u}illo-hi)`} />
      <path d="M24 70h48" stroke="var(--illo-line)" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
      <path d="M26 60l14-10 12 6 18-22V70H26z" fill={`url(#${u}tr-area)`} />
      <path d="M26 60l14-10 12 6 18-22" fill="none" stroke="var(--lilac-line)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="70" cy="34" r="6" fill="var(--lilac-line)" stroke="var(--surface)" strokeWidth="3" />
    </svg></Ground>
  );
}

/** Partner, nobody linked yet: one chain link, a peach half and a sky half hooked together. */
export function IlloPartner({ size = 120 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <ellipse cx="48" cy="88" rx="30" ry="4" fill="var(--illo-shade)" />
      <g transform="rotate(-35 48 48)" fill="none" strokeWidth="9">
        <rect x="12" y="36" width="42" height="24" rx="12" stroke="var(--peach-ink)" />
        <rect x="42" y="36" width="42" height="24" rx="12" stroke="var(--sky-ink)" />
        {/* The peach link passes back over the sky one at the bottom, so the two read as hooked together. */}
        <path d="M54 48a12 12 0 0 1-12 12" stroke="var(--peach-ink)" />
        <g stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" opacity=".5"><path d="M24 38h16" /><path d="M58 38h18" /></g>
      </g>
    </svg></Ground>
  );
}

/** Profile band backdrop: a peptide chain of linked residues drifting off the band's top right corner.
 *  It takes the band's tier tint (`--tc`) and sits behind the text, faint enough that every line on the band keeps its contrast. */
const CHAIN: [number, number, number][] = [[18, 132, 9], [50, 112, 12], [88, 120, 10], [116, 92, 14], [150, 98, 11], [170, 64, 15], [204, 56, 12], [222, 22, 16]];
/** `seed` (the peptide's id) gives each profile its own chain: it starts one to three residues in, and each residue's
 *  size shifts a little, so no two neighbouring profiles share one drawing. */
export function BandArt({ seed = '' }: { seed?: string }) {
  const k = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);
  const chain = CHAIN.slice(k % 3).map(([x, y, r], i) => [x, y, r + (((k >> i) % 3) - 1) * 2] as const);
  const bonds = chain.slice(1).map(([x, y], i) => `M${chain[i][0]} ${chain[i][1]}L${x} ${y}`).join('');
  return (
    <svg className="band-art" width="240" height="160" viewBox="0 0 240 160" aria-hidden="true" focusable="false">
      <path d={bonds} fill="none" stroke="var(--tc)" strokeWidth="3" strokeLinecap="round" opacity=".28" />
      <path d="M88 120l-6 26M150 98l8 26M204 56l-18-18" fill="none" stroke="var(--tc)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 5" opacity=".3" />
      {chain.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="var(--surface)" opacity=".5" />
          <circle cx={x} cy={y} r={r} fill="none" stroke="var(--tc)" strokeWidth="2" opacity=".32" />
          <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="var(--surface)" opacity=".7" />
        </g>
      ))}
    </svg>
  );
}
