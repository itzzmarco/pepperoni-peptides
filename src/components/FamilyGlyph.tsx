import type { FamilyKey } from '../lib/types';

/**
 * Each of the nine families has its own tint, so a grid of cards sorts itself by colour at a glance, and its own mark:
 * a pale filled body (`f`) under a fine outline (`d`), drawn rather than a bare line icon, sized to read at 20px.
 */
const GLYPH: Record<FamilyKey, { tone: string; d: string; f: string }> = {
  // Gauge: weight and metabolism
  metabolic: { tone: 'lime', d: 'M3 17a9 9 0 0 1 18 0M12 17l4-5M3 21h18', f: 'M3 17a9 9 0 0 1 18 0z' },
  // Plus: repair and recovery
  repair: { tone: 'peach', d: 'M12 6v12M6 12h12', f: 'M9 4h6v5h5v6h-5v5H9v-5H4V9h5z' },
  // Rising bars: growth hormone
  gh: { tone: 'sky', d: 'M5 20v-5M10 20V10M15 20V6M20 20V3M3 20h18', f: 'M3.5 14h3v6h-3zM8.5 9h3v11h-3zM13.5 5h3v15h-3zM18.5 2h3v18h-3z' },
  // Sparkle: skin, hair and tan
  skin: { tone: 'sand', d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16v4M16 18h4', f: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z' },
  // Smile: mind and mood
  mind: { tone: 'lilac', d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 14a5 5 0 0 0 8 0M9 9.5h.01M15 9.5h.01', f: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z' },
  // Hourglass: longevity
  longevity: { tone: 'teal', d: 'M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9', f: 'M7.6 21c.8-3 4.4-4 4.4-6 0 2 3.6 3 4.4 6z' },
  // Shield: immune and gut
  immune: { tone: 'mint', d: 'M12 21s7-3.5 7-9V5.5L12 3 5 5.5V12c0 5.5 7 9 7 9zM9 12l2 2 4-4', f: 'M12 21s7-3.5 7-9V5.5L12 3 5 5.5V12c0 5.5 7 9 7 9z' },
  // Heart: sexual health and hormones
  sexual: { tone: 'rose', d: 'M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20z', f: 'M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20z' },
  // Droplet: lipotropics and nutrients
  lipo: { tone: 'lemon', d: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11zM9.5 14.5a2.5 2.5 0 0 0 2.5 2.5', f: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z' },
};

/**
 * A family's icon on its tinted ground, decorative only: the family name is already in the text.
 * `ground="surface"` puts the tinted icons on a plain surface instead, for when the glyph already sits on a tint.
 */
export function FamilyGlyph({ family, size = 40, ground }: { family: FamilyKey; size?: number; ground?: 'surface' }) {
  const g = GLYPH[family] ?? GLYPH.repair;
  const tone = { background: ground === 'surface' ? 'var(--surface)' : `var(--${g.tone})`, color: `var(--${g.tone}-ink)` };
  return (
    <span className="glyph" aria-hidden="true" style={{ width: size, height: size, ...tone }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={g.f} fill="currentColor" opacity=".22" stroke="none" /><path d={g.d} />
      </svg>
    </span>
  );
}
