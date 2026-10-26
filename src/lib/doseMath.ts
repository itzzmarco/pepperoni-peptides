export interface DoseMath {
  /** mg per mL after reconstitution */
  conc: number;
  /** mL to draw for one dose */
  vol: number;
  /** units on a U-100 insulin syringe (100 units = 1 mL) */
  units: number;
  /** whole and partial doses the vial holds */
  perVial: number;
  /** mcg contained in one syringe unit */
  mcgPerUnit: number;
  /** the dose expressed in mg */
  doseMg: number;
}

/** Converts a dose in mcg or mg to mg. Returns null for units the math cannot handle (IU, mL, capsules). */
export function toMg(amount: number, unit: string): number | null {
  if (unit === 'mcg') return amount / 1000;
  if (unit === 'mg') return amount;
  return null;
}

/**
 * Reconstitution arithmetic for a lyophilized vial: concentration = vial mg / diluent mL,
 * volume = dose / concentration, U-100 units = mL x 100.
 */
export function doseMath(amount: number | string, unit: string, vialMg: number | string, diluentMl: number | string): DoseMath | null {
  const a = Number(amount);
  const v = Number(vialMg);
  const ml = Number(diluentMl);
  if (!(a > 0 && v > 0 && ml > 0)) return null;
  const doseMg = toMg(a, unit);
  if (doseMg == null) return null;
  const conc = v / ml;
  const vol = doseMg / conc;
  return { conc, vol, units: vol * 100, perVial: v / doseMg, mcgPerUnit: conc * 10, doseMg };
}

/** How much drug is in a given number of U-100 units at a given concentration (mg/mL). */
export const mgInUnits = (units: number, conc: number) => (units / 100) * conc;

export type CalcAlert = { tone: 'danger' | 'warn' | 'info'; title: string; body: string };

/** Plain-language checks on a calculation, ordered most serious first. */
export function calcAlerts(m: DoseMath, vialMg: number, diluentMl: number, syringeUnits: number): CalcAlert[] {
  const out: CalcAlert[] = [];
  if (m.doseMg > vialMg) out.push({ tone: 'danger', title: 'The dose is larger than the whole vial.', body: 'Check the units on your prescription (mcg vs mg).' });
  if (m.units > syringeUnits) out.push({ tone: 'danger', title: `That's more than this syringe holds (${syringeUnits} units).`, body: "Use a larger syringe or ask your pharmacist about a different dilution. Don't split doses without guidance." });
  if (m.units < 2) out.push({ tone: 'warn', title: 'Under 2 units is hard to measure accurately.', body: 'Small reading errors become big dose errors. A pharmacist can suggest adding more water.' });
  if (diluentMl > 0 && vialMg / diluentMl > 20) out.push({ tone: 'warn', title: 'Very concentrated solution.', body: 'Each unit holds a lot of drug, so small mistakes matter more.' });
  if (m.units >= 2 && Math.abs(m.units - Math.round(m.units)) > 0.05) {
    const r = Math.round(m.units);
    const err = (Math.abs(r - m.units) / m.units) * 100;
    out.push({ tone: 'info', title: `Rounds to ${r} units on the syringe.`, body: `That changes the dose by about ${err.toFixed(1)}%.` });
  }
  return out;
}
