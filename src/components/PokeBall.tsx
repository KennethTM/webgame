interface PokeBallProps {
  size?: number;
  variant?: 'standard' | 'great' | 'ultra' | 'master';
  spinning?: boolean;
  className?: string;
}

const COLORS = {
  standard: { top: '#EE1515', band: '#222' },
  great: { top: '#3B82F6', band: '#222' },
  ultra: { top: '#FBBF24', band: '#222' },
  master: { top: '#7C3AED', band: '#222' },
};

const PokeBall = ({ size = 40, variant = 'standard', spinning = false, className = '' }: PokeBallProps) => {
  const c = COLORS[variant];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${spinning ? 'animate-spin' : ''} ${className}`}
    >
      {/* Top half */}
      <path d="M 50 5 A 45 45 0 0 1 95 50 L 5 50 A 45 45 0 0 1 50 5 Z" fill={c.top} />
      {/* Bottom half */}
      <path d="M 5 50 A 45 45 0 0 0 95 50 L 5 50 Z" fill="#fff" />
      {/* Center band */}
      <rect x="5" y="46" width="90" height="8" rx="2" fill={c.band} />
      {/* Center button */}
      <circle cx="50" cy="50" r="12" fill={c.band} />
      <circle cx="50" cy="50" r="8" fill="#fff" />
      <circle cx="50" cy="50" r="4" fill={c.band} />
      {/* Shine */}
      <ellipse cx="35" cy="30" rx="10" ry="6" fill="rgba(255,255,255,0.3)" transform="rotate(-30 35 30)" />
    </svg>
  );
};

export default PokeBall;
