export interface ScoreState {
  score: number;
  level: number;
  lines: number;
}

const LINE_SCORES = [0, 100, 300, 500, 800];

/**
 * Calculate the new score state after clearing lines.
 * LINE_SCORES: 0=0, 1=100, 2=300, 3=500, 4=800
 * Level increases every 10 lines, starting at level 1.
 * Formula: points = LINE_SCORES[linesCleared] * level
 */
export function calcScore(
  state: ScoreState,
  linesCleared: number
): ScoreState {
  const points = (LINE_SCORES[linesCleared] ?? 0) * state.level;
  const totalLines = state.lines + linesCleared;
  const level = Math.floor(totalLines / 10) + 1;
  return {
    score: state.score + points,
    level,
    lines: totalLines,
  };
}

/**
 * Get the gravity interval (in ms) for a given level.
 * Starts at 1000ms, decreases by 90ms per level, minimum 100ms.
 */
export function getGravity(level: number): number {
  return Math.max(100, 1000 - (level - 1) * 90);
}
