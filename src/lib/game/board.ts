import { BOARD_ROWS, BOARD_COLS } from './constants';
import type { TetrominoType } from './tetromino';
import { getCells } from './tetromino';
import type { ActivePiece } from './tetromino';

export type Cell = TetrominoType | null;
export type Board = Cell[][];

/**
 * Create an empty board (BOARD_ROWS x BOARD_COLS grid filled with null).
 */
export function emptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
}

/**
 * Check whether a piece is in a valid position on the board.
 * Returns false if any cell is out of bounds or overlaps an existing cell.
 */
export function isValidPosition(board: Board, piece: ActivePiece): boolean {
  const cells = getCells(piece);
  for (const [r, c] of cells) {
    // Allow rows above the board (hidden buffer)
    if (c < 0 || c >= BOARD_COLS) return false;
    if (r >= BOARD_ROWS) return false;
    if (r >= 0 && board[r][c] !== null) return false;
  }
  return true;
}

/**
 * Lock a piece onto the board. Returns a new board (deep copy) with the piece cells filled.
 */
export function lockPiece(board: Board, piece: ActivePiece): Board {
  const newBoard = board.map(row => [...row]);
  const cells = getCells(piece);
  for (const [r, c] of cells) {
    if (r >= 0 && r < BOARD_ROWS) {
      newBoard[r][c] = piece.type;
    }
  }
  return newBoard;
}

/**
 * Clear completed lines from the board.
 * Returns [newBoard, linesCleared] where newBoard is the board with filled rows
 * removed and empty rows added at the top.
 */
export function clearLines(board: Board): [Board, number] {
  const remaining = board.filter(row => row.some(cell => cell === null));
  const linesCleared = BOARD_ROWS - remaining.length;
  if (linesCleared === 0) return [board, 0];
  const emptyRows: Board = Array.from({ length: linesCleared }, () =>
    Array(BOARD_COLS).fill(null)
  );
  return [[...emptyRows, ...remaining], linesCleared];
}

/**
 * Get the ghost piece position — the lowest valid row for the piece.
 */
export function getGhostPiece(board: Board, piece: ActivePiece): ActivePiece {
  let ghost = { ...piece };
  while (isValidPosition(board, { ...ghost, row: ghost.row + 1 })) {
    ghost = { ...ghost, row: ghost.row + 1 };
  }
  return ghost;
}
