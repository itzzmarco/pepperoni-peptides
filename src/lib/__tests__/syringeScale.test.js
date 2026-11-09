import { describe, expect, it } from 'vitest';
import { MIN_LABEL_GAP, MIN_TICK_GAP, syringeScale } from '../syringeScale';
describe('syringeScale', () => {
    it('keeps every unit tick and every major label on a wide drawing', () => {
        expect(syringeScale(30, 400)).toEqual({ step: 1, major: 5, label: 5 });
        expect(syringeScale(50, 400)).toEqual({ step: 1, major: 10, label: 10 });
        expect(syringeScale(100, 440)).toEqual({ step: 1, major: 10, label: 10 });
    });
    it('thins ticks and labels in a 320px phone card', () => {
        expect(syringeScale(100, 134)).toEqual({ step: 5, major: 10, label: 20 });
        expect(syringeScale(50, 134)).toEqual({ step: 2, major: 10, label: 10 });
        expect(syringeScale(30, 134)).toEqual({ step: 1, major: 5, label: 10 });
    });
    it('never packs ticks or labels tighter than their minimum gap', () => {
        for (const cap of [30, 50, 100]) {
            for (const len of [120, 134, 200, 300, 440]) {
                const { step, major, label } = syringeScale(cap, len);
                expect((step / cap) * len >= MIN_TICK_GAP || step === major).toBe(true);
                expect((label / cap) * len >= MIN_LABEL_GAP || label === cap).toBe(true);
                expect(major % step).toBe(0);
                expect(label % major).toBe(0);
                expect(cap % label).toBe(0);
            }
        }
    });
});
