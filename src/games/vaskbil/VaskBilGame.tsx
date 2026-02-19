import { useState, useRef, useCallback, useMemo } from 'react';
import { vibrateSuccess, vibrateVictory } from '../../hooks/useVibrate';

type GameState = 'idle' | 'playing' | 'won';
type CarPhase = 'arrive' | 'idle' | 'depart';

interface DirtSpot {
  id: number;
  xPct: number;
  yPct: number;
  blobShape: string;
  cleaned: boolean;
  popping: boolean;
}

interface SoapBubble {
  id: number;
  x: number;
  y: number;
}

interface CarColor {
  body: string;
  bodyLight: string;
  bodyDark: string;
  roof: string;
  roofLight: string;
  window: string;
}

const CAR_COLORS: CarColor[] = [
  { body: '#ef4444', bodyLight: '#fca5a5', bodyDark: '#b91c1c', roof: '#dc2626', roofLight: '#f87171', window: 'rgba(186,230,253,0.9)' },
  { body: '#3b82f6', bodyLight: '#93c5fd', bodyDark: '#1d4ed8', roof: '#2563eb', roofLight: '#60a5fa', window: 'rgba(187,247,208,0.9)' },
  { body: '#a855f7', bodyLight: '#d8b4fe', bodyDark: '#7c3aed', roof: '#9333ea', roofLight: '#c084fc', window: 'rgba(254,240,138,0.9)' },
];

// Blob shapes for organic-looking dirt spots
const BLOB_SHAPES = [
  '42% 58% 55% 45% / 50% 45% 55% 50%',
  '55% 45% 40% 60% / 45% 55% 45% 55%',
  '38% 62% 50% 50% / 60% 40% 60% 40%',
  '60% 40% 55% 45% / 40% 60% 45% 55%',
  '45% 55% 62% 38% / 55% 45% 50% 50%',
  '52% 48% 45% 55% / 48% 52% 55% 45%',
];

// Dirt spot positions (as % of the SVG container — 420×160 viewBox)
// xPct maps to SVG x / 420 * 100; yPct maps to SVG y / 160 * 100
// Avoid wheel zones: rear ~x19-33%, front ~x67-83%; and edges <8% and >93%
const DIRT_LAYOUTS: Array<Array<{ xPct: number; yPct: number }>> = [
  [
    { xPct: 15, yPct: 54 },  // rear door area
    { xPct: 24, yPct: 28 },  // rear cabin
    { xPct: 46, yPct: 62 },  // centre body
    { xPct: 60, yPct: 26 },  // front cabin
    { xPct: 68, yPct: 56 },  // front door
    { xPct: 84, yPct: 52 },  // front quarter
  ],
  [
    { xPct: 12, yPct: 40 },  // rear lower cabin
    { xPct: 36, yPct: 58 },  // centre-rear body
    { xPct: 50, yPct: 24 },  // centre cabin
    { xPct: 62, yPct: 60 },  // centre-front body
    { xPct: 75, yPct: 30 },  // front cabin lower
    { xPct: 86, yPct: 62 },  // front quarter lower
  ],
  [
    { xPct: 19, yPct: 64 },  // rear body lower
    { xPct: 28, yPct: 30 },  // rear cabin mid
    { xPct: 47, yPct: 54 },  // centre body
    { xPct: 56, yPct: 34 },  // centre cabin lower
    { xPct: 70, yPct: 60 },  // front door
    { xPct: 83, yPct: 34 },  // front cabin
  ],
];

const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#f97316'];
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  key: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${(i * 4.3 + 2) % 100}%`,
  delay: `${(i * 0.08) % 1.8}s`,
  size: `${10 + (i % 5) * 2}px`,
}));

const buildSpots = (carIndex: number): DirtSpot[] =>
  DIRT_LAYOUTS[carIndex % DIRT_LAYOUTS.length].map((pos, i) => ({
    id: carIndex * 10 + i,
    xPct: pos.xPct,
    yPct: pos.yPct,
    blobShape: BLOB_SHAPES[(carIndex * 6 + i) % BLOB_SHAPES.length],
    cleaned: false,
    popping: false,
  }));

// SVG car component — proper side-profile cartoon car
const CarSVG = ({ color }: { color: CarColor }) => (
  <svg viewBox="0 0 420 160" xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
    <defs>
      <linearGradient id="cBodyG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color.bodyLight} />
        <stop offset="55%" stopColor={color.body} />
        <stop offset="100%" stopColor={color.bodyDark} />
      </linearGradient>
      <linearGradient id="cRoofG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color.roofLight} />
        <stop offset="100%" stopColor={color.roof} />
      </linearGradient>
    </defs>

    {/* Ground shadow */}
    <ellipse cx="210" cy="155" rx="188" ry="7" fill="rgba(0,0,0,0.22)" />

    {/* Roof / cabin shape */}
    <path d="M78,68 L110,14 L310,14 L342,68 Z" fill="url(#cRoofG)" />

    {/* Roof darkening on A-pillar side */}
    <path d="M78,68 L110,14 L145,14 L113,68 Z" fill={color.bodyDark} opacity="0.35" />

    {/* Rear window */}
    <path d="M86,65 L116,18 L190,18 L190,65 Z" fill={color.window}
      stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    {/* Rear window reflection */}
    <line x1="102" y1="22" x2="120" y2="60" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" />

    {/* B-pillar */}
    <rect x="192" y="14" width="24" height="54" fill={color.roof} />

    {/* Front window */}
    <path d="M218,65 L218,18 L304,18 L334,65 Z" fill={color.window}
      stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    {/* Front window reflection */}
    <line x1="234" y1="22" x2="252" y2="60" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" />

    {/* Main car body */}
    <rect x="12" y="68" width="396" height="62" rx="11" fill="url(#cBodyG)" />
    {/* Body bottom darkening */}
    <rect x="12" y="106" width="396" height="24" rx="11" fill={color.bodyDark} />

    {/* Body highlight streak */}
    <path d="M30,74 Q210,68 390,74" stroke="rgba(255,255,255,0.32)" strokeWidth="2.8" fill="none" strokeLinecap="round" />

    {/* Wheel arch cutouts */}
    <ellipse cx="108" cy="132" rx="37" ry="21" fill={color.bodyDark} />
    <ellipse cx="312" cy="132" rx="37" ry="21" fill={color.bodyDark} />

    {/* Door divider */}
    <line x1="200" y1="70" x2="200" y2="128" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />

    {/* Door handles */}
    <rect x="154" y="90" width="28" height="7" rx="3.5" fill="rgba(255,255,255,0.38)" />
    <rect x="224" y="90" width="28" height="7" rx="3.5" fill="rgba(255,255,255,0.38)" />

    {/* Rear bumper */}
    <rect x="6" y="88" width="24" height="22" rx="8" fill="#e5e7eb" />
    <rect x="8" y="93" width="19" height="4" rx="2" fill="rgba(255,255,255,0.65)" />

    {/* Front bumper */}
    <rect x="390" y="88" width="24" height="22" rx="8" fill="#e5e7eb" />
    <rect x="392" y="93" width="19" height="4" rx="2" fill="rgba(255,255,255,0.65)" />

    {/* Tail light */}
    <rect x="12" y="72" width="17" height="26" rx="6" fill="#f87171" />
    <rect x="13" y="73" width="9" height="12" rx="4" fill="#fca5a5" />

    {/* Headlight */}
    <rect x="391" y="72" width="17" height="26" rx="6" fill="#fef08a" />
    <rect x="392" y="73" width="10" height="12" rx="4" fill="rgba(255,255,200,0.9)" />

    {/* Side mirror */}
    <rect x="334" y="50" width="20" height="13" rx="5" fill={color.bodyDark} />
    <rect x="335" y="51" width="12" height="7" rx="2.5" fill="rgba(160,200,220,0.8)" />

    {/* Rear wheel */}
    <circle cx="108" cy="128" r="28" fill="#111827" />
    <circle cx="108" cy="128" r="20" fill="#374151" />
    <circle cx="108" cy="128" r="9" fill="#9ca3af" />
    {[0, 72, 144, 216, 288].map(deg => (
      <circle key={deg}
        cx={108 + 14 * Math.cos(deg * Math.PI / 180)}
        cy={128 + 14 * Math.sin(deg * Math.PI / 180)}
        r="2.5" fill="#d1d5db" />
    ))}

    {/* Front wheel */}
    <circle cx="312" cy="128" r="28" fill="#111827" />
    <circle cx="312" cy="128" r="20" fill="#374151" />
    <circle cx="312" cy="128" r="9" fill="#9ca3af" />
    {[0, 72, 144, 216, 288].map(deg => (
      <circle key={deg}
        cx={312 + 14 * Math.cos(deg * Math.PI / 180)}
        cy={128 + 14 * Math.sin(deg * Math.PI / 180)}
        r="2.5" fill="#d1d5db" />
    ))}

    {/* License plate */}
    <rect x="173" y="113" width="56" height="18" rx="3" fill="white" stroke="#d1d5db" strokeWidth="1" />
  </svg>
);

const VaskBilGame = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [spots, setSpots] = useState<DirtSpot[]>([]);
  const [bubbles, setBubbles] = useState<SoapBubble[]>([]);
  const [carsWashed, setCarsWashed] = useState(0);
  const [carPhase, setCarPhase] = useState<CarPhase>('arrive');
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleId = useRef(0);
  const carsWashedRef = useRef(0);

  const confettiPieces = useMemo(() => CONFETTI_PIECES, []);

  const startGame = useCallback(() => {
    carsWashedRef.current = 0;
    setCarsWashed(0);
    setSpots(buildSpots(0));
    setBubbles([]);
    setCarPhase('arrive');
    setGameState('playing');
    setTimeout(() => setCarPhase('idle'), 650);
  }, []);

  const nextCar = useCallback((washedCount: number) => {
    if (washedCount >= 3) {
      vibrateVictory();
      setGameState('won');
      return;
    }
    setSpots(buildSpots(washedCount));
    setBubbles([]);
    setCarPhase('arrive');
    setTimeout(() => setCarPhase('idle'), 650);
  }, []);

  const handleSpotTap = useCallback((spotId: number, e: React.PointerEvent) => {
    e.preventDefault();

    setSpots(prev => {
      const spot = prev.find(s => s.id === spotId);
      if (!spot || spot.cleaned) return prev;

      vibrateSuccess();

      // Spawn bubbles relative to container
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const bx = e.clientX - rect.left;
        const by = e.clientY - rect.top;
        // Spawn 2-3 bubbles per tap with slight offset
        [-12, 0, 14].forEach((offset, idx) => {
          const bid = ++bubbleId.current;
          setTimeout(() => {
            setBubbles(b => [...b, { id: bid, x: bx + offset, y: by - idx * 8 }]);
            setTimeout(() => setBubbles(b => b.filter(bb => bb.id !== bid)), 980);
          }, idx * 80);
        });
      }

      const updated = prev.map(s =>
        s.id === spotId ? { ...s, cleaned: true, popping: true } : s
      );
      setTimeout(() => {
        setSpots(s => s.map(sp => sp.id === spotId ? { ...sp, popping: false } : sp));
      }, 380);

      const allClean = updated.every(s => s.cleaned);
      if (allClean) {
        setTimeout(() => {
          setCarPhase('depart');
          setTimeout(() => {
            const newCount = carsWashedRef.current + 1;
            carsWashedRef.current = newCount;
            setCarsWashed(newCount);
            nextCar(newCount);
          }, 750);
        }, 500);
      }

      return updated;
    });
  }, [nextCar]);

  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-8 p-6 select-none">
        <span className="text-8xl animate-bounce" role="img" aria-label="Bil">🚗</span>
        <h2 className="font-pixel text-base text-white text-center leading-relaxed">Vask Bilen</h2>
        <p className="text-white/80 text-xl text-center px-4 max-w-xs">
          Tryk på pletterne og gør bilen ren og skinnende!
        </p>
        <button
          onClick={startGame}
          className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
          style={{ minWidth: '200px', minHeight: '80px' }}
        >
          Start! 🚿
        </button>
      </div>
    );
  }

  const carColor = CAR_COLORS[carsWashed % CAR_COLORS.length];
  const carAnimClass =
    carPhase === 'arrive' ? 'animate-car-arrive' :
    carPhase === 'depart' ? 'animate-car-depart' : '';

  return (
    <div className="relative w-full h-full select-none overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Sky */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #bae6fd 0%, #7dd3fc 40%, #e0f2fe 80%, #f0f9ff 100%)',
      }} />

      {/* Sun with rays */}
      <div className="absolute" style={{ top: '5%', right: '8%' }}>
        <div className="rounded-full" style={{ width: '52px', height: '52px', background: '#fde68a', boxShadow: '0 0 20px 8px rgba(253,230,138,0.6)' }} />
      </div>

      {/* Clouds */}
      <div className="absolute animate-float-cloud" style={{ top: '5%', left: '6%' }}>
        <div className="relative" style={{ width: '96px', height: '48px' }}>
          <div className="absolute bg-white rounded-full shadow-sm" style={{ width: '62px', height: '38px', bottom: 0, left: '16px' }} />
          <div className="absolute bg-white rounded-full shadow-sm" style={{ width: '50px', height: '32px', bottom: '10px', left: '4px' }} />
          <div className="absolute bg-white rounded-full shadow-sm" style={{ width: '40px', height: '26px', bottom: '6px', right: 0 }} />
        </div>
      </div>
      <div className="absolute" style={{ top: '9%', left: '48%' }}>
        <div className="relative" style={{ width: '72px', height: '36px' }}>
          <div className="absolute bg-white/90 rounded-full" style={{ width: '48px', height: '30px', bottom: 0, left: '12px' }} />
          <div className="absolute bg-white/90 rounded-full" style={{ width: '38px', height: '24px', bottom: '8px', left: 0 }} />
          <div className="absolute bg-white/90 rounded-full" style={{ width: '30px', height: '20px', bottom: '4px', right: 0 }} />
        </div>
      </div>

      {/* Car wash gantry decoration */}
      <div className="absolute pointer-events-none" style={{ top: '8%', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
        {/* Arch frame */}
        <div className="relative" style={{ width: '220px', height: '60px' }}>
          <div className="absolute rounded" style={{ left: 0, top: 0, width: '8px', height: '60px', background: '#1d4ed8' }} />
          <div className="absolute rounded" style={{ right: 0, top: 0, width: '8px', height: '60px', background: '#1d4ed8' }} />
          <div className="absolute rounded" style={{ left: 0, top: 0, right: 0, height: '8px', background: '#2563eb' }} />
          {/* Water jets */}
          {[16, 36, 56, 76, 96, 116, 136, 156, 176, 196].map(x => (
            <div key={x} className="absolute"
              style={{ left: `${x}px`, top: '10px', width: '2px', height: '22px', background: 'rgba(125,211,252,0.7)', borderRadius: '1px', animation: 'ping 1.2s ease-out infinite', animationDelay: `${(x / 196) * 0.8}s` }} />
          ))}
          {/* Sign */}
          <div className="absolute rounded-lg" style={{ left: '50%', transform: 'translateX(-50%)', top: '-18px', padding: '2px 10px', background: '#1d4ed8', color: 'white', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            🚿 BILVASK
          </div>
        </div>
      </div>

      {/* Road */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '22%', background: '#475569' }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '15%', background: '#64748b' }} />
      {/* Road markings */}
      {[6, 22, 38, 54, 70, 86].map(left => (
        <div key={left} className="absolute rounded-full"
          style={{ bottom: '9%', left: `${left}%`, width: '8%', height: '3px', background: 'rgba(253,224,71,0.55)' }} />
      ))}

      {/* Car zone */}
      <div className="absolute left-0 right-0 flex justify-center items-center" style={{ top: '15%', height: '52%' }}>
        <div
          ref={containerRef}
          className={`relative ${carAnimClass}`}
          style={{ width: 'min(88%, 440px)', position: 'relative' }}
        >
          {/* The SVG car */}
          <CarSVG color={carColor} />

          {/* Dirt spots — absolute over the SVG */}
          {spots.map(spot => (
            <div
              key={spot.id}
              className="absolute cursor-pointer"
              style={{
                width: '52px',
                height: '48px',
                left: `${spot.xPct}%`,
                top: `${spot.yPct}%`,
                transform: 'translate(-50%, -50%)',
                background: spot.cleaned ? 'transparent' : 'radial-gradient(ellipse at 40% 38%, #92400e 0%, #6b3010 50%, #4b1f08 100%)',
                borderRadius: spot.blobShape,
                opacity: spot.cleaned ? 0 : 1,
                transition: spot.popping ? 'none' : 'opacity 0.4s ease',
                animation: spot.popping ? 'pop-collect 0.35s ease-out forwards' : undefined,
                touchAction: 'none',
                zIndex: 10,
                border: spot.cleaned ? 'none' : '1.5px solid rgba(0,0,0,0.2)',
                boxShadow: spot.cleaned ? 'none' : 'inset 0 2px 4px rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.3)',
              }}
              onPointerDown={(e) => handleSpotTap(spot.id, e)}
              role="button"
              aria-label="Snavs — tryk for at vaske"
            />
          ))}

          {/* Soap bubbles */}
          {bubbles.map(bubble => (
            <div
              key={bubble.id}
              className="absolute pointer-events-none animate-bubble-rise"
              style={{ left: bubble.x, top: bubble.y, transform: 'translate(-50%, -50%)', zIndex: 20 }}
            >
              <span style={{ fontSize: '22px' }}>🫧</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-2 z-10">
        <div className="flex gap-6 items-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-3xl transition-all duration-500"
                style={{ opacity: i < carsWashed ? 1 : i === carsWashed ? 1 : 0.3, filter: i < carsWashed ? 'none' : 'grayscale(0.3)' }}>
                {i < carsWashed ? '✨' : '🚗'}
              </span>
              <div className="w-2 h-2 rounded-full" style={{ background: i < carsWashed ? '#22c55e' : i === carsWashed ? '#fbbf24' : 'rgba(255,255,255,0.3)' }} />
            </div>
          ))}
        </div>
        <div className="bg-black/40 backdrop-blur-sm px-5 py-1.5 rounded-full text-white font-bold text-sm">
          Bil {Math.min(carsWashed + 1, 3)} af 3
        </div>
      </div>

      {/* Win overlay */}
      {gameState === 'won' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75">
          {confettiPieces.map(p => (
            <div key={p.key} className="absolute top-0 animate-confetti-fall"
              style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color, borderRadius: '3px', animationDelay: p.delay }} />
          ))}
          <span className="text-8xl mb-4 animate-bounce">✨</span>
          <h2 className="font-pixel text-sm text-white mb-2 text-center px-4">Alle biler er rene!</h2>
          <p className="text-white/80 text-xl mb-8 text-center">Sikke et godt stykke arbejde!</p>
          <button
            onClick={startGame}
            className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
            style={{ minWidth: '200px', minHeight: '80px' }}
          >
            Spil igen! 🚗
          </button>
        </div>
      )}
    </div>
  );
};

export default VaskBilGame;
