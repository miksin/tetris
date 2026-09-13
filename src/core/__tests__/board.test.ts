import { describe, it, expect } from 'vitest';
import { Board } from '../board';
import { Piece } from '../types';
import { BOARD_W, BOARD_H } from '../constants';

const P = (type: Piece['type'], x: number, y: number, rot = 0): Piece => ({ type, pos: { x, y }, rot: rot as 0 });

describe('Board', () => {
  it('empty board: piece inside fits, below floor collides', () => {
    const b = new Board();
    expect(b.collide(P('T', 3, 0))).toBe(false);
    expect(b.collide(P('T', 3, 19))).toBe(false);
    expect(b.collide(P('T', 3, 20))).toBe(false);
    expect(b.collide(P('T', 3, 21))).toBe(true); // T bottom row would be y 22
    expect(b.collide(P('T', -1, 0))).toBe(true);
    expect(b.collide(P('T', 8, 0))).toBe(true);
  });

  it('collides against locked cells', () => {
    const b = new Board();
    b.lock(P('O', 4, 10));
    expect(b.collide(P('O', 4, 8))).toBe(false);
    expect(b.collide(P('I', 3, 9))).toBe(true); // I body row lands on locked O row 10
  });

  it('lock writes cells then clearLines removes full rows', () => {
    const b = new Board();
    for (let x = 0; x < BOARD_W; x += 2) b.lock(P('O', x, 21));
    for (let x = 0; x < BOARD_W; x += 2) b.lock(P('O', x, 20));
    b.lock(P('I', 3, 18)); // I body row fills cells at y 19
    expect(b.clearLines()).toBe(2);
    expect(b.grid[20].every((c) => c === null)).toBe(true);
    expect(b.grid[21].some((c) => c === 'I')).toBe(true); // I row pushed down to 21
  });

  it('clearLines shifts everything above down', () => {
    const b = new Board();
    b.lock(P('T', 3, 5));
    for (let x = 0; x < BOARD_W; x += 2) b.lock(P('O', x, 21));
    for (let x = 0; x < BOARD_W; x += 2) b.lock(P('O', x, 20));
    expect(b.clearLines()).toBe(2);
    // T moved down by 2 rows: T cells were at y5-6, now y7-8
    const tCells: number[] = [];
    b.grid.forEach((row, y) => row.forEach((c, x) => { if (c === 'T') tCells.push(y); }));
    expect(Math.max(...tCells)).toBe(8);
  });

  it('isGameOver = spawn collision', () => {
    const b = new Board();
    expect(b.isGameOver(P('O', 4, 10))).toBe(false);
    b.lock(P('O', 4, 0));
    expect(b.isGameOver(P('O', 4, 0))).toBe(true);
  });

  it('board dimensions', () => {
    const b = new Board();
    expect(b.grid).toHaveLength(BOARD_H);
    expect(b.grid[0]).toHaveLength(BOARD_W);
  });
});
