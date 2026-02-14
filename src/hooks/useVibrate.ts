/** Trigger haptic feedback on supported devices (tablets/phones). Silently no-ops elsewhere. */
export function vibrate(pattern: number | number[] = 30) {
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
}

/** Short tap — berry eaten, card matched, correct answer */
export const vibrateSuccess = () => vibrate(20);

/** Double buzz — wrong answer, collision */
export const vibrateError = () => vibrate([30, 50, 30]);

/** Long buzz — game over */
export const vibrateGameOver = () => vibrate([50, 30, 80]);

/** Celebratory — victory */
export const vibrateVictory = () => vibrate([20, 40, 20, 40, 60]);
