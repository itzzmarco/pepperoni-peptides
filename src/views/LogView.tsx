import { useRef, useState } from 'react';
import type { Checkin, DoseEntry, Ledger, Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { adherenceDays, freqText, regimenStatus } from '../lib/schedule';
import { doseMath } from '../lib/doseMath';
import { DAY, dayKey, fmtDay, fmtNum, fmtShort, fmtTime, newId } from '../lib/format';
import { SITE_LABEL, lastUsedBySite, suggestSite } from '../lib/sites';
import { ledgerToCsv } from '../lib/csv';
import { PEP } from '../data/peptides';
import { FAMILIES } from '../data/reference';
import { INJECTABLE, UNREGULATED_SOURCE } from '../data/options';
import { Fields, LegalChip, TierChip } from '../components/Chips';
import { LineChart } from '../components/LineChart';
import { CheckIcon, ChevronIcon, LockIcon, PlusIcon, TargetIcon } from '../components/Icons';
import { useToast } from '../components/Toast';

export const regName = (r: Pick<Regimen, 'compoundId' | 'name'>) => PEP[r.compoundId]?.name ?? (r.name || 'Unnamed');

type Actions = {
  addRegimen: () => void;
  editRegimen: (r: Regimen) => void;
  logDose: (r: Regimen) => void;
  checkin: (c?: Checkin) => void;
};

const ROUTE_SHORT: Record<string, string> = { 'Subcutaneous injection': 'SubQ', 'Intramuscular injection': 'IM', 'IV (in clinic)': 'IV', 'Nasal spray': 'Nasal', Sublingual: 'Under tongue' };

/** The last 28 days as a barcode: a tall bar for each day with a logged dose, a dashed bar when today's dose is due. */
function Strip({ rid, doses, due }: { rid: string; doses: DoseEntry[]; due: boolean }) {
  const days = adherenceDays(rid, doses);
  const count = days.filter(d => d.on).length;
  return (
    <div className="barcode-wrap">
      <div className="barcode" role="img" aria-label={`Doses logged on ${count} of the last 28 days${due ? ". Today's dose is due" : ''}`}>
        {days.map(d => (
          <i key={d.date.getTime()} className={d.on ? 'on' : d.today && due ? 'due' : ''} title={`${fmtDay(d.date)}${d.on ? ': dose logged' : ''}`} />
        ))}
      </div>
      <div className="strip-legend"><span>4 weeks ago</span><span>{count} dose{count === 1 ? '' : 's'} logged</span><span>Today</span></div>
    </div>
  );
}

function RegimenCard({ r, doses, actions, example }: { r: Regimen; doses: DoseEntry[]; actions?: Actions; example?: boolean }) {
  const toast = useToast();
  const p = PEP[r.compoundId];
  const st = example ? { s: 'due', text: 'Due today' } : regimenStatus(r, doses);
  const math = doseMath(r.dose, r.unit, r.vialMg, r.diluentMl);
  const due = st.s === 'due' || st.s === 'late';
  const sub = r.prescriber ? `Prescribed by ${r.prescriber}` : p ? FAMILIES[p.family]?.name : '';
  let site: { k: string; last?: Date } | null = null;
  if (!example && !r.paused && INJECTABLE.has(r.route)) {
    const last = lastUsedBySite(doses);
    const k = suggestSite(last);
    site = { k, last: last[k] };
  }
  return (
    <article className={`regimen label-card${r.paused ? ' paused' : ''}${example ? ' example' : ''}`} aria-hidden={example || undefined}>
      <div className="lc-head">
        <div className="stack" style={{ gap: 2, minWidth: 0 }}>
          <h3>{regName(r)}</h3>
          {sub && <span className="small muted">{sub}</span>}
        </div>
        <span className="due" data-s={st.s}>{st.text}</span>
      </div>
      <Fields cols="minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, .8fr)" items={[
        ['Dose', <span className="mono">{fmtNum(Number(r.dose), 3)} {r.unit}</span>],
        ['Schedule', freqText(r)],
        ['Route', ROUTE_SHORT[r.route] ?? r.route],
      ]} />
      <div className="lc-body">
        {math && (
          <p className="small">
            Draw <b className="mono">{fmtNum(math.units, 1)} units</b> on a U-100 syringe <span className="muted">({fmtNum(Number(r.vialMg))} mg vial + {fmtNum(Number(r.diluentMl))} mL). Confirm with your pharmacist.</span>
          </p>
        )}
        {site && (
          <p className="next-site">
            <span className="ns-icon"><TargetIcon /></span>
            <span>Next site: <b>{SITE_LABEL[site.k].toLowerCase()}</b> <span className="muted">· {site.last ? `last used ${fmtShort(site.last)}` : 'not used yet'}</span></span>
          </p>
        )}
        <Strip rid={r.id} doses={example ? [] : doses} due={due} />
        {p && <div className="row-wrap"><TierChip t={p.tier} /><LegalChip k={p.legal} /></div>}
        {r.source === UNREGULATED_SOURCE && (
          <div className="alert warn"><b>Unregulated source.</b><span>Products sold online as "research use only" aren't checked for identity, dose, sterility, or endotoxin. See Safety for testing data.</span></div>
        )}
        {!example && actions && (
          <div className="lc-actions">
            {!r.paused && <button className={`btn${due ? ' big' : ' ghost'}`} onClick={() => actions.logDose(r)}><CheckIcon />Log dose</button>}
            <div className="row-wrap" style={{ gap: 4 }}>
              <button className="btn quiet sm" onClick={() => actions.editRegimen(r)}>Edit</button>
              <button className="btn quiet sm" onClick={() => { store.saveRegimen({ ...r, paused: !r.paused }); toast(r.paused ? 'Resumed.' : 'Paused. Your history is kept.'); }}>
                {r.paused ? 'Resume' : 'Pause'}
              </button>
              {p && <a className="btn quiet sm" href={`#${p.id}`}>About {p.name}</a>}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/** One tap saves a check-in with just an overall score; details can be added to the same entry. */
function QuickCheckin({ checkins, onDetails }: { checkins: Checkin[]; onDetails: (c?: Checkin) => void }) {
  const toast = useToast();
  const today = dayKey(new Date());
  const done = checkins.find(c => dayKey(new Date(c.at)) === today);
  const save = (n: number) => {
    store.addCheckin({ id: newId(), at: new Date().toISOString(), overall: n, effects: [], flags: [], notes: '' });
    toast(`Saved: feeling ${n} of 5.`);
  };
  return (
    <section className="panel stack quick-checkin" aria-labelledby="qc-h">
      <div>
        <h2 id="qc-h" className="h-card">{done ? 'Checked in today' : 'How do you feel today?'}</h2>
        <p className="small muted">
          {done
            ? <>At {fmtTime(new Date(done.at))}{done.overall ? <>, feeling <b className="mono">{done.overall}/5</b></> : null}{done.effects.length ? ` · ${done.effects.join(', ')}` : ''}</>
            : 'One tap saves a quick check-in. Add sleep, side effects or weight any time.'}
        </p>
      </div>
      {!done && (
        <>
          <div className="scale big" role="group" aria-label="Overall feeling, 1 to 5">
            {[1, 2, 3, 4, 5].map(n => <button type="button" key={n} onClick={() => save(n)} aria-label={`${n} of 5`}>{n}</button>)}
          </div>
          <div className="strip-legend" style={{ marginTop: -6 }}><span>1 · rough</span><span>5 · great</span></div>
        </>
      )}
      <button type="button" className="row-link" onClick={() => onDetails(done)}>
        {done ? 'Add sleep, side effects or weight' : 'Full check-in: sleep, side effects, weight'}<ChevronIcon />
      </button>
    </section>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={`btn sm ${armed ? 'danger' : 'quiet'}`}
      onClick={() => { if (armed) onConfirm(); else { setArmed(true); setTimeout(() => setArmed(false), 4000); } }}
      onBlur={() => setArmed(false)}
      aria-label={armed ? 'Confirm delete' : 'Delete entry'}
    >
      {armed ? 'Confirm' : 'Delete'}
    </button>
  );
}

function download(filename: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ExportPanel({ ledger }: { ledger: Ledger }) {
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [wipe, setWipe] = useState(false);
  const stamp = dayKey(new Date());
  const empty = !ledger.regimens.length && !ledger.doses.length && !ledger.checkins.length;
  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      const added = store.importBackup(JSON.parse(await f.text()));
      toast(added == null ? "That file isn't a Peptide Ledger backup." : `Restored ${added} item${added === 1 ? '' : 's'}.`);
    } catch {
      toast("Couldn't read that file. Choose a .json backup exported from this app.");
    }
    if (file.current) file.current.value = '';
  };
  return (
    <section className="panel stack">
      <div className="panel-head" style={{ margin: 0 }}><h2 className="h-card">Export and backup</h2></div>
      <p className="small muted device-note"><LockIcon size={14} />Your log lives only in this browser. Export a CSV for your clinician, or a JSON backup you can restore on another device.</p>
      <div className="row-wrap">
        <button className="btn ghost sm" disabled={empty} onClick={() => download(`peptide-log-${stamp}.csv`, ledgerToCsv(ledger, id => PEP[id]?.name), 'text/csv')}>Export CSV</button>
        <button className="btn ghost sm" disabled={empty} onClick={() => download(`peptide-ledger-backup-${stamp}.json`, JSON.stringify(ledger, null, 2), 'application/json')}>Download backup</button>
        <button className="btn quiet sm" onClick={() => file.current?.click()}>Restore backup</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => onImport(e.target.files?.[0])} />
      </div>
      {!empty && (
        <div className="row-wrap">
          {wipe ? (
            <>
              <span className="small">Erase every regimen, dose, and check-in on this device?</span>
              <button className="btn danger sm" onClick={() => { store.clearAll(); setWipe(false); toast('Your log was erased from this device.'); }}>Erase everything</button>
              <button className="btn quiet sm" onClick={() => setWipe(false)}>Keep my log</button>
            </>
          ) : (
            <button className="btn quiet sm" onClick={() => setWipe(true)}>Erase my log…</button>
          )}
        </div>
      )}
    </section>
  );
}

const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

/** How many timeline entries show before "Show all". */
const RECENT = 12;

export function LogView(actions: Actions) {
  const ledger = useLedger();
  const toast = useToast();
  const [introHidden, setIntroHidden] = useState(() => lsGet('pl-intro-hidden') === '1');
  const [showAll, setShowAll] = useState(false);
  const { regimens, doses, checkins } = ledger;
  const active = regimens.filter(r => !r.paused);
  const paused = regimens.filter(r => r.paused);
  const since = Date.now() - 30 * DAY;
  const feel = checkins
    .filter(c => new Date(c.at).getTime() >= since && c.overall)
    .map(c => ({ x: new Date(c.at), y: c.overall!, tip: `${fmtDay(new Date(c.at))}: ${c.overall}/5` }));
  const weights = checkins.filter(c => c.weight).slice(0, 60).map(c => ({ x: new Date(c.at), y: c.weight!, tip: `${fmtDay(new Date(c.at))}: ${fmtNum(c.weight!, 1)} ${c.weightUnit ?? ''}` }));
  const wUnit = checkins.find(c => c.weight)?.weightUnit ?? '';
  const lastFlag = checkins.find(c => c.flags.length && Date.now() - new Date(c.at).getTime() < 2 * DAY);
  const example: Regimen = { id: 'example', compoundId: 'tirzepatide', name: '', dose: '2.5', unit: 'mg', freq: 'weekly', everyDays: '', route: 'Subcutaneous injection', prescriber: 'your clinician', source: '', start: '', vialMg: '', diluentMl: '', notes: '' };

  type Item = { kind: 'dose'; at: string; e: DoseEntry } | { kind: 'check'; at: string; e: Checkin };
  const items: Item[] = [
    ...doses.slice(0, 80).map(e => ({ kind: 'dose' as const, at: e.at, e })),
    ...checkins.slice(0, 80).map(e => ({ kind: 'check' as const, at: e.at, e })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
  let lastDay = '';

  const statuses = new Map(active.map(r => [r.id, regimenStatus(r, doses)]));
  const urgent = (r: Regimen) => ['due', 'late'].includes(statuses.get(r.id)!.s);
  const dueNow = active.filter(urgent);
  const later = active.filter(r => !urgent(r));
  const lastCheck = checkins[0];
  const summary = [
    regimens.length ? (dueNow.length ? `${dueNow.length} dose${dueNow.length === 1 ? '' : 's'} due.` : 'Nothing due today.') : '',
    lastCheck ? `Last check-in ${fmtDay(new Date(lastCheck.at))}.` : '',
  ].filter(Boolean).join(' ');

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <span className="eyebrow">{fmtDay(new Date())}</span>
          <h1>Today</h1>
          <p>{summary || 'Doses, symptoms, and how you feel, in one private record you can export for your clinician.'}</p>
        </div>
        {regimens.length > 0 && <button className="btn ghost" onClick={actions.addRegimen}><PlusIcon />Add a peptide</button>}
      </div>

      {lastFlag && (
        <div className="alert danger" role="alert">
          <b>You reported an emergency symptom on {fmtDay(new Date(lastFlag.at))}.</b>
          <span>{lastFlag.flags.join('; ')}. If it's still happening, call 911 or go to an emergency room. For a possible poisoning or overdose, call Poison Control at 1-800-222-1222.</span>
        </div>
      )}
      {!store.persistent && (
        <div className="alert warn"><b>This browser isn't saving your log.</b><span>Private browsing or blocked site storage stops saving. Entries will disappear when you close the tab, so export before you leave.</span></div>
      )}

      {!(introHidden && regimens.length) && (
        <section className="panel stack" aria-label="About this log">
          <div className="panel-head">
            <h2 className="h-card">Before you start</h2>
            {regimens.length > 0 && <button className="btn quiet sm" onClick={() => { lsSet('pl-intro-hidden', '1'); setIntroHidden(true); }}>Hide</button>}
          </div>
          <ul className="small dots">
            <li>This is a journal for doses and symptoms, built to share with your clinician. It never suggests a dose; enter the one you were prescribed.</li>
            <li>Everything you enter stays in this browser on this device. There's no account and no server. Use Export to keep a copy.</li>
            <li>Most peptides promoted online are unapproved, and products sold as "research use only" aren't tested for what's in the vial. Check the Library before you log something new.</li>
            <li>If you feel seriously unwell, stop and get help. The daily check-in flags emergency symptoms.</li>
          </ul>
        </section>
      )}

      <div className="log-grid">
        <div className="stack" style={{ gap: 24 }}>
          {regimens.length === 0 ? (
            <section className="stack">
              <h2 className="label-h">Tracking</h2>
              <div className="empty">
                <h3>Nothing tracked yet</h3>
                <p className="muted small">Add a peptide or medication you've been prescribed. You'll get a due-date status, a 4-week history, and injection-site rotation.</p>
                <button className="btn" onClick={actions.addRegimen}><PlusIcon />Add a peptide</button>
              </div>
              <RegimenCard r={example} doses={[]} example />
            </section>
          ) : (
            <>
              {dueNow.length > 0 && (
                <section className="stack" aria-labelledby="due-h">
                  <div className="label-row"><h2 id="due-h" className="label-h">Due now</h2><span className="count">{dueNow.length} of {active.length}</span></div>
                  {dueNow.map(r => <RegimenCard key={r.id} r={r} doses={doses} actions={actions} />)}
                </section>
              )}
              {later.length > 0 && (
                <section className="stack" aria-labelledby="later-h">
                  <div className="label-row"><h2 id="later-h" className="label-h">{dueNow.length ? 'Coming up' : 'Tracking'}</h2><span className="count">{later.length} active</span></div>
                  {later.map(r => <RegimenCard key={r.id} r={r} doses={doses} actions={actions} />)}
                </section>
              )}
              {paused.length > 0 && (
                <details className="paused-list">
                  <summary className="small muted">Paused ({paused.length})</summary>
                  <div className="stack" style={{ marginTop: 10 }}>{paused.map(r => <RegimenCard key={r.id} r={r} doses={doses} actions={actions} />)}</div>
                </details>
              )}
            </>
          )}
        </div>

        <div className="stack">
          <QuickCheckin checkins={checkins} onDetails={actions.checkin} />
          <section className="panel">
            <div className="panel-head"><h2 className="label-h">How you've felt</h2><span className="count">Last 30 days · 1 to 5</span></div>
            {feel.length >= 2 ? (
              <LineChart points={feel} y0={1} y1={5} ticks={[1, 3, 5]} x0={since} x1={Date.now()} label="Overall feeling over the last 30 days" />
            ) : (
              <p className="small muted">{feel.length ? 'Check in on another day to start seeing a trend.' : 'Do a daily check-in to see your trend here.'}</p>
            )}
          </section>
          {weights.length >= 2 && (() => {
            const ys = weights.map(w => w.y);
            const lo = Math.floor(Math.min(...ys) - 1), hi = Math.ceil(Math.max(...ys) + 1);
            return (
              <section className="panel">
                <div className="panel-head"><h2 className="label-h">Weight</h2><span className="count">{wUnit}</span></div>
                <LineChart points={weights} y0={lo} y1={hi} ticks={[lo, Math.round((lo + hi) / 2), hi]} label="Weight trend" fmt={v => fmtNum(v, 1)} />
              </section>
            );
          })()}
          <section className="panel">
            <div className="panel-head"><h2 className="label-h">Recent entries</h2><span className="count">{items.length}</span></div>
            {items.length ? (
              <div className="timeline">
                {(showAll ? items : items.slice(0, RECENT)).map(it => {
                  const d = new Date(it.at), k = dayKey(d);
                  const head = k !== lastDay ? <div className="tl-day">{fmtDay(d)}</div> : null;
                  lastDay = k;
                  return (
                    <div key={it.e.id}>
                      {head}
                      <div className="tl-item">
                        <time>{fmtTime(d)}</time>
                        {it.kind === 'dose' ? (
                          <div className="what">
                            <b>{it.e.name}</b> {fmtNum(Number(it.e.amount), 3)} {it.e.unit}
                            <small>{[it.e.route, SITE_LABEL[it.e.site], it.e.notes].filter(Boolean).join(' · ')}</small>
                          </div>
                        ) : (
                          <div className="what">
                            <b>Check-in</b> {it.e.overall ? `feeling ${it.e.overall}/5` : ''}{it.e.weight ? ` · ${fmtNum(it.e.weight, 1)} ${it.e.weightUnit ?? ''}` : ''}
                            <small>{it.e.effects.join(', ')}{it.e.notes ? ` · ${it.e.notes}` : ''}</small>
                            {it.e.flags.length > 0 && <small className="flag-text">Emergency symptom: {it.e.flags.join('; ')}</small>}
                          </div>
                        )}
                        <DeleteButton onConfirm={() => { if (it.kind === 'dose') store.deleteDose(it.e.id); else store.deleteCheckin(it.e.id); toast('Entry deleted.'); }} />
                      </div>
                    </div>
                  );
                })}
                {items.length > RECENT && (
                  <button className="btn quiet sm" style={{ justifySelf: 'start', marginTop: 8 }} onClick={() => setShowAll(!showAll)}>
                    {showAll ? 'Show fewer' : `Show all ${items.length} entries`}
                  </button>
                )}
              </div>
            ) : (
              <p className="small muted">Logged doses and check-ins appear here.</p>
            )}
          </section>
          <ExportPanel ledger={ledger} />
        </div>
      </div>
    </section>
  );
}
