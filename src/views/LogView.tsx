import { useRef, useState } from 'react';
import type { Checkin, DoseEntry, Ledger, Regimen } from '../lib/types';
import { store, useLedger } from '../lib/store';
import { adherenceDays, freqText, regimenStatus } from '../lib/schedule';
import { doseMath } from '../lib/doseMath';
import { DAY, dayKey, fmtDay, fmtNum, fmtTime } from '../lib/format';
import { SITE_LABEL } from '../lib/sites';
import { ledgerToCsv } from '../lib/csv';
import { PEP } from '../data/peptides';
import { UNREGULATED_SOURCE } from '../data/options';
import { LegalChip, TierChip } from '../components/Chips';
import { LineChart } from '../components/LineChart';
import { useToast } from '../components/Toast';

export const regName = (r: Pick<Regimen, 'compoundId' | 'name'>) => PEP[r.compoundId]?.name ?? (r.name || 'Unnamed');

type Actions = {
  addRegimen: () => void;
  editRegimen: (r: Regimen) => void;
  logDose: (r: Regimen) => void;
  checkin: () => void;
};

function Strip({ rid, doses }: { rid: string; doses: DoseEntry[] }) {
  const days = adherenceDays(rid, doses);
  const count = days.filter(d => d.on).length;
  return (
    <>
      <div className="strip" role="img" aria-label={`Doses logged on ${count} of the last 28 days`}>
        {days.map(d => (
          <i key={d.date.getTime()} className={`${d.on ? 'on' : ''}${d.today ? ' today' : ''}`} title={`${fmtDay(d.date)}${d.on ? ': dose logged' : ''}`} />
        ))}
      </div>
      <div className="strip-legend"><span>4 weeks ago</span><span>Today</span></div>
    </>
  );
}

function RegimenCard({ r, doses, actions, example }: { r: Regimen; doses: DoseEntry[]; actions?: Actions; example?: boolean }) {
  const toast = useToast();
  const p = PEP[r.compoundId];
  const st = example ? { s: 'due', text: 'Due today' } : regimenStatus(r, doses);
  const math = doseMath(r.dose, r.unit, r.vialMg, r.diluentMl);
  return (
    <article className={`regimen${r.paused ? ' paused' : ''}${example ? ' example' : ''}`} aria-hidden={example || undefined}>
      <div className="top">
        <div className="stack" style={{ gap: 4 }}>
          <h3>{regName(r)}</h3>
          <div className="dose">{fmtNum(Number(r.dose), 3)} {r.unit} · {freqText(r)} · {r.route}</div>
        </div>
        <span className="due" data-s={st.s}>{st.text}</span>
      </div>
      {math && (
        <div className="small muted">
          Draw <b className="mono">{fmtNum(math.units, 1)} units</b> on a U-100 syringe ({fmtNum(Number(r.vialMg))} mg vial + {fmtNum(Number(r.diluentMl))} mL). Confirm with your pharmacist.
        </div>
      )}
      {p && <div className="row-wrap"><TierChip t={p.tier} /><LegalChip k={p.legal} /></div>}
      {r.prescriber && <div className="small faint">Prescribed by {r.prescriber}</div>}
      {r.source === UNREGULATED_SOURCE && (
        <div className="alert warn"><b>Unregulated source.</b><span>Products sold online as "research use only" aren't checked for identity, dose, sterility, or endotoxin. See Safety for testing data.</span></div>
      )}
      <Strip rid={r.id} doses={example ? [] : doses} />
      {!example && actions && (
        <div className="row-wrap">
          {!r.paused && <button className="btn sm" onClick={() => actions.logDose(r)}>Log dose</button>}
          <button className="btn ghost sm" onClick={() => actions.editRegimen(r)}>Edit</button>
          <button className="btn quiet sm" onClick={() => { store.saveRegimen({ ...r, paused: !r.paused }); toast(r.paused ? 'Resumed.' : 'Paused. Your history is kept.'); }}>
            {r.paused ? 'Resume' : 'Pause'}
          </button>
          {p && <a className="btn quiet sm" href={`#${p.id}`}>About {p.name}</a>}
        </div>
      )}
    </article>
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
      <div className="panel-head" style={{ margin: 0 }}><h3>Export and backup</h3></div>
      <p className="small muted">Your log lives only in this browser. Export a CSV for your clinician, or a JSON backup you can restore on another device.</p>
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

  return (
    <section className="view">
      <div className="view-head">
        <div><h1>My log</h1><p>Doses, symptoms, and how you feel, in one private record you can export for your clinician.</p></div>
        <div className="row-wrap">
          <button className="btn" onClick={actions.addRegimen}>Add a peptide</button>
          <button className="btn ghost" onClick={actions.checkin}>Daily check-in</button>
        </div>
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
            <h3>Before you start</h3>
            {regimens.length > 0 && <button className="btn quiet sm" onClick={() => { lsSet('pl-intro-hidden', '1'); setIntroHidden(true); }}>Hide</button>}
          </div>
          <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
            <li>This is a journal for doses and symptoms, built to share with your clinician. It never suggests a dose; enter the one you were prescribed.</li>
            <li>Everything you enter stays in this browser on this device. There's no account and no server. Use Export to keep a copy.</li>
            <li>Most peptides promoted online are unapproved, and products sold as "research use only" aren't tested for what's in the vial. Check the Library before you log something new.</li>
            <li>If you feel seriously unwell, stop and get help. The daily check-in flags emergency symptoms.</li>
          </ul>
        </section>
      )}

      <div className="log-grid">
        <div className="stack">
          <div className="panel-head" style={{ margin: 0 }}><h2>Tracking</h2><span className="count">{active.length} active</span></div>
          {regimens.length === 0 ? (
            <>
              <div className="empty">
                <h3>Nothing tracked yet</h3>
                <p className="muted small">Add a peptide or medication you've been prescribed. You'll get a due-date status, a 4-week history strip, and injection-site rotation.</p>
                <button className="btn" onClick={actions.addRegimen}>Add a peptide</button>
              </div>
              <RegimenCard r={example} doses={[]} example />
            </>
          ) : (
            <>
              {active.map(r => <RegimenCard key={r.id} r={r} doses={doses} actions={actions} />)}
              {paused.length > 0 && (
                <details>
                  <summary className="small muted" style={{ cursor: 'pointer' }}>Paused ({paused.length})</summary>
                  <div className="stack" style={{ marginTop: 10 }}>{paused.map(r => <RegimenCard key={r.id} r={r} doses={doses} actions={actions} />)}</div>
                </details>
              )}
            </>
          )}
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-head"><h3>How you've felt</h3><span className="count">Last 30 days, 1 to 5</span></div>
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
                <div className="panel-head"><h3>Weight</h3><span className="count">{wUnit}</span></div>
                <LineChart points={weights} y0={lo} y1={hi} ticks={[lo, Math.round((lo + hi) / 2), hi]} label="Weight trend" fmt={v => fmtNum(v, 1)} />
              </section>
            );
          })()}
          <section className="panel">
            <div className="panel-head"><h3>Recent entries</h3><span className="count">{items.length}</span></div>
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
