import { useState, useRef, useCallback, useEffect } from 'react';
import { POKEMON_DATA, type PokemonEntry } from '../../lib/pokemon';
import SpriteImage from '../../components/SpriteImage';
import PokeBall from '../../components/PokeBall';
import GameOverlay from '../../components/GameOverlay';
import { vibrateSuccess, vibrateError } from '../../hooks/useVibrate';
import { useHighScore } from '../../hooks/useHighScore';
import { useGameActive } from '../../hooks/useGameActive';

const TOTAL_ROUNDS = 5;
const MAX_ATTEMPTS = 3;
const CHARGE_CYCLE_MS = 2500; // power ping-pongs 0→100→0 in 2.5s
const SWEET_SPOT_HALF = 15;   // ±15 units of tolerance

// Pick 5 unique Pokémon for the 5 rounds at game start
function pickLineup(): { pokemon: PokemonEntry; distance: number }[] {
  const pool = [...POKEMON_DATA];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, TOTAL_ROUNDS).map(p => ({
    pokemon: p,
    distance: 0.4 + Math.random() * 0.5, // 0.4–0.9
  }));
}

type Phase = 'idle' | 'aiming' | 'throwing' | 'shaking' | 'caught' | 'missed' | 'victory';

const TossGame = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [lineup, setLineup] = useState<ReturnType<typeof pickLineup>>([]);
  const [round, setRound] = useState(0);
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
  const [totalCaught, setTotalCaught] = useState(0);
  const [power, setPower] = useState(0);
  const [throwResult, setThrowResult] = useState<'hit' | 'short' | 'far' | null>(null);

  const chargeRef = useRef<number | null>(null);
  const chargeStartRef = useRef(0);
  const powerRef = useRef(0); // tracks real-time power for throwBall
  const isCharging = useRef(false);

  const { best, submitScore } = useHighScore('toss');
  const { setGameActive } = useGameActive();

  useEffect(() => {
    setGameActive(phase !== 'idle' && phase !== 'victory');
    return () => setGameActive(false);
  }, [phase, setGameActive]);

  const current = lineup[round] ?? null;
  const sweetSpot = current ? current.distance * 70 + 10 : 50; // 38–73 depending on distance

  const startGame = useCallback(() => {
    const l = pickLineup();
    setLineup(l);
    setRound(0);
    setAttempts(MAX_ATTEMPTS);
    setTotalCaught(0);
    setPhase('aiming');
    setPower(0);
    powerRef.current = 0;
    setThrowResult(null);
  }, []);

  // ---------- Charging ----------
  const startCharge = () => {
    if (phase !== 'aiming' || isCharging.current) return;
    isCharging.current = true;
    chargeStartRef.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - chargeStartRef.current;
      // Triangle wave: 0→100→0 smoothly (no jarring reset)
      const t = (elapsed % CHARGE_CYCLE_MS) / CHARGE_CYCLE_MS;
      const p = t <= 0.5 ? t * 200 : (1 - t) * 200;
      powerRef.current = p;
      setPower(p);
      chargeRef.current = requestAnimationFrame(tick);
    };
    chargeRef.current = requestAnimationFrame(tick);
  };

  const releaseCharge = () => {
    if (!isCharging.current) return; // only throw if we were actually charging
    isCharging.current = false;
    if (chargeRef.current) cancelAnimationFrame(chargeRef.current);
    chargeRef.current = null;
    throwBall();
  };

  // Cleanup on unmount
  useEffect(() => () => { if (chargeRef.current) cancelAnimationFrame(chargeRef.current); }, []);

  // ---------- Throw logic ----------
  const throwBall = () => {
    if (phase !== 'aiming') return; // guard against double-throws
    const p = powerRef.current; // use ref for latest value, not stale state
    const isHit = Math.abs(p - sweetSpot) <= SWEET_SPOT_HALF;
    const result = isHit ? 'hit' : p < sweetSpot ? 'short' : 'far';
    setThrowResult(result);
    setPhase('throwing');

    // After throw animation (1s), resolve
    setTimeout(() => {
      if (result === 'hit') {
        setPhase('shaking');
        doShake(0);
      } else {
        handleMiss();
      }
    }, 1000);
  };

  const doShake = (count: number) => {
    if (count < 2) {
      setTimeout(() => doShake(count + 1), 500);
    } else {
      // Caught!
      setTimeout(() => {
        vibrateSuccess();
        setTotalCaught(c => c + 1);
        setPhase('caught');
        setTimeout(advanceRound, 1200);
      }, 500);
    }
  };

  const handleMiss = () => {
    vibrateError();
    setPhase('missed');
    const remaining = attempts - 1;
    setAttempts(remaining);
    setTimeout(() => {
      if (remaining <= 0) {
        advanceRound();
      } else {
        setThrowResult(null);
        setPhase('aiming');
        setPower(0);
        powerRef.current = 0;
      }
    }, 1200);
  };

  const advanceRound = () => {
    const next = round + 1;
    if (next >= TOTAL_ROUNDS) {
      setPhase('victory');
    } else {
      setRound(next);
      setAttempts(MAX_ATTEMPTS);
      setThrowResult(null);
      setPower(0);
      powerRef.current = 0;
      setPhase('aiming');
    }
  };

  const stars = totalCaught >= 5 ? 3 : totalCaught >= 3 ? 2 : totalCaught >= 1 ? 1 : 0;

  // Submit score on victory
  useEffect(() => {
    if (phase === 'victory' && totalCaught > 0) submitScore(totalCaught, stars);
  }, [phase, totalCaught, stars, submitScore]);

  // Visual sizes based on distance
  const pokemonSize = current ? Math.round(80 + (1 - current.distance) * 80) : 100; // closer=bigger

  return (
    <div className="flex flex-col items-center select-none w-full max-w-md">
      {phase === 'idle' && (
        <GameOverlay
          variant="idle"
          title="PokéBall Toss"
          subtitle="Catch wild Pokémon!"
          pokemonId={1}
          onAction={startGame}
        />
      )}

      {phase === 'victory' && (
        <GameOverlay
          variant="victory"
          title="Well Done!"
          subtitle={`Caught ${totalCaught} of ${TOTAL_ROUNDS}`}
          pokemonId={1}
          stars={stars}
          score={totalCaught}
          onAction={startGame}
        />
      )}

      {phase !== 'idle' && phase !== 'victory' && current && (
        <>
          {/* Stats */}
          <div className="mb-3 flex items-center gap-3">
            <div className="bg-black/30 px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-green-200 text-xs font-bold">Round</span>
              <span className="text-white font-pixel text-xs">{round + 1}/{TOTAL_ROUNDS}</span>
            </div>
            <div className="bg-black/30 px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-green-200 text-xs font-bold">Caught</span>
              <span className="text-pokemon-yellow font-pixel text-xs">{totalCaught}</span>
              {best.bestScore > 0 && <span className="font-pixel text-xs text-white/40 ml-1">Best: {best.bestScore}</span>}
            </div>
            {/* Attempt pips */}
            <div className="flex gap-1">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <PokeBall key={i} size={18} className={i < attempts ? 'opacity-100' : 'opacity-20'} />
              ))}
            </div>
          </div>

          {/* Play area */}
          <div className="relative w-full h-[360px] bg-gradient-to-b from-green-300 via-green-200 to-green-400 rounded-2xl border-4 border-green-900/30 shadow-xl overflow-hidden">
            {/* Tall grass background */}
            <div className="absolute bottom-0 w-full h-20 flex items-end justify-around">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-4 bg-green-600 rounded-t-full" style={{ height: 20 + (i % 3) * 10 }} />
              ))}
            </div>

            {/* Wild Pokémon */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300
                ${phase === 'caught' ? 'scale-0 opacity-0' : ''}
                ${phase === 'shaking' ? 'animate-wobble-catch' : ''}
              `}
              style={{ top: `${15 + current.distance * 20}%` }}
            >
              <SpriteImage pokemonId={current.pokemon.id} variant="artwork" size={pokemonSize} />
              <div className="text-center mt-1 font-pixel text-[11px] text-green-900/60">
                {current.pokemon.name}
              </div>
            </div>

            {/* Thrown PokéBall (animates toward Pokémon or falls) */}
            {(phase === 'throwing' || phase === 'shaking') && (
              <div
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out"
                style={{
                  bottom: throwResult === 'hit' ? `${55 - current.distance * 15}%` :
                          throwResult === 'short' ? '30%' : '70%',
                  transform: `translateX(${throwResult === 'short' ? '-40px' : throwResult === 'far' ? '40px' : '-50%'})`,
                }}
              >
                <PokeBall size={36} spinning />
              </div>
            )}

            {/* Caught text */}
            {phase === 'caught' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="font-pixel text-xl text-pokemon-yellow animate-pop drop-shadow-lg">
                  Gotcha!
                </div>
              </div>
            )}

            {/* Miss text */}
            {phase === 'missed' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="font-pixel text-lg text-red-400 animate-shake drop-shadow-lg">
                  {throwResult === 'short' ? 'Too short!' : 'Too far!'}
                </div>
              </div>
            )}

            {/* Power meter (right side) */}
            {phase === 'aiming' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-52 bg-gray-800/50 rounded-full overflow-hidden border-3 border-white/40 shadow-lg">
                {/* Sweet spot zone */}
                <div
                  className="absolute w-full bg-green-400/50 border-y-3 border-green-400"
                  style={{
                    height: `${SWEET_SPOT_HALF * 2}%`,
                    bottom: `${sweetSpot - SWEET_SPOT_HALF}%`,
                  }}
                >
                  <span className="absolute -left-8 top-1/2 -translate-y-1/2 font-pixel text-[9px] text-green-300">AIM</span>
                </div>
                {/* Power fill — absolute positioned, no flex, no CSS transition */}
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-pokemon-red to-pokemon-yellow rounded-b-full"
                  style={{ height: `${power}%` }}
                />
              </div>
            )}
          </div>

          {/* Hold-to-charge button with power ring */}
          {phase === 'aiming' && (
            <div
              className="mt-5 relative w-40 h-40 flex items-center justify-center cursor-pointer touch-manipulation"
              onMouseDown={startCharge}
              onMouseUp={releaseCharge}
              onTouchStart={(e) => { e.preventDefault(); startCharge(); }}
              onTouchEnd={(e) => { e.preventDefault(); releaseCharge(); }}
            >
              {/* Power ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <circle
                  cx="80" cy="80" r="74"
                  fill="none"
                  stroke={power > 0 ? (Math.abs(power - sweetSpot) <= SWEET_SPOT_HALF ? '#4ade80' : '#ef4444') : 'transparent'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(power / 100) * 465} 465`}
                  className="transition-all duration-75"
                />
              </svg>
              <div className="w-32 h-32 bg-gradient-to-b from-white to-gray-200 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-4 border-gray-300 pointer-events-none">
                <div className="flex flex-col items-center gap-1">
                  <PokeBall size={44} />
                  <span className="font-pixel text-[11px] text-gray-600">
                    {power > 0 ? `${Math.round(power)}%` : 'HOLD'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TossGame;
