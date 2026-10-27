import { useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';
const KEY = 'pl-theme';
const LABEL: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };
const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };

/** Cycles Auto → Light → Dark. Auto follows the device setting via prefers-color-scheme. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem(KEY) as Theme) || 'system'; } catch { return 'system'; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch { /* storage blocked */ }
  }, [theme]);
  return (
    <button className="icon-btn" onClick={() => setTheme(NEXT[theme])} aria-label={`Theme: ${LABEL[theme]}. Change theme`} title={`Theme: ${LABEL[theme]}`}>
      <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {theme !== 'light' && <path d={theme === 'dark' ? 'M8 1.75a6.25 6.25 0 0 1 0 12.5 4.5 4.5 0 0 1 0-12.5z' : 'M8 1.75a6.25 6.25 0 0 1 0 12.5z'} fill="currentColor" />}
      </svg>
    </button>
  );
}
