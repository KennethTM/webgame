import { useState, useRef, useEffect } from 'react';
import SpriteImage from '../../components/SpriteImage';
import PokeBall from '../../components/PokeBall';
import GameOverlay from '../../components/GameOverlay';
import { useHighScore } from '../../hooks/useHighScore';
import { useGameActive } from '../../hooks/useGameActive';

const TOUCH_GUARD_MS = 400;

const GAME_DURATION = 8000;

// Height milestone Pokémon
const MILESTONES = [
  { height: 10, pokemonId: 16, name: 'Pidgey' },
  { height: 20, pokemonId: 12, name: 'Butterfree' },
  { height: 30, pokemonId: 22, name: 'Fearow' },
  { height: 40, pokemonId: 149, name: 'Dragonite' },
];

const JumpGame = () => {
  const [gameState, setGameState] = useState<'idle' | 'charging' | 'jumping' | 'finished'>('idle');
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [height, setHeight] = useState(0);

  const { best, submitScore } = useHighScore('jump');
  const { setGameActive } = useGameActive();

  useEffect(() => {
    setGameActive(gameState === 'charging' || gameState === 'jumping');
    return () => setGameActive(false);
  }, [gameState, setGameActive]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTouchRef = useRef(0);

  const handleTap = () => {
    if (gameState === 'charging') setTaps(t => t + 1);
  };

  const startCharging = () => {
    setGameState('charging');
    setTaps(0);
    setTimeLeft(GAME_DURATION);

    const startTime = performance.now();
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, GAME_DURATION - (performance.now() - startTime));
      setTimeLeft(remaining);
      if (remaining === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Inline finishCharging to avoid ordering issues
        setGameState('jumping');
        setTaps(prev => {
          const h = Math.floor(prev * 2 + Math.random() * 5);
          setHeight(h);
          setTimeout(() => setGameState('finished'), 3000);
          return prev;
        });
      }
    }, 50);
  };

  const reset = () => {
    setGameState('idle');
    setTaps(0);
    setHeight(0);
  };

  const stars = height >= 40 ? 3 : height >= 20 ? 2 : height >= 8 ? 1 : 0;
  const showGyarados = height > 40;

  // Submit score on finished
  useEffect(() => {
    if (gameState === 'finished' && height > 0) submitScore(height, stars);
  }, [gameState, height, stars, submitScore]);

  return (
    <div className="flex flex-col items-center w-full max-w-md select-none">
      {/* Personal best */}
      <div className="mb-3 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full">
        <SpriteImage pokemonId={129} variant="sprite" size={24} />
        {height > 0 && <span className="font-pixel text-sm text-white">{height}m</span>}
        {best.bestScore > 0 && <span className="font-pixel text-xs text-white/40 ml-1">Best: {best.bestScore}m</span>}
      </div>

      {/* Play area */}
      <div className="relative w-full h-[520px] bg-gradient-to-b from-orange-300 via-sky-300 to-sky-100 rounded-3xl border-4 border-white/30 shadow-2xl overflow-hidden flex flex-col items-center">
        {/* CSS clouds */}
        {[
          { top: '8%', left: '5%', w: 80, delay: 0 },
          { top: '18%', left: '60%', w: 100, delay: 2 },
          { top: '30%', left: '25%', w: 60, delay: 4 },
        ].map((cloud, i) => (
          <div
            key={i}
            className="absolute opacity-60 animate-float-cloud"
            style={{
              top: cloud.top, left: cloud.left,
              width: cloud.w, height: cloud.w * 0.4,
              background: 'white', borderRadius: '50%',
              filter: 'blur(4px)',
              animationDelay: `${cloud.delay}s`,
            }}
          />
        ))}

        {/* Height markers during jump */}
        {gameState === 'jumping' && (
          <div className="absolute inset-0 pointer-events-none">
            {MILESTONES.map(m => (
              <div
                key={m.height}
                className="absolute right-2 flex items-center gap-1"
                style={{ bottom: `${(m.height / 50) * 70 + 20}%` }}
              >
                <span className="text-sky-700/40 font-pixel text-[11px]">{m.height}m</span>
                <SpriteImage pokemonId={m.pokemonId} variant="sprite" size={20} className="opacity-40" />
              </div>
            ))}
          </div>
        )}

        {/* Water with wavy top */}
        <div className="absolute bottom-0 w-full h-24 z-10">
          <svg viewBox="0 0 400 30" className="absolute -top-4 w-full" preserveAspectRatio="none">
            <path d="M0 20 Q50 5 100 20 Q150 35 200 20 Q250 5 300 20 Q350 35 400 20 L400 30 L0 30Z" fill="#3b82f6" opacity="0.7" />
          </svg>
          <div className="w-full h-full bg-gradient-to-b from-blue-500/80 to-blue-700/90 flex items-center justify-center">
            <div className="flex gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-16 h-1.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Magikarp */}
        <div
          className={`z-20 transition-all duration-[3000ms] ease-out absolute
            ${gameState === 'jumping' ? '-translate-y-[430px] scale-125 rotate-[360deg]' :
              gameState === 'charging' ? 'animate-shake' : ''}`}
          style={{ bottom: gameState === 'jumping' ? '100px' : '70px' }}
        >
          <SpriteImage pokemonId={showGyarados && gameState === 'finished' ? 130 : 129} size={100} />
        </div>

        {/* Idle overlay */}
        {gameState === 'idle' && (
          <GameOverlay
            variant="idle"
            title="Magikarp Jump"
            subtitle="Tap to power up!"
            pokemonId={129}
            onAction={startCharging}
          />
        )}

        {/* Charging UI */}
        {gameState === 'charging' && (
          <div className="absolute top-6 w-full px-6 z-30 flex flex-col items-center">
            <div className="font-pixel text-lg text-pokemon-red mb-2">TAP TAP TAP!</div>
            <div className="w-full bg-gray-200 h-6 rounded-full border-3 border-white shadow-md overflow-hidden">
              <div
                className="h-full bg-pokemon-red transition-all duration-100 rounded-full"
                style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
              />
            </div>
            <div className="mt-3 font-pixel text-3xl text-white drop-shadow-md">{taps}</div>
          </div>
        )}

        {/* Jumping text */}
        {gameState === 'jumping' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <div className="font-pixel text-2xl text-pokemon-blue animate-pulse drop-shadow-lg">JUMP!!!</div>
          </div>
        )}

        {/* Finished overlay */}
        {gameState === 'finished' && (
          <GameOverlay
            variant="victory"
            title={`${height}m!`}
            subtitle={height > 40 ? 'Magikarp evolved!' : 'Not bad for a fish!'}
            pokemonId={showGyarados ? 130 : 129}
            stars={stars}
            onAction={reset}
          />
        )}
      </div>

      {/* Tap button during charging */}
      {gameState === 'charging' && (
        <button
          onTouchStart={(e) => { e.preventDefault(); lastTouchRef.current = Date.now(); handleTap(); }}
          onMouseDown={() => { if (Date.now() - lastTouchRef.current > TOUCH_GUARD_MS) handleTap(); }}
          onContextMenu={(e) => e.preventDefault()}
          className="mt-6 w-44 h-44 bg-gradient-radial from-pokemon-yellow to-pokemon-gold rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-4 border-white/30 touch-none"
        >
          <div className="flex flex-col items-center">
            <PokeBall size={40} />
            <span className="font-pixel text-xs text-gray-800 mt-2">JUMP</span>
          </div>
        </button>
      )}

    </div>
  );
};

export default JumpGame;
