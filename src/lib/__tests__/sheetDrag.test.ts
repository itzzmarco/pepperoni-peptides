import { describe, expect, it } from 'vitest';
import { DISMISS_DISTANCE, FLICK_STALE_MS, dragOffset, releaseVelocity, shouldDismiss } from '../sheetDrag';

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

describe('releaseVelocity', () => {
  it('keeps the speed of a flick released mid-motion', () => {
    expect(releaseVelocity(0.9, 16)).toBe(0.9);
  });

  it('drops the speed once the finger has held still', () => {
    expect(releaseVelocity(0.9, FLICK_STALE_MS + 1)).toBe(0);
    // A short fast drag, then a pause, springs back instead of closing.
    expect(shouldDismiss(40, releaseVelocity(0.9, 300))).toBe(false);
  });
});
