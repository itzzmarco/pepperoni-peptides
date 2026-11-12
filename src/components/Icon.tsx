import { useId } from 'react';

/**
 * The app's icon set: thick rounded outlines on a 24 unit grid, each a vessel holding water (see ".ico" in
 * styles.css). The outline takes the text colour and the water takes --water, so an icon follows the theme,
 * the dye and the cell it sits in. The water rises on the current tab and drifts there and under the pointer.
 */
type Def = {
  /** The outline, stroked 1.8 units wide. */
  ink: string;
  /** Closed shapes that hold water, each with the y of its surface. */
  water?: [vessel: string, level: number][];
  /** Solid beads: cx, cy, r. */
  dots?: [number, number, number][];
  /** A hairline, for detail too fine for the outline's weight. */
  thin?: string;
  /** A stroke in the water colour instead of the ink. */
  wave?: string;
  /** Degrees the drawing is turned about the centre. The water stays level. */
  turn?: number;
};

const circle = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
const RING = circle(12, 12, 9);
const HOUSE = 'M5.5 8.8 12 3.3l6.5 5.5V19a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z';
const FRAME = 'M6.5 3.5h11a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3z';
const PAGES = 'M12 6.5C10.9 5.3 9.2 4.5 7 4.5H5.5a2 2 0 0 0-2 2V16a2 2 0 0 0 2 2H7c2 0 3.7.3 5 1 1.3-.7 3-1 5-1h1.5a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2H17c-2.2 0-3.9.8-5 2z';
const VIAL = 'M9.5 5.5V7c0 1-.5 1.5-1.5 2-1.5.8-2.5 2-2.5 3.8V19A2.5 2.5 0 0 0 8 21.5h8a2.5 2.5 0 0 0 2.5-2.5v-6.2c0-1.8-1-3-2.5-3.8-1-.5-1.5-1-1.5-2V5.5z';
const PALETTE = 'M12 3.5c-4.8 0-8.5 3.6-8.5 8.3 0 4.8 3.8 8.7 8.6 8.7 2.2 0 3.5-.9 3.5-2.3 0-.7-.4-1.2-.4-2 0-1.2 1-2 2.3-2h.9c1.3 0 2.1-1 2.1-2.4 0-4.7-3.7-8.3-8.5-8.3z';
const LENS = circle(10.5, 10.5, 6.6);
const NODES = [circle(6.2, 12, 3), circle(17.6, 6.1, 3), circle(17.6, 17.9, 3)];
const TRIANGLE = 'M12 4 3.2 19.5h17.6z';
const BARREL = 'M7 8.5h9.5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7A1.5 1.5 0 0 1 5.5 14v-4A1.5 1.5 0 0 1 7 8.5z';
const SHIELD = 'M12 3 4.5 5.8v5.7c0 4.5 2.9 7.8 7.5 9.5 4.6-1.7 7.5-5 7.5-9.5V5.8z';

const ICONS = {
  today: { ink: 'M3.5 10.4 12 3.3l8.5 7.1M5.5 8.8V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.8', water: [[HOUSE, 15.5]] },
  trends: { ink: `${FRAME}M7.5 11.5l3-2.5 2.5 1.5L16.5 7`, water: [[FRAME, 14.8]] },
  learn: { ink: `${PAGES}M12 6.5V19`, water: [[PAGES, 14]] },
  peptides: { ink: `M8.5 2.5h7a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z${VIAL}`, water: [[VIAL, 13.4]], thin: `${circle(8.8, 18.4, 1.1)}${circle(12, 17, 1.1)}${circle(15.2, 15.6, 1.1)}M9.8 17.9l1.2-.5M13 16.5l1.2-.5` },
  add: { ink: `${RING}M12 8v8M8 12h8`, water: [[RING, 15.8]] },
  account: { ink: `${RING}${circle(12, 9.4, 2.7)}M7.6 16.4c.7-2.1 2.3-3.1 4.4-3.1s3.7 1 4.4 3.1`, water: [[RING, 16.5]] },
  look: { ink: PALETTE, water: [[PALETTE, 14.3]], dots: [[8.3, 10, 1.15], [11.7, 7.4, 1.15], [15.3, 9.2, 1.15]] },
  search: { ink: `${LENS}M15.3 15.3l5.2 5.2`, water: [[LENS, 10.5]] },
  share: { ink: `${NODES.join('')}M8.9 10.6l6-3.1M8.9 13.4l6 3.1`, water: [[NODES[0], 12.5], [NODES[1], 6.6], [NODES[2], 18.4]] },
  notice: { ink: `${TRIANGLE}M12 10v3.5`, water: [[TRIANGLE, 17.7]], dots: [[12, 15.8, 1]] },
  dose: { ink: `M1 12h4.5${BARREL}M17.5 12h4M21.5 9v6`, water: [[BARREL, 12.6]], turn: -45 },
  safety: { ink: `${SHIELD}M12 7.3v5M9.5 9.8h5`, water: [[SHIELD, 14.8]] },
  check: { ink: `${RING}M8.3 11.2l2.7 2.7 4.8-5.2`, water: [[RING, 15.8]] },
  arrow: { ink: 'M15.5 7.5 20 12l-4.5 4.5', wave: 'M3.5 13.2c1.7-2.9 4.1-3.1 6.2-1 2.1 2.1 5.1 2.1 9.8-.2' },
} satisfies Record<string, Def>;
export type IconName = keyof typeof ICONS;

/** Three wavelengths of surface (12 units each) with water below, so it can slide one wavelength and repeat. */
const SURFACE = 'M-12 0q3-1.3 6 0t6 0 6 0 6 0 6 0 6 0 6 0 6 0V24H-12z';

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const id = useId();
  const d: Def = ICONS[name];
  const turn = d.turn ? `rotate(${d.turn} 12 12)` : undefined;
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d.water?.map(([vessel, level], i) => (
        <g key={i} clipPath={`url(#${id}${i})`}>
          <clipPath id={`${id}${i}`}><path d={vessel} transform={turn} /></clipPath>
          <g className="lvl" style={{ ['--y' as string]: level }}><path className="wat" d={SURFACE} /></g>
        </g>
      ))}
      {d.wave && <path className="tail" d={d.wave} />}
      <g transform={turn}>
        <path d={d.ink} />
        {d.thin && <path d={d.thin} strokeWidth="0.8" />}
        {d.dots?.map(([cx, cy, r]) => <circle key={`${cx} ${cy}`} className="dot" cx={cx} cy={cy} r={r} />)}
      </g>
    </svg>
  );
}
