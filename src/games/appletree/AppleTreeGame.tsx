import { useState, useRef, useCallback, useEffect } from 'react';
import { vibrateSuccess, vibrateVictory, vibrateError } from '../../hooks/useVibrate';

type GameState = 'idle' | 'playing' | 'won' | 'lost';

interface Apple {
  id: number;
  ripeProgress: number; // 0-100
  eaten: boolean;
}

interface Bird {
  x: number;
  flyingAway: boolean;
  fromRight: boolean;   // which side it spawned from
  eating: boolean;
  eatTimer: number;
}

interface EngineState {
  apples: Apple[];
  bird: Bird | null;
  birdSpawnAcc: number;
  nextFromRight: boolean;
}

const TOTAL_APPLES = 6;
const RIPEN_INCREMENT = 0.125;      // per 50ms tick
const BIRD_SPAWN_INTERVAL = 5000;
const BIRD_SPEED = 1.0;
const BIRD_FLEE_SPEED = 2.0;
const TREE_RIGHT_THRESHOLD = 65;    // bird from right triggers at this x%
const TREE_LEFT_THRESHOLD = 25;     // bird from left triggers at this x%
const EAT_TICKS = 10;               // 500ms eating animation
const TICK_MS = 50;

// Apple positions within the crown div (crown centered, 44% wide, 52% tall)
const APPLE_POSITIONS = [
  { left: '18%', top: '22%' },
  { left: '42%', top: '14%' },
  { left: '67%', top: '22%' },
  { left: '14%', top: '58%' },
  { left: '42%', top: '63%' },
  { left: '68%', top: '56%' },
];

// Confetti
const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#f97316'];

type ConfettiPiece = { key: number; color: string; left: string; delay: string; size: string };

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 24 }, (_, i) => ({
    key: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    size: `${10 + Math.random() * 10}px`,
  }));
}

const AppleTreeGame = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [apples, setApples] = useState<Apple[]>([]);
  const [bird, setBird] = useState<Bird | null>(null);
  const [eatFlash, setEatFlash] = useState<{ id: number; fromRight: boolean } | null>(null);

  const engine = useRef<EngineState>({
    apples: [],
    bird: null,
    birdSpawnAcc: 0,
    nextFromRight: true,
  });

  const [confettiPieces] = useState<ConfettiPiece[]>(makeConfetti);

  const startGame = useCallback(() => {
    const initialApples: Apple[] = Array.from({ length: TOTAL_APPLES }, (_, i) => ({
      id: i,
      ripeProgress: 0,
      eaten: false,
    }));
    const fromRight = Math.random() > 0.5;
    engine.current.apples = initialApples.map((a) => ({ ...a }));
    engine.current.bird = { x: fromRight ? 108 : -8, flyingAway: false, fromRight, eating: false, eatTimer: 0 };
    engine.current.birdSpawnAcc = 0;
    engine.current.nextFromRight = Math.random() > 0.5;
    setApples([...initialApples]);
    setBird({ ...engine.current.bird });
    setEatFlash(null);
    setGameState('playing');
  }, []);

  const handleBirdTap = useCallback(() => {
    const b = engine.current.bird;
    if (!b || b.flyingAway || b.eating) return;
    engine.current.bird = { ...b, flyingAway: true };
    vibrateSuccess();
  }, []);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const e = engine.current;

      if (e.bird) {
        if (e.bird.eating) {
          e.bird.eatTimer--;
          if (e.bird.eatTimer <= 0) {
            e.bird = { ...e.bird, eating: false, flyingAway: true };
          }
        } else if (e.bird.flyingAway) {
          e.bird.x += e.bird.fromRight ? BIRD_FLEE_SPEED : -BIRD_FLEE_SPEED;
          if (e.bird.x > 112 || e.bird.x < -12) {
            e.bird = null;
          }
        } else {
          e.bird.x += e.bird.fromRight ? -BIRD_SPEED : BIRD_SPEED;
          const triggered = e.bird.fromRight
            ? e.bird.x <= TREE_RIGHT_THRESHOLD
            : e.bird.x >= TREE_LEFT_THRESHOLD;

          if (triggered) {
            const living = e.apples.filter((a) => !a.eaten);
            if (living.length > 0) {
              const target = living[Math.floor(Math.random() * living.length)];
              target.eaten = true;
              vibrateError();
              const flash = { id: target.id, fromRight: e.bird.fromRight };
              setEatFlash(flash);
              setTimeout(() => setEatFlash(null), 700);
            }
            e.bird = {
              x: e.bird.fromRight ? TREE_RIGHT_THRESHOLD : TREE_LEFT_THRESHOLD,
              flyingAway: false,
              fromRight: e.bird.fromRight,
              eating: true,
              eatTimer: EAT_TICKS,
            };
          }
        }
      }

      // Spawn next bird
      e.birdSpawnAcc += TICK_MS;
      if (e.birdSpawnAcc >= BIRD_SPAWN_INTERVAL && !e.bird) {
        const fromRight = e.nextFromRight;
        e.bird = { x: fromRight ? 108 : -8, flyingAway: false, fromRight, eating: false, eatTimer: 0 };
        e.birdSpawnAcc = 0;
        e.nextFromRight = Math.random() > 0.5;
      }

      // Ripen apples
      for (const apple of e.apples) {
        if (!apple.eaten && apple.ripeProgress < 100) {
          apple.ripeProgress = Math.min(100, apple.ripeProgress + RIPEN_INCREMENT);
        }
      }

      // Win/lose check
      const livingApples = e.apples.filter((a) => !a.eaten);
      const allRipe = livingApples.length > 0 && livingApples.every((a) => a.ripeProgress >= 100);
      const allEaten = e.apples.every((a) => a.eaten);

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

  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-8 p-6 select-none">
        <span className="text-8xl animate-bounce" role="img" aria-label="Æbletræ">🌳</span>
        <h2 className="font-pixel text-base text-white text-center leading-relaxed">Æbletræ</h2>
        <p className="text-white/80 text-xl text-center px-4">Jag fuglene væk og lad æblerne modne!</p>
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

  // Bird faces the direction it's flying toward
  // fromRight=true, approaching: faces left → flipped
  // fromRight=true, flyingAway: faces right → not flipped
  // fromRight=false, approaching: faces right → not flipped
  // fromRight=false, flyingAway: faces left → flipped
  const birdFlipped = bird ? bird.fromRight !== bird.flyingAway : false;

  return (
    <div className="relative w-full h-full select-none overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200" />

      {/* Sun */}
      <div className="absolute top-4 right-8 w-14 h-14 bg-yellow-300 rounded-full shadow-xl shadow-yellow-400/50" />

      {/* Cloud left */}
      <div className="absolute" style={{ top: '6%', left: '4%' }}>
        <div className="relative" style={{ width: '80px', height: '44px' }}>
          <div className="absolute bg-white rounded-full" style={{ width: '55px', height: '35px', bottom: 0, left: '15px' }} />
          <div className="absolute bg-white rounded-full" style={{ width: '45px', height: '30px', bottom: '10px', left: '5px' }} />
          <div className="absolute bg-white rounded-full" style={{ width: '38px', height: '24px', bottom: '5px', right: 0 }} />
        </div>
      </div>

      {/* Cloud right */}
      <div className="absolute" style={{ top: '10%', right: '12%' }}>
        <div className="relative" style={{ width: '68px', height: '36px' }}>
          <div className="absolute bg-white/90 rounded-full" style={{ width: '48px', height: '30px', bottom: 0, left: '10px' }} />
          <div className="absolute bg-white/90 rounded-full" style={{ width: '36px', height: '24px', bottom: '8px', left: 0 }} />
          <div className="absolute bg-white/90 rounded-full" style={{ width: '30px', height: '20px', bottom: '4px', right: 0 }} />
        </div>
      </div>

      {/* Ground layers */}
      <div className="absolute bottom-0 left-0 right-0 bg-green-800" style={{ height: '20%' }} />
      <div className="absolute bottom-0 left-0 right-0 bg-green-700" style={{ height: '14%' }} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-green-600"
        style={{ height: '8%', borderRadius: '60% 60% 0 0 / 40% 40% 0 0' }}
      />

      {/* Trunk — centered */}
      <div
        className="absolute bg-amber-900 rounded-sm"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '7%',
          maxWidth: '52px',
          bottom: '13%',
          height: '26%',
        }}
      />

      {/* Crown — centered, large */}
      <div
        className="absolute"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '44%',
          top: '5%',
          height: '52%',
        }}
      >
        {/* Layered circles: dark outer → light inner for depth */}
        <div className="absolute bg-green-800 rounded-full" style={{ inset: 0 }} />
        <div className="absolute bg-green-700 rounded-full" style={{ top: '4%', left: '3%', right: '3%', bottom: '7%' }} />
        <div className="absolute bg-green-600 rounded-full" style={{ top: '9%', left: '8%', right: '8%', bottom: '14%' }} />
        <div className="absolute bg-green-500 rounded-full" style={{ top: '15%', left: '15%', right: '15%', bottom: '22%' }} />

        {/* Apples */}
        {apples.map((apple, i) => {
          const pos = APPLE_POSITIONS[i];
          const isFlashing = eatFlash?.id === apple.id;
          return (
            <div
              key={apple.id}
              className="absolute flex items-center justify-center"
              style={{
                left: pos.left,
                top: pos.top,
                width: '14%',
                height: '16%',
                opacity: apple.eaten ? 0 : 1,
                transform: apple.eaten ? 'scale(0)' : isFlashing ? 'scale(1.6)' : 'scale(1)',
                transition: 'opacity 0.4s ease, transform 0.25s ease',
                zIndex: 5,
              }}
            >
              <span
                className="select-none leading-none"
                style={{ fontSize: 'clamp(14px, 2.8vw, 26px)' }}
                role="img"
                aria-label="Æble"
              >
                {apple.ripeProgress >= 100 ? '🍎' : '🍏'}
              </span>
            </div>
          );
        })}

        {/* Eat flash — appears at the side of collision */}
        {eatFlash && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: '35%',
              left: eatFlash.fromRight ? 'auto' : '-8%',
              right: eatFlash.fromRight ? '-8%' : 'auto',
              fontSize: '28px',
              zIndex: 10,
              animation: 'ping 0.7s ease-out forwards',
            }}
          >
            💥
          </div>
        )}
      </div>

      {/* Bird */}
      {bird && (
        <div
          className={`absolute z-20 cursor-pointer flex items-center justify-center ${bird.eating ? 'animate-bounce' : ''}`}
          style={{
            top: '27%',
            left: `${bird.x}%`,
            width: '90px',
            height: '90px',
            transform: birdFlipped ? 'scaleX(-1)' : 'scaleX(1)',
            touchAction: 'none',
          }}
          onPointerDown={(e) => { e.preventDefault(); handleBirdTap(); }}
          role="button"
          aria-label="Fugl — tryk for at jage den væk"
        >
          <span
            className="select-none leading-none"
            style={{ fontSize: 'clamp(34px, 5.5vw, 54px)' }}
            role="img"
            aria-hidden="true"
          >
            {bird.eating ? '😋' : '🐦'}
          </span>
        </div>
      )}

      {/* Counter */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center z-10">
        <div className="bg-black/40 px-5 py-2 rounded-full text-white font-bold text-base sm:text-lg">
          🍎 {apples.filter((a) => !a.eaten && a.ripeProgress >= 100).length} / {apples.filter((a) => !a.eaten).length} modne
        </div>
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

      {/* Lose overlay */}
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
