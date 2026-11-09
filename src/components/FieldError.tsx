import { useEffect, useState } from 'react';

/**
 * A rejected save names the field at fault: its error shows right under it, the field is marked invalid, and focus
 * moves there so the message is on screen even with the sheet's pinned Save row far below. `errId` is the message's id.
 */
export function useFieldError(errId: string) {
  const [err, setErr] = useState<{ at: string; msg: string } | null>(null);
  useEffect(() => {
    if (!err) return;
    const el = document.getElementById(err.at);
    const target = el?.matches('input, select, textarea, button') ? el : el?.querySelector<HTMLElement>('button');
    target?.scrollIntoView({ block: 'center' });
    target?.focus({ preventScroll: true });
  }, [err]);
  const errFor = (at: string) => err?.at === at ? <p id={errId} className="small field-err" role="alert">{err.msg}</p> : null;
  const invalid = (at: string) => err?.at === at ? { 'aria-invalid': true, 'aria-describedby': errId } : {};
  const fail = (at: string, msg: string) => setErr({ at, msg });
  return { err, fail, errFor, invalid };
}
