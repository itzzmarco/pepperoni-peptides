import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Dismissing a changed form (Escape, a scrim tap, a drag, the close button, Cancel) first asks in the footer:
 * Keep editing, or Discard and leave. A second dismiss leaves; any new edit takes the question away.
 * `snapshot` is the form's values as one string; the form counts as changed once it differs from the first one.
 * `close` keeps one identity for the sheet's life, since Sheet re-focuses itself whenever onClose changes.
 */
export function useLeaveGuard(snapshot: string, onClose: () => void) {
  const [start] = useState(snapshot);
  const dirty = useRef(false);
  dirty.current = snapshot !== start;
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  leavingRef.current = leaving;
  const keep = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    if (dirty.current && !leavingRef.current) { setLeaving(true); return; }
    onClose();
  }, [onClose]);
  useEffect(() => { setLeaving(false); }, [snapshot]);
  useEffect(() => { if (leaving) keep.current?.focus(); }, [leaving]);
  return { close, leaving, stay: () => setLeaving(false), keep, onClose };
}

/** The footer of a guarded sheet: its own buttons, or the leave question in their place. */
export function LeaveFoot({ guard: g, children }: { guard: ReturnType<typeof useLeaveGuard>; children: ReactNode }) {
  return (
    <div className="sheet-foot">
      <p className="sr-only" role="status">{g.leaving ? 'Leave without saving? Your changes to this form will be lost.' : ''}</p>
      {g.leaving ? (
        <>
          <p className="small ask" aria-hidden="true"><b>Leave without saving?</b> Your changes to this form will be lost.</p>
          <button ref={g.keep} type="button" className="btn ghost" onClick={g.stay}>Keep editing</button>
          <button type="button" className="btn danger" onClick={g.onClose}>Discard and leave</button>
        </>
      ) : children}
    </div>
  );
}
