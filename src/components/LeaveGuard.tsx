import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Dismissing a changed form (Escape, a scrim tap, a drag, the close button, Cancel) first asks in the footer:
 * Keep editing, or Discard and leave. Further dismissals keep the question up (focus returns to Keep editing), so only
 * the explicit Discard and leave loses what was entered; any new edit takes the question away.
 * `ask(go)` puts the same question in front of any other action that would drop the form, such as a link away.
 * `snapshot` is the form's values as one string; the form counts as changed once it differs from the first one.
 * `from` is the first snapshot of a form being reopened with its edits (so they still count as changes); `start` hands it on.
 * `close` keeps one identity for the sheet's life, since Sheet re-focuses itself whenever onClose changes.
 */
export function useLeaveGuard(snapshot: string, onClose: () => void, from?: string) {
  const [start] = useState(from ?? snapshot);
  const dirty = useRef(false);
  dirty.current = snapshot !== start;
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  leavingRef.current = leaving;
  const keep = useRef<HTMLButtonElement>(null);
  // What "Discard and leave" does: close the sheet, or the in-sheet action (a link away, a swap to another sheet) that asked.
  const next = useRef(onClose);
  const ask = useCallback((go: () => void) => {
    if (!dirty.current) { go(); return; }
    if (leavingRef.current) { keep.current?.focus(); return; }
    next.current = go;
    setLeaving(true);
  }, []);
  const close = useCallback(() => ask(onClose), [ask, onClose]);
  useEffect(() => { setLeaving(false); }, [snapshot]);
  useEffect(() => { if (leaving) keep.current?.focus(); }, [leaving]);
  return { start, close, ask, leaving, stay: () => setLeaving(false), keep, leave: () => next.current() };
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
          <button type="button" className="btn danger" onClick={g.leave}>Discard and leave</button>
        </>
      ) : children}
    </div>
  );
}
