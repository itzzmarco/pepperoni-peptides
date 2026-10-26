export const ROUTES = ['Subcutaneous injection', 'Intramuscular injection', 'Nasal spray', 'Oral', 'Sublingual', 'Topical', 'IV (in clinic)', 'Other'];
export const INJECTABLE = new Set(['Subcutaneous injection', 'Intramuscular injection']);
export const UNITS = ['mcg', 'mg', 'IU', 'mL', 'units (syringe)', 'capsule', 'spray', 'application'];
export const SOURCES = ['Retail pharmacy (prescription)', 'Compounding pharmacy (prescription)', "Doctor's office or clinic", 'Online vendor (not a pharmacy)', 'Other or not sure'];
export const UNREGULATED_SOURCE = SOURCES[3];

export const EFFECTS = [
  'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Heartburn', 'Headache', 'Fatigue', 'Dizziness', 'Flushing',
  'Site redness or itch', 'Site lump or bruise', 'Water retention or swelling', 'More hungry', 'Less hungry',
  'Fast heartbeat', 'Trouble sleeping', 'Anxious or wired', 'Low mood or flat', 'Skin tingling or burning',
  'Darker skin or moles', 'Low libido', 'Joint pain',
];

/** Symptoms that mean "get care now". Shown in the check-in, on the Safety page, and flagged in the log. */
export const RED_FLAGS = [
  'Trouble breathing, throat or face swelling, or hives all over',
  'Chest pain or pressure',
  "Severe belly pain that won't go away (may spread to the back)",
  "Vomiting so much you can't keep fluids down",
  'Fainting, confusion, or seizure',
  'Shaky, sweaty, and confused (possible low blood sugar)',
  'Spreading redness, heat, or pus at an injection site, or fever and chills after a dose',
  'Erection lasting more than 4 hours',
  'Dark (cola-colored) urine with severe muscle pain',
  'Sudden severe headache or sudden vision change',
  'A new mole, or a mole that is changing fast',
  'Thoughts of harming yourself',
];

export const SCALES: [key: 'overall' | 'sleep' | 'energy' | 'mood' | 'appetite', label: string][] = [
  ['overall', 'Overall'], ['sleep', 'Sleep'], ['energy', 'Energy'], ['mood', 'Mood'], ['appetite', 'Appetite'],
];
