import { Board } from './board';
import { Bag } from './bag';
import { ghostY, tryKick } from './piece';
import { PieceType, Piece, GameState, Snapshot, Held } from './types';
import {
  SPAWN, BOARD_W, LOCK_DELAY_MS, LOCK_RESET_CAP, DAS_MS, ARR_MS,
  SOFT_DROP_MS, NEXT_VISIBLE, gravityMs, LINE_SCORE, TSPIN_SCORE, B2B_MULT,
} from './constants';

export class Game {
  private board = new Board();
  private bag = new Bag();
  private state: GameState = 'ready';
  private piece: Piece | null = null;
  private queue: PieceType[] = [];
  private hold: PieceType | null = null;
  private canHold = true;
  private score = 0;
  private lines = 0;
  private lastClearWasB2b = false;
  private lastActionWasRotate = false;
  private gravTimer = 0;
  private softTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private dasDir = 0;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor() { this.queue = Array.from({ length: NEXT_VISIBLE }, () => this.bag.next()); }

  start(): void {
    this.bag.reset(); this.board = new Board();
    this.queue = Array.from({ length: NEXT_VISIBLE }, () => this.bag.next());
    this.hold = null; this.canHold = true; this.score = 0; this.lines = 0;
    this.lastClearWasB2b = false; this.gravTimer = 0; this.softTimer = 0;
    this.spawn(); this.state = 'playing';
  }

  pauseToggle(): void {
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'playing';
  }

  snapshot(): Snapshot {
    return {
      state: this.state,
      board: this.board.grid.map((r) => [...r]).slice(2),
      piece: this.piece ? { ...this.piece, pos: { ...this.piece.pos } } : null,
      ghostPos: this.piece ? { ...this.piece.pos, y: ghostY(this.piece, (p) => this.board.collide(p)) } : null,
      queue: [...this.queue],
      hold: this.hold, score: this.score,
      level: Math.floor(this.lines / 10) + 1,
      lines: this.lines, canHold: this.canHold,
    };
  }

  private spawn(): void {
    const type = this.queue.shift()!;
    this.queue.push(this.bag.next());
    this.piece = { type, pos: { ...SPAWN[type] }, rot: 0 };
    this.lastActionWasRotate = false;
    this.gravTimer = 0; this.lockTimer = 0; this.lockResets = 0;
    if (this.board.collide(this.piece)) { this.state = 'gameover'; }
  }

  private tryMove(dx: number): boolean {
    if (!this.piece) return false;
    const cand: Piece = { ...this.piece, pos: { x: this.piece.pos.x + dx, y: this.piece.pos.y } };
    if (!this.board.collide(cand)) {
      this.piece = cand; this.lastActionWasRotate = false;
      this.onPieceMoved(); return true;
    }
    return false;
  }

  private tryRotate(dir: 1 | -1): boolean {
    if (!this.piece) return false;
    const cand = tryKick(this.piece, dir, (p) => this.board.collide(p));
    if (cand) { this.piece = cand; this.lastActionWasRotate = true; this.onPieceMoved(); return true; }
    return false;
  }

  private onPieceMoved(): void {
    const resting = this.piece ? this.board.collide({ ...this.piece, pos: { x: this.piece.pos.x, y: this.piece.pos.y + 1 } }) : false;
    if (resting && this.lockResets < LOCK_RESET_CAP) {
      this.lockTimer = 0; this.lockResets++;
    }
  }

  private hardDrop(): void {
    if (!this.piece) return;
    const gy = ghostY(this.piece, (p) => this.board.collide(p));
    this.score += Math.max(0, gy - this.piece.pos.y) * 2;
    this.piece = { ...this.piece, pos: { x: this.piece.pos.x, y: gy } };
    this.lockPiece();
  }

  private holdSwap(): void {
    if (!this.piece || !this.canHold) return;
    const current = this.piece.type;
    if (this.hold === null) { this.hold = current; this.spawn(); }
    else { const swap = this.hold; this.hold = current; this.piece = { type: swap, pos: { ...SPAWN[swap] }, rot: 0 }; this.lastActionWasRotate = false; }
    this.canHold = false;
    this.gravTimer = 0; this.lockTimer = 0; this.lockResets = 0;
  }

  private lockPiece(): void {
    if (!this.piece) return;
    const tspin = this.piece.type === 'T' && this.lastActionWasRotate && this.tSpinCorners() >= 3;
    this.board.lock(this.piece);
    const cleared = this.board.clearLines();
    if (cleared > 0) {
      let base: number;
      if (tspin) base = TSPIN_SCORE[cleared];
      else base = LINE_SCORE[cleared];
      const b2b = this.lastClearWasB2b && (tspin || cleared === 4);
      this.score += Math.floor(base * Math.floor(this.lines / 10 + 1) * (b2b ? B2B_MULT : 1));
      this.lastClearWasB2b = tspin || cleared === 4;
    }
    this.lines += cleared;
    this.canHold = true;
    this.spawn();
  }

  private tSpinCorners(): number {
    if (!this.piece) return 0;
    // T center is (pos.x+1, pos.y+1); corners are its 4 diagonal neighbors
    const cx = this.piece.pos.x + 1, cy = this.piece.pos.y + 1;
    let n = 0;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || x >= BOARD_W || y >= 22 || y < 0 || this.board.grid[y]?.[x] !== null) n++;
    }
    return n;
  }

  private isResting(): boolean {
    return this.piece != null && this.board.collide({ ...this.piece, pos: { x: this.piece.pos.x, y: this.piece.pos.y + 1 } });
  }

  tick(dt: number, held: Held): void {
    if (this.state !== 'playing' || !this.piece) return;

    // DAS/ARR horizontal
    const dir = held.left && !held.right ? -1 : held.right && !held.left ? 1 : 0;
    if (dir !== 0) {
      if (dir !== this.dasDir) { this.dasDir = dir; this.dasTimer = 0; this.arrTimer = 0; this.tryMove(dir); }
      else {
        this.dasTimer += dt;
        if (this.dasTimer >= DAS_MS) {
          this.arrTimer += dt;
          while (this.arrTimer >= ARR_MS) { this.arrTimer -= ARR_MS; if (!this.tryMove(this.dasDir)) break; }
        }
      }
    } else { this.dasDir = 0; this.dasTimer = 0; this.arrTimer = 0; }

    // instant actions
    if (held.actions.rotCW) this.tryRotate(1);
    if (held.actions.rotCCW) this.tryRotate(-1);
    if (held.actions.hold) { this.holdSwap(); held = { ...held, actions: { ...held.actions, hold: false } }; }
    if (held.actions.hard) { this.hardDrop(); return; }

    if (!this.piece) return;

    // soft drop
    this.softTimer += dt;
    while (this.softTimer >= SOFT_DROP_MS) {
      this.softTimer -= SOFT_DROP_MS;
      if (held.down && !this.board.collide({ ...this.piece, pos: { x: this.piece.pos.x, y: this.piece.pos.y + 1 } })) {
        this.piece = { ...this.piece, pos: { x: this.piece.pos.x, y: this.piece.pos.y + 1 } };
        this.score += 1; this.lastActionWasRotate = false;
      } else break;
    }

    // resting → lock delay
    if (this.isResting()) {
      this.gravTimer = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece();
      return;
    }

    // gravity
    const interval = gravityMs(Math.floor(this.lines / 10) + 1);
    this.gravTimer += dt;
    while (this.gravTimer >= interval) {
      this.gravTimer -= interval;
      if (!this.board.collide({ ...this.piece, pos: { x: this.piece.pos.x, y: this.piece.pos.y + 1 } })) {
        this.piece = { ...this.piece, pos: { x: this.piece.pos.x, y: this.piece.pos.y + 1 } };
        this.lastActionWasRotate = false;
      } else break;
    }
  }
}
