import type { Regimen } from './types';
import { doseMath, SYRINGE_UNITS, vialChecks, type DoseMath, type VialCheck } from './doseMath';
import { measuresFor } from '../data/measures';

/** What the vial checks need to know about a compound: how much liquid its products hold, and whether it's drawn in syringe units. */
export function vialHints(compoundId?: string) {
  const ms = measuresFor(compoundId);
  return {
    // Injection products sold by the mL (lipo shots, L-carnitine) come in larger vials.
    liquidLimit: ms.some(m => m.u === 'mL') ? 30 : 10,
    // Typed-in names have no list, and most of them are vials.
    unitsUsual: !ms.length || ms.some(m => m.u === SYRINGE_UNITS),
  };
}

/**
 * The dose math for a dose of a regimen, plus anything that doesn't add up. When there are checks,
 * `math` is null so no screen shows a draw built on numbers that are likely wrong.
 */
export function checkDose(r: Pick<Regimen, 'compoundId' | 'vialMg' | 'diluentMl'>, dose: string, unit: string): { math: DoseMath | null; checks: VialCheck[] } {
  const checks = r.vialMg || r.diluentMl ? vialChecks({ dose, unit, vialMg: r.vialMg, diluentMl: r.diluentMl }, vialHints(r.compoundId)) : [];
  return { math: checks.length ? null : doseMath(dose, unit, r.vialMg, r.diluentMl), checks };
}

export const checkRegimen = (r: Regimen) => checkDose(r, r.dose, r.unit);
