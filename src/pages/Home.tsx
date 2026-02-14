import { Link } from 'react-router-dom';
import { games } from '../gameRegistry';
import SpriteImage from '../components/SpriteImage';
import PokeBall from '../components/PokeBall';
import { getScores } from '../lib/highScores';

const MAX_STARS = games.length * 3;

const Home = () => {
  const scores = getScores();
  const totalStars = games.reduce((sum, g) => sum + (scores[g.id]?.bestStars ?? 0), 0);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Pokeball silhouettes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-pokeball"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${10 + i * 2}s`,
            }}
          >
            <PokeBall size={30 + i * 5} variant={(['standard', 'great', 'ultra', 'master'] as const)[i % 4]} />
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-10">
          {/* Pokéball accent line */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent to-pokemon-red rounded-full" />
            <PokeBall size={20} />
            <div className="h-1 w-16 bg-gradient-to-l from-transparent to-pokemon-red rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-4 mb-3">
            <SpriteImage pokemonId={25} variant="artwork" size={72} className="drop-shadow-[0_0_12px_rgba(255,222,0,0.4)]" />
            <h1 className="font-pixel text-3xl md:text-4xl text-pokemon-yellow drop-shadow-[0_0_20px_rgba(255,222,0,0.7)] animate-pulse-glow rounded-xl px-2">
              Pok&eacute;mon Arcade
            </h1>
            <SpriteImage pokemonId={133} variant="artwork" size={72} className="drop-shadow-[0_0_12px_rgba(183,130,87,0.4)]" />
          </div>
          <p className="text-lg text-blue-200 mb-1">Choose a game to start your adventure!</p>
          <p className="font-pixel text-[10px] text-pokemon-yellow/50 tracking-wider mb-4">KANTO REGION</p>

          {/* Star progress */}
          <div className="inline-flex items-center gap-3 bg-black/30 backdrop-blur-sm px-5 py-2 rounded-full">
            <span className="text-pokemon-yellow text-lg">&#9733;</span>
            <span className="font-pixel text-sm text-white">{totalStars} / {MAX_STARS}</span>
            <div className="w-24 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pokemon-yellow to-pokemon-gold rounded-full transition-all duration-500"
                style={{ width: `${(totalStars / MAX_STARS) * 100}%` }}
              />
            </div>
          </div>
        </header>

        {/* Game cards — 2-column grid for kid-friendly large cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {games.map((game) => (
            <Link
              key={game.id}
              to={game.path}
              className={`
                group relative bg-gradient-to-br ${game.gradient}
                rounded-2xl shadow-xl overflow-hidden
                flex flex-col items-center p-6
                min-h-[200px] text-white
                transition-transform duration-200
                hover:scale-105 active:scale-95
                border-2 border-white/10 hover:border-pokemon-yellow/40
              `}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"
                   style={{ boxShadow: 'inset 0 0 40px rgba(255,255,255,0.15)' }} />

              {/* Per-game stars */}
              <div className="absolute top-2 right-2 flex gap-0.5">
                {[1, 2, 3].map(s => (
                  <span
                    key={s}
                    className={`text-sm ${(scores[game.id]?.bestStars ?? 0) >= s ? 'text-pokemon-yellow drop-shadow-[0_0_4px_rgba(255,222,0,0.6)]' : 'text-white/20'}`}
                  >
                    &#9733;
                  </span>
                ))}
              </div>

              <SpriteImage pokemonId={game.pokemonId} size={96} className="mb-3 drop-shadow-lg group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all" />
              <h2 className="font-pixel text-sm mb-2 text-center">{game.title}</h2>
              <p className="text-center text-sm opacity-90 leading-relaxed">{game.description}</p>

              {/* Bottom PokéBall divider */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </Link>
          ))}
        </div>

        {/* Footer tagline */}
        <footer className="text-center mt-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-pokemon-red/30" />
            <PokeBall size={14} />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-pokemon-red/30" />
          </div>
          <p className="font-pixel text-xs text-pokemon-yellow/40">Gotta Play &apos;Em All!</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
