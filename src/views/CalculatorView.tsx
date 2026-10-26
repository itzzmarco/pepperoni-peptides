import { useState } from 'react';
import { calcAlerts, doseMath, mgInUnits } from '../lib/doseMath';
import { fmtNum } from '../lib/format';
import { Syringe } from '../components/Syringe';

const SYRINGES: [string, string][] = [['30', '0.3 mL · 30 units'], ['50', '0.5 mL · 50 units'], ['100', '1 mL · 100 units']];

export function CalculatorView() {
  const [c, setC] = useState({ vial: '10', ml: '2', dose: '500', unit: 'mcg', syr: '50', drawn: '' });
  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value });
  const m = doseMath(c.dose, c.unit, c.vial, c.ml);
  const cap = Number(c.syr);
  const drawn = Number(c.drawn);
  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h1>Dose math</h1>
          <p>Reconstitution math for a dose your prescriber gave you: how concentrated the vial is, and how many units to draw on a U-100 insulin syringe. FDA has reports of measuring mistakes that sent people to the hospital, so check the result with your pharmacist.</p>
        </div>
      </div>
      <div className="calc">
        <form className="panel stack" onSubmit={e => e.preventDefault()} autoComplete="off">
          <div className="panel-head" style={{ margin: 0 }}><h3>Your vial</h3><span className="xsmall faint">Example values filled in</span></div>
          <div className="grid-2">
            <label className="field"><span>Powder in the vial</span>
              <div className="row-wrap" style={{ flexWrap: 'nowrap' }}><input type="number" id="c-vial" min="0" step="any" inputMode="decimal" value={c.vial} onChange={set('vial')} /><span className="muted">mg</span></div>
              <small>Printed on the vial label</small>
            </label>
            <label className="field"><span>Water added</span>
              <div className="row-wrap" style={{ flexWrap: 'nowrap' }}><input type="number" id="c-ml" min="0" step="any" inputMode="decimal" value={c.ml} onChange={set('ml')} /><span className="muted">mL</span></div>
              <small>Bacteriostatic or sterile water</small>
            </label>
          </div>
          <div className="panel-head" style={{ margin: '6px 0 0' }}><h3>Your prescribed dose</h3></div>
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
          <div className="panel-head" style={{ margin: '6px 0 0' }}><h3>Double-check a draw</h3></div>
          <label className="field"><span>I drew this many units</span>
            <input type="number" id="c-drawn" min="0" step="any" inputMode="decimal" placeholder="e.g. 10" value={c.drawn} onChange={set('drawn')} />
            <small>Shows the dose that amount actually contains</small>
          </label>
        </form>

        <section className="panel stack" aria-live="polite">
          {!m ? (
            <><h3>Result</h3><p className="muted">Enter the vial amount, the water added, and your dose.</p></>
          ) : (
            <>
              <div className="panel-head" style={{ margin: 0 }}><h3>Draw to</h3><span className="xsmall faint">Math only, not dosing advice</span></div>
              <div className="result-big"><span className="n">{fmtNum(m.units, 1)}</span><span className="u">units</span><span className="muted">= {fmtNum(m.vol, 3)} mL</span></div>
              <div className="syringe-wrap"><Syringe units={m.units} cap={cap} /></div>
              <dl className="kv">
                <div><dt>Concentration</dt><dd>{fmtNum(m.conc, 3)} mg/mL</dd></div>
                <div><dt>Each unit holds</dt><dd>{fmtNum(m.mcgPerUnit, 2)} mcg</dd></div>
                <div><dt>Doses per vial</dt><dd>{fmtNum(Math.floor(m.perVial * 10) / 10, 1)}</dd></div>
                <div><dt>Your dose</dt><dd>{fmtNum(m.doseMg * 1000, 1)} mcg</dd></div>
              </dl>
              {calcAlerts(m, Number(c.vial), Number(c.ml), cap).map(a => (
                <div key={a.title} className={`alert ${a.tone}`}><b>{a.title}</b><span>{a.body}</span></div>
              ))}
              {drawn > 0 && (() => {
                const mg = mgInUnits(drawn, m.conc);
                const ratio = mg / m.doseMg;
                const ok = Math.abs(ratio - 1) <= 0.1;
                return (
                  <div className={`alert ${ok ? 'good' : 'warn'}`}>
                    <b>{fmtNum(drawn, 1)} units contains {mg < 1 ? `${fmtNum(mg * 1000, 1)} mcg` : `${fmtNum(mg, 3)} mg`}.</b>
                    <span>{ok ? 'That matches your prescribed dose.' : `That's ${fmtNum(ratio, 2)}× your prescribed dose. Stop and recheck before injecting.`}</span>
                  </div>
                );
              })()}
            </>
          )}
        </section>
      </div>
      <section className="panel stack">
        <h3>How the math works</h3>
        <ol className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
          <li><b>Concentration</b> = mg in vial ÷ mL of water. 10 mg ÷ 2 mL = 5 mg/mL.</li>
          <li><b>Volume to draw</b> = dose ÷ concentration. 0.5 mg ÷ 5 mg/mL = 0.1 mL.</li>
          <li><b>Units</b> on a U-100 syringe = mL × 100. 0.1 mL = 10 units.</li>
        </ol>
        <p className="small muted">Common mistakes: mixing up mcg and mg (a 1,000× error), reading a U-40 or tuberculin syringe as if it were U-100, and grabbing the wrong vial when you keep several. Label every vial with what it is, its concentration, and the date you mixed it.</p>
      </section>
    </section>
  );
}
