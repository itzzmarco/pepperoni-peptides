import { fmtNum } from './format';

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

/** Units that measure liquid drawn up rather than drug: their amount depends on how the vial was mixed. */
export const SYRINGE_UNITS = 'units (syringe)';
export const isVolumeUnit = (unit: string) => unit === SYRINGE_UNITS || unit === 'mL';

/**
 * Reconstitution arithmetic for a lyophilized vial: concentration = vial mg / diluent mL,
 * volume = dose / concentration, U-100 units = mL x 100. A dose given in syringe units or mL
 * works the other way: the drug in it = volume x concentration.
 */
export function doseMath(amount: number | string, unit: string, vialMg: number | string, diluentMl: number | string): DoseMath | null {
  const a = Number(amount);
  const v = Number(vialMg);
  const ml = Number(diluentMl);
  if (!(a > 0 && v > 0 && ml > 0)) return null;
  const conc = v / ml;
  const doseMg = unit === SYRINGE_UNITS ? (a / 100) * conc : unit === 'mL' ? a * conc : toMg(a, unit);
  if (doseMg == null) return null;
  const vol = doseMg / conc;
  return { conc, vol, units: vol * 100, perVial: v / doseMg, mcgPerUnit: conc * 10, doseMg };
}

/** A drug amount given in mg, written in mcg for compounds usually dosed in mcg. */
export const drugAmount = (mg: number, prefer = 'mg') =>
  prefer === 'mcg' ? `${fmtNum(mg * 1000, 1)} mcg` : `${fmtNum(mg, 3)} mg`;

/** How much drug is in a given number of U-100 units at a given concentration (mg/mL). */
export const mgInUnits = (units: number, conc: number) => (units / 100) * conc;

export type CalcAlert = { tone: 'danger' | 'warn' | 'info'; title: string; body: string };

/** Plain-language checks on a calculation, ordered most serious first. */
export function calcAlerts(m: DoseMath, vialMg: number, diluentMl: number, syringeUnits: number): CalcAlert[] {
  const out: CalcAlert[] = [];
  if (diluentMl > VIAL_ML_LIMIT) out.push({ tone: 'danger', title: `${fmtNum(diluentMl)} mL is more water than a vial holds.`, body: `If you measured it with an insulin syringe, ${fmtNum(diluentMl)} units is ${fmtNum(diluentMl / 100)} mL. Enter mL here.` });
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

/** Peptide vials hold a few mL. Much more than this is nearly always syringe units typed as mL. */
export const VIAL_ML_LIMIT = 10;
/** A U-100 insulin syringe holds 100 units (1 mL) at most. */
export const SYRINGE_MAX_UNITS = 100;

export interface VialCheck {
  title: string;
  body: string;
  /** A one-tap correction, offered when the likely mistake is clear. */
  fix?: { label: string; set: { unit?: string; diluentMl?: string } };
}

/**
 * Catches the vial mix-ups people make most, before they turn into a wrong draw:
 * water measured with an insulin syringe and typed as mL (300 instead of 3), and a dose drawn in
 * syringe units but saved as mg. Returns nothing when the numbers are plausible.
 *
 * `liquidLimit` is the most mL the product plausibly holds; `unitsUsual` says the compound is
 * usually drawn in syringe units, so switching the unit is the likely fix.
 */
export function vialChecks(
  r: { dose: string; unit: string; vialMg: string; diluentMl: string },
  { liquidLimit = VIAL_ML_LIMIT, unitsUsual = true }: { liquidLimit?: number; unitsUsual?: boolean } = {},
): VialCheck[] {
  const out: VialCheck[] = [];
  const dose = Number(r.dose);
  const vialMg = Number(r.vialMg);
  const ml = Number(r.diluentMl);

  if (ml > liquidLimit) {
    const asMl = ml / 100;
    const likely = asMl >= 0.5 && asMl <= liquidLimit;
    out.push({
      title: `${fmtNum(ml)} mL is more liquid than a vial holds.`,
      body: likely
        ? `If you measured it with an insulin syringe, ${fmtNum(ml)} units is ${fmtNum(asMl)} mL.`
        : 'Check the mL on the vial label, or how much water you added.',
      fix: likely ? { label: `Use ${fmtNum(asMl)} mL`, set: { diluentMl: String(asMl) } } : undefined,
    });
  }

  const m = doseMath(dose, r.unit, vialMg, ml);
  if (!m) return out;
  const drug = r.unit === 'mg' || r.unit === 'mcg';
  // A number that reads as a syringe draw (1 to 100) saved as mg or mcg is the usual slip.
  const toUnits = drug && unitsUsual && dose >= 1 && dose <= SYRINGE_MAX_UNITS
    ? { label: 'Switch to syringe units', set: { unit: SYRINGE_UNITS } }
    : undefined;
  const fixBody = toUnits
    ? `If you draw ${fmtNum(dose, 3)} units on an insulin syringe, change the unit to syringe units and the app works out the mg.`
    : drug ? 'Check the dose unit (mcg or mg) and the vial label.' : 'Check the dose and the vial details.';

  if (m.doseMg > vialMg * 1.0001) {
    out.push({ title: `One dose would be more than the whole vial (${fmtNum(vialMg, 3)} mg).`, body: fixBody, fix: toUnits });
  } else if (m.units > SYRINGE_MAX_UNITS + 0.0001) {
    out.push({ title: `That's ${fmtNum(m.units, 0)} units, more than a 1 mL syringe holds.`, body: fixBody, fix: toUnits });
  }
  return out;
}
