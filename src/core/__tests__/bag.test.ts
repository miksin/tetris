import { describe, it, expect } from 'vitest';
import { Bag } from '../bag';
import { PieceType } from '../types';

const ALL: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

describe('Bag', () => {
  it('yields exactly one of each piece per 7 draws', () => {
    const bag = new Bag();
    const drawn: PieceType[] = Array.from({ length: 7 }, () => bag.next());
    expect([...drawn].sort()).toEqual([...ALL].sort());
  });
  it('reshuffles after each bag, 14 draws = 2 full sets', () => {
    const bag = new Bag();
    const drawn: PieceType[] = Array.from({ length: 14 }, () => bag.next());
    expect([...drawn].sort()).toEqual([...ALL, ...ALL].sort());
  });
  it('reset clears state', () => {
    const bag = new Bag();
    bag.next(); bag.next();
    bag.reset();
    const drawn: PieceType[] = Array.from({ length: 7 }, () => bag.next());
    expect([...drawn].sort()).toEqual([...ALL].sort());
  });
});
