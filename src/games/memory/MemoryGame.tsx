import { useState, useCallback, useEffect } from 'react';
import { POKEMON_DATA } from '../../lib/pokemon';
import SpriteImage from '../../components/SpriteImage';
import PokeBall from '../../components/PokeBall';
import GameOverlay from '../../components/GameOverlay';
import { vibrateSuccess } from '../../hooks/useVibrate';
import { useHighScore } from '../../hooks/useHighScore';
import { useGameActive } from '../../hooks/useGameActive';

type Difficulty = 'easy' | 'medium' | 'hard' | 'ultra';

const DIFFICULTY_CONFIG: Record<Difficulty, { cols: number; rows: number; pairs: number; starThresholds: [number, number] }> = {
  easy:   { cols: 4, rows: 3, pairs: 6,  starThresholds: [10, 16] },
  medium: { cols: 5, rows: 4, pairs: 10, starThresholds: [16, 24] },
  hard:   { cols: 6, rows: 5, pairs: 15, starThresholds: [24, 36] },
  ultra:  { cols: 7, rows: 6, pairs: 21, starThresholds: [34, 50] },
};

interface Card {
  id: string;
  pokemonId: number;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function buildDeck(pairCount: number): Card[] {
  // Shuffle all pokemon and pick the needed number
  const pool = [...POKEMON_DATA];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selected = pool.slice(0, pairCount);

  const deck: Card[] = [];
  for (const pokemon of selected) {
    for (let copy = 0; copy < 2; copy++) {
      deck.push({
        id: `${pokemon.name.toLowerCase()}-${copy}`,
        pokemonId: pokemon.id,
        name: pokemon.name,
        isFlipped: false,
        isMatched: false,
      });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const MemoryGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [recentMatch, setRecentMatch] = useState<string | null>(null);

  const { best, submitScore } = useHighScore('memory', true);
  const { setGameActive } = useGameActive();
  const isWon = cards.length > 0 && cards.every(card => card.isMatched);

  const config = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  useEffect(() => { setGameActive(moves > 0 && !isWon); return () => setGameActive(false); }, [moves, isWon, setGameActive]);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setCards(buildDeck(DIFFICULTY_CONFIG[diff].pairs));
    setFlippedCards([]);
    setMoves(0);
    setRecentMatch(null);
  }, []);

  const initGame = useCallback(() => {
    if (difficulty) startGame(difficulty);
  }, [difficulty, startGame]);

  const backToMenu = useCallback(() => {
    setDifficulty(null);
    setCards([]);
    setMoves(0);
    setRecentMatch(null);
  }, []);

  const processFlip = useCallback((firstId: string, secondId: string, currentCards: Card[]) => {
    const first = currentCards.find(c => c.id === firstId);
    const second = currentCards.find(c => c.id === secondId);
    if (!first || !second) return;

    if (first.pokemonId === second.pokemonId) {
      vibrateSuccess();
      setRecentMatch(first.name);
      setCards(prev => prev.map(card =>
        (card.id === firstId || card.id === secondId)
          ? { ...card, isMatched: true }
          : card
      ));
      setFlippedCards([]);
      setTimeout(() => setRecentMatch(null), 600);
    } else {
      setTimeout(() => {
        setCards(prev => prev.map(card =>
          (card.id === firstId || card.id === secondId)
            ? { ...card, isFlipped: false }
            : card
        ));
        setFlippedCards([]);
      }, 1000);
    }
    setMoves(m => m + 1);
  }, []);

  const handleCardClick = (id: string) => {
    if (flippedCards.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlipped = [...flippedCards, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      processFlip(newFlipped[0], newFlipped[1], cards);
    }
  };

  const matchedCount = cards.filter(c => c.isMatched).length / 2;
  const stars = config
    ? (moves <= config.starThresholds[0] ? 3 : moves <= config.starThresholds[1] ? 2 : 1)
    : 1;

  // Submit score on victory
  useEffect(() => {
    if (isWon && moves > 0) submitScore(moves, stars);
  }, [isWon, moves, stars, submitScore]);

  // Difficulty selector
  if (!difficulty) {
    return (
      <div className="flex flex-col items-center select-none">
        <SpriteImage pokemonId={39} size={80} />
        <h2 className="font-pixel text-lg text-white mt-3 mb-1">Pokémon Match</h2>
        <p className="text-white/70 text-sm mb-5">Vælg sværhedsgrad</p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {([
            { key: 'easy' as Difficulty,   label: 'Let',    sub: '3 × 4', color: 'from-green-500 to-green-600' },
            { key: 'medium' as Difficulty, label: 'Middel', sub: '4 × 5', color: 'from-blue-500 to-blue-600' },
            { key: 'hard' as Difficulty,   label: 'Svær',   sub: '5 × 6', color: 'from-orange-500 to-orange-600' },
            { key: 'ultra' as Difficulty,  label: 'Ultra',  sub: '6 × 7', color: 'from-red-500 to-red-600' },
          ]).map(d => (
            <button
              key={d.key}
              onClick={() => startGame(d.key)}
              className={`bg-gradient-to-b ${d.color} text-white rounded-xl px-4 py-4 shadow-lg active:scale-95 transition-transform`}
            >
              <div className="font-pixel text-sm">{d.label}</div>
              <div className="text-white/70 text-xs mt-1">{d.sub}</div>
            </button>
          ))}
        </div>
        {best.bestScore > 0 && (
          <div className="mt-4 text-white/40 font-pixel text-xs">Bedst: {best.bestScore} træk</div>
        )}
      </div>
    );
  }

  // Card size based on difficulty
  const cardSizeClass = difficulty === 'ultra'
    ? 'w-[12vw] max-w-14'
    : difficulty === 'hard'
      ? 'w-[15vw] max-w-16'
      : difficulty === 'medium'
        ? 'w-[17vw] max-w-20'
        : 'w-[22vw] max-w-24';

  const spriteSize = difficulty === 'ultra' ? 32 : difficulty === 'hard' ? 40 : difficulty === 'medium' ? 48 : 56;
  const pokeballSize = difficulty === 'ultra' ? 24 : difficulty === 'hard' ? 30 : 40;

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Stats bar */}
      <div className="mb-3 flex items-center gap-4">
        <button
          onClick={backToMenu}
          className="bg-white/10 px-3 py-1.5 rounded-full text-white/70 text-xs font-bold hover:bg-white/20 transition-colors"
        >
          ← Sværhedsgrad
        </button>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <span className="text-blue-200 text-sm font-bold">Træk</span>
          <span className="text-white font-pixel text-sm">{moves}</span>
          {best.bestScore > 0 && <span className="font-pixel text-xs text-white/40 ml-1">Bedst: {best.bestScore}</span>}
        </div>
        {/* Pokeball progress */}
        <div className="flex gap-0.5 flex-wrap max-w-[120px]">
          {Array.from({ length: config!.pairs }).map((_, i) => (
            <PokeBall
              key={i}
              size={config!.pairs > 15 ? 14 : config!.pairs > 10 ? 16 : 22}
              className={i < matchedCount ? 'opacity-100' : 'opacity-20'}
            />
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div
        className="gap-2 max-w-lg mx-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config!.cols}, 1fr)`,
        }}
      >
        {cards.map((card) => {
          const isRevealed = card.isFlipped || card.isMatched;
          const isJustMatched = card.isMatched && recentMatch === card.name;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`${cardSizeClass} aspect-[5/6] cursor-pointer perspective-[600px] ${isJustMatched ? 'animate-pop' : ''}`}
            >
              <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
                {/* Back — Pokéball */}
                <div className="absolute w-full h-full bg-pokemon-red rounded-xl border-3 border-white shadow-lg flex items-center justify-center backface-hidden">
                  <div className="relative">
                    <PokeBall size={pokeballSize} />
                    <div className="absolute top-1 left-1 w-3 h-3 bg-white/40 rounded-full" />
                  </div>
                </div>

                {/* Front — Pokémon */}
                <div className={`absolute w-full h-full bg-white rounded-xl border-3 flex flex-col items-center justify-center backface-hidden rotate-y-180
                  ${card.isMatched ? 'border-pokemon-yellow shadow-[0_0_12px_rgba(255,222,0,0.6)]' : 'border-blue-400'}
                `}>
                  <SpriteImage pokemonId={card.pokemonId} size={spriteSize} />
                  {difficulty !== 'ultra' && (
                    <span className="text-[11px] font-bold text-blue-800 mt-1">{card.name}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Victory overlay */}
      {isWon && (
        <GameOverlay
          variant="victory"
          title="Du fandt dem alle!"
          subtitle={`Klaret på ${moves} træk`}
          pokemonId={25}
          stars={stars}
          onAction={initGame}
        />
      )}
    </div>
  );
};

export default MemoryGame;
