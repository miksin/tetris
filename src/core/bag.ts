import { PieceType } from './types';

const ALL: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export class Bag {
  private queue: PieceType[] = [];

  next(): PieceType {
    if (this.queue.length === 0) this.queue = shuffle([...ALL]);
    return this.queue.pop()!;
  }

  reset(): void { this.queue = []; }
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
