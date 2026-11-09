import { useEffect, useSyncExternalStore } from 'react';
import { kv, normalize } from './store';
import { configured, currentUserId, getClient, partnersKey, useAccount } from './account';
const emptyLedger = () => ({ version: 1, regimens: [], doses: [], checkins: [] });
const EMPTY = { uid: null, partners: [], logs: {}, fetchedAt: 0, loading: false, error: '' };
const REFRESH_MS = 60_000;
const PAGE = 1000;
const LIST = { regimen: 'regimens', dose: 'doses', checkin: 'checkins' };
/** Turns a partner's rows from the server into a log, leaving out deleted items. */
export function rowsToLedger(rows) {
    const lists = { regimens: [], doses: [], checkins: [] };
    for (const r of rows) {
        const k = LIST[r.kind];
        if (!k || r.deleted || !r.data || typeof r.data !== 'object' || r.data.id !== r.id)
            continue;
        lists[k].push(r.data);
    }
    return normalize(lists) ?? emptyLedger();
}
/** What to call a partner day to day: the first word of their name, or the start of their email. */
export function firstName(name) {
    const n = name.trim();
    if (!n)
        return 'Your partner';
    if (n.includes('@')) {
        const w = n.split('@')[0].split(/[._+-]/)[0];
        return w ? w[0].toUpperCase() + w.slice(1) : n;
    }
    return n.split(/\s+/)[0];
}
/** An invite code as typed: letters and digits only, upper case, at most 6. */
export const cleanCode = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
/** An invite code in two halves, easy to read out: K7Q 4MX. */
export const showCode = (c) => (c.length === 6 ? `${c.slice(0, 3)} ${c.slice(3)}` : c);
/** Turns a server or network error into something a person can act on. */
export function partnerError(e) {
    const err = (e ?? {});
    const m = err.message ?? String(e ?? '');
    // The database step from the pull request hasn't been run: the table or functions don't exist yet.
    if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(err.code ?? '') || /could not find the (function|table)|does not exist/i.test(m)) {
        return "Partner linking isn't set up on the server yet. The partner step needs to be run in Supabase first.";
    }
    if (/fetch|network|load failed/i.test(m))
        return "Couldn't reach the server. Check your connection and try again.";
    return m || 'Something went wrong. Try again.';
}
let state = EMPTY;
const listeners = new Set();
function set(p) {
    state = { ...state, ...p };
    listeners.forEach(l => l());
}
function fromCache(uid) {
    try {
        const raw = kv?.getItem(partnersKey(uid));
        if (raw) {
            const c = JSON.parse(raw);
            const logs = Object.fromEntries(Object.entries(c.logs ?? {}).map(([k, v]) => [k, normalize(v) ?? emptyLedger()]));
            return { ...EMPTY, uid, partners: Array.isArray(c.partners) ? c.partners : [], logs };
        }
    }
    catch { /* unreadable cache: fetch fresh */ }
    return { ...EMPTY, uid };
}
function toCache() {
    if (!state.uid)
        return;
    try {
        kv?.setItem(partnersKey(state.uid), JSON.stringify({ partners: state.partners, logs: state.logs }));
    }
    catch { /* storage full or blocked */ }
}
async function pullLog(sb, partnerId) {
    const out = [];
    for (let from = 0;; from += PAGE) {
        const { data, error } = await sb.from('ledger_items').select('kind,id,data,deleted').eq('user_id', partnerId)
            .order('kind').order('id').range(from, from + PAGE - 1);
        if (error)
            throw error;
        out.push(...data);
        if (data.length < PAGE)
            return out;
    }
}
let inflight = null;
/** Fetches the partner list and each partner's log. Skipped if done in the last minute, unless forced. */
export function refreshPartners(force = false) {
    const uid = currentUserId();
    if (!configured || !uid)
        return Promise.resolve();
    if (state.uid !== uid)
        set(fromCache(uid));
    if (inflight)
        return inflight;
    if (!force && Date.now() - state.fetchedAt < REFRESH_MS)
        return Promise.resolve();
    set({ loading: true });
    inflight = (async () => {
        try {
            const sb = await getClient();
            const { data, error } = await sb.from('partners').select('partner_id,partner_name,created_at').order('created_at');
            if (error)
                throw error;
            const partners = data
                .map(r => ({ id: r.partner_id, name: r.partner_name, since: r.created_at }));
            const logs = {};
            for (const p of partners)
                logs[p.id] = rowsToLedger(await pullLog(sb, p.id));
            if (currentUserId() !== uid)
                return;
            set({ partners, logs, fetchedAt: Date.now(), loading: false, error: '' });
            toCache();
        }
        catch (e) {
            if (currentUserId() === uid)
                set({ loading: false, error: partnerError(e), fetchedAt: Date.now() });
        }
        finally {
            inflight = null;
        }
    })();
    return inflight;
}
/** Makes an invite code for the partner to enter. Replaces any earlier code. */
export async function createInvite() {
    try {
        const sb = await getClient();
        const { data, error } = await sb.rpc('create_partner_invite');
        if (error)
            throw error;
        return { code: String(data) };
    }
    catch (e) {
        return { error: partnerError(e) };
    }
}
/** Links with whoever made `code`. Resolves to their name. */
export async function acceptInvite(code) {
    try {
        const sb = await getClient();
        const { data, error } = await sb.rpc('accept_partner_invite', { invite_code: cleanCode(code) });
        if (error)
            throw error;
        await refreshPartners(true);
        return { name: String(data ?? '') };
    }
    catch (e) {
        return { error: partnerError(e) };
    }
}
/** Ends the link for both people. Resolves to an error message, or '' on success. */
export async function unlinkPartner(id) {
    try {
        const sb = await getClient();
        const { error } = await sb.rpc('unlink_partner', { partner: id });
        if (error)
            throw error;
        const logs = { ...state.logs };
        delete logs[id];
        set({ partners: state.partners.filter(p => p.id !== id), logs });
        toCache();
        return '';
    }
    catch (e) {
        return partnerError(e);
    }
}
const subscribe = (fn) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
};
/** Partner list and logs for the signed-in person, fetched when a screen using it opens. */
export function usePartners() {
    const uid = useAccount().user?.id ?? null;
    const s = useSyncExternalStore(subscribe, () => state);
    useEffect(() => { if (uid)
        void refreshPartners(); }, [uid]);
    return uid && s.uid === uid ? s : EMPTY;
}
/* Weight helpers shared by Today and the partner screen. */
const LB_PER_KG = 2.20462;
export const convertWeight = (w, from = 'lb', to = 'lb') => from === to ? w : from === 'kg' && to === 'lb' ? w * LB_PER_KG : from === 'lb' && to === 'kg' ? w / LB_PER_KG : w;
/** Weigh-ins on or after `since`, oldest first, in `unit`. */
export function weighIns(checkins, unit, since = 0) {
    return checkins
        .filter(c => c.weight && c.weight > 0 && new Date(c.at).getTime() >= since)
        .map(c => ({ at: new Date(c.at), w: convertWeight(c.weight, c.weightUnit ?? unit, unit) }))
        .sort((a, b) => a.at.getTime() - b.at.getTime());
}
/** First and latest weigh-in on or after `since`, and the change between them. */
export function weightChange(checkins, unit, since = 0) {
    const w = weighIns(checkins, unit, since);
    if (!w.length)
        return null;
    const first = w[0], last = w[w.length - 1];
    return { first, last, change: last.w - first.w, count: w.length };
}
