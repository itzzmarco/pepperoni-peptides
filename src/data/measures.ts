/**
 * How people usually measure a dose of each compound, by the form they actually use it in:
 * a vial drawn up with an insulin syringe, a prescription pen, capsules, a nasal spray, a cream.
 * Most common first; the first one is the unit a new regimen starts with. `how` names the form,
 * never an amount: this app doesn't suggest doses.
 *
 * Vial products are drawn in U-100 syringe units, and the amount (mcg or mg) depends on how the
 * vial was mixed, so the regimen form shows the mg once vial details are added.
 */
export interface Measure {
  /** One of UNITS in options.ts. */
  u: string;
  /** The product form this unit goes with, a few words. */
  how: string;
}

const UNITS_VIAL: Measure = { u: 'units (syringe)', how: 'drawn from a vial' };
const amount = (u: 'mcg' | 'mg', how = 'the amount in each dose'): Measure => ({ u, how });
/** Injected from a vial: syringe units first, then the amount it holds. */
const vial = (u: 'mcg' | 'mg'): Measure[] => [UNITS_VIAL, amount(u)];

export const MEASURES: Record<string, Measure[]> = {
  // Growth hormone and secretagogues
  'igf-1-lr3': vial('mcg'),
  tesamorelin: [amount('mg', 'prescription vial (Egrifta)'), UNITS_VIAL],
  sermorelin: vial('mcg'),
  'cjc-1295': vial('mcg'),
  ipamorelin: vial('mcg'),
  'cjc-ipamorelin': vial('mcg'),
  'ghrp-2': vial('mcg'),
  'ghrp-6': vial('mcg'),
  'mk-677': [amount('mg', 'capsule or liquid strength'), { u: 'capsule', how: 'number of capsules' }, { u: 'mL', how: 'liquid' }],
  somatropin: [amount('mg', 'prescription pens'), { u: 'IU', how: 'vials labeled in IU' }, UNITS_VIAL],

  // Longevity and cell energy
  glutathione: [amount('mg', 'IV or injection'), { u: 'capsule', how: 'oral' }, { u: 'mL', how: 'injection volume' }],
  'ss-31': vial('mg'),
  'mots-c': vial('mg'),
  epitalon: vial('mg'),
  'foxo4-dri': vial('mg'),
  nad: [amount('mg', 'IV drip or injection'), UNITS_VIAL, { u: 'spray', how: 'nasal spray' }],

  // Weight and metabolism
  semaglutide: [UNITS_VIAL, amount('mg', 'pens (Ozempic, Wegovy) or tablets')],
  tirzepatide: [UNITS_VIAL, amount('mg', 'pens (Zepbound, Mounjaro)')],
  retatrutide: vial('mg'),
  cagrilintide: vial('mg'),
  eloralintide: vial('mg'),
  at7687: vial('mg'),
  'aod-9604': vial('mcg'),
  'hgh-frag-176-191': vial('mcg'),
  '5-amino-1mq': [amount('mg', 'capsule strength'), { u: 'capsule', how: 'number of capsules' }],
  'l-carnitine': [amount('mg', 'injection'), { u: 'mL', how: 'injection volume' }],
  'lipo-injections': [{ u: 'mL', how: 'injection volume' }, UNITS_VIAL],

  // Focus, mood and sleep
  semax: [{ u: 'spray', how: 'nasal spray' }, { u: 'drop', how: 'nasal drops' }, amount('mcg')],
  adamax: [{ u: 'spray', how: 'nasal spray' }, amount('mcg')],
  selank: [{ u: 'spray', how: 'nasal spray' }, { u: 'drop', how: 'nasal drops' }, amount('mcg')],
  dihexa: [amount('mg', 'capsule strength'), { u: 'capsule', how: 'number of capsules' }],
  dsip: vial('mcg'),
  cerebrolysin: [{ u: 'mL', how: 'ampoules, given in clinic' }],
  cortexin: vial('mg'),
  p21: [amount('mg', 'oral'), { u: 'spray', how: 'nasal spray' }],
  'pe-22-28': [{ u: 'spray', how: 'nasal spray' }, UNITS_VIAL, amount('mcg')],

  // Healing and immune
  'bpc-157': [UNITS_VIAL, amount('mcg'), { u: 'capsule', how: 'oral capsules' }],
  'tb-500': vial('mg'),
  'wolverine-stack': vial('mg'),
  'ara-290': vial('mg'),
  kpv: [{ u: 'application', how: 'cream' }, { u: 'capsule', how: 'oral capsules' }, UNITS_VIAL],
  'thymosin-alpha-1': vial('mg'),
  thymalin: [amount('mg', 'injection vial'), UNITS_VIAL],
  vip: [{ u: 'spray', how: 'nasal spray' }, amount('mcg')],
  'll-37': [{ u: 'application', how: 'cream' }, UNITS_VIAL],

  // Skin, hair, tanning and sexual health
  'ghk-cu': [{ u: 'application', how: 'serum or cream' }],
  'ghk-cu-injectable': vial('mg'),
  'ahk-cu': [{ u: 'application', how: 'hair serum' }],
  'snap-8': [{ u: 'application', how: 'serum or cream' }],
  'melanotan-2': [UNITS_VIAL, amount('mg'), { u: 'spray', how: 'nasal spray' }],
  afamelanotide: [amount('mg', 'implant, placed in clinic')],
  'glow-klow': vial('mg'),
  bremelanotide: [amount('mg', 'autoinjector (Vyleesi)'), UNITS_VIAL],
  kisspeptin: vial('mcg'),
};

/** The usual units for a compound, most common first. Empty for a name typed by hand. */
export const measuresFor = (id?: string): Measure[] => (id && MEASURES[id]) || [];
