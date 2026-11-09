/** Smallest gap between two minor ticks, in px, before they blur into one grey band. */
export const MIN_TICK_GAP = 4;
/** Smallest gap between two unit labels, in px, so "100" never touches its neighbour at 12px mono. */
export const MIN_LABEL_GAP = 26;
/**
 * Tick and label spacing for a U-100 syringe of `cap` units drawn `len` px long.
 * Majors stay at 5 (30-unit syringes) or 10 units; minor ticks and labels thin out on narrow screens
 * so each stays readable, and labels always land on a major tick and on the full mark.
 */
export function syringeScale(cap, len) {
    const major = cap <= 30 ? 5 : 10;
    const px = (u) => (u / cap) * len;
    const step = [1, 2, 5, major].find(s => major % s === 0 && px(s) >= MIN_TICK_GAP) ?? major;
    let label = major;
    for (let k = 1; k * major <= cap; k++) {
        label = k * major;
        if (cap % label === 0 && px(label) >= MIN_LABEL_GAP)
            break;
    }
    return { step, major, label };
}
