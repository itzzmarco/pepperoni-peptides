import { useState } from 'react';
import type { DoseEntry, Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { configured, useAccount } from '../lib/account';
import { adherenceDays, freqText, regimenStatus } from '../lib/schedule';
import { firstReminder, googleLink, icsFile, rrule, timesPerDay, type Reminder } from '../lib/calendar';
import { download } from '../lib/download';
import { drugAmount, isVolumeUnit } from '../lib/doseMath';
import { checkRegimen } from '../lib/vial';
import { fmtDay, fmtNum } from '../lib/format';
import { glp1Overlap, usualMinutes } from '../lib/insights';
import { PEP } from '../data/peptides';
import { UNREGULATED_SOURCE } from '../data/options';
import { LegalChip, TierChip } from '../components/Chips';
import { useToast } from '../components/Toast';
import { NextShot } from '../components/NextShot';

export const regName = (r: Pick<Regimen, 'compoundId' | 'name'>) => PEP[r.compoundId]?.name ?? (r.name || 'Unnamed');

export type Actions = {
  addRegimen: () => void;
  editRegimen: (r: Regimen) => void;
  logDose: (r: Regimen) => void;
  checkin: () => void;
  /** Opens sign-in. */
  signIn: () => void;
};

export function Strip({ rid, doses }: { rid: string; doses: DoseEntry[] }) {
  const days = adherenceDays(rid, doses);
  const count = days.filter(d => d.on).length;
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="strip" role="img" aria-label={`Doses logged on ${count} of the last 28 days`}>
        {days.map((d, i) => (
          <i key={d.date.getTime()} className={`pop${d.on ? ' on' : ''}${d.today ? ' today' : ''}`} style={{ ['--i' as string]: i }} title={`${fmtDay(d.date)}${d.on ? ': dose logged' : ''}`} />
        ))}
      </div>
      <div className="strip-legend"><span>4 weeks ago</span><span>Today</span></div>
    </div>
  );
}

/** The label-mandated warning when two different GLP-1 medicines are tracked at the same time. */
export function Glp1Alert({ regimens }: { regimens: Regimen[] }) {
  const hits = glp1Overlap(regimens);
  if (!hits.length) return null;
  const names = [...new Set(hits.map(regName))];
  return (
    <div className="alert caution" role="note">
      <b>{names.join(' and ')} are both GLP-1 medicines.</b>
      <span>The FDA labels for approved GLP-1 medicines don't recommend using one together with another GLP-1 medicine. If you're switching, pause the old one here. Ask your prescriber which one to continue.</span>
    </div>
  );
}

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Calendar reminders for one regimen: pick the time, then add it to Google Calendar or download an .ics. */
function Reminders({ r, doses }: { r: Regimen; doses: DoseEntry[] }) {
  const toast = useToast();
  const rule = rrule(r);
  const usual = usualMinutes(r.id, doses);
  const first = usual ?? 9 * 60;
  const [times, setTimes] = useState(() => (timesPerDay(r) === 2 ? [hhmm(first), hhmm(first + 12 * 60)] : [hhmm(first)]));
  if (!rule) {
    return (
      <div className="inset small" role="note">
        Calendar reminders need fixed days. Tap <b>Edit</b> and set <b>How often</b> to <b>Certain days</b> (for example Mon and Thu) to add them.
      </div>
    );
  }
  const due = regimenStatus(r, doses).due;
  const rem: Reminder = {
    title: `${regName(r)} · ${fmtNum(Number(r.dose), 3)} ${r.unit}`,
    url: `${window.location.origin}${window.location.pathname}#today`,
    rule,
    starts: times.map(t => firstReminder(r, due, t)),
    uid: r.id,
  };
  const label = (i: number) => (times.length > 1 ? (i === 0 ? 'First dose' : 'Second dose') : 'Remind me at');
  return (
    <div className="inset stack reminders" style={{ gap: 10 }}>
      <div className="row-wrap">
        {times.map((t, i) => (
          <label key={i} className="field" style={{ minWidth: 140 }}><span>{label(i)}</span>
            <input type="time" id={`rem-${r.id}-${i}`} value={t} onChange={e => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))} />
          </label>
        ))}
      </div>
      <div className="row-wrap">
        {times.map((_, i) => (
          <a key={i} className="btn sm" href={googleLink(rem, i)} target="_blank" rel="noopener">
            {times.length > 1 ? `Google Calendar (${i === 0 ? 'first' : 'second'})` : 'Google Calendar'}
          </a>
        ))}
        <button type="button" className="btn ghost sm" onClick={() => {
          download(`${regName(r).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-reminders.ics`, icsFile(rem), 'text/calendar');
          toast('Calendar file saved. Open it to add the reminders.');
        }}>Apple or other calendar</button>
      </div>
      <p className="xsmall muted">
        Starts {rem.starts[0].toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, then {freqText(r).toLowerCase()}. Your calendar sends the reminder, with the peptide's name and dose. If you change the schedule here, add it again and delete the old one.
      </p>
    </div>
  );
}

function RegimenCard({ r, doses, actions, example, i = 0 }: { r: Regimen; doses: DoseEntry[]; actions?: Actions; example?: boolean; i?: number }) {
  const toast = useToast();
  const [remind, setRemind] = useState(false);
  const p = PEP[r.compoundId];
  const st = example ? { s: 'due', text: 'Due today' } : regimenStatus(r, doses);
  const { math, checks } = checkRegimen(r);
  return (
    <article className={`tile regimen rise${r.paused ? ' paused' : ''}${example ? ' example' : ''}`} style={{ ['--i' as string]: i + 2 }} aria-hidden={example || undefined}>
      <div className="top">
        <div className="stack" style={{ gap: 4 }}>
          <h3>{regName(r)}</h3>
          <div className="dose">{fmtNum(Number(r.dose), 3)} {r.unit} · {freqText(r)} · {r.route}</div>
        </div>
        <span className="due" data-s={st.s}>{st.text}</span>
      </div>
      {math && (
        <div className="inset small" style={{ background: 'var(--lilac)' }}>
          {isVolumeUnit(r.unit)
            ? <>Each dose is about <b className="mono">{drugAmount(math.doseMg, p?.defaultUnit)}</b> ({fmtNum(Number(r.vialMg))} mg in {fmtNum(Number(r.diluentMl))} mL). Confirm with your pharmacist.</>
            : <>Draw <b className="mono">{fmtNum(math.units, 1)} units</b> on a U-100 syringe ({fmtNum(Number(r.vialMg))} mg vial + {fmtNum(Number(r.diluentMl))} mL). Confirm with your pharmacist.</>}
        </div>
      )}
      {checks.length > 0 && (
        <div className="alert danger"><b>The dose and vial numbers don't add up.</b><span>{checks[0].title} Tap Edit to check them.</span></div>
      )}
      {!example && <NextShot r={r} doses={doses} />}
      {p && <div className="row-wrap"><TierChip t={p.tier} /><LegalChip k={p.legal} /></div>}
      {r.prescriber && <div className="small muted">Prescribed by {r.prescriber}</div>}
      {r.source === UNREGULATED_SOURCE && (
        <div className="alert warn"><b>Unregulated source.</b><span>Products sold online as "research use only" aren't checked for identity, dose, sterility, or endotoxin. See Safety for testing data.</span></div>
      )}
      <Strip rid={r.id} doses={example ? [] : doses} />
      {remind && !example && <Reminders r={r} doses={doses} />}
      {!example && actions && (
        <div className="row-wrap">
          {!r.paused && <button className="btn sm" onClick={() => actions.logDose(r)}>Log dose</button>}
          <button className="btn ghost sm" onClick={() => actions.editRegimen(r)}>Edit</button>
          {!r.paused && r.freq !== 'prn' && <button className="btn quiet sm" aria-expanded={remind} onClick={() => setRemind(!remind)}>Reminders</button>}
          <button className="btn quiet sm" onClick={() => { store.saveRegimen({ ...r, paused: !r.paused }); toast(r.paused ? 'Resumed.' : 'Paused. Your history is kept.'); }}>
            {r.paused ? 'Resume' : 'Pause'}
          </button>
          {p && <a className="btn quiet sm" href={`#${p.id}`}>About {p.name}</a>}
        </div>
      )}
    </article>
  );
}

const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

export function PeptidesView(actions: Actions) {
  const { regimens, doses } = useLedger();
  const signedIn = !!useAccount().user;
  const [introHidden, setIntroHidden] = useState(() => lsGet('pl-intro-hidden') === '1');
  const active = regimens.filter(r => !r.paused);
  const paused = regimens.filter(r => r.paused);
  const due = active.filter(r => ['due', 'late'].includes(regimenStatus(r, doses).s)).length;
  const example: Regimen = { id: 'example', compoundId: 'tirzepatide', name: '', dose: '2.5', unit: 'mg', freq: 'weekly', everyDays: '', route: 'Subcutaneous injection', prescriber: 'your clinician', source: '', start: '', vialMg: '', diluentMl: '', notes: '' };

  return (
    <section className="view">
      <header className="head rise">
        <span className="eyebrow">Your peptides</span>
        <h1>
          {regimens.length ? <>{active.length} being tracked.<br /><span className="soft">{due ? `${due} due today.` : 'Nothing due today.'}</span></> : <>Nothing tracked yet.<br /><span className="soft">Add what you were prescribed.</span></>}
        </h1>
      </header>
      <div className="head-actions rise" style={{ ['--i' as string]: 1 }}>
        <button className="btn" onClick={actions.addRegimen}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Add a peptide
        </button>
        <a className="btn ghost" href="#learn">Browse the library</a>
      </div>

      <Glp1Alert regimens={regimens} />

      {!(introHidden && regimens.length) && (
        <section className="tile lemon rise" aria-label="About this log" style={{ ['--i' as string]: 2 }}>
          <div className="spread">
            <h3>Before you start</h3>
            {regimens.length > 0 && <button className="btn quiet sm" onClick={() => { lsSet('pl-intro-hidden', '1'); setIntroHidden(true); }}>Hide</button>}
          </div>
          <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            <li>This is a journal for doses and symptoms, built to share with your clinician. It never suggests a dose; enter the one you were prescribed.</li>
            <li>{signedIn
              ? 'Your log syncs to your account, so it follows you to any device you sign in on. Only you can see it. Use Export on Trends to keep a copy.'
              : configured
                ? "Signed out, everything you enter stays in this browser on this device. Sign in (top right) to sync it across your devices; each account is private to the person who made it. Use Export on Trends to keep a copy."
                : "Everything you enter stays in this browser on this device. There's no account and no server. Use Export on Trends to keep a copy."}</li>
            <li>Most peptides promoted online are unapproved, and products sold as "research use only" aren't tested for what's in the vial. Check the library before you log something new.</li>
            <li>If you feel seriously unwell, stop and get help. The daily check-in flags emergency symptoms.</li>
          </ul>
        </section>
      )}

      {regimens.length === 0 ? (
        <>
          <div className="empty">
            <h3>Nothing tracked yet</h3>
            <p className="muted small">Add a peptide or medication you've been prescribed. You'll get a due-date status, a 4-week history strip, and injection-site rotation.</p>
            <button className="btn" onClick={actions.addRegimen}>Add a peptide</button>
          </div>
          <RegimenCard r={example} doses={[]} example />
        </>
      ) : (
        <>
          {active.map((r, i) => <RegimenCard key={r.id} r={r} doses={doses} actions={actions} i={i} />)}
          {paused.length > 0 && (
            <details className="tile">
              <summary className="spread"><b>Paused ({paused.length})</b><span className="chev" aria-hidden="true">›</span></summary>
              <div className="stack">{paused.map(r => <RegimenCard key={r.id} r={r} doses={doses} actions={actions} />)}</div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
