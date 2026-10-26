export const DAY = 864e5;

const pad = (n: number) => String(n).padStart(2, '0');

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toLocalInput = (d: Date) => `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);

export const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
export const fmtShort = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const fmtNum = (n: number, max = 2) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: max }) : '–';

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
