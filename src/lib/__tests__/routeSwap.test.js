import { describe, expect, it } from 'vitest';
import { transitionGate } from '../routeSwap';
/** A fake startViewTransition: runs the update right away and finishes when `end()` is called. */
function fakeStart() {
    let end = () => { };
    const calls = [];
    const start = update => {
        calls.push(1);
        update();
        return { finished: new Promise(res => { end = res; }) };
    };
    return { start, calls, end: () => end() };
}
describe('transitionGate', () => {
    it('runs the swap inside a transition when one can start', () => {
        let swaps = 0;
        const go = transitionGate(() => { swaps++; });
        const t = fakeStart();
        go(t.start);
        expect(t.calls.length).toBe(1);
        expect(swaps).toBe(1);
    });
    it('swaps at once, without a second transition, while one is still running', () => {
        let swaps = 0;
        const go = transitionGate(() => { swaps++; });
        const t = fakeStart();
        go(t.start);
        go(t.start);
        expect(t.calls.length).toBe(1);
        expect(swaps).toBe(2);
    });
    it('uses transitions again once the running one finishes', async () => {
        let swaps = 0;
        const go = transitionGate(() => { swaps++; });
        const t = fakeStart();
        go(t.start);
        t.end();
        await Promise.resolve();
        await Promise.resolve();
        go(t.start);
        expect(t.calls.length).toBe(2);
        expect(swaps).toBe(2);
    });
    it('still swaps when starting a transition throws, and does not stay locked', () => {
        let swaps = 0;
        const go = transitionGate(() => { swaps++; });
        go(() => { throw new Error('InvalidStateError'); });
        expect(swaps).toBe(1);
        const t = fakeStart();
        go(t.start);
        expect(t.calls.length).toBe(1);
    });
    it('swaps instantly with no transition (reduced motion or unsupported)', () => {
        let swaps = 0;
        transitionGate(() => { swaps++; })(null);
        expect(swaps).toBe(1);
    });
});
