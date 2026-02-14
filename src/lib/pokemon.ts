// Deterministic PokeAPI sprite URLs — no API calls needed

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export const getSprite = (id: number) => `${SPRITE_BASE}/${id}.png`;
export const getArtwork = (id: number) =>
  `${SPRITE_BASE}/other/official-artwork/${id}.png`;

export interface PokemonEntry {
  id: number;
  name: string;
  type: string;
}

export const POKEMON_DATA: PokemonEntry[] = [
  // First 8 used by Memory game — do not reorder
  { id: 1, name: 'Bulbasaur', type: 'grass' },
  { id: 4, name: 'Charmander', type: 'fire' },
  { id: 7, name: 'Squirtle', type: 'water' },
  { id: 25, name: 'Pikachu', type: 'electric' },
  { id: 39, name: 'Jigglypuff', type: 'fairy' },
  { id: 52, name: 'Meowth', type: 'normal' },
  { id: 133, name: 'Eevee', type: 'normal' },
  { id: 143, name: 'Snorlax', type: 'normal' },
  // Game-referenced Pokémon
  { id: 129, name: 'Magikarp', type: 'water' },
  { id: 23, name: 'Ekans', type: 'poison' },
  { id: 92, name: 'Gastly', type: 'ghost' },
  { id: 93, name: 'Haunter', type: 'ghost' },
  { id: 94, name: 'Gengar', type: 'ghost' },
  { id: 35, name: 'Clefairy', type: 'fairy' },
  { id: 54, name: 'Psyduck', type: 'water' },
  { id: 150, name: 'Mewtwo', type: 'psychic' },
  { id: 50, name: 'Diglett', type: 'ground' },
  { id: 74, name: 'Geodude', type: 'rock' },
  // Starters & evolutions
  { id: 2, name: 'Ivysaur', type: 'grass' },
  { id: 3, name: 'Venusaur', type: 'grass' },
  { id: 5, name: 'Charmeleon', type: 'fire' },
  { id: 6, name: 'Charizard', type: 'fire' },
  { id: 8, name: 'Wartortle', type: 'water' },
  { id: 9, name: 'Blastoise', type: 'water' },
  // Fan favorites
  { id: 12, name: 'Butterfree', type: 'bug' },
  { id: 16, name: 'Pidgey', type: 'flying' },
  { id: 26, name: 'Raichu', type: 'electric' },
  { id: 37, name: 'Vulpix', type: 'fire' },
  { id: 38, name: 'Ninetales', type: 'fire' },
  { id: 104, name: 'Cubone', type: 'ground' },
  { id: 131, name: 'Lapras', type: 'water' },
  { id: 132, name: 'Ditto', type: 'normal' },
  // Eevee evolutions
  { id: 134, name: 'Vaporeon', type: 'water' },
  { id: 135, name: 'Jolteon', type: 'electric' },
  { id: 136, name: 'Flareon', type: 'fire' },
  // Legendaries & cool picks
  { id: 142, name: 'Aerodactyl', type: 'rock' },
  { id: 144, name: 'Articuno', type: 'ice' },
  { id: 149, name: 'Dragonite', type: 'dragon' },
  { id: 151, name: 'Mew', type: 'psychic' },
];
