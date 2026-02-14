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
    description: 'Hjælp Ekans med at spise bær og vokse!',
    pokemonId: 23,        // Ekans
    path: '/game/snake',
    gradient: 'from-purple-600 to-purple-900',
    bgVariant: 'grass',
  },
  {
    id: 'pacman',
    title: 'PokéBall Maze',
    description: 'Saml Rare Candies og undgå Gastly!',
    pokemonId: 92,        // Gastly
    path: '/game/pacman',
    gradient: 'from-amber-500 to-orange-700',
    bgVariant: 'cave',
  },
  {
    id: 'memory',
    title: 'Pokémon Match',
    description: 'Find alle Pokémon-parrene!',
    pokemonId: 39,        // Jigglypuff
    path: '/game/memory',
    gradient: 'from-blue-500 to-blue-800',
    bgVariant: 'water',
  },
  {
    id: 'jump',
    title: 'Magikarp Jump',
    description: 'Hvor højt kan din Magikarp hoppe?',
    pokemonId: 129,       // Magikarp
    path: '/game/jump',
    gradient: 'from-red-500 to-red-800',
    bgVariant: 'sky',
  },
  {
    id: 'quiz',
    title: "Who's That Pokémon?",
    description: 'Gæt Pokémon ud fra silhuetten!',
    pokemonId: 54,        // Psyduck
    path: '/game/quiz',
    gradient: 'from-yellow-400 to-amber-600',
    bgVariant: 'sky',
  },
  {
    id: 'toss',
    title: 'PokéBall Toss',
    description: 'Fang vilde Pokémon med perfekte kast!',
    pokemonId: 1,         // Bulbasaur
    path: '/game/toss',
    gradient: 'from-green-500 to-emerald-700',
    bgVariant: 'grass',
  },
  {
    id: 'run',
    title: 'PokéRun',
    description: 'Hop over forhindringer og saml bær!',
    pokemonId: 25,        // Pikachu
    path: '/game/run',
    gradient: 'from-yellow-400 to-amber-600',
    bgVariant: 'sky',
  },
];
