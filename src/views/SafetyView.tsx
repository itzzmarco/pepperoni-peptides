import type { LegalKey, Source } from '../lib/types';
import { AS_OF, LEGAL, SAFETY, TIMELINE, TIMELINE_SOURCES } from '../data/reference';
import { PEPTIDES } from '../data/peptides';
import { RED_FLAGS } from '../data/options';
import { LegalChip } from '../components/Chips';

/** One source per row, each a full-height tap target, like the profile's source list, so neighbours are hard to mistap. */
function Sources({ list }: { list: Source[] }) {
  return (
    <div className="stack gap-1">
      <span className="xsmall muted">Sources</span>
      <ul className="sources">{list.map(s => <li key={s.u}><a href={s.u} target="_blank" rel="noopener noreferrer">{s.t}</a></li>)}</ul>
    </div>
  );
}

const rise = (i: number) => ({ ['--i' as string]: i });

/** A small mark per guide section, by its title, so the run of cards scans by shape as well as by heading.
 *  A section without its own mark gets the info circle. The emergency card above them stays plain. */
const MARK: Record<string, string> = {
  'Signs of infection or a bad reaction': 'M12 3 2 20h20zM12 10v4M12 17h.01',
  '"Research use only" is not a loophole': 'M9 3h6M10 3v6l-5 10a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2L14 9V3',
  'What testing of online peptides found': 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  'Even pharmacy products can go wrong': 'M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 10l7 7',
  'Mixing a vial': 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  'Syringe math and 10× mistakes': 'M6 3h12v18H6zM9 7h6M9 12h1M14 12h1M9 16h1M14 16h1',
  'Storage and how long a vial lasts': 'M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z',
  'Getting rid of needles': 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  'GLP-1 copies and "generics"': 'M9 9h11v11H9zM5 15V4h11',
  'For tested athletes and service members': 'M8 4h8v5a4 4 0 0 1-8 0zM12 13v4M8 21h8M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4',
};
const INFO = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01';

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

      {/* After the emergency card the topics fold to one row each, their mark and title, so a phone shows the whole list
          on a screen or two and each opens where it is read. Warning-toned topics start open. */}
      <div className="sections">
        {SAFETY.cards.map((c, i) => (
          <details key={c.title} className={`tile sec rise${c.tone === 'flag' ? ' flag' : c.tone === 'caution' ? ' caution' : ''}`} style={rise(3 + i)} open={c.tone === 'flag'}>
            <summary className="sec-h">
              <span className="sec-mark" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={MARK[c.title] ?? INFO} /></svg>
              </span>
              <span className="flex-1">{c.title}</span>
              <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </summary>
            {c.body && <p>{c.body}</p>}
            {c.items && <ul>{c.items.map(x => <li key={x}>{x}</li>)}</ul>}
            {c.sources && <Sources list={c.sources} />}
          </details>
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
