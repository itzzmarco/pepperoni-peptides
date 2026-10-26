export type Tier = 1 | 2 | 3 | 4 | 5;

export type LegalKey =
  | 'approved'
  | 'compoundable'
  | 'pending'
  | 'restricted'
  | 'investigational'
  | 'unapproved'
  | 'cosmetic'
  | 'abroad'
  | 'supplement';

export type FamilyKey =
  | 'repair'
  | 'metabolic'
  | 'gh'
  | 'skin'
  | 'mind'
  | 'longevity'
  | 'immune'
  | 'sexual'
  | 'lipo';

export interface Source {
  t: string;
  u: string;
}

export interface Peptide {
  id: string;
  name: string;
  aka?: string[];
  family: FamilyKey;
  tier: Tier;
  legal: LegalKey;
  /** One-line US status as of the data date, more specific than the legal bucket. */
  status?: string;
  wada?: string;
  /** False for things sold alongside peptides that are not peptides (MK-677, NAD+, 5-Amino-1MQ). */
  isPeptide?: boolean;
  /** One-letter residues as a string, or tokens when modified residues are involved. */
  seq?: string | string[];
  seqNote?: string;
  summary: string;
  mechanism?: string;
  claim?: string;
  shows?: string;
  evidence?: string[];
  halfLife?: string;
  routes?: string;
  /** Doses from approved labeling or published trials, for context only. */
  studied?: string;
  sideEffects?: string[];
  redFlags?: string[];
  avoid?: string[];
  interactions?: string[];
  unknowns?: string[];
  /** 30-day engagement points from the source overview, where reported. */
  popularity?: number;
  goals?: string[];
  defaultRoute?: string;
  defaultUnit?: string;
  sources?: Source[];
}

export interface TimelineEvent {
  date: string;
  title: string;
  body: string;
  /** tighten = access restricted, loosen = access widened, next = scheduled */
  k?: 'tighten' | 'loosen' | 'next' | '';
}

export interface SafetyCard {
  title: string;
  body?: string;
  items?: string[];
  tone?: 'flag' | 'caution' | '';
  sources?: Source[];
}

export interface Regimen {
  id: string;
  compoundId: string;
  name: string;
  dose: string;
  unit: string;
  freq: string;
  everyDays: string;
  route: string;
  prescriber: string;
  source: string;
  start: string;
  vialMg: string;
  diluentMl: string;
  notes: string;
  paused?: boolean;
  createdAt?: string;
}

export interface DoseEntry {
  id: string;
  rid: string;
  name: string;
  at: string;
  amount: string;
  unit: string;
  route: string;
  site: string;
  notes: string;
}

export interface Checkin {
  id: string;
  at: string;
  overall?: number;
  sleep?: number;
  energy?: number;
  mood?: number;
  appetite?: number;
  weight?: number;
  weightUnit?: string;
  effects: string[];
  flags: string[];
  notes: string;
}

export interface Ledger {
  version: 1;
  regimens: Regimen[];
  doses: DoseEntry[];
  checkins: Checkin[];
}
