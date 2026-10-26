import { useEffect, useMemo, useState } from 'react';
import type { FamilyKey, LegalKey, Peptide, Tier } from '../lib/types';
import { PEPTIDES } from '../data/peptides';
import { AS_OF, FAMILIES, LEGAL, TIERS } from '../data/reference';
import { fmtNum } from '../lib/format';
import { Ladder, LegalChip, SeqStrip, TierChip } from '../components/Chips';

const TIER_LIST: Tier[] = [1, 2, 3, 4, 5];

type Filters = { q: string; fam: 'all' | FamilyKey; tier: 'all' | `${Tier}`; legal: 'all' | LegalKey };
const FILTER_KEY = 'pl-lib';

function loadFilters(): Filters {
  const base: Filters = { q: '', fam: 'all', tier: 'all', legal: 'all' };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(FILTER_KEY) || '{}'), q: '' };
  } catch {
    return base;
  }
}

export function matches(p: Peptide, f: Filters) {
  if (f.fam !== 'all' && p.family !== f.fam) return false;
  if (f.tier !== 'all' && String(p.tier) !== f.tier) return false;
  if (f.legal !== 'all' && p.legal !== f.legal) return false;
  const q = f.q.trim().toLowerCase();
  if (!q) return true;
  const hay = [p.name, ...(p.aka ?? []), FAMILIES[p.family]?.name, p.summary, ...(p.goals ?? [])].join(' ').toLowerCase();
  return q.split(/\s+/).every(w => hay.includes(w));
}

/** Top 10 by engagement, each bar colored by evidence tier: the most-hyped compounds sit low on the ladder. */
function TopChart() {
  const top = PEPTIDES.filter(p => p.popularity).sort((a, b) => b.popularity! - a.popularity!).slice(0, 10);
  if (!top.length) return null;
  const step = 5000;
  const ticksMax = Math.ceil(Math.max(...top.map(p => p.popularity!)) / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= ticksMax; t += step) ticks.push(t);
  const pct = (v: number) => (v / ticksMax) * 100;
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>The most-discussed peptides mostly have the weakest evidence</h3>
          <p className="small muted" style={{ marginTop: 4 }}>
            30-day engagement on Reddit and YouTube as of October 2026 (from the source overview, via humanpeptides.fyi), colored by evidence tier.
          </p>
        </div>
      </div>
      <div className="row-wrap small muted" style={{ gap: 14, marginBottom: 12 }}>
        {TIER_LIST.map(t => (
          <span key={t} className="row-wrap" style={{ gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, display: 'inline-block', background: `var(--t${t})` }} />T{t} {TIERS[t].label}
          </span>
        ))}
      </div>
      <div className="hbar" role="list" aria-label="Top 10 peptides by engagement, with evidence tier" style={{ gridTemplateRows: `repeat(${top.length}, auto) auto` }}>
        <div className="hbar-grid" aria-hidden="true" style={{ gridRow: `1 / ${top.length + 1}` }}>
          {ticks.map(t => <span key={t} style={{ left: `${pct(t)}%` }} />)}
        </div>
        {top.map((p, i) => (
          <a key={p.id} className="hbar-row" role="listitem" href={`#${p.id}`} style={{ gridRow: i + 1 }}
            title={`${p.name}: ${fmtNum(p.popularity!, 0)} engagement points, Tier ${p.tier} (${TIERS[p.tier].label})`}>
            <span className="hbar-label">{p.name}</span>
            <span className="hbar-track">
              <span className="hbar-fill" style={{ width: `max(${pct(p.popularity!)}%, 4px)`, background: `var(--t${p.tier})` }} />
              <span className="hbar-val" style={{ left: `max(${pct(p.popularity!)}%, 4px)` }}>{fmtNum(p.popularity!, 0)} · T{p.tier}</span>
            </span>
          </a>
        ))}
        <div className="hbar-axis" aria-hidden="true" style={{ gridRow: top.length + 1 }}>
          {ticks.map(t => <span key={t} style={{ left: `${pct(t)}%` }}>{t ? `${t / 1000}K` : '0'}</span>)}
        </div>
      </div>
    </section>
  );
}

function TierOverview() {
  return (
    <div className="tiers">
      {TIER_LIST.map(t => (
        <div className="tier-row" key={t}>
          <div className="what"><Ladder t={t} /><b>Tier {t}: {TIERS[t].label}</b><span>{TIERS[t].long}</span></div>
          <div className="names">
            {PEPTIDES.filter(p => p.tier === t).map(p => <a key={p.id} href={`#${p.id}`}>{p.name}</a>)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LibraryView() {
  const [f, setF] = useState<Filters>(loadFilters);
  useEffect(() => {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify({ ...f, q: '' })); } catch { /* storage blocked */ }
  }, [f]);
  const list = useMemo(
    () => PEPTIDES.filter(p => matches(p, f)).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || a.name.localeCompare(b.name)),
    [f],
  );
  const chip = <K extends keyof Filters>(key: K, val: Filters[K], label: string, dot?: string) => (
    <button key={String(val)} className="fchip" aria-pressed={f[key] === val} onClick={() => setF({ ...f, [key]: val })}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />}
      {label}
    </button>
  );
  const usedLegal = (Object.keys(LEGAL) as LegalKey[]).filter(k => PEPTIDES.some(p => p.legal === k));
  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h1>Peptide library</h1>
          <p>{PEPTIDES.length} compounds that trend online, with what the evidence shows, how they're regulated in the US, and the warning signs to know. Updated {AS_OF}.</p>
        </div>
      </div>
      <TopChart />
      <details className="panel">
        <summary style={{ cursor: 'pointer' }}><b>How evidence tiers work</b> <span className="small muted">· every compound sorted from approved to unstudied</span></summary>
        <div style={{ marginTop: 14 }}><TierOverview /></div>
      </details>
      <div className="filters">
        <label className="sr-only" htmlFor="lib-q">Search peptides</label>
        <input type="search" id="lib-q" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} placeholder="Search by name, nickname, or goal (e.g. tendon, sleep, tan)" autoComplete="off" />
        <div className="filter-row"><span className="label">Evidence</span>{chip('tier', 'all', 'All')}{TIER_LIST.map(t => chip('tier', `${t}` as const, `T${t} ${TIERS[t].label}`, `var(--t${t})`))}</div>
        <div className="filter-row"><span className="label">Category</span>{chip('fam', 'all', 'All')}{(Object.keys(FAMILIES) as FamilyKey[]).map(k => chip('fam', k, FAMILIES[k].name))}</div>
        <div className="filter-row"><span className="label">US status</span>{chip('legal', 'all', 'All')}{usedLegal.map(k => chip('legal', k, LEGAL[k].label))}</div>
      </div>
      <div className="count" aria-live="polite">{list.length === PEPTIDES.length ? `Showing all ${list.length}` : `Showing ${list.length} of ${PEPTIDES.length}`}</div>
      <div className="cards">
        {list.length ? list.map(p => (
          <a className="card" href={`#${p.id}`} key={p.id}>
            <div className="top">
              <div><h3>{p.name}</h3>{p.aka?.length ? <div className="aka">{p.aka.slice(0, 3).join(' · ')}</div> : null}</div>
              <Ladder t={p.tier} />
            </div>
            <div className="row-wrap"><TierChip t={p.tier} /><LegalChip k={p.legal} /></div>
            <p className="sum">{p.summary}</p>
            <SeqStrip p={p} />
            <div className="xsmall faint">{FAMILIES[p.family]?.name}{p.isPeptide === false ? ' · not technically a peptide' : ''}</div>
          </a>
        )) : (
          <div className="empty">
            <h3>No matches</h3>
            <p className="small muted">Try a different word or clear a filter.</p>
            <button className="btn ghost sm" onClick={() => setF({ q: '', fam: 'all', tier: 'all', legal: 'all' })}>Clear filters</button>
          </div>
        )}
      </div>
    </section>
  );
}
