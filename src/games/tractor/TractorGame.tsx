import { useState, useCallback, useEffect, useMemo } from 'react';
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

const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#fbbf24', '#ef4444', '#84cc16'];
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  key: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 1.2}s`,
  size: `${10 + Math.random() * 10}px`,
}));

interface TractorDPadProps {
  onMove: (dx: number, dy: number) => void;
}

const TractorDPad = ({ onMove }: TractorDPadProps) => {
  const handle = (dx: number, dy: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onMove(dx, dy);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const btnClass =
    'bg-amber-700 active:bg-amber-500 text-white flex items-center justify-center rounded-2xl shadow-lg shadow-amber-900/60 select-none transition-colors border-2 border-amber-500';
  const btnStyle = { width: '80px', height: '80px', touchAction: 'none' as const };

  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: 'repeat(3, 80px)',
        gridTemplateRows: 'repeat(3, 80px)',
        touchAction: 'none',
      }}
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
      <div
        className="flex items-center justify-center rounded-2xl border-2 border-amber-800/50"
        style={{ backgroundColor: 'rgba(120,53,15,0.4)' }}
      >
        <span className="text-3xl select-none">🚜</span>
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
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const confettiPieces = useMemo(() => CONFETTI_PIECES, []);

  const startGame = useCallback(() => {
    const start = { x: 0, y: 0 };
    setTractorPos(start);
    setFacingRight(true);
    setCrops(generateCrops(start));
    setPoppedCrops([]);
    setVisited(new Set([`${start.x},${start.y}`]));
    setGameState('playing');
  }, []);

  const move = useCallback((dx: number, dy: number) => {
    setTractorPos((prev) => {
      const nx = Math.max(0, Math.min(GRID_SIZE - 1, prev.x + dx));
      const ny = Math.max(0, Math.min(GRID_SIZE - 1, prev.y + dy));
      if (nx === prev.x && ny === prev.y) return prev;

      const key = `${nx},${ny}`;
      setVisited((v) => new Set([...v, key]));

      setCrops((prevCrops) => {
        if (!prevCrops.has(key)) return prevCrops;
        const next = new Set(prevCrops);
        next.delete(key);
        vibrateSuccess();

        setPoppedCrops((p) => [...p, key]);
        setTimeout(() => setPoppedCrops((p) => p.filter((k) => k !== key)), 450);

        if (next.size === 0) {
          setTimeout(() => { vibrateVictory(); setGameState('won'); }, 100);
        }
        return next;
      });

      return { x: nx, y: ny };
    });

    if (dx > 0) setFacingRight(true);
    if (dx < 0) setFacingRight(false);
  }, []);

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

  if (gameState === 'idle') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6 w-full h-full select-none"
        style={{
          background: 'linear-gradient(to bottom, #38bdf8 0%, #7dd3fc 45%, #d97706 65%, #92400e 100%)',
        }}
      >
        <span className="text-9xl animate-bounce drop-shadow-xl" role="img" aria-label="Traktor">🚜</span>
        <h2 className="font-pixel text-base text-white text-center leading-relaxed drop-shadow-lg">
          Traktor Høst
        </h2>
        <p className="text-white/90 text-xl text-center drop-shadow px-4">
          Kør over alle kornet og høst dem!
        </p>
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

  const harvested = CROP_COUNT - crops.size;

  return (
    <div
      className="relative flex flex-col items-center w-full h-full select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Sky + horizon */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #38bdf8 0%, #7dd3fc 30%, #fde68a 50%, #d97706 60%, #92400e 100%)',
        }}
      />

      {/* Sun */}
      <div className="absolute top-3 right-6 w-10 h-10 bg-yellow-300 rounded-full shadow-lg shadow-yellow-400/50" />

      {/* Barn for atmosphere */}
      <div className="absolute top-2 left-4 text-3xl select-none opacity-70" aria-hidden="true">🏚️</div>

      {/* Counter */}
      <div className="relative z-10 mt-3 mb-1 bg-amber-950/70 px-5 py-2 rounded-full text-white font-bold text-lg sm:text-xl flex-shrink-0 shadow-lg">
        🌾 {harvested} / {CROP_COUNT} høstet
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-48 h-3 bg-amber-950/40 rounded-full mb-1 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-300"
          style={{ width: `${(harvested / CROP_COUNT) * 100}%` }}
        />
      </div>

      {/* Field */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full px-3">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            width: 'min(86vw, calc(100vh - 330px))',
            height: 'min(86vw, calc(100vh - 330px))',
            gap: '3px',
            backgroundColor: '#451a03', // amber-950 for grid lines
            border: '4px solid #451a03',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const key = `${x},${y}`;
            const isTractor = tractorPos.x === x && tractorPos.y === y;
            const hasCrop = crops.has(key);
            const isPopping = poppedCrops.includes(key);
            const isPlowed = visited.has(key);

            // Fresh soil: warm amber. Plowed (visited): dark rich brown.
            const bg = isPlowed
              ? ((x + y) % 2 === 0 ? '#7c2d12' : '#6b2210') // amber-900 / darker
              : ((x + y) % 2 === 0 ? '#b45309' : '#92400e'); // amber-700 / amber-800

            return (
              <div
                key={key}
                className="relative flex items-center justify-center overflow-hidden transition-colors duration-300"
                style={{ backgroundColor: bg }}
              >
                {/* Subtle plow-line on visited empty tiles */}
                {isPlowed && !isTractor && !isPopping && (
                  <div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-30"
                    style={{ height: '2px', backgroundColor: '#1c0a00' }}
                  />
                )}

                {/* Tractor */}
                {isTractor && (
                  <span
                    className="text-3xl sm:text-4xl select-none drop-shadow-md relative z-10"
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

                {/* Crop */}
                {!isTractor && hasCrop && (
                  <span className="text-2xl sm:text-3xl select-none drop-shadow relative z-10" role="img" aria-label="Korn">
                    🌾
                  </span>
                )}

                {/* Harvest sparkle */}
                {!isTractor && !hasCrop && isPopping && (
                  <span
                    className="text-2xl sm:text-3xl select-none animate-pop-collect relative z-10"
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
      </div>

      {/* D-Pad */}
      <div className="relative z-10 flex-shrink-0 pb-3 pt-1">
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
          <h2 className="font-pixel text-lg text-white mb-2 text-center">Høst fuldført!</h2>
          <p className="text-white/80 text-xl mb-8 text-center">Alle afgrøder er samlet!</p>
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
