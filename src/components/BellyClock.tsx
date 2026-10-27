import { BELLY } from '../lib/sites';

const C = 130, R = 104;
const at = (h: number, r: number, nudge = 0) => {
  const deg = (h % 12) * 30 + nudge, a = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a), deg };
};

/**
 * Twelve injection spots around the navel, read like a clock with 12 toward the chest. The arrow runs
 * clockwise from the last spot this regimen used to the suggested next one.
 */
export function BellyClock({ selected, next, recent, onSelect }: {
  selected: number | null;
  next: number;
  /** This regimen's last belly-clock hours, newest first. */
  recent: number[];
  onSelect: (h: number) => void;
}) {
  const last = recent[0];
  const p0 = last ? at(last, 74, 5) : null, p1 = at(next, 74, -7);
  return (
    <div className="clock" role="group" aria-label="Belly clock injection sites">
      <svg width="260" height="260" viewBox="0 0 260 260" aria-hidden="true">
        <circle className="face" cx={C} cy={C} r="128" />
        <circle className="ring" cx={C} cy={C} r="74" />
        <circle className="zone" cx={C} cy={C} r="40" />
        <text x={C} y="103" textAnchor="middle">~2 in</text>
        <circle className="navel" cx={C} cy={C} r="7" />
        <text x={C} y="152" textAnchor="middle">Navel</text>
        {p0 && last !== next && (
          <g key={`${last}-${next}`}>
            <path className="arc draw" pathLength={1} d={`M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A 74 74 0 ${((next - last + 12) % 12) > 6 ? 1 : 0} 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`} />
            <polygon className="tipmark" points="-4,-6 7,0 -4,6" transform={`translate(${p1.x.toFixed(1)} ${p1.y.toFixed(1)}) rotate(${p1.deg})`} />
          </g>
        )}
      </svg>
      {BELLY.map(({ h, k }, i) => {
        const p = at(h, R), rank = recent.indexOf(h) + 1;
        return (
          <button
            key={k} type="button" className="hour pop" style={{ left: p.x, top: p.y, ['--i' as string]: i }}
            data-recent={rank > 0 && rank <= 3 ? rank : undefined} data-next={h === next && selected !== h ? true : undefined}
            aria-pressed={selected === h} onClick={() => onSelect(h)}
            aria-label={`${h} o'clock${rank === 1 ? ', your last spot' : rank > 1 ? ', used recently' : ''}${h === next ? ', next clockwise' : ''}`}
          >
            {h}
          </button>
        );
      })}
    </div>
  );
}

/** A small read-only clock face for the Today tile, with the suggested hour filled in. */
export function MiniClock({ hour }: { hour: number }) {
  const dot = (h: number) => {
    const a = ((h % 12) * Math.PI) / 6;
    return { cx: 27 + 20 * Math.sin(a), cy: 27 - 20 * Math.cos(a) };
  };
  return (
    <svg className="miniclock" width="72" height="72" viewBox="0 0 54 54" aria-hidden="true">
      <circle className="face" cx="27" cy="27" r="26" />
      {BELLY.filter(b => b.h !== hour).map(b => <circle key={b.h} className="h" r="3" {...dot(b.h)} />)}
      <circle className="navel" cx="27" cy="27" r="3" />
      <circle className="next pop" r="5" {...dot(hour)} style={{ ['--i' as string]: 6 }} />
    </svg>
  );
}
