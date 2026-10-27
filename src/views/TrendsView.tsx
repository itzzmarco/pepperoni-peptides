import { useRef, useState } from 'react';
import type { Checkin, DoseEntry, Ledger } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { intervalDays } from '../lib/schedule';
import { DAY, dayKey, fmtDay, fmtNum, fmtShort, fmtTime, startOfDay } from '../lib/format';
import { adherence, doseDays, effectDays, effectsNearDoses, patternWeeks, siteCounts, topEffects } from '../lib/insights';
import { SITE_LABEL } from '../lib/sites';
import { ledgerToCsv } from '../lib/csv';
import { PEP } from '../data/peptides';
import { LineChart } from '../components/LineChart';
import { useCountUp } from '../components/Motion';
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

function download(filename: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ExportPanel({ ledger }: { ledger: Ledger }) {
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [wipe, setWipe] = useState(false);
  const stamp = dayKey(new Date());
  const empty = !ledger.regimens.length && !ledger.doses.length && !ledger.checkins.length;
  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      const added = store.importBackup(JSON.parse(await f.text()));
      toast(added == null ? "That file isn't a Peptide Ledger backup." : `Restored ${added} item${added === 1 ? '' : 's'}.`);
    } catch {
      toast("Couldn't read that file. Choose a .json backup exported from this app.");
    }
    if (file.current) file.current.value = '';
  };
  return (
    <section className="tile" aria-labelledby="share-h">
      <div className="row-wrap" style={{ flexWrap: 'nowrap', gap: 12 }}>
        <span className="badge-icon" style={{ width: 44, height: 44, background: 'var(--lemon)', color: 'var(--lemon-ink)', flex: 'none' }} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
        </span>
        <h3 id="share-h">Share with your clinician</h3>
      </div>
      <div className="stack">
        <p className="small muted">Your log lives only in this browser. Export a CSV of doses, sites, side effects and weight for an appointment, or a backup you can restore on another device.</p>
        <div className="row-wrap">
          <button className="btn sm" disabled={empty} onClick={() => download(`peptide-log-${stamp}.csv`, ledgerToCsv(ledger, id => PEP[id]?.name), 'text/csv')}>Export CSV</button>
          <button className="btn ghost sm" disabled={empty} onClick={() => download(`peptide-ledger-backup-${stamp}.json`, JSON.stringify(ledger, null, 2), 'application/json')}>Download backup</button>
          <button className="btn quiet sm" onClick={() => file.current?.click()}>Restore backup</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => onImport(e.target.files?.[0])} />
        </div>
        {!empty && (
          <div className="row-wrap">
            {wipe ? (
              <>
                <span className="small">Erase every regimen, dose, and check-in on this device?</span>
                <button className="btn danger sm" onClick={() => { store.clearAll(); setWipe(false); toast('Your log was erased from this device.'); }}>Erase everything</button>
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

function History({ doses, checkins }: { doses: DoseEntry[]; checkins: Checkin[] }) {
  const toast = useToast();
  const [showAll, setShowAll] = useState(false);
  type Item = { kind: 'dose'; at: string; e: DoseEntry } | { kind: 'check'; at: string; e: Checkin };
  const items: Item[] = [
    ...doses.slice(0, 80).map(e => ({ kind: 'dose' as const, at: e.at, e })),
    ...checkins.slice(0, 80).map(e => ({ kind: 'check' as const, at: e.at, e })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
  let lastDay = '';
  return (
    <section className="tile" aria-labelledby="hist-h">
      <div className="spread"><h3 id="hist-h">History</h3><span className="count">{items.length} recent</span></div>
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
        <p className="small muted">Logged doses and check-ins appear here.</p>
      )}
    </section>
  );
}

/** This month as a Monday-first calendar; filled days have at least one logged dose. */
function MonthCalendar({ doses, now }: { doses: DoseEntry[]; now: Date }) {
  const on = doseDays(doses);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const logged = Array.from({ length: now.getDate() }, (_, i) => on.has(dayKey(new Date(now.getFullYear(), now.getMonth(), i + 1)))).filter(Boolean).length;
  return (
    <div className="cal" role="img" aria-label={`${first.toLocaleDateString(undefined, { month: 'long' })}: doses logged on ${logged} of ${now.getDate()} days so far`}>
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="wd">{d}</span>)}
      {Array.from({ length: lead }, (_, i) => <span key={`x${i}`} />)}
      {Array.from({ length: days }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
        const cls = [on.has(dayKey(d)) && 'on', d.getDate() === now.getDate() && 'today', d > now && 'future'].filter(Boolean).join(' ');
        return <span key={i} className={`d pop ${cls}`} style={rise(i * 0.6)}>{i + 1}</span>;
      })}
    </div>
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
  return (
    <section className="tile dark rise" aria-labelledby="pattern-h" style={rise(5)}>
      <div className="spread">
        <h2 id="pattern-h" className="eyebrow" style={{ color: 'var(--effect-cell)' }}>Pattern</h2>
        <span className="sub">4 weeks from {fmtShort(weeks[0][0].date)}</span>
      </div>
      {withDoses.length > 1 && (
        <div className="pick" role="group" aria-label="Compare side effects with">
          {withDoses.map(x => <button key={x.id} type="button" className="fchip" aria-pressed={x.id === r.id} onClick={() => setPick(x.id)}>{regName(x)}</button>)}
        </div>
      )}
      <p style={{ fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.3 }}>{sentence}</p>
      <div className="pattern" role="img" aria-label={`Four weeks, Monday first: ${name} doses and days with side effects. ${sentence}`}>
        <div className="wk head" aria-hidden="true">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
        {weeks.map((w, wi) => (
          <div key={wi} className="wk">
            {w.map((c, i) => (
              <span key={i} className={`c pop${c.future ? ' future' : `${c.dose ? ' dose' : ''}${c.effect ? ' effect' : ''}`}${dayKey(c.date) === dayKey(now) ? ' today' : ''}`}
                style={rise(wi * 4 + i)} title={`${fmtDay(c.date)}${c.dose ? `: ${name} dose` : ''}${c.effect ? `${c.dose ? ',' : ':'} side effect logged` : ''}`} />
            ))}
          </div>
        ))}
        <div className="legend" style={{ paddingTop: 4 }}>
          <span><i style={{ background: 'var(--dose-cell)' }} />{name} dose</span>
          <span><i style={{ background: 'var(--effect-cell)' }} />Side effect logged</span>
        </div>
      </div>
      <p className="sub">A pattern in your own log, not proof of cause. Worth bringing to your prescriber.</p>
      {p && (
        <a className="btn" href={`#${p.id}`} style={{ justifySelf: 'start' }}>
          What the research says
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </a>
      )}
    </section>
  );
}

export function TrendsView() {
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
  const feel = inRange.filter(c => c.overall).map(c => ({ x: new Date(c.at), y: c.overall!, tip: `${fmtDay(new Date(c.at))}: ${c.overall}/5` }));
  const effects = topEffects(checkins, since).slice(0, 5);
  const sites = siteCounts(doses, since).slice(0, 6);
  const missed = adh.expected - adh.logged;

  const line1 = adh.pct == null ? 'Your trends.' : adh.pct >= 0.9 ? `A steady ${days === 7 ? 'week' : days === 30 ? 'month' : 'quarter'}.` : adh.pct >= 0.7 ? 'Mostly on schedule.' : 'Some doses slipped.';
  const line2 = [
    change != null && Math.abs(change) >= 0.1 ? `${change < 0 ? 'Down' : 'Up'} ${Math.abs(change).toFixed(1)} ${wUnit}` : '',
    adh.expected ? (missed ? `${missed} dose${missed === 1 ? '' : 's'} missed` : 'no doses missed') : '',
  ].filter(Boolean).join(', ');

  return (
    <section className="view">
      <header className="head rise">
        <span className="eyebrow">Trends · {RANGES.find(r => r[0] === days)![1]}</span>
        <h1>{line1}{line2 && <><br /><span className="soft">{line2[0].toUpperCase() + line2.slice(1)}.</span></>}</h1>
      </header>
      <div className="seg rise" role="group" aria-label="Time range" style={rise(1)}>
        {RANGES.map(([d, l]) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{l}</button>)}
      </div>

      <section className="tile mint rise" aria-labelledby="adh-h" style={rise(2)}>
        <div className="spread" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ gap: 2 }}>
            <h2 id="adh-h" className="label">Doses logged</h2>
            <span className="big" style={{ fontSize: '2.75rem' }}>{adh.pct == null ? '–' : `${Math.round(pct)}%`}</span>
          </div>
          <span className="sub" style={{ color: 'var(--mint-2)' }}>{adh.expected ? `${adh.logged} of ${adh.expected} due doses` : 'No scheduled doses yet'}</span>
        </div>
        <MonthCalendar doses={doses} now={now} />
        <div className="legend" style={{ color: 'var(--mint-2)' }}>
          <span><i style={{ background: 'var(--mint-ink)', borderRadius: 6 }} />Dose logged</span>
          <span><i style={{ boxShadow: 'inset 0 0 0 2px var(--mint-ink)', background: 'var(--surface)', borderRadius: 6 }} />Today</span>
        </div>
      </section>

      <section className="tile lilac rise" aria-labelledby="wt-h" style={rise(3)}>
        <div className="spread" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ gap: 2 }}>
            <h2 id="wt-h" className="label">Weight</h2>
            {change != null
              ? <span className="big" style={{ fontSize: '2.75rem' }}>{changeShown < 0 ? '−' : '+'}{Math.abs(changeShown).toFixed(1)}<small> {wUnit} {weeksSpan >= 1.5 ? `in ${Math.round(weeksSpan)} weeks` : ''}</small></span>
              : <span className="sub">{weights.length ? 'Add another weigh-in to see a trend.' : 'No weights logged in this range. Add one in a daily check-in.'}</span>}
          </div>
        </div>
        {weights.length >= 2 && (() => {
          const ys = weights.map(w => w.y);
          const lo = Math.floor(Math.min(...ys) - 1), hi = Math.ceil(Math.max(...ys) + 1);
          return <LineChart points={weights} y0={lo} y1={hi} ticks={[lo, Math.round((lo + hi) / 2), hi]} x0={since} x1={now.getTime()} label="Weight trend" fmt={v => fmtNum(v, 1)} />;
        })()}
        {change != null && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <div className="inset"><div className="xsmall muted">Start</div><b className="num">{wFirst.y.toFixed(1)} {wUnit}</b></div>
            <div className="inset"><div className="xsmall muted">Now</div><b className="num">{wLast.y.toFixed(1)} {wUnit}</b></div>
            <div className="inset"><div className="xsmall muted">Per week</div><b className="num">{weeksSpan >= 1 ? `${change < 0 ? '−' : '+'}${Math.abs(change / weeksSpan).toFixed(1)}` : '–'}</b></div>
          </div>
        )}
      </section>

      <section className="tile rise" aria-labelledby="feel-h" style={{ ...rise(4), ['--chart-line' as string]: 'var(--mint-ink)' }}>
        <div className="spread"><h2 id="feel-h" className="label" style={{ color: 'var(--mint-ink)' }}>How you've felt</h2><span className="count">1 to 5, from check-ins</span></div>
        {feel.length >= 2
          ? <LineChart points={feel} y0={1} y1={5} ticks={[1, 3, 5]} x0={since} x1={now.getTime()} label="Overall feeling over time" />
          : <p className="small muted">{feel.length ? 'Check in on another day to start seeing a trend.' : 'Do a daily check-in to see your trend here.'}</p>}
      </section>

      <section className="tile peach rise" aria-labelledby="sx-h" style={rise(5)}>
        <div className="spread"><h2 id="sx-h" className="label">Side effects</h2><span className="count">Days logged</span></div>
        {effects.length ? (
          <div className="bars">
            {effects.map(([name, n], i) => (
              <div key={name}>
                <div className="spread"><span>{name}</span><b className="num">{n} day{n === 1 ? '' : 's'}</b></div>
                <div className="bar"><i className="grow" style={{ width: `${(n / effects[0][1]) * 100}%`, ...rise(i) }} /></div>
              </div>
            ))}
          </div>
        ) : <p className="small muted">None logged in this range.</p>}
      </section>

      <Pattern doses={doses} checkins={checkins} now={now} />

      <section className="tile sky rise" aria-labelledby="rot-h" style={rise(6)}>
        <div className="spread"><h2 id="rot-h" className="label">Site rotation</h2><span className="count">Injections in range</span></div>
        {sites.length ? (
          <>
            <div className="sites2">
              {sites.map(([k, n], i) => (
                <div key={k}>
                  <div className="spread"><span>{SITE_LABEL[k] ?? k}</span><b className="num">{n}</b></div>
                  <div className="bar"><i className="grow" style={{ width: `${(n / sites[0][1]) * 100}%`, ...rise(i) }} /></div>
                </div>
              ))}
            </div>
            <p className="inset small">{sites[0][1] >= 3 && days <= 7 ? `${SITE_LABEL[sites[0][0]]} was used ${sites[0][1]} times this week. Give it a rest.` : `Spread across ${siteCounts(doses, since).length} spots. Rotating helps prevent lumps and scarring.`}</p>
          </>
        ) : <p className="small muted">Pick a site when you log an injection to see your rotation here.</p>}
      </section>

      <ExportPanel ledger={ledger} />
      <History doses={doses} checkins={checkins} />
    </section>
  );
}
