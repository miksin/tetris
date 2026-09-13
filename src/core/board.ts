import { Cell, Piece } from './types';
import { BOARD_W, BOARD_H } from './constants';
import { cells } from './piece';

export class Board {
  readonly grid: Cell[][];

  constructor() {
    this.grid = Array.from({ length: BOARD_H }, () => Array<Cell>(BOARD_W).fill(null));
  }

  private at(x: number, y: number): Cell | undefined {
    return this.grid[y]?.[x];
  }

  collide(p: Piece): boolean {
    return cells(p.type, p.rot).some((o) => {
      const x = p.pos.x + o.x;
      const y = p.pos.y + o.y;
      if (x < 0 || x >= BOARD_W || y >= BOARD_H) return true;
      if (y < 0) return false;
      return this.at(x, y) !== null;
    });
  }

  lock(p: Piece): void {
    for (const o of cells(p.type, p.rot)) {
      const x = p.pos.x + o.x;
      const y = p.pos.y + o.y;
      if (y >= 0 && y < BOARD_H) this.grid[y][x] = p.type;
    }
  }

  clearLines(): number {
    let cleared = 0;
    for (let y = BOARD_H - 1; y >= 0; y--) {
      if (this.grid[y].every((c) => c !== null)) {
        this.grid.splice(y, 1);
        this.grid.unshift(Array<Cell>(BOARD_W).fill(null));
        cleared++;
        y++;
      }
    }
    return cleared;
  }

  isGameOver(p: Piece): boolean {
    return this.collide(p);
  }
}
