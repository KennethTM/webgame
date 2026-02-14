import { useState, useEffect, useCallback, useRef } from 'react';
import SpriteImage from '../../components/SpriteImage';
import DPad from '../../components/DPad';
import GameOverlay from '../../components/GameOverlay';
import { useSwipe } from '../../hooks/useSwipe';
import { vibrateSuccess, vibrateGameOver } from '../../hooks/useVibrate';
import { useHighScore } from '../../hooks/useHighScore';
import { useGameActive } from '../../hooks/useGameActive';

const GRID_SIZE = 15;
const INITIAL_SNAKE = [{ x: 7, y: 7 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const SPEED = 250;

interface Point {
  x: number;
  y: number;
}

const SnakeGame = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 3, y: 3 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlus, setShowPlus] = useState<Point | null>(null);

  const { best, submitScore } = useHighScore('snake');
  const { setGameActive } = useGameActive();
  const stars = score >= 15 ? 3 : score >= 8 ? 2 : score >= 3 ? 1 : 0;

  useEffect(() => { setGameActive(isPlaying); return () => setGameActive(false); }, [isPlaying, setGameActive]);

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dirRef = useRef(INITIAL_DIRECTION);

  // Keep dirRef in sync
  useEffect(() => { dirRef.current = direction; }, [direction]);

  const generateFood = useCallback(() => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = snake.some(s => s.x === newFood.x && s.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  }, [snake]);

  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying) return;

    setSnake((prev) => {
      const head = prev[0];
      const d = dirRef.current;
      const newHead = { x: head.x + d.x, y: head.y + d.y };

      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prev.some(s => s.x === newHead.x && s.y === newHead.y)
      ) {
        setGameOver(true);
        setIsPlaying(false);
        vibrateGameOver();
        return prev;
      }

      const newSnake = [newHead, ...prev];
      if (newHead.x === food.x && newHead.y === food.y) {
        vibrateSuccess();
        setScore(s => s + 1);
        setShowPlus(newHead);
        setTimeout(() => setShowPlus(null), 600);
        generateFood();
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [food, gameOver, isPlaying, generateFood]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, SPEED - Math.min(score * 2, 100));
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [isPlaying, gameOver, moveSnake, score]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const d = dirRef.current;
    switch (e.key) {
      case 'ArrowUp': if (d.y === 0) setDirection({ x: 0, y: -1 }); break;
      case 'ArrowDown': if (d.y === 0) setDirection({ x: 0, y: 1 }); break;
      case 'ArrowLeft': if (d.x === 0) setDirection({ x: -1, y: 0 }); break;
      case 'ArrowRight': if (d.x === 0) setDirection({ x: 1, y: 0 }); break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    dirRef.current = INITIAL_DIRECTION;
    setGameOver(false);
    setScore(0);
    setIsPlaying(true);
    generateFood();
  };

  // Submit score on game over
  useEffect(() => {
    if (gameOver && score > 0) submitScore(score, stars);
  }, [gameOver, score, stars, submitScore]);

  // Swipe support for tablet play
  const swipeHandlers = useSwipe(useCallback((dir) => {
    const d = dirRef.current;
    switch (dir) {
      case 'up': if (d.y === 0) setDirection({ x: 0, y: -1 }); break;
      case 'down': if (d.y === 0) setDirection({ x: 0, y: 1 }); break;
      case 'left': if (d.x === 0) setDirection({ x: -1, y: 0 }); break;
      case 'right': if (d.x === 0) setDirection({ x: 1, y: 0 }); break;
    }
  }, []));

  // Rotation for Ekans head based on direction
  const headRotation = direction.x === 1 ? 90 : direction.x === -1 ? -90 : direction.y === 1 ? 180 : 0;

  return (
    <div className="flex flex-col items-center select-none">
      {/* Score banner */}
      <div className="mb-3 flex items-center gap-2 bg-black/30 px-4 py-1.5 rounded-full">
        <SpriteImage pokemonId={23} variant="sprite" size={24} />
        <span className="font-pixel text-sm text-white">{score}</span>
        {best.bestScore > 0 && <span className="font-pixel text-xs text-white/40 ml-1">Best: {best.bestScore}</span>}
      </div>

      {/* Board */}
      <div
        {...swipeHandlers}
        className="relative rounded-lg shadow-inner overflow-hidden border-4 border-green-900 touch-manipulation w-[min(330px,85vw)] aspect-square"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {/* Checkerboard grass pattern */}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          return (
            <div
              key={i}
              className={(x + y) % 2 === 0 ? 'bg-green-600' : 'bg-green-500'}
              style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
            />
          );
        })}

        {/* Snake body */}
        {snake.map((segment, i) => (
          <div
            key={i}
            className="z-[2] flex items-center justify-center"
            style={{
              gridColumnStart: segment.x + 1,
              gridRowStart: segment.y + 1,
            }}
          >
            {i === 0 ? (
              <div style={{ transform: `rotate(${headRotation}deg)` }} className="w-full h-full flex items-center justify-center">
                <SpriteImage pokemonId={23} variant="sprite" size={22} />
              </div>
            ) : (
              <div
                className="w-[85%] h-[85%] rounded-sm"
                style={{ backgroundColor: i % 2 === 0 ? '#7B3FA0' : '#9B59B6' }}
              />
            )}
          </div>
        ))}

        {/* Food — berry with pulse */}
        <div
          className="z-[2] flex items-center justify-center animate-pulse"
          style={{
            gridColumnStart: food.x + 1,
            gridRowStart: food.y + 1,
          }}
        >
          <div className="relative">
            <div className="w-4 h-4 bg-gradient-to-br from-pink-400 to-red-500 rounded-full border-2 border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full" />
          </div>
        </div>

        {/* +1 float-up */}
        {showPlus && (
          <div
            className="z-10 animate-float-up font-pixel text-xs text-pokemon-yellow pointer-events-none flex items-start justify-center"
            style={{
              gridColumnStart: showPlus.x + 1,
              gridRowStart: showPlus.y + 1,
            }}
          >
            +1
          </div>
        )}

        {/* Idle overlay */}
        {!isPlaying && !gameOver && (
          <GameOverlay
            variant="idle"
            title="PokéSnake"
            subtitle="Help Ekans eat berries!"
            pokemonId={23}
            onAction={startGame}
          />
        )}

        {/* Game over overlay */}
        {gameOver && (
          <GameOverlay
            variant="game-over"
            title="Ekans fainted!"
            pokemonId={23}
            score={score}
            stars={stars}
            onAction={startGame}
          />
        )}
      </div>

      {/* D-Pad */}
      <DPad
        onUp={() => { if (dirRef.current.y === 0) setDirection({ x: 0, y: -1 }); }}
        onDown={() => { if (dirRef.current.y === 0) setDirection({ x: 0, y: 1 }); }}
        onLeft={() => { if (dirRef.current.x === 0) setDirection({ x: -1, y: 0 }); }}
        onRight={() => { if (dirRef.current.x === 0) setDirection({ x: 1, y: 0 }); }}
        accentColor="#78C850"
      />
    </div>
  );
};

export default SnakeGame;
