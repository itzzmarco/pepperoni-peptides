import { useSyncExternalStore } from 'react';
import type { Checkin, DoseEntry, Ledger, Regimen } from './types';

/** The log kept on this device when nobody is signed in. A signed-in account gets its own key. */
export const STORAGE_KEY = 'peptide-ledger:v1';

export type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type Kind = 'regimen' | 'dose' | 'checkin';
const LIST = { regimen: 'regimens', dose: 'doses', checkin: 'checkins' } as const;
const KINDS = Object.keys(LIST) as Kind[];

/** Identifies one regimen, dose, or check-in, for sync: `dose:abc123`. */
export const itemKey = (kind: Kind, id: string) => `${kind}:${id}`;
export function splitKey(key: string): [Kind, string] {
  const i = key.indexOf(':');
  return [key.slice(0, i) as Kind, key.slice(i + 1)];
}
const keysOf = (l: Ledger) => KINDS.flatMap(k => (l[LIST[k]] as { id: string }[]).map(x => itemKey(k, x.id)));

/** One item as the account server stores it. A deleted item is kept as a marker so other devices remove it too. */
export interface RemoteItem {
  kind: Kind;
  id: string;
  data: unknown;
  deleted: boolean;
}

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

/** Reads a saved log from storage, or null when there is none or it can't be read. */
export function readLedger(kv: KV | null, key: string): Ledger | null {
  try {
    const raw = kv?.getItem(key);
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/**
 * The personal log, kept in this browser's localStorage. Signed out, it lives only on this device.
 * Signed in, it is a copy of the account's log, and `onLocalChange` tells the sync which items changed.
 */
export class LedgerStore {
  private state: Ledger;
  private listeners = new Set<() => void>();
  /** False when the browser refused to save (private mode, blocked storage, full quota). */
  persistent = true;
  /** Called with the keys of items the person added, changed, or deleted here. */
  onLocalChange: ((keys: string[]) => void) | null = null;

  constructor(private kv: KV | null, public key = STORAGE_KEY) {
    this.state = this.read() ?? empty();
  }

  private read(): Ledger | null {
    return readLedger(this.kv, this.key);
  }

  private commit(next: Ledger, changed: string[] = []) {
    this.state = next;
    try {
      if (!this.kv) throw new Error('no storage');
      this.kv.setItem(this.key, JSON.stringify(next));
      this.persistent = true;
    } catch {
      this.persistent = false;
    }
    this.listeners.forEach(l => l());
    if (changed.length) this.onLocalChange?.(changed);
  }

  /** Re-read storage, used when another tab changed it. */
  reload() {
    const fresh = this.read();
    if (fresh) {
      this.state = fresh;
      this.listeners.forEach(l => l());
    }
  }

  /** Points the store at another saved log: an account's copy, or back to this device's own log. */
  switchTo(key: string) {
    if (key === this.key) return;
    this.key = key;
    this.state = this.read() ?? empty();
    this.listeners.forEach(l => l());
  }

  /** The current version of one item, or undefined if it was deleted. */
  find(key: string): Regimen | DoseEntry | Checkin | undefined {
    const [kind, id] = splitKey(key);
    const list = LIST[kind] ? (this.state[LIST[kind]] as { id: string }[]) : [];
    return list.find(x => x.id === id) as Regimen | DoseEntry | Checkin | undefined;
  }

  /** Applies items that came from the account, except the ones `skip` says have unsent changes here. */
  applyRemote(items: RemoteItem[], skip: (key: string) => boolean = () => false) {
    if (!items.length) return;
    const lists = { regimens: this.state.regimens.slice(), doses: this.state.doses.slice(), checkins: this.state.checkins.slice() };
    for (const it of items) {
      if (!LIST[it.kind] || skip(itemKey(it.kind, it.id))) continue;
      const list = lists[LIST[it.kind]] as { id: string }[];
      const i = list.findIndex(x => x.id === it.id);
      if (it.deleted) {
        if (i >= 0) list.splice(i, 1);
      } else if (it.data && typeof it.data === 'object' && (it.data as { id?: unknown }).id === it.id) {
        if (i >= 0) list[i] = it.data as { id: string };
        else list.push(it.data as { id: string });
      }
    }
    this.commit(normalize(lists) ?? empty());
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
    this.commit({ ...this.state, regimens: list }, [itemKey('regimen', r.id)]);
  }
  deleteRegimen(id: string) {
    this.commit({ ...this.state, regimens: this.state.regimens.filter(r => r.id !== id) }, [itemKey('regimen', id)]);
  }
  addDose(d: DoseEntry) {
    this.commit({ ...this.state, doses: [d, ...this.state.doses].sort(byNewest) }, [itemKey('dose', d.id)]);
  }
  deleteDose(id: string) {
    this.commit({ ...this.state, doses: this.state.doses.filter(d => d.id !== id) }, [itemKey('dose', id)]);
  }
  addCheckin(c: Checkin) {
    this.commit({ ...this.state, checkins: [c, ...this.state.checkins].sort(byNewest) }, [itemKey('checkin', c.id)]);
  }
  deleteCheckin(id: string) {
    this.commit({ ...this.state, checkins: this.state.checkins.filter(c => c.id !== id) }, [itemKey('checkin', id)]);
  }
  /** Restores a backup file's contents (or another saved log) alongside what is already here. */
  importBackup(raw: unknown): number | null {
    const incoming = normalize(raw);
    if (!incoming) return null;
    const before = new Set(keysOf(this.state));
    const { ledger, added } = merge(this.state, incoming);
    this.commit(ledger, keysOf(ledger).filter(k => !before.has(k)));
    return added;
  }
  clearAll() {
    this.commit(empty(), keysOf(this.state));
  }
}

/** How many regimens, doses, and check-ins a log holds. */
export const countItems = (l: Ledger) => l.regimens.length + l.doses.length + l.checkins.length;

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

/** This browser's storage, shared with the account code. Null when the browser blocks it. */
export const kv = typeof window === 'undefined' ? null : browserStorage();

export const store = new LedgerStore(kv);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === store.key) store.reload();
  });
}

export const useLedger = () => useSyncExternalStore(store.subscribe, store.get);
