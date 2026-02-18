import { useState, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { games } from '../gameRegistry';
import PokeBall from './PokeBall';
import SpriteImage from './SpriteImage';
import { useGameActive } from '../hooks/useGameActive';

const BG_CLASSES: Record<string, string> = {
  grass: 'bg-gradient-to-b from-green-800 to-green-950',
  cave: 'bg-gradient-to-b from-stone-700 to-stone-900',
  water: 'bg-gradient-to-b from-blue-800 to-blue-950',
  sky: '', // Jump game manages its own background
};

const GameShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isGameActive } = useGameActive();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBack = useCallback(() => {
    if (!isGameActive) {
      navigate('/pokemon');
      return;
    }
    if (confirmLeave) {
      // Second tap — actually leave
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setConfirmLeave(false);
      navigate('/pokemon');
    } else {
      // First tap — show warning, reset after 2s
      setConfirmLeave(true);
      confirmTimer.current = setTimeout(() => setConfirmLeave(false), 2000);
    }
  }, [isGameActive, confirmLeave, navigate]);

  const id = location.pathname.split('/').pop();
  const game = games.find((g) => g.id === id);

  if (!game) return <div className="text-white p-8">Spil ikke fundet</div>;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className={`bg-gradient-to-r ${game.gradient} p-3 flex items-center justify-between text-white shadow-lg relative overflow-hidden`}>
        {/* Subtle PokéBall watermark */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.06]">
          <PokeBall size={60} />
        </div>
        <button
          onClick={handleBack}
          className={`flex items-center gap-2 font-bold text-sm transition-all px-3 py-1.5 rounded-full relative z-10
            ${confirmLeave
              ? 'bg-red-500/80 animate-pulse'
              : 'bg-white/15 hover:opacity-80'
            }`}
        >
          <PokeBall size={20} />
          {confirmLeave ? 'Tryk for at forlade' : 'Tilbage'}
        </button>
        <h1 className="font-pixel text-xs sm:text-sm relative z-10">{game.title}</h1>
        <SpriteImage pokemonId={game.pokemonId} variant="sprite" size={36} className="relative z-10" />
      </header>
      {/* Pokémon-style divider line */}
      <div className="h-1 bg-gradient-to-r from-pokemon-red via-pokemon-yellow to-pokemon-red" />

      {/* Main play area */}
      <main
        className={`flex-1 overflow-hidden relative flex flex-col items-center justify-center p-4
          ${BG_CLASSES[game.bgVariant] ?? ''}
          shadow-[inset_0_4px_20px_rgba(0,0,0,0.4)]
        `}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default GameShell;
