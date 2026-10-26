import { useState } from 'react';
import { calcAlerts, doseMath, mgInUnits } from '../lib/doseMath';
import { fmtNum } from '../lib/format';
import { Fields } from '../components/Chips';
import { Syringe } from '../components/Syringe';
import { AlertIcon, CheckIcon } from '../components/Icons';

const SYRINGES: [units: string, ml: string][] = [['30', '0.3 mL'], ['50', '0.5 mL'], ['100', '1 mL']];

export function CalculatorView() {
  const [c, setC] = useState({ vial: '10', ml: '2', dose: '500', unit: 'mcg', syr: '50', drawn: '' });
  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value });
  const m = doseMath(c.dose, c.unit, c.vial, c.ml);
  const cap = Number(c.syr);
  const drawn = Number(c.drawn);
  const check = m && drawn > 0 ? (() => {
    const mg = mgInUnits(drawn, m.conc);
    const ratio = mg / m.doseMg;
    return { mg, ratio, ok: Math.abs(ratio - 1) <= 0.1 };
  })() : null;

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h1>Dose math</h1>
          <p>Math for a dose your prescriber gave you. FDA has reports of measuring mistakes that sent people to the hospital, so check the result with your pharmacist.</p>
        </div>
      </div>
      <div className="calc">
        {/* The result comes first so it stays in view on phones while the numbers below change. */}
        <section className="label-card calc-result" aria-live="polite" aria-labelledby="draw-h">
          <div className="lc-head">
            <h2 id="draw-h" className="label-h">Draw to</h2>
            <span className="xsmall faint">Math only, not dosing advice</span>
          </div>
          {!m ? (
            <p className="lc-body muted">Enter the vial amount, the water added, and your dose.</p>
          ) : (
            <>
              <div className="lc-body">
                <div className="result-big"><span className="n mono">{fmtNum(m.units, 1)}</span><span className="u">units</span><span className="muted small">= {fmtNum(m.vol, 3)} mL on a U-100 syringe</span></div>
                <div className="syringe-wrap"><Syringe units={m.units} cap={cap} /></div>
              </div>
              <Fields className="fields-2x2" cols="repeat(2, minmax(0, 1fr))" items={[
                ['Concentration', <span className="mono">{fmtNum(m.conc, 3)} mg/mL</span>],
                ['Each unit holds', <span className="mono">{fmtNum(m.mcgPerUnit, 2)} mcg</span>],
                ['Doses per vial', <span className="mono">{fmtNum(Math.floor(m.perVial * 10) / 10, 1)}</span>],
                ['Your dose', <span className="mono">{fmtNum(m.doseMg * 1000, 1)} mcg</span>],
              ]} />
              {calcAlerts(m, Number(c.vial), Number(c.ml), cap).map(a => (
                <div key={a.title} className={`alert ${a.tone} flush`}><b>{a.title}</b><span>{a.body}</span></div>
              ))}
            </>
          )}
        </section>

        <div className="stack" style={{ gap: 16 }}>
          <form className="panel stack" onSubmit={e => e.preventDefault()} autoComplete="off" aria-label="Your vial and dose">
            <div className="panel-head" style={{ margin: 0 }}><h2 className="h-card">Your vial</h2><span className="xsmall faint">Example values filled in</span></div>
            <div className="grid-2">
              <label className="field"><span>Powder in the vial</span>
                <span className="input-unit"><input type="number" id="c-vial" min="0" step="any" inputMode="decimal" value={c.vial} onChange={set('vial')} /><span>mg</span></span>
                <small>Printed on the vial label</small>
              </label>
              <label className="field"><span>Water added</span>
                <span className="input-unit"><input type="number" id="c-ml" min="0" step="any" inputMode="decimal" value={c.ml} onChange={set('ml')} /><span>mL</span></span>
                <small>Bacteriostatic or sterile water</small>
              </label>
            </div>
            <h2 className="h-card" style={{ marginTop: 6 }}>Your prescribed dose</h2>
            <div className="dose-row">
              <label className="field"><span>Dose</span><input type="number" id="c-dose" min="0" step="any" inputMode="decimal" value={c.dose} onChange={set('dose')} /></label>
              <div className="field"><span id="c-unit-l">Unit</span>
                <div className="seg" role="group" aria-labelledby="c-unit-l">
                  {['mcg', 'mg'].map(u => <button type="button" key={u} aria-pressed={c.unit === u} onClick={() => setC({ ...c, unit: u })}>{u}</button>)}
                </div>
              </div>
            </div>
            <p className="small warn-text">1 mg = 1,000 mcg. Mixing these up is a 1,000× error.</p>
            <div className="field"><span id="c-syr-l">Syringe</span>
              <div className="seg seg-fill" role="group" aria-labelledby="c-syr-l">
                {SYRINGES.map(([u, ml]) => (
                  <button type="button" key={u} aria-pressed={c.syr === u} onClick={() => setC({ ...c, syr: u })}>
                    <b>{ml}</b><span className="xsmall">{u} units</span>
                  </button>
                ))}
              </div>
              <small>All are U-100 insulin syringes: 100 units = 1 mL</small>
            </div>
          </form>

          <section className="panel stack" aria-labelledby="check-h">
            <h2 id="check-h" className="h-card">Double-check a draw</h2>
            <label className="field"><span>I drew this many units</span>
              <input type="number" id="c-drawn" min="0" step="any" inputMode="decimal" placeholder="e.g. 10" value={c.drawn} onChange={set('drawn')} />
              <small>Shows the dose that amount actually contains</small>
            </label>
            {check && (
              <div className={`alert ${check.ok ? 'good' : 'warn'} with-icon`} role="status">
                {check.ok ? <CheckIcon /> : <AlertIcon />}
                <div>
                  <b>{fmtNum(drawn, 1)} units contains {check.mg < 1 ? `${fmtNum(check.mg * 1000, 1)} mcg` : `${fmtNum(check.mg, 3)} mg`}.</b>
                  <span>{check.ok ? 'That matches your prescribed dose.' : `That's ${fmtNum(check.ratio, 2)}× your prescribed dose. Stop and recheck before injecting.`}</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      <section className="panel stack" aria-labelledby="how-h">
        <h2 id="how-h" className="h-card">How the math works</h2>
        <ol className="numbered">
          <li><span className="n mono">01</span><span><b>Concentration</b> = mg in vial ÷ mL of water<br /><span className="mono small muted">10 mg ÷ 2 mL = 5 mg/mL</span></span></li>
          <li><span className="n mono">02</span><span><b>Volume</b> = dose ÷ concentration<br /><span className="mono small muted">0.5 mg ÷ 5 mg/mL = 0.1 mL</span></span></li>
          <li><span className="n mono">03</span><span><b>Units</b> on a U-100 syringe = mL × 100<br /><span className="mono small muted">0.1 mL = 10 units</span></span></li>
        </ol>
        <p className="small muted">Common mistakes: mixing up mcg and mg, reading a U-40 or tuberculin syringe as if it were U-100, and grabbing the wrong vial when you keep several. Label every vial with what it is, its concentration, and the date you mixed it.</p>
      </section>
    </section>
  );
}
