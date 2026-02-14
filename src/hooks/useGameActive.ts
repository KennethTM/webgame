import { createContext, useContext, useState, useCallback } from 'react';

interface GameActiveContextValue {
  isGameActive: boolean;
  setGameActive: (active: boolean) => void;
}

export const GameActiveContext = createContext<GameActiveContextValue>({
  isGameActive: false,
  setGameActive: () => {},
});

export function useGameActiveProvider() {
  const [isGameActive, setIsGameActive] = useState(false);
  const setGameActive = useCallback((active: boolean) => setIsGameActive(active), []);
  return { isGameActive, setGameActive };
}

export function useGameActive() {
  return useContext(GameActiveContext);
}
