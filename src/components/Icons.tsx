import type { ReactNode } from 'react';

/** Stroke icons on a 24px grid. Decorative: pair each with visible text or an aria-label on its button. */
function Icon({ size = 20, width = 2, children }: { size?: number; width?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="icon">
      {children}
    </svg>
  );
}

type P = { size?: number };

export const LogIcon = ({ size }: P) => (
  <Icon size={size} width={1.9}><path d="M8 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2" /><rect x="8" y="2.5" width="8" height="3.5" rx="1" /><path d="M8.5 13l2.5 2.5 4.5-5" /></Icon>
);
export const BookIcon = ({ size }: P) => (
  <Icon size={size} width={1.9}><path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h6v16H5a1.5 1.5 0 0 1-1.5-1.5z" /><path d="M20.5 5.5A1.5 1.5 0 0 0 19 4h-6v16h6a1.5 1.5 0 0 0 1.5-1.5z" /></Icon>
);
export const SyringeIcon = ({ size }: P) => (
  <Icon size={size} width={1.9}><path d="M17.5 2.5l4 4" /><path d="M19.5 4.5L16 8" /><path d="M14 6l4 4-9 9H5v-4z" /><path d="M5 19l-2.5 2.5" /><path d="M11 9l1.5 1.5M8.5 11.5L10 13" /></Icon>
);
export const ShieldIcon = ({ size }: P) => (
  <Icon size={size} width={1.9}><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" /><path d="M12 9v6M9 12h6" /></Icon>
);
export const PhoneIcon = ({ size = 16 }: P) => (
  <Icon size={size}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></Icon>
);
export const LockIcon = ({ size = 12 }: P) => (
  <Icon size={size} width={2.2}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
);
export const CheckIcon = ({ size = 18 }: P) => (
  <Icon size={size} width={2.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>
);
export const PlusIcon = ({ size = 18 }: P) => (
  <Icon size={size} width={2.2}><path d="M12 5v14M5 12h14" /></Icon>
);
export const ChevronIcon = ({ size = 18 }: P) => (
  <Icon size={size}><path d="M9 6l6 6-6 6" /></Icon>
);
export const DownIcon = ({ size = 16 }: P) => (
  <Icon size={size}><path d="M7 10l5 5 5-5" /></Icon>
);
export const BackIcon = ({ size = 20 }: P) => (
  <Icon size={size}><path d="M15 6l-6 6 6 6" /></Icon>
);
export const CloseIcon = ({ size = 18 }: P) => (
  <Icon size={size} width={2.2}><path d="M6 6l12 12M18 6L6 18" /></Icon>
);
export const SearchIcon = ({ size = 18 }: P) => (
  <Icon size={size}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Icon>
);
export const AlertIcon = ({ size = 20 }: P) => (
  <Icon size={size}><path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4.5M12 17.2v.3" /></Icon>
);
export const TargetIcon = ({ size = 16 }: P) => (
  <Icon size={size}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></Icon>
);
