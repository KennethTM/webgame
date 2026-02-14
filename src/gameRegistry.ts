export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  pokemonId: number;
  path: string;
  gradient: string;
  bgVariant: string;
}

export const games: GameMetadata[] = [
  {
    id: 'snake',
    title: 'PokéSnake',
    description: 'Help Ekans eat berries and grow!',
    pokemonId: 23,        // Ekans
    path: '/game/snake',
    gradient: 'from-purple-600 to-purple-900',
    bgVariant: 'grass',
  },
  {
    id: 'pacman',
    title: 'PokéBall Maze',
    description: 'Collect Rare Candies and avoid Gastly!',
    pokemonId: 92,        // Gastly
    path: '/game/pacman',
    gradient: 'from-amber-500 to-orange-700',
    bgVariant: 'cave',
  },
  {
    id: 'memory',
    title: 'Pokémon Match',
    description: 'Find all the Pokémon pairs!',
    pokemonId: 25,        // Pikachu
    path: '/game/memory',
    gradient: 'from-blue-500 to-blue-800',
    bgVariant: 'water',
  },
  {
    id: 'jump',
    title: 'Magikarp Jump',
    description: 'How high can your Magikarp jump?',
    pokemonId: 129,       // Magikarp
    path: '/game/jump',
    gradient: 'from-red-500 to-red-800',
    bgVariant: 'sky',
  },
  {
    id: 'quiz',
    title: "Who's That Pokémon?",
    description: 'Guess the Pokémon from its silhouette!',
    pokemonId: 25,        // Pikachu
    path: '/game/quiz',
    gradient: 'from-yellow-400 to-amber-600',
    bgVariant: 'sky',
  },
  {
    id: 'toss',
    title: 'PokéBall Toss',
    description: 'Catch wild Pokémon with perfect throws!',
    pokemonId: 1,         // Bulbasaur
    path: '/game/toss',
    gradient: 'from-green-500 to-emerald-700',
    bgVariant: 'grass',
  },
  {
    id: 'run',
    title: 'PokéRun',
    description: 'Jump over obstacles and collect berries!',
    pokemonId: 25,        // Pikachu
    path: '/game/run',
    gradient: 'from-yellow-400 to-amber-600',
    bgVariant: 'sky',
  },
];
