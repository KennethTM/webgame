import { Link } from 'react-router-dom';
import { machineGames } from '../machineRegistry';

const MachinesHome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-800 via-amber-800 to-yellow-900 flex flex-col items-center p-6 text-white relative overflow-hidden">
      {/* Background decoration — scattered machine emojis */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {['🚜', '🚛', '🏗️', '🚂', '🚌', '🚒', '🚗', '⭐'].map((emoji, i) => (
          <div
            key={i}
            className="absolute opacity-[0.07]"
            style={{
              left: `${(i * 14 + 3) % 90}%`,
              top: `${(i * 19 + 8) % 85}%`,
              fontSize: `${40 + (i % 4) * 12}px`,
              transform: `rotate(${(i * 17) % 30 - 15}deg)`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between mb-6 sm:mb-8 pt-2">
        <Link
          to="/"
          className="bg-white/20 hover:bg-white/30 active:scale-95 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full font-bold text-base sm:text-lg transition-all border-2 border-white/30 hover:border-white/60 touch-manipulation"
          style={{ minHeight: '48px' }}
        >
          ← Tilbage
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-3xl sm:text-4xl" role="img" aria-label="Traktor">🚜</span>
          <h1 className="font-pixel text-xs sm:text-lg text-orange-200 drop-shadow-lg">
            Maskiner
          </h1>
        </div>
        <div className="w-[80px]" /> {/* Spacer for centering */}
      </div>

      {/* Game cards */}
      <div className="relative z-10 w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {machineGames.map((game) => (
          <Link
            key={game.id}
            to={game.path}
            className={`group bg-gradient-to-br ${game.gradient} rounded-3xl shadow-xl flex flex-col items-center p-4 sm:p-6 text-white transition-transform hover:scale-105 active:scale-95 border-2 border-white/20 hover:border-white/40 touch-manipulation relative overflow-hidden`}
            style={{ minHeight: '170px' }}
          >
            {/* Subtle hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none"
                 style={{ boxShadow: 'inset 0 0 40px rgba(255,255,255,0.12)' }} />

            <span
              className="text-5xl sm:text-7xl mb-3 sm:mb-4 drop-shadow-lg relative z-10"
              role="img"
              aria-label={game.title}
            >
              {game.emoji}
            </span>
            <h2 className="font-pixel text-[8px] sm:text-[10px] text-center mb-1.5 sm:mb-2 leading-relaxed relative z-10">
              {game.title}
            </h2>
            <p className="text-center text-sm sm:text-base opacity-90 leading-snug flex-1 relative z-10">
              {game.description}
            </p>
            <span className="mt-3 sm:mt-4 bg-black/20 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold relative z-10">
              3+ år
            </span>

            {/* Bottom divider accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MachinesHome;
