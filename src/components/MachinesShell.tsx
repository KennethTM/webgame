import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { machineGames } from '../machineRegistry';

const MachinesShell = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const id = location.pathname.split('/').pop();
  const game = machineGames.find((g) => g.id === id);

  if (!game) return <div className="text-white p-8">Spil ikke fundet</div>;

  return (
    <div className="flex flex-col h-screen select-none">
      {/* Header */}
      <header
        className={`bg-gradient-to-r ${game.gradient} p-3 flex items-center justify-between text-white shadow-lg flex-shrink-0`}
      >
        <button
          onClick={() => navigate('/maskiner')}
          className="flex items-center gap-2 font-bold text-base bg-white/20 hover:bg-white/30 px-4 py-3 rounded-full active:scale-95 transition-transform touch-manipulation"
          style={{ minWidth: '80px', minHeight: '48px' }}
        >
          ← Tilbage
        </button>
        <h1 className="font-pixel text-[9px] sm:text-xs text-center px-2">{game.title}</h1>
        <span className="text-4xl" role="img" aria-label={game.title}>
          {game.emoji}
        </span>
      </header>

      {/* Orange accent divider */}
      <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 flex-shrink-0" />

      {/* Play area */}
      <main
        className={`flex-1 overflow-hidden relative flex flex-col items-center justify-center ${game.bgColor}`}
        style={{ touchAction: 'none' }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MachinesShell;
