import { useSyncExternalStore } from 'react';
import type { Checkin, DoseEntry, Ledger, Regimen } from './types';

export const STORAGE_KEY = 'peptide-ledger:v1';

type KV = Pick<Storage, 'getItem' | 'setItem'>;

const empty = (): Ledger => ({ version: 1, regimens: [], doses: [], checkins: [] });

const byNewest = <T extends { at: string }>(a: T, b: T) => b.at.localeCompare(a.at);

/** Accepts anything parsed from storage or a backup file and returns a well-formed ledger, or null. */
export function normalize(raw: unknown): Ledger | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<Ledger>;
  if (!Array.isArray(o.regimens) && !Array.isArray(o.doses) && !Array.isArray(o.checkins)) return null;
  const okId = (x: unknown): x is { id: string } => !!x && typeof x === 'object' && typeof (x as { id: unknown }).id === 'string';
  const okEntry = (x: unknown): x is { id: string; at: string } => okId(x) && typeof (x as unknown as { at: unknown }).at === 'string';
  return {
    version: 1,
    regimens: (o.regimens ?? []).filter(okId) as Regimen[],
    doses: ((o.doses ?? []).filter(okEntry) as DoseEntry[]).sort(byNewest),
    checkins: ((o.checkins ?? []).filter(okEntry) as Checkin[])
      .map(c => ({ ...c, effects: c.effects ?? [], flags: c.flags ?? [] }))
      .sort(byNewest),
  };
}

/** Merges `incoming` into `base`, keeping existing items when ids collide. */
export function merge(base: Ledger, incoming: Ledger): { ledger: Ledger; added: number } {
  let added = 0;
  const add = <T extends { id: string }>(a: T[], b: T[]) => {
    const ids = new Set(a.map(x => x.id));
    const fresh = b.filter(x => !ids.has(x.id));
    added += fresh.length;
    return [...a, ...fresh];
  };
  return {
    ledger: {
      version: 1,
      regimens: add(base.regimens, incoming.regimens),
      doses: add(base.doses, incoming.doses).sort(byNewest),
      checkins: add(base.checkins, incoming.checkins).sort(byNewest),
    },
    added,
  };
}

/**
 * The personal log. Everything stays in this browser's localStorage: there is no server,
 * so nothing a person logs leaves their device unless they export it.
 */
export class LedgerStore {
  private state: Ledger;
  private listeners = new Set<() => void>();
  /** False when the browser refused to save (private mode, blocked storage, full quota). */
  persistent = true;

  constructor(private kv: KV | null) {
    this.state = this.read() ?? empty();
  }

  private read(): Ledger | null {
    try {
      const raw = this.kv?.getItem(STORAGE_KEY);
      return raw ? normalize(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  private commit(next: Ledger) {
    this.state = next;
    try {
      if (!this.kv) throw new Error('no storage');
      this.kv.setItem(STORAGE_KEY, JSON.stringify(next));
      this.persistent = true;
    } catch {
      this.persistent = false;
    }
    this.listeners.forEach(l => l());
  }

  /** Re-read storage, used when another tab changed it. */
  reload() {
    const fresh = this.read();
    if (fresh) {
      this.state = fresh;
      this.listeners.forEach(l => l());
    }
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  get = () => this.state;

  saveRegimen(r: Regimen) {
    const list = this.state.regimens.slice();
    const i = list.findIndex(x => x.id === r.id);
    if (i >= 0) list[i] = r;
    else list.push(r);
    this.commit({ ...this.state, regimens: list });
  }
  deleteRegimen(id: string) {
    this.commit({ ...this.state, regimens: this.state.regimens.filter(r => r.id !== id) });
  }
  addDose(d: DoseEntry) {
    this.commit({ ...this.state, doses: [d, ...this.state.doses].sort(byNewest) });
  }
  deleteDose(id: string) {
    this.commit({ ...this.state, doses: this.state.doses.filter(d => d.id !== id) });
  }
  addCheckin(c: Checkin) {
    this.commit({ ...this.state, checkins: [c, ...this.state.checkins].sort(byNewest) });
  }
  /** Replaces a check-in with the same id, used when someone adds details to a one-tap check-in. */
  updateCheckin(c: Checkin) {
    this.commit({ ...this.state, checkins: this.state.checkins.map(x => (x.id === c.id ? c : x)).sort(byNewest) });
  }
  deleteCheckin(id: string) {
    this.commit({ ...this.state, checkins: this.state.checkins.filter(c => c.id !== id) });
  }
  /** Restores a backup file's contents alongside what is already here. */
  importBackup(raw: unknown): number | null {
    const incoming = normalize(raw);
    if (!incoming) return null;
    const { ledger, added } = merge(this.state, incoming);
    this.commit(ledger);
    return added;
  }
  clearAll() {
    this.commit(empty());
  }
}

function browserStorage(): KV | null {
  try {
    const s = window.localStorage;
    const probe = '__pl_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export const store = new LedgerStore(typeof window === 'undefined' ? null : browserStorage());

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) store.reload();
  });
}

export const useLedger = () => useSyncExternalStore(store.subscribe, store.get);
