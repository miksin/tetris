import { describe, it, expect } from 'vitest';
import { emptyBoard, isValidPosition, lockPiece, clearLines, getGhostPiece } from '$lib/game/board';
import { spawnPiece, getCells, newBag, tryRotate, TETROMINOES } from '$lib/game/tetromino';
import { calcScore, getGravity } from '$lib/game/scoring';

describe('board', () => {
  it('emptyBoard creates 20x10 board of nulls', () => {
    const b = emptyBoard();
    expect(b.length).toBe(20);
    expect(b[0].length).toBe(10);
    expect(b.every(row => row.every(c => c === null))).toBe(true);
  });

  it('isValidPosition: valid spawn', () => {
    const b = emptyBoard();
    const p = spawnPiece('T');
    expect(isValidPosition(b, p)).toBe(true);
  });

  it('isValidPosition: out of bounds left', () => {
    const b = emptyBoard();
    const p = { ...spawnPiece('T'), col: -3 };
    expect(isValidPosition(b, p)).toBe(false);
  });

  it('isValidPosition: collision with locked cell', () => {
    const b = emptyBoard();
    // T at row=-1, col=3 -> cells at row 0 (offsets [1,0],[1,1],[1,2]) and row -1 (offset [0,1])
    b[0][3] = 'I'; // row=(-1+1)=0, col=(3+0)=3
    const p = spawnPiece('T');
    expect(isValidPosition(b, p)).toBe(false);
  });

  it('lockPiece places cells on board', () => {
    const b = emptyBoard();
    const p: import('$lib/game/tetromino').ActivePiece = { type: 'O', rotation: 0, row: 18, col: 4 };
    const locked = lockPiece(b, p);
    expect(locked[18][4]).toBe('O');
    expect(locked[18][5]).toBe('O');
    expect(locked[19][4]).toBe('O');
    expect(locked[19][5]).toBe('O');
  });

  it('clearLines removes full rows and adds empty at top', () => {
    const b = emptyBoard();
    // Fill bottom row
    for (let c = 0; c < 10; c++) b[19][c] = 'I';
    const [newBoard, cleared] = clearLines(b);
    expect(cleared).toBe(1);
    expect(newBoard.length).toBe(20);
    expect(newBoard[19].every(c => c === null)).toBe(true);
  });

  it('clearLines: no full rows', () => {
    const b = emptyBoard();
    b[19][0] = 'T';
    const [, cleared] = clearLines(b);
    expect(cleared).toBe(0);
  });

  it('getGhostPiece drops to bottom', () => {
    const b = emptyBoard();
    const p = spawnPiece('I');
    const ghost = getGhostPiece(b, p);
    // Ghost should be at row 19 - 0 = 19 (I piece row 0 offset)
    expect(ghost.row).toBeGreaterThan(p.row);
    // After ghost, one more row down is invalid
    expect(isValidPosition(b, { ...ghost, row: ghost.row + 1 })).toBe(false);
  });
});

describe('tetromino', () => {
  it('getCells returns 4 cells', () => {
    const types = ['I','O','T','S','Z','J','L'] as const;
    for (const type of types) {
      const p = spawnPiece(type);
      expect(getCells(p).length).toBe(4);
    }
  });

  it('newBag returns 7 unique pieces', () => {
    const bag = newBag();
    expect(bag.length).toBe(7);
    expect(new Set(bag).size).toBe(7);
  });

  it('tryRotate CW: basic rotation succeeds', () => {
    const b = emptyBoard();
    const p = spawnPiece('T');
    // Move down so piece is fully on board
    const p2 = { ...p, row: 5 };
    const rotated = tryRotate(b, isValidPosition, p2, 1);
    expect(rotated).not.toBeNull();
    expect(rotated?.rotation).toBe(1);
  });

  it('tryRotate: rotation blocked by wall uses kick', () => {
    const b = emptyBoard();
    const p: import('$lib/game/tetromino').ActivePiece = { type: 'T', rotation: 0, row: 5, col: 0 };
    const rotated = tryRotate(b, isValidPosition, p, -1); // CCW from col 0, should kick
    expect(rotated).not.toBeNull();
  });
});

describe('scoring', () => {
  it('calcScore: 0 lines cleared gives 0 points', () => {
    const r = calcScore({ score: 0, level: 1, lines: 0 }, 0);
    expect(r.score).toBe(0);
  });

  it('calcScore: single line at level 1 = 100', () => {
    const r = calcScore({ score: 0, level: 1, lines: 0 }, 1);
    expect(r.score).toBe(100);
  });

  it('calcScore: tetris at level 2 = 1600', () => {
    const r = calcScore({ score: 0, level: 2, lines: 10 }, 4);
    expect(r.score).toBe(1600);
  });

  it('calcScore: level increases every 10 lines', () => {
    const r = calcScore({ score: 0, level: 1, lines: 9 }, 1);
    expect(r.level).toBe(2);
  });

  it('getGravity: level 1 is 1000ms', () => {
    expect(getGravity(1)).toBe(1000);
  });

  it('getGravity: decreases with level, min 100', () => {
    expect(getGravity(10)).toBeLessThan(getGravity(1));
    expect(getGravity(100)).toBe(100);
  });
});
