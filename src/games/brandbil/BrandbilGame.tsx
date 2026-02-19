import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { vibrateSuccess, vibrateVictory } from '../../hooks/useVibrate';

type GameState = 'idle' | 'playing' | 'won';

interface FireSpot {
  id: number;
  xPct: number;
  yPct: number;
  size: number;
  active: boolean;
  extinguishing: boolean;
  extinguished: boolean;
  growTick: number;
  extinguishTick: number;
  respawnTick: number;
}

interface WaterJet { id: number; xPct: number; yPct: number; }
interface ScorePopup { id: number; xPct: number; yPct: number; }
interface EngineState {
  fires: FireSpot[];
  ticks: number;
  extinguishedTotal: number;
  waterJetId: number;
  scorePopId: number;
}

const FIRE_POSITIONS = [
  { xPct: 10, yPct: 28 },
  { xPct: 27, yPct: 20 },
  { xPct: 44, yPct: 30 },
  { xPct: 58, yPct: 18 },
  { xPct: 72, yPct: 26 },
  { xPct: 86, yPct: 22 },
  { xPct: 22, yPct: 55 },
  { xPct: 66, yPct: 52 },
];

const BUILDINGS = [
  { xPct: 4,  widthPct: 13, heightPct: 40 },
  { xPct: 19, widthPct: 15, heightPct: 50 },
  { xPct: 36, widthPct: 13, heightPct: 36 },
  { xPct: 51, widthPct: 14, heightPct: 58 },
  { xPct: 66, widthPct: 13, heightPct: 44 },
  { xPct: 80, widthPct: 13, heightPct: 38 },
];

// Pre-computed stable window patterns — no Math.random() in render
const BUILDING_WINDOWS = [
  [true, false, true, true, false, true],
  [false, true, false, true, true, false],
  [true, true, false, false, true, false],
  [false, false, true, false, true, true],
  [true, false, true, false, false, true],
  [false, true, true, false, true, false],
];

const TICK_MS = 50;
const SIZE_GROW_TICKS = 80;
const RESPAWN_TICKS = 40;
const MAX_SIMULTANEOUS = 3;
const WIN_COUNT = 10;

const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#f97316', '#fbbf24', '#10b981', '#3b82f6'];
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  key: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${(i * 4.3 + 2) % 100}%`,
  delay: `${(i * 0.09) % 2}s`,
  size: `${10 + (i % 5) * 2}px`,
}));

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const buildInitialFires = (): FireSpot[] => {
  const activeIndices = new Set(shuffle(FIRE_POSITIONS.map((_, i) => i)).slice(0, MAX_SIMULTANEOUS));
  return FIRE_POSITIONS.map((pos, i) => ({
    id: i,
    xPct: pos.xPct,
    yPct: pos.yPct,
    size: 0,
    active: activeIndices.has(i),
    extinguishing: false,
    extinguished: false,
    growTick: 0,
    extinguishTick: 0,
    respawnTick: 0,
  }));
};

const BrandbilGame = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [fires, setFires] = useState<FireSpot[]>([]);
  const [waterJets, setWaterJets] = useState<WaterJet[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [extinguishedTotal, setExtinguishedTotal] = useState(0);

  const engine = useRef<EngineState>({
    fires: [], ticks: 0, extinguishedTotal: 0, waterJetId: 0, scorePopId: 0,
  });

  const confettiPieces = useMemo(() => CONFETTI_PIECES, []);

  const startGame = useCallback(() => {
    const initialFires = buildInitialFires();
    engine.current.fires = initialFires.map(f => ({ ...f }));
    engine.current.ticks = 0;
    engine.current.extinguishedTotal = 0;
    setFires([...initialFires]);
    setWaterJets([]);
    setScorePopups([]);
    setExtinguishedTotal(0);
    setGameState('playing');
  }, []);

  const handleFireTap = useCallback((fireId: number, xPct: number, yPct: number) => {
    const e = engine.current;
    const fire = e.fires.find(f => f.id === fireId);
    if (!fire || !fire.active || fire.extinguishing || fire.extinguished) return;

    fire.extinguishing = true;
    fire.extinguishTick = 0;
    e.extinguishedTotal++;
    vibrateSuccess();

    const jid = ++e.waterJetId;
    setWaterJets(w => [...w, { id: jid, xPct, yPct }]);
    setTimeout(() => setWaterJets(w => w.filter(j => j.id !== jid)), 600);

    const pid = ++e.scorePopId;
    setScorePopups(p => [...p, { id: pid, xPct, yPct }]);
    setTimeout(() => setScorePopups(p => p.filter(s => s.id !== pid)), 950);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const e = engine.current;
      e.ticks++;

      // Grow active fires
      for (const fire of e.fires) {
        if (!fire.active || fire.extinguishing || fire.extinguished) continue;
        fire.growTick++;
        if (fire.growTick >= SIZE_GROW_TICKS && fire.size < 2) {
          fire.size++;
          fire.growTick = 0;
        }
      }

      // Extinguishing countdown
      for (const fire of e.fires) {
        if (!fire.extinguishing) continue;
        fire.extinguishTick++;
        if (fire.extinguishTick >= 10) {
          fire.extinguishing = false;
          fire.extinguished = true;
          fire.active = false;
          fire.respawnTick = 0;
        }
      }

      // Increment respawn timers
      for (const fire of e.fires) {
        if (fire.extinguished) fire.respawnTick++;
      }

      // Random respawn: pick one eligible fire randomly
      const activeCount = e.fires.filter(f => f.active && !f.extinguishing).length;
      const eligible = e.fires.filter(f => f.extinguished && f.respawnTick >= RESPAWN_TICKS);
      if (eligible.length > 0 && activeCount < MAX_SIMULTANEOUS) {
        const pick = eligible[Math.floor(Math.random() * eligible.length)];
        pick.extinguished = false;
        pick.active = true;
        pick.size = 0;
        pick.growTick = 0;
      }

      setFires(e.fires.map(f => ({ ...f })));
      setExtinguishedTotal(e.extinguishedTotal);

      if (e.extinguishedTotal >= WIN_COUNT) {
        vibrateVictory();
        setGameState('won');
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [gameState]);

  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-8 p-6 select-none">
        <span className="text-8xl animate-bounce" role="img" aria-label="Brandbil">🚒</span>
        <h2 className="font-pixel text-base text-white text-center leading-relaxed">Brandbil</h2>
        <p className="text-white/80 text-xl text-center px-4 max-w-xs">Tryk på ilden for at slukke den!</p>
        <button
          onClick={startGame}
          className="bg-red-500 hover:bg-red-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
          style={{ minWidth: '200px', minHeight: '80px' }}
        >
          Start! 🔥
        </button>
      </div>
    );
  }

  const progressPct = (extinguishedTotal / WIN_COUNT) * 100;

  return (
    <div className="relative w-full h-full select-none overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Night sky gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #0f0f1a 0%, #1e1b2e 35%, #2d1f1f 65%, #3d2a1a 100%)',
      }} />

      {/* Ambient fire glow at horizon */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 80%, rgba(251,100,36,0.28) 0%, transparent 60%)',
      }} />

      {/* Stars */}
      {[8, 15, 24, 33, 47, 58, 69, 77, 88, 92, 11, 38, 62, 84].map((left, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{ left: `${left}%`, top: `${2 + (i % 6) * 2.5}%`, width: `${1.5 + (i % 3)}px`, height: `${1.5 + (i % 3)}px`, opacity: 0.5 + (i % 4) * 0.12 }} />
      ))}

      {/* Moon */}
      <div className="absolute rounded-full" style={{ top: '4%', right: '6%', width: '32px', height: '32px', background: '#fef9c3', boxShadow: '0 0 18px 6px rgba(254,249,195,0.3)' }} />

      {/* Building silhouettes */}
      {BUILDINGS.map((b, i) => {
        const buildingFire = fires.find(f => f.id === i);
        const onFire = buildingFire?.active && !buildingFire?.extinguishing;
        const fireSize = buildingFire?.size ?? 0;
        const glowAlpha = onFire ? 0.35 + fireSize * 0.15 : 0;
        const glowRadius = onFire ? 14 + fireSize * 10 : 0;
        return (
          <div key={i} className="absolute" style={{
            left: `${b.xPct}%`,
            bottom: '18%',
            width: `${b.widthPct}%`,
            height: `${b.heightPct}%`,
            background: i % 2 === 0 ? '#12151f' : '#0a0c14',
            borderRadius: '3px 3px 0 0',
            boxShadow: glowRadius > 0 ? `0 0 ${glowRadius}px ${glowRadius / 2}px rgba(251,146,60,${glowAlpha})` : 'none',
            transition: 'box-shadow 0.4s ease',
            zIndex: 5,
          }}>
            {/* Windows */}
            {[[18,16],[58,16],[18,42],[58,42],[18,68],[58,68]].map(([wx, wy], wi) => {
              const lit = BUILDING_WINDOWS[i]?.[wi] ?? false;
              const winColor = onFire && lit
                ? `rgba(251,146,60,${0.75 + fireSize * 0.1})`
                : lit ? 'rgba(254,240,138,0.65)' : 'rgba(20,24,36,0.9)';
              return (
                <div key={wi} className="absolute rounded-sm" style={{
                  left: `${wx}%`, top: `${wy}%`,
                  width: '20%', height: '11%',
                  background: winColor,
                  transition: 'background 0.3s ease',
                  boxShadow: lit && onFire ? `0 0 6px rgba(251,146,60,0.8)` : 'none',
                }} />
              );
            })}
          </div>
        );
      })}

      {/* Ground / road */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '20%', background: '#1a1a2e' }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '13%', background: '#16213e' }} />
      {/* Pavement lines */}
      {[8, 24, 40, 56, 72, 88].map(left => (
        <div key={left} className="absolute rounded-full"
          style={{ bottom: '7%', left: `${left}%`, width: '7%', height: '2.5px', background: 'rgba(253,224,71,0.5)' }} />
      ))}

      {/* Fire truck — bigger, more detailed */}
      <div className="absolute" style={{ bottom: '14.5%', left: '1%', zIndex: 8 }}>
        {/* Truck body */}
        <div className="relative" style={{ width: '120px', height: '50px' }}>
          {/* Main body */}
          <div className="absolute rounded-lg" style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)',
            left: 0, top: 0, right: 0, bottom: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }} />
          {/* Cab */}
          <div className="absolute rounded-md" style={{
            background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
            right: 0, top: '-22px', width: '42%', height: '28px',
          }}>
            {/* Cab window */}
            <div className="absolute rounded" style={{ top: '4px', left: '4px', right: '6px', height: '12px', background: 'rgba(186,230,253,0.8)' }} />
          </div>
          {/* Ladder rack */}
          <div className="absolute rounded" style={{ top: '-8px', left: '5%', right: '42%', height: '5px', background: '#d1d5db', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          {/* Siren lights */}
          <div className="absolute rounded" style={{
            top: '-13px', left: '10%', width: '40px', height: '8px',
            background: 'linear-gradient(90deg, #ef4444 0%, #fbbf24 50%, #ef4444 100%)',
            animation: 'pulse 0.8s ease-in-out infinite',
            boxShadow: '0 0 8px rgba(239,68,68,0.8)',
          }} />
          {/* Hose line */}
          <div className="absolute rounded" style={{
            right: '-28px', top: '45%',
            width: '34px', height: '4px',
            background: 'linear-gradient(90deg, #fbbf24, rgba(251,191,36,0.3))',
            transformOrigin: 'left center',
            transform: 'rotate(-4deg)',
          }} />
          {/* Headlight */}
          <div className="absolute rounded-full" style={{ right: '4px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '10px', background: '#fef08a', boxShadow: '0 0 6px #fef08a' }} />
          {/* Stripe */}
          <div className="absolute" style={{ left: '5%', right: '42%', top: '50%', transform: 'translateY(-50%)', height: '3px', background: 'rgba(254,240,138,0.6)', borderRadius: '2px' }} />
          {/* Wheels */}
          {[{ left: '8%' }, { right: '14%' }].map((pos, i) => (
            <div key={i} className="absolute rounded-full" style={{
              ...pos, bottom: '-14px', width: '30px', height: '30px',
              background: '#111827', border: '4px solid #374151',
            }}>
              <div className="absolute rounded-full bg-gray-500" style={{ inset: '6px' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Fires */}
      {fires.map(fire => {
        if (!fire.active && !fire.extinguishing && !fire.extinguished) return null;
        const fontSize = fire.size === 0 ? '2.2rem' : fire.size === 1 ? '3.2rem' : '4rem';
        const glowSize = 10 + fire.size * 10;
        const flickerDuration = fire.size === 2 ? '0.28s' : '0.55s';
        const showSteam = fire.extinguishing;

        return (
          <div key={fire.id} style={{ position: 'absolute', left: `${fire.xPct}%`, top: `${fire.yPct}%`, transform: 'translate(-50%, -50%)', zIndex: 15 }}>
            {/* Smoke rising from fire (size >= 1) */}
            {fire.active && !fire.extinguishing && fire.size >= 1 && (
              <>
                <div className="absolute pointer-events-none animate-smoke-rise" style={{ left: '50%', top: '-8px', fontSize: fire.size === 2 ? '1.4rem' : '1rem' }}>☁️</div>
                <div className="absolute pointer-events-none animate-smoke-rise-d" style={{ left: '30%', top: '-6px', fontSize: '0.9rem' }}>💨</div>
              </>
            )}

            {/* Steam when extinguishing */}
            {showSteam && (
              <div className="absolute pointer-events-none animate-bubble-rise" style={{ left: '50%', top: '-4px', fontSize: '2rem' }}>💨</div>
            )}

            {/* Fire tap target */}
            <div
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: '90px', height: '90px',
                touchAction: 'none',
                opacity: fire.extinguished ? 0 : fire.extinguishing ? 0.12 : 1,
                transition: 'opacity 0.45s ease',
              }}
              onPointerDown={(e) => { e.preventDefault(); handleFireTap(fire.id, fire.xPct, fire.yPct); }}
              role="button"
              aria-label="Ild — tryk for at slukke"
            >
              <span className="select-none leading-none animate-fire-flicker" style={{
                fontSize,
                animationDuration: flickerDuration,
                filter: `drop-shadow(0 0 ${glowSize}px rgba(251,146,60,0.98)) drop-shadow(0 0 ${glowSize / 2}px rgba(239,68,68,0.7))`,
                display: 'block',
              }}>🔥</span>
            </div>
          </div>
        );
      })}

      {/* Water jet effects */}
      {waterJets.map(jet => (
        <div key={jet.id} className="absolute pointer-events-none animate-water-splash"
          style={{ left: `${jet.xPct}%`, top: `${jet.yPct}%`, transform: 'translate(-50%, -50%)', zIndex: 26, fontSize: '3.8rem' }}>
          💦
        </div>
      ))}

      {/* Score popups */}
      {scorePopups.map(pop => (
        <div key={pop.id} className="absolute pointer-events-none animate-score-pop"
          style={{ left: `${pop.xPct}%`, top: `${pop.yPct - 6}%`, zIndex: 30, color: '#fbbf24', fontWeight: 'bold', fontSize: '1.6rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)', whiteSpace: 'nowrap' }}>
          +1 🔥
        </div>
      ))}

      {/* Progress bar + counter */}
      <div className="absolute bottom-2 left-0 right-0 z-10 flex flex-col items-center gap-1.5 px-6">
        <div className="bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-white font-bold text-base">
          🔥 {extinguishedTotal} / {WIN_COUNT} slukket
        </div>
        <div className="w-full max-w-xs rounded-full h-3.5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #f97316, #ef4444)' }} />
        </div>
      </div>

      {/* Win overlay */}
      {gameState === 'won' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80">
          {confettiPieces.map(p => (
            <div key={p.key} className="absolute top-0 animate-confetti-fall"
              style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color, borderRadius: '3px', animationDelay: p.delay }} />
          ))}
          <span className="text-8xl mb-4 animate-bounce">🚒</span>
          <h2 className="font-pixel text-sm text-white mb-2 text-center px-4">Godt klaret!</h2>
          <p className="text-white/80 text-xl mb-8 text-center">Du slukkede alle 10 brande!</p>
          <button
            onClick={startGame}
            className="bg-red-500 hover:bg-red-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
            style={{ minWidth: '200px', minHeight: '80px' }}
          >
            Spil igen! 🔥
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandbilGame;
