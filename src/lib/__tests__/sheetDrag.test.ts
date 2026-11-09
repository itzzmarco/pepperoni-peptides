import { describe, expect, it } from 'vitest';
import { DISMISS_DISTANCE, dragOffset, shouldDismiss } from '../sheetDrag';

describe('dragOffset', () => {
  it('follows a downward drag', () => {
    expect(dragOffset(200, 260)).toBe(60);
  });

  it('never pulls the sheet above where it opened', () => {
    expect(dragOffset(200, 150)).toBe(0);
  });
});

describe('shouldDismiss', () => {
  it('closes after a drag past 100px', () => {
    expect(shouldDismiss(DISMISS_DISTANCE + 1, 0)).toBe(true);
    expect(shouldDismiss(180, 0.1)).toBe(true);
  });

  it('springs back after a short, slow drag', () => {
    expect(shouldDismiss(DISMISS_DISTANCE, 0)).toBe(false);
    expect(shouldDismiss(60, 0.2)).toBe(false);
  });

  it('closes on a fast downward flick', () => {
    expect(shouldDismiss(40, 0.9)).toBe(true);
  });

  it('ignores a fast twitch that barely moved, or an upward flick', () => {
    expect(shouldDismiss(5, 2)).toBe(false);
    expect(shouldDismiss(40, -1)).toBe(false);
  });
});
