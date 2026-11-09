import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fmtNum } from '../lib/format';
import { syringeScale } from '../lib/syringeScale';

/** A U-100 insulin syringe drawn to scale with its fill at `units`. The fill and plunger glide when the amount changes.
 *  It is drawn at its container's real pixel width, like LineChart, so the unit labels stay at text size on a phone;
 *  ticks and labels thin out (syringeScale) when the barrel is short. */
export function Syringe({ units, cap }: { units: number; cap: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(520);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setW(Math.max(200, Math.round(el.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Needle on the left, thumb rest on the right (30px past the barrel plus its 8px width, plus a little air).
  const H = 92, x0 = 40, len = W - x0 - 42, y = 30, h = 30;
  const { step, major, label } = syringeScale(cap, len);
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
        {u % label === 0 && <text x={x} y={y + h + 14} textAnchor="middle">{u}</text>}
      </g>,
    );
  }
  return (
    <div ref={wrap}>
      <svg className="syringe chart" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Syringe filled to ${fmtNum(units, 1)} of ${cap} units`}>
        <line className="needle" x1={4} x2={x0 - 14} y1={y + h / 2} y2={y + h / 2} />
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
    </div>
  );
}
