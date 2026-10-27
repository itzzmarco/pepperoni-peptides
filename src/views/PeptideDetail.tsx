import type { LegalKey, Peptide, Regimen } from '../lib/types';
import { AS_OF_SHORT, FAMILIES, LEGAL, TIERS } from '../data/reference';
import { Ladder, LegalChip, SeqStrip, TierChip, WadaChip } from '../components/Chips';
import { useLedger } from '../lib/store';
import { freqText, regimenStatus } from '../lib/schedule';
import { fmtNum } from '../lib/format';
import { Glp1Alert, Strip } from './PeptidesView';

function ListSec({ title, items, tone = '' }: { title: string; items?: string[]; tone?: string }) {
  if (!items?.length) return null;
  return (
    <section className={`tile sec ${tone}`}>
      <h4>{title}</h4>
      <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  );
}

/** Legal buckets where what people can actually buy is unregulated product. */
const GREY_MARKET = new Set<LegalKey>(['pending', 'restricted', 'investigational', 'unapproved']);

/** The warning shown under the header, graded by evidence and legal status. */
function cautionBanner(p: Peptide): { tone: 'danger' | 'caution'; title: string } | null {
  if (p.tier >= 4 || p.legal === 'restricted' || p.legal === 'unapproved') return { tone: 'danger', title: "No proven human safety data for the way it's used online." };
  if (p.legal === 'investigational') return { tone: 'caution', title: 'Still in clinical trials. Anything sold online is not the trial product.' };
  if (p.legal === 'pending') return { tone: 'caution', title: 'Not FDA-approved, and not legal to compound yet.' };
  if (p.tier >= 3 && p.legal !== 'cosmetic' && p.legal !== 'supplement') return { tone: 'caution', title: "Only limited human evidence for the way it's used online." };
  return null;
}

const rise = (i: number) => ({ ['--i' as string]: i });

export function PeptideDetail({ p, onTrack, onLog }: { p: Peptide; onTrack: (id: string) => void; onLog: (r: Regimen) => void }) {
  const { regimens, doses } = useLedger();
  const mine = regimens.filter(r => r.compoundId === p.id);
  const banner = cautionBanner(p);
  return (
    <article className="view">
      <div className="head-actions rise"><a className="btn ghost sm" href="#learn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        Learn
      </a></div>
      <header className="head rise" style={rise(1)}>
        <span className="eyebrow">{FAMILIES[p.family]?.name}{p.isPeptide === false ? ' · not technically a peptide' : ''}</span>
        <h1>{p.name}</h1>
        {p.aka?.length ? <p className="small">Also called {p.aka.join(', ')}</p> : null}
        <div className="row-wrap"><TierChip t={p.tier} /><LegalChip k={p.legal} /><WadaChip w={p.wada} /></div>
        <p style={{ color: 'var(--ink)', fontSize: '1.0625rem', lineHeight: 1.45 }}>{p.summary}</p>
        <SeqStrip p={p} />
        {p.seqNote && <p className="xsmall">{p.seqNote}</p>}
      </header>
      <div className="head-actions rise" style={rise(2)}>
        <button className="btn" onClick={() => onTrack(p.id)}>{mine.length ? 'Track another regimen' : 'Track this in my log'}</button>
        <a className="btn ghost" href="#calculator">Dose math</a>
      </div>

      {mine.length > 0 && <Glp1Alert regimens={regimens} />}
      {mine.map(r => {
        const st = regimenStatus(r, doses);
        return (
          <section key={r.id} className="tile dark rise" aria-label={`${p.name} in your log`} style={rise(3)}>
            <div className="spread"><span className="eyebrow">In your log</span><span className="sub">{st.text}</span></div>
            <div className="stack" style={{ gap: 4 }}>
              <span style={{ fontSize: '1.375rem', fontWeight: 600 }}>{fmtNum(Number(r.dose), 3)} {r.unit} · {freqText(r)}</span>
              <span className="sub">{[r.route, r.prescriber && `prescribed by ${r.prescriber}`, r.paused && 'paused'].filter(Boolean).join(' · ')}</span>
            </div>
            <Strip rid={r.id} doses={doses} />
            <div className="row-wrap">
              {!r.paused && <button className="btn sm" onClick={() => onLog(r)}>Log a dose</button>}
              <a className="btn glass sm" href="#trends">See trends</a>
            </div>
          </section>
        );
      })}

      {banner && (
        <div className={`alert ${banner.tone} rise`} style={rise(4)}>
          <b>{banner.title}</b>
          <span>
            {TIERS[p.tier].long}.{' '}
            {GREY_MARKET.has(p.legal) && <>Products sold online aren't regulated, and lab tests have found wrong amounts, the wrong peptide, and bacterial toxins. <a href="#safety">Safety basics</a></>}
          </span>
        </div>
      )}

      <section className="tile rise" aria-labelledby="ev-h" style={rise(5)}>
        <h2 id="ev-h" className="eyebrow">Evidence strength</h2>
        <div className="stack" style={{ gap: 6 }}>
          <Ladder t={p.tier} wide />
          <div className="spread xsmall muted"><span>Weaker</span><span>Stronger</span></div>
        </div>
        <p><b>Tier {p.tier} · {TIERS[p.tier].label}.</b> <span className="muted">{TIERS[p.tier].long}.</span></p>
      </section>

      <section className="tile rise" aria-labelledby="glance-h" style={rise(6)}>
        <h2 id="glance-h" className="eyebrow">At a glance</h2>
        <dl className="rows">
          <div><dt>US status ({AS_OF_SHORT})</dt><dd>{p.status ?? LEGAL[p.legal]?.long}</dd></div>
          {p.halfLife && <div><dt>Half-life</dt><dd>{p.halfLife}</dd></div>}
          {p.routes && <div><dt>How it's given</dt><dd>{p.routes}</dd></div>}
          {p.wada && <div><dt>Sport (WADA)</dt><dd>{p.wada}</dd></div>}
          {p.mechanism && <div><dt>How it works</dt><dd>{p.mechanism}</dd></div>}
        </dl>
      </section>

      {(p.claim || p.shows) && (
        <section className="stack" aria-label="What's claimed vs what's shown">
          <h2 className="section-title">What's claimed vs what's shown</h2>
          <div className="facts-hype">
            {p.claim && <div className="tile" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}><span className="eyebrow">Online claim</span><p>{p.claim}</p></div>}
            {p.shows && <div className="tile mint"><span className="label">What the evidence shows</span><p>{p.shows}</p></div>}
          </div>
        </section>
      )}

      <div className="sections">
        <ListSec title="Key studies and evidence" items={p.evidence} />
        <ListSec title="Get help right away if" items={p.redFlags} tone="flag" />
        <ListSec title="Commonly reported side effects" items={p.sideEffects} />
        <ListSec title="Avoid or ask a doctor first if" items={p.avoid} tone="caution" />
        <ListSec title="Interactions" items={p.interactions} />
        {p.studied && (
          <section className="tile lilac sec">
            <h4 className="label">Doses used in approved labeling or trials</h4>
            <p>{p.studied}</p>
            <p className="xsmall muted">Shown for context, not as a recommendation. Only a prescriber can set your dose.</p>
          </section>
        )}
        <ListSec title="What's still unknown" items={p.unknowns} />
        {p.sources?.length ? (
          <section className="tile sec">
            <h4>Sources</h4>
            <ol className="sources">{p.sources.map(s => <li key={s.u}><a href={s.u} target="_blank" rel="noopener noreferrer">{s.t}</a></li>)}</ol>
          </section>
        ) : null}
      </div>
    </article>
  );
}
