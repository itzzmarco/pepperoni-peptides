import { describe, expect, it } from 'vitest';
import { firstReminder, googleLink, icsFile, rrule, timesPerDay, type Reminder } from '../calendar';

const sched = (freq: string, over: { everyDays?: string; weekdays?: number[] } = {}) => ({ freq, everyDays: '', ...over });

describe('rrule', () => {
  it('turns each fixed schedule into a calendar rule', () => {
    expect(rrule(sched('daily'))).toBe('FREQ=DAILY');
    expect(rrule(sched('bid'))).toBe('FREQ=DAILY');
    expect(rrule(sched('eod'))).toBe('FREQ=DAILY;INTERVAL=2');
    expect(rrule(sched('weekly'))).toBe('FREQ=WEEKLY');
    expect(rrule(sched('biweekly'))).toBe('FREQ=WEEKLY;INTERVAL=2');
    expect(rrule(sched('monthly'))).toBe('FREQ=DAILY;INTERVAL=30');
    expect(rrule(sched('custom', { everyDays: '10' }))).toBe('FREQ=DAILY;INTERVAL=10');
    expect(rrule(sched('days', { weekdays: [5, 1, 3] }))).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR');
    expect(rrule(sched('days', { weekdays: [0, 6] }))).toBe('FREQ=WEEKLY;BYDAY=SA,SU');
  });

  it('has no rule for schedules without fixed days', () => {
    for (const f of ['2w', '3w', 'prn']) expect(rrule(sched(f))).toBeNull();
    expect(rrule(sched('custom', { everyDays: '2.5' }))).toBeNull();
    expect(rrule(sched('days', { weekdays: [] }))).toBeNull();
  });

  it('needs two reminders a day only for twice a day', () => {
    expect(timesPerDay({ freq: 'bid' })).toBe(2);
    expect(timesPerDay({ freq: 'weekly' })).toBe(1);
  });
});

describe('firstReminder', () => {
  const now = new Date(2026, 10, 1, 20, 0); // Sun Nov 1, 8 pm
  it('starts on the next due day at the chosen time', () => {
    const d = firstReminder({ freq: 'weekly' }, new Date(2026, 10, 6, 18, 30), '19:15', now);
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([6, 19, 15]);
  });
  it('never starts in the past', () => {
    const d = firstReminder({ freq: 'daily' }, new Date(2026, 9, 30), '09:00', now);
    expect([d.getMonth(), d.getDate(), d.getHours()]).toEqual([10, 2, 9]);
    const today = firstReminder({ freq: 'daily' }, undefined, '21:00', now);
    expect([today.getDate(), today.getHours()]).toEqual([1, 21]);
  });
  it('starts set weekdays on a chosen day', () => {
    const d = firstReminder({ freq: 'days', weekdays: [3] }, undefined, '08:00', now);
    expect([d.getDay(), d.getDate()]).toEqual([3, 4]);
  });
});

describe('calendar files and links', () => {
  const rem: Reminder = {
    title: 'Tirzepatide · 50 units (syringe)',
    url: 'https://pepperoni-peptides.vercel.app/#today',
    rule: 'FREQ=WEEKLY',
    starts: [new Date(2026, 10, 6, 19, 0)],
    uid: 'r1',
  };

  it('writes a valid repeating event with an alert', () => {
    const ics = icsFile(rem, new Date(Date.UTC(2026, 10, 1, 12)));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20261106T190000\r\n');
    expect(ics).toContain('DTEND:20261106T191500\r\n');
    expect(ics).toContain('RRULE:FREQ=WEEKLY\r\n');
    expect(ics).toContain('DTSTAMP:20261101T120000Z\r\n');
    expect(ics).toContain('UID:r1-1@peptide-ledger');
    expect(ics).toContain('TRIGGER:PT0M');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    // Every line fits 75 octets; longer ones are folded with a leading space.
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(ics.replace(/\r\n /g, '')).toContain('DESCRIPTION:Log it in Peptide Ledger: https://pepperoni-peptides.vercel.app/#today');
  });

  it('escapes commas and semicolons', () => {
    expect(icsFile({ ...rem, title: 'A, B; C' })).toContain('SUMMARY:A\\, B\\; C');
  });

  it('writes one event per daily reminder', () => {
    const ics = icsFile({ ...rem, rule: 'FREQ=DAILY', starts: [new Date(2026, 10, 2, 8), new Date(2026, 10, 2, 20)] });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('UID:r1-2@peptide-ledger');
  });

  it('builds a Google Calendar link with the repeat rule', () => {
    const u = new URL(googleLink(rem));
    expect(u.origin + u.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(u.searchParams.get('action')).toBe('TEMPLATE');
    expect(u.searchParams.get('dates')).toBe('20261106T190000/20261106T191500');
    expect(u.searchParams.get('recur')).toBe('RRULE:FREQ=WEEKLY');
    expect(u.searchParams.get('text')).toBe('Tirzepatide · 50 units (syringe)');
  });
});
