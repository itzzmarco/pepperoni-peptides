import type { Ledger } from './types';
import { freqText } from './schedule';
import { SITE_LABEL } from './sites';

const cell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const CSV_HEADER = ['type', 'date_time', 'name', 'amount', 'unit', 'route', 'site', 'overall', 'sleep', 'energy', 'mood', 'appetite', 'weight', 'weight_unit', 'side_effects_or_frequency', 'emergency_symptoms_or_source', 'notes'];

/** One spreadsheet-friendly table: regimens first, then doses and check-ins newest first. */
export function ledgerToCsv(l: Ledger, nameOf: (compoundId: string) => string | undefined): string {
  const regs = l.regimens.map(r => [
    'regimen', r.start, nameOf(r.compoundId) ?? r.name, r.dose, r.unit, r.route, '', '', '', '', '', '', '', '',
    freqText(r), r.source, [r.prescriber && `Prescriber: ${r.prescriber}`, r.paused && 'paused', r.notes].filter(Boolean).join(' | '),
  ]);
  const rows: unknown[][] = [];
  l.doses.forEach(d => rows.push(['dose', d.at, d.name, d.amount, d.unit, d.route, SITE_LABEL[d.site] ?? '', '', '', '', '', '', '', '', '', '', d.notes]));
  l.checkins.forEach(c => rows.push(['check-in', c.at, '', '', '', '', '', c.overall, c.sleep, c.energy, c.mood, c.appetite, c.weight, c.weightUnit, c.effects.join('; '), c.flags.join('; '), c.notes]));
  rows.sort((a, b) => String(b[1]).localeCompare(String(a[1])));
  return [CSV_HEADER, ...regs, ...rows].map(r => r.map(cell).join(',')).join('\n');
}
