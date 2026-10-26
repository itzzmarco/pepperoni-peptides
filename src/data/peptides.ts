import type { Peptide } from '../lib/types';
import { GROWTH_HORMONE } from './compounds/growth-hormone';
import { LONGEVITY } from './compounds/longevity';
import { METABOLIC } from './compounds/metabolic';
import { MIND } from './compounds/mind';
import { REPAIR_IMMUNE } from './compounds/repair-immune';
import { SKIN_SEXUAL } from './compounds/skin-sexual';

/** Every library entry. Content rules live in ./compounds/AUTHORING.md. */
export const PEPTIDES: Peptide[] = [...METABOLIC, ...REPAIR_IMMUNE, ...GROWTH_HORMONE, ...SKIN_SEXUAL, ...MIND, ...LONGEVITY];

export const PEP: Record<string, Peptide> = Object.fromEntries(PEPTIDES.map(p => [p.id, p]));
