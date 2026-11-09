import { flushSync } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import type { FamilyKey, LegalKey, Peptide, Tier } from '../lib/types';
import { PEPTIDES } from '../data/peptides';
import { AS_OF, FAMILIES, LEGAL, TIERS } from '../data/reference';
import { fmtNum } from '../lib/format';
import { Ladder, LegalChip } from '../components/Chips';
import { FamilyGlyph } from '../components/FamilyGlyph';
import { IlloSearch } from '../components/Illustration';
import { prefersReducedMotion, viewTransition } from '../components/Motion';

const TIER_LIST: Tier[] = [1, 2, 3, 4, 5];

type Filters = { q: string; fam: 'all' | FamilyKey; tier: 'all' | `${Tier}`; legal: 'all' | LegalKey };
const FILTER_KEY = 'pl-lib';
/** Kept in memory for this visit only (never stored): the query, and where the page was when a profile was opened,
    so coming back from a profile shows the same results at the same place. */
const back: { q: string; y: number | null } = { q: '', y: null };

function loadFilters(): Filters {
  const base: Filters = { q: '', fam: 'all', tier: 'all', legal: 'all' };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(FILTER_KEY) || '{}'), q: back.q };
  } catch {
    return { ...base, q: back.q };
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
    <section className="tile rise" style={{ ['--i' as string]: 2 }}>
      <div className="stack gap-1">
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
          <a key={p.id} className="hbar-row" role="listitem" href={`#${p.id}`} style={{ gridRow: i + 1, ['--i' as string]: i }}
            title={`${p.name}: ${fmtNum(p.popularity!, 0)} engagement points, Tier ${p.tier} (${TIERS[p.tier].label})`}>
            <span className="hbar-label">{p.name}</span>
            <span className="hbar-track">
              <span className="hbar-fill grow" style={{ width: `max(${pct(p.popularity!)}%, 4px)`, background: `var(--t${p.tier})` }} />
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

/** A sideways-scrolling chip row. Its name stays pinned at the start; its right edge fades and shows an arrow only while more chips sit off screen. */
function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const check = useCallback(() => {
    const el = ref.current;
    if (el) setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);
  useEffect(() => {
    // Back on Learn with a filter kept from before: bring its chip into view so the choice isn't hidden off the row's end.
    const el = ref.current, on = el?.querySelector('[aria-pressed="true"]');
    if (el && on) {
      const past = on.getBoundingClientRect().right - el.getBoundingClientRect().right;
      if (past > 0) el.scrollLeft += past + 48;
    }
    check();
    // The row's own size, not the window's: a row inside More filters has no width until the disclosure opens, so its
    // arrow and edge fade are measured again the moment it shows, as well as on any resize.
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [check]);
  // While chips sit off screen a round arrow at the end says so, and a tap brings the next ones in.
  const next = () => ref.current?.scrollBy({ left: ref.current.clientWidth * 0.7, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  return (
    <div className="filter-wrap">
      <div className="filter-row" ref={ref} onScroll={check} data-more={more || undefined}>
        <span className="label muted">{label}</span>{children}
      </div>
      {more && (
        <button type="button" className="filter-more" onClick={next} aria-label={`More ${label} filters`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      )}
    </div>
  );
}

const GUIDES = [
  { href: '#calculator', tone: 'lilac', title: 'Dose math, step by step', icon: 'M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2M8.5 2h7M14.5 16h-5' },
  { href: '#safety', tone: 'peach', title: 'Safety & law', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];

/** How long typing must pause before the grid follows the search box in one transition. */
const SETTLE_MS = 180;

export function LibraryView() {
  const [f, setRaw] = useState<Filters>(loadFilters);
  // Searching or filtering moves the cards instead of snapping them: the box and chips update at once, and the grid
  // follows inside a view transition where each card has its own name (see :root[data-filtering] in styles.css), so
  // cards that stay slide and the rest fade. Reduced motion, or no view transitions, updates the grid at once.
  // Typing waits for a short pause (SETTLE_MS) so a word animates the grid once, not once per keystroke; chips move it at once.
  const [applied, setApplied] = useState(f);
  const seq = useRef(0);
  const typing = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(typing.current), []);
  // Only cards within a screen of the viewport get a name (data-vt), before the change and again after it, so the
  // transition snapshots a dozen cards, not the whole library; the rest swap without animation.
  const grid = useRef<HTMLDivElement>(null);
  const nameNear = () => {
    const h = window.innerHeight;
    for (const c of Array.from(grid.current?.children ?? [])) {
      const b = c.getBoundingClientRect();
      c.toggleAttribute('data-vt', b.bottom > -h && b.top < 2 * h);
    }
  };
  const apply = (next: Filters) => {
    const start = viewTransition();
    if (!start) { setApplied(next); return; }
    const root = document.documentElement, mine = ++seq.current;
    const done = () => { if (mine === seq.current) delete root.dataset.filtering; };
    nameNear();
    root.dataset.filtering = '';
    try { start(() => { flushSync(() => setApplied(next)); nameNear(); }).finished.then(done, done); } catch { done(); setApplied(next); }
  };
  const setF = (next: Filters) => {
    setRaw(next);
    clearTimeout(typing.current);
    if (next.q !== f.q && viewTransition()) typing.current = setTimeout(() => apply(next), SETTLE_MS);
    else apply(next);
  };
  useEffect(() => {
    back.q = f.q;
    try { localStorage.setItem(FILTER_KEY, JSON.stringify({ ...f, q: '' })); } catch { /* storage blocked */ }
  }, [f]);
  // Back from a profile: return to the spot it was opened from. A layout effect, so it lands before the route fade's
  // new snapshot and after App's scroll to the top.
  useLayoutEffect(() => {
    if (back.y != null) window.scrollTo(0, back.y);
    back.y = null;
  }, []);
  // Any link to a profile (cards, chart rows, tier lists) remembers where the page was.
  const remember = (e: MouseEvent) => {
    const a = (e.target as Element).closest('a[href^="#"]');
    if (a && !GUIDES.some(g => g.href === a.getAttribute('href'))) back.y = window.scrollY;
  };
  const list = useMemo(
    () => PEPTIDES.filter(p => matches(p, applied)).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || a.name.localeCompare(b.name)),
    [applied],
  );
  const chip = <K extends keyof Filters>(key: K, val: Filters[K], label: string, dot?: string) => (
    <button key={String(val)} className="fchip" aria-pressed={f[key] === val} onClick={() => setF({ ...f, [key]: val })}>
      {dot && <span className="dot" style={{ background: dot }} />}
      {label}
    </button>
  );
  const usedLegal = (Object.keys(LEGAL) as LegalKey[]).filter(k => PEPTIDES.some(p => p.legal === k));
  const trialBacked = PEPTIDES.filter(p => p.tier <= 2).length;
  const moreOn = (f.fam !== 'all' ? 1 : 0) + (f.legal !== 'all' ? 1 : 0);
  // Opens by itself only when the page loads with one of its filters already set; after that it is the user's.
  const [moreAtStart] = useState(moreOn > 0);
  const count = list.length === PEPTIDES.length ? `All ${list.length}` : `${list.length} of ${PEPTIDES.length}`;
  // A button, not a #tiers link: the hash is the route, so a fragment link would leave Learn.
  // Only the card being opened carries the shared glyph name, since a view transition needs each name to be unique.
  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    for (const c of Array.from(e.currentTarget.parentElement?.children ?? [])) c.removeAttribute('data-opening');
    e.currentTarget.setAttribute('data-opening', '');
  };
  const showTiers = () => {
    const d = document.getElementById('tiers') as HTMLDetailsElement | null;
    if (!d) return;
    d.open = true;
    d.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    d.querySelector('summary')?.focus({ preventScroll: true });
  };
  return (
    <section className="view" onClickCapture={remember}>
      <header className="head rise">
        <span className="eyebrow">Learn</span>
        <h1>What the evidence says.<br /><span className="soft">{PEPTIDES.length} peptides, graded.</span></h1>
        <p>Compounds that trend online, with what studies show, how they're regulated in the US, and the warning signs to know. Updated {AS_OF}.</p>
        {/* The two guides are one tap from the top, so the spot after the library goes to the tier explainer. */}
        <nav className="row-wrap" aria-label="Guides">
          {GUIDES.map(g => (
            <a key={g.href} href={g.href} className="btn soft sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={`var(--${g.tone}-ink)`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={g.icon} /></svg>
              {g.title}
            </a>
          ))}
        </nav>
      </header>
      {/* Finding a peptide is the main job here, so search, one filter row and the results sit together right under the
          title, and the first cards show on a phone's first screen. The other filters fold away under More filters. */}
      <div className="search">
        <label className="sr-only" htmlFor="lib-q">Search peptides</label>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input type="search" id="lib-q" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} placeholder="Search name, nickname or goal" autoComplete="off" />
      </div>
      <div className="filters">
        <FilterRow label="Evidence">{chip('tier', 'all', 'All')}{TIER_LIST.map(t => chip('tier', `${t}` as const, `T${t} ${TIERS[t].label}`, `var(--t${t})`))}</FilterRow>
        <details className="more-filters" open={moreAtStart}>
          <summary>
            <span className="fchip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
              More filters{moreOn ? ` (${moreOn})` : ''}
            </span>
            <span className="count" aria-hidden="true">{count}</span>
          </summary>
          <div className="filters">
            <FilterRow label="Category">{chip('fam', 'all', 'All')}{(Object.keys(FAMILIES) as FamilyKey[]).map(k => chip('fam', k, FAMILIES[k].name))}</FilterRow>
            <FilterRow label="US status">{chip('legal', 'all', 'All')}{usedLegal.map(k => chip('legal', k, LEGAL[k].label))}</FilterRow>
            {/* Every card shows a tier, but the explainer sits after the library; this opens it and jumps there. */}
            <button type="button" className="linkish small self-start tap" onClick={showTiers}>What do tiers mean?</button>
          </div>
        </details>
      </div>
      <p className="sr-only" aria-live="polite">{count}</p>
      <div className="cards" ref={grid}>
        {list.length ? list.map(p => (
          // The name leads; family and tier share one quiet line under it, and legal status is the only chip.
          // The tapped card marks its glyph, which travels into the profile header as the page opens (styles.css).
          <a className="card" href={`#${p.id}`} key={p.id} data-t={p.tier} style={{ ['--vt' as string]: `c-${p.id}` }} onClick={open}>
            <div className="card-top">
              <div><h3>{p.name}</h3>{p.aka?.length ? <div className="aka">{p.aka.slice(0, 2).join(' · ')}</div> : null}</div>
              <FamilyGlyph family={p.family} />
            </div>
            <div className="card-meta"><span>{FAMILIES[p.family]?.name}</span><Ladder t={p.tier} /><span>T{p.tier} · {TIERS[p.tier].label}</span></div>
            <p className="sum">{p.summary}</p>
            <div className="row-wrap"><LegalChip k={p.legal} /></div>
          </a>
        )) : (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <IlloSearch />
            <span className="eyebrow">Library</span>
            <h3>No matches</h3>
            <p className="small muted">Try a different word or clear a filter.</p>
            <button className="btn" onClick={() => setF({ q: '', fam: 'all', tier: 'all', legal: 'all' })}>Clear filters</button>
          </div>
        )}
      </div>

      <details className="tile mint" id="tiers">
        <summary className="spread" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
          <span className="stack gap-1">
            <span className="label">How evidence tiers work</span>
            <span className="tile-title">Only {trialBacked} of {PEPTIDES.length} have randomized human trials</span>
          </span>
          <span className="arrow" aria-hidden="true"><svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></span>
        </summary>
        <TierOverview />
      </details>
      <TopChart />
    </section>
  );
}
