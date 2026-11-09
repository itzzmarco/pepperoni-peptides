import { useLayoutEffect, useRef, useState } from 'react';
import type { Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { leftToday, upcoming, type RegimenStatus } from '../lib/schedule';
import { drugAmount, isVolumeUnit } from '../lib/doseMath';
import { checkRegimen } from '../lib/vial';
import { DAY, dayKey, fmtDay, fmtNum, fmtShort, fmtTime, startOfDay } from '../lib/format';
import { adherence, topEffects, usualMinutes } from '../lib/insights';
import { nextSite, siteLabel, type NextSite } from '../lib/sites';
import { placeLabels, trackStart } from '../lib/trackLabels';
import { PEP } from '../data/peptides';
import { TIERS } from '../data/reference';
import { configured, useAccount } from '../lib/account';
import { firstName, usePartners, weighIns, weightChange } from '../lib/partner';
import { DeviceLogPrompt } from '../sheets/AccountSheet';
import { SiteFigure, doseText, whenNext } from '../components/NextShot';
import { useCountUp } from '../components/Motion';
import { IlloStart } from '../components/Illustration';
import { Glp1Alert, regName, type Actions } from './PeptidesView';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const rise = (i: number) => ({ ['--i' as string]: i });

/** The weight sparkline, drawn at the tile's real pixel width (like LineChart) so its stroke keeps an even weight
    on any tile. `ys` are heights within the 28px box, oldest first. */
function Spark({ ys }: { ys: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(120);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setW(Math.max(40, Math.round(el.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Inset by the round cap's radius so the ends aren't clipped.
  const pts = ys.map((y, i) => `${(2 + (i / Math.max(1, ys.length - 1)) * (W - 4)).toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <div ref={ref}>
      <svg className="spark" width={W} height={28} viewBox={`0 0 ${W} 28`} aria-hidden="true"><polyline className="draw" pathLength={1} points={pts} /></svg>
    </div>
  );
}

/** Width (px) of one time label's box under the track, and of the pinned "12 AM" at the end. */
const LABEL = 54, END_LABEL = 40;

/** Today's doses on a track from 6 AM (or the hour of anything earlier: a dose or now) to midnight: filled dots are logged, rings are still due (at the usual time).
    Times sit in boxes kept inside the card, with a label-wide gap between them (placeLabels). */
function DayBar({ done, todo, now }: { done: Date[]; todo: Date[]; now: Date }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(248);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const A = trackStart([now, ...done, ...todo]), B = 24 * 60;
  const pos = (d: Date) => Math.min(100, Math.max(0, ((d.getHours() * 60 + d.getMinutes() - A) / (B - A)) * 100));
  const nowPct = pos(now);
  const marks = [...done.map(d => ({ d, done: true })), ...todo.map(d => ({ d, done: false }))].sort((a, b) => a.d.getTime() - b.d.getTime());
  const { lefts, showEnd } = placeLabels(marks.map(m => (pos(m.d) / 100) * width), width, LABEL, END_LABEL);
  const desc = [...done.map(d => `logged at ${fmtTime(d)}`), ...todo.map(d => `due around ${fmtTime(d)}`)].join(', ');
  return (
    <div ref={ref} className="daybar" role="img" aria-label={`Today: ${desc}. It's ${fmtTime(now)}.`}>
      <div className="track" />
      <div className="fill grow" style={{ width: `${nowPct}%` }} />
      {nowPct < 100 && <div className="now pop" style={{ left: `${nowPct}%`, ...rise(8) }}><span>Now</span></div>}
      {marks.map((m, i) => (
        <span key={i}>
          <span className={`mark pop ${m.done ? 'done' : 'todo'}`} style={{ left: `${pos(m.d)}%`, ...rise(4 + i) }}>
            {m.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
          </span>
          {lefts[i] != null && <span className={`t${m.done ? '' : ' todo'}`} style={{ left: lefts[i]!, width: LABEL }}>{fmtTime(m.d)}</span>}
        </span>
      ))}
      {showEnd && <span className="t end">12 AM</span>}
    </div>
  );
}

/** Today's doses as a ring: the arc is the share logged, the count sits in the middle and the label reads it out.
    The arc sweeps to a new share (useCountUp, so reduced motion jumps), like the stats around it count up. */
function TodayRing({ done, total }: { done: number; total: number }) {
  const share = useCountUp(Math.min(1, done / total) * 100);
  return (
    <span className="today-ring pop" role="img" aria-label={`${done} of ${total} today`} style={rise(3)}>
      <svg viewBox="0 0 72 72" width="76" height="76" aria-hidden="true">
        <circle cx="36" cy="36" r="30" className="track" />
        {share > 0 && <circle cx="36" cy="36" r="30" className="arc" pathLength={100} strokeDasharray={`${share} 100`} />}
      </svg>
      <b className="num" aria-hidden="true">{done}<small>/{total}</small></b>
    </span>
  );
}

function NextUp({ r, st, actions, doneToday, dueToday, todo, done, now, site }: {
  r: Regimen; st: RegimenStatus; actions: Actions; doneToday: number; dueToday: number; todo: Date[]; done: Date[]; now: Date; site: NextSite | null;
}) {
  const { math, checks } = checkRegimen(r);
  const usual = todo[0];
  const total = doneToday + dueToday;
  return (
    <section className="tile dark rise" aria-label="Next dose" style={rise(2)}>
      <div className="spread">
        <span className="eyebrow">Next up</span>
        <span className="sub num">{st.text}</span>
      </div>
      <div className="next-hero">
        <div className="stack gap-2">
          <span className="next-name">{regName(r)}</span>
          <span className="next-dose">{fmtNum(Number(r.dose), 3)} {r.unit}</span>
          <span className="sub">
            {[usual && st.s !== 'ok' ? `Usually around ${fmtTime(usual)}` : '', math ? (isVolumeUnit(r.unit) ? `about ${drugAmount(math.doseMg, PEP[r.compoundId]?.defaultUnit)}` : `draw ${fmtNum(math.units, 1)} units`) : checks.length ? 'check the vial details' : '', site ? siteLabel(site.site, r.route) : r.route].filter(Boolean).join(' · ')}
          </span>
        </div>
        {total > 0 && <TodayRing done={doneToday} total={total} />}
      </div>
      {(done.length > 0 || todo.length > 0) && <DayBar done={done} todo={todo} now={now} />}
      {/* The card's one action spans its width, so the row ends the hero cleanly. */}
      <button className="btn" onClick={() => actions.logDose(r)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Log now
      </button>
    </section>
  );
}

export function TodayView(actions: Actions) {
  const { regimens, doses, checkins } = useLedger();
  const acct = useAccount();
  const signedIn = !!acct.user;
  const seenHere = acct.seenHere;
  const now = new Date();
  const today = dayKey(now);
  const list = upcoming(regimens, doses, now);
  const next = list[0];
  const late = list.filter(x => x.st.s === 'late').length;
  // Every dose still scheduled today, the evening dose of a twice-daily regimen included.
  const left = leftToday(list, now);
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

  // Every weigh-in in the latest one's unit, so a switch between lb and kg never shows up as a jump.
  const wUnit = checkins.find(c => c.weight)?.weightUnit ?? 'lb';
  const weights = weighIns(checkins, wUnit, now.getTime() - 90 * DAY);
  const wNow = weights[weights.length - 1], wFirst = weights[0];
  const wShown = useCountUp(wNow?.w ?? 0, wFirst?.w ?? 0);
  const wChange = wNow && wFirst && wNow !== wFirst ? wNow.w - wFirst.w : null;
  const wMin = Math.min(...weights.map(w => w.w)), wMax = Math.max(...weights.map(w => w.w));
  const spark = weights.slice(-12).map(w => 4 + (1 - (w.w - wMin) / Math.max(0.1, wMax - wMin)) * 20);

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
  const pUnit = wNow ? wUnit : pLog?.checkins.find(c => c.weightUnit)?.weightUnit ?? 'lb';
  const pW = pLog ? weightChange(pLog.checkins, pUnit, now.getTime() - 90 * DAY) : null;
  const pNext = pLog ? upcoming(pLog.regimens, pLog.doses, now)[0] : undefined;

  const hour = now.getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  let line1: string, line2: string;
  const hasLog = regimens.length > 0 || doses.length > 0 || checkins.length > 0;
  // Signed out on a site with accounts, an empty log usually means "sign in", not "start over".
  const offerSignIn = configured && !signedIn && !regimens.length;
  if (!regimens.length && offerSignIn && seenHere) { line1 = "You're signed out."; line2 = 'Sign in to see your log.'; }
  // No regimens: the start card below is the call to action; a first visit also gets one line on what the app is.
  else if (!regimens.length) { line1 = hasLog ? 'Nothing to take yet.' : 'Welcome.'; line2 = hasLog ? '' : 'Your private shot and peptide log.'; }
  else if (late) { line1 = `${plural(late, 'dose')} overdue.`; line2 = 'Log it when you take it.'; }
  else if (left) { line1 = adh.pct == null || adh.pct >= 0.8 ? "You're on track." : "Here's today."; line2 = `${plural(left, 'dose')} left today.`; }
  else { line1 = "You're all set today."; line2 = next?.st.due ? `Next: ${regName(next.r)}, ${fmtShort(next.st.due)}.` : 'Nothing scheduled.'; }

  // A linked partner's tile shows whether or not this user has logged anything yet: it is the only way to their progress.
  const partnerTile = partner && (
    <a href="#partner" className="tile span-2 partner-tile rise" style={rise(6)}>
      <span className="avatar" aria-hidden="true">{firstName(partner.name)[0]}</span>
      <span className="stack gap-1 flex-1 min-0">
        <span className="label">{firstName(partner.name)} · partner</span>
        <span className="tile-title">
          {pW ? <>{fmtNum(pW.last.w, 1)}<small className="sub"> {pUnit}</small>{pW.count > 1 && <span className="sub"> · {pW.change > 0 ? '+' : pW.change < 0 ? '−' : ''}{Math.abs(pW.change).toFixed(1)} since {fmtShort(pW.first.at)}</span>}</> : 'No weigh-ins yet'}
        </span>
        {pNext && <span className="sub">{regName(pNext.r)} · {pNext.st.text}</span>}
      </span>
    </a>
  );
  return (
    <section className="view">
      <header className="head">
        {/* The greeting leads; the date sits opposite it as a quiet pill. */}
        <div className="spread rise mid">
          <span className="greet">{hello}</span>
          <span className="chip">{fmtDay(now)}</span>
        </div>
        <h1 className="rise" style={rise(1)}>{line1}{line2 && <><br /><span className="soft">{line2}</span></>}</h1>
      </header>

      {lastFlag && (
        <div className="alert danger" role="alert">
          <b>You reported an emergency symptom on {fmtDay(new Date(lastFlag.at))}.</b>
          <span>{lastFlag.flags.join('; ')}. If it's still happening, call 911 or go to an emergency room. For a possible poisoning or overdose, call Poison Control at 1-800-222-1222.</span>
        </div>
      )}

      {next ? (
        <NextUp r={next.r} st={next.st} actions={actions} now={now} done={done} todo={todo} site={shots.find(x => x.r === next.r)?.s ?? null}
          doneToday={loggedToday.length} dueToday={left} />
      ) : offerSignIn && seenHere ? (
        <section className="tile dark empty rise" style={rise(2)}>
          <IlloStart />
          <span className="eyebrow">Signed out</span>
          <h2>Sign in and your peptides, shots and weights come back.</h2>
          <span className="sub">Your log is saved in your account. Anything added while signed out stays on this device only, so sign in before you log.</span>
          <div className="row-wrap">
            <button className="btn" onClick={actions.signIn}>Sign in</button>
            <button className="btn glass" onClick={actions.addRegimen}>Add a peptide anyway</button>
          </div>
        </section>
      ) : (
        <section className="tile dark empty rise" style={rise(2)}>
          <IlloStart />
          <span className="eyebrow">Start your log</span>
          <h2>Track a peptide or medication your clinician prescribed.</h2>
          <span className="sub">You'll see what's due, how consistent you've been, and where to inject next. {signedIn ? 'It syncs to your account, and only you can see it.' : 'Nothing leaves this device.'}</span>
          <div className="row-wrap">
            <button className="btn" onClick={actions.addRegimen}>Add a peptide</button>
            {offerSignIn && <button className="btn glass" onClick={actions.signIn}>I have an account</button>}
          </div>
        </section>
      )}

      {/* Only an emergency sits above Next up; the other notices follow it, so Log now stays near the top on a phone. */}
      {!store.persistent && (
        <div className="alert warn"><b>This browser isn't saving your log.</b><span>Private browsing or blocked site storage stops saving. Entries will disappear when you close the tab, so export before you leave.</span></div>
      )}
      <DeviceLogPrompt onToday />
      <Glp1Alert regimens={regimens} />

      {!hasLog && partnerTile && <div className="bento quad">{partnerTile}</div>}
      {hasLog && (
        <div className="bento quad">
          <a href="#trends" className="tile mint row-2 rise" style={rise(3)}>
            <span className="label">Adherence</span>
            <span className="big">{adh.pct == null ? '–' : `${Math.round(pct)}%`}</span>
            <span className="sub tone-mint">{adh.expected ? `${adh.logged} of ${adh.expected} doses · 4 weeks` : 'Log a few doses to see this.'}</span>
            <span className="dots7" role="img" aria-label={`Last 7 days: dose logged on ${week.filter(w => w.on).length}`}>
              {week.map((w, i) => <i key={i} className={`pop${w.on ? ' on' : ''}${w.today && !w.on ? ' today' : ''}`} style={rise(i)} />)}
            </span>
          </a>

          <a href="#trends" className="tile rise gap-2" style={rise(4)}>
            <span className="label">Weight</span>
            {wNow ? (
              <>
                <span className="stat">{wShown.toFixed(1)}<small> {wUnit}</small></span>
                {weights.length > 1 && <Spark ys={spark} />}
                <span className="sub">{wChange != null ? `${Math.abs(wChange) < 0.05 ? '' : wChange > 0 ? '+' : '−'}${Math.abs(wChange).toFixed(1)} since ${fmtShort(wFirst.at)}` : 'Add more check-ins for a trend.'}</span>
              </>
            ) : <span className="sub">Add your weight in a daily check-in.</span>}
          </a>

          <a href="#trends" className="tile rise gap-2 wide-lg" style={rise(5)}>
            <span className="label">Side effects</span>
            {effects.length ? (
              <>
                <span className="tile-title">{effects[0][0]}</span>
                <span className="sub">{plural(effects[0][1], 'day')} this week{effects.length > 1 ? `, plus ${effects.length - 1} more` : ''}</span>
              </>
            ) : <span className="sub">None logged this week.</span>}
          </a>

          {partnerTile}

          {shots.map(({ r, s: sug }, i) => (
            <button key={r.id} type="button" className="tile sky span-2 rise row-tile gap-4" style={rise(6 + i)} onClick={() => actions.logDose(r)}
              aria-label={`Next shot of ${regName(r)}: ${siteLabel(sug.site, r.route)}, ${whenNext(r, doses, now)}. Log it.`}>
              <SiteFigure s={sug} size={76} />
              <span className="stack gap-1 min-0">
                <span className="label">Next shot · {regName(r)}</span>
                <span className="tile-title">{siteLabel(sug.site, r.route)}</span>
                <span className="sub em">{whenNext(r, doses, now)} · {doseText(r)}</span>
                <span className="sub">{sug.why}</span>
              </span>
            </button>
          ))}

          <button type="button" className={`tile rise gap-2${comingUp?.st.due ? '' : ' wide-sm'}`} style={rise(7)} onClick={actions.checkin}>
            <span className="label">Check-in</span>
            {checkedIn ? (
              <>
                <span className="tile-title">Done today</span>
                <span className="sub">{checkedIn.overall ? `Feeling ${checkedIn.overall}/5 · ` : ''}{fmtTime(new Date(checkedIn.at))}</span>
              </>
            ) : (
              <>
                <span className="tile-title">How do you feel?</span>
                <span className="sub">Takes 30 seconds</span>
              </>
            )}
          </button>

          {comingUp?.st.due && (
            <a href="#peptides" className="tile rise gap-2" style={rise(8)}>
              <span className="label">Coming up</span>
              <span className="tile-title">{regName(comingUp.r)}</span>
              <span className="sub">{fmtDay(comingUp.st.due)} · {fmtNum(Number(comingUp.r.dose), 3)} {comingUp.r.unit}</span>
            </a>
          )}

          <a href={learnP ? `#${learnP.id}` : '#calculator'} className={`tile rise row-tile gap-4 ${comingUp?.st.due ? 'span-2' : 'wide-sm'}`} style={rise(9)}>
            <span className="stack gap-2 flex-1 min-0 break-any">
              <span className="label">{learnP ? `Evidence · Tier ${learnP.tier} ${TIERS[learnP.tier].label}` : 'Guide'}</span>
              <span className="tile-title">{learnP ? `What the research says about ${learnP.name}` : 'Dose math, step by step'}</span>
            </span>
          </a>
        </div>
      )}
    </section>
  );
}
