import type { Regimen } from './types';
import { weekdaysOf } from './schedule';

/**
 * Reminders through the person's own calendar: a repeating event for a regimen's schedule,
 * as a Google Calendar link or an .ics file (Apple Calendar, Outlook and most others).
 * The calendar sends the reminders, so they work with the app closed and need no server.
 */

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** How the schedule repeats, as an iCalendar RRULE. Null when it has no fixed pattern a calendar can follow. */
export function rrule(r: Pick<Regimen, 'freq' | 'everyDays' | 'weekdays'>): string | null {
  switch (r.freq) {
    case 'daily':
    case 'bid': return 'FREQ=DAILY';
    case 'eod': return 'FREQ=DAILY;INTERVAL=2';
    case 'weekly': return 'FREQ=WEEKLY';
    case 'biweekly': return 'FREQ=WEEKLY;INTERVAL=2';
    // The app counts "once a month" as every 30 days, so the calendar does too.
    case 'monthly': return 'FREQ=DAILY;INTERVAL=30';
    case 'custom': {
      const n = Number(r.everyDays);
      return Number.isInteger(n) && n >= 1 ? (n === 1 ? 'FREQ=DAILY' : `FREQ=DAILY;INTERVAL=${n}`) : null;
    }
    case 'days': {
      const days = weekdaysOf(r);
      return days.length ? `FREQ=WEEKLY;BYDAY=${days.map(d => BYDAY[d]).join(',')}` : null;
    }
    default: return null; // twice or 3 times a week with no set days, and as needed
  }
}

/** How many reminders a day the schedule needs: two for twice a day. */
export const timesPerDay = (r: Pick<Regimen, 'freq'>) => (r.freq === 'bid' ? 2 : 1);

/** The first reminder: on the next due day at `time` (HH:MM), never in the past. Set weekdays start on the next chosen day. */
export function firstReminder(r: Pick<Regimen, 'freq' | 'weekdays'>, nextDue: Date | undefined, time: string, now = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  const at = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h || 0, m || 0);
  let d = at(nextDue && nextDue > now ? nextDue : now);
  if (d < now) d = at(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  if (r.freq === 'days') {
    const days = weekdaysOf(r);
    for (let i = 0; i < 7 && days.length && !days.includes(d.getDay()); i++) d = at(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  }
  return d;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** A floating local time (no time zone), so the event stays at that clock time wherever the person is. */
const stamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const later = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);
/** Escapes text for an iCalendar property value. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Lines longer than 75 octets are folded, as the iCalendar format requires. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 75) { out.push(cur); cur = ' ' + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n');
}

export interface Reminder {
  /** What the event is called, for example "Tirzepatide · 50 units (syringe)". */
  title: string;
  /** Where to log it. */
  url: string;
  rule: string;
  /** One start per reminder a day (two for twice a day), the first occurrence of each. */
  starts: Date[];
  uid: string;
}

/** An .ics file with one repeating event per daily reminder, each alerting at its start time. */
export function icsFile(rem: Reminder, now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Peptide Ledger//Reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  rem.starts.forEach((start, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${rem.uid}-${i + 1}@peptide-ledger`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(later(start, 15))}`,
      `RRULE:${rem.rule}`,
      `SUMMARY:${esc(rem.title)}`,
      `DESCRIPTION:${esc(`Log it in Peptide Ledger: ${rem.url}`)}`,
      `URL:${rem.url}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(rem.title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** A link that opens Google Calendar with the repeating event filled in, for one of the day's reminders. */
export function googleLink(rem: Reminder, i = 0): string {
  const start = rem.starts[i];
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: rem.title,
    dates: `${stamp(start)}/${stamp(later(start, 15))}`,
    recur: `RRULE:${rem.rule}`,
    details: `Log it in Peptide Ledger: ${rem.url}`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
