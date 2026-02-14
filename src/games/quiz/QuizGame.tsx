import { useState, useCallback, useEffect } from 'react';
import { POKEMON_DATA, type PokemonEntry } from '../../lib/pokemon';
import SpriteImage from '../../components/SpriteImage';
import GameOverlay from '../../components/GameOverlay';
import { vibrateSuccess, vibrateError } from '../../hooks/useVibrate';
import { useHighScore } from '../../hooks/useHighScore';
import { useGameActive } from '../../hooks/useGameActive';

const TOTAL_ROUNDS = 10;

function pickRound(): { answer: PokemonEntry; choices: PokemonEntry[] } {
  const pool = [...POKEMON_DATA];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const answer = pool[0];
  const distractors = pool.slice(1, 4);
  // Combine and shuffle choices
  const choices = [answer, ...distractors];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { answer, choices };
}

const QuizGame = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'victory'>('idle');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState<ReturnType<typeof pickRound> | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [wrongChoices, setWrongChoices] = useState<number[]>([]);
  const [shakingIndex, setShakingIndex] = useState<number | null>(null);

  const { best, submitScore } = useHighScore('quiz');
  const { setGameActive } = useGameActive();

  useEffect(() => { setGameActive(gameState === 'playing'); return () => setGameActive(false); }, [gameState, setGameActive]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setRound(0);
    setScore(0);
    setCurrentRound(pickRound());
    setRevealed(false);
    setWrongChoices([]);
    setShakingIndex(null);
  }, []);

  const nextRound = useCallback(() => {
    const next = round + 1;
    if (next >= TOTAL_ROUNDS) {
      setGameState('victory');
    } else {
      setRound(next);
      setCurrentRound(pickRound());
      setRevealed(false);
      setWrongChoices([]);
      setShakingIndex(null);
    }
  }, [round]);

  const handleChoice = (index: number) => {
    if (!currentRound || revealed || wrongChoices.includes(index)) return;

    const choice = currentRound.choices[index];
    if (choice.id === currentRound.answer.id) {
      // Correct!
      vibrateSuccess();
      setRevealed(true);
      if (wrongChoices.length === 0) setScore(s => s + 1);
      setTimeout(nextRound, 1500);
    } else {
      // Wrong — shake that button
      vibrateError();
      setWrongChoices(prev => [...prev, index]);
      setShakingIndex(index);
      setTimeout(() => setShakingIndex(null), 300);
    }
  };

  const stars = score >= 10 ? 3 : score >= 7 ? 2 : 1;

  // Submit score on victory
  useEffect(() => {
    if (gameState === 'victory' && score > 0) submitScore(score, stars);
  }, [gameState, score, stars, submitScore]);

  return (
    <div className="flex flex-col items-center select-none w-full max-w-md">
      {gameState === 'idle' && (
        <GameOverlay
          variant="idle"
          title="Who's That Pokémon?"
          subtitle="Gæt silhuetten!"
          pokemonId={25}
          onAction={startGame}
        />
      )}

      {gameState === 'playing' && currentRound && (
        <>
          {/* Stats bar */}
          <div className="mb-4 flex items-center gap-4">
            <div className="bg-black/30 px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-blue-200 text-sm font-bold">Runde</span>
              <span className="text-white font-pixel text-sm">{round + 1}/{TOTAL_ROUNDS}</span>
            </div>
            <div className="bg-black/30 px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-blue-200 text-sm font-bold">Point</span>
              <span className="text-pokemon-yellow font-pixel text-sm">{score}</span>
              {best.bestScore > 0 && <span className="font-pixel text-xs text-white/40 ml-1">Bedst: {best.bestScore}</span>}
            </div>
          </div>

          {/* Silhouette / Reveal */}
          <div className="relative mb-6">
            <div className={`transition-all duration-500 ${revealed ? '' : 'brightness-0'} ${revealed ? 'animate-pop' : ''}`}>
              <SpriteImage
                pokemonId={currentRound.answer.id}
                variant="artwork"
                size={180}
                alt="Mystery Pokémon"
              />
            </div>
            {revealed && (
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg animate-pop">
                ✓
              </div>
            )}
            {!revealed && (
              <div className="text-center mt-2 font-pixel text-sm text-pokemon-yellow animate-pulse-glow px-3 py-1 rounded-full">
                ?
              </div>
            )}
          </div>

          {/* Choice buttons — 2×2 grid */}
          <div className="grid grid-cols-2 gap-3 w-full px-4">
            {currentRound.choices.map((pokemon, i) => {
              const isWrong = wrongChoices.includes(i);
              const isCorrectRevealed = revealed && pokemon.id === currentRound.answer.id;
              const isShaking = shakingIndex === i;

              return (
                <button
                  key={`${round}-${pokemon.id}`}
                  onClick={() => handleChoice(i)}
                  disabled={revealed || isWrong}
                  className={`
                    py-4 px-3 rounded-xl font-bold text-base shadow-lg
                    transition-all duration-200 touch-manipulation
                    ${isCorrectRevealed
                      ? 'bg-green-500 text-white scale-105 ring-4 ring-green-300'
                      : isWrong
                        ? 'bg-gray-600 text-gray-400 opacity-50'
                        : 'bg-white/90 text-gray-800 hover:bg-white active:scale-95'
                    }
                    ${isShaking ? 'animate-shake' : ''}
                  `}
                >
                  <div className="flex items-center justify-center gap-3">
                    <SpriteImage pokemonId={pokemon.id} variant="sprite" size={48} />
                    <span className="text-sm">{pokemon.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {gameState === 'victory' && (
        <GameOverlay
          variant="victory"
          title="Pokémon-mester!"
          subtitle={`${score} ud af ${TOTAL_ROUNDS} rigtige`}
          pokemonId={25}
          stars={stars}
          score={score}
          onAction={startGame}
        />
      )}
    </div>
  );
};

export default QuizGame;
