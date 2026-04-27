/** Score for clearing lines at a given level */
export function calcScore(
  state: { score: number; level: number; lines: number },
  linesCleared: number
): { score: number; level: number; lines: number } {
  const LINE_SCORES = [0, 100, 300, 500, 800];
  const points = (LINE_SCORES[linesCleared] ?? 0) * state.level;
  const totalLines = state.lines + linesCleared;
  const level = Math.floor(totalLines / 10) + 1;
  return { score: state.score + points, level, lines: totalLines };
}

/** Gravity interval in ms at a given level */
export function getGravity(level: number): number {
  return Math.max(100, 1000 - (level - 1) * 90);
}
