import type { FamilyKey } from '../lib/types';

/**
 * One tone per family, so a filtered grid still tells families apart: six Soft Bento tints, three of
 * them also used solid (ink ground, tint icon) for the families that share a tint's meaning.
 * Each icon is a short 24px stroke path that stays legible at 20px.
 */
const GLYPH: Record<FamilyKey, { tone: string; solid?: boolean; d: string }> = {
  // Gauge: weight and metabolism
  metabolic: { tone: 'lilac', d: 'M3 17a9 9 0 0 1 18 0M12 17l4-5M3 21h18' },
  // Bandage: repair and recovery
  repair: { tone: 'peach', d: 'M4.6 14.8 14.8 4.6a3 3 0 0 1 4.2 0l.4.4a3 3 0 0 1 0 4.2L9.2 19.4a3 3 0 0 1-4.2 0l-.4-.4a3 3 0 0 1 0-4.2zM10 10l4 4' },
  // Rising bars: growth hormone
  gh: { tone: 'sky', d: 'M5 20v-5M10 20V10M15 20V6M20 20V3M3 20h18' },
  // Sparkle: skin, hair and tan
  skin: { tone: 'peach', solid: true, d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z' },
  // Smile: mind and mood
  mind: { tone: 'lilac', solid: true, d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 14a5 5 0 0 0 8 0M9 9.5h.01M15 9.5h.01' },
  // Hourglass: longevity
  longevity: { tone: 'teal', d: 'M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9' },
  // Shield: immune and gut
  immune: { tone: 'mint', d: 'M12 21s7-3.5 7-9V5.5L12 3 5 5.5V12c0 5.5 7 9 7 9zM9 12l2 2 4-4' },
  // Two linked rings: sexual health and hormones
  sexual: { tone: 'sky', solid: true, d: 'M9 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM15 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10z' },
  // Droplet: lipotropics and nutrients
  lipo: { tone: 'lemon', d: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z' },
};

/** A family's icon on its tinted ground, decorative only: the family name is already in the text. */
export function FamilyGlyph({ family, size = 40 }: { family: FamilyKey; size?: number }) {
  const g = GLYPH[family] ?? GLYPH.repair;
  return (
    <span className="glyph" aria-hidden="true" data-solid={g.solid || undefined} style={{ width: size, height: size, background: `var(--${g.tone}${g.solid ? '-ink' : ''})`, color: `var(--${g.tone}${g.solid ? '' : '-ink'})` }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={g.d} /></svg>
    </span>
  );
}
