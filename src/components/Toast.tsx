import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { EXIT_MS, prefersReducedMotion } from './Motion';

const ToastCtx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; id: number; out?: boolean } | null>(null);
  const show = useCallback((text: string) => {
    const id = Date.now();
    setMsg({ text, id });
    // Fade out first, then unmount; with reduced motion it just goes at 3.2s.
    const exit = prefersReducedMotion() ? 0 : EXIT_MS;
    if (exit) setTimeout(() => setMsg(m => (m?.id === id ? { ...m, out: true } : m)), 3200 - exit);
    setTimeout(() => setMsg(m => (m?.id === id ? null : m)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div className="toast" role="status" key={msg.id} data-out={msg.out || undefined}>
          {msg.text}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
