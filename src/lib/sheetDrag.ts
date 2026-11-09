/** How far (px) a phone sheet must be dragged down by its grabber before letting go closes it. */
export const DISMISS_DISTANCE = 100;
/** A downward flick faster than this (px per ms) closes the sheet even when the drag was short. */
export const DISMISS_VELOCITY = 0.5;
/** Ignore tiny jitters: a flick only counts once the sheet has moved at least this far. */
const MIN_FLICK = 16;

/** Pointer travel to sheet offset: the sheet follows a downward drag and never moves above where it opened. */
export const dragOffset = (startY: number, y: number) => Math.max(0, y - startY);

/** Whether releasing the grabber at `dy` px down, moving at `velocity` px/ms (positive = down), should close the sheet. */
export function shouldDismiss(dy: number, velocity: number) {
  if (dy > DISMISS_DISTANCE) return true;
  return dy >= MIN_FLICK && velocity > DISMISS_VELOCITY;
}
