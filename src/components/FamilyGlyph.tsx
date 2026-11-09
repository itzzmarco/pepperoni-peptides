import type { FamilyKey } from '../lib/types';

/** One tint per family, from the Soft Bento palette, and a 24px stroke icon for each. */
const GLYPH: Record<FamilyKey, { tone: string; d: string }> = {
  // Scale: weight and metabolism
  metabolic: { tone: 'lilac', d: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 10a4 4 0 0 1 8 0M12 10l1.5-2' },
  // Bandage: repair and recovery
  repair: { tone: 'peach', d: 'M4.6 14.8 14.8 4.6a3 3 0 0 1 4.2 0l.4.4a3 3 0 0 1 0 4.2L9.2 19.4a3 3 0 0 1-4.2 0l-.4-.4a3 3 0 0 1 0-4.2zM10 10l4 4M11 13h.01M13 11h.01' },
  // Rising bars: growth hormone
  gh: { tone: 'sky', d: 'M5 20v-5M10 20V10M15 20V6M20 20V3M3 20h18' },
  // Sparkle: skin, hair and tan
  skin: { tone: 'peach', d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z' },
  // Spark in a head outline: mind and mood
  mind: { tone: 'lilac', d: 'M9 21v-3H7a2 2 0 0 1-2-2v-3l-2-1 2-3a7 7 0 0 1 14 1c0 2.5-1 4-3 5v6M12 7v3M10.5 8.5h3' },
  // Hourglass: longevity
  longevity: { tone: 'teal', d: 'M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9' },
  // Shield: immune and gut
  immune: { tone: 'mint', d: 'M12 21s7-3.5 7-9V5.5L12 3 5 5.5V12c0 5.5 7 9 7 9zM9 12l2 2 4-4' },
  // Two linked rings: sexual health and hormones
  sexual: { tone: 'peach', d: 'M9 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM15 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10z' },
  // Droplet: lipotropics and nutrients
  lipo: { tone: 'lemon', d: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11zM9.5 15a2.5 2.5 0 0 0 2.5 2.5' },
};

/** A family's icon on its tinted ground, decorative only: the family name is already in the text. */
export function FamilyGlyph({ family, size = 40 }: { family: FamilyKey; size?: number }) {
  const g = GLYPH[family] ?? GLYPH.repair;
  return (
    <span className="glyph" aria-hidden="true" style={{ width: size, height: size, background: `var(--${g.tone})`, color: `var(--${g.tone}-ink)` }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={g.d} /></svg>
    </span>
  );
}
