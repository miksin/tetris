import { describe, it, expect } from 'vitest';
import { BOARD_ROWS, BOARD_COLS, HIDDEN_ROWS, COLORS } from '$lib/game/constants';
import {
  emptyBoard,
  isValidPosition,
  lockPiece,
  clearLines,
  getGhostPiece,
} from '$lib/game/board';
import type { Board } from '$lib/game/board';
import {
  TETROMINOES,
  newBag,
  spawnPiece,
  tryRotate,
  getCells,
} from '$lib/game/tetromino';
import type { ActivePiece, TetrominoType, Rotation } from '$lib/game/tetromino';
import { calcScore, getGravity } from '$lib/game/scoring';
import type { ScoreState } from '$lib/game/scoring';

// ─── Board Tests ────────────────────────────────────────────────

describe('board', () => {
  describe('emptyBoard', () => {
    it('creates a board with correct dimensions', () => {
      const board = emptyBoard();
      expect(board.length).toBe(BOARD_ROWS);
      for (const row of board) {
        expect(row.length).toBe(BOARD_COLS);
      }
    });

    it('creates a board filled with nulls', () => {
      const board = emptyBoard();
      for (const row of board) {
        for (const cell of row) {
          expect(cell).toBeNull();
        }
      }
    });
  });

  describe('isValidPosition', () => {
    it('accepts a piece in bounds on empty board', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 0, col: 3 };
      expect(isValidPosition(board, piece)).toBe(true);
    });

    it('rejects a piece with column out of bounds (left)', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 0, col: -2 };
      expect(isValidPosition(board, piece)).toBe(false);
    });

    it('rejects a piece with column out of bounds (right)', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 0, col: BOARD_COLS };
      expect(isValidPosition(board, piece)).toBe(false);
    });

    it('rejects a piece below the board', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'T', rotation: 0, row: BOARD_ROWS, col: 3 };
      expect(isValidPosition(board, piece)).toBe(false);
    });

    it('accepts a piece in the hidden buffer (negative row)', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'I', rotation: 0, row: -1, col: 3 };
      expect(isValidPosition(board, piece)).toBe(true);
    });

    it('rejects a piece overlapping an occupied cell', () => {
      const board = emptyBoard();
      // T rotation 0 cells: [[0,1],[1,0],[1,1],[1,2]] -> absolute [0,4],[1,3],[1,4],[1,5]
      board[1][4] = 'S'; // overlaps the cell at [1,4]
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 0, col: 3 };
      expect(isValidPosition(board, piece)).toBe(false);
    });
  });

  describe('lockPiece', () => {
    it('places piece cells on the board', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 0, col: 3 };
      const newBoard = lockPiece(board, piece);
      // T rotation 0: [[0,1], [1,0], [1,1], [1,2]]
      expect(newBoard[0][4]).toBe('T');
      expect(newBoard[1][3]).toBe('T');
      expect(newBoard[1][4]).toBe('T');
      expect(newBoard[1][5]).toBe('T');
    });

    it('does not mutate the original board', () => {
      const board = emptyBoard();
      board[0][0] = 'S';
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 5, col: 3 };
      lockPiece(board, piece);
      // Original unchanged
      expect(board[0][0]).toBe('S');
    });

    it('skips cells above the board (hidden buffer)', () => {
      const board = emptyBoard();
      // I piece at row=-1, rotation=0 => cells at row=-1 (all hidden)
      const piece: ActivePiece = { type: 'I', rotation: 0, row: -1, col: 3 };
      const newBoard = lockPiece(board, piece);
      // No cells placed on the visible board
      const allNull = newBoard.every(row => row.every(c => c === null));
      expect(allNull).toBe(true);
    });
  });

  describe('clearLines', () => {
    it('returns 0 lines if no lines are full', () => {
      const board = emptyBoard();
      const [newBoard, linesCleared] = clearLines(board);
      expect(linesCleared).toBe(0);
      expect(newBoard).toEqual(board);
    });

    it('clears a single full line', () => {
      const board = emptyBoard();
      // Fill bottom row
      for (let c = 0; c < BOARD_COLS; c++) {
        board[BOARD_ROWS - 1][c] = 'I';
      }
      const [newBoard, linesCleared] = clearLines(board);
      expect(linesCleared).toBe(1);
      // Bottom row should now be empty (null), and the new bottom is at the top
      expect(newBoard.length).toBe(BOARD_ROWS);
      // Top row should be empty (newly added)
      expect(newBoard[0].every(c => c === null)).toBe(true);
    });

    it('clears multiple lines', () => {
      const board = emptyBoard();
      // Fill bottom 2 rows
      for (let r = BOARD_ROWS - 2; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          board[r][c] = 'I';
        }
      }
      const [newBoard, linesCleared] = clearLines(board);
      expect(linesCleared).toBe(2);
      expect(newBoard.length).toBe(BOARD_ROWS);
    });

    it('preserves partial rows above cleared lines', () => {
      const board = emptyBoard();
      // Place a single cell in row 17
      board[17][0] = 'T';
      // Fill row 18 and 19
      for (let c = 0; c < BOARD_COLS; c++) {
        board[18][c] = 'I';
        board[19][c] = 'I';
      }
      const [newBoard, linesCleared] = clearLines(board);
      expect(linesCleared).toBe(2);
      // The remaining cell should have shifted down
      expect(newBoard[19][0]).toBe('T');
    });
  });

  describe('getGhostPiece', () => {
    it('returns the piece at the lowest valid row', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 0, col: 3 };
      const ghost = getGhostPiece(board, piece);
      // Should be at the very bottom
      expect(ghost.col).toBe(3);
      expect(ghost.type).toBe('T');
      expect(ghost.rotation).toBe(0);
      // Ghost should be lower than original
      expect(ghost.row).toBeGreaterThan(piece.row);
    });

    it('ghost stops above occupied cells', () => {
      const board = emptyBoard();
      // Block row 18 with a full line of 'I'
      const blockerRow = BOARD_ROWS - 2;
      for (let c = 0; c < BOARD_COLS; c++) {
        board[blockerRow][c] = 'I';
      }
      const piece: ActivePiece = { type: 'O', rotation: 0, row: 0, col: 4 };
      const ghost = getGhostPiece(board, piece);
      // O piece is 2x2, so it should stop 2 rows above bottom
      // Blocked at row 18, O needs row 16 and 17 to be valid
      // Actually O at row 16 => cells at [16,4], [16,5], [17,4], [17,5]
      // row 17 is valid (still null), so ghost should be at row 16
      expect(ghost.row).toBe(blockerRow - 2);
    });
  });
});

// ─── Tetromino Tests ────────────────────────────────────────────

describe('tetromino', () => {
  describe('TETROMINOES', () => {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

    for (const type of types) {
      it(`${type} has 4 rotation states`, () => {
        expect(TETROMINOES[type].length).toBe(4);
      });

      it(`${type} has exactly 4 cells in each rotation`, () => {
        for (let rot = 0; rot < 4; rot++) {
          expect(TETROMINOES[type][rot].length).toBe(4);
        }
      });
    }
  });

  describe('newBag', () => {
    it('returns exactly 7 pieces', () => {
      const bag = newBag();
      expect(bag.length).toBe(7);
    });

    it('contains all 7 types', () => {
      const bag = newBag();
      const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      expect(bag.sort()).toEqual(types.sort());
    });

    it('produces different orderings (randomness check)', () => {
      // Run several bags and verify they're not all identical
      const results = Array.from({ length: 10 }, () => newBag().join(''));
      const unique = new Set(results);
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('spawnPiece', () => {
    it('spawns I piece at col 3, row -1', () => {
      const piece = spawnPiece('I');
      expect(piece.type).toBe('I');
      expect(piece.row).toBe(-1);
      expect(piece.col).toBe(3);
      expect(piece.rotation).toBe(0);
    });

    it('spawns O piece at col 4, row -1', () => {
      const piece = spawnPiece('O');
      expect(piece.type).toBe('O');
      expect(piece.row).toBe(-1);
      expect(piece.col).toBe(4);
    });

    it('spawns T piece at col 3, row -1', () => {
      const piece = spawnPiece('T');
      expect(piece.type).toBe('T');
      expect(piece.row).toBe(-1);
      expect(piece.col).toBe(3);
    });
  });

  describe('getCells', () => {
    it('returns correct absolute positions for T piece rotation 0', () => {
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 5, col: 3 };
      const cells = getCells(piece);
      expect(cells).toEqual([[5, 4], [6, 3], [6, 4], [6, 5]]);
    });

    it('returns correct positions for I piece rotation 1 (vertical)', () => {
      const piece: ActivePiece = { type: 'I', rotation: 1, row: 0, col: 3 };
      const cells = getCells(piece);
      expect(cells).toEqual([[0, 5], [1, 5], [2, 5], [3, 5]]);
    });
  });

  describe('tryRotate', () => {
    function fillRow(board: Board, row: number): void {
      for (let c = 0; c < BOARD_COLS; c++) {
        board[row][c] = 'I';
      }
    }

    it('rotates T piece CW on open board', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 5, col: 3 };
      const rotated = tryRotate(board, isValidPosition, piece, 1);
      expect(rotated).not.toBeNull();
      expect(rotated!.rotation).toBe(1 as Rotation);
    });

    it('rotates T piece CCW on open board', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 5, col: 3 };
      const rotated = tryRotate(board, isValidPosition, piece, -1);
      expect(rotated).not.toBeNull();
      expect(rotated!.rotation).toBe(3 as Rotation);
    });

    it('wall kicks T piece when blocked', () => {
      const board = emptyBoard();
      // Block the left side to force a wall kick
      fillRow(board, 5);
      fillRow(board, 6);
      // Put T piece near right edge so rotation 1 kicks it left
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 5, col: 7 };
      const rotated = tryRotate(board, isValidPosition, piece, 1);
      // Should succeed with wall kick (different col than original)
      expect(rotated).not.toBeNull();
      expect(rotated!.rotation).toBe(1 as Rotation);
    });

    it('returns null when rotation is entirely blocked', () => {
      const board = emptyBoard();
      // Fill every cell around where the T piece would rotate
      fillRow(board, 5);
      fillRow(board, 6);
      fillRow(board, 7);
      const piece: ActivePiece = { type: 'T', rotation: 0, row: 5, col: 3 };
      const rotated = tryRotate(board, isValidPosition, piece, 1);
      expect(rotated).toBeNull();
    });

    it('I piece wall kicks from rotation 0 to 1', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'I', rotation: 0, row: 0, col: 3 };
      const rotated = tryRotate(board, isValidPosition, piece, 1);
      expect(rotated).not.toBeNull();
      expect(rotated!.rotation).toBe(1 as Rotation);
    });

    it('returns null for I piece that cannot kick', () => {
      const board = emptyBoard();
      fillRow(board, 0);
      fillRow(board, 1);
      fillRow(board, 2);
      fillRow(board, 3);
      const piece: ActivePiece = { type: 'I', rotation: 0, row: 0, col: 3 };
      const rotated = tryRotate(board, isValidPosition, piece, 1);
      expect(rotated).toBeNull();
    });

    it('O piece always rotates without moving', () => {
      const board = emptyBoard();
      const piece: ActivePiece = { type: 'O', rotation: 0, row: 5, col: 4 };
      const rotated = tryRotate(board, isValidPosition, piece, 1);
      expect(rotated).not.toBeNull();
      expect(rotated!.row).toBe(5);
      expect(rotated!.col).toBe(4);
    });
  });
});

// ─── Scoring Tests ──────────────────────────────────────────────

describe('scoring', () => {
  function makeState(score = 0, level = 1, lines = 0): ScoreState {
    return { score, level, lines };
  }

  describe('calcScore', () => {
    it('clearing 0 lines gives 0 points', () => {
      const state = makeState();
      const result = calcScore(state, 0);
      expect(result.score).toBe(0);
      expect(result.lines).toBe(0);
      expect(result.level).toBe(1);
    });

    it('single line clear at level 1 gives 100 points', () => {
      const state = makeState();
      const result = calcScore(state, 1);
      expect(result.score).toBe(100);
      expect(result.lines).toBe(1);
    });

    it('double line clear at level 1 gives 300 points', () => {
      const state = makeState();
      const result = calcScore(state, 2);
      expect(result.score).toBe(300);
      expect(result.lines).toBe(2);
    });

    it('triple line clear at level 1 gives 500 points', () => {
      const state = makeState();
      const result = calcScore(state, 3);
      expect(result.score).toBe(500);
      expect(result.lines).toBe(3);
    });

    it('tetris at level 1 gives 800 points', () => {
      const state = makeState();
      const result = calcScore(state, 4);
      expect(result.score).toBe(800);
      expect(result.lines).toBe(4);
    });

    it('points scale with level (score * level)', () => {
      const state = makeState(0, 3, 20);
      const result = calcScore(state, 2);
      expect(result.score).toBe(300 * 3); // 900
    });

    it('level increases after every 10 lines', () => {
      const state = makeState(0, 1, 9);
      const result = calcScore(state, 1);
      expect(result.level).toBe(2);
      expect(result.lines).toBe(10);
    });

    it('level increases correctly at line boundaries', () => {
      const state = makeState(0, 1, 0);
      const result = calcScore(state, 10);
      expect(result.level).toBe(2);
      expect(result.lines).toBe(10);
    });

    it('multiple level-ups from clearing many lines at once', () => {
      const state = makeState(0, 1, 5);
      const result = calcScore(state, 15);
      expect(result.level).toBe(3);
      expect(result.lines).toBe(20);
    });

    it('handles beyond 4 lines (edge case)', () => {
      const state = makeState();
      const result = calcScore(state, 5);
      expect(result.score).toBe(0); // LINE_SCORES index 5 is undefined → 0
      expect(result.lines).toBe(5);
    });

    it('accumulates score across multiple clears', () => {
      let state = makeState(0, 1, 0);
      state = calcScore(state, 1); // +100, lines=1, level=1
      expect(state).toEqual({ score: 100, level: 1, lines: 1 });
      state = calcScore(state, 2); // +300*1, lines=3, level=1
      expect(state).toEqual({ score: 400, level: 1, lines: 3 });
      state = calcScore(state, 4); // +800*1, lines=7, level=1
      expect(state).toEqual({ score: 1200, level: 1, lines: 7 });
    });
  });

  describe('getGravity', () => {
    it('level 1 returns 1000ms', () => {
      expect(getGravity(1)).toBe(1000);
    });

    it('level 2 returns 910ms', () => {
      expect(getGravity(2)).toBe(910);
    });

    it('level 10 returns 190ms', () => {
      expect(getGravity(10)).toBe(190);
    });

    it('never goes below 100ms', () => {
      for (let level = 1; level <= 20; level++) {
        expect(getGravity(level)).toBeGreaterThanOrEqual(100);
      }
    });

    it('level 11 returns 100ms (minimum)', () => {
      expect(getGravity(11)).toBe(100);
    });
  });
});

// ─── Constants Tests ────────────────────────────────────────────

describe('constants', () => {
  it('BOARD_ROWS is 20', () => {
    expect(BOARD_ROWS).toBe(20);
  });

  it('BOARD_COLS is 10', () => {
    expect(BOARD_COLS).toBe(10);
  });

  it('HIDDEN_ROWS is 2', () => {
    expect(HIDDEN_ROWS).toBe(2);
  });

  it('COLORS has entries for all 7 piece types', () => {
    const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    for (const t of types) {
      expect(COLORS[t]).toBeDefined();
      expect(typeof COLORS[t]).toBe('string');
    }
  });
});
