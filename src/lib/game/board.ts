import { BOARD_ROWS, BOARD_COLS } from './constants';
import type { TetrominoType } from './tetromino';
import { getCells } from './tetromino';
import type { ActivePiece } from './tetromino';

export type Cell = TetrominoType | null;
export type Board = Cell[][];

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
}

export function isValidPosition(board: Board, piece: ActivePiece): boolean {
  for (const [r, c] of getCells(piece)) {
    if (c < 0 || c >= BOARD_COLS) return false;
    if (r >= BOARD_ROWS) return false;
    if (r >= 0 && board[r][c] !== null) return false;
  }
  return true;
}

export function lockPiece(board: Board, piece: ActivePiece): Board {
  const next: Board = board.map(row => [...row]);
  for (const [r, c] of getCells(piece)) {
    if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS) {
      next[r][c] = piece.type;
    }
  }
  return next;
}

/** Returns [new board, lines cleared] */
export function clearLines(board: Board): [Board, number] {
  const remaining = board.filter(row => row.some(c => c === null));
  const cleared = BOARD_ROWS - remaining.length;
  const empty: Board = Array.from({ length: cleared }, () => Array(BOARD_COLS).fill(null));
  return [[...empty, ...remaining], cleared];
}

export function getGhostPiece(board: Board, piece: ActivePiece): ActivePiece {
  let ghost = { ...piece };
  while (isValidPosition(board, { ...ghost, row: ghost.row + 1 })) {
    ghost = { ...ghost, row: ghost.row + 1 };
  }
  return ghost;
}
