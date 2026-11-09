import { describe, expect, it } from 'vitest';
import { placeLabels } from '../trackLabels';
describe('placeLabels', () => {
    it('centres a label on its mark', () => {
        expect(placeLabels([100], 300, 48, 36).lefts).toEqual([76]);
    });
    it('keeps an early label inside the left edge and a late one inside the right edge', () => {
        expect(placeLabels([4], 300, 48, 36).lefts).toEqual([0]);
        expect(placeLabels([298], 300, 48, 36).lefts).toEqual([252]);
    });
    it('drops a label that would sit closer than one label width to the previous one', () => {
        const { lefts } = placeLabels([60, 110, 170], 300, 48, 36);
        expect(lefts).toEqual([36, null, 146]);
        // Every kept pair leaves a gap at least one slot wide.
        expect(146 - 36 - 48).toBeGreaterThanOrEqual(48);
    });
    it('hides the pinned end label when a late time would run into it', () => {
        expect(placeLabels([60], 300, 48, 36).showEnd).toBe(true);
        expect(placeLabels([250], 300, 48, 36).showEnd).toBe(false);
    });
    it('shows only the end label with no marks', () => {
        expect(placeLabels([], 248, 48, 36)).toEqual({ lefts: [], showEnd: true });
    });
});
