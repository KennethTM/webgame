import { useState, useRef, useCallback, useMemo } from 'react';
import { vibrateSuccess, vibrateVictory } from '../../hooks/useVibrate';

type GameState = 'idle' | 'playing' | 'won';
type ArmPhase = 'idle' | 'scooping' | 'dumping' | 'returning';
type TruckPhase = 'arrive' | 'idle' | 'depart';

interface GroundItem {
  id: number;
  emoji: string;
  label: string;
  xPct: number;
  visible: boolean;
  beingScooped: boolean;
}

const ITEM_POOL = [
  { emoji: '🦖', label: 'Dinosaur' },
  { emoji: '🐸', label: 'Frø' },
  { emoji: '🧸', label: 'Bamse' },
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '🚀', label: 'Raket' },
  { emoji: '⭐', label: 'Stjerne' },
  { emoji: '💎', label: 'Diamant' },
  { emoji: '🪨', label: 'Sten' },
];

const ITEM_POSITIONS = [20, 50, 80];
const LOADS_PER_TRUCK = 2;
const TRUCKS_TO_WIN = 2;

const PRAISE_WORDS = ['Flot!', 'Fedt!', 'Super!', 'Godt!'];

const TRUCK_COLORS = [
  { from: '#ea580c', to: '#c2410c' }, // orange
  { from: '#2563eb', to: '#1d4ed8' }, // blue
  { from: '#16a34a', to: '#15803d' }, // green
];

const ARM_ROTATION: Record<ArmPhase, number> = {
  idle: 0,
  scooping: 45,
  dumping: -30,
  returning: 0,
};

const ARM_CLASS: Record<ArmPhase, string> = {
  idle: '',
  scooping: 'animate-arm-scoop',
  dumping: 'animate-arm-dump',
  returning: 'animate-arm-return',
};

const CONFETTI_COLORS = ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#f97316', '#a855f7'];
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  key: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${(i * 4.3 + 2) % 100}%`,
  delay: `${(i * 0.08) % 1.8}s`,
  size: `${10 + (i % 5) * 2}px`,
}));

const GROUND_PEBBLES = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 4.1 + 1.5) % 97,
  y: 10 + (i * 9.7) % 74,
  w: 4 + (i * 3) % 14,
  h: 3 + (i * 2) % 8,
  shade: i % 3,
}));

const PEBBLE_COLORS = ['#5c1e0a', '#854d0e', '#6b2f0a'] as const;

// Pre-computed dirt particle offsets
const DIRT_PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  key: i,
  dx: `${-20 + (i * 13) % 50}px`,
  dy: `${-30 - (i * 11) % 40}px`,
  size: 6 + (i * 3) % 8,
  delay: (i * 0.05),
}));

let itemIdCounter = 0;
let praiseIndex = 0;

const pickRandomItems = (count: number, exclude: string[] = []): GroundItem[] => {
  const available = ITEM_POOL.filter(it => !exclude.includes(it.emoji));
  const pool = available.length >= count ? available : ITEM_POOL;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((it, i) => ({
    id: ++itemIdCounter,
    emoji: it.emoji,
    label: it.label,
    xPct: ITEM_POSITIONS[i],
    visible: true,
    beingScooped: false,
  }));
};

const GravemaskineGame = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [armPhase, setArmPhase] = useState<ArmPhase>('idle');
  const [groundItems, setGroundItems] = useState<GroundItem[]>([]);
  const [heldItem, setHeldItem] = useState<GroundItem | null>(null);
  const [truckItems, setTruckItems] = useState<string[]>([]);
  const [loadsDumped, setLoadsDumped] = useState(0);
  const [truckPhase, setTruckPhase] = useState<TruckPhase>('idle');
  const [dropParticle, setDropParticle] = useState<{ id: number; emoji: string } | null>(null);
  const [dirtBurst, setDirtBurst] = useState<{ id: number; xPct: number } | null>(null);
  const [praiseText, setPraiseText] = useState<{ id: number; text: string } | null>(null);
  const [labelPop, setLabelPop] = useState<{ id: number; text: string; xPct: number } | null>(null);
  const [truckBounce, setTruckBounce] = useState(false);
  const [truckColorIdx, setTruckColorIdx] = useState(0);

  const armPhaseRef = useRef<ArmPhase>('idle');
  const truckItemsRef = useRef<string[]>([]);
  const loadsDumpedRef = useRef(0);
  const dropParticleId = useRef(0);
  const dirtBurstId = useRef(0);
  const praiseId = useRef(0);
  const labelPopId = useRef(0);

  const confettiPieces = useMemo(() => CONFETTI_PIECES, []);

  const setArm = useCallback((phase: ArmPhase) => {
    armPhaseRef.current = phase;
    setArmPhase(phase);
  }, []);

  const spawnFreshItem = useCallback((scoopedXPct: number) => {
    setTimeout(() => {
      setGroundItems(prev => {
        const position = ITEM_POSITIONS.find(p => Math.abs(p - scoopedXPct) < 8) ?? scoopedXPct;
        const existingEmojis = prev.filter(it => it.visible).map(it => it.emoji);
        const newItem: GroundItem = { ...pickRandomItems(1, existingEmojis)[0], xPct: position };
        return prev.map(it => Math.abs(it.xPct - position) < 8 ? newItem : it);
      });
    }, 600);
  }, []);

  const arriveNewTruck = useCallback((colorIdx: number) => {
    setTruckColorIdx(colorIdx);
    setTruckPhase('arrive');
    setTimeout(() => setTruckPhase('idle'), 650);
  }, []);

  const showPraise = useCallback(() => {
    const pid = ++praiseId.current;
    const text = PRAISE_WORDS[praiseIndex % PRAISE_WORDS.length];
    praiseIndex++;
    setPraiseText({ id: pid, text });
    setTimeout(() => setPraiseText(p => p?.id === pid ? null : p), 900);
  }, []);

  // Single-tap: tap item → auto scoop → auto dump → auto return
  const handleItemTap = useCallback((item: GroundItem) => {
    if (armPhaseRef.current !== 'idle') return;
    if (!item.visible || item.beingScooped) return;

    vibrateSuccess();

    // Show label pop
    const lid = ++labelPopId.current;
    setLabelPop({ id: lid, text: item.label, xPct: item.xPct });
    setTimeout(() => setLabelPop(p => p?.id === lid ? null : p), 1000);

    // Show dirt burst
    const did = ++dirtBurstId.current;
    setDirtBurst({ id: did, xPct: item.xPct });
    setTimeout(() => setDirtBurst(d => d?.id === did ? null : d), 700);

    // Start scoop
    setGroundItems(prev => prev.map(it => it.id === item.id ? { ...it, beingScooped: true } : it));
    setArm('scooping');

    // After scoop animation: pick up item, then auto-dump
    setTimeout(() => {
      setGroundItems(prev => prev.map(it => it.id === item.id ? { ...it, visible: false, beingScooped: false } : it));
      setHeldItem(item);

      // Brief pause showing item in bucket, then dump
      setTimeout(() => {
        setArm('dumping');

        // Drop particle
        setTimeout(() => {
          setHeldItem(null);
          const pid = ++dropParticleId.current;
          setDropParticle({ id: pid, emoji: item.emoji });
          setTimeout(() => setDropParticle(p => p?.id === pid ? null : p), 450);
        }, 200);

        // Item lands in truck
        setTimeout(() => {
          const newTruckItems = [...truckItemsRef.current, item.emoji];
          truckItemsRef.current = newTruckItems;
          setTruckItems(newTruckItems);

          // Truck bounce + praise
          setTruckBounce(true);
          setTimeout(() => setTruckBounce(false), 400);
          showPraise();
          vibrateSuccess();

          // Return arm
          setArm('returning');
          spawnFreshItem(item.xPct);

          setTimeout(() => {
            setArm('idle');

            // Check if truck is full
            if (newTruckItems.length >= LOADS_PER_TRUCK) {
              setTimeout(() => {
                setTruckPhase('depart');
                setTimeout(() => {
                  const newLoads = loadsDumpedRef.current + 1;
                  loadsDumpedRef.current = newLoads;
                  setLoadsDumped(newLoads);
                  truckItemsRef.current = [];
                  setTruckItems([]);

                  if (newLoads >= TRUCKS_TO_WIN) {
                    vibrateVictory();
                    setGameState('won');
                  } else {
                    arriveNewTruck((newLoads) % TRUCK_COLORS.length);
                  }
                }, 750);
              }, 500);
            }
          }, 370);
        }, 420);
      }, 300);
    }, 420);
  }, [setArm, spawnFreshItem, arriveNewTruck, showPraise]);

  const startGame = useCallback(() => {
    armPhaseRef.current = 'idle';
    truckItemsRef.current = [];
    loadsDumpedRef.current = 0;
    praiseIndex = 0;

    setArm('idle');
    setHeldItem(null);
    setTruckItems([]);
    setLoadsDumped(0);
    setTruckColorIdx(0);
    setTruckPhase('arrive');
    setGroundItems(pickRandomItems(3));
    setDropParticle(null);
    setDirtBurst(null);
    setPraiseText(null);
    setLabelPop(null);
    setTruckBounce(false);
    setGameState('playing');
    setTimeout(() => setTruckPhase('idle'), 650);
  }, [setArm]);

  // ─── IDLE ─────────────────────────────────────────────────────────────────
  if (gameState === 'idle') {
    return (
      <div
        className="relative flex flex-col items-center justify-center gap-6 w-full h-full select-none overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #f97316 0%, #fb923c 35%, #fdba74 55%, #92400e 100%)' }}
      >
        <div className="absolute rounded-full"
          style={{ bottom: '34%', left: '50%', transform: 'translateX(-50%)', width: '70px', height: '70px', background: '#fef08a', boxShadow: '0 0 50px 18px rgba(254,240,138,0.45)', zIndex: 0 }} />

        {[8, 78].map(left => (
          <div key={left} className="absolute" style={{ bottom: '37%', left: `${left}%`, zIndex: 1 }}>
            <div style={{ width: '16px', height: '42px', background: 'repeating-linear-gradient(180deg, #f97316 0 9px, #1f2937 9px 18px)', borderRadius: '3px 3px 0 0' }} />
            <div style={{ width: '32px', height: '9px', background: '#374151', borderRadius: '4px', marginLeft: '-8px' }} />
          </div>
        ))}

        <span className="relative text-9xl animate-bounce drop-shadow-xl z-10" role="img" aria-label="Gravemaskine">🏗️</span>
        <h2 className="font-pixel text-base text-white text-center leading-relaxed drop-shadow-lg z-10">Gravemaskine</h2>
        <p className="text-white/90 text-xl text-center drop-shadow px-4 max-w-xs z-10">
          Tryk på skattene og fyld lastvognen!
        </p>
        <button
          onClick={startGame}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation z-10"
          style={{ minWidth: '200px', minHeight: '80px' }}
        >
          Start! 🦖
        </button>
      </div>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────────
  const armClass = ARM_CLASS[armPhase];
  const armRotation = ARM_ROTATION[armPhase];
  const truckAnimClass = truckPhase === 'arrive' ? 'animate-car-arrive' : truckPhase === 'depart' ? 'animate-car-depart' : '';
  const truckColor = TRUCK_COLORS[truckColorIdx % TRUCK_COLORS.length];

  return (
    <div className="relative w-full h-full select-none overflow-hidden" style={{ touchAction: 'none' }}>

      {/* ── SKY ── */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, #f97316 0%, #fb923c 30%, #fdba74 52%, #c2410c 100%)' }} />

      <div className="absolute rounded-full"
        style={{ bottom: '47%', left: '50%', transform: 'translateX(-50%)', width: '52px', height: '52px', background: '#fef08a', boxShadow: '0 0 36px 14px rgba(254,240,138,0.5)', zIndex: 1 }} />

      {/* ── DUMP TRUCK (left side, flipped: cab on left, bed opens toward right/excavator) ── */}
      <div
        className={`absolute ${truckAnimClass} ${truckBounce ? 'animate-truck-bounce' : ''}`}
        style={{ left: '1%', bottom: '44%', width: '42%', maxWidth: '210px', touchAction: 'none', zIndex: 3, transformOrigin: 'bottom center' }}
      >
        {/* Bed section (on the RIGHT side now, open toward excavator) */}
        <div style={{ marginLeft: '2%', marginRight: '25%', position: 'relative' }}>
          <div style={{
            background: '#b45309',
            height: '66px',
            border: '4px solid #78350f',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            position: 'relative',
          }}>
            <div className="absolute inset-2 bottom-0" style={{ background: '#92400e', borderRadius: '4px 4px 0 0' }}>
              {[25, 50, 75].map(pct => (
                <div key={pct} className="absolute top-0 bottom-0"
                  style={{ left: `${pct}%`, width: '2px', background: 'rgba(0,0,0,0.22)', transform: 'translateX(-50%)' }} />
              ))}
              {truckItems.map((emoji, i) => (
                <span key={i} className="absolute animate-pop"
                  style={{ bottom: `${4 + i * 22}px`, left: `${15 + i * 28}%`, fontSize: '2rem', lineHeight: 1 }}>
                  {emoji}
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: '8px', background: '#78350f', borderRadius: '0 0 4px 4px' }} />
        </div>

        {/* Cab (on the LEFT side now) */}
        <div className="absolute" style={{
          left: '2%', bottom: 0, width: '27%', height: '60px',
          background: `linear-gradient(135deg, ${truckColor.from} 0%, ${truckColor.to} 100%)`,
          borderRadius: '10px 10px 6px 6px',
          boxShadow: '-3px 0 10px rgba(0,0,0,0.35)',
        }}>
          {/* Windshield */}
          <div className="absolute" style={{
            top: '7px', left: '5px', right: '5px', height: '24px',
            background: 'linear-gradient(135deg, #bae6fd 0%, #38bdf8 100%)',
            borderRadius: '5px', border: '2px solid rgba(255,255,255,0.35)',
          }}>
            <div className="absolute" style={{ top: '3px', left: '3px', width: '38%', height: '7px', background: 'rgba(255,255,255,0.55)', borderRadius: '3px' }} />
          </div>
          {/* Door line */}
          <div className="absolute" style={{ top: '36px', left: '8%', right: '8%', height: '2px', background: 'rgba(0,0,0,0.2)' }} />
          {/* Headlight (left side) */}
          <div className="absolute" style={{
            bottom: '9px', left: '5px', width: '13px', height: '10px',
            background: '#fef08a', borderRadius: '3px',
            boxShadow: '0 0 8px rgba(254,240,138,0.9)',
          }} />
        </div>

        {/* Wheels */}
        <div className="absolute rounded-full" style={{ left: '3%', bottom: '-18px', width: '36px', height: '36px', background: '#111827', border: '5px solid #374151', boxShadow: '0 2px 5px rgba(0,0,0,0.6)' }}>
          <div className="absolute rounded-full" style={{ inset: '7px', background: '#6b7280' }} />
        </div>
        <div className="absolute rounded-full" style={{ left: '34%', bottom: '-18px', width: '36px', height: '36px', background: '#111827', border: '5px solid #374151', boxShadow: '0 2px 5px rgba(0,0,0,0.6)' }}>
          <div className="absolute rounded-full" style={{ inset: '7px', background: '#6b7280' }} />
        </div>
        <div className="absolute rounded-full" style={{ right: '5%', bottom: '-18px', width: '36px', height: '36px', background: '#111827', border: '5px solid #374151', boxShadow: '0 2px 5px rgba(0,0,0,0.6)' }}>
          <div className="absolute rounded-full" style={{ inset: '7px', background: '#6b7280' }} />
        </div>
      </div>

      {/* ── EXCAVATOR (right side) ── */}
      <div className="absolute" style={{ right: '1%', bottom: '44%', width: '50%', maxWidth: '260px', zIndex: 3 }}>

        {/* ARM */}
        <div
          className={armClass || undefined}
          style={{
            position: 'absolute',
            right: '13%',
            bottom: '68px',
            width: '86%',
            height: '20px',
            transformOrigin: '100% 50%',
            transform: armClass ? undefined : `rotate(${armRotation}deg)`,
            zIndex: 8,
          }}
        >
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(to bottom, #fcd34d 0%, #d97706 50%, #b45309 100%)',
            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.35)',
          }} />
          <div className="absolute rounded-full" style={{ top: '3px', left: '5%', right: '28%', height: '8px', background: 'rgba(255,255,255,0.22)' }} />
          <div className="absolute rounded-full" style={{ right: '20%', top: '4px', width: '42%', height: '12px', background: '#92400e' }} />
          <div className="absolute rounded-full" style={{
            right: '8%', top: '-5px', width: '28%', height: '7px',
            background: '#78350f', transformOrigin: 'right center', transform: 'rotate(-16deg)',
          }} />

          {/* BUCKET */}
          <div className="absolute" style={{
            left: '-24px', top: '-14px',
            width: '44px', height: '36px',
            background: 'linear-gradient(to bottom, #92400e, #78350f)',
            borderRadius: '6px 6px 16px 16px',
            border: '3px solid #a16207',
            boxShadow: '0 4px 10px rgba(0,0,0,0.45)',
          }}>
            {[4, 14, 25].map(l => (
              <div key={l} className="absolute" style={{
                bottom: '-9px', left: `${l}px`,
                width: '7px', height: '10px',
                background: '#d1d5db',
                borderRadius: '0 0 4px 4px',
                boxShadow: '0 2px 3px rgba(0,0,0,0.4)',
              }} />
            ))}
            {heldItem && (
              <span className="absolute animate-pop"
                style={{ top: '-42px', left: '50%', transform: 'translateX(-50%)', fontSize: '2.4rem', lineHeight: 1, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }}>
                {heldItem.emoji}
              </span>
            )}
          </div>
        </div>

        {/* TRACKS */}
        <div className="absolute rounded-full" style={{
          bottom: '-20px', left: '4%', right: '4%', height: '28px',
          background: '#374151',
          boxShadow: '0 5px 10px rgba(0,0,0,0.55)',
        }}>
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="absolute"
              style={{ left: `${i * 11}%`, top: '6px', width: '10%', height: '16px', background: '#4b5563', borderRadius: '2px' }} />
          ))}
          {[8, 50, 92].map(pct => (
            <div key={pct} className="absolute rounded-full"
              style={{ left: `${pct}%`, top: '-5px', transform: 'translateX(-50%)', width: '24px', height: '24px', background: '#1f2937', border: '3px solid #4b5563' }}>
              <div className="absolute rounded-full" style={{ inset: '5px', background: '#6b7280' }} />
            </div>
          ))}
        </div>

        {/* LOWER CHASSIS */}
        <div style={{
          height: '26px', margin: '0 10%', marginBottom: '6px',
          background: 'linear-gradient(to bottom, #fbbf24, #ca8a04)',
          borderRadius: '8px',
          boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
          position: 'relative',
        }}>
          <div className="absolute" style={{ top: '9px', left: '8%', right: '8%', height: '3px', background: 'rgba(0,0,0,0.2)', borderRadius: '2px' }} />
        </div>

        {/* UPPER BODY */}
        <div style={{
          height: '60px', margin: '0 5%',
          background: 'linear-gradient(135deg, #fcd34d 0%, #eab308 55%, #ca8a04 100%)',
          borderRadius: '14px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          position: 'relative',
        }}>
          <div className="absolute" style={{
            left: '4%', top: '-40px', width: '52%', height: '44px',
            background: 'linear-gradient(135deg, #fcd34d 0%, #ca8a04 100%)',
            borderRadius: '10px 10px 0 0',
            boxShadow: '0 -3px 10px rgba(0,0,0,0.2)',
          }}>
            <div className="absolute" style={{
              top: '5px', left: '7px', right: '7px', height: '26px',
              background: 'linear-gradient(135deg, #bae6fd 0%, #38bdf8 100%)',
              borderRadius: '6px', border: '2px solid rgba(255,255,255,0.4)',
            }}>
              <div className="absolute" style={{ top: '3px', left: '4px', width: '35%', height: '9px', background: 'rgba(255,255,255,0.55)', borderRadius: '3px' }} />
            </div>
          </div>

          <div className="absolute" style={{
            right: '6%', top: '-16px', width: '28%', height: '20px',
            background: '#ca8a04', borderRadius: '6px 6px 0 0',
          }}>
            <div className="absolute" style={{ right: '22%', top: '-18px', width: '9px', height: '20px', background: '#374151', borderRadius: '4px 4px 0 0' }}>
              <div className="absolute" style={{ top: '-4px', left: '-3px', width: '15px', height: '6px', background: '#4b5563', borderRadius: '3px' }} />
            </div>
          </div>

          <div className="absolute" style={{ top: '19px', left: '5%', right: '5%', height: '3px', background: 'rgba(0,0,0,0.15)', borderRadius: '2px' }} />
          <div className="absolute" style={{ top: '33px', left: '5%', right: '5%', height: '2px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px' }} />

          <div className="absolute overflow-hidden"
            style={{ right: '4%', bottom: '6px', width: '22%', height: '24px', borderRadius: '4px' }}>
            <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #fbbf24 0 4px, #1f2937 4px 8px)', opacity: 0.75 }} />
          </div>
        </div>
      </div>

      {/* ── GROUND ZONE ── */}
      <div className="absolute left-0 right-0 bottom-0" style={{ height: '44%', zIndex: 4 }}>
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, #431407 0%, #7c2d12 22%, #92400e 58%, #a16207 100%)' }} />

        <div className="absolute top-0 left-0 right-0"
          style={{ height: '6px', background: 'rgba(0,0,0,0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.55)' }} />

        <div className="absolute left-0 right-0" style={{ top: '28%', height: '1px', background: 'rgba(0,0,0,0.2)' }} />
        <div className="absolute left-0 right-0" style={{ top: '60%', height: '1px', background: 'rgba(0,0,0,0.14)' }} />

        {GROUND_PEBBLES.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}px`, height: `${p.h}px`, background: PEBBLE_COLORS[p.shade], opacity: 0.55 }} />
        ))}

        {/* ── GROUND ITEMS (bigger, with wobble + glow) ── */}
        {groundItems.map(item => (
          item.visible && (
            <div
              key={item.id}
              className="absolute cursor-pointer animate-item-wobble"
              style={{
                left: `${item.xPct}%`,
                top: '-28px',
                transform: `translateX(-50%) scale(${item.beingScooped ? 0 : 1})`,
                transition: item.beingScooped ? 'transform 0.3s ease' : undefined,
                touchAction: 'none',
                zIndex: 10,
                padding: '22px',
              }}
              onPointerDown={(e) => { e.preventDefault(); handleItemTap(item); }}
              role="button"
              aria-label={`${item.label} — tryk for at grave op`}
            >
              {/* Glow ring */}
              <div className="absolute animate-glow-pulse rounded-full"
                style={{
                  inset: '6px',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }} />
              <span className="relative select-none leading-none" style={{
                fontSize: '4.2rem',
                display: 'block',
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.7))',
              }}>
                {item.emoji}
              </span>
            </div>
          )
        ))}

        {/* Dirt burst particles */}
        {dirtBurst && (
          <div className="absolute pointer-events-none" style={{ left: `${dirtBurst.xPct}%`, top: '-10px', zIndex: 11 }}>
            {DIRT_PARTICLES.map(p => (
              <div key={`${dirtBurst.id}-${p.key}`} className="absolute rounded-full animate-dirt-fly"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: '#78350f',
                  '--dx': p.dx,
                  '--dy': p.dy,
                  animationDelay: `${p.delay}s`,
                } as React.CSSProperties} />
            ))}
          </div>
        )}
      </div>

      {/* Label pop (item name) */}
      {labelPop && (
        <div className="absolute pointer-events-none animate-label-pop"
          style={{ left: `${labelPop.xPct}%`, bottom: '50%', zIndex: 25, whiteSpace: 'nowrap' }}>
          <span className="font-bold text-3xl text-amber-300 drop-shadow-lg"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
            {labelPop.text}!
          </span>
        </div>
      )}

      {/* Drop particle */}
      {dropParticle && (
        <div className="absolute pointer-events-none animate-item-drop"
          style={{ left: '30%', top: '27%', fontSize: '2.2rem', zIndex: 20 }}>
          {dropParticle.emoji}
        </div>
      )}

      {/* Praise text pop */}
      {praiseText && (
        <div className="absolute pointer-events-none animate-score-pop"
          style={{ left: '22%', top: '35%', zIndex: 25 }}>
          <span className="font-bold text-4xl text-yellow-300"
            style={{ textShadow: '0 3px 10px rgba(0,0,0,0.8)' }}>
            {praiseText.text}
          </span>
        </div>
      )}

      {/* ── PROGRESS ── */}
      <div className="absolute bottom-2 right-3 flex flex-col items-end gap-1" style={{ zIndex: 22 }}>
        <div className="px-3 py-1.5 rounded-full text-white font-bold text-sm"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          🚛 {loadsDumped} / {TRUCKS_TO_WIN} fyldt
        </div>
        <div className="flex gap-2">
          {Array.from({ length: TRUCKS_TO_WIN }).map((_, i) => (
            <span key={i} className="text-2xl" style={{ opacity: i < loadsDumped ? 1 : 0.3 }}>🚛</span>
          ))}
        </div>
      </div>

      {/* ── HINT ── */}
      {armPhase === 'idle' && (
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 22 }}>
          <div className="px-4 py-2 rounded-full text-white text-lg font-bold animate-bounce"
            style={{ background: 'rgba(0,0,0,0.45)' }}>
            👇 Tryk på en skat!
          </div>
        </div>
      )}

      {/* ── WIN OVERLAY ── */}
      {gameState === 'won' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75" style={{ zIndex: 30 }}>
          {confettiPieces.map(p => (
            <div
              key={p.key}
              className="absolute top-0 animate-confetti-fall"
              style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color, borderRadius: '3px', animationDelay: p.delay }}
            />
          ))}
          <span className="text-8xl mb-4 animate-bounce" role="img" aria-label="Gravemaskine">🏗️</span>
          <h2 className="font-pixel text-sm text-white mb-2 text-center px-4">Super!</h2>
          <p className="text-white/80 text-xl mb-8 text-center">Du fyldte {TRUCKS_TO_WIN} lastbiler!</p>
          <button
            onClick={startGame}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
            style={{ minWidth: '200px', minHeight: '80px' }}
          >
            Spil igen! 🦖
          </button>
        </div>
      )}
    </div>
  );
};

export default GravemaskineGame;
