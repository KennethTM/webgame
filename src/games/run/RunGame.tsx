import { useState, useEffect, useCallback, useRef } from 'react';
import SpriteImage from '../../components/SpriteImage';
import PokeBall from '../../components/PokeBall';
import GameOverlay from '../../components/GameOverlay';
import { useHighScore } from '../../hooks/useHighScore';
import { useGameActive } from '../../hooks/useGameActive';

const TOUCH_GUARD_MS = 400;

// --- constants ---
const GRAVITY = 0.55;
const JUMP_STRENGTH = -14;
const GROUND_Y = 0;
const PIKACHU_X = 60;
const PIKACHU_W = 44;
const PIKACHU_H = 44;
const PLAY_W = 400;
const PLAY_H = 280;
const GROUND_H = 48;
const INITIAL_SPEED = 2.2;
const MAX_SPEED = 5;
const SPEED_RAMP = 0.0002;

interface Obstacle { x: number; type: 'geodude' | 'diglett'; scale: number; }
interface Pokeball { x: number; y: number; }
interface Cloud { x: number; y: number; w: number; speed: number; }

// Snapshot of all visual state — set once per frame
interface Frame {
  pikachuY: number;
  obstacles: Obstacle[];
  pokeballs: Pokeball[];
  clouds: Cloud[];
}

const INITIAL_CLOUDS: Cloud[] = [
  { x: 40, y: 30, w: 80, speed: 0.3 },
  { x: 200, y: 55, w: 100, speed: 0.2 },
  { x: 320, y: 20, w: 60, speed: 0.35 },
  { x: 120, y: 70, w: 70, speed: 0.15 },
];

const INITIAL_FRAME: Frame = {
  pikachuY: 0,
  obstacles: [],
  pokeballs: [],
  clouds: INITIAL_CLOUDS.map(c => ({ ...c })),
};

const RunGame = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'game-over'>('idle');
  const [score, setScore] = useState(0);
  const [frame, setFrame] = useState<Frame>(INITIAL_FRAME);

  const { best, submitScore } = useHighScore('run');
  const { setGameActive } = useGameActive();

  useEffect(() => { setGameActive(gameState === 'playing'); return () => setGameActive(false); }, [gameState, setGameActive]);

  // Mutable engine state kept in a single ref to avoid stale closures
  const engine = useRef({
    speed: INITIAL_SPEED,
    pikachuY: GROUND_Y,
    velocity: 0,
    obstacles: [] as (Obstacle & { scored: boolean })[],
    pokeballs: [] as (Pokeball & { collected: boolean })[],
    clouds: INITIAL_CLOUDS.map(c => ({ ...c })),
    spawnAcc: 0,
    score: 0,
  });
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTouchRef = useRef(0);

  const startGame = useCallback(() => {
    const e = engine.current;
    e.speed = INITIAL_SPEED;
    e.pikachuY = GROUND_Y;
    e.velocity = 0;
    e.obstacles = [];
    e.pokeballs = [];
    e.clouds = INITIAL_CLOUDS.map(c => ({ ...c }));
    e.spawnAcc = 0;
    e.score = 0;
    setScore(0);
    setFrame(INITIAL_FRAME);
    setGameState('playing');
  }, []);

  const handleJump = useCallback(() => {
    const e = engine.current;
    if (e.pikachuY <= GROUND_Y + 1 && e.velocity >= 0) {
      e.velocity = JUMP_STRENGTH;
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleJump]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    loopRef.current = setInterval(() => {
      const e = engine.current;

      // --- Pikachu physics ---
      e.velocity += GRAVITY;
      e.pikachuY = Math.max(GROUND_Y, e.pikachuY - e.velocity);
      if (e.pikachuY <= GROUND_Y) {
        e.pikachuY = GROUND_Y;
        if (e.velocity < 0) e.velocity = 0;
      }

      // --- Scroll obstacles ---
      for (const obs of e.obstacles) obs.x -= e.speed;
      e.obstacles = e.obstacles.filter(o => o.x > -60);

      // --- Scroll pokéballs ---
      for (const b of e.pokeballs) { if (!b.collected) b.x -= e.speed; }
      e.pokeballs = e.pokeballs.filter(b => b.x > -30 && !b.collected);

      // --- Scroll clouds ---
      for (const c of e.clouds) {
        c.x -= e.speed * c.speed;
        if (c.x < -c.w) c.x = PLAY_W + 20;
      }

      // --- Spawn ---
      e.spawnAcc += e.speed;
      if (e.spawnAcc > 220) {
        e.spawnAcc = 0;
        if (Math.random() < 0.65) {
          const scale = 0.7 + Math.random() * 0.6; // 0.7–1.3
          e.obstacles.push({
            x: PLAY_W + 10,
            type: Math.random() < 0.5 ? 'geodude' : 'diglett',
            scale,
            scored: false,
          });
        } else {
          e.pokeballs.push({
            x: PLAY_W + 10,
            y: Math.random() < 0.5 ? 0 : 50,
            collected: false,
          });
        }
      }

      // --- Collision ---
      const py = e.pikachuY;
      for (const obs of e.obstacles) {
        const baseSize = obs.type === 'geodude' ? 38 : 30;
        const obsW = Math.round(baseSize * obs.scale);
        const obsH = Math.round(baseSize * obs.scale);
        const shrink = 0.25;
        if (
          PIKACHU_X + PIKACHU_W * (1 - shrink) > obs.x + obsW * shrink &&
          PIKACHU_X + PIKACHU_W * shrink < obs.x + obsW * (1 - shrink) &&
          py < obsH * (1 - shrink) &&
          py + PIKACHU_H * (1 - shrink) > 0
        ) {
          setGameState('game-over');
          return;
        }
      }

      // --- Pokéball collection ---
      for (const b of e.pokeballs) {
        if (b.collected) continue;
        if (
          PIKACHU_X + PIKACHU_W > b.x &&
          PIKACHU_X < b.x + 24 &&
          py < b.y + 44 &&
          py + PIKACHU_H > b.y
        ) {
          b.collected = true;
          e.score += 1;
          setScore(e.score);
        }
      }

      // --- Speed ramp ---
      e.speed = Math.min(MAX_SPEED, e.speed + SPEED_RAMP);

      // --- Push render snapshot ---
      setFrame({
        pikachuY: e.pikachuY,
        obstacles: e.obstacles.map(o => ({ x: o.x, type: o.type, scale: o.scale })),
        pokeballs: e.pokeballs.filter(b => !b.collected).map(b => ({ x: b.x, y: b.y })),
        clouds: e.clouds.map(c => ({ ...c })),
      });
    }, 1000 / 60);

    return () => { if (loopRef.current) clearInterval(loopRef.current); };
  }, [gameState]);

  const stars = score >= 20 ? 3 : score >= 10 ? 2 : score >= 5 ? 1 : 0;

  // Submit score on game over
  useEffect(() => {
    if (gameState === 'game-over' && score > 0) submitScore(score, stars);
  }, [gameState, score, stars, submitScore]);

  const pikachuBottom = GROUND_H + frame.pikachuY;

  return (
    <div className="flex flex-col items-center select-none w-full max-w-md">
      {gameState !== 'idle' && (
        <div className="mb-3 flex items-center gap-2 bg-black/30 px-4 py-1.5 rounded-full">
          <SpriteImage pokemonId={25} variant="sprite" size={24} />
          <span className="font-pixel text-sm text-white">{score}</span>
          {best.bestScore > 0 && <span className="font-pixel text-xs text-white/40 ml-1">Bedst: {best.bestScore}</span>}
        </div>
      )}

      <div
        className="relative rounded-2xl border-4 border-white/20 shadow-2xl overflow-hidden"
        style={{
          width: PLAY_W,
          height: PLAY_H,
          background: 'linear-gradient(to bottom, #fdba74 0%, #7dd3fc 30%, #bae6fd 100%)',
        }}
      >
        {/* Clouds */}
        {frame.clouds.map((cloud, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/50"
            style={{
              left: cloud.x, top: cloud.y,
              width: cloud.w, height: cloud.w * 0.35,
              filter: 'blur(3px)',
            }}
          />
        ))}

        {/* Ground */}
        <div
          className="absolute bottom-0 w-full bg-gradient-to-t from-green-700 to-green-500"
          style={{ height: GROUND_H }}
        >
          <div className="absolute top-0 left-0 w-full flex justify-around -translate-y-1/2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-1 bg-green-600 rounded-t-full" style={{ height: 6 + (i % 3) * 4 }} />
            ))}
          </div>
        </div>

        {/* Pikachu */}
        <div
          className="absolute z-10"
          style={{ left: PIKACHU_X, bottom: pikachuBottom, width: PIKACHU_W, height: PIKACHU_H }}
        >
          <SpriteImage pokemonId={25} variant="sprite" size={PIKACHU_W} />
        </div>

        {/* Obstacles */}
        {frame.obstacles.map((obs, i) => {
          const baseSize = obs.type === 'geodude' ? 38 : 30;
          const size = Math.round(baseSize * obs.scale);
          return (
            <div
              key={`obs-${i}`}
              className="absolute z-[5]"
              style={{
                left: obs.x, bottom: GROUND_H,
                width: size, height: size,
              }}
            >
              <SpriteImage pokemonId={obs.type === 'geodude' ? 74 : 50} variant="sprite" size={size} />
            </div>
          );
        })}

        {/* Pokéballs */}
        {frame.pokeballs.map((b, i) => (
          <div
            key={`ball-${i}`}
            className="absolute z-[5]"
            style={{ left: b.x, bottom: GROUND_H + b.y + 10 }}
          >
            <PokeBall size={22} />
          </div>
        ))}

        {gameState === 'idle' && (
          <GameOverlay variant="idle" title="PokéRun" subtitle="Saml PokéBalls og undgå Pokémon!" pokemonId={25} onAction={startGame} />
        )}
        {gameState === 'game-over' && (
          <GameOverlay variant="game-over" title="Pikachu besvimede!" pokemonId={25} score={score} stars={stars} onAction={startGame} />
        )}
      </div>

      {gameState === 'playing' && (
        <button
          onTouchStart={(e) => { e.preventDefault(); lastTouchRef.current = Date.now(); handleJump(); }}
          onMouseDown={() => { if (Date.now() - lastTouchRef.current > TOUCH_GUARD_MS) handleJump(); }}
          onContextMenu={(e) => e.preventDefault()}
          className="mt-5 w-32 h-32 bg-gradient-to-b from-pokemon-yellow to-pokemon-gold rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-4 border-white/30 touch-none"
        >
          <div className="flex flex-col items-center gap-1">
            <PokeBall size={36} />
            <span className="font-pixel text-[11px] text-gray-800">HOP</span>
          </div>
        </button>
      )}
    </div>
  );
};

export default RunGame;
