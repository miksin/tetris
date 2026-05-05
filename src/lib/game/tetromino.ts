import { BOARD_ROWS, BOARD_COLS, HIDDEN_ROWS } from './constants';

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Rotation = 0 | 1 | 2 | 3;

export interface ActivePiece {
  type: TetrominoType;
  rotation: Rotation;
  row: number;
  col: number;
}

/**
 * Tetromino shapes defined as rotation states.
 * Each rotation state is an array of [row, col] offsets relative to the piece origin.
 */
export const TETROMINOES: Record<TetrominoType, [number, number][][]> = {
  I: [
    [[0, 0], [0, 1], [0, 2], [0, 3]], // 0: horizontal
    [[0, 2], [1, 2], [2, 2], [3, 2]], // 1: pointing up
    [[2, 0], [2, 1], [2, 2], [2, 3]], // 2: horizontal (flipped)
    [[0, 1], [1, 1], [2, 1], [3, 1]], // 3: pointing down
  ],
  O: [
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
  ],
  T: [
    [[0, 1], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
  ],
  S: [
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 1], [1, 2], [2, 0], [2, 1]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
  ],
  Z: [
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 2], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
  ],
  J: [
    [[0, 0], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 0], [2, 1]],
  ],
  L: [
    [[0, 2], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [1, 2], [2, 0]],
    [[0, 0], [0, 1], [1, 1], [2, 1]],
  ],
};

/**
 * SRS wall kick offsets for JLSTZ pieces.
 * Indexed as [fromRotation][toRotation] → array of [colOffset, rowOffset] tests.
 */
const JLSTZ_KICKS: Record<number, Record<number, [number, number][]>> = {
  0: {
    1: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    3: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  },
  1: {
    0: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    2: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  },
  2: {
    1: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    3: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  },
  3: {
    2: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    0: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  },
};

/**
 * SRS wall kick offsets for I piece.
 */
const I_KICKS: Record<number, Record<number, [number, number][]>> = {
  0: {
    1: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    3: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  },
  1: {
    0: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    2: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  },
  2: {
    1: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    3: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  },
  3: {
    2: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    0: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  },
};

function getKickOffsets(
  type: TetrominoType,
  fromRotation: Rotation,
  toRotation: Rotation
): [number, number][] {
  if (type === 'I') {
    return I_KICKS[fromRotation]?.[toRotation] ?? [[0, 0]];
  }
  if (type === 'O') {
    return [[0, 0]]; // O never kicks
  }
  return JLSTZ_KICKS[fromRotation]?.[toRotation] ?? [[0, 0]];
}

/**
 * Get the absolute [row, col] positions of a piece's cells.
 */
export function getCells(piece: ActivePiece): [number, number][] {
  const shape = TETROMINOES[piece.type][piece.rotation];
  return shape.map(([r, c]) => [piece.row + r, piece.col + c]);
}

/**
 * Fisher-Yates shuffle — returns a new shuffled array.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate a new 7-bag shuffle of all piece types.
 */
export function newBag(): TetrominoType[] {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return shuffle(types);
}

/**
 * Spawn a new piece at the top of the board (in the hidden buffer).
 */
export function spawnPiece(type: TetrominoType): ActivePiece {
  const col = type === 'O' ? 4 : 3;
  return { type, rotation: 0 as Rotation, row: -1, col };
}

/**
 * Try to rotate a piece using SRS wall kicks.
 * Returns the rotated piece if a valid position is found, or null if rotation is blocked.
 * @param board - The current board grid.
 * @param isValidPosition - Function to check if a piece position is valid.
 * @param piece - The current piece to rotate.
 * @param dir - Rotation direction: 1 for CW, -1 for CCW.
 */
export function tryRotate(
  board: unknown,
  isValidPosition: (board: unknown, piece: ActivePiece) => boolean,
  piece: ActivePiece,
  dir: 1 | -1
): ActivePiece | null {
  const fromRot = piece.rotation;
  const toRot = (((fromRot + dir) % 4) + 4) % 4 as Rotation;
  const kicks = getKickOffsets(piece.type, fromRot, toRot);

  for (const [colOff, rowOff] of kicks) {
    const candidate: ActivePiece = {
      type: piece.type,
      rotation: toRot,
      row: piece.row + rowOff,
      col: piece.col + colOff,
    };
    if (isValidPosition(board, candidate)) {
      return candidate;
    }
  }

  return null;
}
