import { createContext, useContext, useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { dragOffset, shouldDismiss } from '../lib/sheetDrag';

/** True while App keeps a closed sheet mounted so its exit animation can play. */
export const SheetClosing = createContext(false);

/**
 * Bottom sheet on phones, centered dialog on wider screens. Escape or a scrim tap closes it.
 * On phones, dragging the grabber down far or fast enough closes it too.
 */
export function Sheet({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closing = useContext(SheetClosing);
  // Whatever had focus when the sheet opened, captured once so re-runs of the effect below don't lose it.
  const opener = useRef(typeof document === 'undefined' ? null : document.activeElement as HTMLElement | null);
  useEffect(() => {
    // Once the exit starts, hand focus and scrolling back to the page right away.
    if (closing) return;
    const prev = opener.current;
    // Focus the dialog itself rather than a field, so phones don't pop the keyboard over the form.
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose, closing]);

  // Grabber drag: the sheet follows the finger; letting go either closes it or springs it back.
  const drag = useRef<{ y0: number; y: number; t: number; v: number } | null>(null);
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (closing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
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
  const onUp = () => {
    const d = drag.current, el = ref.current;
    drag.current = null;
    if (!d || !el) return;
    el.removeAttribute('data-dragging');
    // Closing keeps the dragged offset, so the exit slides on from where the finger let go.
    if (shouldDismiss(dragOffset(d.y0, d.y), d.v)) onClose();
    else el.style.transform = '';
  };

  return (
    <div className="scrim" data-closing={closing || undefined} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} ref={ref} tabIndex={-1}>
        <div className="grabber" aria-hidden="true" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}><i /></div>
        {children}
      </div>
    </div>
  );
}
