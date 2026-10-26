import { useState, type ReactNode } from 'react';
import type { LegalKey, Peptide } from '../lib/types';
import { AS_OF, AS_OF_SHORT, FAMILIES, LEGAL, TIERS } from '../data/reference';
import { Ladder, LegalText, SeqStrip } from '../components/Chips';
import { AlertIcon, BackIcon, ChevronIcon, PhoneIcon, PlusIcon } from '../components/Icons';
import { useLedger } from '../lib/store';

/** Legal buckets where what people can actually buy is unregulated product. */
const GREY_MARKET = new Set<LegalKey>(['pending', 'restricted', 'investigational', 'unapproved']);

/** How many studies show before "Show all". */
const TOP_STUDIES = 3;

/** The warning shown under the header, graded by evidence and legal status. */
function cautionBanner(p: Peptide): { tone: 'danger' | 'warn'; title: string } | null {
  if (p.tier >= 4 || p.legal === 'restricted' || p.legal === 'unapproved') return { tone: 'danger', title: "No proven human safety data for the way it's used online." };
  if (p.legal === 'investigational') return { tone: 'warn', title: 'Still in clinical trials. Anything sold online is not the trial product.' };
  if (p.legal === 'pending') return { tone: 'warn', title: 'Not FDA-approved, and not legal to compound yet.' };
  if (p.tier >= 3 && p.legal !== 'cosmetic' && p.legal !== 'supplement') return { tone: 'warn', title: "Only limited human evidence for the way it's used online." };
  return null;
}

function More({ title, n, note, children }: { title: string; n?: number; note?: string; children: ReactNode }) {
  return (
    <details className="more">
      <summary>
        <span>{title}{n ? <span className="count"> {n}</span> : null}{note && <span className="faint small"> · {note}</span>}</span>
        <ChevronIcon />
      </summary>
      <div className="more-body">{children}</div>
    </details>
  );
}

const List = ({ items }: { items: string[] }) => <ul className="dots">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

/** Scroll within the page without touching the hash, which drives routing. */
function jump(id: string) {
  const el = document.getElementById(id);
  if (el instanceof HTMLDetailsElement) el.open = true;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

export function PeptideDetail({ p, onTrack }: { p: Peptide; onTrack: (id: string) => void }) {
  const { regimens } = useLedger();
  const [allStudies, setAllStudies] = useState(false);
  const tracked = regimens.some(r => r.compoundId === p.id);
  const banner = cautionBanner(p);
  const studies = p.evidence ?? [];
  const nav = [
    (p.claim || p.shows) && ['d-claim', 'Claim vs evidence'],
    p.redFlags?.length && ['d-flags', 'Warning signs'],
    studies.length && ['d-studies', 'Studies'],
    p.avoid?.length && ['d-avoid', 'Who should avoid it'],
    p.sources?.length && ['d-sources', 'Sources'],
  ].filter(Boolean) as [string, string][];

  return (
    <article className="view detail" key={p.id}>
      <a className="back-link" href="#library"><BackIcon size={18} />All peptides</a>
      <header className="detail-head">
        <span className="eyebrow">{FAMILIES[p.family]?.name}{p.isPeptide === false ? ' · not technically a peptide' : ''}</span>
        <h1>{p.name}</h1>
        {p.aka?.length ? <span className="muted small">Also called {p.aka.join(', ')}</span> : null}
        <p className="lede">{p.summary}</p>
      </header>

      <dl className="label-card fact-label">
        <div className="fl-row fl-evidence">
          <Ladder t={p.tier} size="lg" />
          <div>
            <dt>Evidence</dt>
            <dd><b>Tier {p.tier} · {TIERS[p.tier].label}</b><span className="muted small">{TIERS[p.tier].long}</span></dd>
          </div>
        </div>
        <div className="fl-row">
          <div>
            <dt>US status · {AS_OF_SHORT}</dt>
            <dd><b><LegalText k={p.legal} /></b><span className="small">{p.status ?? LEGAL[p.legal]?.long}</span></dd>
          </div>
        </div>
        {(p.wada || p.halfLife) && (
          <div className="fl-row fl-split">
            {p.wada && <div><dt>Sport (WADA)</dt><dd className="small">{p.wada}</dd></div>}
            {p.halfLife && <div><dt>Half-life</dt><dd className="small">{p.halfLife}</dd></div>}
          </div>
        )}
        {p.routes && <div className="fl-row"><div><dt>How it's given</dt><dd className="small">{p.routes}</dd></div></div>}
        {p.seq && (
          <div className="fl-row">
            <div style={{ minWidth: 0 }}>
              <dt>Sequence{typeof p.seq === 'string' && !p.seqNote ? ` · ${p.seq.length} amino acids` : ''}</dt>
              <dd><SeqStrip p={p} />{p.seqNote && <span className="xsmall faint">{p.seqNote}</span>}</dd>
            </div>
          </div>
        )}
      </dl>

      {banner && (
        <div className={`alert ${banner.tone} with-icon`} role="note">
          <AlertIcon />
          <div>
            <b>{banner.title}</b>
            <span>
              {TIERS[p.tier].long}.{' '}
              {GREY_MARKET.has(p.legal) && <>Products sold online aren't regulated, and lab tests have found wrong amounts, the wrong peptide, and bacterial toxins. <a href="#safety">Safety basics</a></>}
            </span>
          </div>
        </div>
      )}

      <div className="detail-actions">
        <button className="btn big" onClick={() => onTrack(p.id)}><PlusIcon />{tracked ? 'Track another regimen' : 'Track in my log'}</button>
        <a className="btn big ghost" href="#calculator">Dose math</a>
      </div>

      {nav.length > 1 && (
        <nav className="jump" aria-label="On this page">
          {nav.map(([id, label]) => <button key={id} type="button" className="fchip" onClick={() => jump(id)}>{label}</button>)}
        </nav>
      )}

      {(p.claim || p.shows) && (
        <section id="d-claim" className="dsec" aria-labelledby="d-claim-h">
          <h2 id="d-claim-h" className="h-sec">What's claimed vs what's shown</h2>
          <div className="hype">
            {p.claim && <div className="claim"><span className="label">Online claim</span><p>{p.claim}</p></div>}
            {p.shows && <div className="shows"><span className="label">What the evidence shows</span><p>{p.shows}</p></div>}
          </div>
        </section>
      )}

      {p.redFlags?.length ? (
        <section id="d-flags" className="dsec flag-card" aria-labelledby="d-flags-h">
          <h2 id="d-flags-h" className="h-sec">Get help right away if</h2>
          <List items={p.redFlags} />
          <a className="btn danger" href="tel:911"><PhoneIcon />Call 911</a>
        </section>
      ) : null}

      {studies.length ? (
        <section id="d-studies" className="dsec" aria-labelledby="d-studies-h">
          <div className="label-row">
            <h2 id="d-studies-h" className="h-sec">Key studies</h2>
            <span className="count">{allStudies || studies.length <= TOP_STUDIES ? studies.length : `${TOP_STUDIES} of ${studies.length}`}</span>
          </div>
          <ol className="numbered">
            {(allStudies ? studies : studies.slice(0, TOP_STUDIES)).map((s, i) => <li key={i}><span className="n mono">{String(i + 1).padStart(2, '0')}</span><span>{s}</span></li>)}
          </ol>
          {studies.length > TOP_STUDIES && (
            <button className="btn ghost sm" onClick={() => setAllStudies(!allStudies)}>{allStudies ? 'Show fewer' : `Show all ${studies.length} studies`}</button>
          )}
        </section>
      ) : null}

      {p.avoid?.length ? (
        <section id="d-avoid" className="dsec caution-card" aria-labelledby="d-avoid-h">
          <h2 id="d-avoid-h" className="h-sec">Avoid, or ask a doctor first, if you</h2>
          <List items={p.avoid} />
        </section>
      ) : null}

      <div className="more-list">
        {p.mechanism && <More title="How it works"><p>{p.mechanism}</p></More>}
        {p.sideEffects?.length ? <More title="Reported side effects" n={p.sideEffects.length}><List items={p.sideEffects} /></More> : null}
        {p.interactions?.length ? <More title="Interactions" n={p.interactions.length}><List items={p.interactions} /></More> : null}
        {p.studied && (
          <More title="Doses used in approved labeling or trials" note="context, not advice">
            <p>{p.studied}</p>
            <p className="xsmall faint">Shown for context, not as a recommendation. Only a prescriber can set your dose.</p>
          </More>
        )}
        {p.unknowns?.length ? <More title="What's still unknown" n={p.unknowns.length}><List items={p.unknowns} /></More> : null}
      </div>

      {p.sources?.length ? (
        <details id="d-sources" className="more sources-box">
          <summary>
            <span><b>{p.sources.length} sources</b><span className="small muted"> · FDA documents, trials and reviews, checked {AS_OF}</span></span>
            <ChevronIcon />
          </summary>
          <ol className="sources">{p.sources.map(s => <li key={s.u}><a href={s.u} target="_blank" rel="noopener noreferrer">{s.t}</a></li>)}</ol>
        </details>
      ) : null}
    </article>
  );
}
