const STORAGE_KEY = 'pokemon-arcade-scores';

export interface GameScore {
  bestScore: number;
  bestStars: number;
}

export type AllScores = Record<string, GameScore>;

export function getScores(): AllScores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AllScores) : {};
  } catch {
    return {};
  }
}

export function getGameScore(gameId: string): GameScore {
  return getScores()[gameId] ?? { bestScore: 0, bestStars: 0 };
}

export function updateGameScore(
  gameId: string,
  score: number,
  stars: number,
  lowerIsBetter = false,
): void {
  const scores = getScores();
  const prev = scores[gameId] ?? { bestScore: 0, bestStars: 0 };

  const isNewBest = prev.bestScore === 0
    || (lowerIsBetter ? score < prev.bestScore : score > prev.bestScore);

  scores[gameId] = {
    bestScore: isNewBest ? score : prev.bestScore,
    bestStars: Math.max(prev.bestStars, stars),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // storage full — silently ignore
  }
}
