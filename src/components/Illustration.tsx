import { useId, type ReactNode } from 'react';

/**
 * Small empty-state illustrations. Inline SVG coloured only with theme tokens, so they follow
 * light and dark mode and never touch the network. Decorative: the copy next to them says what matters.
 */
type Props = { size?: number };
const svg = (size: number) => ({ width: size, height: Math.round(size * 0.75), viewBox: '0 0 160 120', className: 'illo', 'aria-hidden': true as const, focusable: 'false' as const });
/** Every empty state shares one block: the art centred straight on the card, above the copy, with no plate of its own.
 *  All the scenes share one light from the top left: each object casts a soft shadow down and to the right
 *  (the `Cast` group), which gives them a little depth. Outlines are fine lines, so the art reads as a drawing, not an icon. */
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

/** Today, nothing tracked yet. Drawn for the dark instrument card it sits on, in that card's own colours: a lit
 *  calendar page with this week's first day checked, a vial in front of it with a pink cap, and a few sparks. */
export function IlloStart({ size = 240 }: Props) {
  const u = useId();
  return (
    <Ground><svg {...svg(size)}>
      <defs>
        <radialGradient id={`${u}st-glow`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="var(--dose-cell)" stopOpacity=".35" /><stop offset="1" stopColor="var(--dose-cell)" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${u}st-page`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--on-dark)" stopOpacity=".16" /><stop offset="1" stopColor="var(--on-dark)" stopOpacity=".06" /></linearGradient>
        <linearGradient id={`${u}st-liquid`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--dose-cell)" /><stop offset="1" stopColor="var(--lilac-line)" /></linearGradient>
        <linearGradient id={`${u}st-glass`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--on-dark)" stopOpacity=".95" /><stop offset=".6" stopColor="var(--on-dark)" stopOpacity=".8" /><stop offset="1" stopColor="var(--on-dark-2)" stopOpacity=".85" /></linearGradient>
      </defs>
      <ellipse cx="88" cy="60" rx="78" ry="56" fill={`url(#${u}st-glow)`} />
      <ellipse cx="84" cy="110" rx="56" ry="5" fill="var(--illo-shade-on-dark)" />
      {/* Calendar page */}
      <rect x="58" y="18" width="84" height="84" rx="16" fill={`url(#${u}st-page)`} stroke="var(--dark-edge)" strokeWidth="1.2" />
      <path d="M58 34a16 16 0 0 1 16-16h52a16 16 0 0 1 16 16v4H58z" fill="var(--dose-cell)" />
      <path d="M62 30q2-8 12-8h40" stroke="var(--on-dark)" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".5" />
      <g fill="var(--dark)"><circle cx="78" cy="18" r="3" /><circle cx="122" cy="18" r="3" /></g>
      <g fill="var(--on-dark)" opacity=".14">
        <rect x="68" y="48" width="14" height="14" rx="5" /><rect x="86" y="48" width="14" height="14" rx="5" /><rect x="104" y="48" width="14" height="14" rx="5" /><rect x="122" y="48" width="12" height="14" rx="5" />
        <rect x="86" y="68" width="14" height="14" rx="5" /><rect x="104" y="68" width="14" height="14" rx="5" /><rect x="122" y="68" width="12" height="14" rx="5" />
        <rect x="104" y="86" width="14" height="10" rx="4" /><rect x="122" y="86" width="12" height="10" rx="4" />
      </g>
      <rect x="68" y="68" width="14" height="14" rx="5" fill="var(--go)" />
      <path d="M71.5 75l2.5 2.5 4.5-5" fill="none" stroke="var(--dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="85" y="67" width="16" height="16" rx="6" fill="none" stroke="var(--go)" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Vial */}
      <ellipse cx="40" cy="104" rx="20" ry="4" fill="var(--illo-shade-on-dark)" />
      <rect x="27" y="26" width="26" height="11" rx="4" fill="var(--brand)" />
      <rect x="29" y="27.5" width="10" height="3" rx="1.5" fill="var(--on-dark)" opacity=".45" />
      <rect x="31" y="37" width="18" height="6" fill="var(--on-dark-3)" />
      <path d="M22 50q0-7 7-7h22q7 0 7 7v44q0 9-9 9H31q-9 0-9-9z" fill={`url(#${u}st-glass)`} />
      <path d="M24 72h32v22q0 7-7 7H31q-7 0-7-7z" fill={`url(#${u}st-liquid)`} />
      <path d="M24 72h32" stroke="var(--on-dark)" strokeWidth="1.5" opacity=".7" />
      <g fill="var(--on-dark)" opacity=".55"><circle cx="34" cy="86" r="2" /><circle cx="44" cy="80" r="1.4" /><circle cx="47" cy="92" r="1.6" /></g>
      <rect x="31" y="52" width="18" height="12" rx="3" fill="var(--dark)" opacity=".12" />
      <path d="M33 56h10M33 60h14" stroke="var(--dark)" strokeWidth="1.6" strokeLinecap="round" opacity=".35" />
      <path d="M27 52v38" stroke="var(--on-dark)" strokeWidth="3" strokeLinecap="round" />
      {/* Sparks */}
      <path d="M148 40v8M144 44h8" stroke="var(--go)" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 30v6M11 33h6" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="150" cy="96" r="2.5" fill="var(--effect-cell)" />
      <circle cx="64" cy="10" r="1.8" fill="var(--on-dark-3)" />
    </svg></Ground>
  );
}

/** A soft pool of light behind a scene, in the scene's own tint, so each drawing sits in its own lit space as IlloStart does. */
const Glow = ({ id, c }: { id: string; c: string }) => (
  <radialGradient id={id} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={c} stopOpacity=".9" /><stop offset=".6" stopColor={c} stopOpacity=".35" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
);
/** Glass lit from the left: bright at the lit edge, a little grey toward the far side. */
const Glass = ({ id }: { id: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--surface)" /><stop offset=".55" stopColor="var(--surface)" stopOpacity=".9" /><stop offset="1" stopColor="var(--surface-3)" /></linearGradient>
);
const Fade = ({ id, a, b }: { id: string; a: string; b: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
);

/** Peptides, nothing tracked: a lit wall shelf with one capped vial and a syringe resting on it, a pool of light where
 *  the next vial will stand, and an add badge floating over it. */
export function IlloShelf({ size = 240 }: Props) {
  const u = useId();
  return (
    <Ground><svg {...svg(size)}>
      <Defs u={u} />
      <defs>
        <Glow id={`${u}sh-glow`} c="var(--mint)" />
        <Glass id={`${u}sh-glass`} />
        <Fade id={`${u}sh-liq`} a="var(--mint)" b="var(--mint-ink)" />
        <Fade id={`${u}sh-wood`} a="var(--sand)" b="var(--sand-ink)" />
        <Glow id={`${u}sh-spot`} c="var(--lemon)" />
      </defs>
      <ellipse cx="80" cy="54" rx="76" ry="52" fill={`url(#${u}sh-glow)`} />
      <rect x="16" y="10" width="128" height="72" rx="14" fill={`url(#${u}illo-dots)`} />
      <ellipse cx="80" cy="110" rx="62" ry="5" fill="var(--illo-shade)" />
      {/* Brackets, then the shelf: a lit top edge over a front face that darkens toward the floor */}
      <path d="M30 92h8l-8 10zM130 92h-8l8 10z" fill="var(--illo-line)" opacity=".6" />
      <path d="M18 80h124l4 4H14z" fill="var(--sand)" />
      <rect x="14" y="84" width="132" height="9" rx="2.5" fill={`url(#${u}sh-wood)`} opacity=".55" />
      <rect x="14" y="84" width="132" height="9" rx="2.5" fill={`url(#${u}illo-lo)`} />
      <path d="M17 84.5h126" stroke="var(--surface)" strokeWidth="1.2" opacity=".8" />
      {/* Where the first vial goes */}
      <ellipse cx="88" cy="80" rx="18" ry="5" fill={`url(#${u}sh-spot)`} />
      <path d="M88 48v8M84 52h8" stroke="var(--lemon-ink)" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
      {/* Vial: ribbed cap, crimp collar, glass body with a label, a mint fill and its meniscus */}
      <ellipse cx="46" cy="81" rx="16" ry="2.5" fill="var(--illo-shade)" />
      <rect x="34" y="20" width="24" height="11" rx="3" fill="var(--sky-ink)" />
      <path d="M38 22.5v6M42 22.5v6M46 22.5v6M50 22.5v6M54 22.5v6" stroke="var(--surface)" strokeWidth="1" opacity=".35" />
      <rect x="36" y="31" width="20" height="5" rx="1" fill="var(--ink-4)" />
      <path d="M37 32.5h18" stroke="var(--surface)" strokeWidth="1" opacity=".5" />
      <rect x="39" y="36" width="14" height="4" fill={`url(#${u}sh-glass)`} />
      <path d="M30 48q0-8 8-8h16q8 0 8 8v24q0 8-8 8H38q-8 0-8-8z" fill={`url(#${u}sh-glass)`} stroke="var(--illo-line)" strokeWidth="1.2" />
      <path d="M31.5 60h29v12q0 6.5-6.5 6.5H38q-6.5 0-6.5-6.5z" fill={`url(#${u}sh-liq)`} opacity=".85" />
      <ellipse cx="46" cy="60" rx="14.5" ry="1.6" fill="var(--mint)" />
      <g fill="var(--surface)" opacity=".7"><circle cx="41" cy="70" r="1.5" /><circle cx="51" cy="66" r="1" /><circle cx="49" cy="74" r="1.2" /></g>
      <rect x="35" y="45" width="22" height="10" rx="2" fill="var(--surface)" stroke="var(--illo-line)" strokeWidth=".8" />
      <path d="M38 48.5h11M38 52h16" stroke="var(--ink-4)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M33.5 46v26" stroke="var(--surface)" strokeWidth="2.6" strokeLinecap="round" opacity=".9" />
      {/* Syringe at rest: needle, marked barrel with a little drawn up, plunger and thumb rest */}
      <ellipse cx="124" cy="81" rx="22" ry="1.8" fill="var(--illo-shade)" />
      <path d="M100 75h-10" stroke="var(--illo-line)" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="100" y="73.5" width="4" height="3" rx=".8" fill="var(--ink-4)" />
      <rect x="104" y="71" width="28" height="8" rx="2" fill={`url(#${u}sh-glass)`} stroke="var(--illo-line)" strokeWidth="1" />
      <rect x="105" y="72.2" width="9" height="5.6" rx="1" fill="var(--lilac-line)" opacity=".55" />
      <path d="M109 71v2.5M114 71v3.5M119 71v2.5M124 71v3.5M129 71v2.5" stroke="var(--illo-line)" strokeWidth=".8" />
      <rect x="114" y="72" width="2.5" height="6" rx=".6" fill="var(--ink-3)" />
      <path d="M132 75h9" stroke="var(--ink-4)" strokeWidth="2" />
      <rect x="132" y="69" width="2" height="12" rx="1" fill="var(--ink-4)" />
      <rect x="141" y="71.5" width="3" height="7" rx="1.5" fill="var(--ink-3)" />
      {/* Add badge, lit from the top left */}
      <circle cx="122" cy="34" r="16" fill={`url(#${u}sh-glow)`} />
      <circle cx="122" cy="34" r="11" fill="var(--btn)" />
      <circle cx="122" cy="34" r="11" fill={`url(#${u}illo-hi)`} opacity=".45" />
      <path d="M122 29v10M117 34h10" stroke="var(--btn-ink)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M140 18v6M137 21h6" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="20" cy="24" r="2" fill="var(--sky-dot)" />
    </svg></Ground>
  );
}

/** Learn, no matches: a fanned pair of library cards and a magnifier over them whose glass shows only blank paper. */
export function IlloSearch({ size = 240 }: Props) {
  const u = useId();
  return (
    <Ground><svg {...svg(size)}>
      <Defs u={u} />
      <defs>
        <Glow id={`${u}se-glow`} c="var(--lemon)" />
        <radialGradient id={`${u}se-lens`} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="var(--surface)" stopOpacity=".95" /><stop offset=".7" stopColor="var(--sky)" stopOpacity=".55" /><stop offset="1" stopColor="var(--sky-dot)" stopOpacity=".5" /></radialGradient>
        <Fade id={`${u}se-rim`} a="var(--ink-3)" b="var(--ink)" />
        <Fade id={`${u}se-grip`} a="var(--peach-bar)" b="var(--peach-ink)" />
      </defs>
      <ellipse cx="80" cy="56" rx="74" ry="52" fill={`url(#${u}se-glow)`} />
      <ellipse cx="74" cy="110" rx="56" ry="5" fill="var(--illo-shade)" />
      {/* Back card, tilted */}
      <g transform="rotate(-9 60 62)">
        <rect x="24" y="22" width="64" height="78" rx="12" fill="var(--surface-2)" stroke="var(--illo-line)" strokeWidth="1" />
        <rect x="24" y="22" width="64" height="78" rx="12" fill={`url(#${u}illo-lo)`} />
        <rect x="32" y="30" width="28" height="5" rx="2.5" fill="var(--surface-3)" />
      </g>
      {/* Front card: a glyph, a name, a tier ladder, two lines and a chip */}
      <rect x="40" y="24" width="66" height="80" rx="12" fill="var(--surface)" stroke="var(--illo-line)" strokeWidth="1.2" />
      <rect x="40" y="24" width="66" height="80" rx="12" fill={`url(#${u}illo-lo)`} />
      <rect x="48" y="32" width="26" height="6" rx="3" fill="var(--ink-4)" opacity=".7" />
      <rect x="48" y="41" width="18" height="4" rx="2" fill="var(--surface-3)" />
      <circle cx="94" cy="38" r="7" fill="var(--teal)" /><path d="M90.5 39.5l3.5-4 3.5 4" fill="none" stroke="var(--teal-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <g><rect x="48" y="52" width="7" height="3.5" rx="1.5" fill="var(--t2)" /><rect x="56.5" y="52" width="7" height="3.5" rx="1.5" fill="var(--t2)" /><rect x="65" y="52" width="7" height="3.5" rx="1.5" fill="var(--surface-3)" /><rect x="73.5" y="52" width="7" height="3.5" rx="1.5" fill="var(--surface-3)" /></g>
      <rect x="48" y="62" width="48" height="4" rx="2" fill="var(--surface-2)" /><rect x="48" y="70" width="36" height="4" rx="2" fill="var(--surface-2)" />
      <rect x="48" y="84" width="24" height="10" rx="5" fill="var(--lilac)" /><circle cx="53" cy="89" r="2" fill="var(--lilac-ink)" />
      {/* Magnifier: a shadow on the card, a turned steel rim, a lens with a highlight, a ribbed peach grip */}
      <ellipse cx="114" cy="74" rx="22" ry="6" fill="var(--illo-shade)" />
      <path d="M126 76l18 18" stroke={`url(#${u}se-grip)`} strokeWidth="9" strokeLinecap="round" />
      <path d="M131 85l3 -3M135 89l3-3M139 93l3-3" stroke="var(--surface)" strokeWidth="1.2" strokeLinecap="round" opacity=".45" />
      <path d="M121 71l7 7" stroke="var(--ink-3)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="108" cy="58" r="21" fill={`url(#${u}se-lens)`} />
      <g opacity=".5"><path d="M96 54h16M96 61h22" stroke="var(--surface-3)" strokeWidth="3" strokeLinecap="round" /></g>
      <circle cx="108" cy="58" r="21" fill="none" stroke={`url(#${u}se-rim)`} strokeWidth="4.5" />
      <circle cx="108" cy="58" r="23" fill="none" stroke="var(--surface)" strokeWidth=".8" opacity=".5" />
      <path d="M95 50q5-8 15-8" stroke="var(--surface)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="117" cy="68" r="1.8" fill="var(--surface)" opacity=".8" />
      <path d="M140 22v7M136.5 25.5h7" stroke="var(--lemon-ink)" strokeWidth="1.8" strokeLinecap="round" opacity=".7" />
      <circle cx="22" cy="30" r="2" fill="var(--lilac-line)" /><circle cx="146" cy="56" r="1.6" fill="var(--sky-dot)" />
    </svg></Ground>
  );
}

/** Trends with an empty log: a lit chart board on a stand, its first point set and a pencil about to draw the line,
 *  with the week's first bar just starting along the bottom. */
export function IlloTrends({ size = 240 }: Props) {
  const u = useId();
  return (
    <Ground><svg {...svg(size)}>
      <Defs u={u} />
      <defs>
        <Glow id={`${u}tr-glow`} c="var(--lilac)" />
        <Fade id={`${u}tr-board`} a="var(--surface)" b="var(--surface-2)" />
        <linearGradient id={`${u}tr-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--lilac-line)" stopOpacity=".35" /><stop offset="1" stopColor="var(--lilac-line)" stopOpacity="0" /></linearGradient>
        <Fade id={`${u}tr-pen`} a="var(--lemon)" b="var(--lemon-ink)" />
      </defs>
      <ellipse cx="80" cy="54" rx="76" ry="52" fill={`url(#${u}tr-glow)`} />
      <ellipse cx="80" cy="110" rx="58" ry="5" fill="var(--illo-shade)" />
      {/* Stand */}
      <path d="M60 98l-8 12M100 98l8 12M80 98v12" stroke="var(--illo-line)" strokeWidth="2.4" strokeLinecap="round" />
      {/* Board */}
      <rect x="20" y="14" width="120" height="86" rx="14" fill={`url(#${u}tr-board)`} stroke="var(--illo-line)" strokeWidth="1.2" />
      <rect x="20" y="14" width="120" height="86" rx="14" fill={`url(#${u}illo-hi)`} />
      <rect x="20" y="14" width="120" height="86" rx="14" fill={`url(#${u}illo-lo)`} />
      <rect x="30" y="22" width="30" height="5" rx="2.5" fill="var(--ink-4)" opacity=".6" />
      <rect x="112" y="21" width="20" height="8" rx="4" fill="var(--lilac)" /><circle cx="117" cy="25" r="1.8" fill="var(--lilac-ink)" />
      <path d="M32 40h96M32 54h96M32 68h96" stroke="var(--chart-grid)" strokeWidth="1" />
      <path d="M32 82h96" stroke="var(--illo-line)" strokeWidth="1.2" opacity=".6" />
      {/* The part of the line still to come, a faint wash; the first stretch drawn in */}
      <path d="M40 70q10-2 16-8t16-4V82H40z" fill={`url(#${u}tr-area)`} />
      <path d="M40 70q10-2 16-8t16-4" fill="none" stroke="var(--lilac-line)" strokeWidth="3" strokeLinecap="round" />
      <path d="M72 58q12-2 20-10t26-10" fill="none" stroke="var(--lilac-line)" strokeWidth="1.5" strokeLinecap="round" opacity=".25" />
      <circle cx="40" cy="70" r="5" fill="var(--lilac-line)" stroke="var(--surface)" strokeWidth="2.5" />
      <circle cx="40" cy="70" r="9" fill="none" stroke="var(--lilac-line)" strokeWidth="1" opacity=".35" />
      <g fill="var(--mint-ink)"><rect x="38" y="86" width="8" height="8" rx="2" /><rect x="50" y="90" width="8" height="4" rx="2" opacity=".45" /><rect x="62" y="91" width="8" height="3" rx="1.5" opacity=".25" /></g>
      {/* Pencil: lemon body with a facet line, ferrule, peach eraser, sharpened tip resting at the end of the line */}
      <g transform="translate(-2.4 14.8) rotate(38 84 52)">
        <rect x="80" y="47" width="36" height="8" rx="1" fill={`url(#${u}tr-pen)`} />
        <path d="M80 49.5h36" stroke="var(--surface)" strokeWidth="1" opacity=".55" />
        <rect x="116" y="47" width="6" height="8" fill="var(--ink-4)" /><path d="M118 47v8M120 47v8" stroke="var(--surface)" strokeWidth=".7" opacity=".5" />
        <path d="M122 47h3a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-3z" fill="var(--peach-bar)" />
        <path d="M80 47l-9 4 9 4z" fill="var(--sand)" />
        <path d="M74 49.7l-3 1.3 3 1.3z" fill="var(--ink)" />
      </g>
      <path d="M146 30v7M142.5 33.5h7" stroke="var(--lilac-line)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="40" r="2" fill="var(--mint-ink)" opacity=".5" />
    </svg></Ground>
  );
}

/** Partner, nobody linked yet: two phones leaning toward each other, each with its own log on screen, and a link
 *  between them that is still open, with a spark where it will close. */
export function IlloPartner({ size = 240 }: Props) {
  const u = useId();
  const phone = (x: number, tint: string, ink: string, tilt: number, chart: boolean) => (
    <g transform={`rotate(${tilt} ${x + 22} 96)`}>
      <rect x={x} y="30" width="44" height="72" rx="11" fill="var(--dark)" stroke={ink} strokeWidth="1.5" strokeOpacity=".5" />
      <rect x={x + 3.5} y="34" width="37" height="64" rx="8" fill="var(--surface)" />
      <rect x={x + 16} y="37" width="12" height="3" rx="1.5" fill="var(--ink-4)" opacity=".7" />
      <rect x={x + 8} y="45" width="20" height="4" rx="2" fill={ink} opacity=".8" />
      {chart
        ? <><path d={`M${x + 9} 74l7-8 6 4 12-14V82H${x + 9}z`} fill={tint} /><path d={`M${x + 9} 74l7-8 6 4 12-14`} fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></>
        : [56, 65, 74].map((y, i) => <g key={y} opacity={1 - i * 0.25}><circle cx={x + 11} cy={y + 2} r="3" fill={tint} /><path d={`M${x + 9.6} ${y + 2}l1 1 2-2`} stroke={ink} strokeWidth="1.2" fill="none" strokeLinecap="round" /><rect x={x + 17} y={y} width={18 - i * 4} height="4" rx="2" fill="var(--surface-3)" /></g>)}
      <rect x={x + 8} y="86" width="28" height="6" rx="3" fill={ink} opacity=".85" />
      <rect x={x} y="30" width="44" height="72" rx="11" fill={`url(#${u}illo-hi)`} opacity=".7" />
    </g>
  );
  return (
    <Ground><svg {...svg(size)}>
      <Defs u={u} />
      <defs>
        <Glow id={`${u}pa-glow`} c="var(--peach)" />
        <Glow id={`${u}pa-glow2`} c="var(--sky)" />
      </defs>
      <ellipse cx="50" cy="60" rx="52" ry="50" fill={`url(#${u}pa-glow)`} />
      <ellipse cx="112" cy="60" rx="52" ry="50" fill={`url(#${u}pa-glow2)`} />
      <ellipse cx="80" cy="110" rx="62" ry="5" fill="var(--illo-shade)" />
      {phone(20, 'var(--peach)', 'var(--peach-ink)', -7, false)}
      {phone(96, 'var(--sky)', 'var(--sky-ink)', 7, true)}
      {/* The open link: two halves of a chain, a gap, and the spark where they will meet */}
      <g fill="none" strokeWidth="3.2" strokeLinecap="round">
        <path d="M62 22h7a6 6 0 0 1 0 12h-7" stroke="var(--peach-ink)" />
        <path d="M98 34h-7a6 6 0 0 1 0-12h7" stroke="var(--sky-ink)" />
      </g>
      <path d="M80 20v8M76 24h8" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
      <g fill="var(--lilac-line)"><circle cx="74" cy="44" r="1.6" /><circle cx="80" cy="48" r="1.6" opacity=".6" /><circle cx="86" cy="44" r="1.6" /></g>
      <circle cx="148" cy="22" r="2" fill="var(--lemon-ink)" opacity=".6" /><circle cx="12" cy="30" r="2" fill="var(--mint-ink)" opacity=".5" />
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
