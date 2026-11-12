import { useRef, useState } from 'react';
import type { DoseEntry, Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { upcoming, type RegimenStatus } from '../lib/schedule';
import { tideOf } from '../lib/tide';
import { drugAmount, isVolumeUnit } from '../lib/doseMath';
import { checkRegimen } from '../lib/vial';
import { DAY, dayKey, daysBetween, fmtDay, fmtNum, fmtShort, fmtTime, newId, startOfDay } from '../lib/format';
import { adherence, doseDays, topEffects, usualMinutes } from '../lib/insights';
import { nextSite, siteLabel, type NextSite } from '../lib/sites';
import { PEP } from '../data/peptides';
import { TIERS } from '../data/reference';
import { INJECTABLE } from '../data/options';
import { configured, useAccount } from '../lib/account';
import { firstName, usePartners, weightChange } from '../lib/partner';
import { DeviceLogPrompt } from '../sheets/AccountSheet';
import { SiteFigure, doseText, whenNext } from '../components/NextShot';
import { useCountUp } from '../components/Motion';
import { Kinetic, Mast } from '../components/Mast';
import { Steps, Swell, WeekGrid } from '../components/Tidal';
import { useToast } from '../components/Toast';
import { Glp1Alert, regName, type Actions } from './PeptidesView';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const rise = (i: number) => ({ ['--i' as string]: i });

/** Today's doses on a 6 AM to midnight track: filled dots are logged, rings are still due (at the usual time). */
function DayBar({ done, todo, now }: { done: Date[]; todo: Date[]; now: Date }) {
  const A = 6 * 60, B = 24 * 60;
  const pos = (d: Date) => Math.min(100, Math.max(0, ((d.getHours() * 60 + d.getMinutes() - A) / (B - A)) * 100));
  const nowPct = pos(now);
  const marks = [...done.map(d => ({ d, done: true })), ...todo.map(d => ({ d, done: false }))].sort((a, b) => a.d.getTime() - b.d.getTime());
  let lastLabel = -100;
  const label = (p: number) => { const ok = p - lastLabel > 16; if (ok) lastLabel = p; return ok; };
  const desc = [...done.map(d => `logged at ${fmtTime(d)}`), ...todo.map(d => `due around ${fmtTime(d)}`)].join(', ');
  return (
    <div className="daybar" role="img" aria-label={`Today: ${desc}. It's ${fmtTime(now)}.`}>
      <div className="track" />
      <div className="fill grow" style={{ width: `${nowPct}%` }} />
      {nowPct > 0 && nowPct < 100 && <div className="now pop" style={{ left: `${nowPct}%`, ...rise(8) }}><span>Now</span></div>}
      {marks.map((m, i) => (
        <span key={i}>
          <span className={`mark pop ${m.done ? 'done' : 'todo'}`} style={{ left: `${pos(m.d)}%`, ...rise(4 + i) }}>
            {m.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
          </span>
          {label(pos(m.d)) && <span className="t" style={{ left: `${pos(m.d)}%`, color: m.done ? undefined : 'var(--on-dark)', fontWeight: m.done ? 400 : 600 }}>{fmtTime(m.d)}</span>}
        </span>
      ))}
      <span className="t end">12 AM</span>
    </div>
  );
}

/** `logged` is this regimen's dose that was just logged with one tap: the button then offers to undo it or open it in the form. */
function NextUp({ r, st, actions, doneToday, dueToday, todo, done, now, site, onLog, logged, onUndo }: {
  r: Regimen; st: RegimenStatus; actions: Actions; doneToday: number; dueToday: number; todo: Date[]; done: Date[]; now: Date; site: NextSite | null;
  onLog: () => void; logged?: DoseEntry; onUndo: () => void;
}) {
  const { math, checks } = checkRegimen(r);
  const usual = todo[0];
  const total = doneToday + dueToday;
  return (
    <section className="nextup rise" aria-label="Next dose" style={rise(3)}>
      <div className="spread">
        <span className="label">Next up</span>
        <span className="sub num">{st.text}</span>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span className="name">{regName(r)} <span>{fmtNum(Number(r.dose), 3)} {r.unit}</span></span>
        <span className="sub" style={{ fontSize: '.9375rem' }}>
          {[usual && st.s !== 'ok' ? `Usually around ${fmtTime(usual)}` : '', math ? (isVolumeUnit(r.unit) ? `about ${drugAmount(math.doseMg, PEP[r.compoundId]?.defaultUnit)}` : `draw ${fmtNum(math.units, 1)} units`) : checks.length ? 'check the vial details' : '', site ? siteLabel(site.site, r.route) : r.route].filter(Boolean).join(' · ')}
        </span>
      </div>
      {(done.length > 0 || todo.length > 0) && <DayBar done={done} todo={todo} now={now} />}
      <div className="spread" style={{ alignItems: 'center' }}>
        {logged ? (
          <span className="row-wrap">
            <span className="logged">
              <button className="btn" onClick={onUndo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                Logged. Tap to undo
              </button>
            </span>
            <button className="btn glass" onClick={() => actions.editDose(r, logged)}>Edit</button>
          </span>
        ) : (
          <button className="btn" onClick={onLog}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Log now
          </button>
        )}
        {total > 0 && !logged && (
          <span className="stack" style={{ gap: 6, justifyItems: 'end' }}>
            <span className="progress" aria-hidden="true">{Array.from({ length: Math.min(total, 6) }, (_, i) => <i key={i} className={i < doneToday ? 'on' : ''} />)}</span>
            <span className="sub">{doneToday} of {total} today</span>
          </span>
        )}
      </div>
    </section>
  );
}

export function TodayView(actions: Actions) {
  const { regimens, doses, checkins } = useLedger();
  const toast = useToast();
  // The dose just logged with one tap, while it is still in the log.
  const [quickId, setQuickId] = useState<string | null>(null);
  const quick = quickId ? doses.find(d => d.id === quickId) : undefined;
  /**
   * One tap logs the planned dose, at the spot the card shows, when it is due and its numbers add up.
   * A dose that isn't due yet, or whose vial details don't add up, goes through the form instead.
   */
  const logNow = (r: Regimen, st: RegimenStatus, site: NextSite | null) => {
    if ((st.s !== 'due' && st.s !== 'late') || !(Number(r.dose) > 0) || checkRegimen(r).checks.length) return actions.logDose(r);
    const id = newId(), at = new Date();
    store.addDose({ id, rid: r.id, name: regName(r), at: at.toISOString(), amount: r.dose, unit: r.unit, route: r.route, site: INJECTABLE.has(r.route) ? site?.site ?? '' : '', notes: '' });
    setQuickId(id);
    toast(`Logged ${regName(r)} at ${fmtTime(at)}.`);
  };
  const undo = () => {
    if (quickId) store.deleteDose(quickId);
    setQuickId(null);
    toast('Dose removed.');
  };
  const acct = useAccount();
  const signedIn = !!acct.user;
  const seenHere = acct.seenHere;
  const now = new Date();
  const today = dayKey(now);
  const list = upcoming(regimens, doses, now);
  const next = list[0];
  const late = list.filter(x => x.st.s === 'late').length;
  const dueNow = list.filter(x => x.st.s === 'due');
  const loggedToday = doses.filter(d => dayKey(new Date(d.at)) === today);
  const usualToday = (r: Regimen) => {
    const m = usualMinutes(r.id, doses);
    return m == null ? null : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, m);
  };
  const todo = [...list.filter(x => x.st.s === 'due' || x.st.s === 'late').map(x => usualToday(x.r))].filter((d): d is Date => !!d && dayKey(d) === today);
  const done = loggedToday.map(d => new Date(d.at));

  const adh = adherence(regimens, doses, now);
  const pct = useCountUp(adh.pct == null ? 0 : Math.round(adh.pct * 100));
  // The last 28 days, oldest first: four rows of a week each in the field.
  const logged = doseDays(doses);
  const chain = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 27 + i);
    return { d, on: logged.has(dayKey(d)), today: i === 27 };
  });
  const chainOn = chain.filter(c => c.on).length;
  // The same four weeks in the adherence cell, oldest first: did every expected dose go in? Past weeks run to the end of their last day.
  const fullWeeks = [3, 2, 1, 0].map(k => {
    const a = adherence(regimens, doses, k ? new Date(startOfDay(now).getTime() - (k * 7 - 1) * DAY - 1) : now, 7);
    return a.expected > 0 && a.logged >= a.expected;
  });
  const nFull = fullWeeks.filter(Boolean).length;

  // The tide: high on a day a dose went in, otherwise as far out as the next dose is close. A dose logged while this screen is open sends a wave down it.
  const lastToday = loggedToday[0];
  const opened = useRef(loggedToday.length);
  const tide = lastToday ? { day: 0, of: 1, ebb: 0 } : next ? tideOf(next.r, next.st, now) : null;
  const dueDay = next?.st.due && (daysBetween(now, next.st.due) === 1 ? 'tomorrow' : next.st.due.toLocaleDateString(undefined, { weekday: 'long' }));

  const weights = checkins.filter(c => c.weight && new Date(c.at).getTime() >= now.getTime() - 90 * DAY).slice().reverse();
  const wNow = weights[weights.length - 1], wFirst = weights[0];
  const wShown = useCountUp(wNow?.weight ?? 0, wFirst?.weight ?? 0, 1100);
  const wChange = wNow && wFirst && wNow !== wFirst ? wNow.weight! - wFirst.weight! : null;
  const wMin = Math.min(...weights.map(w => w.weight!)), wMax = Math.max(...weights.map(w => w.weight!));
  const spark = weights.slice(-12).map((w, i, a) => `${(i / Math.max(1, a.length - 1)) * 120},${4 + (1 - (w.weight! - wMin) / Math.max(0.1, wMax - wMin)) * 20}`).join(' ');

  const effects = topEffects(checkins, startOfDay(now).getTime() - 6 * DAY);
  const checkedIn = checkins.find(c => dayKey(new Date(c.at)) === today);
  const lastFlag = checkins.find(c => c.flags.length && Date.now() - new Date(c.at).getTime() < 2 * DAY);

  // Each injected peptide's next spot in its own rotation (belly clock or body map), soonest due first.
  const shots = list.flatMap(x => { const s = nextSite(x.r, doses); return s ? [{ r: x.r, s }] : []; }).slice(0, 3);
  const comingUp = list.find(x => x !== next && x.st.s === 'ok');
  const learnP = next ? PEP[next.r.compoundId] : undefined;

  // A linked partner's latest weight and next shot, view only.
  const { partners, logs } = usePartners();
  const partner = partners[0];
  const pLog = partner ? logs[partner.id] : undefined;
  const pUnit = wNow?.weightUnit ?? pLog?.checkins.find(c => c.weightUnit)?.weightUnit ?? 'lb';
  const pW = pLog ? weightChange(pLog.checkins, pUnit, now.getTime() - 90 * DAY) : null;
  const pNext = pLog ? upcoming(pLog.regimens, pLog.doses, now)[0] : undefined;

  const hour = now.getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  let line1: string, line2: string;
  const hasLog = regimens.length > 0 || doses.length > 0 || checkins.length > 0;
  // Signed out on a site with accounts, an empty log usually means "sign in", not "start over".
  const offerSignIn = configured && !signedIn && !regimens.length;
  // A first visit: nothing logged, and no account's log waiting behind a sign-in.
  const firstRun = !hasLog && !(offerSignIn && seenHere);
  if (!regimens.length && offerSignIn && seenHere) { line1 = "You're signed out."; line2 = 'Sign in to see your log.'; }
  else if (!regimens.length) { line1 = hasLog ? 'Nothing to take yet.' : 'Welcome.'; line2 = 'Add what you were prescribed to start.'; }
  else if (late) { line1 = `${plural(late, 'dose')} overdue.`; line2 = 'Log it when you take it.'; }
  else if (dueNow.length) { line1 = adh.pct == null || adh.pct >= 0.8 ? "You're on track." : "Here's today."; line2 = `${plural(dueNow.length, 'dose')} left today.`; }
  else { line1 = "You're all set today."; line2 = next?.st.due ? `Next: ${regName(next.r)}, ${fmtShort(next.st.due)}.` : 'Nothing scheduled.'; }

  return (
    <section className="view">
      <Mast tide={{ ebb: tide?.ebb, surge: Math.max(0, loggedToday.length - opened.current) }}>
        <p className="when rise"><b>{fmtDay(now)}</b><span>{hello}</span></p>
        <Kinetic a={line1} b={line2} />

        {lastFlag && (
          <div className="alert danger" role="alert">
            <b>You reported an emergency symptom on {fmtDay(new Date(lastFlag.at))}.</b>
            <span>{lastFlag.flags.join('; ')}. If it's still happening, call 911 or go to an emergency room. For a possible poisoning or overdose, call Poison Control at 1-800-222-1222.</span>
          </div>
        )}

        {next ? (
          <NextUp r={next.r} st={next.st} actions={actions} now={now} done={done} todo={todo} site={shots.find(x => x.r === next.r)?.s ?? null}
            onLog={() => logNow(next.r, next.st, shots.find(x => x.r === next.r)?.s ?? null)} logged={quick?.rid === next.r.id ? quick : undefined} onUndo={undo}
            doneToday={loggedToday.length} dueToday={list.filter(x => x.st.s === 'due' || x.st.s === 'late').length} />
        ) : offerSignIn && seenHere ? (
          <section className="nextup rise" style={rise(3)}>
            <span className="lead">Sign in and your peptides, shots and weights come back.</span>
            <span className="sub">Your log is saved in your account. Anything added while signed out stays on this device only, so sign in before you log.</span>
            <div className="row-wrap">
              <button className="btn" onClick={actions.signIn}>Sign in</button>
              <button className="btn glass" onClick={actions.addRegimen}>Add a peptide anyway</button>
            </div>
          </section>
        ) : (
          <section className="nextup rise" style={rise(3)}>
            <span className="lead">Track a peptide or medication your clinician prescribed.</span>
            <span className="sub">You'll see what's due, how consistent you've been, and where to inject next. {signedIn ? 'It syncs to your account, and only you can see it.' : 'Nothing leaves this device.'}</span>
            <div className="row-wrap">
              <button className="btn" onClick={actions.addRegimen}>Add a peptide</button>
              {offerSignIn && <button className="btn glass" onClick={actions.signIn}>I have an account</button>}
            </div>
          </section>
        )}

        {firstRun ? (
          <div className="rise" style={rise(4)}><Steps steps={['Add a peptide', 'Log each dose', 'Watch the tide']} /></div>
        ) : (
          <div className="rise" style={rise(4)}>
            <WeekGrid days={chain} label={`Last 4 weeks, one row per week: a dose was logged on ${chainOn} of 28 days`} />
            <p className="strand-ends">
              <span>Each row is a week, ending today. Filled means a dose was logged.</span>
              <span className="num">{chainOn} of 28</span>
            </p>
          </div>
        )}
      </Mast>

      {tide && next && (
        <p className="tide-note">
          {lastToday ? <><b>High tide.</b> Dose logged {now.getTime() - new Date(lastToday.at).getTime() < 2 * 6e4 ? 'just now' : `at ${fmtTime(new Date(lastToday.at))}`}.{quick && quick.rid !== next.r.id && <> <button type="button" className="linkish" onClick={undo}>Undo</button></>}</>
            : next.st.s === 'late' ? <><b>Low tide.</b> {regName(next.r)} was due {next.st.due ? fmtDay(next.st.due) : 'earlier'}.</>
            : next.st.s === 'due' ? <><b>{tide.of > 1 ? `Day ${tide.day} of ${tide.of}.` : 'Low tide.'}</b> Today's dose brings the tide back in.</>
            : <><b>Day {tide.day} of {tide.of}.</b> The tide ebbs until {dueDay ? `${dueDay}'s` : 'the next'} dose.</>}
        </p>
      )}

      {!store.persistent && (
        <div className="alert warn"><b>This browser isn't saving your log.</b><span>Private browsing or blocked site storage stops saving. Entries will disappear when you close the tab, so export before you leave.</span></div>
      )}
      <DeviceLogPrompt onToday />
      <Glp1Alert regimens={regimens} />

      {firstRun && (
        <div className="bento">
          <a href="#learn" className="tile lemon go span-2 rise" style={rise(5)}>
            <span className="stack" style={{ gap: 6, flex: 1 }}>
              <span className="label">Library</span>
              <span className="lead">What the evidence says about {Object.keys(PEP).length} peptides</span>
            </span>
            <span className="arrow" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
          </a>
          <a href="#calculator" className="tile lilac rise" style={{ ...rise(6), gap: 6 }}>
            <span className="label">Dose math</span>
            <span className="lead">Vial, water and syringe units</span>
            <span className="sub">Step by step</span>
          </a>
          <a href="#safety" className="tile peach rise" style={{ ...rise(7), gap: 6 }}>
            <span className="label">Safety &amp; law</span>
            <span className="lead">Warning signs to know</span>
            <span className="sub">And where US rules stand</span>
          </a>
        </div>
      )}

      {hasLog && (
        <div className="bento">
          <a href="#trends" className="tile mint row-2 afloat rise" style={rise(5)}>
            <span className="label">Adherence</span>
            <span className="big">{adh.pct == null ? '–' : `${Math.round(pct)}%`}</span>
            <span className="sub">{adh.expected ? `${adh.logged} of ${adh.expected} doses in 4 weeks` : 'Log a few doses to see this.'}</span>
            <Swell weeks={fullWeeks} label={nFull === 4 ? 'Last 4 weeks: every expected dose was logged' : `Last 4 weeks: every expected dose was logged in ${nFull} of them`} />
          </a>

          <a href="#trends" className="tile lilac rise" style={{ ...rise(6), gap: 6 }}>
            <span className="label">Weight</span>
            {wNow ? (
              <>
                <span className="mid">{wShown.toFixed(1)}<small> {wNow.weightUnit}</small></span>
                {weights.length > 1 && <svg className="spark" viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true"><polygon points={`0,28 ${spark} 120,28`} /><polyline className="draw" pathLength={1} points={spark} /></svg>}
                <span className="sub">{wChange != null ? `${wChange > 0 ? '+' : '−'}${Math.abs(wChange).toFixed(1)} since ${fmtShort(new Date(wFirst.at))}` : 'Add more check-ins for a trend.'}</span>
              </>
            ) : <span className="sub">Add your weight in a daily check-in.</span>}
          </a>

          <a href="#trends" className="tile peach rise" style={{ ...rise(7), gap: 6 }}>
            <span className="label">Side effects</span>
            {effects.length ? (
              <>
                <span className="lead">{effects[0][0]}</span>
                <span className="sub">{plural(effects[0][1], 'day')} this week{effects.length > 1 ? `, plus ${effects.length - 1} more` : ''}</span>
              </>
            ) : <span className="sub">None logged this week.</span>}
          </a>

          {partner && (
            <a href="#partner" className="tile span-2 partner-tile rise" style={rise(8)}>
              <span className="avatar" aria-hidden="true">{firstName(partner.name)[0]}</span>
              <span className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span className="label" style={{ color: 'var(--peach-ink)' }}>{firstName(partner.name)} · partner</span>
                <span style={{ fontSize: '1.3125rem', fontWeight: 600, lineHeight: 1.2 }}>
                  {pW ? <>{fmtNum(pW.last.w, 1)}<small className="sub"> {pUnit}</small>{pW.count > 1 && <span className="sub"> · {pW.change > 0 ? '+' : pW.change < 0 ? '−' : ''}{Math.abs(pW.change).toFixed(1)} since {fmtShort(pW.first.at)}</span>}</> : 'No weigh-ins yet'}
                </span>
                {pNext && <span className="sub">{regName(pNext.r)} · {pNext.st.text}</span>}
              </span>
              <span className="arrow" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
            </a>
          )}

          {shots.map(({ r, s: sug }, i) => (
            <button key={r.id} type="button" className="tile sky span-2 rise" style={{ ...rise(8 + i), border: 0, textAlign: 'left', font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} onClick={() => actions.logDose(r)}
              aria-label={`Next shot of ${regName(r)}: ${siteLabel(sug.site, r.route)}, ${whenNext(r, doses, now)}. Log it.`}>
              <SiteFigure s={sug} size={76} />
              <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                <span className="label">Next shot · {regName(r)}</span>
                <span className="lead">{siteLabel(sug.site, r.route)}</span>
                <span className="sub" style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{whenNext(r, doses, now)} · {doseText(r)}</span>
                <span className="sub">{sug.why}</span>
              </span>
            </button>
          ))}

          <button type="button" className="tile mint span-2 checkin rise" style={rise(9)} onClick={actions.checkin}>
            <span className="badge" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d={checkedIn ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'} /></svg>
            </span>
            <span className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
              <span className="label">Check-in</span>
              <span className="lead">{checkedIn ? 'Done today' : 'How do you feel?'}</span>
            </span>
            <span className="sub num">{checkedIn ? `${checkedIn.overall ? `Feeling ${checkedIn.overall}/5 · ` : ''}${fmtTime(new Date(checkedIn.at))}` : '30 seconds'}</span>
          </button>

          {comingUp?.st.due && (
            <a href="#peptides" className="tile sky rise" style={{ ...rise(10), gap: 6 }}>
              <span className="label">Coming up</span>
              <span className="lead">{regName(comingUp.r)}</span>
              <span className="sub">{fmtDay(comingUp.st.due)}, {fmtNum(Number(comingUp.r.dose), 3)} {comingUp.r.unit}</span>
            </a>
          )}

          <a href={learnP ? `#${learnP.id}` : '#calculator'} className={`tile lemon go rise ${comingUp?.st.due ? '' : 'span-2'}`} style={rise(11)}>
            <span className="stack" style={{ gap: 6, flex: 1 }}>
              <span className="label">{learnP ? `Evidence tier ${learnP.tier}, ${TIERS[learnP.tier].label.toLowerCase()}` : 'Guide'}</span>
              <span className="lead">{learnP ? `What the research says about ${learnP.name}` : 'Dose math, step by step'}</span>
            </span>
            <span className="arrow" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
          </a>
        </div>
      )}
    </section>
  );
}
