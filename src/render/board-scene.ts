import Phaser from 'phaser';
import { Snapshot, Held } from '../core/types';
import { cells } from '../core/piece';
import { InputController } from './input-controller';

export const CELL = 32;
export const BOARD_X = 200;
export const BOARD_Y = 40;

export interface DrawItem {
  x: number; y: number; w: number; h: number;
  color: number;
  solid: boolean;          // true = fillRect, false = strokeRect (ghost outline)
  text?: string;           // when set, this is a text label
}

export function cellToPx(ox: number, oy: number, cx: number, cy: number) {
  return { x: ox + cx * CELL, y: oy + cy * CELL };
}

const COLS = 10, ROWS = 20;

export function layout(snap: Snapshot): DrawItem[] {
  const items: DrawItem[] = [];

  // grid
  for (let x = 0; x <= COLS; x++) {
    items.push({ x: BOARD_X + x * CELL, y: BOARD_Y, w: 1, h: ROWS * CELL, color: 0x333333, solid: true });
  }
  for (let y = 0; y <= ROWS; y++) {
    items.push({ x: BOARD_X, y: BOARD_Y + y * CELL, w: COLS * CELL, h: 1, color: 0x333333, solid: true });
  }

  // locked cells (snapshot board already excludes hidden rows)
  snap.board.forEach((row, vy) => row.forEach((c, x) => {
    if (c) items.push({ ...cellToPx(BOARD_X, BOARD_Y, x, vy), w: CELL, h: CELL, color: 0x888888, solid: true });
  }));

  if (snap.state === 'playing' && snap.piece) {
    // ghost outline
    for (const o of cells(snap.piece.type, snap.piece.rot)) {
      const { x, y } = cellToPx(BOARD_X, BOARD_Y, snap.ghostPos!.x + o.x, snap.ghostPos!.y + o.y - 2);
      if (y >= BOARD_Y) items.push({ x: x + 2, y: y + 2, w: CELL - 4, h: CELL - 4, color: 0xffffff, solid: false });
    }
    // active piece
    for (const o of cells(snap.piece.type, snap.piece.rot)) {
      const py = snap.piece.pos.y + o.y - 2;          // shift up by hidden rows
      if (py >= 0) {
        const { x, y } = cellToPx(BOARD_X, BOARD_Y, snap.piece.pos.x + o.x, py);
        items.push({ x: x + 1, y: y + 1, w: CELL - 2, h: CELL - 2, color: 0xffffff, solid: true });
      }
    }
  }

  // HUD text
  items.push({ x: 40, y: BOARD_Y, w: 0, h: 0, color: 0xffffff, solid: true, text: 'HOLD' });
  if (snap.hold) items.push({ x: 40, y: BOARD_Y + 40, w: 0, h: 0, color: 0x888888, solid: true, text: snap.hold });
  items.push({ x: 40, y: 300, w: 0, h: 0, color: 0xffffff, solid: true, text: 'SCORE' });
  items.push({ x: 40, y: 330, w: 0, h: 0, color: 0xffffff, solid: true, text: String(snap.score) });
  items.push({ x: 40, y: 380, w: 0, h: 0, color: 0xffffff, solid: true, text: `LV ${snap.level}` });
  items.push({ x: 40, y: 420, w: 0, h: 0, color: 0xffffff, solid: true, text: `${snap.lines} lines` });
  items.push({ x: 560, y: BOARD_Y, w: 0, h: 0, color: 0xffffff, solid: true, text: 'NEXT' });
  snap.queue.forEach((t, i) => {
    items.push({ x: 560, y: BOARD_Y + 40 + i * 72, w: 0, h: 0, color: 0x888888, solid: true, text: t });
  });

  // overlays
  if (snap.state === 'paused') items.push({ x: BOARD_X, y: BOARD_Y + 280, w: COLS * CELL, h: 80, color: 0xffffff, solid: true, text: 'PAUSED' });
  if (snap.state === 'gameover') items.push({ x: BOARD_X, y: BOARD_Y + 280, w: COLS * CELL, h: 80, color: 0xffffff, solid: true, text: 'GAME OVER — press any key' });

  return items;
}

export class BoardScene extends Phaser.Scene {
  private core: { tick: (dt: number, held: Held) => void; snapshot: () => Snapshot; pauseToggle: () => void; start: () => void };
  private controller: InputController;
  private gfx: Phaser.GameObjects.Graphics | null = null;
  private texts = new Map<string, Phaser.GameObjects.Text>();

  constructor(core: BoardScene['core'], controller: BoardScene['controller']) {
    super({ key: 'board' });
    this.core = core;
    this.controller = controller;
  }

  create(): void {
    this.gfx = this.add.graphics();
  }

  update(_time: number, delta: number): void {
    const held = this.controller.held();
    const actions = this.controller.drainActions();
    if (actions.pause) {
      if (this.core.snapshot().state === 'gameover') this.core.start();
      else this.core.pauseToggle();
    }
    const merged = { ...held, actions: { rotCW: actions.rotCW, rotCCW: actions.rotCCW, hard: actions.hard, hold: actions.hold } };
    this.core.tick(delta, merged);
    this.draw(this.core.snapshot());
  }

  private draw(snap: Snapshot): void {
    this.gfx!.clear();
    for (const r of layout(snap)) {
      if (r.text !== undefined) {
        const key = `${r.x},${r.y}`;
        if (!this.texts.has(key)) this.texts.set(key, this.add.text(r.x, r.y, '', { color: '#fff', fontFamily: 'monospace', fontSize: '16px' }));
        this.texts.get(key)!.setText(r.text).setColor(r.color === 0xffffff ? '#ffffff' : '#888888');
      } else if (r.solid) {
        this.gfx!.fillStyle(r.color, 1).fillRect(r.x, r.y, r.w, r.h);
      } else {
        this.gfx!.lineStyle(2, r.color, 1).strokeRect(r.x, r.y, r.w, r.h);
      }
    }
  }
}
