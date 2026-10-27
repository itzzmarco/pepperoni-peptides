import { useEffect, useRef, useState } from 'react';

/** Reduced motion, or a background tab where animation frames don't run: jump straight to the end. */
const still = () =>
  typeof window === 'undefined' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.visibilityState === 'hidden';

/** Counts a number up (or down) to `target` with an ease-out, so a stat reads as "this just changed". */
export function useCountUp(target: number, from = 0, ms = 900) {
  const [v, setV] = useState(() => (still() ? target : from));
  const cur = useRef(v);
  useEffect(() => {
    const a = cur.current;
    if (still() || a === target) { cur.current = target; setV(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      cur.current = a + (target - a) * (1 - (1 - p) ** 3);
      setV(cur.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
