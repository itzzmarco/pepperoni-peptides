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

/** Today, nothing tracked yet: one vial, drawn in the wordmark vial's own material (pink cap, light glass, a pale dose)
 *  at hero size, on the dark instrument card it sits on. The headline carries the welcome; the art is just the object,
 *  with the same top-left light, dot texture and floor shade as the spot drawings.
 *  `locked` is the signed-out card: the same vial with the account's cloud behind it and a padlock badge on its foot,
 *  so "your log is in your account" reads apart from "start your log" at a glance. */
export function IlloStart({ size = 200, locked }: Props & { locked?: boolean }) {
  const u = useId();
  return (
    <Ground><svg {...svg(size)} viewBox="0 0 160 100" height={size * 100 / 160} className="illo scene">
      <defs>
        <radialGradient id={`${u}st-halo`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="var(--on-dark)" stopOpacity=".14" /><stop offset="1" stopColor="var(--on-dark)" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${u}st-glass`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--on-dark)" /><stop offset=".6" stopColor="var(--on-dark)" stopOpacity=".92" /><stop offset="1" stopColor="var(--on-dark-3)" /></linearGradient>
        <linearGradient id={`${u}st-lo`} x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stopColor="var(--illo-shade-on-dark)" stopOpacity="0" /><stop offset="1" stopColor="var(--illo-shade-on-dark)" /></linearGradient>
        <pattern id={`${u}st-dots`} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".9" fill="var(--on-dark)" opacity=".14" /></pattern>
      </defs>
      <circle cx="80" cy="50" r="48" fill={`url(#${u}st-halo)`} />
      <circle cx="80" cy="50" r="40" fill={`url(#${u}st-dots)`} />
      {locked && <path d="M104 46h30a10 10 0 0 0 0-20 14 14 0 0 0-27-4 10 10 0 0 0-3 24z" fill="var(--on-dark)" opacity=".2" />}
      <ellipse cx="80" cy="93" rx="30" ry="4" fill="var(--illo-shade-on-dark)" />
      {/* Cap and crimp, then the glass body with its dose, a scale and a sheen down the lit side. */}
      <rect x="64" y="6" width="32" height="14" rx="4" fill="var(--brand)" />
      <rect x="64" y="6" width="32" height="6" rx="3" fill="var(--on-dark)" opacity=".18" />
      <rect x="68" y="20" width="24" height="7" fill="var(--on-dark-3)" />
      <path d="M58 36q0-9 9-9h26q9 0 9 9v46q0 9-9 9H67q-9 0-9-9z" fill={`url(#${u}st-glass)`} />
      <path d="M60 62h40v20q0 7-7 7H67q-7 0-7-7z" fill="var(--on-dark-3)" />
      <path d="M60 62h40" stroke="var(--dose-cell)" strokeWidth="2" />
      <path d="M58 36q0-9 9-9h26q9 0 9 9v46q0 9-9 9H67q-9 0-9-9z" fill={`url(#${u}st-lo)`} />
      <g stroke="var(--dark)" strokeWidth="1.6" strokeLinecap="round" opacity=".35"><path d="M88 40h8M90 48h6M88 56h8M90 70h6M88 78h8" /></g>
      <path d="M65 36v44" stroke="var(--on-dark)" strokeWidth="4" strokeLinecap="round" />
      <g fill="var(--on-dark)" opacity=".5"><circle cx="34" cy="30" r="2" /><circle cx="128" cy="22" r="2.5" /><circle cx="122" cy="72" r="1.5" /></g>
      {locked && (
        <g>
          <circle cx="104" cy="80" r="15" fill="var(--on-dark)" />
          <path d="M98 78v-4a6 6 0 0 1 12 0v4" fill="none" stroke="var(--dark)" strokeWidth="3" strokeLinecap="round" />
          <rect x="95" y="77" width="18" height="12" rx="3" fill="var(--dark)" />
          <circle cx="104" cy="83" r="1.8" fill="var(--on-dark)" />
        </g>
      )}
    </svg></Ground>
  );
}

/** Glass lit from the left: bright at the lit edge, a little grey toward the far side. */
const Glass = ({ id }: { id: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--surface)" /><stop offset=".55" stopColor="var(--surface)" stopOpacity=".9" /><stop offset="1" stopColor="var(--surface-3)" /></linearGradient>
);
/** The block every spot drawing is built on: the shared defs, and a dotted disc behind the object as its backdrop,
 *  so the four empty pages read as one set. Children use `url(#${u}illo-…)` for the sheen and the bottom shade. */
const Spot = ({ u, size, children }: { u: string; size: number; children: ReactNode }) => (
  <Ground><svg {...svg(size)}>
    <Defs u={u} />
    <circle cx="48" cy="46" r="40" fill={`url(#${u}illo-dots)`} />
    {children}
  </svg></Ground>
);
const Fade = ({ id, a, b }: { id: string; a: string; b: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
);

/** Peptides, nothing tracked: one capped vial, a mint fill, and a blank label waiting for a name. */
export function IlloShelf({ size = 120 }: Props) {
  const u = useId();
  return (
    <Spot u={u} size={size}>
      <defs>
        <Glass id={`${u}sh-glass`} />
        <Fade id={`${u}sh-liq`} a="var(--mint)" b="var(--mint-ink)" />
      </defs>
      <ellipse cx="48" cy="88" rx="24" ry="4" fill="var(--illo-shade)" />
      <rect x="32" y="8" width="32" height="14" rx="5" fill="var(--sky-ink)" />
      <rect x="36" y="22" width="24" height="7" rx="2" fill="var(--ink-4)" />
      <path d="M26 40q0-11 11-11h22q11 0 11 11v35q0 11-11 11H37q-11 0-11-11z" fill={`url(#${u}sh-glass)`} stroke="var(--illo-line)" strokeWidth="1.5" />
      <path d="M28 58h40v17q0 9-9 9H37q-9 0-9-9z" fill={`url(#${u}sh-liq)`} />
      <path d="M26 40q0-11 11-11h22q11 0 11 11v35q0 11-11 11H37q-11 0-11-11z" fill={`url(#${u}illo-lo)`} />
      <rect x="36" y="38" width="24" height="12" rx="3" fill="var(--surface)" stroke="var(--illo-line)" strokeWidth="1" />
      <path d="M40 44h12" stroke="var(--surface-3)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 40v36" stroke="var(--surface)" strokeWidth="4" strokeLinecap="round" opacity=".85" />
    </Spot>
  );
}

/** Learn, no matches: a magnifier whose lens shows nothing under it. */
export function IlloSearch({ size = 120 }: Props) {
  const u = useId();
  return (
    <Spot u={u} size={size}>
      <defs>
        <radialGradient id={`${u}se-lens`} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="var(--surface)" /><stop offset=".7" stopColor="var(--sky)" stopOpacity=".7" /><stop offset="1" stopColor="var(--sky-dot)" stopOpacity=".6" /></radialGradient>
        <Fade id={`${u}se-grip`} a="var(--peach-bar)" b="var(--peach-ink)" />
      </defs>
      <ellipse cx="50" cy="88" rx="30" ry="4" fill="var(--illo-shade)" />
      <path d="M60 60l20 20" stroke={`url(#${u}se-grip)`} strokeWidth="12" strokeLinecap="round" />
      <path d="M54 54l8 8" stroke="var(--ink-3)" strokeWidth="8" strokeLinecap="round" />
      <circle cx="40" cy="40" r="25" fill={`url(#${u}se-lens)`} stroke="var(--ink-2)" strokeWidth="6" />
      <circle cx="40" cy="40" r="22" fill={`url(#${u}illo-lo)`} />
      <path d="M24 34q4-12 16-15" stroke="var(--surface)" strokeWidth="5" strokeLinecap="round" fill="none" />
    </Spot>
  );
}

/** Trends with an empty log: one chart card with a short rising line, its latest point marked. */
export function IlloTrends({ size = 120 }: Props) {
  const u = useId();
  return (
    <Spot u={u} size={size}>
      <defs>
        <Fade id={`${u}tr-board`} a="var(--surface)" b="var(--surface-2)" />
        <linearGradient id={`${u}tr-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--lilac-line)" stopOpacity=".35" /><stop offset="1" stopColor="var(--lilac-line)" stopOpacity="0" /></linearGradient>
      </defs>
      <ellipse cx="48" cy="88" rx="32" ry="4" fill="var(--illo-shade)" />
      <rect x="12" y="12" width="72" height="70" rx="16" fill={`url(#${u}tr-board)`} stroke="var(--illo-line)" strokeWidth="1.5" />
      <rect x="12" y="12" width="72" height="70" rx="16" fill={`url(#${u}illo-hi)`} />
      <rect x="12" y="12" width="72" height="70" rx="16" fill={`url(#${u}illo-lo)`} />
      <path d="M24 70h48" stroke="var(--illo-line)" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
      <path d="M26 60l14-10 12 6 18-22V70H26z" fill={`url(#${u}tr-area)`} />
      <path d="M26 60l14-10 12 6 18-22" fill="none" stroke="var(--lilac-line)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="70" cy="34" r="6" fill="var(--lilac-line)" stroke="var(--surface)" strokeWidth="3" />
    </Spot>
  );
}

/** Partner, nobody linked yet: one chain link, a peach half and a sky half hooked together. */
export function IlloPartner({ size = 120 }: Props) {
  const u = useId();
  return (
    <Spot u={u} size={size}>
      <ellipse cx="48" cy="88" rx="30" ry="4" fill="var(--illo-shade)" />
      <g transform="rotate(-35 48 48)" fill="none" strokeWidth="9">
        <rect x="12" y="36" width="42" height="24" rx="12" stroke="var(--peach-ink)" />
        <rect x="42" y="36" width="42" height="24" rx="12" stroke="var(--sky-ink)" />
        {/* The peach link passes back over the sky one at the bottom, so the two read as hooked together. */}
        <path d="M54 48a12 12 0 0 1-12 12" stroke="var(--peach-ink)" />
        {/* The same bottom shade as the other drawings, laid along each link. */}
        <g stroke={`url(#${u}illo-lo)`}><rect x="12" y="36" width="42" height="24" rx="12" /><rect x="42" y="36" width="42" height="24" rx="12" /></g>
        <g stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" opacity=".5"><path d="M24 38h16" /><path d="M58 38h18" /></g>
      </g>
    </Spot>
  );
}

/** Profile band backdrop: a hairline peptide chain of small linked residues in the band's empty top right corner, beside
 *  the family glyph and eyebrow and above the name, so the title stays the clear start of the page. It takes the band's
 *  tier tint (`--tc`) and draws only thin outlines, so nothing on the band loses contrast. */
const CHAIN: [number, number, number][] = [[6, 52, 3], [28, 44, 4], [50, 49, 3.5], [70, 34, 5], [94, 38, 4], [112, 22, 5.5], [133, 18, 4], [148, 5, 5]];
/** `seed` (the peptide's id) gives each profile its own chain: it starts one to three residues in, and each residue's
 *  size shifts a little, so no two neighbouring profiles share one drawing. */
export function BandArt({ seed = '' }: { seed?: string }) {
  const k = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);
  const chain = CHAIN.slice(k % 3).map(([x, y, r], i) => [x, y, r + (((k >> i) % 3) - 1) * 0.8] as const);
  const bonds = chain.slice(1).map(([x, y], i) => `M${chain[i][0]} ${chain[i][1]}L${x} ${y}`).join('');
  return (
    <svg className="band-art" width="156" height="60" viewBox="0 0 156 60" aria-hidden="true" focusable="false">
      <g fill="none" stroke="var(--tc)" strokeWidth="1.25" strokeLinecap="round">
        <path d={bonds} opacity=".4" />
        <path d="M70 34l-3 12M112 22l5 11" strokeDasharray="1.5 3" opacity=".4" />
        {chain.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} opacity=".55" />)}
      </g>
    </svg>
  );
}
