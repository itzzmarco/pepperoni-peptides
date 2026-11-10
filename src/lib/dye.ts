/** Ready-made field colors. The first is the stylesheet's own cobalt. Each passes readable() unchanged. */
export const DYES = [
  { name: 'Cobalt', hex: '#2430E8' },
  { name: 'Violet', hex: '#7213D7' },
  { name: 'Berry', hex: '#A50F69' },
  { name: 'Ember', hex: '#A92507' },
  { name: 'Forest', hex: '#086834' },
  { name: 'Teal', hex: '#09646C' },
  { name: 'Graphite', hex: '#363D4D' },
] as const;

// The brightest a field may be: at this luminance the 80% white fine print still passes 4.5:1 on the worst hue (pure red, 4.60).
const Y_MAX = 0.105;

/** Darkens a picked #rrggbb color until white text on it is readable. Scaling linear RGB scales luminance by the same factor and keeps the hue. */
export function readable(hex: string): string {
  const lin = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const k = Math.min(1, Y_MAX / (0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]));
  return '#' + lin.map(c => {
    c *= k;
    return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255).toString(16).padStart(2, '0');
  }).join('').toUpperCase();
}
