import { useRef, type ReactNode } from 'react';

interface DPadProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  accentColor?: string;
  center?: ReactNode;
}

const btnBase =
  'bg-gray-700 active:bg-gray-500 text-white flex items-center justify-center rounded-lg transition-colors select-none touch-none';

const Arrow = ({ d }: { d: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const DPad = ({ onUp, onDown, onLeft, onRight, accentColor, center }: DPadProps) => {
  const touchedRef = useRef(false);

  const handle = (fn: () => void) => ({
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); touchedRef.current = true; fn(); },
    onMouseDown: () => { if (!touchedRef.current) fn(); },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const glowStyle = accentColor
    ? { boxShadow: `0 0 12px ${accentColor}40` }
    : undefined;

  return (
    <div className="grid grid-cols-3 gap-1.5 mt-6" role="group" aria-label="Direction controls">
      <div />
      <button className={`${btnBase} w-[60px] h-[60px]`} style={glowStyle} {...handle(onUp)} aria-label="Up">
        <Arrow d="M12 19V5M5 12l7-7 7 7" />
      </button>
      <div />

      <button className={`${btnBase} w-[60px] h-[60px]`} style={glowStyle} {...handle(onLeft)} aria-label="Left">
        <Arrow d="M19 12H5M12 5l-7 7 7 7" />
      </button>
      <div className="w-[60px] h-[60px] flex items-center justify-center">
        {center}
      </div>
      <button className={`${btnBase} w-[60px] h-[60px]`} style={glowStyle} {...handle(onRight)} aria-label="Right">
        <Arrow d="M5 12h14M12 5l7 7-7 7" />
      </button>

      <div />
      <button className={`${btnBase} w-[60px] h-[60px]`} style={glowStyle} {...handle(onDown)} aria-label="Down">
        <Arrow d="M12 5v14M5 12l7 7 7-7" />
      </button>
      <div />
    </div>
  );
};

export default DPad;
