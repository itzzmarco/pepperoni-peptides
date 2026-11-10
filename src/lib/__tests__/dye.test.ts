import { describe, expect, it } from 'vitest';
import { DYES, readable } from '../dye';

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (rgb: number[]) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
/** WCAG contrast of white at `alpha` over a color, blended the way a browser does it (in gamma sRGB). */
function whiteOn(hex: string, alpha = 1) {
  const bg = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return (lum(bg.map(c => alpha + (1 - alpha) * c)) + 0.05) / (lum(bg) + 0.05);
}
const hex = (...rgb: number[]) => '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');

describe('readable', () => {
  it('leaves every ready-made color as it is', () => {
    for (const d of DYES) expect(readable(d.hex), d.name).toBe(d.hex);
  });

  it('keeps white text and the 80% white fine print at 4.5:1 or better on any pick', () => {
    for (let r = 0; r <= 255; r += 51) for (let g = 0; g <= 255; g += 51) for (let b = 0; b <= 255; b += 51) {
      const field = readable(hex(r, g, b));
      expect(whiteOn(field, 0.8), `${hex(r, g, b)} became ${field}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('darkens without changing the hue', () => {
    expect(readable('#ffff00')).toMatch(/^#([0-9A-F]{2})\1(00)$/);
    expect(readable('#ffffff')).toMatch(/^#([0-9A-F]{2})\1\1$/);
  });
});
