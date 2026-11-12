import { useId } from 'react';
import { DAY, fmtDay, startOfDay } from '../lib/format';
import { tideLevels } from '../lib/tide';
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

/** `flag` marks a second thing that happened that day (a side effect), `future` a day that hasn't come yet. */
export interface GridDay { d: Date; on: boolean; today: boolean; flag?: boolean; future?: boolean }

const TURN = 2 * Math.PI;
/** Seconds for a row's swell to travel the width of the grid. Must match `.weeks .row` and `.weeks .b` in styles.css. */
const ROLL = 9;

/**
 * The last few weeks, one row each and ending today: a bead per day, filled when a dose was logged. Each row
 * rides its own swell, and each bead rises and falls as the swell passes under it. White on the field; inside
 * a cell it takes the cell's tone. Past six rows it is drawn tighter and holds still, so a quarter of beads
 * doesn't cost a quarter of animations.
 */
export function WeekGrid({ days, label, on = 'dose logged', flag = 'side effect logged' }: { days: GridDay[]; label: string; on?: string; flag?: string }) {
  const [box, W] = useWidth<HTMLDivElement>(380);
  const dense = days.length > 42;
  const TOP = 34, GAP = dense ? 20 : 25, AMP = 4, R = dense ? 6 : 8, NOW = dense ? 8 : 10.5;
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
    <div className={`weeks${dense ? ' dense' : ''}`} ref={box}>
      <svg width={W} height={TOP + (rows - 1) * GAP + 29} role="img" aria-label={label}>
        {days.slice(0, 7).map((c, i) => <text key={i} x={x(i)} y="11" aria-hidden="true">{c.d.toLocaleDateString(undefined, { weekday: 'narrow' })}</text>)}
        {Array.from({ length: rows }, (_, r) => <path key={r} className="row" d={line(r)} style={{ ['--w' as string]: `${W}px` }} />)}
        {days.map((c, i) => {
          const row = Math.floor(i / 7), col = i % 7;
          return (
            <g key={i} className="b" style={{ animationDelay: `${-lead(row, col).toFixed(2)}s` }}>
              <title>{`${fmtDay(c.d)}${[c.on && on, c.flag && flag].filter(Boolean).map((t, k) => `${k ? ', ' : ': '}${t}`).join('')}`}</title>
              {c.today && <circle className="ping" cx={x(col)} cy={TOP + row * GAP} r={NOW} />}
              {/* Keyed by state, so today's bead pops again the moment its dose is logged. */}
              <circle key={String(c.on)} className={`pop ${c.on ? 'on' : c.flag ? 'fx' : 'off'}${c.today ? ' now' : ''}${c.future ? ' future' : ''}`} cx={x(col)} cy={TOP + row * GAP} r={c.today ? NOW : R}
                style={{ ['--i' as string]: c.today && c.on ? 0 : dense ? i / 3 : i }} />
              {c.on && c.flag && <circle className="ring pop" cx={x(col)} cy={TOP + row * GAP} r={(c.today ? NOW : R) + 4} style={{ ['--i' as string]: i }} />}
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

/**
 * One regimen's tide over the last `days` days: the water is high after each dose (a bead marks it), eases
 * out until the next is due, and lies flat for as long as a dose is overdue. `times` are all its dose times
 * in ms, so a dose from before the range still sets where the water starts.
 */
export function TideChart({ times, every, days, now = new Date(), label, height = 64 }: {
  times: number[]; every: number; days: number; now?: Date; label: string; height?: number;
}) {
  const [box, W] = useWidth<HTMLDivElement>();
  const to = now.getTime(), from = startOfDay(now).getTime() - (days - 1) * DAY;
  const top = 8, base = height - 2;
  const x = (t: number) => ((t - from) / (to - from)) * W;
  // Beads shrink when doses sit close together (a daily dose over three months), so they stay separate dots.
  const bead = Math.max(1.5, Math.min(4, (x(from + every * DAY) - x(from)) / 3));
  const line = tideLevels(times, every, from, to, Math.min((to - from) / 120, (every * DAY) / 4))
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${(base - p.level * (base - top)).toFixed(1)}`).join('');
  return (
    <div className="tidechart" ref={box}>
      <svg width={W} height={height} role="img" aria-label={label}>
        <path className="water" d={`${line}V${height}H0Z`} />
        <path className="crest draw" pathLength={1} d={line} />
        {times.filter(t => t >= from && t <= to).map((t, i) => <circle key={t} className="pop" cx={x(t)} cy={top} r={bead} style={{ ['--i' as string]: i }} />)}
      </svg>
    </div>
  );
}

/** First visit: the mark's three beads on their wave, numbered as the steps to get going. */
export function Steps({ steps }: { steps: string[] }) {
  const [box, W] = useWidth<HTMLDivElement>(380);
  const gap = W / steps.length, cy = 30;
  const x = (i: number) => (i + 0.5) * gap;
  // As in the mark, the wave crosses its middle line at each bead: up between the first pair, down between the next.
  const d = `M${x(0)} ${cy}${steps.slice(1).map((_, i) => `Q${x(i) + gap / 2} ${cy + (i % 2 ? 26 : -26)} ${x(i + 1)} ${cy}`).join('')}`;
  return (
    <div className="steps" ref={box}>
      <svg width={W} height="60" aria-hidden="true">
        <path className="draw" pathLength={1} d={d} />
        {steps.map((_, i) => (
          <g key={i} className="b" style={{ animationDelay: `${-i * 3}s` }}>
            <circle className="pop" cx={x(i)} cy={cy} r="15" style={{ ['--i' as string]: i * 6 }} />
            <text x={x(i)} y={cy}>{i + 1}</text>
          </g>
        ))}
      </svg>
      <ol>{steps.map(s => <li key={s}>{s}</li>)}</ol>
    </div>
  );
}

/** The mark's wave: one wavelength is the gap between every other bead. Drawn a wavelength early so it can travel right and repeat. */
const MARK_WAVE = 29;
const markLine = (amp: number) => Array.from({ length: 2 * MARK_WAVE + 1 }, (_, i) => {
  const x = 5.5 - MARK_WAVE + i;
  return `${i ? 'L' : 'M'}${x} ${(11 - amp * Math.sin((TURN * (x - 5.5)) / MARK_WAVE)).toFixed(2)}`;
}).join('');

/**
 * The Peptidal mark, afloat: three beads threaded on a wave. The wave travels and each bead rides it, the
 * middle one opposite the outer two, as on the brand sheet. The moving wave is shallower than the printed
 * one (4 against 7), as the sheet's afloat mark is, so the three beads stay readable as a row. For reduced
 * motion it is the printed mark, still. The 4 here is `--bob` on `.mark .b` in styles.css.
 */
export function Mark() {
  const id = useId();
  return (
    <svg className="mark" width="40" height="22" viewBox="0 0 40 22" aria-hidden="true">
      <clipPath id={id}><rect x="5.5" y="-8" width="29" height="38" /></clipPath>
      <g clipPath={`url(#${id})`}><path className="still" d={markLine(7)} /><path className="roll" d={markLine(4)} /></g>
      {[5.5, 20, 34.5].map((x, i) => <circle key={x} className="b" cx={x} cy="11" r="4.5" style={{ animationDelay: i === 1 ? '-3s' : undefined }} />)}
    </svg>
  );
}

/** A bead on a line: how far along `f` (0 to 1) is. The app's bar. It takes the cell's tone. */
export function Level({ f, i = 0 }: { f: number; i?: number }) {
  return (
    <span className="level" aria-hidden="true" style={{ ['--f' as string]: Math.max(0, Math.min(1, f)), ['--i' as string]: i }}>
      <i className="grow" /><b className="pop" />
    </span>
  );
}

/** A small filled trend, oldest value first: the line with water under it. Scaled to its own range unless `lo` and `hi` fix one. */
export function Spark({ values, lo = Math.min(...values), hi = Math.max(...values) }: { values: number[]; lo?: number; hi?: number }) {
  const pts = values.map((v, i, a) => `${(i / Math.max(1, a.length - 1)) * 120},${4 + (1 - (v - lo) / Math.max(0.1, hi - lo)) * 20}`).join(' ');
  return <svg className="spark" viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true"><polygon points={`0,28 ${pts} 120,28`} /><polyline className="draw" pathLength={1} points={pts} /></svg>;
}
