import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { vibrateSuccess, vibrateVictory, vibrateError } from '../../hooks/useVibrate';

type GameState = 'idle' | 'playing' | 'won' | 'lost';

interface Apple {
  id: number;
  ripeProgress: number; // 0-100
  eaten: boolean;
}

interface Bird {
  x: number;          // percentage of screen width, starts ~108, tree at ~30
  flyingAway: boolean;
}

interface EngineState {
  apples: Apple[];
  bird: Bird | null;
  birdSpawnAcc: number;
}

const TOTAL_APPLES = 6;
const RIPEN_INCREMENT = 0.125;      // per 50ms tick → ~40s to fully ripen (100 / 0.125 * 50ms)
const BIRD_SPAWN_INTERVAL = 5000;   // ms between bird spawns
const BIRD_SPEED = 1.0;             // % per tick → crosses screen (~80%) in ~4s
const BIRD_FLEE_SPEED = 2.0;        // % per tick (flee twice as fast)
const TREE_THRESHOLD = 28;          // bird eats apple when x reaches this %
const TICK_MS = 50;

function appleColor(progress: number): string {
  if (progress >= 67) return 'bg-red-500 shadow-red-400/60';
  if (progress >= 34) return 'bg-yellow-400 shadow-yellow-300/60';
  return 'bg-green-500 shadow-green-400/60';
}

// Confetti for win
const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#f97316'];
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  key: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 1.5}s`,
  size: `${10 + Math.random() * 10}px`,
}));

const AppleTreeGame = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [apples, setApples] = useState<Apple[]>([]);
  const [bird, setBird] = useState<Bird | null>(null);

  // Engine ref to avoid stale closures in the interval
  const engine = useRef<EngineState>({
    apples: [],
    bird: null,
    birdSpawnAcc: 0,
  });

  const confettiPieces = useMemo(() => CONFETTI_PIECES, []);

  const startGame = useCallback(() => {
    const initialApples: Apple[] = Array.from({ length: TOTAL_APPLES }, (_, i) => ({
      id: i,
      ripeProgress: 0,
      eaten: false,
    }));
    engine.current.apples = initialApples.map((a) => ({ ...a }));
    engine.current.bird = { x: 108, flyingAway: false }; // spawn first bird immediately
    engine.current.birdSpawnAcc = 0;
    setApples([...initialApples]);
    setBird({ x: 108, flyingAway: false });
    setGameState('playing');
  }, []);

  const handleBirdTap = useCallback(() => {
    const b = engine.current.bird;
    if (!b || b.flyingAway) return;
    engine.current.bird = { ...b, flyingAway: true };
    vibrateSuccess();
  }, []);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const e = engine.current;

      // Move bird
      if (e.bird) {
        if (e.bird.flyingAway) {
          e.bird.x += BIRD_FLEE_SPEED;
          if (e.bird.x > 112) {
            e.bird = null;
          }
        } else {
          e.bird.x -= BIRD_SPEED;
          if (e.bird.x <= TREE_THRESHOLD) {
            // Bird reaches tree — eat a random living apple
            const living = e.apples.filter((a) => !a.eaten);
            if (living.length > 0) {
              const target = living[Math.floor(Math.random() * living.length)];
              target.eaten = true;
              vibrateError();
            }
            e.bird = null;
          }
        }
      }

      // Spawn bird
      e.birdSpawnAcc += TICK_MS;
      if (e.birdSpawnAcc >= BIRD_SPAWN_INTERVAL && !e.bird) {
        e.bird = { x: 108, flyingAway: false };
        e.birdSpawnAcc = 0;
      }

      // Ripen apples
      for (const apple of e.apples) {
        if (!apple.eaten && apple.ripeProgress < 100) {
          apple.ripeProgress = Math.min(100, apple.ripeProgress + RIPEN_INCREMENT);
        }
      }

      // Check win/lose conditions
      const livingApples = e.apples.filter((a) => !a.eaten);
      const allRipe = livingApples.length > 0 && livingApples.every((a) => a.ripeProgress >= 100);
      const allEaten = e.apples.every((a) => a.eaten);

      // Push render snapshot
      setApples(e.apples.map((a) => ({ ...a })));
      setBird(e.bird ? { ...e.bird } : null);

      if (allRipe) {
        vibrateVictory();
        setGameState('won');
      } else if (allEaten) {
        setGameState('lost');
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [gameState]);

  // Idle screen
  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-8 p-6 select-none">
        <span className="text-8xl animate-bounce" role="img" aria-label="Æbletræ">🌳</span>
        <h2 className="font-pixel text-base text-white text-center leading-relaxed">
          Æbletræ
        </h2>
        <p className="text-white/80 text-xl text-center px-4">
          Jag fuglene væk og lad æblerne modne!
        </p>
        <button
          onClick={startGame}
          className="bg-red-500 hover:bg-red-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
          style={{ minWidth: '200px', minHeight: '80px' }}
        >
          Start! 🍎
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full py-4 px-4 select-none overflow-hidden">
      {/* Bird — flies across the upper portion of the screen */}
      {bird && (
        <div
          className="absolute z-20 cursor-pointer"
          style={{
            top: '18%',
            left: `${bird.x}%`,
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: bird.flyingAway ? 'scaleX(1)' : 'scaleX(-1)',
            touchAction: 'manipulation',
          }}
          onClick={handleBirdTap}
          onTouchStart={(e) => { e.preventDefault(); handleBirdTap(); }}
          role="button"
          aria-label="Fugl — tryk for at jage den væk"
        >
          <span className="text-7xl select-none" role="img" aria-hidden="true">🐦</span>
        </div>
      )}

      {/* Tree + Apples */}
      <div className="flex flex-col items-center flex-1 justify-center w-full">
        {/* Tree crown area with apples */}
        <div className="relative flex flex-col items-center">
          {/* Tree crown emoji */}
          <span className="text-[96px] sm:text-[120px] leading-none select-none" role="img" aria-label="Træ">🌳</span>

          {/* Apple grid overlaid on the tree crown */}
          <div
            className="absolute flex flex-col gap-3 items-center"
            style={{ top: '10%' }}
          >
            {/* Row 1: 3 apples */}
            <div className="flex gap-4">
              {apples.slice(0, 3).map((apple) => (
                <div
                  key={apple.id}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-1000
                    ${apple.eaten ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
                    ${appleColor(apple.ripeProgress)}
                  `}
                >
                  {!apple.eaten && (
                    <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="Æble">
                      {apple.ripeProgress >= 100 ? '🍎' : '🍏'}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {/* Row 2: 3 apples */}
            <div className="flex gap-4">
              {apples.slice(3, 6).map((apple) => (
                <div
                  key={apple.id}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-1000
                    ${apple.eaten ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
                    ${appleColor(apple.ripeProgress)}
                  `}
                >
                  {!apple.eaten && (
                    <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="Æble">
                      {apple.ripeProgress >= 100 ? '🍎' : '🍏'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ground */}
        <div className="w-full mt-2 h-6 bg-amber-800/60 rounded-full" />
      </div>

      {/* Ripeness progress hint */}
      <div className="bg-black/30 px-5 py-2 rounded-full text-white font-bold text-base sm:text-lg flex-shrink-0">
        🍎 {apples.filter((a) => !a.eaten && a.ripeProgress >= 100).length} / {apples.filter((a) => !a.eaten).length} modne
      </div>

      {/* Win overlay */}
      {gameState === 'won' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75">
          {confettiPieces.map((p) => (
            <div
              key={p.key}
              className="absolute top-0 animate-confetti-fall"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: '3px',
                animationDelay: p.delay,
              }}
            />
          ))}
          <span className="text-8xl mb-4 animate-bounce" role="img" aria-label="Æble">🍎</span>
          <h2 className="font-pixel text-sm text-white mb-2 text-center px-4">Alle æbler er modne!</h2>
          <p className="text-white/80 text-xl mb-8 text-center">Godt klaret!</p>
          <button
            onClick={startGame}
            className="bg-red-500 hover:bg-red-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
            style={{ minWidth: '200px', minHeight: '80px' }}
          >
            Spil igen! 🌳
          </button>
        </div>
      )}

      {/* Lose overlay (gentle) */}
      {gameState === 'lost' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75">
          <span className="text-8xl mb-4 animate-bounce" role="img" aria-label="Fugl">🐦</span>
          <h2 className="font-pixel text-sm text-white mb-2 text-center px-4">Fuglene spiste æblerne!</h2>
          <p className="text-white/80 text-xl mb-8 text-center">Prøv igen!</p>
          <button
            onClick={startGame}
            className="bg-orange-400 hover:bg-orange-300 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
            style={{ minWidth: '200px', minHeight: '80px' }}
          >
            Spil igen! 🍎
          </button>
        </div>
      )}
    </div>
  );
};

export default AppleTreeGame;
