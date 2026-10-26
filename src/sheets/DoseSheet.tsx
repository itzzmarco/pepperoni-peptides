import { useMemo, useState } from 'react';
import type { Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { freqText } from '../lib/schedule';
import { fmtNum, fmtTime, newId, toLocalInput } from '../lib/format';
import { lastUsedBySite } from '../lib/sites';
import { INJECTABLE, ROUTES, UNITS } from '../data/options';
import { BodyMap } from '../components/BodyMap';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { CheckIcon, CloseIcon } from '../components/Icons';
import { regName } from '../views/LogView';

export function DoseSheet({ r, onClose }: { r: Regimen; onClose: () => void }) {
  const toast = useToast();
  const { doses } = useLedger();
  const last = useMemo(() => lastUsedBySite(doses), [doses]);
  const [d, setD] = useState({ amount: r.dose, unit: r.unit, at: toLocalInput(new Date()), route: r.route, site: '', notes: '' });
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value });
  const amt = Number(d.amount);
  const unitDiffers = d.unit !== r.unit;
  const amountDiffers = !unitDiffers && Number(r.dose) > 0 && amt > 0 && Math.abs(amt / Number(r.dose) - 1) > 0.01;
  const injectable = INJECTABLE.has(d.route);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const at = new Date(d.at || Date.now());
    if (isNaN(at.getTime())) { toast('Enter a valid date and time.'); return; }
    if (!(amt > 0)) { toast('Enter the amount you took.'); return; }
    store.addDose({ id: newId(), rid: r.id, name: regName(r), at: at.toISOString(), amount: d.amount, unit: d.unit, route: d.route, site: injectable ? d.site : '', notes: d.notes.trim() });
    toast(`Logged ${regName(r)} at ${fmtTime(at)}.`);
    onClose();
  };

  return (
    <Sheet onClose={onClose} label={`Log ${regName(r)}`}>
      <form className="stack" style={{ gap: 16 }} onSubmit={submit} noValidate>
        <div className="sheet-head">
          <div><span className="eyebrow">Log a dose</span><h2>{regName(r)}</h2><p className="small muted" style={{ marginTop: 4 }}>{freqText(r)} · prescribed <span className="mono">{fmtNum(Number(r.dose), 3)} {r.unit}</span></p></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>
        <div className="grid-3">
          <label className="field"><span>Amount</span><input type="number" id="d-amount" step="any" min="0" value={d.amount} onChange={set('amount')} /></label>
          <label className="field"><span>Unit</span><select id="d-unit" value={d.unit} onChange={set('unit')}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></label>
          <label className="field"><span>When</span><input type="datetime-local" id="d-at" value={d.at} onChange={set('at')} /></label>
        </div>
        {!amountDiffers && !unitDiffers && amt > 0 && (
          <p className="match-note"><CheckIcon size={16} />Matches your regimen: {fmtNum(Number(r.dose), 3)} {r.unit}, {freqText(r).toLowerCase()}</p>
        )}
        {(amountDiffers || unitDiffers) && (
          <p className="small" style={{ color: 'var(--warn)' }}>
            {unitDiffers
              ? `The unit differs from your saved regimen (${r.unit}). Double-check mcg vs mg.`
              : `This differs from your saved dose (${fmtNum(Number(r.dose), 3)} ${r.unit}). Only change a dose on your prescriber's advice.`}
          </p>
        )}
        <label className="field"><span>How it was taken</span><select id="d-route" value={d.route} onChange={set('route')}>{ROUTES.map(x => <option key={x}>{x}</option>)}</select></label>
        {injectable && (
          <div className="field"><span>Injection site</span><BodyMap selected={d.site} onSelect={site => setD({ ...d, site })} last={last} /></div>
        )}
        <label className="field"><span>Notes <small>(optional)</small></span><input type="text" id="d-notes" maxLength={200} placeholder="e.g. new vial, mild sting" value={d.notes} onChange={set('notes')} /></label>
        <div className="sheet-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn big">Save dose</button>
        </div>
      </form>
    </Sheet>
  );
}
