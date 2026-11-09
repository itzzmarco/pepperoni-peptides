/**
 * A CSS time value ("240ms", "0.24s") in milliseconds, or `fallback` when it isn't one.
 * Lets timers follow a duration token in styles.css instead of copying its number.
 */
export function cssMs(value: string, fallback: number): number {
  const m = /^\s*(\d*\.?\d+)(ms|s)\s*$/i.exec(value);
  if (!m) return fallback;
  return m[2].toLowerCase() === 's' ? Number(m[1]) * 1000 : Number(m[1]);
}
