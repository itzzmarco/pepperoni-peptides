import type { ReactNode } from 'react';

/**
 * Small empty-state illustrations. Inline SVG coloured only with theme tokens, so they follow
 * light and dark mode and never touch the network. Decorative: the copy next to them says what matters.
 */
type Props = { size?: number };
const svg = (size: number) => ({ width: size, height: Math.round(size * 0.75), viewBox: '0 0 160 120', className: 'illo', 'aria-hidden': true as const, focusable: 'false' as const });
/** Every empty state shares one block: the art centred on a soft tinted ground above the copy. */
const Ground = ({ children }: { children: ReactNode }) => <div className="illo-ground" aria-hidden="true">{children}</div>;

/** Today, nothing tracked yet: a vial beside a calendar page with a first check mark. */
export function IlloStart({ size = 168 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <ellipse cx="80" cy="108" rx="62" ry="7" fill="var(--illo-shade)" />
      <rect x="62" y="22" width="78" height="80" rx="14" fill="var(--sky)" stroke="var(--illo-line)" strokeWidth="2.5" />
      <rect x="62" y="22" width="78" height="20" rx="10" fill="var(--sky-ink)" />
      <g fill="var(--surface)" opacity=".9">
        <rect x="74" y="52" width="12" height="12" rx="4" /><rect x="92" y="52" width="12" height="12" rx="4" /><rect x="110" y="52" width="12" height="12" rx="4" />
        <rect x="74" y="72" width="12" height="12" rx="4" /><rect x="110" y="72" width="12" height="12" rx="4" />
      </g>
      <rect x="92" y="72" width="12" height="12" rx="4" fill="var(--go)" />
      <path d="M95 78l2 2 4-4" fill="none" stroke="var(--mint-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="28" y="30" width="22" height="9" rx="3" fill="var(--lilac-line)" />
      <rect x="31" y="39" width="16" height="5" fill="var(--ink-4)" />
      <path d="M24 50q0-6 6-6h18q6 0 6 6v44q0 8-8 8H32q-8 0-8-8z" fill="var(--surface)" stroke="var(--illo-line)" strokeWidth="2.5" />
      <path d="M26 76h26v18q0 6-6 6H32q-6 0-6-6z" fill="var(--lilac-line)" opacity=".55" />
      <path d="M32 58h8M32 66h12" stroke="var(--illo-line)" strokeWidth="2" strokeLinecap="round" opacity=".5" />
    </svg></Ground>
  );
}

/** Peptides, nothing tracked: an empty shelf waiting for its first vial. */
export function IlloShelf({ size = 168 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <ellipse cx="80" cy="108" rx="62" ry="7" fill="var(--illo-shade)" />
      <rect x="20" y="84" width="120" height="8" rx="4" fill="var(--surface-3)" />
      <g stroke="var(--illo-line)" strokeWidth="2.5" strokeDasharray="5 5" fill="none" opacity=".55">
        <rect x="36" y="40" width="22" height="44" rx="7" /><rect x="102" y="40" width="22" height="44" rx="7" />
      </g>
      <rect x="69" y="18" width="22" height="10" rx="3" fill="var(--sky-ink)" />
      <rect x="72" y="28" width="16" height="6" fill="var(--ink-4)" />
      <path d="M66 40q0-6 6-6h16q6 0 6 6v36q0 8-8 8H74q-8 0-8-8z" fill="var(--surface)" stroke="var(--illo-line)" strokeWidth="2.5" />
      <path d="M68 62h24v14q0 6-6 6H74q-6 0-6-6z" fill="var(--mint-ink)" opacity=".45" />
      <circle cx="122" cy="26" r="11" fill="var(--btn)" />
      <path d="M122 21v10M117 26h10" stroke="var(--btn-ink)" strokeWidth="2.5" strokeLinecap="round" />
    </svg></Ground>
  );
}

/** Learn, no matches: a magnifier over an empty card. */
export function IlloSearch({ size = 168 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <ellipse cx="80" cy="108" rx="58" ry="7" fill="var(--illo-shade)" />
      <rect x="30" y="20" width="76" height="80" rx="14" fill="var(--surface)" stroke="var(--illo-line)" strokeWidth="2.5" />
      <rect x="42" y="34" width="34" height="8" rx="4" fill="var(--surface-3)" />
      <rect x="42" y="50" width="50" height="6" rx="3" fill="var(--surface-2)" />
      <rect x="42" y="62" width="42" height="6" rx="3" fill="var(--surface-2)" />
      <g fill="var(--lemon)"><rect x="42" y="78" width="22" height="10" rx="5" /></g>
      <circle cx="104" cy="64" r="22" fill="var(--lemon)" fillOpacity=".7" stroke="var(--illo-line)" strokeWidth="4" />
      <path d="M120 80l16 16" stroke="var(--illo-line)" strokeWidth="7" strokeLinecap="round" />
      <path d="M96 58q4-6 12-4" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg></Ground>
  );
}

/** Trends with an empty log: a chart frame with a line that hasn't started yet. */
export function IlloTrends({ size = 168 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <ellipse cx="80" cy="108" rx="62" ry="7" fill="var(--illo-shade)" />
      <rect x="20" y="16" width="120" height="84" rx="16" fill="var(--lilac)" />
      <path d="M36 82h88M36 62h88M36 42h88" stroke="var(--surface)" strokeWidth="2" opacity=".8" />
      <path d="M36 74q14-2 22-12t22-6 20-14 24-10" fill="none" stroke="var(--lilac-line)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="2 8" />
      <circle cx="36" cy="74" r="6" fill="var(--lilac-line)" stroke="var(--surface)" strokeWidth="3" />
      <g fill="var(--mint-ink)"><rect x="40" y="88" width="10" height="4" rx="2" /><rect x="56" y="88" width="10" height="4" rx="2" opacity=".5" /><rect x="72" y="88" width="10" height="4" rx="2" opacity=".3" /></g>
    </svg></Ground>
  );
}

/** Partner, nobody linked yet: two people side by side, joined by a link that is still open. */
export function IlloPartner({ size = 168 }: Props) {
  return (
    <Ground><svg {...svg(size)}>
      <ellipse cx="80" cy="108" rx="62" ry="7" fill="var(--illo-shade)" />
      <rect x="14" y="30" width="56" height="70" rx="16" fill="var(--peach)" stroke="var(--illo-line)" strokeWidth="2.5" />
      <circle cx="42" cy="54" r="11" fill="var(--peach-ink)" />
      <path d="M26 92q0-18 16-18t16 18" fill="var(--peach-ink)" />
      <rect x="90" y="30" width="56" height="70" rx="16" fill="var(--sky)" stroke="var(--illo-line)" strokeWidth="2.5" />
      <circle cx="118" cy="54" r="11" fill="var(--sky-ink)" />
      <path d="M102 92q0-18 16-18t16 18" fill="var(--sky-ink)" />
      <g fill="none" stroke="var(--illo-line)" strokeWidth="3" strokeLinecap="round">
        <path d="M66 18h6a6 6 0 0 1 0 12h-6" /><path d="M94 30h-6a6 6 0 0 1 0-12h6" />
      </g>
      <circle cx="80" cy="24" r="2.5" fill="var(--lilac-line)" />
    </svg></Ground>
  );
}
