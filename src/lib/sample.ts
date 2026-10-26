import type { Checkin, DoseEntry, Ledger, Regimen } from './types';
import { DAY } from './format';

/** Every sample entry's id starts with this, so sample data can be cleared without touching real entries. */
export const SAMPLE_PREFIX = 'sample-';
export const isSample = (x: { id: string }) => x.id.startsWith(SAMPLE_PREFIX);

/**
 * A month of example entries so a first-time visitor can see how the log works.
 * Only an FDA-approved drug at its labeled starting dose and a cosmetic topical, so the sample never reads as dosing advice.
 */
export function sampleLedger(now = new Date()): Ledger {
  const at = (daysAgo: number, hour = 8) => {
    const d = new Date(now.getTime() - daysAgo * DAY);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const base = { everyDays: '', vialMg: '', diluentMl: '', notes: 'Sample entry', createdAt: at(30) };
  const regimens: Regimen[] = [
    { ...base, id: 'sample-r1', compoundId: 'tirzepatide', name: '', dose: '2.5', unit: 'mg', freq: 'weekly', route: 'Subcutaneous injection', prescriber: 'Sample clinician', source: 'Retail pharmacy (prescription)', start: at(29).slice(0, 10) },
    { ...base, id: 'sample-r2', compoundId: 'ghk-cu', name: '', dose: '1', unit: 'application', freq: 'daily', route: 'Topical', prescriber: '', source: 'Retail pharmacy (prescription)', start: at(14).slice(0, 10) },
  ];
  const doses: DoseEntry[] = [
    ...[28, 21, 14, 7].map((d, i): DoseEntry => ({ id: `sample-d${i}`, rid: 'sample-r1', name: 'Tirzepatide', at: at(d), amount: '2.5', unit: 'mg', route: 'Subcutaneous injection', site: ['abd-lr', 'thigh-r', 'abd-ll', 'thigh-l'][i], notes: '' })),
    ...[13, 12, 10, 9, 8, 6, 5, 4, 3, 1].map((d, i): DoseEntry => ({ id: `sample-g${i}`, rid: 'sample-r2', name: 'GHK-Cu (topical)', at: at(d, 21), amount: '1', unit: 'application', route: 'Topical', site: '', notes: '' })),
  ];
  const checkins: Checkin[] = [
    [27, 3, 204.6, ['Nausea']], [24, 3, 204.1, ['Nausea', 'Less hungry']], [20, 4, 203.2, ['Less hungry']], [17, 3, 202.8, ['Constipation']],
    [13, 4, 201.9, ['Less hungry']], [10, 4, 201.4, []], [6, 3, 200.6, ['Fatigue']], [3, 4, 199.8, ['Less hungry']], [1, 4, 199.5, []],
  ].map(([d, overall, weight, effects], i) => ({
    id: `sample-c${i}`, at: at(d as number, 20), overall: overall as number, weight: weight as number, weightUnit: 'lb',
    effects: effects as string[], flags: [], notes: '',
  }));
  return { version: 1, regimens, doses, checkins };
}
