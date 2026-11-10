import { useCallback, useMemo, useRef, useState } from 'react';
import { store, useLedger } from '../lib/store';
import { dayKey, fmtDay, fmtNum } from '../lib/format';
import { dayAt, dueDayKeys, monthGrid, parsePasted, planBackfill, readWeight, weightsByDay } from '../lib/backfill';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { regName } from '../views/PeptidesView';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
/** A day-to-day change bigger than this is flagged as a possible typo. */
const JUMP = 0.05;

/**
 * Fill in past days from a paper log: a month grid laid out like a wall calendar. Type a weight in each
 * day (Enter moves to the next day), or pick a peptide and tap the days it was taken. Nothing is saved
 * until Save, so the whole month can be checked against the paper first.
 */
export function BackfillSheet({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const ledger = useLedger();
  const { regimens, doses, checkins } = ledger;
  const now = new Date();
  const [ym, setYm] = useState(() => ({ y: now.getFullYear(), m: now.getMonth() }));
  const [mode, setMode] = useState<string>('weight');
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [ticks, setTicks] = useState<Record<string, string[]>>({});
  const [unit, setUnit] = useState(() => checkins.find(c => c.weightUnit)?.weightUnit ?? 'lb');
  const [paste, setPaste] = useState('');
  const [bad, setBad] = useState<string[]>([]);
  const grid = useRef<HTMLDivElement>(null);
  const tile = useRef<HTMLElement>(null);
  // The day being typed in. Its typo and jump warnings wait until you move on, so "3" on the way to "311" isn't flagged.
  const [editing, setEditing] = useState<string | null>(null);

  const saved = useMemo(() => weightsByDay(checkins), [checkins]);
  const cells = monthGrid(ym.y, ym.m, now);
  const plan = useMemo(() => planBackfill(ledger, { weights, doses: ticks, unit }, new Date(), regName), [ledger, weights, ticks, unit]);
  const nWeights = plan.saveCheckins.length + plan.deleteCheckins.length;
  const nDoses = plan.addDoses.length;
  const invalid = Object.entries(weights).filter(([, v]) => Number.isNaN(readWeight(v))).map(([k]) => k);
  const pending = nWeights + nDoses;

  const shown = (key: string) => (key in weights ? weights[key] : saved.has(key) ? String(saved.get(key)!.weight) : '');
  // Every day's weight as it would be after saving, for spotting typos like 231 for 213.
  const after = useMemo(() => {
    const m = new Map<string, number>();
    for (const [k, c] of saved) m.set(k, c.weight!);
    for (const [k, v] of Object.entries(weights)) {
      const w = readWeight(v);
      if (w == null || Number.isNaN(w)) m.delete(k);
      else m.set(k, w);
    }
    return m;
  }, [saved, weights]);
  const jumpFrom = (key: string): [string, number] | null => {
    const v = after.get(key);
    if (v == null) return null;
    const d = dayAt(key);
    for (let i = 1; i <= 14; i++) {
      const k = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i));
      const p = after.get(k);
      if (p != null) return Math.abs(v - p) / p > JUMP ? [k, p] : null;
    }
    return null;
  };

  const setWeight = (key: string, v: string) => {
    const next = { ...weights };
    const had = saved.get(key);
    if (had ? readWeight(v) === had.weight : !v.trim()) delete next[key];
    else next[key] = v;
    setWeights(next);
  };

  const r = regimens.find(x => x.id === mode);
  const logged = useMemo(() => new Set(r ? doses.filter(d => d.rid === r.id).map(d => dayKey(new Date(d.at))) : []), [doses, r]);
  const ticked = new Set(r ? ticks[r.id] ?? [] : []);
  const due = r ? dueDayKeys(r, doses, cells) : new Set<string>();
  const dueOpen = [...due].filter(k => !logged.has(k) && !ticked.has(k));
  const toggle = (key: string) => {
    if (!r) return;
    if (logged.has(key)) { toast('Already logged. To remove it, delete it under History on Trends.'); return; }
    setTicks({ ...ticks, [r.id]: ticked.has(key) ? [...ticked].filter(k => k !== key) : [...ticked, key] });
  };

  const isThisMonth = ym.y === now.getFullYear() && ym.m === now.getMonth();
  const step = (n: number) => setYm(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }));
  const title = new Date(ym.y, ym.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Enter (or Next on a phone keyboard) moves to the next day's box.
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const boxes = [...(grid.current?.querySelectorAll<HTMLInputElement>('input') ?? [])];
    const next = boxes[boxes.indexOf(e.currentTarget) + 1];
    if (next) next.focus();
    else e.currentTarget.blur();
  };

  const fill = () => {
    const { values, bad } = parsePasted(paste, new Date());
    setBad(bad);
    if (!values.length) { toast('No dates with weights found. Try one day per line, like 9/7 213.'); return; }
    const next = { ...weights };
    for (const [k, v] of values) {
      if (saved.get(k)?.weight === readWeight(v)) delete next[k];
      else next[k] = v;
    }
    setWeights(next);
    setMode('weight');
    const first = dayAt(values.map(([k]) => k).sort()[0]);
    setYm({ y: first.getFullYear(), m: first.getMonth() });
    setPaste('');
    tile.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    toast(`Filled in ${plural(values.length, 'day')}${bad.length ? `, skipped ${plural(bad.length, 'line')}` : ''}. Check them, then save.`);
  };

  // Sheet re-focuses itself whenever onClose changes, so this must keep one identity while typing.
  const pendingRef = useRef(0);
  pendingRef.current = pending;
  const close = useCallback(() => {
    const n = pendingRef.current;
    if (n && !window.confirm(`Leave without saving? ${n} ${n === 1 ? 'entry' : 'entries'} you filled in will be lost.`)) return;
    onClose();
  }, [onClose]);

  const save = () => {
    if (invalid.length) {
      const d = dayAt(invalid.sort()[0]);
      setYm({ y: d.getFullYear(), m: d.getMonth() });
      setMode('weight');
      toast(`${fmtDay(d)} doesn't look like a weight. Fix or clear it first.`);
      return;
    }
    if (!pending) { onClose(); return; }
    store.applyBatch({ checkins: plan.saveCheckins, deleteCheckins: plan.deleteCheckins, doses: plan.addDoses });
    toast(`Saved ${[nWeights && plural(nWeights, 'weight'), nDoses && plural(nDoses, 'dose')].filter(Boolean).join(' and ')}.`);
    onClose();
  };

  const tint = r ? 'mint' : 'lilac';
  return (
    <Sheet onClose={close} label="Fill in past days">
      <div className="sheet-head">
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">Back-track</span>
          <h2>Fill in past days</h2>
          <p className="small muted">Copy from a paper log one month at a time. Nothing saves until you tap Save.</p>
        </div>
        <button type="button" className="icon-btn" onClick={close} aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
      </div>

      {regimens.length > 0 && (
        <div className="pick" role="group" aria-label="What to fill in" style={{ margin: '0 -16px', padding: '0 16px 2px' }}>
          <button type="button" className="fchip" aria-pressed={mode === 'weight'} onClick={() => setMode('weight')}>Weight</button>
          {regimens.map(x => (
            <button key={x.id} type="button" className="fchip" aria-pressed={mode === x.id} onClick={() => setMode(x.id)}>
              {regName(x)}{(ticks[x.id]?.length ?? 0) > 0 && <span className="bf-badge">+{ticks[x.id].length}</span>}
            </button>
          ))}
        </div>
      )}

      <section ref={tile} className={`tile ${tint} bf`} aria-label={r ? `${regName(r)} doses, ${title}` : `Weights, ${title}`}>
        <div className="spread" style={{ alignItems: 'center' }}>
          <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Previous month"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
          <h3 className="bf-title" aria-live="polite">{title}</h3>
          <button type="button" className="icon-btn" onClick={() => step(1)} disabled={isThisMonth} aria-label="Next month"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
        </div>
        <p className="small" style={{ color: 'var(--ink-2)' }}>
          {r ? `Tap each day you took ${regName(r)}. It's logged as ${fmtNum(Number(r.dose), 3)} ${r.unit} at your usual time.` : 'Type each day’s weight. Enter jumps to the next day.'}
        </p>

        <div className="bf-grid" ref={grid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="bf-wd" aria-hidden="true">{d}</span>)}
          {cells.map((c, i) => {
            if (!c) return <span key={`x${i}`} />;
            const n = c.date.getDate();
            if (c.future) return <span key={c.key} className="bf-cell future" aria-hidden="true"><span className="bf-d">{n}</span></span>;
            if (r) {
              const on = logged.has(c.key) || ticked.has(c.key);
              const cls = ['bf-cell', 'dose', logged.has(c.key) && 'logged', ticked.has(c.key) && 'new', due.has(c.key) && 'due', c.today && 'today'].filter(Boolean).join(' ');
              return (
                <button key={c.key} type="button" className={cls} aria-pressed={on} onClick={() => toggle(c.key)}
                  aria-label={`${fmtDay(c.date)}${logged.has(c.key) ? ', already logged' : due.has(c.key) ? ', due by schedule' : ''}`}>
                  <span className="bf-d">{n}</span>
                  {on && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                </button>
              );
            }
            const v = shown(c.key);
            const changed = c.key in weights;
            const settled = editing !== c.key;
            const wrong = settled && changed && Number.isNaN(readWeight(weights[c.key]));
            const jump = settled && !wrong && jumpFrom(c.key);
            const cls = ['bf-cell', saved.has(c.key) && !changed && 'saved', changed && 'changed', wrong && 'wrong', jump && 'jump', c.today && 'today'].filter(Boolean).join(' ');
            return (
              <label key={c.key} className={cls} title={jump ? `Big change from ${fmtDay(dayAt(jump[0]))} (${jump[1]}). Double-check.` : undefined}>
                <span className="bf-d">{n}</span>
                <input type="text" inputMode="decimal" enterKeyHint="next" autoComplete="off" maxLength={6} value={v}
                  aria-label={`Weight on ${fmtDay(c.date)}`} aria-invalid={wrong || undefined}
                  onChange={e => setWeight(c.key, e.target.value)} onKeyDown={onKey}
                  onFocus={() => setEditing(c.key)} onBlur={() => setEditing(null)} />
              </label>
            );
          })}
        </div>

        {r ? (
          <>
            <div className="legend" style={{ color: 'var(--mint-2)' }}>
              <span><i style={{ background: 'var(--mint-ink)' }} />Already logged</span>
              <span><i style={{ background: 'var(--mint-ink)', boxShadow: 'inset 0 0 0 2px var(--accent)' }} />Adding</span>
              {due.size > 0 && <span><i style={{ boxShadow: 'inset 0 -3px 0 var(--mint-ink)', background: 'var(--surface)' }} />Due by schedule</span>}
            </div>
            {dueOpen.length > 1 && (
              <button type="button" className="btn soft sm" style={{ justifySelf: 'start' }} onClick={() => setTicks({ ...ticks, [r.id]: [...ticked, ...dueOpen] })}>
                Tick all {dueOpen.length} due days in {new Date(ym.y, ym.m, 1).toLocaleDateString(undefined, { month: 'long' })}
              </button>
            )}
          </>
        ) : (
          <div className="spread" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div className="legend" style={{ color: 'var(--ink-2)' }}>
              <span><i className="bf-key saved" />Saved</span>
              <span><i className="bf-key changed" />New or changed</span>
              <span><i className="bf-key jump" />Big jump, check it</span>
            </div>
            <label className="bf-unit"><span className="xsmall">Unit</span><select value={unit} onChange={e => setUnit(e.target.value)} aria-label="Weight unit"><option>lb</option><option>kg</option></select></label>
          </div>
        )}
      </section>

      <details className="tile bf-paste">
        <summary>Paste a list of weights instead</summary>
        <p className="small muted">One day per line: a date, then the weight. Dates are month/day, like <span className="mono">9/7 213</span>, <span className="mono">Sep 7 213</span> or <span className="mono">2026-09-07 213</span>. The days fill in above so you can check them before saving.</p>
        <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={5} placeholder={'9/7 213\n9/8 211\n9/9 210'} aria-label="Pasted weights" />
        {bad.length > 0 && <p className="alert warn small"><b>Skipped {plural(bad.length, 'line')} I couldn't read</b><span className="mono">{bad.slice(0, 5).join(' · ')}{bad.length > 5 ? ' …' : ''}</span></p>}
        <button type="button" className="btn soft sm" style={{ justifySelf: 'start' }} onClick={fill} disabled={!paste.trim()}>Fill in the days</button>
      </details>

      <div className="sheet-foot">
        <button type="button" className="btn ghost" onClick={close}>Cancel</button>
        <button type="button" className="btn" onClick={save} disabled={!pending && !invalid.length} style={{ flex: '1 1 160px' }}>
          {invalid.length ? `Fix ${plural(invalid.length, 'day')} first` : pending ? `Save ${[nWeights && plural(nWeights, 'weight'), nDoses && plural(nDoses, 'dose')].filter(Boolean).join(' and ')}` : 'Nothing to save yet'}
        </button>
      </div>
    </Sheet>
  );
}
