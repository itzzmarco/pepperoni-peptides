import type { LegalKey, Source } from '../lib/types';
import { AS_OF, LEGAL, SAFETY, TIMELINE, TIMELINE_SOURCES } from '../data/reference';
import { PEPTIDES } from '../data/peptides';
import { RED_FLAGS } from '../data/options';
import { LegalChip } from '../components/Chips';

function Sources({ list }: { list: Source[] }) {
  return (
    <p className="xsmall muted">
      Sources:{' '}
      {list.map((s, i) => (
        <span key={s.u}>{i > 0 && ' · '}<a href={s.u} target="_blank" rel="noopener noreferrer">{s.t}</a></span>
      ))}
    </p>
  );
}

const rise = (i: number) => ({ ['--i' as string]: i });

export function SafetyView() {
  // The sections after the cards continue the same stagger, so the whole page enters one way.
  const after = 3 + SAFETY.cards.length;
  return (
    <section className="view">
      <header className="head hero guide peach rise">
        <span className="eyebrow">Guide · Safety &amp; law</span>
        <h1>Know the warning signs.<br /><span className="soft">And where US rules stand.</span></h1>
        <p>What to watch for, how to handle vials safely, and the state of US rules as of {AS_OF}.</p>
      </header>

      <section className="tile sec flag rise" style={rise(2)}>
        <h2 className="tone-danger">Get emergency help now if you have</h2>
        <ul>{RED_FLAGS.map(f => <li key={f}>{f}</li>)}</ul>
        <div className="callout-nums">
          <a href="tel:911"><span className="xsmall">Emergency</span><b>911</b></a>
          <a href="tel:+18002221222"><span className="xsmall">Poison Control (US, 24/7)</span><b>1-800-222-1222</b></a>
          <a href="tel:988"><span className="xsmall">Suicide &amp; Crisis Lifeline</span><b>988</b></a>
        </div>
        <p className="small">Bring the vial or packaging with you so the care team knows what you took.</p>
      </section>

      <div className="sections">
        {SAFETY.cards.map((c, i) => (
          <section key={c.title} className={`tile sec rise${c.tone === 'flag' ? ' flag' : c.tone === 'caution' ? ' caution' : ''}`} style={rise(3 + i)}>
            <h4>{c.title}</h4>
            {c.body && <p>{c.body}</p>}
            {c.items && <ul>{c.items.map(x => <li key={x}>{x}</li>)}</ul>}
            {c.sources && <Sources list={c.sources} />}
          </section>
        ))}
      </div>

      <section className="tile rise" style={rise(after)}>
        <h2>How US rules sort these compounds</h2>
        <p className="small muted" style={{ maxWidth: '75ch' }}>{SAFETY.legalIntro}</p>
        <div className="table-wrap stack-sm">
          <table>
            <thead><tr><th>Status</th><th>What it means</th><th>Examples in the library</th></tr></thead>
            <tbody>
              {(Object.keys(LEGAL) as LegalKey[]).map(k => {
                const ps = PEPTIDES.filter(p => p.legal === k);
                if (!ps.length) return null;
                return (
                  <tr key={k}>
                    <td><LegalChip k={k} /></td>
                    <td>{LEGAL[k].long}</td>
                    <td data-label="In the library">{ps.map((p, i) => <span key={p.id}>{i > 0 && ', '}<a href={`#${p.id}`}>{p.name}</a></span>)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tile sky rise" style={rise(after + 1)}>
        <h2>Timeline of US peptide rules</h2>
        <div className="timeline-v">
          {TIMELINE.map(t => (
            <div className="tv" data-k={t.k ?? ''} key={t.date + t.title}>
              <time>{t.date}</time><b>{t.title}</b><p>{t.body}</p>
            </div>
          ))}
        </div>
        <p className="xsmall muted">Red ring: access tightened. Green ring: access widened. Dashed ring: scheduled or pending.</p>
        <Sources list={TIMELINE_SOURCES} />
      </section>

      <section className="tile lemon rise" style={rise(after + 2)}>
        <h2>Questions to ask your clinician</h2>
        <ul className="small bullets">{SAFETY.questions.map(q => <li key={q}>{q}</li>)}</ul>
      </section>

      <section className="tile rise" style={rise(after + 3)}>
        <h3>About this information</h3>
        <p className="small muted" style={{ maxWidth: '75ch' }}>{SAFETY.about}</p>
      </section>
    </section>
  );
}
