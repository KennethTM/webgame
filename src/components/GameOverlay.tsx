import { useMemo } from 'react';
import SpriteImage from './SpriteImage';
import PokeBall from './PokeBall';

interface GameOverlayProps {
  variant: 'idle' | 'game-over' | 'victory';
  title: string;
  subtitle?: string;
  pokemonId?: number;
  score?: number;
  stars?: number; // 0-3
  onAction: () => void;
  actionLabel?: string;
}

const Star = ({ filled }: { filled: boolean }) => (
  <span className={`text-2xl ${filled ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]' : 'text-gray-500 opacity-40'}`}>
    ★
  </span>
);

const ENCOURAGEMENTS = [
  'En god træner giver aldrig op!',
  'Enhver Pokémon-mester startede her!',
  'Prøv igen, træner!',
  'Du kan godt!',
  'Professor Oak tror på dig!',
  'Bliv ved med at træne!',
];

const GameOverlay = ({
  variant,
  title,
  subtitle,
  pokemonId,
  score,
  stars,
  onAction,
  actionLabel,
}: GameOverlayProps) => {
  const isVictory = variant === 'victory';
  const isGameOver = variant === 'game-over';
  const isIdle = variant === 'idle';

  // Pick a stable encouragement message for game-over
  const encouragement = useMemo(
    () => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variant],
  );

  // Pre-compute confetti positions to avoid impure calls during render
  const confetti = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        left: `${(((i * 37 + 13) % 100))}%`,
        backgroundColor: ['#FFDE00', '#EE1515', '#3B4CCA', '#78C850', '#FF6B6B', '#7C3AED'][i % 6],
        animationDelay: `${(i * 0.07) % 2}s`,
        animationDuration: `${2 + ((i * 0.13) % 2)}s`,
      })),
    [],
  );

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6
        ${isGameOver ? 'bg-red-900/80' : isVictory ? 'bg-black/70' : 'bg-black/40'}
      `}
    >
      {/* Confetti for victory */}
      {isVictory && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {confetti.map((c, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti-fall"
              style={c}
            />
          ))}
        </div>
      )}

      {/* Pokemon sprite */}
      {pokemonId && (
        <div className={`mb-2 ${isGameOver ? 'grayscale opacity-60' : ''}`}>
          <SpriteImage pokemonId={pokemonId} size={isIdle ? 100 : 72} />
        </div>
      )}

      {/* Title */}
      <h2 className={`font-pixel text-lg mb-1 ${isGameOver ? 'text-red-300' : 'text-white'}`}>
        {title}
      </h2>

      {/* Subtitle or score line */}
      {(subtitle || score !== undefined) && (
        <p className="text-white/80 mb-1 text-base">
          {subtitle}{score !== undefined && !subtitle ? <span className="text-pokemon-yellow font-bold">{score}</span> : null}
        </p>
      )}

      {/* Encouragement for game-over */}
      {isGameOver && (
        <p className="text-white/60 text-xs mb-1 italic">{encouragement}</p>
      )}

      {/* Stars */}
      {stars !== undefined && (
        <div className="flex gap-1 mb-2">
          {[1, 2, 3].map(n => <Star key={n} filled={n <= stars} />)}
        </div>
      )}

      {/* Action button */}
      <button
        onClick={onAction}
        className={`flex items-center gap-3 font-bold text-xl px-10 py-4 rounded-2xl shadow-xl
          transition-transform active:scale-95 hover:scale-105 touch-manipulation
          ${isIdle
            ? 'bg-pokemon-red text-white'
            : isVictory
              ? 'bg-pokemon-yellow text-gray-900'
              : 'bg-white text-gray-900'
          }`}
        style={{ minHeight: '56px' }}
      >
        <PokeBall size={28} />
        {actionLabel ?? (isIdle ? 'Start!' : 'Spil igen')}
      </button>
    </div>
  );
};

export default GameOverlay;
