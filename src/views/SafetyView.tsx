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
  return (
    <section className="view">
      <div className="head-actions rise"><a className="btn ghost sm" href="#learn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        Learn
      </a></div>
      <header className="head rise" style={rise(1)}>
        <span className="eyebrow">Guide · Safety &amp; law</span>
        <h1>Know the warning signs.<br /><span className="soft">And where US rules stand.</span></h1>
        <p>What to watch for, how to handle vials safely, and the state of US rules as of {AS_OF}.</p>
      </header>

      <section className="tile emerg rise" style={{ ...rise(2), background: 'var(--danger-bg)', boxShadow: 'none' }}>
        <h2 style={{ color: 'var(--danger)' }}>Get emergency help now if you have</h2>
        <ul>{RED_FLAGS.map(f => <li key={f}>{f}</li>)}</ul>
        <div className="callout-nums">
          <div><span className="xsmall">Emergency</span><b>911</b></div>
          <div><span className="xsmall">Poison Control (US, 24/7)</span><b>1-800-222-1222</b></div>
          <div><span className="xsmall">Suicide &amp; Crisis Lifeline</span><b>988</b></div>
        </div>
        <p className="small">Bring the vial or packaging with you so the care team knows what you took.</p>
      </section>

      <div className="sections">
        {SAFETY.cards.map((c, i) => (
          <section key={c.title} className={`tile sec rise${c.tone === 'flag' ? ' flag' : c.tone === 'caution' ? ' peach' : ''}`} style={rise(3 + i)}>
            <h4 className={c.tone === 'caution' ? 'label' : undefined}>{c.title}</h4>
            {c.body && <p>{c.body}</p>}
            {c.items && <ul>{c.items.map(x => <li key={x}>{x}</li>)}</ul>}
            {c.sources && <Sources list={c.sources} />}
          </section>
        ))}
      </div>

      <section className="tile">
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

      <section className="tile sky">
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

      <section className="tile lemon">
        <h2>Questions to ask your clinician</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>{SAFETY.questions.map(q => <li key={q}>{q}</li>)}</ul>
      </section>

      <section className="tile">
        <h3>About this information</h3>
        <p className="small muted" style={{ maxWidth: '75ch' }}>{SAFETY.about}</p>
      </section>
    </section>
  );
}
