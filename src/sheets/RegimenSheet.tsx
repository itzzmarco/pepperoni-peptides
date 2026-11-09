import { useCallback, useEffect, useRef, useState } from 'react';
import type { Peptide, Regimen } from '../lib/types';
import { samePeptide, store, useLedger } from '../lib/store';
import { DAY_SHORT, FREQS, WEEK, freqText, weekdaysOf } from '../lib/schedule';
import { configured, useAccount } from '../lib/account';
import { SYRINGE_UNITS, drugAmount, isVolumeUnit } from '../lib/doseMath';
import { checkDose } from '../lib/vial';
import { dayKey, fmtNum, newId } from '../lib/format';
import { PEP, PEPTIDES } from '../data/peptides';
import { FAMILIES, LEGAL, TIERS } from '../data/reference';
import { ROUTES, SOURCES, UNREGULATED_SOURCE } from '../data/options';
import { measuresFor } from '../data/measures';
import { Sheet } from '../components/Sheet';
import { UnitOptions, UsualUnits } from '../components/UnitPicker';
import { useToast } from '../components/Toast';
import { FamilyGlyph } from '../components/FamilyGlyph';
import { TierChip } from '../components/Chips';
import { regName } from '../views/PeptidesView';
import { matches } from '../views/LibraryView';
import { useFieldError } from '../components/FieldError';

const OTHER = '__other';

export const isRisky = (p?: Peptide) => !!p && (p.tier >= 3 || ['restricted', 'unapproved', 'investigational', 'pending', 'interim'].includes(p.legal));

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

/**
 * The compound picker: a search box over the library, each row with its family glyph and evidence tier like the Learn
 * cards. Once something is chosen it folds to that one row and a Change button. `field` carries the error wiring.
 */
function CompoundPicker({ pick, onPick, field }: { pick: string; onPick: (v: string) => void; field: object }) {
  const [finding, setFinding] = useState(!pick);
  const [q, setQ] = useState('');
  const change = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  // Choosing or reopening moves focus to what replaced the button just pressed, so keyboard users keep their place.
  const moved = useRef(false);
  useEffect(() => { if (moved.current) (finding ? search : change).current?.focus(); }, [finding]);
  const p = PEP[pick];
  const found = PEPTIDES.filter(x => matches(x, { q, fam: 'all', tier: 'all', legal: 'all' }));
  const take = (v: string) => { onPick(v); setQ(''); moved.current = true; setFinding(false); };
  const row = (v: string, x?: Peptide) => (
    <button key={v} type="button" className="find-row" aria-pressed={pick === v} onClick={() => take(v)}>
      {x && <FamilyGlyph family={x.family} size={36} />}
      <span className="nm">{x ? x.name : 'Something else (type the name)'}{x && <span className="meta"><TierChip t={x.tier} /><small>{FAMILIES[x.family]?.name}</small></span>}</span>
    </button>
  );
  return (
    <div className="field">
      <span id="r-compound-l">Peptide or medication</span>
      {!finding ? (
        <div className="picked">
          {p && <FamilyGlyph family={p.family} size={36} />}
          <span className="nm"><b>{p ? p.name : 'Something else'}</b>{p && <TierChip t={p.tier} />}</span>
          <button ref={change} type="button" className="btn quiet sm" onClick={() => { moved.current = true; setFinding(true); }} aria-label="Change peptide">Change</button>
        </div>
      ) : (
        <>
          <div className="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input ref={search} type="search" id="r-compound" {...field} aria-label="Search peptides" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, nickname or goal" autoComplete="off" />
          </div>
          <div className="find-list" role="group" aria-labelledby="r-compound-l">
            {found.map(x => row(x.id, x))}
            {!found.length && <p className="small muted find-none">No matches</p>}
            {row(OTHER)}
          </div>
        </>
      )}
    </div>
  );
}

/** The unit a new regimen starts with: how the compound is usually measured. */
const startUnit = (compoundId: string) => measuresFor(compoundId)[0]?.u ?? PEP[compoundId]?.defaultUnit;

export function blankRegimen(compoundId = ''): Regimen {
  const p = PEP[compoundId];
  return {
    id: newId(), compoundId, name: '', dose: '', unit: startUnit(compoundId) ?? 'mg', freq: 'weekly', everyDays: '',
    route: p?.defaultRoute ?? 'Subcutaneous injection', prescriber: '', source: '', start: dayKey(new Date()),
    vialMg: '', diluentMl: '', notes: '',
  };
}

/** `onLog` opens the dose sheet for a peptide already tracked; `onSignIn` opens sign-in. */
export function RegimenSheet({ initial, isNew, onClose, onSaved, onLog, onSignIn }: {
  initial: Regimen; isNew: boolean; onClose: () => void; onSaved: (r?: Regimen) => void; onLog?: (r: Regimen) => void; onSignIn?: () => void;
}) {
  const toast = useToast();
  const { regimens, doses } = useLedger();
  const signedIn = !!useAccount().user;
  const [r, setR] = useState<Regimen>(initial);
  const startPick = initial.compoundId || (initial.name ? OTHER : '');
  const [pick, setPick] = useState(startPick);
  const [ack, setAck] = useState(false);
  // A rejected save names the field at fault, under it and with focus on it (see useFieldError).
  const { err, fail, errFor, invalid } = useFieldError('r-err');
  const [armed, setArmed] = useState(false);
  const firstTime = isNew && regimens.length === 0;
  const p = PEP[pick];
  const set = <K extends keyof Regimen>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setR({ ...r, [k]: e.target.value });
  const { math, checks } = checkDose({ ...r, compoundId: p ? pick : '' }, r.dose, r.unit);
  const volume = isVolumeUnit(r.unit);
  // Changing the unit of a regimen that has history: offer to relabel the doses logged in the old unit.
  const oldUnitDoses = isNew || r.unit === initial.unit ? [] : doses.filter(x => x.rid === r.id && x.unit === initial.unit);
  const [relabel, setRelabel] = useState(false);
  // Adding something already in the list is usually someone looking for where to log today's dose.
  const already = isNew && pick ? regimens.find(x => !x.paused && samePeptide(x, { compoundId: p ? pick : '', name: pick === OTHER ? r.name : '' })) : undefined;

  // Dismissing a changed form (Escape, a scrim tap, a drag, the close button, Cancel) first asks in the footer, as Fill
  // in past days does: Keep editing, or Discard and leave. A second dismiss leaves; any new edit takes the question away.
  // `close` keeps one identity for the sheet's life, since Sheet re-focuses itself whenever onClose changes.
  const dirty = pick !== startPick || ack || relabel || JSON.stringify(r) !== JSON.stringify(initial);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  leavingRef.current = leaving;
  const keep = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    if (dirtyRef.current && !leavingRef.current) { setLeaving(true); return; }
    onClose();
  }, [onClose]);
  useEffect(() => { setLeaving(false); }, [r, pick, ack, relabel]);
  useEffect(() => { if (leaving) keep.current?.focus(); }, [leaving]);

  // Choosing set weekdays starts with today's day ticked, so there's always at least one.
  const setFreq = (freq: string) => setR(cur => ({ ...cur, freq, weekdays: freq === 'days' && !weekdaysOf(cur).length ? [new Date().getDay()] : cur.weekdays }));
  const toggleDay = (d: number) => setR(cur => {
    const has = weekdaysOf(cur).includes(d);
    return { ...cur, weekdays: has ? weekdaysOf(cur).filter(x => x !== d) : [...weekdaysOf(cur), d] };
  });

  const choose = (v: string) => {
    setPick(v);
    const np = PEP[v];
    setR(cur => ({ ...cur, compoundId: np ? v : '', route: isNew && np?.defaultRoute ? np.defaultRoute : cur.route, unit: isNew && np ? startUnit(v) ?? cur.unit : cur.unit }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Regimen = { ...r, compoundId: p ? pick : '', name: pick === OTHER ? r.name.trim() : '', prescriber: r.prescriber.trim(), notes: r.notes.trim(), weekdays: r.freq === 'days' ? weekdaysOf(r) : undefined };
    const problem: [string, string] | null = !out.compoundId && !out.name ? [pick === OTHER ? 'r-name' : 'r-compound', 'Choose a peptide or type a name.']
      : !(Number(out.dose) > 0) ? ['r-dose', 'Enter the dose you were prescribed.']
      : out.freq === 'custom' && !(Number(out.everyDays) >= 1) ? ['r-every', 'Enter how many days between doses.']
      : out.freq === 'days' && !weekdaysOf(out).length ? ['r-days', 'Choose at least one day of the week.']
      : firstTime && !ack ? ['r-ack', "Please confirm you understand this log isn't medical advice."] : null;
    if (problem) { fail(...problem); return; }
    if (isNew) out.createdAt = new Date().toISOString();
    const relabeled = relabel ? oldUnitDoses.map(x => ({ ...x, unit: out.unit })) : [];
    if (relabeled.length) store.applyBatch({ doses: relabeled });
    store.saveRegimen(out);
    toast(isNew ? `Tracking ${regName(out)}.` : relabeled.length ? `Saved, and ${relabeled.length === 1 ? '1 past dose' : `${relabeled.length} past doses`} now say ${out.unit}.` : 'Saved.');
    onSaved(out);
  };

  return (
    <Sheet onClose={close} label={isNew ? 'Track a peptide' : 'Edit regimen'}>
      <form className="stack gap-4" onSubmit={submit} noValidate>
        <div className="sheet-head">
          <div>
            <h2>{isNew ? 'Track a peptide' : `Edit ${regName(initial)}`}</h2>
            <p className="small muted mt-1">Enter what your prescriber told you. This app doesn't suggest doses.</p>
          </div>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </div>
        {firstTime && configured && !signedIn && onSignIn && (
          <div className="alert info" role="note">
            <b>Have an account? Sign in first.</b>
            <span>You're signed out, so what you add here stays on this device only. Signing in brings back the peptides, shots and weights already in your account.</span>
            <div className="mt-2"><button type="button" className="btn sm" onClick={onSignIn}>Sign in</button></div>
          </div>
        )}
        {/* The form comes in labelled tiles, like the dose sheet: what it is, the prescribed dose, the schedule, where it comes from. */}
        <section className="tile" aria-labelledby="r-what-h">
          <h3 id="r-what-h" className="eyebrow">Peptide</h3>
          <CompoundPicker pick={pick} onPick={choose} field={invalid('r-compound')} />
          {errFor('r-compound')}
          {pick === OTHER && <label className="field"><span>Name</span><input type="text" id="r-name" {...invalid('r-name')} value={r.name} onChange={set('name')} maxLength={80} /></label>}
          {errFor('r-name')}
          {already && (
            <div className="alert info" role="status">
              <b>You already track {regName(already)}: {fmtNum(Number(already.dose), 3)} {already.unit}, {freqText(already).toLowerCase()}.</b>
              <span>To record a dose you just took, log it there so it stays with your history. Add it again here only for a second, separate regimen.</span>
              {onLog && <div className="mt-2"><button type="button" className="btn sm" onClick={() => onLog(already)}>Log a {regName(already)} dose</button></div>}
            </div>
          )}
          <Caution p={p} />
        </section>
        <section className="tile lilac" aria-labelledby="r-dose-h">
          <h3 id="r-dose-h" className="eyebrow tone-lilac">Prescribed</h3>
          <div className="grid-2">
            <label className="field"><span>Dose</span><input type="number" id="r-dose" {...invalid('r-dose')} step="any" min="0" inputMode="decimal" value={r.dose} onChange={set('dose')} /></label>
            <label className="field"><span>Unit</span><select id="r-unit" value={r.unit} onChange={set('unit')}><UnitOptions compoundId={p ? pick : ''} /></select></label>
          </div>
          {errFor('r-dose')}
          <UsualUnits compoundId={p ? pick : ''} value={r.unit} onPick={u => setR({ ...r, unit: u })} />
          <label className="field"><span>How it's taken</span><select id="r-route" value={r.route} onChange={set('route')}>{ROUTES.map(x => <option key={x}>{x}</option>)}</select></label>
        </section>
        <section className="tile sky" aria-labelledby="r-when-h">
          <h3 id="r-when-h" className="eyebrow tone-sky">Schedule</h3>
          <div className="grid-2">
            <label className="field"><span>How often</span><select id="r-freq" value={r.freq} onChange={e => setFreq(e.target.value)}>{FREQS.map(f => <option key={f.k} value={f.k}>{f.label}</option>)}</select></label>
            <label className="field"><span>Start date</span><input type="date" id="r-start" value={r.start} onChange={set('start')} /></label>
          </div>
          {r.freq === 'days' && (
            <div className="field">
              <span id="r-days-h">Which days?</span>
              <div className="row-wrap weekdays" id="r-days" role="group" aria-labelledby="r-days-h" {...(err?.at === 'r-days' ? { 'aria-describedby': 'r-err' } : {})}>
                {WEEK.map(d => <button key={d} type="button" className="fchip" aria-pressed={weekdaysOf(r).includes(d)} onClick={() => toggleDay(d)}>{DAY_SHORT[d]}</button>)}
              </div>
              {errFor('r-days')}
              <small>For 5 days on, 2 off, pick Mon to Fri. Due days follow the calendar, so a late dose doesn't move the next one.</small>
            </div>
          )}
          {r.freq === 'custom' && <label className="field"><span>Every how many days?</span><input type="number" id="r-every" {...invalid('r-every')} min="1" step="1" value={r.everyDays} onChange={set('everyDays')} /></label>}
          {errFor('r-every')}
        </section>
        <section className="tile" aria-labelledby="r-src-h">
          <h3 id="r-src-h" className="eyebrow">Source</h3>
          <div className="grid-2">
            <label className="field"><span>Prescribed by <small>(optional)</small></span><input type="text" id="r-prescriber" value={r.prescriber} onChange={set('prescriber')} maxLength={80} placeholder="Clinician or clinic" /></label>
            <label className="field"><span>Where it comes from</span>
              <select id="r-source" value={r.source} onChange={set('source')}><option value="">Choose…</option>{SOURCES.map(s => <option key={s}>{s}</option>)}</select>
            </label>
          </div>
          {r.source === UNREGULATED_SOURCE && (
            <div className="alert warn"><b>Products from online vendors aren't regulated.</b><span>Independent tests have found wrong amounts, impurities, and bacterial endotoxin in "research use only" vials. A licensed pharmacy is the safer route when one is available.</span></div>
          )}
        </section>
        <div className="tile lilac">
          <details open={!!r.vialMg || isVolumeUnit(r.unit) || checks.length > 0}>
            <summary className="small" style={{ cursor: 'pointer' }}>
              {volume ? <><b>Vial details</b> Add them to see how much drug each dose is</> : <><b>Mixing from powder?</b> Add vial details to see units per dose</>}
            </summary>
            <div className="grid-2 mt-3">
              <label className="field"><span>{volume ? 'Drug in vial (mg)' : 'Powder in vial (mg)'}</span><input type="number" id="r-vial" step="any" min="0" value={r.vialMg} onChange={set('vialMg')} /></label>
              <label className="field"><span>{volume ? 'Liquid in vial (mL)' : 'Water added (mL)'}</span><input type="number" id="r-ml" step="any" min="0" value={r.diluentMl} onChange={set('diluentMl')} /></label>
            </div>
            <p className="xsmall muted mt-2">Measured the water with an insulin syringe? 100 units = 1 mL.</p>
            {checks.map(c => (
              <div key={c.title} className="alert danger mt-3" role="alert">
                <b>{c.title}</b><span>{c.body}</span>
                {c.fix && (
                  <div className="mt-2">
                    <button type="button" className="btn sm" onClick={() => {
                      setR(cur => ({ ...cur, ...c.fix!.set }));
                      // Doses saved as mg that were really syringe units are the same mix-up, so fix them too by default.
                      if (c.fix!.set.unit === SYRINGE_UNITS) setRelabel(true);
                    }}>{c.fix.label}</button>
                  </div>
                )}
              </div>
            ))}
            <p className="small muted mt-2">
              {math && volume
                ? <>Concentration {fmtNum(math.conc, 3)} mg/mL. Each {r.unit === 'mL' ? `${fmtNum(Number(r.dose), 3)} mL dose` : `${fmtNum(Number(r.dose), 3)}-unit dose (${fmtNum(math.vol, 3)} mL)`} is <b className="mono">{drugAmount(math.doseMg, p?.defaultUnit)}</b>, about {fmtNum(Math.floor(math.perVial), 0)} doses per vial.</>
                : math ? <>Concentration {fmtNum(math.conc, 3)} mg/mL. Each dose is <b className="mono">{fmtNum(math.units, 1)} units</b> ({fmtNum(math.vol, 3)} mL) on a U-100 syringe, about {fmtNum(Math.floor(math.perVial), 0)} doses per vial.</>
                : checks.length ? 'Fix the numbers above to see the dose math.'
                : volume ? 'Enter the mg of drug in the vial and the mL of liquid in it. If you mixed it yourself, that\'s the powder and the water you added.'
                : 'Enter the dose in mcg or mg plus the vial details.'}
            </p>
          </details>
        </div>
        {oldUnitDoses.length > 0 && (
          <div className="checks block"><label><input type="checkbox" id="r-relabel" checked={relabel} onChange={e => setRelabel(e.target.checked)} /> Also change the {oldUnitDoses.length === 1 ? 'dose' : `${oldUnitDoses.length} doses`} you logged in {initial.unit} to {r.unit}. Only if they were saved in the wrong unit; the amounts stay the same.</label></div>
        )}
        <label className="field"><span>Notes <small>(optional)</small></span><textarea id="r-notes" maxLength={500} value={r.notes} onChange={set('notes')} /></label>
        {firstTime && (
          <div className="checks block"><label><input type="checkbox" id="r-ack" {...invalid('r-ack')} checked={ack} onChange={e => setAck(e.target.checked)} /> I understand this log isn't medical advice and won't tell me what dose to take.</label></div>
        )}
        {errFor('r-ack')}
        <div className="sheet-foot">
          <p className="sr-only" role="status">{leaving ? 'Leave without saving? Your changes to this form will be lost.' : ''}</p>
          {leaving ? (
            <>
              <p className="small ask" aria-hidden="true"><b>Leave without saving?</b> Your changes to this form will be lost.</p>
              <button ref={keep} type="button" className="btn ghost" onClick={() => setLeaving(false)}>Keep editing</button>
              <button type="button" className="btn danger" onClick={onClose}>Discard and leave</button>
            </>
          ) : <>
          {!isNew && (
            <button type="button" className={`btn ${armed ? 'danger' : 'quiet'}`}
              onClick={() => { if (armed) { store.deleteRegimen(r.id); toast('Removed. Logged doses stay in your history.'); onSaved(); } else setArmed(true); }}>
              {armed ? 'Delete it? Tap again' : 'Delete'}
            </button>
          )}
          <button type="button" className="btn ghost" onClick={close}>Cancel</button>
          <button type="submit" className="btn">{isNew ? 'Start tracking' : 'Save'}</button>
          </>}
        </div>
      </form>
    </Sheet>
  );
}
