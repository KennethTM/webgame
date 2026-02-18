export interface MachineGameMetadata {
  id: string;
  title: string;
  description: string;
  emoji: string;
  path: string;
  gradient: string;
  bgColor: string;
}

export const machineGames: MachineGameMetadata[] = [
  {
    id: 'memory',
    title: 'Maskiner Memory',
    description: 'Find alle de ens maskiner!',
    emoji: '🚜',
    path: '/maskiner/game/memory',
    gradient: 'from-green-500 to-green-700',
    bgColor: 'bg-gradient-to-b from-green-700 to-green-900',
  },
  {
    id: 'tractor',
    title: 'Traktor Høst',
    description: 'Kør traktoren og saml afgrøderne!',
    emoji: '🌾',
    path: '/maskiner/game/tractor',
    gradient: 'from-yellow-500 to-amber-600',
    bgColor: 'bg-gradient-to-b from-amber-700 to-yellow-900',
  },
  {
    id: 'appletree',
    title: 'Æbletræ',
    description: 'Jag fuglene væk og beskyt æblerne!',
    emoji: '🍎',
    path: '/maskiner/game/appletree',
    gradient: 'from-red-500 to-rose-700',
    bgColor: 'bg-gradient-to-b from-sky-400 to-sky-600',
  },
];
