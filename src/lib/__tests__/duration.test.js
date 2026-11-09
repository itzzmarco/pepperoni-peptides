import { describe, expect, it } from 'vitest';
import { cssMs } from '../duration';
describe('cssMs', () => {
    it('reads milliseconds and seconds, with the spaces a custom property keeps', () => {
        expect(cssMs('240ms', 0)).toBe(240);
        expect(cssMs(' 240ms', 0)).toBe(240);
        expect(cssMs('0.3s', 0)).toBe(300);
        expect(cssMs('.2S', 0)).toBe(200);
    });
    it('falls back when the token is missing or not a time', () => {
        expect(cssMs('', 240)).toBe(240);
        expect(cssMs('fast', 240)).toBe(240);
        expect(cssMs('240', 240)).toBe(240);
        expect(cssMs('-10ms', 240)).toBe(240);
    });
});
