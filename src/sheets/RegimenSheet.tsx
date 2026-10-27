import { useState } from 'react';
import type { FamilyKey, Peptide, Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { FREQS } from '../lib/schedule';
import { doseMath } from '../lib/doseMath';
import { dayKey, fmtNum, newId } from '../lib/format';
import { PEP, PEPTIDES } from '../data/peptides';
import { FAMILIES, LEGAL, TIERS } from '../data/reference';
import { ROUTES, SOURCES, UNITS, UNREGULATED_SOURCE } from '../data/options';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { regName } from '../views/PeptidesView';

const OTHER = '__other';

export const isRisky = (p?: Peptide) => !!p && (p.tier >= 3 || ['restricted', 'unapproved', 'investigational', 'pending'].includes(p.legal));

function Caution({ p }: { p?: Peptide }) {
  if (!p || !isRisky(p)) return null;
  return (
    <div className={`alert ${p.tier >= 4 ? 'danger' : 'warn'}`}>
      <b>{p.name}: Tier {p.tier} ({TIERS[p.tier].label}) · {LEGAL[p.legal]?.label}</b>
      <span>{TIERS[p.tier].long}. Logging it here doesn't make it safer. Share this log with a clinician who knows you're using it.</span>
      {p.avoid?.length ? <span><b>Avoid if:</b> {p.avoid.slice(0, 3).join('; ')}</span> : null}
      <a href={`#${p.id}`}>Read the full {p.name} entry</a>
    </div>
  );
}

export function blankRegimen(compoundId = ''): Regimen {
  const p = PEP[compoundId];
  return {
    id: newId(), compoundId, name: '', dose: '', unit: p?.defaultUnit ?? 'mg', freq: 'weekly', everyDays: '',
    route: p?.defaultRoute ?? 'Subcutaneous injection', prescriber: '', source: '', start: dayKey(new Date()),
    vialMg: '', diluentMl: '', notes: '',
  };
}

export function RegimenSheet({ initial, isNew, onClose, onSaved }: { initial: Regimen; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const { regimens } = useLedger();
  const [r, setR] = useState<Regimen>(initial);
  const [pick, setPick] = useState(initial.compoundId || (initial.name ? OTHER : ''));
  const [ack, setAck] = useState(false);
  const [err, setErr] = useState('');
  const [armed, setArmed] = useState(false);
  const firstTime = isNew && regimens.length === 0;
  const p = PEP[pick];
  const set = <K extends keyof Regimen>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setR({ ...r, [k]: e.target.value });
  const math = doseMath(r.dose, r.unit, r.vialMg, r.diluentMl);

  const choose = (v: string) => {
    setPick(v);
    const np = PEP[v];
    setR(cur => ({ ...cur, compoundId: np ? v : '', route: isNew && np?.defaultRoute ? np.defaultRoute : cur.route, unit: isNew && np?.defaultUnit ? np.defaultUnit : cur.unit }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Regimen = { ...r, compoundId: p ? pick : '', name: pick === OTHER ? r.name.trim() : '', prescriber: r.prescriber.trim(), notes: r.notes.trim() };
    const problem = !out.compoundId && !out.name ? 'Choose a peptide or type a name.'
      : !(Number(out.dose) > 0) ? 'Enter the dose you were prescribed.'
      : out.freq === 'custom' && !(Number(out.everyDays) >= 1) ? 'Enter how many days between doses.'
      : firstTime && !ack ? "Please confirm you understand this log isn't medical advice." : '';
    if (problem) { setErr(problem); return; }
    if (isNew) out.createdAt = new Date().toISOString();
    store.saveRegimen(out);
    toast(isNew ? `Tracking ${regName(out)}.` : 'Saved.');
    onSaved();
  };

  return (
    <Sheet onClose={onClose} label={isNew ? 'Track a peptide' : 'Edit regimen'}>
      <form className="stack" style={{ gap: 16 }} onSubmit={submit} noValidate>
        <div className="sheet-head">
          <div>
            <h2>{isNew ? 'Track a peptide' : `Edit ${regName(initial)}`}</h2>
            <p className="small muted" style={{ marginTop: 4 }}>Enter what your prescriber told you. This app doesn't suggest doses.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </div>
        <label className="field"><span>Peptide or medication</span>
          <select id="r-compound" value={pick} onChange={e => choose(e.target.value)}>
            <option value="">Choose…</option>
            {(Object.keys(FAMILIES) as FamilyKey[]).map(k => (
              <optgroup key={k} label={FAMILIES[k].name}>
                {PEPTIDES.filter(x => x.family === k).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </optgroup>
            ))}
            <option value={OTHER}>Something else (type the name)</option>
          </select>
        </label>
        {pick === OTHER && <label className="field"><span>Name</span><input type="text" id="r-name" value={r.name} onChange={set('name')} maxLength={80} /></label>}
        <Caution p={p} />
        <div className="grid-3">
          <label className="field"><span>Dose</span><input type="number" id="r-dose" step="any" min="0" inputMode="decimal" value={r.dose} onChange={set('dose')} /></label>
          <label className="field"><span>Unit</span><select id="r-unit" value={r.unit} onChange={set('unit')}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></label>
          <label className="field"><span>How often</span><select id="r-freq" value={r.freq} onChange={set('freq')}>{FREQS.map(f => <option key={f.k} value={f.k}>{f.label}</option>)}</select></label>
        </div>
        {r.freq === 'custom' && <label className="field"><span>Every how many days?</span><input type="number" id="r-every" min="1" step="1" value={r.everyDays} onChange={set('everyDays')} /></label>}
        <div className="grid-2">
          <label className="field"><span>How it's taken</span><select id="r-route" value={r.route} onChange={set('route')}>{ROUTES.map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="field"><span>Start date</span><input type="date" id="r-start" value={r.start} onChange={set('start')} /></label>
        </div>
        <div className="grid-2">
          <label className="field"><span>Prescribed by <small>(optional)</small></span><input type="text" id="r-prescriber" value={r.prescriber} onChange={set('prescriber')} maxLength={80} placeholder="Clinician or clinic" /></label>
          <label className="field"><span>Where it comes from</span>
            <select id="r-source" value={r.source} onChange={set('source')}><option value="">Choose…</option>{SOURCES.map(s => <option key={s}>{s}</option>)}</select>
          </label>
        </div>
        {r.source === UNREGULATED_SOURCE && (
          <div className="alert warn"><b>Products from online vendors aren't regulated.</b><span>Independent tests have found wrong amounts, impurities, and bacterial endotoxin in "research use only" vials. A licensed pharmacy is the safer route when one is available.</span></div>
        )}
        <details open={!!r.vialMg}>
          <summary className="small" style={{ cursor: 'pointer' }}><b>Mixing from powder?</b> Add vial details to see units per dose</summary>
          <div className="grid-2" style={{ marginTop: 10 }}>
            <label className="field"><span>Powder in vial (mg)</span><input type="number" id="r-vial" step="any" min="0" value={r.vialMg} onChange={set('vialMg')} /></label>
            <label className="field"><span>Water added (mL)</span><input type="number" id="r-ml" step="any" min="0" value={r.diluentMl} onChange={set('diluentMl')} /></label>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {math ? <>Concentration {fmtNum(math.conc, 3)} mg/mL. Each dose is <b className="mono">{fmtNum(math.units, 1)} units</b> ({fmtNum(math.vol, 3)} mL) on a U-100 syringe, about {fmtNum(Math.floor(math.perVial), 0)} doses per vial.</> : 'Enter the dose in mcg or mg plus the vial details.'}
          </p>
        </details>
        <label className="field"><span>Notes <small>(optional)</small></span><textarea id="r-notes" maxLength={500} value={r.notes} onChange={set('notes')} /></label>
        {firstTime && (
          <div className="checks"><label><input type="checkbox" id="r-ack" checked={ack} onChange={e => setAck(e.target.checked)} /> I understand this log isn't medical advice and won't tell me what dose to take.</label></div>
        )}
        {err && <p className="small" style={{ color: 'var(--danger)' }} role="alert">{err}</p>}
        <div className="sheet-foot">
          {!isNew && (
            <button type="button" className={`btn ${armed ? 'danger' : 'quiet'}`}
              onClick={() => { if (armed) { store.deleteRegimen(r.id); toast('Removed. Logged doses stay in your history.'); onSaved(); } else setArmed(true); }}>
              {armed ? 'Delete it? Tap again' : 'Delete'}
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">{isNew ? 'Start tracking' : 'Save'}</button>
        </div>
      </form>
    </Sheet>
  );
}
