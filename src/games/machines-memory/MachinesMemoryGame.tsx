import { useState, useRef, useCallback } from 'react';
import { vibrateSuccess, vibrateVictory } from '../../hooks/useVibrate';
import { useHighScore } from '../../hooks/useHighScore';

type GameState = 'idle' | 'playing' | 'won';

interface Card {
  id: string;
  pairKey: string;
  emoji: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const PAIRS = [
  { pairKey: 'traktor',   emoji: '🚜', label: 'Traktor'   },
  { pairKey: 'brandbil',  emoji: '🚒', label: 'Brandbil'  },
  { pairKey: 'tog',       emoji: '🚂', label: 'Tog'       },
  { pairKey: 'fly',       emoji: '✈️',  label: 'Fly'       },
];

// Wildcard center card — always face-up, purely decorative (not a pair)
const WILDCARD: Card = {
  id: 'wild',
  pairKey: 'wild',
  emoji: '⭐',
  label: '',
  isFlipped: true,
  isMatched: true,
};

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const pair of PAIRS) {
    deck.push({ id: `${pair.pairKey}-0`, ...pair, isFlipped: false, isMatched: false });
    deck.push({ id: `${pair.pairKey}-1`, ...pair, isFlipped: false, isMatched: false });
  }
  // Fisher-Yates shuffle the 8 cards
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  // Insert the wildcard at position 4 (center of the 3×3 grid)
  deck.splice(4, 0, { ...WILDCARD });
  return deck; // 9 cards total → 3×3 grid
}

// Confetti pieces
const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316'];

type ConfettiPiece = { key: number; color: string; left: string; delay: string; size: string };

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 28 }, (_, i) => ({
    key: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    size: `${12 + Math.random() * 10}px`,
  }));
}

const MachinesMemoryGame = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [cards, setCards] = useState<Card[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [recentMatch, setRecentMatch] = useState<string | null>(null);
  const isLocked = useRef(false);
  const flippedIds = useRef<string[]>([]);
  const flipAttemptsRef = useRef(0);
  const [finalAttempts, setFinalAttempts] = useState(0);
  const [confettiPieces] = useState<ConfettiPiece[]>(makeConfetti);

  const { best, submitScore } = useHighScore('memory-machines', true);

  const startGame = useCallback(() => {
    isLocked.current = false;
    flippedIds.current = [];
    flipAttemptsRef.current = 0;
    setCards(buildDeck());
    setMatchedPairs([]);
    setRecentMatch(null);
    setGameState('playing');
  }, []);

  const handleCardClick = useCallback((card: Card) => {
    if (isLocked.current) return;
    if (card.isFlipped || card.isMatched) return;
    if (card.pairKey === 'wild') return; // wildcard center is not interactive

    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c))
    );

    flippedIds.current = [...flippedIds.current, card.id];
    const currentFlipped = flippedIds.current;

    if (currentFlipped.length === 2) {
      isLocked.current = true;
      flipAttemptsRef.current++;
      const [firstId, secondId] = currentFlipped;

      setTimeout(() => {
        setCards((prevCards) => {
          const first = prevCards.find((c) => c.id === firstId)!;
          const second = prevCards.find((c) => c.id === secondId)!;

          if (first.pairKey === second.pairKey) {
            // Match!
            vibrateSuccess();
            setRecentMatch(first.pairKey);
            setTimeout(() => setRecentMatch(null), 600);

            const updated = prevCards.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            );

            setMatchedPairs((prevMatched) => {
              const newMatched = [...prevMatched, first.pairKey];
              if (newMatched.length === PAIRS.length) {
                vibrateVictory();
                const attempts = flipAttemptsRef.current;
                const stars = attempts <= 5 ? 3 : attempts <= 7 ? 2 : 1;
                submitScore(attempts, stars);
                setFinalAttempts(attempts);
                setGameState('won');
              }
              return newMatched;
            });

            isLocked.current = false;
            flippedIds.current = [];
            return updated;
          } else {
            // No match — flip back after delay
            setTimeout(() => {
              setCards((c) =>
                c.map((card) =>
                  card.id === firstId || card.id === secondId
                    ? { ...card, isFlipped: false }
                    : card
                )
              );
              flippedIds.current = [];
              isLocked.current = false;
            }, 700);
            return prevCards;
          }
        });
      }, 300);
    }
  }, [submitScore]);


  // Idle screen
  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-8 p-6 select-none">
        <span className="text-9xl animate-bounce" role="img" aria-label="Traktor">🚜</span>
        <h2 className="font-pixel text-base text-white text-center leading-relaxed">
          Maskiner Memory
        </h2>
        <p className="text-white/80 text-xl text-center">Find de ens maskiner!</p>
        {best.bestScore > 0 && (
          <p className="text-white/60 text-base text-center">
            Bedst: {best.bestScore} træk {'⭐'.repeat(best.bestStars)}
          </p>
        )}
        <button
          onClick={startGame}
          className="bg-orange-400 hover:bg-orange-300 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
          style={{ minWidth: '200px', minHeight: '80px' }}
        >
          Start! 🎮
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 select-none">
      {/* Card grid */}
      <div
        className="grid grid-cols-3 gap-3 sm:gap-5"
        style={{ touchAction: 'manipulation' }}
      >
        {cards.map((card) => {
          // Wildcard center — golden star, always visible, not interactive
          if (card.pairKey === 'wild') {
            return (
              <div
                key={card.id}
                className="rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-400 border-4 border-yellow-200 flex items-center justify-center shadow-lg shadow-yellow-300/50 animate-pulse-glow"
                style={{ width: 'min(28vw, 150px)', height: 'min(28vw, 150px)' }}
                aria-hidden="true"
              >
                <span className="text-5xl sm:text-6xl select-none">⭐</span>
              </div>
            );
          }

          const isRevealed = card.isFlipped || card.isMatched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="relative focus:outline-none"
              style={{
                width: 'min(28vw, 150px)',
                height: 'min(28vw, 150px)',
                perspective: '600px',
                touchAction: 'manipulation',
              }}
              aria-label={isRevealed ? card.label : 'Skjult kort'}
            >
              {/* Card inner wrapper (3D flip) */}
              <div
                className={`relative w-full h-full preserve-3d transition-transform duration-500 ${
                  isRevealed ? 'rotate-y-180' : ''
                }`}
              >
                {/* Back face */}
                <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 border-4 border-white/40 flex items-center justify-center shadow-lg">
                  <span className="text-5xl sm:text-6xl select-none" role="img" aria-hidden="true">❓</span>
                </div>

                {/* Front face */}
                <div
                  className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl flex flex-col items-center justify-center gap-2 border-4 shadow-lg bg-white transition-all duration-300
                    ${card.isMatched
                      ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.7)]'
                      : 'border-orange-300'
                    }
                    ${recentMatch === card.pairKey ? 'animate-pop' : ''}
                  `}
                >
                  <span className="text-5xl sm:text-6xl select-none" role="img" aria-label={card.label}>
                    {card.emoji}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-700 px-1 text-center">
                    {card.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-6 flex gap-3">
        {PAIRS.map((pair) => (
          <span
            key={pair.pairKey}
            className={`text-2xl transition-all duration-300 ${
              matchedPairs.includes(pair.pairKey) ? 'opacity-100 scale-110' : 'opacity-30'
            }`}
            role="img"
            aria-label={pair.label}
          >
            {pair.emoji}
          </span>
        ))}
      </div>

      {/* Win overlay */}
      {gameState === 'won' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75">
          {/* Confetti */}
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
          <p className="text-white/80 text-xl text-center">Alle maskiner fundet!</p>
          <p className="text-white/60 text-base mb-8 text-center">
            {finalAttempts} træk
            {best.bestScore > 0 && ` · Bedst: ${best.bestScore}`}
          </p>
          <button
            onClick={startGame}
            className="bg-orange-400 hover:bg-orange-300 text-white font-bold text-2xl px-12 py-6 rounded-3xl shadow-xl active:scale-95 transition-transform touch-manipulation"
            style={{ minWidth: '200px', minHeight: '80px' }}
          >
            Spil igen! 🚜
          </button>
        </div>
      )}
    </div>
  );
};

export default MachinesMemoryGame;
