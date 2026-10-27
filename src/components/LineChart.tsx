import { useLayoutEffect, useRef, useState } from 'react';
import { fmtShort } from '../lib/format';

export interface Pt {
  x: Date;
  y: number;
  tip: string;
}

/** Single-series line with area wash, end label, and a hover tooltip per point. The panel title names the series. */
export function LineChart({ points, y0, y1, ticks, x0, x1, label, fmt = String }: {
  points: Pt[];
  y0: number;
  y1: number;
  ticks: number[];
  x0?: number;
  x1?: number;
  label: string;
  fmt?: (v: number) => string;
}) {
  const [hover, setHover] = useState<{ left: number; top: number; text: string } | null>(null);
  // Draw at the container's real pixel width so labels stay at text size instead of scaling with the SVG.
  const wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(520);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setW(Math.max(240, Math.round(el.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 160, L = 30, R = 12, T = 14, B = 24;
  const pts = points.slice().sort((a, b) => a.x.getTime() - b.x.getTime());
  const xs = pts.map(p => p.x.getTime());
  const lo = x0 ?? Math.min(...xs), hi = x1 ?? Math.max(...xs);
  const sx = (x: number) => L + (hi === lo ? (W - L - R) / 2 : ((x - lo) / (hi - lo)) * (W - L - R));
  const sy = (y: number) => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x.getTime()).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const lx = sx(last.x.getTime());
  return (
    <div className="chart-wrap" ref={wrap} onMouseLeave={() => setHover(null)}>
      <svg className="chart" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {ticks.map(t => (
          <g key={t}>
            <line className="grid" x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} />
            <text x={L - 6} y={sy(t) + 4} textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        <text x={L} y={H - 6}>{fmtShort(new Date(lo))}</text>
        <text x={W - R} y={H - 6} textAnchor="end">{fmtShort(new Date(hi))}</text>
        {pts.length > 1 && (
          <>
            <path className="area" d={`${d} L${lx.toFixed(1)} ${sy(y0)} L${sx(pts[0].x.getTime()).toFixed(1)} ${sy(y0)} Z`} />
            <path className="ln draw" pathLength={1} d={d} />
          </>
        )}
        {pts.map((p, i) => {
          const cx = sx(p.x.getTime()), cy = sy(p.y);
          const isLast = i === pts.length - 1;
          return (
            <g key={i}>
              {(isLast || pts.length < 12) && <circle className="pt" cx={cx} cy={cy} r={isLast ? 5 : 4} />}
              <circle
                cx={cx} cy={cy} r={11} fill="transparent"
                onMouseEnter={() => setHover({ left: (cx / W) * 100, top: (cy / H) * 100, text: p.tip })}
              />
            </g>
          );
        })}
        <text x={Math.min(lx + 8, W - R)} y={sy(last.y) - 8} textAnchor={lx > W - 60 ? 'end' : 'start'} style={{ fill: 'var(--ink)', fontWeight: 600 }}>
          {fmt(last.y)}
        </text>
      </svg>
      {hover && (
        <div className="tip" style={{ left: `clamp(60px, ${hover.left}%, calc(100% - 60px))`, top: `${hover.top}%` }}>
          {hover.text}
        </div>
      )}
    </div>
  );
}
