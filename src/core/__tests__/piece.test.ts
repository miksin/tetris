import { describe, it, expect } from 'vitest';
import { cells, tryKick, ghostY, SPAWN } from '../piece';
import { Piece, PieceType } from '../types';

const COUNTS: Record<PieceType, number> = { I: 4, O: 4, T: 4, S: 4, Z: 4, J: 4, L: 4 };
const neverCollides = () => false;

describe('piece cells', () => {
  it.each(Object.keys(COUNTS) as (keyof typeof COUNTS)[])('%s has 4 cells in all 4 rotation states', (t) => {
    for (const rot of [0, 1, 2, 3] as const) {
      expect(cells(t, rot)).toHaveLength(COUNTS[t]);
      expect(cells(t, rot).every((c) => Number.isInteger(c.x) && Number.isInteger(c.y))).toBe(true);
    }
  });
  it('T spawn state looks like pyramid www', () => {
    const set = new Set(cells('T', 0).map((c) => `${c.x},${c.y}`));
    expect(set.has('0,1') && set.has('2,1') && set.has('1,1') && set.has('1,0') && set.size === 4).toBe(true);
  });
  it('I rotated once is a vertical bar', () => {
    const set = new Set(cells('I', 1).map((c) => `${c.x},${c.y}`));
    expect(set.has('2,0') && set.has('2,1') && set.has('2,2') && set.has('2,3') && set.size === 4).toBe(true);
  });
  it('O rotation states are all identical', () => {
    const a = cells('O', 0); const b = cells('O', 1);
    expect(JSON.stringify(a) === JSON.stringify(b)).toBe(true);
  });
});

describe('tryKick (SRS)', () => {
  const mkPiece = (rot: number): Piece => ({ type: 'T', pos: { x: 5, y: 6 }, rot: rot as 0|1|2|3 });
  it('T CW 0->1 with no obstacle keeps pos (first kick (0,0))', () => {
    const p = mkPiece(0);
    const r = tryKick(p, 1, neverCollides);
    expect(r!.pos).toEqual({ x: 5, y: 6 });
    expect(r!.rot).toBe(1);
  });
  it('T CW 0->1 with straight-down obstacle uses second kick (-1,0)', () => {
    const p = mkPiece(0);
    // collideINA only for the (0,0) placement: block directly beneath piece body
    const r = tryKick(p, 1, (q) => {
      if (q.rot === 1) return cells(q.type, q.rot).length >= 0 && q.pos.x === 5 && q.pos.y === 6;
      return false;
    });
    expect(r!.pos).toEqual({ x: 4, y: 6 });
    expect(r!.rot).toBe(1);
  });
  it('returns null when all kicks collide', () => {
    const p = mkPiece(0);
    const always = () => true;
    expect(tryKick(p, -1, always)).toBeNull();
  });
  it('I piece uses its own kick table (0->1 second kick x-2)', () => {
    const p: Piece = { type: 'I', pos: { x: 5, y: 6 }, rot: 0 };
    const r = tryKick(p, 1, (q) => q.pos.x === 5 && q.pos.y === 6);
    expect(r!.pos).toEqual({ x: 3, y: 6 });
    expect(r!.rot).toBe(1);
  });
});

describe('ghost', () => {
  it('drops until contact then reports resting y', () => {
    const p: Piece = { type: 'T', pos: { x: 4, y: 0 }, rot: 0 };
    // floor at y: piece may move until bottom T-cell row (y+2 after offset row 2) => collide when pos.y >= 18
    const collide = (q: Piece) => q.pos.y >= 18;
    expect(ghostY(p, collide)).toBe(17);
  });
  it('already resting returns same y', () => {
    const p: Piece = { type: 'O', pos: { x: 4, y: 5 }, rot: 0 };
    const collide = (q: Piece) => q.pos.y >= 5;
    expect(ghostY(p, collide)).toBe(5);
  });
  it('spawn positions put pieces at top row', () => {
    expect(SPAWN.T).toEqual({ x: 3, y: 0 });
    expect(SPAWN.O).toEqual({ x: 4, y: 0 });
    expect(SPAWN.I).toEqual({ x: 3, y: 1 });
  });
});
