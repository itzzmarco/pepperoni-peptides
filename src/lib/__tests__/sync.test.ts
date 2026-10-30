import { describe, expect, it } from 'vitest';
import { LedgerStore, STORAGE_KEY, itemKey, type RemoteItem } from '../store';
import { Sync, syncStateKey, type PulledItem, type Remote } from '../sync';
import { MemoryKV, check, dose, reg } from './helpers';

/** Stands in for the account table: the server stamps each save with its own clock. */
class FakeServer {
  rows = new Map<string, PulledItem>();
  clock = Date.parse('2026-10-30T12:00:00Z');
  offline = false;
  pushes = 0;
  remote(): Remote {
    return {
      pull: async since => {
        if (this.offline) throw new TypeError('Failed to fetch');
        return [...this.rows.values()]
          .filter(r => !since || Date.parse(r.updated_at) > Date.parse(since))
          .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
      },
      push: async (items: RemoteItem[]) => {
        if (this.offline) throw new TypeError('Failed to fetch');
        this.pushes++;
        for (const it of items) {
          this.clock += 1000;
          this.rows.set(itemKey(it.kind, it.id), { ...it, updated_at: new Date(this.clock).toISOString() });
        }
      },
    };
  }
}

/** One phone or browser signed in to the account. */
function device(server: FakeServer, kv = new MemoryKV()) {
  const store = new LedgerStore(kv, `${STORAGE_KEY}:u1`);
  const sync = new Sync(store, kv, server.remote(), 'u1');
  store.onLocalChange = keys => sync.mark(keys);
  return { store, sync, kv };
}

describe('Sync', () => {
  it('sends changes and brings them to the other device', async () => {
    const server = new FakeServer();
    const phone = device(server);
    const laptop = device(server);
    phone.store.saveRegimen(reg('r1'));
    phone.store.addDose(dose('d1', '2026-10-30T08:00:00Z'));
    expect(phone.sync.pendingCount).toBe(2);
    await phone.sync.run();
    expect(phone.sync.pendingCount).toBe(0);
    expect(phone.sync.status).toBe('synced');
    await laptop.sync.run();
    expect(laptop.store.get().regimens.map(r => r.id)).toEqual(['r1']);
    expect(laptop.store.get().doses.map(d => d.id)).toEqual(['d1']);
    // Pulled items aren't queued to be sent back.
    expect(laptop.sync.pendingCount).toBe(0);
  });

  it('removes deleted items on the other device', async () => {
    const server = new FakeServer();
    const phone = device(server);
    const laptop = device(server);
    phone.store.addCheckin(check('c1', '2026-10-30T09:00:00Z'));
    await phone.sync.run();
    await laptop.sync.run();
    expect(laptop.store.get().checkins).toHaveLength(1);
    laptop.store.deleteCheckin('c1');
    await laptop.sync.run();
    expect(server.rows.get('checkin:c1')).toMatchObject({ deleted: true, data: {} });
    await phone.sync.run();
    expect(phone.store.get().checkins).toHaveLength(0);
  });

  it('keeps an unsent local edit over an older copy from the server', async () => {
    const server = new FakeServer();
    const phone = device(server);
    const laptop = device(server);
    phone.store.saveRegimen(reg('r1'));
    await phone.sync.run();
    await laptop.sync.run();
    laptop.store.saveRegimen({ ...reg('r1'), dose: '5' });
    phone.store.saveRegimen({ ...reg('r1'), dose: '2' });
    await laptop.sync.run();
    // The phone sends its edit first, so it is the latest save and wins on both devices.
    await phone.sync.run();
    await laptop.sync.run();
    expect(phone.store.get().regimens[0].dose).toBe('2');
    expect(laptop.store.get().regimens[0].dose).toBe('2');
  });

  it('keeps an edit made while a send is in flight', async () => {
    const server = new FakeServer();
    const phone = device(server);
    phone.store.saveRegimen(reg('r1'));
    const first = phone.sync.run();
    phone.store.saveRegimen({ ...reg('r1'), dose: '9' });
    await first;
    expect(server.rows.get('regimen:r1')?.data).toMatchObject({ dose: '9' });
    expect(phone.sync.pendingCount).toBe(0);
  });

  it('works offline and catches up later, remembering the queue across restarts', async () => {
    const server = new FakeServer();
    const phone = device(server);
    server.offline = true;
    phone.store.addDose(dose('d1', '2026-10-30T08:00:00Z'));
    await phone.sync.run();
    expect(phone.sync.status).toBe('offline');
    expect(phone.store.get().doses).toHaveLength(1);
    // The app restarts: the queue is read back from storage.
    const again = device(server, phone.kv);
    expect(again.sync.pendingCount).toBe(1);
    server.offline = false;
    await again.sync.run();
    expect(server.rows.has('dose:d1')).toBe(true);
    expect(again.sync.status).toBe('synced');
    expect(JSON.parse(phone.kv.getItem(syncStateKey('u1'))!).pending).toEqual({});
  });

  it('only asks for what changed since the last pull', async () => {
    const server = new FakeServer();
    const phone = device(server);
    const seen: (string | null)[] = [];
    const remote = server.remote();
    const spy = new Sync(phone.store, phone.kv, { ...remote, pull: since => { seen.push(since); return remote.pull(since); } }, 'u1');
    phone.store.onLocalChange = keys => spy.mark(keys);
    await spy.run();
    phone.store.saveRegimen(reg('r1'));
    await spy.run();
    expect(seen[0]).toBeNull();
    expect(seen[1]).toBeNull();
    await spy.run();
    // After the first item arrives, pulls start a couple of minutes before the newest server time.
    expect(Date.parse(seen[2]!)).toBe(Date.parse(server.rows.get('regimen:r1')!.updated_at) - 120_000);
  });

  it('erasing the log erases it from the account', async () => {
    const server = new FakeServer();
    const phone = device(server);
    const laptop = device(server);
    phone.store.saveRegimen(reg('r1'));
    phone.store.addDose(dose('d1', '2026-10-30T08:00:00Z'));
    await phone.sync.run();
    phone.store.clearAll();
    await phone.sync.run();
    await laptop.sync.run();
    expect(laptop.store.get()).toEqual({ version: 1, regimens: [], doses: [], checkins: [] });
  });

  it('a restored backup or moved device log is sent to the account', async () => {
    const server = new FakeServer();
    const phone = device(server);
    phone.store.importBackup({ regimens: [reg('r1')], doses: [dose('d1', '2026-10-30T08:00:00Z')], checkins: [] });
    expect(phone.sync.pendingCount).toBe(2);
    await phone.sync.run();
    expect([...server.rows.keys()].sort()).toEqual(['dose:d1', 'regimen:r1']);
  });

  it('ignores rows that are not valid items', async () => {
    const server = new FakeServer();
    const phone = device(server);
    server.rows.set('dose:x', { kind: 'dose', id: 'x', data: { id: 'other' }, deleted: false, updated_at: '2026-10-30T12:00:01Z' });
    server.rows.set('pill:y', { kind: 'pill' as 'dose', id: 'y', data: { id: 'y' }, deleted: false, updated_at: '2026-10-30T12:00:02Z' });
    await phone.sync.run();
    expect(phone.store.get().doses).toHaveLength(0);
    expect(phone.sync.status).toBe('synced');
  });

  it('stops touching the store after sign-out', async () => {
    const server = new FakeServer();
    const phone = device(server);
    const laptop = device(server);
    laptop.store.saveRegimen(reg('r1'));
    await laptop.sync.run();
    const running = phone.sync.run();
    phone.sync.stop();
    phone.store.switchTo(STORAGE_KEY);
    await running;
    expect(phone.store.get().regimens).toHaveLength(0);
  });
});

describe('LedgerStore accounts', () => {
  it('keeps each account and the signed-out log apart', () => {
    const kv = new MemoryKV();
    const s = new LedgerStore(kv);
    s.saveRegimen(reg('device'));
    s.switchTo(`${STORAGE_KEY}:marco`);
    expect(s.get().regimens).toHaveLength(0);
    s.saveRegimen(reg('marco'));
    s.switchTo(`${STORAGE_KEY}:partner`);
    s.saveRegimen(reg('partner'));
    s.switchTo(STORAGE_KEY);
    expect(s.get().regimens.map(r => r.id)).toEqual(['device']);
    s.switchTo(`${STORAGE_KEY}:marco`);
    expect(s.get().regimens.map(r => r.id)).toEqual(['marco']);
  });

  it('reports which items changed', () => {
    const s = new LedgerStore(new MemoryKV());
    const seen: string[][] = [];
    s.onLocalChange = k => seen.push(k);
    s.saveRegimen(reg('a'));
    s.addDose(dose('1', '2026-10-01T00:00:00Z'));
    s.deleteDose('1');
    s.importBackup({ regimens: [reg('a'), reg('b')], doses: [], checkins: [] });
    s.applyRemote([{ kind: 'checkin', id: 'c', data: check('c', '2026-10-02T00:00:00Z'), deleted: false }]);
    s.clearAll();
    expect(seen).toEqual([['regimen:a'], ['dose:1'], ['dose:1'], ['regimen:b'], ['regimen:a', 'regimen:b', 'checkin:c']]);
  });
});
