import type { Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { upcoming, type RegimenStatus } from '../lib/schedule';
import { doseMath } from '../lib/doseMath';
import { DAY, dayKey, fmtDay, fmtNum, fmtShort, fmtTime, startOfDay } from '../lib/format';
import { adherence, topEffects, usualMinutes } from '../lib/insights';
import { BELLY, SITE_LABEL, lastBellyHour, lastUsedBySite, nextBellyHour, suggestSite } from '../lib/sites';
import { INJECTABLE } from '../data/options';
import { PEP } from '../data/peptides';
import { TIERS } from '../data/reference';
import { MiniClock } from '../components/BellyClock';
import { useCountUp } from '../components/Motion';
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

function NextUp({ r, st, actions, doneToday, dueToday, todo, done, now }: {
  r: Regimen; st: RegimenStatus; actions: Actions; doneToday: number; dueToday: number; todo: Date[]; done: Date[]; now: Date;
}) {
  const math = doseMath(r.dose, r.unit, r.vialMg, r.diluentMl);
  const usual = todo[0];
  const total = doneToday + dueToday;
  return (
    <section className="tile dark rise" aria-label="Next dose" style={rise(2)}>
      <div className="spread">
        <span className="eyebrow">Next up</span>
        <span className="sub num">{st.text}</span>
      </div>
      <div className="stack" style={{ gap: 4 }}>
        <span style={{ fontSize: '1.625rem', fontWeight: 600, letterSpacing: '-.01em', lineHeight: 1.15 }}>{regName(r)} · {fmtNum(Number(r.dose), 3)} {r.unit}</span>
        <span className="sub" style={{ fontSize: '.9375rem' }}>
          {[usual && st.s !== 'ok' ? `Usually around ${fmtTime(usual)}` : '', math ? `draw ${fmtNum(math.units, 1)} units` : '', r.route].filter(Boolean).join(' · ')}
        </span>
      </div>
      {(done.length > 0 || todo.length > 0) && <DayBar done={done} todo={todo} now={now} />}
      <div className="spread" style={{ alignItems: 'center' }}>
        <button className="btn" onClick={() => actions.logDose(r)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Log now
        </button>
        {total > 0 && (
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
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
    return { d, on: doses.some(x => dayKey(new Date(x.at)) === dayKey(d)), today: i === 6 };
  });

  const weights = checkins.filter(c => c.weight && new Date(c.at).getTime() >= now.getTime() - 90 * DAY).slice().reverse();
  const wNow = weights[weights.length - 1], wFirst = weights[0];
  const wShown = useCountUp(wNow?.weight ?? 0, wFirst?.weight ?? 0, 1100);
  const wChange = wNow && wFirst && wNow !== wFirst ? wNow.weight! - wFirst.weight! : null;
  const wMin = Math.min(...weights.map(w => w.weight!)), wMax = Math.max(...weights.map(w => w.weight!));
  const spark = weights.slice(-12).map((w, i, a) => `${(i / Math.max(1, a.length - 1)) * 120},${4 + (1 - (w.weight! - wMin) / Math.max(0.1, wMax - wMin)) * 20}`).join(' ');

  const effects = topEffects(checkins, startOfDay(now).getTime() - 6 * DAY);
  const checkedIn = checkins.find(c => dayKey(new Date(c.at)) === today);
  const lastFlag = checkins.find(c => c.flags.length && Date.now() - new Date(c.at).getTime() < 2 * DAY);

  // Site suggestion for the next injectable dose: belly clock if this regimen has used it, else the least-used body site.
  const inj = list.find(x => INJECTABLE.has(x.r.route));
  const lastUsed = lastUsedBySite(doses);
  const bh = inj ? lastBellyHour(inj.r.id, doses) : null;
  const nextHour = bh ? nextBellyHour(bh, lastUsed) : null;
  const comingUp = list.find(x => x !== next && x.st.s === 'ok');
  const learnP = next ? PEP[next.r.compoundId] : undefined;

  const hour = now.getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  let line1: string, line2: string;
  if (!regimens.length) { line1 = 'Welcome.'; line2 = 'Add what you were prescribed to start.'; }
  else if (late) { line1 = `${plural(late, 'dose')} overdue.`; line2 = 'Log it when you take it.'; }
  else if (dueNow.length) { line1 = adh.pct == null || adh.pct >= 0.8 ? "You're on track." : "Here's today."; line2 = `${plural(dueNow.length, 'dose')} left today.`; }
  else { line1 = "You're all set today."; line2 = next?.st.due ? `Next: ${regName(next.r)}, ${fmtShort(next.st.due)}.` : 'Nothing scheduled.'; }

  return (
    <section className="view">
      <header className="head rise">
        <div className="spread" style={{ alignItems: 'center' }}>
          <span className="stack" style={{ gap: 2 }}>
            <span style={{ fontWeight: 500, color: 'var(--ink-3)' }}>{hello}</span>
            <span className="eyebrow">{fmtDay(now)}</span>
          </span>
        </div>
        <h1 className="rise" style={rise(1)}>{line1}<br /><span className="soft">{line2}</span></h1>
      </header>

      {lastFlag && (
        <div className="alert danger" role="alert">
          <b>You reported an emergency symptom on {fmtDay(new Date(lastFlag.at))}.</b>
          <span>{lastFlag.flags.join('; ')}. If it's still happening, call 911 or go to an emergency room. For a possible poisoning or overdose, call Poison Control at 1-800-222-1222.</span>
        </div>
      )}
      {!store.persistent && (
        <div className="alert warn"><b>This browser isn't saving your log.</b><span>Private browsing or blocked site storage stops saving. Entries will disappear when you close the tab, so export before you leave.</span></div>
      )}
      <Glp1Alert regimens={regimens} />

      {next ? (
        <NextUp r={next.r} st={next.st} actions={actions} now={now} done={done} todo={todo}
          doneToday={loggedToday.length} dueToday={list.filter(x => x.st.s === 'due' || x.st.s === 'late').length} />
      ) : (
        <section className="tile dark rise" style={rise(2)}>
          <span className="eyebrow">Start your log</span>
          <span style={{ fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.25 }}>Track a peptide or medication your clinician prescribed.</span>
          <span className="sub">You'll see what's due, how consistent you've been, and where to inject next. Nothing leaves this device.</span>
          <div><button className="btn" onClick={actions.addRegimen}>Add a peptide</button></div>
        </section>
      )}

      {regimens.length > 0 && (
        <div className="bento">
          <a href="#trends" className="tile mint row-2 rise" style={rise(3)}>
            <span className="label">Adherence</span>
            <span className="big">{adh.pct == null ? '–' : `${Math.round(pct)}%`}</span>
            <span className="sub" style={{ color: 'var(--mint-2)' }}>{adh.expected ? `${adh.logged} of ${adh.expected} doses · 4 weeks` : 'Log a few doses to see this.'}</span>
            <span className="dots7" role="img" aria-label={`Last 7 days: dose logged on ${week.filter(w => w.on).length}`}>
              {week.map((w, i) => <i key={i} className={`pop${w.on ? ' on' : ''}${w.today && !w.on ? ' today' : ''}`} style={rise(i)} title={fmtDay(w.d)} />)}
            </span>
          </a>

          <a href="#trends" className="tile lilac rise" style={{ ...rise(4), gap: 6 }}>
            <span className="label">Weight</span>
            {wNow ? (
              <>
                <span className="mid">{wShown.toFixed(1)}<small> {wNow.weightUnit}</small></span>
                {weights.length > 1 && <svg className="spark" viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true"><polyline className="draw" pathLength={1} points={spark} /></svg>}
                <span className="sub">{wChange != null ? `${wChange > 0 ? '+' : '−'}${Math.abs(wChange).toFixed(1)} since ${fmtShort(new Date(wFirst.at))}` : 'Add more check-ins for a trend.'}</span>
              </>
            ) : <span className="sub">Add your weight in a daily check-in.</span>}
          </a>

          <a href="#trends" className="tile peach rise" style={{ ...rise(5), gap: 6 }}>
            <span className="label">Side effects</span>
            {effects.length ? (
              <>
                <span style={{ fontSize: '1.3125rem', fontWeight: 600, lineHeight: 1.15 }}>{effects[0][0]}</span>
                <span className="sub">{plural(effects[0][1], 'day')} this week{effects.length > 1 ? `, plus ${effects.length - 1} more` : ''}</span>
              </>
            ) : <span className="sub">None logged this week.</span>}
          </a>

          {inj && (
            <button type="button" className="tile sky span-2 rise" style={{ ...rise(6), border: 0, textAlign: 'left', font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} onClick={() => actions.logDose(inj.r)}>
              {nextHour ? <MiniClock hour={nextHour} /> : (
                <span className="badge-icon" style={{ background: 'var(--surface)', color: 'var(--sky-ink)' }} aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.5" /><path d="M12 8v7M8 10l4 1 4-1M10 21l2-6 2 6" /></svg>
                </span>
              )}
              <span className="stack" style={{ gap: 2 }}>
                <span className="label">Next site · {regName(inj.r)}</span>
                <span style={{ fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.2 }}>{nextHour ? BELLY.find(b => b.h === nextHour)!.label : SITE_LABEL[suggestSite(lastUsed)]}</span>
                <span className="sub">{nextHour ? `One hour clockwise from ${bh} o'clock` : 'Rested longest of your sites'}</span>
              </span>
            </button>
          )}

          <button type="button" className="tile rise" style={{ ...rise(7), border: 0, textAlign: 'left', font: 'inherit', cursor: 'pointer', gap: 6 }} onClick={actions.checkin}>
            <span className="label" style={{ color: 'var(--mint-ink)' }}>Check-in</span>
            {checkedIn ? (
              <>
                <span style={{ fontSize: '1.3125rem', fontWeight: 600, lineHeight: 1.15 }}>Done today</span>
                <span className="sub">{checkedIn.overall ? `Feeling ${checkedIn.overall}/5 · ` : ''}{fmtTime(new Date(checkedIn.at))}</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.3125rem', fontWeight: 600, lineHeight: 1.15 }}>How do you feel?</span>
                <span className="sub">Takes 30 seconds</span>
              </>
            )}
          </button>

          {comingUp?.st.due && (
            <a href="#peptides" className="tile rise" style={{ ...rise(8), gap: 6 }}>
              <span className="label" style={{ color: 'var(--sky-ink)' }}>Coming up</span>
              <span style={{ fontSize: '1.3125rem', fontWeight: 600, lineHeight: 1.15 }}>{regName(comingUp.r)}</span>
              <span className="sub">{fmtDay(comingUp.st.due)} · {fmtNum(Number(comingUp.r.dose), 3)} {comingUp.r.unit}</span>
            </a>
          )}

          <a href={learnP ? `#${learnP.id}` : '#calculator'} className={`tile lemon rise ${comingUp?.st.due ? 'span-2' : ''}`} style={{ ...rise(9), display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="stack" style={{ gap: 6, flex: 1 }}>
              <span className="label">{learnP ? `Evidence · Tier ${learnP.tier} ${TIERS[learnP.tier].label}` : 'Guide'}</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.2 }}>{learnP ? `What the research says about ${learnP.name}` : 'Dose math, step by step'}</span>
            </span>
            <span className="arrow" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
          </a>
        </div>
      )}
    </section>
  );
}
