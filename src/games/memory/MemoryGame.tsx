import { useState, useCallback, useEffect } from 'react';
import { POKEMON_DATA } from '../../lib/pokemon';
import SpriteImage from '../../components/SpriteImage';
import PokeBall from '../../components/PokeBall';
import GameOverlay from '../../components/GameOverlay';
import { vibrateSuccess } from '../../hooks/useVibrate';
import { useHighScore } from '../../hooks/useHighScore';
import { useGameActive } from '../../hooks/useGameActive';

// Use first 8 kid-friendly Pokémon for pairs
const GAME_POKEMON = POKEMON_DATA.slice(0, 8);

interface Card {
  id: string;         // Stable unique ID like "pikachu-0"
  pokemonId: number;  // PokeAPI dex number for match comparison
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const pokemon of GAME_POKEMON) {
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
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const MemoryGame = () => {
  const [cards, setCards] = useState<Card[]>(buildDeck);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [recentMatch, setRecentMatch] = useState<string | null>(null);

  const { best, submitScore } = useHighScore('memory', true);
  const { setGameActive } = useGameActive();
  const isWon = cards.length > 0 && cards.every(card => card.isMatched);

  useEffect(() => { setGameActive(moves > 0 && !isWon); return () => setGameActive(false); }, [moves, isWon, setGameActive]);

  const initGame = useCallback(() => {
    setCards(buildDeck());
    setFlippedCards([]);
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
  const stars = moves <= 12 ? 3 : moves <= 20 ? 2 : 1;

  // Submit score on victory
  useEffect(() => {
    if (isWon && moves > 0) submitScore(moves, stars);
  }, [isWon, moves, stars, submitScore]);

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Stats bar */}
      <div className="mb-4 flex items-center gap-6">
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <span className="text-blue-200 text-sm font-bold">Moves</span>
          <span className="text-white font-pixel text-sm">{moves}</span>
          {best.bestScore > 0 && <span className="font-pixel text-xs text-white/40 ml-1">Best: {best.bestScore}</span>}
        </div>
        {/* Pokeball progress */}
        <div className="flex gap-1">
          {Array.from({ length: GAME_POKEMON.length }).map((_, i) => (
            <PokeBall
              key={i}
              size={22}
              className={i < matchedCount ? 'opacity-100' : 'opacity-20'}
            />
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-4 gap-3 max-w-md">
        {cards.map((card) => {
          const isRevealed = card.isFlipped || card.isMatched;
          const isJustMatched = card.isMatched && recentMatch === card.name;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`w-[22vw] max-w-24 aspect-[5/6] cursor-pointer perspective-[600px] ${isJustMatched ? 'animate-pop' : ''}`}
            >
              <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
                {/* Back — Pokéball */}
                <div className="absolute w-full h-full bg-pokemon-red rounded-xl border-3 border-white shadow-lg flex items-center justify-center backface-hidden">
                  <div className="relative">
                    <PokeBall size={40} />
                    <div className="absolute top-1 left-1 w-3 h-3 bg-white/40 rounded-full" />
                  </div>
                </div>

                {/* Front — Pokémon */}
                <div className={`absolute w-full h-full bg-white rounded-xl border-3 flex flex-col items-center justify-center backface-hidden rotate-y-180
                  ${card.isMatched ? 'border-pokemon-yellow shadow-[0_0_12px_rgba(255,222,0,0.6)]' : 'border-blue-400'}
                `}>
                  <SpriteImage pokemonId={card.pokemonId} size={56} />
                  <span className="text-[11px] font-bold text-blue-800 mt-1">{card.name}</span>
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
          title="You Found Them All!"
          subtitle={`Completed in ${moves} moves`}
          pokemonId={25}
          stars={stars}
          onAction={initGame}
        />
      )}
    </div>
  );
};

export default MemoryGame;
