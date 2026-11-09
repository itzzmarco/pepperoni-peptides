import { useEffect, useState } from 'react';
import { exitMs, prefersReducedMotion } from './Motion';

type Theme = 'system' | 'light' | 'dark';
const KEY = 'pl-theme';
const LABEL: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };
const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
let fadeTimer: ReturnType<typeof setTimeout> | undefined;

export function storedTheme(): Theme {
  try { return (localStorage.getItem(KEY) as Theme) || 'system'; } catch { return 'system'; }
}

/** Sets the theme on the page and paints the browser chrome (theme-color) with the active --bg, so the bar around
 *  the app matches it in every mode. main.tsx calls it before the first render, so a chosen theme never flashes. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  if (bg) document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', bg));
}
// In Auto the device can switch scheme while the app is open; the chrome follows.
if (typeof matchMedia === 'function') matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(storedTheme()));

/** Cycles Auto → Light → Dark. Auto follows the device setting via prefers-color-scheme. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(storedTheme);
  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(KEY, theme); } catch { /* storage blocked */ }
  }, [theme]);
  // A change of theme fades the colours over one --dur-med (styles.css, :root[data-theming]); reduced motion snaps.
  const change = () => {
    if (!prefersReducedMotion()) {
      const root = document.documentElement;
      root.dataset.theming = '';
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => delete root.dataset.theming, exitMs() + 60);
    }
    setTheme(NEXT[theme]);
  };
  // Each mode has its own picture (sun, moon, half disc for Auto) and, where the bar has room, its name, so the
  // current mode reads at a glance on touch screens too, not only from a tooltip.
  return (
    <button className="icon-btn theme" onClick={change} aria-label={`Theme: ${LABEL[theme]}. Change theme`} title={`Theme: ${LABEL[theme]}`}>
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        {theme === 'light' && <><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" /></>}
        {theme === 'dark' && <path d="M13.5 9.6A5.75 5.75 0 1 1 6.4 2.5a4.6 4.6 0 0 0 7.1 7.1z" fill="currentColor" />}
        {theme === 'system' && <><circle cx="8" cy="8" r="6.25" /><path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" stroke="none" /></>}
      </svg>
      <span className="theme-word" aria-hidden="true">{LABEL[theme]}</span>
    </button>
  );
}
