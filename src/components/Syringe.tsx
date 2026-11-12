import { useEffect, useId, useState } from 'react';
import { fmtNum } from '../lib/format';

/**
 * A U-100 insulin syringe drawn to scale with its fill at `units`. Glass barrel, water that keeps moving
 * inside it, and a tag that rides the stopper with the amount. The stopper glides when the amount changes.
 */
export function Syringe({ units, cap }: { units: number; cap: number }) {
  const W = 448, H = 106, x0 = 62, len = 344, y = 38, h = 44, mid = y + h / 2;
  const id = useId();
  const step = cap <= 50 ? 1 : 2;
  const major = cap <= 30 ? 5 : 10;
  const fillU = Math.min(Math.max(units, 0), cap);
  // Start empty and draw up to the amount just after mounting, so the first view shows the draw.
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  const frac = ready ? fillU / cap : 0;
  const at = { transform: `translateX(${frac * len}px)` };
  const tag = fmtNum(units, 1);
  const tw = tag.length * 9 + 18;
  const ticks = [];
  for (let u = 0; u <= cap; u += step) {
    const x = x0 + (u / cap) * len;
    const isMajor = u % major === 0;
    ticks.push(
      <g key={u}>
        <line className={`tick${isMajor ? ' major' : ''}`} x1={x} x2={x} y1={y} y2={y + (isMajor ? 17 : 9)} />
        {isMajor && <text x={x} y={y + h + 17} textAnchor="middle">{u}</text>}
      </g>,
    );
  }
  return (
    <svg className="syringe chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Syringe filled to ${tag} of ${cap} units`}>
      <clipPath id={id}><rect x={x0} y={y} width={len} height={h} rx={10} /></clipPath>
      <line className="needle" x1={8} x2={x0 - 16} y1={mid} y2={mid} />
      <rect className="hub" x={x0 - 18} y={mid - 9} width={18} height={18} rx={5} />
      <rect className="glass" x={x0} y={y} width={len} height={h} rx={10} />
      <g clipPath={`url(#${id})`}>
        <rect className="water" x={x0} y={y} width={len} height={h} />
        {/* the deeper band slides one wavelength and repeats, like the water at the top of a screen */}
        <path className="deep drift" style={{ ['--tile' as string]: '40px', animationDuration: '3.6s' }}
          d={`M${x0 - 40} ${mid + 3}q10 -7 20 0${'t20 0'.repeat(21)}V${y + h}H${x0 - 40}Z`} />
        {[.08, .24, .43, .61, .8, .93].map((f, i) => (
          <circle key={f} className="bub" cx={x0 + f * len} cy={mid + 10} r={i % 2 ? 2 : 3} style={{ ['--i' as string]: i }} />
        ))}
        {/* everything past the stopper is empty: this cover moves with it */}
        <rect className="empty moves" x={x0} y={y} width={len} height={h} style={at} />
        <line className="gloss" x1={x0 + 10} x2={x0 + len - 10} y1={y + 6} y2={y + 6} />
      </g>
      <rect className="barrel" x={x0} y={y} width={len} height={h} rx={10} />
      {ticks}
      {/* rod shortens from the left as the stopper moves; the thumb rest stays put */}
      <rect className="rod moves" x={x0 + 8} y={mid - 2} width={len + 18} height={4} rx={2} style={{ transform: `scaleX(${1 - (frac * len) / (len + 18)})`, transformBox: 'fill-box', transformOrigin: 'right' }} />
      <g className="moves" style={at}>
        <rect className="stopper" x={x0} y={y - 3} width={9} height={h + 6} rx={4} />
        <g className="tag">
          <rect x={x0 - tw / 2} y={4} width={tw} height={22} rx={11} />
          <path d={`M${x0 - 5} 25h10l-5 6z`} />
          <text x={x0} y={20} textAnchor="middle">{tag}</text>
        </g>
      </g>
      <rect className="thumb" x={x0 + len + 26} y={y - 8} width={9} height={h + 16} rx={4.5} />
      <text x={4} y={y + h + 17}>U-100</text>
    </svg>
  );
}
