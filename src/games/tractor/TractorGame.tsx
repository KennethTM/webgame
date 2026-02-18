import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { vibrateSuccess, vibrateVictory } from '../../hooks/useVibrate';

type GameState = 'idle' | 'playing' | 'won';

const GRID_SIZE = 5;
const CROP_COUNT = 9;

interface Pos { x: number; y: number; }

function generateCrops(exclude: Pos): Set<string> {
  const crops = new Set<string>();
  while (crops.size < CROP_COUNT) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (x === exclude.x && y === exclude.y) continue;
    crops.add(`${x},${y}`);
  }
  return crops;
}

// Confetti for win
const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#fbbf24', '#ef4444', '#84cc16'];
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  key: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 1.2}s`,
  size: `${10 + Math.random() * 10}px`,
}));

// Inline D-pad with large 80×80 buttons for tablet
interface TractorDPadProps {
  onMove: (dx: number, dy: number) => void;
}

const TractorDPad = ({ onMove }: TractorDPadProps) => {
  const touchedRef = useRef(false);

  const handle = (dx: number, dy: number) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      touchedRef.current = true;
      onMove(dx, dy);
    },
    onMouseDown: () => {
      if (!touchedRef.current) onMove(dx, dy);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const btnClass =
    'bg-amber-600/80 active:bg-amber-400 text-white flex items-center justify-center rounded-2xl shadow-lg select-none touch-manipulation transition-colors';
  const btnStyle = { width: '80px', height: '80px', touchAction: 'manipulation' as const };

  return (
    <div
      className="grid gap-2 mt-4"
      style={{ gridTemplateColumns: 'repeat(3, 80px)', gridTemplateRows: 'repeat(3, 80px)' }}
      role="group"
      aria-label="Styring"
    >
      <div />
      <button className={btnClass} style={btnStyle} {...handle(0, -1)} aria-label="Op">
        <span className="text-3xl">▲</span>
      </button>
      <div />

      <button className={btnClass} style={btnStyle} {...handle(-1, 0)} aria-label="Venstre">
        <span className="text-3xl">◀</span>
      </button>
      <div className="flex items-center justify-center">
        <span className="text-3xl opacity-40">🚜</span>
      </div>
      <button className={btnClass} style={btnStyle} {...handle(1, 0)} aria-label="Højre">
        <span className="text-3xl">▶</span>
      </button>

      <div />
      <button className={btnClass} style={btnStyle} {...handle(0, 1)} aria-label="Ned">
        <span className="text-3xl">▼</span>
      </button>
      <div />
    </div>
  );
};

const TractorGame = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [tractorPos, setTractorPos] = useState<Pos>({ x: 0, y: 0 });
  const [crops, setCrops] = useState<Set<string>>(new Set());
  const [facingRight, setFacingRight] = useState(true);
  const [poppedCrops, setPoppedCrops] = useState<string[]>([]);

  const confettiPieces = useMemo(() => CONFETTI_PIECES, []);

  const startGame = useCallback(() => {
    const start = { x: 0, y: 0 };
    setTractorPos(start);
    setFacingRight(true);
    setCrops(generateCrops(start));
    setPoppedCrops([]);
    setGameState('playing');
  }, []);

  const move = useCallback((dx: number, dy: number) => {
    setGameState((gs) => {
      if (gs !== 'playing') return gs;
      return gs;
    });

    setTractorPos((prev) => {
      const nx = Math.max(0, Math.min(GRID_SIZE - 1, prev.x + dx));
      const ny = Math.max(0, Math.min(GRID_SIZE - 1, prev.y + dy));
      if (nx === prev.x && ny === prev.y) return prev;

      const key = `${nx},${ny}`;
      setCrops((prevCrops) => {
        if (!prevCrops.has(key)) return prevCrops;
        const next = new Set(prevCrops);
        next.delete(key);
        vibrateSuccess();

        // Show sparkle pop briefly
        setPoppedCrops((p) => [...p, key]);
        setTimeout(() => {
          setPoppedCrops((p) => p.filter((k) => k !== key));
        }, 400);

        if (next.size === 0) {
          setTimeout(() => {
            vibrateVictory();
            setGameState('won');
          }, 100);
        }
        return next;
      });

      return { x: nx, y: ny };
    });

    if (dx > 0) setFacingRight(true);
    if (dx < 0) setFacingRight(false);
  }, []);

  // Keyboard support
  useEffect(() => {
    if (gameState !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp')    { e.preventDefault(); move(0, -1); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); move(0, 1);  }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); move(-1, 0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1, 0);  }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState, move]);

  // Idle screen
  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-8 p-6 select-none">
        <span className="text-9xl animate-bounce" role="img" aria-label="Traktor">🚜</span>
        <h2 className="font-pixel text-base text-white text-center leading-relaxed">
          Traktor Høst
        </h2>
        <p className="text-white/80 text-xl text-center">Saml alle kornet!</p>
        <button
          onClick={startGame}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
          style={{ minWidth: '200px', minHeight: '80px' }}
        >
          Kør! 🌾
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-between w-full h-full py-3 px-4 select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Crop counter */}
      <div className="bg-black/30 px-6 py-3 rounded-full text-white font-bold text-xl sm:text-2xl flex-shrink-0">
        🌾 {crops.size} tilbage
      </div>

      {/* Grid */}
      <div
        className="grid gap-1 flex-shrink-0"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          width: 'min(90vw, calc(100vh - 280px))',
          height: 'min(90vw, calc(100vh - 280px))',
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const key = `${x},${y}`;
          const isTractor = tractorPos.x === x && tractorPos.y === y;
          const hasCrop = crops.has(key);
          const isPopping = poppedCrops.includes(key);

          return (
            <div
              key={key}
              className={`rounded-xl flex items-center justify-center overflow-hidden ${
                (x + y) % 2 === 0 ? 'bg-green-500' : 'bg-green-400'
              }`}
            >
              {isTractor && (
                <span
                  className="text-3xl sm:text-4xl select-none"
                  role="img"
                  aria-label="Traktor"
                  style={{
                    display: 'inline-block',
                    transform: facingRight ? 'none' : 'scaleX(-1)',
                  }}
                >
                  🚜
                </span>
              )}
              {!isTractor && hasCrop && (
                <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="Korn">
                  🌾
                </span>
              )}
              {!isTractor && !hasCrop && isPopping && (
                <span
                  className="text-2xl sm:text-3xl select-none animate-pop-collect"
                  role="img"
                  aria-label="Stjerne"
                >
                  ✨
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* D-Pad */}
      <div className="flex-shrink-0">
        <TractorDPad onMove={move} />
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
          <span className="text-8xl mb-4 animate-bounce" role="img" aria-label="Fest">🎉</span>
          <h2 className="font-pixel text-lg text-white mb-2 text-center">Du vandt!</h2>
          <p className="text-white/80 text-xl mb-8 text-center">Alle afgrøder samlet!</p>
          <button
            onClick={startGame}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
            style={{ minWidth: '200px', minHeight: '80px' }}
          >
            Spil igen! 🚜
          </button>
        </div>
      )}
    </div>
  );
};

export default TractorGame;
