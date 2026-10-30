import { splitKey, type KV, type LedgerStore, type RemoteItem } from './store';

/** A row as the server returns it: the item plus when the server last saved it. */
export interface PulledItem extends RemoteItem {
  updated_at: string;
}

/** The account's copy of the log. `pull` returns everything saved after `since`, or everything when it's null. */
export interface Remote {
  pull(since: string | null): Promise<PulledItem[]>;
  push(items: RemoteItem[]): Promise<void>;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface Saved {
  /** Item keys with changes not yet sent, each with a counter so an edit made mid-send isn't dropped. */
  pending: Record<string, number>;
  /** Newest server time already pulled. */
  cursor: string | null;
  lastSynced: string | null;
}

/** Pulls start a little before the newest server time seen, in case two saves landed out of order. */
const OVERLAP_MS = 2 * 60_000;
const BATCH = 500;

export const syncStateKey = (uid: string) => `peptide-ledger:sync:${uid}`;

/**
 * Keeps one account's log on this device in step with the server. Changes made here are queued
 * and sent first, then anything newer on the server is pulled in. The latest save of an item wins.
 */
export class Sync {
  status: SyncStatus = 'idle';
  error = '';
  private saved: Saved;
  private gen = 0;
  private running: Promise<void> | null = null;
  private again = false;
  private stopped = false;
  private listeners = new Set<() => void>();

  constructor(private store: LedgerStore, private kv: KV | null, private remote: Remote, private uid: string) {
    this.saved = this.load();
    this.gen = Math.max(0, ...Object.values(this.saved.pending));
  }

  private load(): Saved {
    try {
      const raw = JSON.parse(this.kv?.getItem(syncStateKey(this.uid)) ?? 'null');
      if (raw && typeof raw === 'object') return { pending: raw.pending ?? {}, cursor: raw.cursor ?? null, lastSynced: raw.lastSynced ?? null };
    } catch { /* start fresh */ }
    return { pending: {}, cursor: null, lastSynced: null };
  }
  private save() {
    try { this.kv?.setItem(syncStateKey(this.uid), JSON.stringify(this.saved)); } catch { /* kept in memory */ }
  }
  private set(status: SyncStatus, error = '') {
    this.status = status;
    this.error = error;
    this.listeners.forEach(l => l());
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  get pendingCount() { return Object.keys(this.saved.pending).length; }
  get lastSynced() { return this.saved.lastSynced; }

  /** Queues items changed on this device. */
  mark(keys: string[]) {
    for (const k of keys) this.saved.pending[k] = ++this.gen;
    this.save();
    // A change during a sync gets sent by one more pass of that sync.
    if (this.running) this.again = true;
    this.listeners.forEach(l => l());
  }

  /** Sends queued changes, then pulls newer ones. Calls made while a sync is running join it and run once more after. */
  run(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = (async () => {
      do {
        this.again = false;
        this.set('syncing');
        try {
          await this.pushOnce();
          await this.pullOnce();
          if (this.stopped) return;
          this.saved.lastSynced = new Date().toISOString();
          this.save();
          this.set('synced');
        } catch (e) {
          if (this.stopped) return;
          this.set(isOffline(e) ? 'offline' : 'error', errorText(e));
          return;
        }
      } while (this.again && !this.stopped);
    })().finally(() => { this.running = null; });
    return this.running;
  }

  /** Stops syncing, for example after sign-out. A sync already on the wire finishes without touching the store. */
  stop() {
    this.stopped = true;
  }

  private async pushOnce() {
    const batch = Object.entries(this.saved.pending);
    for (let i = 0; i < batch.length; i += BATCH) {
      const part = batch.slice(i, i + BATCH);
      await this.remote.push(part.map(([key]) => {
        const [kind, id] = splitKey(key);
        const item = this.store.find(key);
        return item ? { kind, id, data: item, deleted: false } : { kind, id, data: {}, deleted: true };
      }));
      if (this.stopped) return;
      // Clear only what was sent. An item edited again while this was sending stays queued.
      for (const [key, g] of part) if (this.saved.pending[key] === g) delete this.saved.pending[key];
      this.save();
    }
  }

  private async pullOnce() {
    const c = this.saved.cursor;
    const since = c ? new Date(Date.parse(c) - OVERLAP_MS).toISOString() : null;
    const rows = await this.remote.pull(since);
    if (this.stopped) return;
    this.store.applyRemote(rows, key => key in this.saved.pending);
    for (const r of rows) {
      if (!this.saved.cursor || Date.parse(r.updated_at) > Date.parse(this.saved.cursor)) this.saved.cursor = r.updated_at;
    }
    this.save();
  }
}

function isOffline(e: unknown) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const msg = errorText(e).toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed');
}

function errorText(e: unknown) {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return String(e);
}
