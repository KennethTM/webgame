import { Link } from 'react-router-dom';
import { machineGames } from '../machineRegistry';

const MachinesHome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-800 to-yellow-900 flex flex-col items-center p-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {['🚜', '🚛', '🏗️', '🚂', '🚌'].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-6xl opacity-10"
            style={{
              left: `${(i * 21 + 5) % 85}%`,
              top: `${(i * 31 + 10) % 80}%`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between mb-8 pt-2">
        <Link
          to="/"
          className="bg-white/20 hover:bg-white/30 active:scale-95 px-5 py-3 rounded-full font-bold text-lg transition-all border-2 border-white/30 hover:border-white/60 touch-manipulation"
          style={{ minHeight: '52px' }}
        >
          ← Tilbage
        </Link>
        <h1 className="font-pixel text-sm sm:text-lg text-orange-200 drop-shadow-lg">
          Maskiner
        </h1>
        <span className="text-4xl" role="img" aria-label="Traktor">🚜</span>
      </div>

      {/* Game cards */}
      <div className="relative z-10 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
        {machineGames.map((game) => (
          <Link
            key={game.id}
            to={game.path}
            className={`bg-gradient-to-br ${game.gradient} rounded-3xl shadow-xl flex flex-col items-center p-6 text-white transition-transform hover:scale-105 active:scale-95 border-2 border-white/20 touch-manipulation`}
            style={{ minHeight: '200px' }}
          >
            <span
              className="text-7xl mb-4 drop-shadow-lg"
              role="img"
              aria-label={game.title}
            >
              {game.emoji}
            </span>
            <h2 className="font-pixel text-[9px] sm:text-[10px] text-center mb-2 leading-relaxed">
              {game.title}
            </h2>
            <p className="text-center text-base opacity-90 leading-snug flex-1">
              {game.description}
            </p>
            <span className="mt-4 bg-black/20 rounded-full px-4 py-1.5 text-sm font-bold">
              3+ år
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MachinesHome;
