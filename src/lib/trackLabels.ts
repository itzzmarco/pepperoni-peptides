/**
 * Places time labels under marks on a horizontal track `width` px wide. Each label is a `slot` px box,
 * centred on its mark but clamped inside the track, and a label is only kept when it leaves a gap at least
 * one slot wide after the previous kept label, so neighbouring times never touch. `endSlot` is the width of
 * the pinned label at the right end: it shows only when the last time label leaves the same gap before it.
 */
export function placeLabels(xs: number[], width: number, slot: number, endSlot: number) {
  const max = Math.max(0, width - slot);
  let last = -Infinity;
  const lefts = xs.map(x => {
    const left = Math.min(max, Math.max(0, x - slot / 2));
    if (left - last < slot * 2) return null;
    last = left;
    return left;
  });
  const showEnd = last + slot * 2 <= width - endSlot;
  return { lefts, showEnd };
}

/**
 * Where the day track starts, in minutes after midnight: 6 AM, or the start of the hour of anything earlier (a dose or
 * now), so overnight doses get their own spots and the Now pin shows. The track always ends at midnight.
 */
export function trackStart(times: Date[]) {
  const mins = times.map(d => d.getHours() * 60 + d.getMinutes());
  return Math.floor(Math.min(6 * 60, ...mins) / 60) * 60;
}
