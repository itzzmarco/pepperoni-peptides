import { Icon } from '../components/Icon';
import { useRef, useState } from 'react';
import type { Checkin, DoseEntry, Ledger } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { useAccount } from '../lib/account';
import { intervalDays } from '../lib/schedule';
import { download } from '../lib/download';
import { DAY, dayKey, fmtDay, fmtNum, fmtShort, fmtTime, startOfDay } from '../lib/format';
import { adherence, doseDays, effectDays, effectsNearDoses, patternWeeks, siteCounts, topEffects } from '../lib/insights';
import { SITE_LABEL } from '../lib/sites';
import { ledgerToCsv } from '../lib/csv';
import { PEP } from '../data/peptides';
import { LineChart } from '../components/LineChart';
import { useCountUp } from '../components/Motion';
import { Kinetic, Mast } from '../components/Mast';
import { Level, Spark, TideChart, WeekGrid } from '../components/Tidal';
import { useToast } from '../components/Toast';
import { regName } from './PeptidesView';

const RANGES = [[7, 'Week'], [30, 'Month'], [90, '3 months']] as const;
const rise = (i: number) => ({ ['--i' as string]: i });

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={`btn sm ${armed ? 'danger' : 'quiet'}`}
      onClick={() => { if (armed) onConfirm(); else { setArmed(true); setTimeout(() => setArmed(false), 4000); } }}
      onBlur={() => setArmed(false)}
      aria-label={armed ? 'Confirm delete' : 'Delete entry'}
    >
      {armed ? 'Confirm' : 'Delete'}
    </button>
  );
}

function ExportPanel({ ledger }: { ledger: Ledger }) {
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [wipe, setWipe] = useState(false);
  const signedIn = !!useAccount().user;
  const stamp = dayKey(new Date());
  const empty = !ledger.regimens.length && !ledger.doses.length && !ledger.checkins.length;
  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      const added = store.importBackup(JSON.parse(await f.text()));
      toast(added == null ? "That file isn't a Peptidal backup." : `Restored ${added} item${added === 1 ? '' : 's'}.`);
    } catch {
      toast("Couldn't read that file. Choose a .json backup exported from this app.");
    }
    if (file.current) file.current.value = '';
  };
  return (
    <section className="tile teal span-2" aria-labelledby="share-h">
      <div className="rowhead">
        <span className="badge" aria-hidden="true">
          <Icon name="share" />
        </span>
        <span className="stack" style={{ gap: 2 }}>
          <span className="label">Export</span>
          <h2 id="share-h" className="lead">Share with your clinician</h2>
        </span>
      </div>
      <div className="stack">
        <p className="sub">{signedIn ? 'Your log syncs to your account.' : 'Your log lives only in this browser.'} Export a CSV of doses, sites, side effects and weight for an appointment, or a backup you can restore on another device.</p>
        <div className="row-wrap">
          <button className="btn sm" disabled={empty} onClick={() => download(`peptide-log-${stamp}.csv`, ledgerToCsv(ledger, id => PEP[id]?.name), 'text/csv')}>Export CSV</button>
          <button className="btn ghost sm" disabled={empty} onClick={() => download(`peptidal-backup-${stamp}.json`, JSON.stringify(ledger, null, 2), 'application/json')}>Download backup</button>
          <button className="btn quiet sm" onClick={() => file.current?.click()}>Restore backup</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => onImport(e.target.files?.[0])} />
        </div>
        {!empty && (
          <div className="row-wrap">
            {wipe ? (
              <>
                <span className="small">{signedIn ? 'Erase every regimen, dose, and check-in from your account, on all your devices?' : 'Erase every regimen, dose, and check-in on this device?'}</span>
                <button className="btn danger sm" onClick={() => { store.clearAll(); setWipe(false); toast(signedIn ? 'Your log was erased from your account.' : 'Your log was erased from this device.'); }}>Erase everything</button>
                <button className="btn quiet sm" onClick={() => setWipe(false)}>Keep my log</button>
              </>
            ) : (
              <button className="btn quiet sm" onClick={() => setWipe(true)}>Erase my log…</button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** How many timeline entries show before "Show all". */
const RECENT = 12;

function History({ doses, checkins, onBackfill }: { doses: DoseEntry[]; checkins: Checkin[]; onBackfill: () => void }) {
  const toast = useToast();
  const [showAll, setShowAll] = useState(false);
  type Item = { kind: 'dose'; at: string; e: DoseEntry } | { kind: 'check'; at: string; e: Checkin };
  const items: Item[] = [
    ...doses.slice(0, 80).map(e => ({ kind: 'dose' as const, at: e.at, e })),
    ...checkins.slice(0, 80).map(e => ({ kind: 'check' as const, at: e.at, e })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
  let lastDay = '';
  return (
    <section className="tile span-2" aria-labelledby="hist-h">
      <div className="spread" style={{ alignItems: 'center' }}>
        <h2 id="hist-h" className="label">History</h2>
        <button type="button" className="btn soft sm" onClick={onBackfill}>Fill in past days</button>
      </div>
      {items.length ? (
        <div className="timeline">
          {(showAll ? items : items.slice(0, RECENT)).map(it => {
            const d = new Date(it.at), k = dayKey(d);
            const head = k !== lastDay ? <div className="tl-day">{fmtDay(d)}</div> : null;
            lastDay = k;
            return (
              <div key={it.e.id}>
                {head}
                <div className="tl-item">
                  <time>{fmtTime(d)}</time>
                  {it.kind === 'dose' ? (
                    <div className="what">
                      <b>{it.e.name}</b> {fmtNum(Number(it.e.amount), 3)} {it.e.unit}
                      <small>{[it.e.route, SITE_LABEL[it.e.site], it.e.notes].filter(Boolean).join(' · ')}</small>
                    </div>
                  ) : (
                    <div className="what">
                      <b>Check-in</b> {it.e.overall ? `feeling ${it.e.overall}/5` : ''}{it.e.weight ? ` · ${fmtNum(it.e.weight, 1)} ${it.e.weightUnit ?? ''}` : ''}
                      <small>{it.e.effects.join(', ')}{it.e.notes ? ` · ${it.e.notes}` : ''}</small>
                      {it.e.flags.length > 0 && <small className="flag-text">Emergency symptom: {it.e.flags.join('; ')}</small>}
                    </div>
                  )}
                  <DeleteButton onConfirm={() => { if (it.kind === 'dose') store.deleteDose(it.e.id); else store.deleteCheckin(it.e.id); toast('Entry deleted.'); }} />
                </div>
              </div>
            );
          })}
          {items.length > RECENT && (
            <button className="btn quiet sm" style={{ justifySelf: 'start', marginTop: 8 }} onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show fewer' : `Show all ${items.length} entries`}
            </button>
          )}
        </div>
      ) : (
        <p className="sub">Logged doses and check-ins appear here. Kept a paper log before? Fill in past days to bring it in.</p>
      )}
    </section>
  );
}

function Pattern({ doses, checkins, now }: { doses: DoseEntry[]; checkins: Checkin[]; now: Date }) {
  const { regimens } = useLedger();
  const since = startOfDay(now).getTime() - 27 * DAY;
  const withDoses = regimens.filter(r => doses.some(d => d.rid === r.id && new Date(d.at).getTime() >= since));
  const [pick, setPick] = useState(() => (withDoses.find(r => (intervalDays(r) ?? 0) >= 2) ?? withDoses[0])?.id);
  const r = withDoses.find(x => x.id === pick) ?? withDoses[0];
  if (!r) return null;
  const dset = doseDays(doses, r.id), eset = effectDays(checkins);
  const weeks = patternWeeks(dset, eset, now);
  const { total, near } = effectsNearDoses(dset, eset, weeks[0][0].date, now);
  const name = regName(r);
  const p = PEP[r.compoundId];
  const sentence = !total
    ? `No side effects logged in the last 4 weeks.`
    : near === total
      ? `All ${total} side-effect days came within 2 days of a ${name} dose.`
      : `${near} of ${total} side-effect days came within 2 days of a ${name} dose.`;
  const today = dayKey(now);
  const cells = weeks.flat().map(c => ({ d: c.date, on: c.dose, flag: c.effect, future: c.future, today: dayKey(c.date) === today }));
  return (
    <section className="tile peach span-2 rise" aria-labelledby="pattern-h" style={rise(7)}>
      <div className="spread">
        <h2 id="pattern-h" className="label">Pattern</h2>
        <span className="count">4 weeks from {fmtShort(weeks[0][0].date)}</span>
      </div>
      {withDoses.length > 1 && (
        <div className="pick" role="group" aria-label="Compare side effects with">
          {withDoses.map(x => <button key={x.id} type="button" className="fchip" aria-pressed={x.id === r.id} onClick={() => setPick(x.id)}>{regName(x)}</button>)}
        </div>
      )}
      <p className="lead">{sentence}</p>
      <div className="dosefx">
        <WeekGrid key={r.id} days={cells} on={`${name} dose`} label={`Four weeks, Monday first: ${name} doses and days with side effects. ${sentence}`} />
      </div>
      <div className="legend">
        <span><i className="bead on" />{name} dose</span>
        <span><i className="bead fx" />Side effect logged</span>
        <span><i className="bead both" />Both</span>
      </div>
      <p className="sub">A pattern in your own log, not proof of cause. Worth bringing to your prescriber.</p>
      {p && (
        <a className="btn soft sm" href={`#${p.id}`} style={{ justifySelf: 'start' }}>
          What the research says
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </a>
      )}
    </section>
  );
}

export function TrendsView({ onBackfill }: { onBackfill: () => void }) {
  const ledger = useLedger();
  const { regimens, doses, checkins } = ledger;
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const now = new Date();
  const since = startOfDay(now).getTime() - (days - 1) * DAY;
  const adh = adherence(regimens, doses, now, days);
  const pct = useCountUp(adh.pct == null ? 0 : Math.round(adh.pct * 100));

  const inRange = checkins.filter(c => new Date(c.at).getTime() >= since);
  const weights = inRange.filter(c => c.weight).map(c => ({ x: new Date(c.at), y: c.weight!, tip: `${fmtDay(new Date(c.at))}: ${fmtNum(c.weight!, 1)} ${c.weightUnit ?? ''}` }));
  const wUnit = checkins.find(c => c.weight)?.weightUnit ?? '';
  const wSorted = weights.slice().sort((a, b) => a.x.getTime() - b.x.getTime());
  const wFirst = wSorted[0], wLast = wSorted[wSorted.length - 1];
  const change = wSorted.length > 1 ? wLast.y - wFirst.y : null;
  const weeksSpan = wSorted.length > 1 ? (wLast.x.getTime() - wFirst.x.getTime()) / (7 * DAY) : 0;
  const changeShown = useCountUp(change ?? 0);
  // Feeling scores in the range, oldest first.
  const feel = inRange.filter(c => c.overall).map(c => c.overall!).reverse();
  const feelAvg = feel.length ? feel.reduce((a, b) => a + b, 0) / feel.length : 0;
  // Whole weeks ending today that cover the range, a bead per day.
  const rows = days === 7 ? 1 : days === 30 ? 5 : 13;
  const logged = doseDays(doses);
  const grid = Array.from({ length: rows * 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - rows * 7 + 1 + i);
    return { d, on: logged.has(dayKey(d)), today: i === rows * 7 - 1 };
  });
  const gridOn = grid.filter(c => c.on).length;
  const effects = topEffects(checkins, since).slice(0, 5);
  const sites = siteCounts(doses, since).slice(0, 6);
  const missed = adh.expected - adh.logged;

  // Up to three scheduled regimens with doses in the log, each drawn as its own tide in the field.
  const tides = regimens.filter(r => !r.paused && intervalDays(r)).map(r => ({ r, times: doses.filter(d => d.rid === r.id).map(d => new Date(d.at).getTime()) })).filter(x => x.times.length).slice(0, 3);
  const span = days === 7 ? 'week' : days === 30 ? 'month' : '3 months';

  const line1 = adh.pct == null ? 'Your trends.' : adh.pct >= 0.9 ? `A steady ${days === 7 ? 'week' : days === 30 ? 'month' : 'quarter'}.` : adh.pct >= 0.7 ? 'Mostly on schedule.' : 'Some doses slipped.';
  const line2 = [
    change != null && Math.abs(change) >= 0.1 ? `${change < 0 ? 'Down' : 'Up'} ${Math.abs(change).toFixed(1)} ${wUnit}` : '',
    adh.expected ? (missed ? `${missed} dose${missed === 1 ? '' : 's'} missed` : 'no doses missed') : '',
  ].filter(Boolean).join(', ');

  return (
    <section className="view">
      <Mast>
        <p className="when rise"><b>Trends</b><span>{fmtShort(new Date(since))} to {fmtShort(now)}</span></p>
        <Kinetic a={line1} b={line2 ? `${line2[0].toUpperCase() + line2.slice(1)}.` : undefined} />
        <div className="seg rise" role="group" aria-label="Time range" style={rise(2)}>
          {RANGES.map(([d, l]) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{l}</button>)}
        </div>
        {tides.map(({ r, times }, i) => {
          const n = times.filter(t => t >= since).length;
          return (
            <div key={r.id} className="stack rise" style={{ gap: 6, ...rise(3 + i) }}>
              <div className="spread"><span className="label">{regName(r)}</span><span className="sub num">{n} dose{n === 1 ? '' : 's'} this {span}</span></div>
              <TideChart key={days} times={times} every={intervalDays(r)!} days={days} now={now} height={72}
                label={`${regName(r)} over the last ${span}: ${n} dose${n === 1 ? '' : 's'} logged. The water is high after each dose and lies flat while one is overdue.`} />
            </div>
          );
        })}
        {tides.length > 0 && <p className="strand-ends rise" style={rise(6)}><span>Each crest is a logged dose. Flat water means one was due and didn't go in.</span></p>}
      </Mast>

      <div className="bento">
        <section className="tile mint span-2 rise" aria-labelledby="adh-h" style={rise(3)}>
          <div className="spread" style={{ alignItems: 'flex-end' }}>
            <div className="stack" style={{ gap: 6 }}>
              <h2 id="adh-h" className="label">Doses logged</h2>
              <span className="big">{adh.pct == null ? '–' : `${Math.round(pct)}%`}</span>
            </div>
            <span className="sub">{adh.expected ? `${adh.logged} of ${adh.expected} due doses` : 'No scheduled doses yet'}</span>
          </div>
          <WeekGrid key={days} days={grid} label={`The last ${rows === 1 ? 'week' : `${rows} weeks`}, one row per week: a dose was logged on ${gridOn} of ${rows * 7} days`} />
          <p className="sub">{rows === 1 ? 'The last 7 days, ending today.' : 'Each row is a week, ending today.'} Filled means a dose was logged.</p>
        </section>

        <section className="tile lilac span-2 rise" aria-labelledby="wt-h" style={rise(4)}>
          <div className="spread" style={{ alignItems: 'flex-end' }}>
            <div className="stack" style={{ gap: 6 }}>
              <h2 id="wt-h" className="label">Weight</h2>
              {change != null
                ? <span className="big">{changeShown < 0 ? '−' : '+'}{Math.abs(changeShown).toFixed(1)}<small> {wUnit} {weeksSpan >= 1.5 ? `in ${Math.round(weeksSpan)} weeks` : ''}</small></span>
                : <span className="sub">{weights.length ? 'Add another weigh-in to see a trend.' : 'No weights logged in this range. Add one in a daily check-in.'}</span>}
            </div>
            <button type="button" className="btn soft sm" onClick={onBackfill}>Add past days</button>
          </div>
          {weights.length >= 2 && (() => {
            const ys = weights.map(w => w.y);
            const lo = Math.floor(Math.min(...ys) - 1), hi = Math.ceil(Math.max(...ys) + 1);
            return <LineChart points={weights} y0={lo} y1={hi} ticks={[lo, Math.round((lo + hi) / 2), hi]} x0={since} x1={now.getTime()} label="Weight trend" fmt={v => fmtNum(v, 1)} />;
          })()}
          {change != null && (
            <div className="stats">
              <div><span className="sub">Start</span><b className="num">{wFirst.y.toFixed(1)} {wUnit}</b></div>
              <div><span className="sub">Now</span><b className="num">{wLast.y.toFixed(1)} {wUnit}</b></div>
              <div><span className="sub">Per week</span><b className="num">{weeksSpan >= 1 ? `${change < 0 ? '−' : '+'}${Math.abs(change / weeksSpan).toFixed(1)}` : '–'}</b></div>
            </div>
          )}
        </section>

        <section className="tile mint rise" aria-labelledby="feel-h" style={{ ...rise(5), gap: 6 }}>
          <h2 id="feel-h" className="label">How you've felt</h2>
          {feel.length ? (
            <>
              <span className="mid">{feelAvg.toFixed(1)}<small> of 5</small></span>
              <span className="sub">Average of {feel.length} check-in{feel.length === 1 ? '' : 's'}</span>
              {feel.length > 1 && <Spark values={feel} lo={1} hi={5} />}
            </>
          ) : <span className="sub">Do a daily check-in to see how you've felt.</span>}
        </section>

        <section className="tile peach rise" aria-labelledby="sx-h" style={rise(6)}>
          <h2 id="sx-h" className="label">Side effects</h2>
          {effects.length ? (
            <div className="bars">
              {effects.map(([name, n], i) => (
                <div key={name}>
                  <div className="spread"><span>{name}</span><b className="num">{n} day{n === 1 ? '' : 's'}</b></div>
                  <Level f={n / effects[0][1]} i={i} />
                </div>
              ))}
            </div>
          ) : <span className="sub">None logged in this range.</span>}
        </section>

        <Pattern doses={doses} checkins={checkins} now={now} />

        <section className="tile sky span-2 rise" aria-labelledby="rot-h" style={rise(8)}>
          <div className="spread"><h2 id="rot-h" className="label">Site rotation</h2><span className="count">Injections in range</span></div>
          {sites.length ? (
            <>
              <div className="bars two">
                {sites.map(([k, n], i) => (
                  <div key={k}>
                    <div className="spread"><span>{SITE_LABEL[k] ?? k}</span><b className="num">{n}</b></div>
                    <Level f={n / sites[0][1]} i={i} />
                  </div>
                ))}
              </div>
              <p className="sub">{sites[0][1] >= 3 && days <= 7 ? `${SITE_LABEL[sites[0][0]]} was used ${sites[0][1]} times this week. Give it a rest.` : `Spread across ${siteCounts(doses, since).length} spots. Rotating helps prevent lumps and scarring.`}</p>
            </>
          ) : <span className="sub">Pick a site when you log an injection to see your rotation here.</span>}
        </section>

        <ExportPanel ledger={ledger} />
        <History doses={doses} checkins={checkins} onBackfill={onBackfill} />
      </div>
    </section>
  );
}
