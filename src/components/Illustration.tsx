import type { ReactNode } from 'react';

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
const Cast = ({ children }: { children: ReactNode }) => <g transform="translate(5 5)" fill="var(--illo-shade)">{children}</g>;
/** The second tone every object gets from the same light: a sheen from the top left (`url(#illo-hi)`), a shade
 *  toward the bottom (`url(#illo-lo)`), and a fine dot texture for paper and walls (`url(#illo-dots)`).
 *  Every scene carries identical copies, so whichever the page resolves first draws them all the same. */
const Defs = () => (
  <defs>
    <linearGradient id="illo-hi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--surface)" stopOpacity=".8" /><stop offset=".5" stopColor="var(--surface)" stopOpacity="0" /></linearGradient>
    <linearGradient id="illo-lo" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stopColor="var(--illo-shade)" stopOpacity="0" /><stop offset="1" stopColor="var(--illo-shade)" /></linearGradient>
    <pattern id="illo-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".9" fill="var(--illo-line)" opacity=".16" /></pattern>
  </defs>
);

/** Today, nothing tracked yet. Drawn for the dark instrument card it sits on, in that card's own colours: a lit
 *  calendar page with this week's first day checked, a vial in front of it with a pink cap, and a few sparks. */
export function IlloStart({ size = 240 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <defs>
        <radialGradient id="st-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="var(--dose-cell)" stopOpacity=".35" /><stop offset="1" stopColor="var(--dose-cell)" stopOpacity="0" /></radialGradient>
        <linearGradient id="st-page" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--on-dark)" stopOpacity=".16" /><stop offset="1" stopColor="var(--on-dark)" stopOpacity=".06" /></linearGradient>
        <linearGradient id="st-liquid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--dose-cell)" /><stop offset="1" stopColor="var(--lilac-line)" /></linearGradient>
        <linearGradient id="st-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="var(--on-dark)" stopOpacity=".95" /><stop offset=".6" stopColor="var(--on-dark)" stopOpacity=".8" /><stop offset="1" stopColor="var(--on-dark-2)" stopOpacity=".85" /></linearGradient>
      </defs>
      <ellipse cx="88" cy="60" rx="78" ry="56" fill="url(#st-glow)" />
      <ellipse cx="84" cy="110" rx="56" ry="5" fill="var(--illo-shade-on-dark)" />
      {/* Calendar page */}
      <rect x="58" y="18" width="84" height="84" rx="16" fill="url(#st-page)" stroke="var(--dark-edge)" strokeWidth="1.2" />
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
      <path d="M22 50q0-7 7-7h22q7 0 7 7v44q0 9-9 9H31q-9 0-9-9z" fill="url(#st-glass)" />
      <path d="M24 72h32v22q0 7-7 7H31q-7 0-7-7z" fill="url(#st-liquid)" />
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

/** Peptides, nothing tracked: an empty shelf waiting for its first vial. */
export function IlloShelf({ size = 240 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <Defs />
      <ellipse cx="84" cy="108" rx="62" ry="7" fill="var(--illo-shade)" />
      <Cast><rect x="20" y="84" width="120" height="8" rx="4" /><path d="M66 40q0-6 6-6h16q6 0 6 6v36q0 8-8 8H74q-8 0-8-8z" /><circle cx="122" cy="26" r="11" /></Cast>
      <rect x="14" y="10" width="132" height="76" rx="14" fill="url(#illo-dots)" />
      <rect x="20" y="84" width="120" height="8" rx="4" fill="var(--surface-3)" />
      <rect x="20" y="88" width="120" height="4" rx="2" fill="url(#illo-lo)" />
      <path d="M22 85h116" stroke="var(--surface)" strokeWidth="1.5" strokeLinecap="round" opacity=".8" />
      <g stroke="var(--illo-line)" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity=".5">
        <path d="M38 46h18M34 56q0-5 5-5h16q5 0 5 5v22q0 6-6 6H40q-6 0-6-6z" /><path d="M104 46h18M100 56q0-5 5-5h16q5 0 5 5v22q0 6-6 6h-14q-6 0-6-6z" />
      </g>
      <rect x="69" y="18" width="22" height="10" rx="3" fill="var(--sky-ink)" />
      <rect x="72" y="28" width="16" height="6" fill="var(--ink-4)" />
      <path d="M66 40q0-6 6-6h16q6 0 6 6v36q0 8-8 8H74q-8 0-8-8z" fill="var(--surface)" stroke="var(--illo-line)" strokeWidth="1.5" />
      <path d="M68 62h24v14q0 6-6 6H74q-6 0-6-6z" fill="var(--mint-ink)" opacity=".45" />
      <path d="M68 62h24" stroke="var(--mint-ink)" strokeWidth="2" opacity=".7" />
      <path d="M66 40q0-6 6-6h16q6 0 6 6v36q0 8-8 8H74q-8 0-8-8z" fill="url(#illo-hi)" />
      <path d="M71 42v30" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" opacity=".9" />
      <circle cx="122" cy="26" r="11" fill="var(--btn)" />
      <circle cx="122" cy="26" r="11" fill="url(#illo-hi)" opacity=".5" />
      <path d="M122 21v10M117 26h10" stroke="var(--btn-ink)" strokeWidth="2.5" strokeLinecap="round" />
    </svg></Ground>
  );
}

/** Learn, no matches: a magnifier over an empty card. */
export function IlloSearch({ size = 240 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <Defs />
      <ellipse cx="84" cy="108" rx="58" ry="7" fill="var(--illo-shade)" />
      <Cast><rect x="30" y="20" width="76" height="80" rx="14" /><circle cx="104" cy="64" r="24" /><path d="M120 80l16 16" stroke="var(--illo-shade)" strokeWidth="7" strokeLinecap="round" /></Cast>
      <rect x="30" y="20" width="76" height="80" rx="14" fill="var(--surface)" stroke="var(--illo-line)" strokeWidth="1.5" />
      <rect x="30" y="20" width="76" height="80" rx="14" fill="url(#illo-lo)" />
      <rect x="40" y="31" width="16" height="16" rx="5" fill="var(--mint)" />
      <path d="M44 42l4-6 4 6" fill="none" stroke="var(--mint-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="61" y="33" width="30" height="6" rx="3" fill="var(--surface-3)" />
      <rect x="61" y="42" width="20" height="4" rx="2" fill="var(--surface-2)" />
      <rect x="40" y="56" width="52" height="5" rx="2.5" fill="var(--surface-2)" />
      <rect x="40" y="66" width="40" height="5" rx="2.5" fill="var(--surface-2)" />
      <rect x="40" y="79" width="20" height="10" rx="5" fill="var(--lemon)" /><rect x="64" y="79" width="16" height="10" rx="5" fill="var(--lilac)" />
      <circle cx="104" cy="64" r="22" fill="var(--lemon)" fillOpacity=".7" stroke="var(--illo-line)" strokeWidth="2.5" />
      <path d="M120 80l16 16" stroke="var(--illo-line)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="104" cy="64" r="20" fill="url(#illo-hi)" />
      <path d="M96 58q4-6 12-4" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg></Ground>
  );
}

/** Trends with an empty log: a chart frame with a line that hasn't started yet. */
export function IlloTrends({ size = 240 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <Defs />
      <ellipse cx="84" cy="108" rx="62" ry="7" fill="var(--illo-shade)" />
      <Cast><rect x="20" y="16" width="120" height="84" rx="16" /></Cast>
      <rect x="20" y="16" width="120" height="84" rx="16" fill="var(--lilac)" stroke="var(--illo-line)" strokeWidth="1.5" />
      <rect x="20" y="16" width="120" height="84" rx="16" fill="url(#illo-hi)" />
      <path d="M36 82h88M36 62h88M36 42h88" stroke="var(--surface)" strokeWidth="2" opacity=".8" />
      <path d="M36 74q14-2 22-12t22-6 20-14 24-10V82H36z" fill="var(--lilac-line)" opacity=".12" />
      <path d="M36 74q14-2 22-12t22-6 20-14 24-10" fill="none" stroke="var(--lilac-line)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="2 8" />
      <circle cx="36" cy="74" r="6" fill="var(--lilac-line)" stroke="var(--surface)" strokeWidth="3" />
      <g fill="var(--mint-ink)"><rect x="40" y="88" width="10" height="4" rx="2" /><rect x="56" y="88" width="10" height="4" rx="2" opacity=".5" /><rect x="72" y="88" width="10" height="4" rx="2" opacity=".3" /></g>
    </svg></Ground>
  );
}

/** Partner, nobody linked yet: two phones side by side, each with its own log on screen, joined by a link that is still open. */
export function IlloPartner({ size = 240 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <Defs />
      <ellipse cx="84" cy="108" rx="62" ry="7" fill="var(--illo-shade)" />
      <Cast><rect x="20" y="34" width="48" height="68" rx="12" /><rect x="96" y="34" width="48" height="68" rx="12" /></Cast>
      <rect x="20" y="34" width="48" height="68" rx="12" fill="var(--peach)" stroke="var(--illo-line)" strokeWidth="1.5" />
      <rect x="20" y="34" width="48" height="68" rx="12" fill="url(#illo-lo)" />
      <rect x="27" y="44" width="34" height="48" rx="6" fill="var(--surface)" />
      <g fill="var(--peach-ink)"><rect x="32" y="52" width="20" height="4" rx="2" /><rect x="32" y="62" width="24" height="4" rx="2" opacity=".6" /><rect x="32" y="72" width="14" height="4" rx="2" opacity=".35" /></g>
      <rect x="96" y="34" width="48" height="68" rx="12" fill="var(--sky)" stroke="var(--illo-line)" strokeWidth="1.5" />
      <rect x="96" y="34" width="48" height="68" rx="12" fill="url(#illo-lo)" />
      <rect x="103" y="44" width="34" height="48" rx="6" fill="var(--surface)" />
      <path d="M108 80l7-8 6 4 10-14" fill="none" stroke="var(--sky-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="url(#illo-hi)"><rect x="20" y="34" width="48" height="68" rx="12" /><rect x="96" y="34" width="48" height="68" rx="12" /></g>
      <g fill="var(--illo-line)" opacity=".5"><rect x="38" y="38" width="12" height="2.5" rx="1.25" /><rect x="114" y="38" width="12" height="2.5" rx="1.25" /></g>
      <g fill="none" stroke="var(--illo-line)" strokeWidth="2" strokeLinecap="round">
        <path d="M64 18h6a6 6 0 0 1 0 12h-6" /><path d="M100 30h-6a6 6 0 0 1 0-12h6" />
      </g>
      <circle cx="82" cy="24" r="2.5" fill="var(--lilac-line)" />
    </svg></Ground>
  );
}

/** Profile band backdrop: a peptide chain of linked residues drifting off the band's top right corner.
 *  It takes the band's tier tint (`--tc`) and sits behind the text, faint enough that every line on the band keeps its contrast. */
const CHAIN: [number, number, number][] = [[18, 132, 9], [50, 112, 12], [88, 120, 10], [116, 92, 14], [150, 98, 11], [170, 64, 15], [204, 56, 12], [222, 22, 16]];
export function BandArt() {
  const bonds = CHAIN.slice(1).map(([x, y], i) => `M${CHAIN[i][0]} ${CHAIN[i][1]}L${x} ${y}`).join('');
  return (
    <svg className="band-art" width="240" height="160" viewBox="0 0 240 160" aria-hidden="true" focusable="false">
      <path d={bonds} fill="none" stroke="var(--tc)" strokeWidth="3" strokeLinecap="round" opacity=".28" />
      <path d="M88 120l-6 26M150 98l8 26M204 56l-18-18" fill="none" stroke="var(--tc)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 5" opacity=".3" />
      {CHAIN.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="var(--surface)" opacity=".5" />
          <circle cx={x} cy={y} r={r} fill="none" stroke="var(--tc)" strokeWidth="2" opacity=".32" />
          <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="var(--surface)" opacity=".7" />
        </g>
      ))}
    </svg>
  );
}
