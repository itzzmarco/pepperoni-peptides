/** Controls a modal dialog keeps Tab inside: enabled form controls, links, and anything opted into the tab order. */
export const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
/**
 * Where Tab should go inside a dialog with `count` focusable controls when focus is at `index`
 * (-1 when it is on the dialog itself or outside it). `back` is Shift+Tab.
 * Returns the index to focus to wrap around, or null to let the browser move focus normally.
 */
export function trapTarget(count, index, back) {
    if (count === 0)
        return null;
    if (back)
        return index <= 0 ? count - 1 : null;
    return index === -1 || index === count - 1 ? 0 : null;
}
