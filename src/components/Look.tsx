import { Icon } from './Icon';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { DYES, deep, readable } from '../lib/dye';

type Theme = 'system' | 'light' | 'dark';
interface LookState { theme: Theme; dye: string }
const THEMES: [Theme, string][] = [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']];
const COBALT: string = DYES[0].hex;
const THEME_KEY = 'pl-theme';
const DYE_KEY = 'pl-dye';

function stored(): LookState {
  let t: string | null = null;
  let d: string | null = null;
  try { t = localStorage.getItem(THEME_KEY); d = localStorage.getItem(DYE_KEY); } catch { /* storage blocked */ }
  return { theme: t === 'light' || t === 'dark' ? t : 'system', dye: d && /^#[0-9a-f]{6}$/i.test(d) ? readable(d) : COBALT };
}

/** Puts a look on the page. Cobalt is the stylesheet's own color, so choosing it removes the override. */
function paint({ theme, dye }: LookState) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  if (dye === COBALT) { root.removeAttribute('data-dye'); root.style.removeProperty('--dye'); }
  else { root.setAttribute('data-dye', ''); root.style.setProperty('--dye', dye); }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', deep(dye)); // the browser's own toolbar meets the top bar
}

// Painted before the first render, so a saved look doesn't flash cobalt.
const first = stored();
paint(first);

/** The drop in the top bar: a small panel for the theme (Auto follows the device) and the color of the field. */
export function Look() {
  const [look, setLook] = useState(first);
  const change = (next: Partial<LookState>, from?: Element) => {
    const to = { ...look, ...next };
    try {
      localStorage.setItem(THEME_KEY, to.theme);
      if (to.dye === COBALT) localStorage.removeItem(DYE_KEY);
      else localStorage.setItem(DYE_KEY, to.dye);
    } catch { /* storage blocked */ }
    const set = () => { paint(to); flushSync(() => setLook(to)); };
    // Where the browser supports it, the new look spreads from the control that was tapped (see "Changing the look" in styles.css).
    if (!from || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return set();
    const b = from.getBoundingClientRect();
    const x = b.left + b.width / 2;
    const y = b.top + b.height / 2;
    const s = document.documentElement.style;
    s.setProperty('--dx', `${x}px`);
    s.setProperty('--dy', `${y}px`);
    s.setProperty('--dr', `${Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))}px`); // reach of the farthest corner
    try { document.startViewTransition({ update: set, types: ['look'] }); } catch { set(); } // older engines take only a callback
  };
  const ready = DYES.find(d => d.hex === look.dye);
  return (
    <>
      <button className="icon-btn" popoverTarget="look" aria-label="Appearance: theme and color" title="Appearance">
        <Icon name="look" size={22} />
      </button>
      <div id="look" className="look" popover="auto" role="dialog" aria-label="Appearance">
        <span className="label">Theme</span>
        <div className="seg" role="group" aria-label="Theme">
          {THEMES.map(([t, name]) => (
            <button key={t} type="button" aria-pressed={look.theme === t} onClick={e => change({ theme: t }, e.currentTarget)}>{name}</button>
          ))}
        </div>
        <div className="spread"><span className="label">Color</span><span className="small muted">{ready?.name ?? 'Your own'}</span></div>
        <div className="dyes" role="group" aria-label="Color">
          {DYES.map(d => (
            <button key={d.hex} type="button" style={{ ['--c' as string]: d.hex }} aria-pressed={look.dye === d.hex} aria-label={d.name} title={d.name} onClick={e => change({ dye: d.hex }, e.currentTarget)} />
          ))}
          {/* Any color: the device's own picker. The pick is darkened until white text on it is readable. */}
          <label className="own" title="Your own color" data-on={ready ? undefined : ''} style={ready ? undefined : { ['--c' as string]: look.dye }}>
            <input type="color" defaultValue={ready ? COBALT : look.dye} aria-label="Your own color" onChange={e => change({ dye: readable(e.target.value) })} />
          </label>
        </div>
      </div>
    </>
  );
}
