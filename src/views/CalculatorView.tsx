import { useState } from 'react';
import { calcAlerts, doseMath, mgInUnits } from '../lib/doseMath';
import { fmtNum } from '../lib/format';
import { Syringe } from '../components/Syringe';
import { useCountUp } from '../components/Motion';

const SYRINGES: [string, string][] = [['30', '0.3 mL · 30u'], ['50', '0.5 mL · 50u'], ['100', '1 mL · 100u']];
const rise = (i: number) => ({ ['--i' as string]: i });

export function CalculatorView() {
  const [c, setC] = useState({ vial: '10', ml: '2', dose: '500', unit: 'mcg', syr: '50', drawn: '' });
  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value });
  const m = doseMath(c.dose, c.unit, c.vial, c.ml);
  const cap = Number(c.syr);
  const drawn = Number(c.drawn);
  const units = useCountUp(m?.units ?? 0, 0, 600);
  return (
    <section className="view">
      <div className="head-actions rise"><a className="btn ghost sm" href="#learn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        Learn
      </a></div>
      <header className="head rise" style={rise(1)}>
        <span className="eyebrow">Guide · Dose math</span>
        <h1>How many units to draw.<br /><span className="soft">For a dose you were prescribed.</span></h1>
        <p>How concentrated the vial is, and how many units that dose is on a U-100 insulin syringe. FDA has reports of measuring mistakes that sent people to the hospital, so check the result with your pharmacist.</p>
      </header>

      <form className="tile lilac rise" onSubmit={e => e.preventDefault()} autoComplete="off" style={rise(2)}>
        <div className="spread"><h2 className="label">Your vial</h2><span className="xsmall muted">Example values filled in</span></div>
        <div className="grid-2">
          <label className="field"><span>Powder in the vial <small>mg</small></span>
            <input type="number" id="c-vial" min="0" step="any" inputMode="decimal" value={c.vial} onChange={set('vial')} />
            <small>Printed on the vial label</small>
          </label>
          <label className="field"><span>Water added <small>mL</small></span>
            <input type="number" id="c-ml" min="0" step="any" inputMode="decimal" value={c.ml} onChange={set('ml')} />
            <small>Bacteriostatic or sterile water</small>
          </label>
        </div>
        <h2 className="label" style={{ marginTop: 4 }}>Your prescribed dose</h2>
        <div className="grid-2">
          <label className="field"><span>Dose</span><input type="number" id="c-dose" min="0" step="any" inputMode="decimal" value={c.dose} onChange={set('dose')} /></label>
          <div className="field"><span>Unit</span>
            <div className="seg" role="group" aria-label="Dose unit">
              {['mcg', 'mg'].map(u => <button type="button" key={u} aria-pressed={c.unit === u} onClick={() => setC({ ...c, unit: u })}>{u}</button>)}
            </div>
            <small>1 mg = 1,000 mcg</small>
          </div>
        </div>
        <div className="field"><span>Syringe</span>
          <div className="seg" role="group" aria-label="Syringe size">
            {SYRINGES.map(([v, l]) => <button type="button" key={v} aria-pressed={c.syr === v} onClick={() => setC({ ...c, syr: v })}>{l}</button>)}
          </div>
          <small>All are U-100 insulin syringes: 100 units = 1 mL</small>
        </div>
      </form>

      <section className="tile dark rise" aria-live="polite" style={rise(3)}>
        {!m ? (
          <><span className="eyebrow">Result</span><p className="sub">Enter the vial amount, the water added, and your dose.</p></>
        ) : (
          <>
            <div className="spread"><span className="eyebrow">Draw to</span><span className="sub xsmall">Math only, not dosing advice</span></div>
            <div className="result-big"><span className="n">{fmtNum(units, 1)}</span><span className="u">units</span><span className="sub">= {fmtNum(m.vol, 3)} mL</span></div>
            <div className="white-inset syringe-wrap"><Syringe units={m.units} cap={cap} /></div>
            <dl className="kv">
              <div><dt>Concentration</dt><dd>{fmtNum(m.conc, 3)} mg/mL</dd></div>
              <div><dt>Each unit holds</dt><dd>{fmtNum(m.mcgPerUnit, 2)} mcg</dd></div>
              <div><dt>Doses per vial</dt><dd>{fmtNum(Math.floor(m.perVial * 10) / 10, 1)}</dd></div>
              <div><dt>Your dose</dt><dd>{fmtNum(m.doseMg * 1000, 1)} mcg</dd></div>
            </dl>
            {calcAlerts(m, Number(c.vial), Number(c.ml), cap).map(a => (
              <div key={a.title} className={`alert ${a.tone === 'warn' ? 'warn' : a.tone}`}><b>{a.title}</b><span>{a.body}</span></div>
            ))}
          </>
        )}
      </section>

      {m && (
        <section className="tile rise" style={rise(4)}>
          <h2 className="label" style={{ color: 'var(--lilac-ink)' }}>Double-check a draw</h2>
          <label className="field"><span>I drew this many units</span>
            <input type="number" id="c-drawn" min="0" step="any" inputMode="decimal" placeholder="e.g. 10" value={c.drawn} onChange={set('drawn')} />
            <small>Shows the dose that amount actually contains</small>
          </label>
          {drawn > 0 && (() => {
            const mg = mgInUnits(drawn, m.conc);
            const ratio = mg / m.doseMg;
            const ok = Math.abs(ratio - 1) <= 0.1;
            return (
              <div className={`alert ${ok ? 'good' : 'caution'}`}>
                <b>{fmtNum(drawn, 1)} units contains {mg < 1 ? `${fmtNum(mg * 1000, 1)} mcg` : `${fmtNum(mg, 3)} mg`}.</b>
                <span>{ok ? 'That matches your prescribed dose.' : `That's ${fmtNum(ratio, 2)}× your prescribed dose. Stop and recheck before injecting.`}</span>
              </div>
            );
          })()}
        </section>
      )}

      <section className="tile rise" style={rise(5)}>
        <h3>How the math works</h3>
        <ol className="howto small">
          <li><b>Concentration</b> = mg in vial ÷ mL of water. 10 mg ÷ 2 mL = 5 mg/mL.</li>
          <li><b>Volume to draw</b> = dose ÷ concentration. 0.5 mg ÷ 5 mg/mL = 0.1 mL.</li>
          <li><b>Units</b> on a U-100 syringe = mL × 100. 0.1 mL = 10 units.</li>
        </ol>
        <p className="small muted">Common mistakes: mixing up mcg and mg (a 1,000× error), reading a U-40 or tuberculin syringe as if it were U-100, and grabbing the wrong vial when you keep several. Label every vial with what it is, its concentration, and the date you mixed it.</p>
      </section>
    </section>
  );
}
