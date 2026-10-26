import type { LegalKey, Peptide } from '../lib/types';
import { AS_OF_SHORT, FAMILIES, LEGAL, TIERS } from '../data/reference';
import { Ladder, LegalChip, SeqStrip, TierChip, WadaChip } from '../components/Chips';
import { useLedger } from '../lib/store';

function ListSec({ title, items, tone = '' }: { title: string; items?: string[]; tone?: string }) {
  if (!items?.length) return null;
  return (
    <section className={`sec ${tone}`}>
      <h4>{title}</h4>
      <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  );
}

/** Legal buckets where what people can actually buy is unregulated product. */
const GREY_MARKET = new Set<LegalKey>(['pending', 'restricted', 'investigational', 'unapproved']);

/** The warning shown under the header, graded by evidence and legal status. */
function cautionBanner(p: Peptide): { tone: 'danger' | 'warn'; title: string } | null {
  if (p.tier >= 4 || p.legal === 'restricted' || p.legal === 'unapproved') return { tone: 'danger', title: "No proven human safety data for the way it's used online." };
  if (p.legal === 'investigational') return { tone: 'warn', title: 'Still in clinical trials. Anything sold online is not the trial product.' };
  if (p.legal === 'pending') return { tone: 'warn', title: 'Not FDA-approved, and not legal to compound yet.' };
  if (p.tier >= 3 && p.legal !== 'cosmetic' && p.legal !== 'supplement') return { tone: 'warn', title: "Only limited human evidence for the way it's used online." };
  return null;
}

export function PeptideDetail({ p, onTrack }: { p: Peptide; onTrack: (id: string) => void }) {
  const { regimens } = useLedger();
  const tracked = regimens.some(r => r.compoundId === p.id);
  const banner = cautionBanner(p);
  return (
    <article className="view detail">
      <a className="btn quiet sm back" href="#library">← All peptides</a>
      <header className="detail-head">
        <div className="eyebrow">{FAMILIES[p.family]?.name}{p.isPeptide === false ? ' · not technically a peptide' : ''}</div>
        <h1>{p.name}</h1>
        {p.aka?.length ? <div className="muted small">Also called {p.aka.join(', ')}</div> : null}
        <div className="row-wrap"><TierChip t={p.tier} /><LegalChip k={p.legal} /><WadaChip w={p.wada} /></div>
        <p style={{ maxWidth: '70ch' }}>{p.summary}</p>
        <SeqStrip p={p} />
        {p.seqNote && <div className="xsmall faint">{p.seqNote}</div>}
        <div className="row-wrap" style={{ marginTop: 4 }}>
          <button className="btn" onClick={() => onTrack(p.id)}>{tracked ? 'Track another regimen' : 'Track this in my log'}</button>
          <a className="btn ghost" href="#calculator">Dose math</a>
        </div>
      </header>
      {banner && (
        <div className={`alert ${banner.tone}`}>
          <b>{banner.title}</b>
          <span>
            {TIERS[p.tier].long}.{' '}
            {GREY_MARKET.has(p.legal) && <>Products sold online aren't regulated, and lab tests have found wrong amounts, the wrong peptide, and bacterial toxins. <a href="#safety">Safety basics</a></>}
          </span>
        </div>
      )}
      <dl className="facts">
        <div><dt>Evidence</dt><dd><Ladder t={p.tier} /> Tier {p.tier} · {TIERS[p.tier].label}</dd></div>
        <div><dt>US status ({AS_OF_SHORT})</dt><dd>{p.status ?? LEGAL[p.legal]?.long}</dd></div>
        {p.halfLife && <div><dt>Half-life</dt><dd>{p.halfLife}</dd></div>}
        {p.routes && <div><dt>How it's given</dt><dd>{p.routes}</dd></div>}
        {p.wada && <div><dt>Sport (WADA)</dt><dd>{p.wada}</dd></div>}
      </dl>
      <div className="sections">
        {(p.claim || p.shows) && (
          <section className="sec wide">
            <h4>What's claimed vs what's shown</h4>
            <div className="hype">
              {p.claim && <div className="claim"><span className="eyebrow">Online claim</span><p>{p.claim}</p></div>}
              {p.shows && <div className="shows"><span className="eyebrow">What the evidence shows</span><p>{p.shows}</p></div>}
            </div>
          </section>
        )}
        {p.mechanism && <section className="sec"><h4>How it works</h4><p>{p.mechanism}</p></section>}
        <ListSec title="Key studies and evidence" items={p.evidence} />
        <ListSec title="Get help right away if" items={p.redFlags} tone="flag" />
        <ListSec title="Commonly reported side effects" items={p.sideEffects} />
        <ListSec title="Avoid or ask a doctor first if" items={p.avoid} tone="caution" />
        <ListSec title="Interactions" items={p.interactions} />
        {p.studied && (
          <section className="sec">
            <h4>Doses used in approved labeling or trials</h4>
            <p>{p.studied}</p>
            <p className="xsmall faint">Shown for context, not as a recommendation. Only a prescriber can set your dose.</p>
          </section>
        )}
        <ListSec title="What's still unknown" items={p.unknowns} />
        {p.sources?.length ? (
          <section className="sec wide">
            <h4>Sources</h4>
            <ol className="sources">{p.sources.map(s => <li key={s.u}><a href={s.u} target="_blank" rel="noopener noreferrer">{s.t}</a></li>)}</ol>
          </section>
        ) : null}
      </div>
    </article>
  );
}
