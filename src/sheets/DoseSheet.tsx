import { useMemo, useState } from 'react';
import type { Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { freqText } from '../lib/schedule';
import { doseMath } from '../lib/doseMath';
import { DAY, fmtNum, fmtTime, newId, toLocalInput } from '../lib/format';
import { BELLY, SITE_LABEL, bellyHour, lastUsedBySite, nextBellyHour } from '../lib/sites';
import { INJECTABLE, ROUTES, UNITS } from '../data/options';
import { BodyMap } from '../components/BodyMap';
import { BellyClock } from '../components/BellyClock';
import { Sheet } from '../components/Sheet';
import { Syringe } from '../components/Syringe';
import { useToast } from '../components/Toast';
import { regName } from '../views/PeptidesView';

const blank = (r: Regimen) => ({ amount: r.dose, unit: r.unit, at: toLocalInput(new Date()), route: r.route, site: '', notes: '' });
const ago = (t: Date) => {
  const d = Math.round((Date.now() - t.getTime()) / DAY);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

export function DoseSheet({ r: initial, onClose }: { r: Regimen; onClose: () => void }) {
  const toast = useToast();
  const { doses, regimens } = useLedger();
  const active = regimens.filter(x => !x.paused);
  const [r, setR] = useState(initial);
  const [d, setD] = useState(() => blank(initial));
  const last = useMemo(() => lastUsedBySite(doses), [doses]);
  // This regimen's belly-clock history, newest first.
  const bellyDoses = useMemo(() => doses.filter(x => x.rid === r.id && bellyHour(x.site)).slice(0, 3), [doses, r.id]);
  const recent = bellyDoses.map(x => bellyHour(x.site)!);
  const [view, setView] = useState<'clock' | 'body'>(() => (doses.some(x => x.rid === initial.id && bellyHour(x.site)) ? 'clock' : 'body'));
  const next = nextBellyHour(recent[0] ?? null, last);

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value });
  const amt = Number(d.amount);
  const unitDiffers = d.unit !== r.unit;
  const amountDiffers = !unitDiffers && Number(r.dose) > 0 && amt > 0 && Math.abs(amt / Number(r.dose) - 1) > 0.01;
  const injectable = INJECTABLE.has(d.route);
  const math = doseMath(d.amount, d.unit, r.vialMg, r.diluentMl);
  const hour = bellyHour(d.site);

  const switchTo = (x: Regimen) => {
    setR(x);
    setD(blank(x));
    setView(doses.some(y => y.rid === x.id && bellyHour(y.site)) ? 'clock' : 'body');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const at = new Date(d.at || Date.now());
    if (isNaN(at.getTime())) { toast('Enter a valid date and time.'); return; }
    if (!(amt > 0)) { toast('Enter the amount you took.'); return; }
    store.addDose({ id: newId(), rid: r.id, name: regName(r), at: at.toISOString(), amount: d.amount, unit: d.unit, route: d.route, site: injectable ? d.site : '', notes: d.notes.trim() });
    toast(`Logged ${regName(r)} at ${fmtTime(at)}.`);
    onClose();
  };

  let siteNote = '';
  if (hour) {
    const ri = recent.indexOf(hour);
    siteNote = hour === next ? `One hour clockwise from ${recent[0] ?? 12} o'clock.` : ri >= 0 ? `Used ${ago(new Date(bellyDoses[ri].at))}. Try ${next} o'clock, the next hour clockwise.` : 'Not used recently.';
  } else if (d.site) {
    const t = last[d.site];
    siteNote = t && Date.now() - t.getTime() < 3 * DAY ? 'Used in the last 3 days. Try a different spot to let it recover.' : t ? `Last used ${ago(t)}.` : 'Not used yet.';
  }

  return (
    <Sheet onClose={onClose} label={`Log ${regName(r)}`}>
      <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        <div className="sheet-head">
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">Log a dose</span>
            <h2 style={{ fontSize: '1.75rem' }}>{regName(r)}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {active.length > 1 && (
          <div className="pick" role="group" aria-label="Peptide" style={{ margin: '0 -16px', padding: '0 16px 2px' }}>
            {active.map(x => <button key={x.id} type="button" className="fchip" aria-pressed={x.id === r.id} onClick={() => x.id !== r.id && switchTo(x)}>{regName(x)}</button>)}
          </div>
        )}

        <section className="tile dark" aria-label="Prescribed dose">
          <div className="spread"><span className="eyebrow">Prescribed</span><span className="sub">{freqText(r)}</span></div>
          <span style={{ fontSize: '2.25rem', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1 }}>{fmtNum(Number(r.dose), 3)} <span className="sub" style={{ fontSize: '1.125rem' }}>{r.unit}</span></span>
          {math && injectable && (
            <div className="white-inset stack" style={{ gap: 8 }}>
              <p className="small">Draw to <b className="mono" style={{ color: 'var(--lilac-ink)' }}>{fmtNum(math.units, 1)} units</b> ({fmtNum(math.vol, 2)} mL) on a U-100 syringe. {fmtNum(Number(r.vialMg))} mg vial + {fmtNum(Number(r.diluentMl))} mL water.</p>
              <div className="syringe-wrap"><Syringe units={math.units} cap={math.units > 50 ? 100 : 50} /></div>
              <a className="small" href="#calculator">How this is calculated</a>
            </div>
          )}
        </section>

        <section className="tile" aria-label="What you took">
          <div className="grid-3">
            <label className="field"><span>Amount</span><input type="number" id="d-amount" step="any" min="0" inputMode="decimal" value={d.amount} onChange={set('amount')} /></label>
            <label className="field"><span>Unit</span><select id="d-unit" value={d.unit} onChange={set('unit')}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></label>
          </div>
          {(amountDiffers || unitDiffers) && (
            <p className="alert warn" role="status">
              {unitDiffers
                ? `The unit differs from your saved regimen (${r.unit}). Double-check mcg vs mg.`
                : `This differs from your saved dose (${fmtNum(Number(r.dose), 3)} ${r.unit}). Only change a dose on your prescriber's advice.`}
            </p>
          )}
          <div className="grid-2">
            <label className="field"><span>When</span><input type="datetime-local" id="d-at" value={d.at} onChange={set('at')} /></label>
            <label className="field"><span>How it was taken</span><select id="d-route" value={d.route} onChange={set('route')}>{ROUTES.map(x => <option key={x}>{x}</option>)}</select></label>
          </div>
        </section>

        {injectable && (
          <section className="tile sky" aria-labelledby="site-h">
            <h3 id="site-h" className="eyebrow" style={{ color: 'var(--sky-ink)' }}>Injection site</h3>
            <div className="seg" role="group" aria-label="Site view">
              <button type="button" aria-pressed={view === 'clock'} onClick={() => setView('clock')}>Belly clock</button>
              <button type="button" aria-pressed={view === 'body'} onClick={() => setView('body')}>Body map</button>
            </div>
            {view === 'clock' ? (
              <>
                <BellyClock key={r.id} selected={hour} next={next} recent={recent} onSelect={h => setD({ ...d, site: hour === h ? '' : `belly-${h}` })} />
                <p className="small" style={{ color: 'var(--ink-2)' }}>Looking down at your belly, 12 is toward your chest. Move one hour clockwise each injection and stay about 2 in (5 cm) from your navel, or use the spacing your nurse gave you.</p>
                <div className="site-legend" style={{ justifyContent: 'flex-start' }}>
                  <span><i style={{ background: 'var(--sky-ink)' }} />Selected</span>
                  <span><i style={{ boxShadow: 'inset 0 0 0 2px var(--sky-ink)', background: 'var(--surface)' }} />Next clockwise</span>
                  <span><i style={{ background: '#F9C9AE' }} />Used recently</span>
                </div>
                {bellyDoses.length > 0 && (
                  <div className="recent"><span className="xsmall" style={{ background: 'none', padding: 0, color: 'var(--ink-2)' }}>Recent</span>
                    {bellyDoses.map(x => <span key={x.id}>{bellyHour(x.site)} o'clock · {ago(new Date(x.at))}</span>)}
                  </div>
                )}
              </>
            ) : (
              <BodyMap selected={hour ? '' : d.site} onSelect={site => setD({ ...d, site })} last={last} />
            )}
            <div style={{ borderTop: '1px solid color-mix(in srgb, var(--sky-ink) 15%, transparent)', paddingTop: 12 }}>
              <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{d.site ? SITE_LABEL[d.site] : view === 'clock' ? `Suggested: ${BELLY.find(b => b.h === next)!.label}` : 'Tap where you injected'}</p>
              <p className="small" style={{ color: siteNote.startsWith('Used') ? 'var(--peach-ink)' : 'var(--ink-2)' }}>{d.site ? siteNote : view === 'clock' ? (recent[0] ? `One hour clockwise from ${recent[0]} o'clock. Tap the spot you used.` : 'Start anywhere, then move one hour clockwise each time.') : 'Optional, but it powers site rotation.'}</p>
            </div>
          </section>
        )}

        <label className="field tile" style={{ gap: 8 }}><span>Notes <small>(optional)</small></span><input type="text" id="d-notes" maxLength={200} placeholder="e.g. new vial, mild sting" value={d.notes} onChange={set('notes')} /></label>
        <div className="sheet-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">Save dose</button>
        </div>
      </form>
    </Sheet>
  );
}
