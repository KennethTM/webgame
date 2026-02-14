import { useState, useCallback } from 'react';
import { getGameScore, updateGameScore, type GameScore } from '../lib/highScores';

export function useHighScore(gameId: string, lowerIsBetter = false) {
  const [best, setBest] = useState<GameScore>(() => getGameScore(gameId));

  const submitScore = useCallback((score: number, stars: number) => {
    if (score <= 0) return;
    updateGameScore(gameId, score, stars, lowerIsBetter);
    setBest(getGameScore(gameId));
  }, [gameId, lowerIsBetter]);

  return { best, submitScore };
}
