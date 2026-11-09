import { createContext, useContext, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { dragOffset, releaseVelocity, shouldDismiss } from '../lib/sheetDrag';
import { FOCUSABLE, trapTarget } from '../lib/focusTrap';

/** True while App keeps a closed sheet mounted so its exit animation can play. */
export const SheetClosing = createContext(false);

/** The page control that opened the current chain of sheets, so focus goes back there, not to a removed sheet. */
let pageOpener: HTMLElement | null = null;

/**
 * Bottom sheet on phones, centered dialog on wider screens. Escape or a scrim tap closes it.
 * On phones, dragging the grabber down far or fast enough closes it too.
 */
export function Sheet({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closing = useContext(SheetClosing);
  // Whatever had focus when the sheet opened, captured once so re-runs of the effect below don't lose it.
  // Opened from inside another sheet (one sheet swapping to the next), keep that sheet's page opener instead.
  const [opener] = useState(() => {
    if (typeof document === 'undefined') return null;
    const a = document.activeElement as HTMLElement | null;
    pageOpener = a?.closest('.scrim') ? pageOpener : a;
    return pageOpener;
  });
  useEffect(() => {
    // Once the exit starts, hand focus and scrolling back to the page right away.
    if (closing) return;
    const prev = opener;
    // Focus the dialog itself rather than a field, so phones don't pop the keyboard over the form.
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !ref.current) return;
      // Keep Tab and Shift+Tab inside the dialog: past the last control it wraps to the first, and back.
      const els = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.getClientRects().length > 0);
      if (!els.length) { e.preventDefault(); return; }
      const to = trapTarget(els.length, els.indexOf(document.activeElement as HTMLElement), e.shiftKey);
      if (to != null) { e.preventDefault(); els[to].focus(); }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose, closing, opener]);

  // Grabber drag: the sheet follows the finger; letting go either closes it or springs it back.
  const drag = useRef<{ y0: number; y: number; t: number; v: number } | null>(null);
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (closing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // The entrance animation owns transform while it runs; end it so the finger moves the sheet from the first frame.
    // A cancelled CSS animation stays off until the name changes, which the exit (sheet-down) does.
    ref.current?.getAnimations?.().forEach(a => a.cancel());
    drag.current = { y0: e.clientY, y: e.clientY, t: e.timeStamp, v: 0 };
    ref.current?.setAttribute('data-dragging', '');
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !ref.current) return;
    const dt = e.timeStamp - d.t;
    if (dt > 0) d.v = (e.clientY - d.y) / dt;
    d.y = e.clientY; d.t = e.timeStamp;
    ref.current.style.transform = `translateY(${dragOffset(d.y0, d.y)}px)`;
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current, el = ref.current;
    drag.current = null;
    if (!d || !el) return;
    el.removeAttribute('data-dragging');
    // Closing keeps the dragged offset, so the exit slides on from where the finger let go.
    if (shouldDismiss(dragOffset(d.y0, d.y), releaseVelocity(d.v, e.timeStamp - d.t))) onClose();
    else el.style.transform = '';
  };

  return (
    // A closing sheet is inert as well as click-through, so neither pointer nor keyboard can land in it on its way out.
    <div className="scrim" data-closing={closing || undefined} inert={closing || undefined} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} ref={ref} tabIndex={-1}>
        <div className="grabber" aria-hidden="true" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}><i /></div>
        {children}
      </div>
    </div>
  );
}
