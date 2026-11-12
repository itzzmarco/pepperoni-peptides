import type { LegalKey, Source } from '../lib/types';
import { AS_OF, LEGAL, SAFETY, TIMELINE, TIMELINE_SOURCES } from '../data/reference';
import { PEPTIDES } from '../data/peptides';
import { RED_FLAGS } from '../data/options';
import { LegalChip } from '../components/Chips';
import { BackToLearn, Kinetic, Mast } from '../components/Mast';

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
      <Mast>
        <BackToLearn />
        <Kinetic a="Know the warning signs." b="And where US rules stand." />
        <p className="rise" style={rise(5)}>What to watch for, how to handle vials safely, and the state of US rules as of {AS_OF}.</p>
      </Mast>

      <section className="tile emerg rise" style={rise(2)}>
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
        <span className="label">US status</span>
        <h2 className="lead">How US rules sort these compounds</h2>
        <p className="sub" style={{ maxWidth: '75ch' }}>{SAFETY.legalIntro}</p>
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
        <span className="label">Timeline</span>
        <h2 className="lead">US peptide rules, year by year</h2>
        <div className="timeline-v">
          {TIMELINE.map(t => (
            <div className="tv" data-k={t.k ?? ''} key={t.date + t.title}>
              <time>{t.date}</time><b>{t.title}</b><p>{t.body}</p>
            </div>
          ))}
        </div>
        <p className="sub">Red ring: access tightened. Green ring: access widened. Dashed ring: scheduled or pending.</p>
        <Sources list={TIMELINE_SOURCES} />
      </section>

      <section className="tile lemon">
        <span className="label">Before an appointment</span>
        <h2 className="lead">Questions to ask your clinician</h2>
        <ul className="notes">{SAFETY.questions.map(q => <li key={q}>{q}</li>)}</ul>
      </section>

      <section className="tile">
        <h2 className="label">About this information</h2>
        <p className="sub" style={{ maxWidth: '75ch' }}>{SAFETY.about}</p>
      </section>
    </section>
  );
}
