import { useState } from 'react';
import type { LegalKey, SafetyCard, Source } from '../lib/types';
import { AS_OF, LEGAL, SAFETY, TIMELINE, TIMELINE_SOURCES } from '../data/reference';
import { PEPTIDES } from '../data/peptides';
import { RED_FLAGS } from '../data/options';
import { LegalText } from '../components/Chips';
import { ChevronIcon, PhoneIcon } from '../components/Icons';

const TESTING = 'What testing of online peptides found';
/** Legal-with-a-prescription first, then the grey market, then the rest. */
const STATUS_ORDER: LegalKey[] = ['approved', 'compoundable', 'unapproved', 'pending', 'investigational', 'abroad', 'cosmetic', 'supplement', 'restricted'];
const TL_TAG: Record<string, string> = { tighten: 'Tightened', loosen: 'Widened', next: 'Pending', '': 'Update' };
const FIRST_FLAGS = 7, FIRST_EVENTS = 5, FIRST_QUESTIONS = 4;

function Sources({ list }: { list: Source[] }) {
  return (
    <p className="xsmall faint">
      Sources:{' '}
      {list.map((s, i) => (
        <span key={s.u}>{i > 0 && ' · '}<a href={s.u} target="_blank" rel="noopener noreferrer">{s.t}</a></span>
      ))}
    </p>
  );
}

function Toggle({ open, set, more }: { open: boolean; set: (v: boolean) => void; more: string }) {
  return <button type="button" className="btn ghost sm" aria-expanded={open} onClick={() => set(!open)}>{open ? 'Show fewer' : more}</button>;
}

function BasicsItem({ c }: { c: SafetyCard }) {
  return (
    <details className="more">
      <summary><span className="with-swatch"><span className="tone-dot" data-tone={c.tone || 'info'} />{c.title}</span><ChevronIcon /></summary>
      <div className="more-body">
        {c.body && <p>{c.body}</p>}
        {c.items && <ul className="dots">{c.items.map(i => <li key={i}>{i}</li>)}</ul>}
        {c.sources && <Sources list={c.sources} />}
      </div>
    </details>
  );
}

export function SafetyView() {
  const [allFlags, setAllFlags] = useState(false);
  const [allEvents, setAllEvents] = useState(false);
  const [allQs, setAllQs] = useState(false);
  const testing = SAFETY.cards.find(c => c.title === TESTING);
  const basics = SAFETY.cards.filter(c => c !== testing);
  const counts = STATUS_ORDER.map(k => [k, PEPTIDES.filter(p => p.legal === k).length] as const).filter(([, n]) => n > 0);
  const maxCount = Math.max(...counts.map(([, n]) => n));
  const events = allEvents ? TIMELINE : TIMELINE.slice(-FIRST_EVENTS);

  return (
    <section className="view">
      <div className="view-head">
        <div><h1>Safety &amp; law</h1><p>What to watch for, how to handle vials safely, and where US rules stand as of {AS_OF}.</p></div>
      </div>

      <section className="emerg" aria-labelledby="em-h">
        <h2 id="em-h" className="h-sec">Get emergency help now if you have</h2>
        <ul className="dots">{(allFlags ? RED_FLAGS : RED_FLAGS.slice(0, FIRST_FLAGS)).map(f => <li key={f}>{f}</li>)}</ul>
        {RED_FLAGS.length > FIRST_FLAGS && <Toggle open={allFlags} set={setAllFlags} more={`Show all ${RED_FLAGS.length} warning signs`} />}
        <div className="call-grid">
          <a className="call primary" href="tel:911"><PhoneIcon size={20} /><span><b>Call 911</b><span>Emergency</span></span></a>
          <a className="call" href="tel:18002221222"><PhoneIcon size={20} /><span><b className="mono">1-800-222-1222</b><span>Poison Control · US, 24/7</span></span></a>
          <a className="call" href="tel:988"><PhoneIcon size={20} /><span><b className="mono">988</b><span>Suicide &amp; Crisis Lifeline · call or text</span></span></a>
        </div>
        <p className="small">Bring the vial or packaging so the care team knows what you took.</p>
      </section>

      <div className="safety-grid">
        {testing && (
          <section className="label-card stat-card" aria-labelledby="test-h">
            <div className="lc-body">
              <h2 id="test-h" className="h-card">{testing.title}</h2>
              <div className="stat"><span className="stat-n mono">42%</span><span>failed a pharmacy-style standard for amount and purity</span></div>
              {testing.body && <p className="small muted">{testing.body}</p>}
              {testing.items && <ul className="dots small">{testing.items.map(i => <li key={i}>{i}</li>)}</ul>}
              {testing.sources && <Sources list={testing.sources} />}
            </div>
          </section>
        )}

        <section className="panel stack" aria-labelledby="us-h">
          <div>
            <h2 id="us-h" className="h-card">Where the {PEPTIDES.length} compounds stand</h2>
            <p className="small muted">US status of everything in the library. Only the first two can be had legally with a prescription.</p>
          </div>
          <ul className="status-bars">
            {counts.map(([k, n]) => (
              <li key={k} data-l={k}>
                <span className="sb-label"><LegalText k={k} /></span>
                <span className="sb-track"><span style={{ width: `${(n / maxCount) * 100}%` }} /></span>
                <span className="sb-n mono">{n}</span>
              </li>
            ))}
          </ul>
          <details className="more">
            <summary><span>What each status means</span><ChevronIcon /></summary>
            <div className="more-body">
              <p className="small muted">{SAFETY.legalIntro}</p>
              <dl className="status-defs">
                {counts.map(([k]) => (
                  <div key={k}>
                    <dt><LegalText k={k} /></dt>
                    <dd>
                      <span>{LEGAL[k].long}</span>
                      <span className="small muted">In the library: {PEPTIDES.filter(p => p.legal === k).map((p, i) => <span key={p.id}>{i > 0 && ', '}<a href={`#${p.id}`}>{p.name}</a></span>)}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        </section>
      </div>

      <section className="stack" aria-labelledby="basics-h">
        <h2 id="basics-h" className="label-h">Safety basics</h2>
        <div className="more-list">{basics.map(c => <BasicsItem key={c.title} c={c} />)}</div>
      </section>

      <section className="panel stack" aria-labelledby="tl-h">
        <div className="label-row">
          <h2 id="tl-h" className="h-card">{allEvents ? 'US peptide rules since 2023' : 'US rules: latest and next'}</h2>
          <span className="count">{allEvents ? TIMELINE.length : `${FIRST_EVENTS} of ${TIMELINE.length}`}</span>
        </div>
        <ol className="timeline-v">
          {events.map(t => (
            <li className="tv" data-k={t.k ?? ''} key={t.date + t.title}>
              <span className="tv-meta"><time className="mono">{t.date}</time><span className="tv-tag" data-k={t.k ?? ''}>{TL_TAG[t.k ?? '']}</span></span>
              <b>{t.title}</b>
              <p>{t.body}</p>
            </li>
          ))}
        </ol>
        <Toggle open={allEvents} set={setAllEvents} more="Full timeline since 2023" />
        <Sources list={TIMELINE_SOURCES} />
      </section>

      <section className="panel stack" aria-labelledby="q-h">
        <h2 id="q-h" className="h-card">Questions to ask your clinician</h2>
        <ol className="numbered">
          {(allQs ? SAFETY.questions : SAFETY.questions.slice(0, FIRST_QUESTIONS)).map((q, i) => (
            <li key={q}><span className="n mono">{String(i + 1).padStart(2, '0')}</span><span>{q}</span></li>
          ))}
        </ol>
        {SAFETY.questions.length > FIRST_QUESTIONS && <Toggle open={allQs} set={setAllQs} more={`Show all ${SAFETY.questions.length} questions`} />}
      </section>

      <section className="panel stack" aria-labelledby="about-h">
        <h2 id="about-h" className="h-card">About this information</h2>
        <p className="small muted">{SAFETY.about}</p>
      </section>
    </section>
  );
}
