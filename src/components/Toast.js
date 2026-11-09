import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useState } from 'react';
import { exitMs, prefersReducedMotion } from './Motion';
const ToastCtx = createContext(() => { });
export function ToastProvider({ children }) {
    const [msg, setMsg] = useState(null);
    const show = useCallback((text) => {
        const id = Date.now();
        setMsg({ text, id });
        // Fade out first, then unmount; with reduced motion it just goes at 3.2s.
        const exit = prefersReducedMotion() ? 0 : exitMs();
        if (exit)
            setTimeout(() => setMsg(m => (m?.id === id ? { ...m, out: true } : m)), 3200 - exit);
        setTimeout(() => setMsg(m => (m?.id === id ? null : m)), 3200);
    }, []);
    return (_jsxs(ToastCtx.Provider, { value: show, children: [children, _jsx("div", { role: "status", children: msg && (_jsx("div", { className: "toast", "data-out": msg.out || undefined, children: msg.text }, msg.id)) })] }));
}
export const useToast = () => useContext(ToastCtx);
