import type { LegalKey, Source } from '../lib/types';
import { AS_OF, LEGAL, SAFETY, TIMELINE, TIMELINE_SOURCES } from '../data/reference';
import { PEPTIDES } from '../data/peptides';
import { RED_FLAGS } from '../data/options';
import { LegalChip } from '../components/Chips';

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

export function SafetyView() {
  return (
    <section className="view">
      <div className="view-head">
        <div><h1>Safety &amp; law</h1><p>What to watch for, how to handle vials safely, and where US rules stand as of {AS_OF}.</p></div>
      </div>
      <section className="emerg">
        <h2>Get emergency help now if you have</h2>
        <ul>{RED_FLAGS.map(f => <li key={f}>{f}</li>)}</ul>
        <div className="callout-nums">
          <div><span className="xsmall">Emergency</span><b>911</b></div>
          <div><span className="xsmall">Poison Control (US, 24/7)</span><b>1-800-222-1222</b></div>
          <div><span className="xsmall">Suicide &amp; Crisis Lifeline</span><b>988</b></div>
        </div>
        <p className="small">Bring the vial or packaging with you so the care team knows what you took.</p>
      </section>

      <div className="safety-grid">
        {SAFETY.cards.map(c => (
          <section key={c.title} className={`sec${c.tone ? ` ${c.tone}` : ''}`}>
            <h4>{c.title}</h4>
            {c.body && <p>{c.body}</p>}
            {c.items && <ul>{c.items.map(i => <li key={i}>{i}</li>)}</ul>}
            {c.sources && <Sources list={c.sources} />}
          </section>
        ))}
      </div>

      <section className="panel stack">
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

      <section className="panel stack">
        <h2>Timeline of US peptide rules</h2>
        <div className="timeline-v">
          {TIMELINE.map(t => (
            <div className="tv" data-k={t.k ?? ''} key={t.date + t.title}>
              <time>{t.date}</time><b>{t.title}</b><p>{t.body}</p>
            </div>
          ))}
        </div>
        <p className="xsmall faint">Red ring: access tightened. Green ring: access widened. Dashed ring: scheduled or pending.</p>
        <Sources list={TIMELINE_SOURCES} />
      </section>

      <section className="panel stack">
        <h2>Questions to ask your clinician</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>{SAFETY.questions.map(q => <li key={q}>{q}</li>)}</ul>
      </section>

      <section className="panel stack">
        <h3>About this information</h3>
        <p className="small muted" style={{ maxWidth: '75ch' }}>{SAFETY.about}</p>
      </section>
    </section>
  );
}
