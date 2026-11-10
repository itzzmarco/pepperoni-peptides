import type { ReactNode } from 'react';

/** The field at the top of a screen: headline, the screen's live graphic, and a wave along its lower edge. */
export function Mast({ children }: { children: ReactNode }) {
  return (
    <header className="mast">
      {children}
      <span className="wave" aria-hidden="true"><i /><i /></span>
    </header>
  );
}

/** A headline that rises word by word. It replays when its text changes, so a new status reads as news. */
export function Kinetic({ a, b }: { a: string; b?: string }) {
  let i = 0;
  const words = (s: string, soft?: boolean) => s.split(' ').map((w, k) => (
    <span key={k}><span className="kw"><span className={soft ? 'soft' : undefined} style={{ ['--i' as string]: i++ }}>{w}</span></span>{' '}</span>
  ));
  return (
    <h1 className="kin" key={`${a}|${b}`}>
      {words(a)}
      {b && <><br />{words(b, true)}</>}
    </h1>
  );
}

export const BackToLearn = () => (
  <div className="head-actions">
    <a className="btn ghost sm" href="#learn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      Learn
    </a>
  </div>
);
