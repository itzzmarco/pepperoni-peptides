import { useMemo, useRef, useState } from 'react';
import type { Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { freqText } from '../lib/schedule';
import { drugAmount, isVolumeUnit } from '../lib/doseMath';
import { checkDose } from '../lib/vial';
import { DAY, fmtNum, fmtTime, newId, toLocalInput } from '../lib/format';
import { BELLY, bellyHour, lastUsedBySite, nextBellyHour, nextSite, siteLabel, sitePlan } from '../lib/sites';
import { INJECTABLE, ROUTES } from '../data/options';
import { PEP } from '../data/peptides';
import { BodyMap } from '../components/BodyMap';
import { BellyClock } from '../components/BellyClock';
import { Sheet } from '../components/Sheet';
import { Syringe } from '../components/Syringe';
import { UnitOptions } from '../components/UnitPicker';
import { useToast } from '../components/Toast';
import { useFieldError } from '../components/FieldError';
import { LeaveFoot, useLeaveGuard } from '../components/LeaveGuard';
import { regName } from '../views/PeptidesView';

const blank = (r: Regimen, site = '') => ({ amount: r.dose, unit: r.unit, at: toLocalInput(new Date()), route: r.route, site, notes: '' });
const ago = (t: Date) => {
  const d = Math.round((Date.now() - t.getTime()) / DAY);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

/** `onFix` opens the regimen's settings, for vial details that don't add up. */
export function DoseSheet({ r: initial, onClose, onFix }: { r: Regimen; onClose: () => void; onFix?: (r: Regimen) => void }) {
  const toast = useToast();
  const { fail, errFor, invalid } = useFieldError('d-err');
  const { doses, regimens } = useLedger();
  const active = regimens.filter(x => !x.paused);
  const [r, setR] = useState(initial);
  // This peptide's next spot in its own rotation starts out picked. `auto` stays true until the person taps a spot.
  const [first] = useState(() => nextSite(initial, doses));
  const [d, setD] = useState(() => blank(initial, first?.site));
  const [auto, setAuto] = useState(!!first);
  const last = useMemo(() => lastUsedBySite(doses), [doses]);
  // This regimen's belly-clock history, newest first.
  const bellyDoses = useMemo(() => doses.filter(x => x.rid === r.id && bellyHour(x.site)).slice(0, 3), [doses, r.id]);
  const recent = bellyDoses.map(x => bellyHour(x.site)!);
  const [view, setView] = useState<'clock' | 'body'>(first?.hour ? 'clock' : 'body');
  const next = nextBellyHour(recent[0] ?? null, last);
  // Each peptide keeps its own draft, so switching chips and back loses no edits.
  const drafts = useRef(new Map<string, { d: typeof d; auto: boolean; view: typeof view }>());
  // A changed dose form, or one whose other peptides hold drafts, asks before a stray dismiss throws it away (LeaveGuard).
  const guard = useLeaveGuard(JSON.stringify([r.id, d, [...drafts.current].filter(([id]) => id !== r.id)]), onClose);
  const { close } = guard;

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value });
  /** Picks the suggested spot for `x` given this way, and the view it's shown in. */
  const suggest = (x: Regimen, route: string, prefer?: 'clock' | 'map') => {
    const s = nextSite({ ...x, route }, doses, prefer);
    setAuto(!!s);
    if (!prefer) setView(s?.hour ? 'clock' : 'body');
    return s?.site ?? '';
  };
  const setRoute = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const route = e.target.value;
    setD({ ...d, route, site: auto || !d.site ? suggest(r, route) : d.site });
  };
  const showView = (v: 'clock' | 'body') => {
    setView(v);
    if (auto) setD({ ...d, site: suggest(r, d.route, v === 'clock' ? 'clock' : 'map') });
  };
  const pickSite = (site: string) => { setAuto(false); setD({ ...d, site }); };
  const amt = Number(d.amount);
  const unitDiffers = d.unit !== r.unit;
  const amountDiffers = !unitDiffers && Number(r.dose) > 0 && amt > 0 && Math.abs(amt / Number(r.dose) - 1) > 0.01;
  const injectable = INJECTABLE.has(d.route);
  // Sites that fit how it's given (under the skin or into the muscle) and the drug's label.
  const plan = sitePlan(d.route, r.compoundId);
  const clock = view === 'clock' && !!plan?.belly;
  const siteFits = !d.site || !plan || plan.sites.includes(d.site) || (plan.belly && !!bellyHour(d.site));
  const { math, checks } = checkDose(r, d.amount, d.unit);
  const hour = bellyHour(d.site);

  const switchTo = (x: Regimen) => {
    drafts.current.set(r.id, { d, auto, view });
    const kept = drafts.current.get(x.id);
    setR(x);
    if (kept) { setD(kept.d); setAuto(kept.auto); setView(kept.view); } else setD(blank(x, suggest(x, x.route)));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const at = new Date(d.at || Date.now());
    if (!(amt > 0)) { fail('d-amount', 'Enter the amount you took.'); return; }
    if (isNaN(at.getTime())) { fail('d-at', 'Enter a valid date and time.'); return; }
    store.addDose({ id: newId(), rid: r.id, name: regName(r), at: at.toISOString(), amount: d.amount, unit: d.unit, route: d.route, site: injectable && siteFits ? d.site : '', notes: d.notes.trim() });
    toast(`Logged ${regName(r)} at ${fmtTime(at)}.`);
    onClose();
  };

  // Why the picked spot was suggested, for this peptide and this view.
  const why = auto && d.site ? nextSite({ ...r, route: d.route }, doses, clock ? 'clock' : 'map')?.why ?? '' : '';
  let siteNote = '';
  // A spot used recently: its note reads as a caution.
  let siteWarn = false;
  if (auto && why) {
    siteNote = `${why}. Tap another spot if you use a different one.`;
  } else if (hour) {
    const ri = recent.indexOf(hour);
    siteWarn = hour !== next && ri >= 0;
    siteNote = hour === next ? `One hour clockwise from ${recent[0] ?? 12} o'clock.` : ri >= 0 ? `Used ${ago(new Date(bellyDoses[ri].at))}. Try ${next} o'clock, the next hour clockwise.` : 'Not used recently.';
  } else if (d.site) {
    const t = last[d.site];
    siteWarn = !!t && Date.now() - t.getTime() < 3 * DAY;
    siteNote = siteWarn ? 'Used in the last 3 days. Try a different spot to let it recover.' : t ? `Last used ${ago(t)}.` : 'Not used yet.';
  }

  return (
    <Sheet onClose={close} label={`Log ${regName(r)}`}>
      <form className="stack gap-4" onSubmit={submit} noValidate>
        <div className="sheet-head">
          <div className="stack gap-1">
            <span className="eyebrow">Log a dose</span>
            <h2 className="sheet-title">{regName(r)}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {active.length > 1 && (
          <div className="pick in-sheet" role="group" aria-label="Peptide">
            {active.map(x => <button key={x.id} type="button" className="fchip" aria-pressed={x.id === r.id} onClick={() => x.id !== r.id && switchTo(x)}>{regName(x)}</button>)}
          </div>
        )}

        <section className="tile dark" aria-label="Prescribed dose">
          <div className="spread"><span className="eyebrow">Prescribed</span><span className="sub">{freqText(r)}</span></div>
          <span className="stat">{fmtNum(Number(r.dose), 3)}<small> {r.unit}</small></span>
          {math && injectable && (
            <div className="white-inset stack gap-2">
              {/* The draw follows What you took, so once that is edited it says which amount it is for. */}
              {(amountDiffers || unitDiffers) && <p className="xsmall">For the <b>{d.amount || '0'} {d.unit}</b> entered below, not the prescribed dose:</p>}
              {isVolumeUnit(d.unit)
                ? <p className="small">That's <b className="mono tone-lilac">{drugAmount(math.doseMg, PEP[r.compoundId]?.defaultUnit)}</b> ({fmtNum(math.vol, 2)} mL) from a vial with {fmtNum(Number(r.vialMg))} mg in {fmtNum(Number(r.diluentMl))} mL.</p>
                : <p className="small">Draw to <b className="mono tone-lilac">{fmtNum(math.units, 1)} units</b> ({fmtNum(math.vol, 2)} mL) on a U-100 syringe. {fmtNum(Number(r.vialMg))} mg vial + {fmtNum(Number(r.diluentMl))} mL water.</p>}
              <div className="syringe-wrap"><Syringe units={math.units} cap={math.units > 50 ? 100 : 50} /></div>
              <a className="small" href="#calculator" onClick={e => { e.preventDefault(); guard.ask(() => { location.hash = '#calculator'; }); }}>How this is calculated</a>
            </div>
          )}
          {checks.length > 0 && injectable && (
            <div className="alert danger" role="alert">
              <b>These numbers don't add up, so there's no draw to show.</b>
              {checks.map(c => <span key={c.title}>{c.title} {c.body}</span>)}
              {onFix && <div className="mt-2"><button type="button" className="btn sm" onClick={() => onFix(r)}>Fix {regName(r)}'s details</button></div>}
            </div>
          )}
        </section>

        <section className="tile" aria-label="What you took">
          <div className="grid-3">
            <label className="field"><span>Amount</span><input type="number" id="d-amount" {...invalid('d-amount')} step="any" min="0" inputMode="decimal" value={d.amount} onChange={set('amount')} /></label>
            <label className="field"><span>Unit</span><select id="d-unit" value={d.unit} onChange={set('unit')}><UnitOptions compoundId={r.compoundId} /></select></label>
          </div>
          {errFor('d-amount')}
          {(amountDiffers || unitDiffers) && (
            <p className="alert warn" role="status">
              {unitDiffers
                ? `The unit differs from your saved regimen (${r.unit}). Double-check mcg vs mg.`
                : `This differs from your saved dose (${fmtNum(Number(r.dose), 3)} ${r.unit}). Only change a dose on your prescriber's advice.`}
            </p>
          )}
          <div className="grid-2">
            <label className="field"><span>When</span><input type="datetime-local" id="d-at" {...invalid('d-at')} value={d.at} onChange={set('at')} /></label>
            <label className="field"><span>How it was taken</span><select id="d-route" value={d.route} onChange={setRoute}>{ROUTES.map(x => <option key={x}>{x}</option>)}</select></label>
          </div>
          {errFor('d-at')}
        </section>

        {injectable && plan && (
          <section className="tile sky" aria-labelledby="site-h">
            <h3 id="site-h" className="eyebrow tone-sky">Injection site</h3>
            {plan.belly && (
              <div className="seg" role="group" aria-label="Site view">
                <button type="button" aria-pressed={clock} onClick={() => showView('clock')}>Belly clock</button>
                <button type="button" aria-pressed={!clock} onClick={() => showView('body')}>Body map</button>
              </div>
            )}
            {clock ? (
              <>
                <BellyClock key={r.id} selected={hour} next={next} recent={recent} onSelect={h => pickSite(hour === h ? '' : `belly-${h}`)} />
                <p className="small tone-ink">Looking down at your belly, 12 is toward your chest. Move one hour clockwise each injection and stay about 2 in (5 cm) from your navel, or use the spacing your nurse gave you.</p>
                <div className="site-legend" style={{ justifyContent: 'flex-start' }}>
                  <span><i style={{ background: 'var(--sky-ink)' }} />Selected</span>
                  <span><i style={{ background: 'var(--surface)', border: '2px dashed var(--sky-ink)' }} />Next clockwise</span>
                  <span><i style={{ background: 'var(--recent-1)' }} />Used recently</span>
                </div>
                {bellyDoses.length > 0 && (
                  <div className="recent"><b className="xsmall">Recent</b>
                    {bellyDoses.map(x => <span key={x.id}>{bellyHour(x.site)} o'clock · {ago(new Date(x.at))}</span>)}
                  </div>
                )}
              </>
            ) : (
              <BodyMap selected={hour ? '' : d.site} onSelect={pickSite} last={last} plan={plan} route={d.route}
                suggested={nextSite({ ...r, route: d.route }, doses, 'map')?.site} />
            )}
            <div className="site-foot">
              <p className="tile-title row-wrap">
                {d.site && siteFits ? siteLabel(d.site, d.route) : clock ? `Suggested: ${BELLY.find(b => b.h === next)!.label}` : 'Tap where you injected'}
                {auto && d.site && siteFits && <span className="chip on-tint">Next in rotation</span>}
              </p>
              <p className={`small ${siteWarn ? 'tone-peach' : 'tone-ink'}`}>{d.site && siteFits ? siteNote : clock ? (recent[0] ? `One hour clockwise from ${recent[0]} o'clock. Tap the spot you used.` : 'Start anywhere, then move one hour clockwise each time.') : 'Optional, but it powers site rotation.'}</p>
            </div>
          </section>
        )}

        <label className="field tile gap-2"><span>Notes <small>(optional)</small></span><input type="text" id="d-notes" maxLength={200} placeholder="e.g. new vial, mild sting" value={d.notes} onChange={set('notes')} /></label>
        <LeaveFoot guard={guard}>
          <button type="button" className="btn ghost" onClick={close}>Cancel</button>
          <button type="submit" className="btn">Save dose</button>
        </LeaveFoot>
      </form>
    </Sheet>
  );
}
