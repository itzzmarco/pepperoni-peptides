import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { exitMs, prefersReducedMotion } from './Motion';

const ToastCtx = createContext<(msg: string) => void>(() => {});

type Msg = { text: string; id: number; out?: boolean; wait?: boolean };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const seq = useRef(0);
  // Mirrors what is on screen, so show() knows at call time whether its toast has to wait for one to leave.
  const shown = useRef(msgs);
  shown.current = msgs;
  const show = useCallback((text: string) => {
    const id = ++seq.current;
    // A toast still showing fades out first, and the new one rises into the spot they share only once it has gone
    // (`wait` delays its entrance by one --dur-med), so the two never overlap. Its 3.2s on screen counts from the end
    // of that wait, so a replacement stays up as long as a toast that arrives alone.
    const exit = prefersReducedMotion() ? 0 : exitMs();
    const wait = exit > 0 && shown.current.length > 0;
    shown.current = [...shown.current, { text, id }];
    const end = 3200 + (wait ? exit : 0);
    setMsgs(ms => [...(exit ? ms.map(m => ({ ...m, out: true })) : []), { text, id, wait }]);
    if (exit) setTimeout(() => setMsgs(ms => ms.filter(m => m.id >= id)), exit);
    // Fade out first, then unmount; with reduced motion it just goes at 3.2s.
    if (exit) setTimeout(() => setMsgs(ms => ms.map(m => (m.id === id ? { ...m, out: true } : m))), end - exit);
    setTimeout(() => setMsgs(ms => ms.filter(m => m.id !== id)), end);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {/* One live region stays mounted (empty between toasts), so each message is announced as it is added;
          only the pills inside it are keyed, so each plays its own enter and exit. */}
      <div role="status">
        {msgs.map(m => (
          <div className="toast" key={m.id} data-wait={m.wait || undefined} data-out={m.out || undefined} aria-hidden={m.out || undefined}>
            {m.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
