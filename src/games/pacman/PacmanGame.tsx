import { useState, useEffect, useCallback, useRef } from 'react';
import SpriteImage from '../../components/SpriteImage';
import PokeBall from '../../components/PokeBall';
import DPad from '../../components/DPad';
import GameOverlay from '../../components/GameOverlay';
import { useSwipe } from '../../hooks/useSwipe';
import { vibrateSuccess, vibrateGameOver, vibrateVictory } from '../../hooks/useVibrate';
import { useHighScore } from '../../hooks/useHighScore';
import { useGameActive } from '../../hooks/useGameActive';

const GRID_SIZE = 15;
const MOVE_INTERVAL = 200; // ms per auto-move tick

// 0: empty, 1: wall, 2: candy, 3: master ball
const INITIAL_MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 3, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 0, 0, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 1, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 0, 0, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

interface Dir { dx: number; dy: number }

const PacmanGame = () => {
  const [player, setPlayer] = useState({ x: 7, y: 11 });
  const [ghosts, setGhosts] = useState([
    { x: 6, y: 7, spriteId: 92, isVulnerable: false },
    { x: 8, y: 7, spriteId: 93, isVulnerable: false },
  ]);
  const [maze, setMaze] = useState(INITIAL_MAZE);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [powerTimer, setPowerTimer] = useState(0);

  const { best, submitScore } = useHighScore('pacman');
  const { setGameActive } = useGameActive();
  const stars = score >= 500 ? 3 : score >= 200 ? 2 : score >= 50 ? 1 : 0;

  // Refs for continuous movement (avoid stale closures in interval)
  const directionRef = useRef<Dir | null>(null);
  const playerRef = useRef({ x: 7, y: 11 });
  const mazeRef = useRef(INITIAL_MAZE);
  const gameOverRef = useRef(false);
  const isWonRef = useRef(false);

  // Win condition
  const isWon = score > 0 && !maze.some(row => row.some(cell => cell === 2 || cell === 3));

  // Keep refs in sync with state
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { mazeRef.current = maze; }, [maze]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { isWonRef.current = isWon; }, [isWon]);

  // Vibrate on victory
  useEffect(() => { if (isWon) vibrateVictory(); }, [isWon]);

  // Signal game active
  useEffect(() => { setGameActive(score > 0 && !gameOver && !isWon); return () => setGameActive(false); }, [score, gameOver, isWon, setGameActive]);

  // Submit score on game end
  useEffect(() => {
    if ((gameOver || isWon) && score > 0) submitScore(score, stars);
  }, [gameOver, isWon, score, stars, submitScore]);

  // Set direction (input handler — does not directly move)
  const setDirection = useCallback((dx: number, dy: number) => {
    directionRef.current = { dx, dy };
  }, []);

  // Continuous auto-movement loop
  useEffect(() => {
    if (gameOver || isWon) return;

    const interval = setInterval(() => {
      const dir = directionRef.current;
      if (!dir || gameOverRef.current || isWonRef.current) return;

      const p = playerRef.current;
      const m = mazeRef.current;

      const newX = p.x + dir.dx;
      const newY = p.y + dir.dy;

      let wrappedX = newX;
      if (newX < 0) wrappedX = GRID_SIZE - 1;
      if (newX >= GRID_SIZE) wrappedX = 0;

      if (m[newY] && m[newY][wrappedX] !== 1) {
        const pos = { x: wrappedX, y: newY };
        playerRef.current = pos;
        setPlayer(pos);

        if (m[newY][wrappedX] === 2) {
          const newMaze = m.map(row => [...row]);
          newMaze[newY][wrappedX] = 0;
          mazeRef.current = newMaze;
          setMaze(newMaze);
          setScore(s => s + 10);
        }

        if (m[newY][wrappedX] === 3) {
          const newMaze = m.map(row => [...row]);
          newMaze[newY][wrappedX] = 0;
          mazeRef.current = newMaze;
          setMaze(newMaze);
          setScore(s => s + 50);
          vibrateSuccess();
          setPowerTimer(10);
          setGhosts(prev => prev.map(g => ({ ...g, isVulnerable: true })));
        }
      }
      // If wall: player stays put, direction retained (will try again next tick)
    }, MOVE_INTERVAL);

    return () => clearInterval(interval);
  }, [gameOver, isWon]);

  // Ghost movement
  useEffect(() => {
    if (gameOver || isWon) return;
    const interval = setInterval(() => {
      setGhosts(prev => prev.map(ghost => {
        const directions = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        const m = mazeRef.current;
        const possible = directions.filter(d => {
          const nx = ghost.x + d.dx;
          const ny = ghost.y + d.dy;
          return m[ny] && m[ny][nx] !== 1;
        });
        if (possible.length === 0) return ghost;
        const move = possible[Math.floor(Math.random() * possible.length)];
        return { ...ghost, x: ghost.x + move.dx, y: ghost.y + move.dy };
      }));
    }, 500);
    return () => clearInterval(interval);
  }, [gameOver, isWon]);

  // Collision check
  useEffect(() => {
    ghosts.forEach(ghost => {
      if (ghost.x === player.x && ghost.y === player.y) {
        if (ghost.isVulnerable) {
          setScore(s => s + 200);
          setGhosts(prev => prev.map(g =>
            (g.x === ghost.x && g.y === ghost.y) ? { ...g, x: 7, y: 7, isVulnerable: false } : g
          ));
        } else {
          vibrateGameOver();
          setGameOver(true);
        }
      }
    });
  }, [player, ghosts]);

  // Power timer
  useEffect(() => {
    if (powerTimer > 0) {
      const timer = setTimeout(() => {
        setPowerTimer(powerTimer - 1);
        if (powerTimer === 1) {
          setGhosts(prev => prev.map(g => ({ ...g, isVulnerable: false })));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [powerTimer]);

  // Keyboard input — changes direction
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': setDirection(0, -1); break;
        case 'ArrowDown': setDirection(0, 1); break;
        case 'ArrowLeft': setDirection(-1, 0); break;
        case 'ArrowRight': setDirection(1, 0); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setDirection]);

  // Swipe support
  const swipeHandlers = useSwipe(useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    switch (dir) {
      case 'up': setDirection(0, -1); break;
      case 'down': setDirection(0, 1); break;
      case 'left': setDirection(-1, 0); break;
      case 'right': setDirection(1, 0); break;
    }
  }, [setDirection]));

  const reset = () => {
    const pos = { x: 7, y: 11 };
    setPlayer(pos);
    playerRef.current = pos;
    directionRef.current = null;
    setGhosts([
      { x: 6, y: 7, spriteId: 92, isVulnerable: false },
      { x: 8, y: 7, spriteId: 93, isVulnerable: false },
    ]);
    setMaze(INITIAL_MAZE);
    mazeRef.current = INITIAL_MAZE;
    setScore(0);
    setGameOver(false);
    gameOverRef.current = false;
    setPowerTimer(0);
  };

  const cellPct = 100 / GRID_SIZE;

  return (
    <div className="flex flex-col items-center select-none">
      {/* Score */}
      <div className="mb-3 flex items-center gap-2 bg-black/30 px-4 py-1.5 rounded-full">
        <SpriteImage pokemonId={92} variant="sprite" size={24} />
        <span className="font-pixel text-sm text-white">{score}</span>
        {best.bestScore > 0 && <span className="font-pixel text-xs text-white/40 ml-1">Bedst: {best.bestScore}</span>}
      </div>

      {/* Maze */}
      <div
        {...swipeHandlers}
        className="relative rounded-lg overflow-hidden border-4 border-stone-800 touch-none w-[min(330px,85vw)] aspect-square"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          background: '#2D2D2D',
        }}
      >
        {/* Maze cells */}
        {maze.map((row, y) => row.map((cell, x) => (
          <div key={`${x}-${y}`} className="flex items-center justify-center">
            {cell === 1 && (
              <div className="w-full h-full bg-stone-700 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.3)]" />
            )}
            {cell === 2 && (
              <div className="w-2 h-2 bg-yellow-300 rounded-full shadow-[0_0_4px_rgba(253,224,71,0.8)]" />
            )}
            {cell === 3 && (
              <PokeBall size={14} variant="master" spinning className="animate-pulse" />
            )}
          </div>
        )))}

        {/* Player — Pokéball */}
        <div
          className="absolute z-10 flex items-center justify-center transition-all duration-100"
          style={{
            left: `${player.x * cellPct}%`,
            top: `${player.y * cellPct}%`,
            width: `${cellPct}%`,
            height: `${cellPct}%`,
          }}
        >
          <PokeBall size={18} />
        </div>

        {/* Ghosts — Gastly / Haunter */}
        {ghosts.map((ghost, i) => (
          <div
            key={i}
            className={`absolute z-10 flex items-center justify-center transition-all duration-500
              ${ghost.isVulnerable ? 'hue-rotate-180 animate-shake' : ''}`}
            style={{
              left: `${ghost.x * cellPct}%`,
              top: `${ghost.y * cellPct}%`,
              width: `${cellPct}%`,
              height: `${cellPct}%`,
            }}
          >
            <SpriteImage pokemonId={ghost.spriteId} variant="sprite" size={20} />
          </div>
        ))}

        {/* Game over */}
        {gameOver && (
          <GameOverlay
            variant="game-over"
            title="En vild Gastly dukkede op!"
            pokemonId={92}
            score={score}
            stars={stars}
            onAction={reset}
          />
        )}

        {/* Win */}
        {isWon && (
          <GameOverlay
            variant="victory"
            title="Hulen er ryddet!"
            pokemonId={94}
            score={score}
            stars={stars}
            onAction={reset}
          />
        )}
      </div>

      {/* D-Pad */}
      <DPad
        onUp={() => setDirection(0, -1)}
        onDown={() => setDirection(0, 1)}
        onLeft={() => setDirection(-1, 0)}
        onRight={() => setDirection(1, 0)}
        accentColor="#705848"
        center={powerTimer > 0 ? <PokeBall size={24} variant="master" spinning /> : undefined}
      />
    </div>
  );
};

export default PacmanGame;
