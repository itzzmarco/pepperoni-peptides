import { useEffect, useMemo, useState } from 'react';
import type { FamilyKey, LegalKey, Peptide, Tier } from '../lib/types';
import { PEPTIDES } from '../data/peptides';
import { AS_OF, FAMILIES, LEGAL, TIERS } from '../data/reference';
import { fmtNum } from '../lib/format';
import { Ladder, LegalChip, TierChip } from '../components/Chips';

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
    <section className="tile rise" style={{ ['--i' as string]: 4 }}>
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Hype vs evidence</span>
        <h3>The most-discussed peptides mostly have the weakest evidence</h3>
        <p className="small muted">
          30-day engagement on Reddit and YouTube as of October 2026 (from the source overview, via humanpeptides.fyi), colored by evidence tier.
        </p>
      </div>
      <div className="legend">
        {TIER_LIST.map(t => <span key={t}><i style={{ background: `var(--t${t})` }} />T{t} {TIERS[t].label}</span>)}
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
              <span className="hbar-fill grow" style={{ width: `max(${pct(p.popularity!)}%, 4px)`, background: `var(--t${p.tier})`, ['--i' as string]: i }} />
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

const GUIDES = [
  { href: '#calculator', tone: 'lilac', title: 'Dose math, step by step', sub: 'Vial, water and syringe units', icon: 'M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2M8.5 2h7M14.5 16h-5' },
  { href: '#safety', tone: 'peach', title: 'Safety & law', sub: 'Warning signs and US rules', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];

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
  const trialBacked = PEPTIDES.filter(p => p.tier <= 2).length;
  return (
    <section className="view">
      <header className="head rise">
        <span className="eyebrow">Learn</span>
        <h1>What the evidence says.<br /><span className="soft">{PEPTIDES.length} peptides, graded.</span></h1>
        <p>Compounds that trend online, with what studies show, how they're regulated in the US, and the warning signs to know. Updated {AS_OF}.</p>
      </header>
      <div className="search rise" style={{ ['--i' as string]: 1 }}>
        <label className="sr-only" htmlFor="lib-q">Search peptides</label>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input type="search" id="lib-q" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} placeholder="Search name, nickname or goal" autoComplete="off" />
      </div>

      <div className="bento rise" style={{ ['--i' as string]: 2 }}>
        {GUIDES.map(g => (
          <a key={g.href} href={g.href} className={`tile ${g.tone}`} style={{ gap: 10 }}>
            <span className="badge-icon" style={{ width: 44, height: 44, background: 'var(--surface)', color: `var(--${g.tone}-ink)` }} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={g.icon} /></svg>
            </span>
            <span style={{ fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.2 }}>{g.title}</span>
            <span className="sub">{g.sub}</span>
          </a>
        ))}
        <details className="tile mint span-2">
          <summary className="spread" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
            <span className="stack" style={{ gap: 4 }}>
              <span className="label">How evidence tiers work</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.25 }}>Only {trialBacked} of {PEPTIDES.length} have randomized human trials</span>
            </span>
            <span className="arrow" aria-hidden="true"><svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></span>
          </summary>
          <TierOverview />
        </details>
      </div>

      <TopChart />

      <div className="section-title"><h2>Library</h2><span className="count" aria-live="polite">{list.length === PEPTIDES.length ? `All ${list.length}` : `${list.length} of ${PEPTIDES.length}`}</span></div>
      <div className="filters">
        <div className="filter-row"><span className="label muted">Evidence</span>{chip('tier', 'all', 'All')}{TIER_LIST.map(t => chip('tier', `${t}` as const, `T${t} ${TIERS[t].label}`, `var(--t${t})`))}</div>
        <div className="filter-row"><span className="label muted">Category</span>{chip('fam', 'all', 'All')}{(Object.keys(FAMILIES) as FamilyKey[]).map(k => chip('fam', k, FAMILIES[k].name))}</div>
        <div className="filter-row"><span className="label muted">US status</span>{chip('legal', 'all', 'All')}{usedLegal.map(k => chip('legal', k, LEGAL[k].label))}</div>
      </div>
      <div className="cards">
        {list.length ? list.map(p => (
          <a className="card" href={`#${p.id}`} key={p.id}>
            <div><h3>{p.name}</h3>{p.aka?.length ? <div className="aka">{p.aka.slice(0, 2).join(' · ')}</div> : null}</div>
            <Ladder t={p.tier} />
            <p className="sum">{p.summary}</p>
            <div className="row-wrap"><TierChip t={p.tier} /><LegalChip k={p.legal} /></div>
          </a>
        )) : (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <h3>No matches</h3>
            <p className="small muted">Try a different word or clear a filter.</p>
            <button className="btn ghost sm" onClick={() => setF({ q: '', fam: 'all', tier: 'all', legal: 'all' })}>Clear filters</button>
          </div>
        )}
      </div>
    </section>
  );
}
