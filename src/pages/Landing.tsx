import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative background dots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${20 + (i * 13) % 60}px`,
              height: `${20 + (i * 13) % 60}px`,
              left: `${(i * 17 + 5) % 95}%`,
              top: `${(i * 23 + 10) % 90}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl">
        {/* Title with sparkle */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl sm:text-4xl" aria-hidden="true">🎮</span>
          <h1 className="font-pixel text-xl sm:text-3xl text-white text-center drop-shadow-lg">
            Vælg dit spil!
          </h1>
          <span className="text-3xl sm:text-4xl" aria-hidden="true">🎮</span>
        </div>
        <p className="text-blue-300 text-center mb-10 text-lg">Hvad vil du lege med?</p>

        {/* Game section cards */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">

          {/* Pokémon */}
          <Link
            to="/pokemon"
            className="group flex flex-col items-center justify-center gap-3 sm:gap-4
              bg-gradient-to-br from-yellow-400 via-red-500 to-red-700
              rounded-3xl shadow-2xl p-6 sm:p-8 min-h-48 sm:min-h-64 text-white
              border-4 border-yellow-300/40
              hover:scale-105 active:scale-95 transition-transform duration-200
              hover:border-yellow-300/80 touch-manipulation"
          >
            <span className="text-6xl sm:text-8xl leading-none group-hover:animate-bounce">⚡</span>
            <span className="font-pixel text-sm sm:text-2xl drop-shadow-lg text-center leading-tight">
              Pokémon
            </span>
            <span className="bg-black/20 rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm font-bold text-yellow-100">
              6 år +
            </span>
          </Link>

          {/* Maskiner */}
          <Link
            to="/maskiner"
            className="group flex flex-col items-center justify-center gap-3 sm:gap-4
              bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-600
              rounded-3xl shadow-2xl p-6 sm:p-8 min-h-48 sm:min-h-64 text-white
              border-4 border-orange-300/40
              hover:scale-105 active:scale-95 transition-transform duration-200
              hover:border-orange-200/80 touch-manipulation"
          >
            <span className="text-6xl sm:text-8xl leading-none group-hover:animate-bounce">🚜</span>
            <span className="font-pixel text-sm sm:text-2xl drop-shadow-lg text-center leading-tight">
              Maskiner
            </span>
            <span className="bg-black/20 rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm font-bold text-orange-100">
              3 år +
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
