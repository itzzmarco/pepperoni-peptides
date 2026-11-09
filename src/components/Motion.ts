import { useEffect, useRef, useState } from 'react';
import { cssMs } from '../lib/duration';

/** The user asked the OS for less motion. Read this instead of repeating the media query in components. */
export const prefersReducedMotion = () =>
  typeof window === 'undefined' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Reduced motion, or a background tab where animation frames don't run: jump straight to the end. */
const still = () => prefersReducedMotion() || document.visibilityState === 'hidden';

/** How long a closing sheet or toast plays before it unmounts: read from --dur-med in styles.css, so retuning the token retimes the unmount too. */
export const exitMs = () =>
  typeof document === 'undefined' ? 240 : cssMs(getComputedStyle(document.documentElement).getPropertyValue('--dur-med'), 240);

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
