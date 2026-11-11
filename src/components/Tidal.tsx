import { useId } from 'react';
import { fmtDay } from '../lib/format';
import { useWidth } from './Motion';

/* The tidal graphics: depth bands behind the field, foam along its lower edge, weeks of days riding their own
   swell, and water in the adherence cell. All of it is SVG moved by CSS (see "Tidal" in styles.css), so it
   costs nothing per frame in script and keeps still for reduced motion. */

/** Wide enough for any screen plus the distance a layer drifts before its loop repeats. */
const SPAN = 3600;

/** A wave edge: starts at (from, y), crosses y every `half` px, and swings `amp` above then below, until past `to`. */
function wave(y: number, half: number, amp: number, from: number, to = SPAN) {
  let d = `M${from} ${y}Q${from + half / 2} ${y - amp * 2} ${from + half} ${y}`;
  for (let x = from + half * 2; x < to + half; x += half) d += `T${x} ${y}`;
  return d;
}
/** The same edge closed into a shape that fills everything above it (`over`) or below it. */
const fill = (y: number, half: number, amp: number, from: number, over = true) => `${wave(y, half, amp, from)}V${over ? -4000 : 4000}H${from}Z`;
const drift = (px: number, s: number, back = false) => ({ ['--tile' as string]: `${px}px`, animationDuration: `${s}s`, animationDirection: back ? 'reverse' : undefined });

/** Deeper water toward the top of the field: three bands, each a shade darker, sliding past each other very slowly. */
export const Depth = () => (
  <svg className="depth" aria-hidden="true">
    <svg y="70%" overflow="visible"><path className="d1 drift" d={fill(0, 310, 18, -210)} style={drift(620, 46)} /></svg>
    <svg y="35%" overflow="visible"><path className="d2 drift" d={fill(0, 380, 15, -330)} style={drift(760, 58, true)} /></svg>
    <svg y="12" overflow="visible"><path className="d3 drift" d={fill(0, 260, 6, -60)} style={drift(520, 38)} /></svg>
  </svg>
);

const FOAM = fill(30, 140, 10.85, -40);
const SAND = fill(38, 205, 5.5, -150);
/** Bubbles just under the foam line, one 280px wavelength of them: [x, y, radius, opacity]. */
const BUBBLES = [[10, 32.7, 1.1, .8], [28.7, 29.6, 1.3, .6], [57.9, 23.7, 1.4, .6], [77.1, 25.4, 1.7, .6], [99.5, 28.2, 1.9, .8], [126, 35, 1, .9],
  [149.9, 37.6, 1.1, .7], [186.5, 44.5, 1.5, .8], [212.4, 47.6, 1.1, .6], [234.4, 46.9, 1.4, .7], [265.4, 40.3, 1.3, .8]];
/** The line the last high water left on the sand: a little uneven, the way a real one is. */
const MARK = Array.from({ length: SPAN / 8 }, (_, i) => `${i ? 'L' : 'M'}${i * 8} ${(33 + 2 * Math.sin(i * 8 / 26) + Math.sin(i * 8 / 15.4 + 1)).toFixed(1)}`).join('');

/**
 * The lower edge of the field: foam that drifts along and washes in and out over a strip of wet sand. With
 * `ebb` it is also a tide gauge: 0 means a dose just went in and the water is high; toward 1 the water has
 * gone out and left more sand behind, with a line where it last stood. When `surge` goes up, one big wave
 * runs down the page and back.
 */
export function Tide({ ebb, surge = 0 }: { ebb?: number | null; surge?: number }) {
  const id = useId();
  const gauge = ebb != null;
  const out = { transform: `translateY(${Math.round((ebb ?? 0) * 28)}px)` };
  return (
    <div className={`tide${gauge ? ' gauge' : ''}`} aria-hidden="true">
      <svg width="100%" height="100%">
        <defs>
          <pattern id={id} width="280" height="76" patternUnits="userSpaceOnUse">
            {BUBBLES.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} opacity={o} />)}
          </pattern>
          <clipPath id={`${id}s`}><path className="sand" d={SAND} style={out} /></clipPath>
        </defs>
        <path className="sand" d={SAND} style={out} />
        {(ebb ?? 0) > 0 && <path className="mark" d={MARK} style={out} />}
        <g className="swash">
          <path className="foam drift" d={FOAM} style={drift(280, 11)} />
          <path className="shallow drift" d={fill(14, 165, 4, -120)} style={drift(330, 13)} />
          <path className="deep drift" d={fill(5, 205, 3, -200)} style={drift(410, 17, true)} />
        </g>
        {/* Bubbles travel with the foam but show only on the sand, which stays put, so the clip sits outside the moving groups. */}
        <g clipPath={`url(#${id}s)`}>
          <g className="swash"><rect className="drift" x="-280" width={SPAN} height="76" fill={`url(#${id})`} style={drift(280, 11)} /></g>
        </g>
      </svg>
      {surge > 0 && (
        <span className="surge" key={surge}>
          <svg width="100%" height="440">
            <path className="foam" d={fill(404, 150, 17, -60)} />
            <rect width="100%" height="76" y="366" fill={`url(#${id})`} />
            <path className="deep" d={fill(366, 190, 10, -140)} />
          </svg>
        </span>
      )}
    </div>
  );
}

export interface GridDay { d: Date; on: boolean; today: boolean }

const TURN = 2 * Math.PI;
/** Seconds for a row's swell to travel the width of the grid. Must match `.weeks .row` and `.weeks .b` in styles.css. */
const ROLL = 9;

/**
 * The last few weeks, one row each and ending today: a bead per day, filled when a dose was logged. Each row
 * rides its own swell, and each bead rises and falls as the swell passes under it.
 */
export function WeekGrid({ days, label }: { days: GridDay[]; label: string }) {
  const [box, W] = useWidth<HTMLDivElement>(380);
  const TOP = 34, GAP = 25, AMP = 4;
  const rows = Math.ceil(days.length / 7);
  const x = (col: number) => ((col + 0.5) * W) / 7;
  // A row's line is y = AMP * sin(phase - 2πx / W), drawn from -W so it can slide right by one width and repeat.
  const phase = (row: number) => (row * TURN) / 6;
  const line = (row: number) => {
    let d = '';
    for (let px = -W; px <= W + 8; px += 8) d += `${d ? 'L' : 'M'}${px} ${(TOP + row * GAP + AMP * Math.sin(phase(row) - (TURN * px) / W)).toFixed(1)}`;
    return d;
  };
  // How far into its rise and fall a bead already is, so it sits on the line as the line slides.
  const lead = (row: number, col: number) => (((phase(row) / TURN - (col + 0.5) / 7) % 1) + 1) % 1 * ROLL;
  return (
    <div className="weeks" ref={box}>
      <svg width={W} height={TOP + (rows - 1) * GAP + 29} role="img" aria-label={label}>
        {days.slice(0, 7).map((c, i) => <text key={i} x={x(i)} y="11" aria-hidden="true">{c.d.toLocaleDateString(undefined, { weekday: 'narrow' })}</text>)}
        {Array.from({ length: rows }, (_, r) => <path key={r} className="row" d={line(r)} style={{ ['--w' as string]: `${W}px` }} />)}
        {days.map((c, i) => {
          const row = Math.floor(i / 7), col = i % 7;
          return (
            <g key={i} className="b" style={{ animationDelay: `${-lead(row, col).toFixed(2)}s` }}>
              <title>{`${fmtDay(c.d)}${c.on ? ': dose logged' : ''}`}</title>
              {c.today && <circle className="ping" cx={x(col)} cy={TOP + row * GAP} r="10.5" />}
              {/* Keyed by state, so today's bead pops again the moment its dose is logged. */}
              <circle key={String(c.on)} className={`pop ${c.on ? 'on' : 'off'}${c.today ? ' now' : ''}`} cx={x(col)} cy={TOP + row * GAP} r={c.today ? 10.5 : 8}
                style={{ ['--i' as string]: c.today && c.on ? 0 : i }} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Water along the bottom of the adherence cell with a bead afloat for each week: filled when every expected dose that week was logged. */
export function Swell({ weeks, label }: { weeks: boolean[]; label: string }) {
  return (
    <svg className="swell" width="100%" height="70" role="img" aria-label={label}>
      {weeks.map((on, i) => (
        <circle key={i} className={`b ${on ? 'on' : 'off'}`} cx={`${((i + 0.5) * 100) / weeks.length}%`} cy="26" r={on ? 8 : 7} style={{ animationDelay: `${-((i * 2 + 5) % 8)}s` }} />
      ))}
      <path className="back drift" d={fill(35, 46, 3, -92, false)} style={drift(184, 13, true)} />
      <path className="front drift" d={fill(30, 92, 4, -184, false)} style={drift(184, 8)} />
    </svg>
  );
}
