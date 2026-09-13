import { PieceType, Pos } from './types';

// Base matrices: 1 = filled, row 0 on top. Rotation CW = rotate matrix, offsets cached per (type, rot).
export const MATRICES: Record<PieceType, number[][]> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};

export const SPAWN: Record<PieceType, Pos> = {
  I: { x: 3, y: 1 },  // I occupies row 1 of its 4x4 box
  O: { x: 4, y: 0 },
  T: { x: 3, y: 0 }, S: { x: 3, y: 0 }, Z: { x: 3, y: 0 },
  J: { x: 3, y: 0 }, L: { x: 3, y: 0 },
};

export const BOARD_W = 10;
export const BOARD_H = 22;
export const HIDDEN_ROWS = 2;
export const LOCK_DELAY_MS = 500;
export const LOCK_RESET_CAP = 15;
export const DAS_MS = 170;
export const ARR_MS = 40;
export const SOFT_DROP_MS = 40;
export const NEXT_VISIBLE = 5;

export function gravityMs(level: number): number {
  return Math.max(50, Math.floor(1000 * Math.pow(0.85, level - 1)));
}

export const LINE_SCORE = [0, 100, 300, 500, 800] as const;
export const TSPIN_SCORE = [0, 800, 1200, 1600] as const;
export const B2B_MULT = 1.5;

// SRS kick tables. Screen coords: y grows down, so SRS +y (up) is stored negated.
// Key `from>to`, entry [dx, dy] in screen coords applied to piece.pos in order.
export const KICKS_JLSTZ: Record<string, [number, number][]> = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};
export const KICKS_I: Record<string, [number, number][]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};
