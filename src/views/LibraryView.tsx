import { useEffect, useMemo, useState } from 'react';
import type { FamilyKey, LegalKey, Peptide, Tier } from '../lib/types';
import { PEP, PEPTIDES } from '../data/peptides';
import { AS_OF, FAMILIES, LEGAL, TIERS } from '../data/reference';
import { fmtNum } from '../lib/format';
import { Fields, Ladder, LegalText, SeqStrip } from '../components/Chips';
import { CloseIcon, SearchIcon } from '../components/Icons';
import { PeptideDetail } from './PeptideDetail';

const TIER_LIST: Tier[] = [1, 2, 3, 4, 5];

type Filters = { q: string; fam: 'all' | FamilyKey; tier: 'all' | `${Tier}`; legal: 'all' | LegalKey };
type Sort = 'popular' | 'evidence' | 'az';
const FILTER_KEY = 'pl-lib';
const NO_FILTERS: Filters = { q: '', fam: 'all', tier: 'all', legal: 'all' };

function loadFilters(): Filters {
  try {
    return { ...NO_FILTERS, ...JSON.parse(localStorage.getItem(FILTER_KEY) || '{}'), q: '' };
  } catch {
    return NO_FILTERS;
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

const SORTS: Record<Sort, [label: string, cmp: (a: Peptide, b: Peptide) => number]> = {
  popular: ['Most discussed', (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || a.name.localeCompare(b.name)],
  evidence: ['Strongest evidence', (a, b) => a.tier - b.tier || (b.popularity ?? 0) - (a.popularity ?? 0)],
  az: ['A to Z', (a, b) => a.name.localeCompare(b.name)],
};

const fmtK = (n: number) => (n >= 1000 ? `${fmtNum(n / 1000, 1)}K` : String(n));
const TierSwatch = ({ t }: { t: Tier }) => <span className="swatch" style={{ background: `var(--t${t})` }} />;

/** Top 10 by engagement, each bar colored by evidence tier: the most-hyped compounds sit low on the ladder. */
function TopChart() {
  const top = PEPTIDES.filter(p => p.popularity).sort((a, b) => b.popularity! - a.popularity!).slice(0, 10);
  if (!top.length) return null;
  const max = top[0].popularity!;
  return (
    <section className="panel stack hype-chart" aria-labelledby="hype-h">
      <div>
        <h2 id="hype-h" className="h-card">Most discussed is not best studied</h2>
        <p className="small muted">Top 10 by 30-day Reddit and YouTube engagement, {AS_OF.replace(/ \d+,/, '')}, colored by evidence tier.</p>
      </div>
      <ol className="hbars" aria-label="Top 10 peptides by engagement, with evidence tier">
        {top.map(p => (
          <li key={p.id}>
            <a href={`#${p.id}`} title={`${p.name}: ${fmtNum(p.popularity!, 0)} engagement points, Tier ${p.tier} (${TIERS[p.tier].label})`}>
              <span className="hb-name">{p.name}</span>
              <span className="hb-track"><span style={{ width: `max(${(p.popularity! / max) * 100}%, 3px)`, background: `var(--t${p.tier})` }} /></span>
              <span className="hb-val mono">{fmtK(p.popularity!)} · T{p.tier}</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="xsmall faint">Engagement points from the source overview, via humanpeptides.fyi.</p>
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

function PeptideCard({ p }: { p: Peptide }) {
  return (
    <a className="card label-card" href={`#${p.id}`}>
      <div className="lc-head">
        <div className="stack" style={{ gap: 2, minWidth: 0 }}>
          <h3>{p.name}</h3>
          {p.aka?.length ? <span className="aka">{p.aka.slice(0, 3).join(' · ')}</span> : null}
        </div>
        <Ladder t={p.tier} />
      </div>
      <Fields items={[
        ['Evidence', <span className="with-swatch"><TierSwatch t={p.tier} />T{p.tier} {TIERS[p.tier].label}</span>],
        ['US status', <LegalText k={p.legal} />],
      ]} />
      <div className="lc-body">
        <p className="sum">{p.summary}</p>
        <SeqStrip p={p} />
        <span className="xsmall faint">{FAMILIES[p.family]?.name}{p.isPeptide === false ? ' · not technically a peptide' : ''}</span>
      </div>
    </a>
  );
}

export function LibraryView({ selected, onTrack }: { selected: string | null; onTrack: (id: string) => void }) {
  const [f, setF] = useState<Filters>(loadFilters);
  const [sort, setSort] = useState<Sort>('popular');
  useEffect(() => {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify({ ...f, q: '' })); } catch { /* storage blocked */ }
  }, [f]);
  const list = useMemo(() => PEPTIDES.filter(p => matches(p, f)).sort(SORTS[sort][1]), [f, sort]);
  const filtered = f.q.trim() !== '' || f.fam !== 'all' || f.tier !== 'all' || f.legal !== 'all';
  const usedLegal = (Object.keys(LEGAL) as LegalKey[]).filter(k => PEPTIDES.some(p => p.legal === k));

  const chip = <K extends keyof Filters>(key: K, val: Filters[K], label: string, swatch?: Tier) => {
    const on = f[key] === val;
    return (
      <button key={String(val)} className="fchip" aria-pressed={on} onClick={() => setF({ ...f, [key]: on && val !== 'all' ? 'all' : val })}>
        {swatch && <TierSwatch t={swatch} />}
        {label}
        {on && val !== 'all' && <CloseIcon size={14} />}
      </button>
    );
  };
  const search = (id: string) => (
    <label className="search">
      <SearchIcon />
      <span className="sr-only">Search peptides</span>
      <input type="search" id={id} value={f.q} onChange={e => setF({ ...f, q: e.target.value })} placeholder="Name, nickname or goal: tendon, sleep, tan" autoComplete="off" />
    </label>
  );
  const clear = <button className="btn ghost sm" onClick={() => setF(NO_FILTERS)}>Clear filters</button>;

  const p = selected ? PEP[selected] : null;
  if (p) {
    // Wide screens keep a compact, filterable list beside the compound; phones show the compound alone.
    return (
      <div className="lib-split">
        <aside className="lib-side" aria-label="All peptides">
          <div className="lib-side-head">
            <a href="#library" className="h-card">Library</a>
            <span className="count">{list.length} of {PEPTIDES.length}</span>
          </div>
          {search('lib-q-side')}
          <div className="chip-row" role="group" aria-label="Evidence">
            {chip('tier', 'all', 'All')}
            {TIER_LIST.map(t => chip('tier', `${t}` as const, `T${t}`, t))}
          </div>
          <ul className="lib-rows">
            {list.map(x => (
              <li key={x.id}>
                <a href={`#${x.id}`} aria-current={x.id === p.id ? 'page' : undefined}>
                  <Ladder t={x.tier} />
                  <span className="lr-name"><b>{x.name}</b><LegalText k={x.legal} /></span>
                  {x.popularity ? <span className="mono xsmall faint">{fmtK(x.popularity)}</span> : null}
                </a>
              </li>
            ))}
            {!list.length && <li className="small muted" style={{ padding: 12 }}>No matches. {clear}</li>}
          </ul>
        </aside>
        <PeptideDetail p={p} onTrack={onTrack} />
      </div>
    );
  }

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h1>Library</h1>
          <p>{PEPTIDES.length} compounds that trend online, with what the evidence shows, how the US regulates them, and the warning signs to know. Updated {AS_OF}.</p>
        </div>
      </div>
      <div className="lib-top">
        <div className="filters">
          {search('lib-q')}
          <div className="filter-group" role="group" aria-labelledby="f-ev">
            <span id="f-ev" className="label">Evidence</span>
            <div className="chip-row">{chip('tier', 'all', 'All')}{TIER_LIST.map(t => chip('tier', `${t}` as const, `T${t} ${TIERS[t].label}`, t))}</div>
          </div>
          <div className="filter-group" role="group" aria-labelledby="f-cat">
            <span id="f-cat" className="label">Category</span>
            <div className="chip-row">{chip('fam', 'all', 'All')}{(Object.keys(FAMILIES) as FamilyKey[]).map(k => chip('fam', k, FAMILIES[k].name))}</div>
          </div>
          <div className="filter-group" role="group" aria-labelledby="f-us">
            <span id="f-us" className="label">US status</span>
            <div className="chip-row">{chip('legal', 'all', 'All')}{usedLegal.map(k => chip('legal', k, LEGAL[k].label))}</div>
          </div>
        </div>
        <TopChart />
      </div>
      <details className="panel tier-explainer">
        <summary><b>How evidence tiers work</b> <span className="small muted">· every compound sorted from approved to unstudied</span></summary>
        <div style={{ marginTop: 14 }}><TierOverview /></div>
      </details>
      <div className="list-bar">
        <span aria-live="polite"><b>{list.length}</b> <span className="muted">{filtered ? `of ${PEPTIDES.length}` : 'compounds'}</span></span>
        <label className="sort">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={e => setSort(e.target.value as Sort)}>
            {(Object.keys(SORTS) as Sort[]).map(k => <option key={k} value={k}>{SORTS[k][0]}</option>)}
          </select>
        </label>
      </div>
      <div className="cards">
        {list.length ? list.map(x => <PeptideCard key={x.id} p={x} />) : (
          <div className="empty">
            <h3>No matches</h3>
            <p className="small muted">Try a different word or clear a filter.</p>
            {clear}
          </div>
        )}
      </div>
    </section>
  );
}
