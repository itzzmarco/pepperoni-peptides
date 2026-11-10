import { useState } from 'react';
import type { Checkin, DoseEntry, Ledger } from '../lib/types';
import { useLedger } from '../lib/store';
import { useAccount } from '../lib/account';
import { firstName, refreshPartners, usePartners, weighIns, weightChange } from '../lib/partner';
import { adherenceDays, freqText, regimenStatus } from '../lib/schedule';
import { adherence } from '../lib/insights';
import { DAY, dayKey, fmtDay, fmtNum, fmtShort, fmtTime, startOfDay } from '../lib/format';
import { LineChart } from '../components/LineChart';
import { Kinetic, Mast } from '../components/Mast';
import { regName } from './PeptidesView';

const RANGES = [[30, 'Month'], [90, '3 months'], [0, 'Since start']] as const;
const rise = (i: number) => ({ ['--i' as string]: i });
const signed = (n: number, unit: string) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n).toFixed(1)} ${unit}`;

/** A partner's recent doses and check-ins, newest first, read-only. */
function Recent({ log, name }: { log: Ledger; name: string }) {
  type Item = { kind: 'dose'; at: string; e: DoseEntry } | { kind: 'check'; at: string; e: Checkin };
  const items: Item[] = [
    ...log.doses.slice(0, 20).map(e => ({ kind: 'dose' as const, at: e.at, e })),
    ...log.checkins.slice(0, 20).map(e => ({ kind: 'check' as const, at: e.at, e })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  let lastDay = '';
  return (
    <section className="tile rise" aria-labelledby="p-recent-h" style={rise(6)}>
      <h2 id="p-recent-h" className="label">{name}'s recent entries</h2>
      {items.length ? (
        <div className="timeline">
          {items.map(it => {
            const d = new Date(it.at), k = dayKey(d);
            const head = k !== lastDay ? <div className="tl-day">{fmtDay(d)}</div> : null;
            lastDay = k;
            return (
              <div key={`${it.kind}${it.e.id}`}>
                {head}
                <div className="tl-item" style={{ gridTemplateColumns: '64px minmax(0, 1fr)' }}>
                  <time>{fmtTime(d)}</time>
                  {it.kind === 'dose' ? (
                    <div className="what"><b>{it.e.name}</b> {fmtNum(Number(it.e.amount), 3)} {it.e.unit}<small>{[it.e.route, it.e.notes].filter(Boolean).join(' · ')}</small></div>
                  ) : (
                    <div className="what">
                      <b>Check-in</b>{it.e.weight ? ` · ${fmtNum(it.e.weight, 1)} ${it.e.weightUnit ?? ''}` : ''}{it.e.overall ? ` · feeling ${it.e.overall}/5` : ''}
                      {(it.e.effects.length > 0 || it.e.notes) && <small>{[it.e.effects.join(', '), it.e.notes].filter(Boolean).join(' · ')}</small>}
                      {it.e.flags.length > 0 && <small className="flag-text">Emergency symptom: {it.e.flags.join('; ')}</small>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : <p className="small muted">Nothing logged yet.</p>}
    </section>
  );
}

/**
 * A linked partner's progress, view only: weight change next to yours, their shots and how
 * regularly they've been logged, and their latest entries.
 */
export function PartnerView({ onAccount }: { onAccount: () => void }) {
  const acct = useAccount();
  const { partners, logs, loading, error, fetchedAt } = usePartners();
  const mine = useLedger();
  const [pick, setPick] = useState<string | null>(null);
  const [days, setDays] = useState<30 | 90 | 0>(0);
  const now = new Date();

  if (!acct.configured || !acct.user || !partners.length) {
    return (
      <section className="view">
        <Mast>
          <Kinetic a="Track progress together." />
          <p className="rise" style={rise(4)}>Link accounts with your partner and you'll each see the other's weight and shots next to your own. Neither of you can change the other's log.</p>
          <div className="head-actions rise" style={rise(5)}>
            {loading && acct.user ? <span className="small">Checking for a linked partner…</span>
              : <button className="btn" onClick={onAccount}>{acct.user ? 'Link your partner' : 'Sign in to link'}</button>}
          </div>
        </Mast>
        {error && <p className="alert warn"><b>Couldn't load your partner.</b><span>{error}</span></p>}
      </section>
    );
  }

  const p = partners.find(x => x.id === pick) ?? partners[0];
  const log = logs[p.id] ?? { version: 1, regimens: [], doses: [], checkins: [] };
  const name = firstName(p.name);
  const unit = mine.checkins.find(c => c.weightUnit)?.weightUnit ?? log.checkins.find(c => c.weightUnit)?.weightUnit ?? 'lb';
  const since = days ? startOfDay(now).getTime() - (days - 1) * DAY : 0;

  const theirs = weightChange(log.checkins, unit, since);
  const yours = weightChange(mine.checkins, unit, since);
  // Change since each person's first weigh-in in the range, so both lines start at zero.
  const series = (cs: Checkin[], who: string) => {
    const w = weighIns(cs, unit, since);
    return w.map(x => ({ x: x.at, y: x.w - w[0].w, tip: `${who}, ${fmtShort(x.at)}: ${fmtNum(x.w, 1)} ${unit} (${signed(x.w - w[0].w, unit)})` }));
  };
  const sT = series(log.checkins, name), sY = series(mine.checkins, 'You');
  const ys = [...sT, ...sY].map(x => x.y);
  const lo = Math.floor(Math.min(0, ...ys) - 1), hi = Math.ceil(Math.max(0, ...ys) + 1);
  // Label zero and whichever ends are far enough from it not to collide.
  const ticks = [lo, 0, hi].filter(t => t === 0 || Math.abs(t) >= (hi - lo) * 0.2);
  const x0 = days ? since : Math.min(...[...sT, ...sY].map(x => x.x.getTime()));
  const startDay = theirs ? fmtShort(theirs.first.at) : '';

  const active = log.regimens.filter(r => !r.paused);
  const line2 = theirs && theirs.count > 1
    ? `${theirs.change < 0 ? 'Down' : theirs.change > 0 ? 'Up' : 'Even'}${theirs.change ? ` ${Math.abs(theirs.change).toFixed(1)} ${unit}` : ''} since ${startDay}.`
    : 'No weight trend yet.';

  return (
    <section className="view">
      <Mast>
        <p className="when rise"><b>Partner</b><span>View only</span></p>
        <Kinetic a={`${name}'s progress.`} b={line2} />
        <div className="seg rise" role="group" aria-label="Time range" style={rise(2)}>
          {RANGES.map(([d, l]) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{l}</button>)}
        </div>
      </Mast>

      {partners.length > 1 && (
        <div className="pick rise" role="group" aria-label="Partner" style={{ margin: 0, padding: 0 }}>
          {partners.map(x => <button key={x.id} type="button" className="fchip" aria-pressed={x.id === p.id} onClick={() => setPick(x.id)}>{firstName(x.name)}</button>)}
        </div>
      )}

      <section className="tile lilac rise" aria-labelledby="p-wt-h" style={rise(2)}>
        <div className="spread"><h2 id="p-wt-h" className="label">Weight change, together</h2><span className="count">{unit}</span></div>
        <div className="together">
          <div className="inset">
            <div className="xsmall muted">{name}</div>
            <b className="num" style={{ color: 'var(--peach-ink)' }}>{theirs && theirs.count > 1 ? signed(theirs.change, unit) : '–'}</b>
            <div className="xsmall muted">{theirs ? `${fmtNum(theirs.last.w, 1)} ${unit} now` : 'No weigh-ins'}</div>
          </div>
          <div className="inset">
            <div className="xsmall muted">You</div>
            <b className="num" style={{ color: 'var(--lilac-ink)' }}>{yours && yours.count > 1 ? signed(yours.change, unit) : '–'}</b>
            <div className="xsmall muted">{yours ? `${fmtNum(yours.last.w, 1)} ${unit} now` : 'No weigh-ins'}</div>
          </div>
        </div>
        {sT.length + sY.length >= 2 && (sY.length || sT.length) ? (
          <>
            <LineChart points={sY.length ? sY : sT} points2={sY.length ? sT : []} y0={lo} y1={hi} ticks={ticks}
              x0={x0} x1={now.getTime()} label={`Weight change since the start of the range: you and ${name}`} fmt={v => (v > 0 ? `+${fmtNum(v, 1)}` : fmtNum(v, 1))} />
            <div className="legend" style={{ color: 'var(--ink-2)' }}>
              {sY.length > 0 && <span><i style={{ background: 'var(--chart-line)' }} />You</span>}
              {sT.length > 0 && <span><i className={sY.length ? 'two' : ''} style={sY.length ? undefined : { background: 'var(--chart-line)' }} />{name}</span>}
            </div>
          </>
        ) : <p className="small muted">Weigh-ins from either of you show up here as a line, starting from zero so you can compare.</p>}
      </section>

      <section className="tile mint rise" aria-labelledby="p-shots-h" style={rise(3)}>
        <h2 id="p-shots-h" className="label">{name}'s shots</h2>
        {active.length ? active.map(r => {
          const st = regimenStatus(r, log.doses, now);
          const adh = adherence([r], log.doses, now, 28);
          const strip = adherenceDays(r.id, log.doses, 28, now);
          return (
            <div key={r.id} className="stack" style={{ gap: 8 }}>
              <div className="spread">
                <b>{regName(r)} · {fmtNum(Number(r.dose), 3)} {r.unit}</b>
                <span className="sub" style={{ color: 'var(--mint-2)' }}>{freqText(r)}</span>
              </div>
              <div className="spread" style={{ color: 'var(--mint-2)' }}>
                <span className="small">{st.last ? `Last ${fmtDay(st.last)}` : 'Not logged yet'}</span>
                <span className="small" style={{ fontWeight: 600, color: st.s === 'late' ? 'var(--danger)' : 'var(--mint-ink)' }}>{st.text}</span>
              </div>
              <span className="strip28" role="img" aria-label={`Last 4 weeks: ${name} logged ${r.name || regName(r)} on ${strip.filter(d => d.on).length} days`}>
                {strip.map((d, i) => <i key={i} className={`${d.on ? 'on' : ''}${d.today ? ' today' : ''}`} title={fmtDay(d.date)} />)}
              </span>
              {adh.expected > 0 && <span className="xsmall" style={{ color: 'var(--mint-2)' }}>{adh.logged} of {adh.expected} due doses logged in 4 weeks</span>}
            </div>
          );
        }) : <p className="small" style={{ color: 'var(--mint-2)' }}>{name} isn't tracking a peptide yet.</p>}
      </section>

      <Recent log={log} name={name} />

      <div className="spread" style={{ alignItems: 'center', padding: '0 4px' }}>
        <span className="xsmall muted">{loading ? 'Updating…' : fetchedAt ? `Updated ${fmtTime(new Date(fetchedAt))}` : ''}{error ? ` · ${error}` : ''}</span>
        <button className="btn quiet sm" onClick={() => void refreshPartners(true)} disabled={loading}>Refresh</button>
      </div>
      <p className="xsmall muted" style={{ padding: '0 4px' }}>You can see {name}'s log but can't change it. To stop sharing, unlink in your account.</p>
    </section>
  );
}
