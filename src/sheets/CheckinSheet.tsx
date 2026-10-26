import { useState } from 'react';
import type { Checkin } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { newId } from '../lib/format';
import { EFFECTS, RED_FLAGS, SCALES } from '../data/options';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { CloseIcon } from '../components/Icons';

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

/** A new check-in, or with `initial` the details for one already saved (the one-tap check-in on the log). */
export function CheckinSheet({ initial, onClose }: { initial?: Checkin; onClose: () => void }) {
  const toast = useToast();
  const { checkins } = useLedger();
  const [vals, setVals] = useState<Partial<Record<(typeof SCALES)[number][0], number>>>(() =>
    Object.fromEntries(SCALES.map(([k]) => [k, initial?.[k]]).filter(([, v]) => v != null)));
  const [effects, setEffects] = useState<string[]>(initial?.effects ?? []);
  const [flags, setFlags] = useState<string[]>(initial?.flags ?? []);
  const [weight, setWeight] = useState(initial?.weight ? String(initial.weight) : '');
  const [wUnit, setWUnit] = useState(() => initial?.weightUnit ?? checkins.find(c => c.weightUnit)?.weightUnit ?? 'lb');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: Checkin = { id: initial?.id ?? newId(), at: initial?.at ?? new Date().toISOString(), effects, flags, notes: notes.trim(), ...vals };
    if (Number(weight) > 0) { entry.weight = Number(weight); entry.weightUnit = wUnit; }
    if (initial) store.updateCheckin(entry);
    else store.addCheckin(entry);
    toast(flags.length ? 'Saved. Please get medical help now.' : 'Check-in saved.');
    onClose();
  };

  return (
    <Sheet onClose={onClose} label="Daily check-in">
      <form className="stack" style={{ gap: 16 }} onSubmit={submit} noValidate>
        <div className="sheet-head">
          <div><span className="eyebrow">{initial ? 'Add details' : 'Daily check-in'}</span><h2>How are you doing?</h2><p className="small muted" style={{ marginTop: 4 }}>1 is poor, 5 is great. Skip anything you like.</p></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>
        {SCALES.map(([k, l]) => (
          <div className="field" key={k}>
            <span>{l}</span>
            <div className="scale" role="group" aria-label={l}>
              {[1, 2, 3, 4, 5].map(n => (
                <button type="button" key={n} aria-pressed={vals[k] === n} onClick={() => setVals({ ...vals, [k]: vals[k] === n ? undefined : n })}>{n}</button>
              ))}
            </div>
          </div>
        ))}
        <div className="grid-2">
          <label className="field"><span>Weight <small>(optional)</small></span><input type="number" id="c-weight" step="any" min="0" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} /></label>
          <label className="field"><span>Unit</span><select id="c-wunit" value={wUnit} onChange={e => setWUnit(e.target.value)}><option>lb</option><option>kg</option></select></label>
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 6 }}>Side effects today</legend>
          <div className="checks">
            {EFFECTS.map(x => <label key={x}><input type="checkbox" checked={effects.includes(x)} onChange={() => setEffects(toggle(effects, x))} />{x}</label>)}
          </div>
        </fieldset>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 6, color: 'var(--danger)' }}>Emergency symptoms</legend>
          <div className="checks red">
            {RED_FLAGS.map(x => <label key={x}><input type="checkbox" checked={flags.includes(x)} onChange={() => setFlags(toggle(flags, x))} />{x}</label>)}
          </div>
        </fieldset>
        {flags.length > 0 && (
          <div className="alert danger" role="alert">
            <b>These symptoms need medical care now.</b>
            <span>Call 911 or go to the nearest emergency room. Don't wait to finish this form. For a possible overdose or poisoning, call Poison Control at 1-800-222-1222. If you're having thoughts of harming yourself, call or text 988.</span>
          </div>
        )}
        <label className="field"><span>Notes <small>(optional)</small></span><textarea id="c-notes" maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} /></label>
        <div className="sheet-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">Save check-in</button>
        </div>
      </form>
    </Sheet>
  );
}
