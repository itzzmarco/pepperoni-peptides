import { describe, expect, it } from 'vitest';
import { foldIn, merge, normalize, samePeptide } from '../store';
import { inAppBrowser } from '../account';
import { check, dose, reg } from './helpers';
import type { Ledger, Regimen } from '../types';

const tirz = (id: string, extra: Partial<Regimen> = {}): Regimen => ({ ...reg(id), compoundId: 'tirzepatide', name: '', route: 'Subcutaneous injection', ...extra });
const shot = (id: string, rid: string, at: string) => ({ ...dose(id, at), rid, name: 'Tirzepatide' });
const log = (l: Partial<Ledger>) => normalize({ regimens: [], doses: [], checkins: [], ...l })!;

describe('samePeptide', () => {
  it('matches library entries by id and typed names ignoring case', () => {
    expect(samePeptide(tirz('a'), tirz('b'))).toBe(true);
    expect(samePeptide(tirz('a'), { compoundId: 'semaglutide', name: '' })).toBe(false);
    expect(samePeptide({ compoundId: '', name: 'My Blend ' }, { compoundId: '', name: 'my blend' })).toBe(true);
    expect(samePeptide({ compoundId: '', name: '' }, { compoundId: '', name: '' })).toBe(false);
    expect(samePeptide(tirz('a'), { compoundId: '', name: 'Tirzepatide' })).toBe(false);
  });
});

describe('foldIn (moving a signed-out log into an account)', () => {
  // The account already tracks tirzepatide, with last week's shot.
  const account = log({ regimens: [tirz('acct')], doses: [shot('a1', 'acct', '2026-10-30T23:00:00Z')] });

  it("doesn't add a peptide the account already tracks, and moves its doses onto the account's regimen", () => {
    const phone = log({ regimens: [tirz('phone')], doses: [shot('p1', 'phone', '2026-11-06T23:00:00Z')], checkins: [check('c1', '2026-11-06T12:00:00Z')] });
    const folded = foldIn(account, phone);
    expect(folded.regimens).toEqual([]);
    expect(folded.doses.map(d => [d.id, d.rid])).toEqual([['p1', 'acct']]);
    expect(folded.checkins.map(c => c.id)).toEqual(['c1']);
    const { ledger } = merge(account, folded);
    expect(ledger.regimens.map(r => r.id)).toEqual(['acct']);
    expect(ledger.doses.filter(d => d.rid === 'acct').length).toBe(2);
  });

  it('leaves out a dose the account already has that day', () => {
    const phone = log({ regimens: [tirz('phone')], doses: [shot('p1', 'phone', '2026-10-30T23:30:00Z'), shot('p2', 'phone', '2026-11-06T23:00:00Z')] });
    expect(foldIn(account, phone).doses.map(d => d.id)).toEqual(['p2']);
  });

  it('keeps doses more than once a day apart by the hour, not the day', () => {
    const base = log({ regimens: [tirz('acct', { freq: 'bid' })], doses: [shot('a1', 'acct', '2026-11-06T08:00:00Z')] });
    const phone = log({ regimens: [tirz('phone', { freq: 'bid' })], doses: [shot('p1', 'phone', '2026-11-06T20:00:00Z'), shot('p2', 'phone', '2026-11-06T08:20:00Z')] });
    expect(foldIn(base, phone).doses.map(d => d.id)).toEqual(['p1']);
  });

  it("adds peptides the account doesn't track, and doesn't fold into a paused one", () => {
    const base = log({ regimens: [tirz('old', { paused: true })] });
    const phone = log({ regimens: [tirz('phone'), { ...reg('bpc'), compoundId: 'bpc-157' }], doses: [shot('p1', 'phone', '2026-11-06T23:00:00Z')] });
    const folded = foldIn(base, phone);
    expect(folded.regimens.map(r => r.id).sort()).toEqual(['bpc', 'phone']);
    expect(folded.doses[0].rid).toBe('phone');
  });

  it('leaves a regimen that is already in the account (same id) to the usual merge', () => {
    const folded = foldIn(account, log({ regimens: [tirz('acct')], doses: [shot('p1', 'acct', '2026-11-06T23:00:00Z')] }));
    expect(folded.regimens.map(r => r.id)).toEqual(['acct']);
    expect(folded.doses.map(d => d.rid)).toEqual(['acct']);
  });
});

describe('inAppBrowser', () => {
  it("spots other apps' built-in browsers, where Google sign-in is blocked", () => {
    expect(inAppBrowser('Mozilla/5.0 (Linux; Android 14; SM-S928U Build/UP1A; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36')).toBe(true);
    expect(inAppBrowser('Mozilla/5.0 (Linux; Android 14; SM-S928U) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0]')).toBe(true);
    expect(inAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0')).toBe(true);
  });
  it('leaves Chrome, Samsung Internet and Safari alone', () => {
    expect(inAppBrowser('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36')).toBe(false);
    expect(inAppBrowser('Mozilla/5.0 (Linux; Android 14; SM-S928U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36')).toBe(false);
    expect(inAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')).toBe(false);
  });
});
