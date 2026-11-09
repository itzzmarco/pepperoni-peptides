import { describe, expect, it } from 'vitest';
import { trapTarget } from '../focusTrap';

describe('trapTarget', () => {
  it('wraps Tab from the last control to the first', () => {
    expect(trapTarget(4, 3, false)).toBe(0);
  });
  it('wraps Shift+Tab from the first control to the last', () => {
    expect(trapTarget(4, 0, true)).toBe(3);
  });
  it('pulls focus on the dialog itself (or outside it) into the dialog', () => {
    expect(trapTarget(4, -1, false)).toBe(0);
    expect(trapTarget(4, -1, true)).toBe(3);
  });
  it('leaves moves between inner controls to the browser', () => {
    expect(trapTarget(4, 1, false)).toBeNull();
    expect(trapTarget(4, 2, true)).toBeNull();
  });
  it('has nothing to cycle with no controls', () => {
    expect(trapTarget(0, -1, false)).toBeNull();
  });
});
