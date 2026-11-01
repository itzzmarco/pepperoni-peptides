import { describe, expect, it } from 'vitest';
import { cleanCode, convertWeight, firstName, partnerError, rowsToLedger, showCode, weightChange } from '../partner';
import { check, dose, reg } from './helpers';

describe('rowsToLedger', () => {
  it('builds a log from server rows, leaving out deleted and malformed items', () => {
    const l = rowsToLedger([
      { kind: 'regimen', id: 'r1', data: reg('r1'), deleted: false },
      { kind: 'dose', id: 'd1', data: dose('d1', '2026-10-01T09:00:00Z'), deleted: false },
      { kind: 'dose', id: 'd2', data: dose('d2', '2026-10-08T09:00:00Z'), deleted: false },
      { kind: 'dose', id: 'd3', data: {}, deleted: true },
      { kind: 'checkin', id: 'c1', data: { ...check('c1', '2026-10-02T09:00:00Z'), weight: 205 }, deleted: false },
      { kind: 'checkin', id: 'x', data: check('other-id', '2026-10-02T09:00:00Z'), deleted: false },
      { kind: 'note', id: 'n', data: { id: 'n' }, deleted: false },
    ]);
    expect(l.regimens.map(r => r.id)).toEqual(['r1']);
    expect(l.doses.map(d => d.id)).toEqual(['d2', 'd1']);
    expect(l.checkins.map(c => c.id)).toEqual(['c1']);
  });
});

describe('names and codes', () => {
  it('uses the first name, or the start of an email', () => {
    expect(firstName('Jane Aguirre')).toBe('Jane');
    expect(firstName('jane.aguirre@gmail.com')).toBe('Jane');
    expect(firstName('  ')).toBe('Your partner');
  });

  it('cleans a typed code and shows it in two halves', () => {
    expect(cleanCode(' k7q-4mx ')).toBe('K7Q4MX');
    expect(cleanCode('k7q 4mx extra')).toBe('K7Q4MX');
    expect(showCode('K7Q4MX')).toBe('K7Q 4MX');
  });
});

describe('partnerError', () => {
  it('explains a server that has not had the partner step run yet', () => {
    expect(partnerError({ code: 'PGRST202', message: 'Could not find the function public.create_partner_invite' })).toMatch(/isn't set up on the server/);
    expect(partnerError({ code: 'PGRST205', message: "Could not find the table 'public.partners'" })).toMatch(/isn't set up/);
  });

  it('passes the server message through, and says when the network is down', () => {
    expect(partnerError({ code: 'P0002', message: "That code didn't work." })).toBe("That code didn't work.");
    expect(partnerError(new TypeError('Failed to fetch'))).toMatch(/Couldn't reach the server/);
  });
});

describe('weightChange', () => {
  const cs = [
    { ...check('a', '2026-09-07T12:00:00Z'), weight: 213, weightUnit: 'lb' },
    { ...check('b', '2026-10-01T12:00:00Z'), weight: 93, weightUnit: 'kg' },
    { ...check('c', '2026-10-31T12:00:00Z'), weight: 202, weightUnit: 'lb' },
    check('d', '2026-10-20T12:00:00Z'),
  ];

  it('measures from the first to the latest weigh-in in range, in one unit', () => {
    const w = weightChange(cs, 'lb')!;
    expect(w.count).toBe(3);
    expect(w.first.w).toBe(213);
    expect(w.change).toBe(-11);
    expect(weightChange(cs, 'lb', Date.parse('2026-09-15T00:00:00Z'))!.first.w).toBeCloseTo(convertWeight(93, 'kg', 'lb'));
  });

  it('is null with no weigh-ins', () => {
    expect(weightChange([check('d', '2026-10-20T12:00:00Z')], 'lb')).toBeNull();
  });
});
