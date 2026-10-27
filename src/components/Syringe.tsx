import { useEffect, useState } from 'react';
import { fmtNum } from '../lib/format';

/** A U-100 insulin syringe drawn to scale with its fill at `units`. The fill and plunger glide when the amount changes. */
export function Syringe({ units, cap }: { units: number; cap: number }) {
  const W = 520, H = 92, x0 = 70, len = 380, y = 30, h = 30;
  const step = cap <= 50 ? 1 : 2;
  const major = cap <= 30 ? 5 : 10;
  const fillU = Math.min(Math.max(units, 0), cap);
  // Start empty and draw up to the amount just after mounting, so the first view shows the draw.
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  const frac = ready ? fillU / cap : 0;
  const ticks = [];
  for (let u = 0; u <= cap; u += step) {
    const x = x0 + (u / cap) * len;
    const isMajor = u % major === 0;
    ticks.push(
      <g key={u}>
        <line className={`tick${isMajor ? ' major' : ''}`} x1={x} x2={x} y1={y} y2={y + (isMajor ? 13 : 7)} />
        {isMajor && <text x={x} y={y + h + 14} textAnchor="middle">{u}</text>}
      </g>,
    );
  }
  return (
    <svg className="syringe chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Syringe filled to ${fmtNum(units, 1)} of ${cap} units`}>
      <line className="needle" x1={10} x2={x0 - 14} y1={y + h / 2} y2={y + h / 2} />
      <rect className="plunger" x={x0 - 14} y={y + 8} width={14} height={h - 16} rx={2} />
      <rect className="barrel" x={x0} y={y} width={len} height={h} rx={4} />
      <rect className="fill moves" x={x0 + 1} y={y + 1} width={len - 2} height={h - 2} rx={3} style={{ transform: `scaleX(${frac})` }} />
      {ticks}
      {/* rod shortens from the left as the stopper moves; the thumb rest stays put */}
      <rect className="plunger moves" x={x0 + 8} y={y + h / 2 - 1} width={len + 22} height={2} style={{ transform: `scaleX(${1 - (frac * len) / (len + 22)})`, transformBox: 'fill-box', transformOrigin: 'right' }} />
      <rect className="plunger moves" x={x0} y={y - 4} width={8} height={h + 8} rx={2} style={{ transform: `translateX(${frac * len}px)` }} />
      <rect className="plunger" x={x0 + len + 30} y={y - 8} width={8} height={h + 16} rx={2} />
      <text x={x0 + len / 2} y={16} textAnchor="middle">units (U-100)</text>
    </svg>
  );
}
