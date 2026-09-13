// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { cellToPx, CELL, BOARD_Y, layout } from '../board-scene';
import { Game } from '../../core/game';

// Phaser's device detection needs a real canvas; jsdom has none.
// The scene's Phaser runtime behavior isn't under test here — only pure layout logic.
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    AUTO: 0,
  },
}));

describe('cellToPx', () => {
  it('converts cell grid to pixel coords', () => {
    const o = { x: 240, y: 40 };
    expect(cellToPx(o.x, o.y, 0, 0)).toEqual({ x: 240, y: 40 });
    expect(cellToPx(o.x, o.y, 3, 2)).toEqual({ x: 240 + 3 * CELL, y: 40 + 2 * CELL });
    expect(cellToPx(o.x, o.y, 9, 19)).toEqual({ x: 240 + 9 * CELL, y: 40 + 19 * CELL });
  });
  it('CELL is 32', () => expect(CELL).toBe(32));
});

describe('layout', () => {
  it('empty ready state: grid only, no cells', () => {
    const g = new Game();
    const items = layout(g.snapshot());
    // 11 vertical + 21 horizontal grid lines
    expect(items.filter((r) => r.color === 0x333333)).toHaveLength(32);
    expect(items.some((r) => r.color === 0xffffff && r.text === undefined)).toBe(false);
  });

  it('playing state: active piece cells drawn, ghost drawn as outlines', () => {
    const g = new Game(); g.start();
    // spawn sits fully in the 2 hidden rows; soft-drop in small ticks until visible
    const held = { left: false, right: false, down: true, actions: { rotCW: false, rotCCW: false, hard: false, hold: false } };
    for (let i = 0; i < 30; i++) {
      g.tick(40, held);
      if (g.snapshot().piece!.pos.y >= 2) break; // fully on-screen
    }
    const s = g.snapshot();
    const items = layout(s);
    // active piece: 4 white solid rects; ghost: 4 white outlines
    expect(items.filter((r) => r.color === 0xffffff && r.solid && r.text === undefined)).toHaveLength(4);
    expect(items.filter((r) => r.color === 0xffffff && !r.solid)).toHaveLength(4);
  });

  it('board rows map hidden rows away: board row 0 → screen row 0', () => {
    const g = new Game(); g.start();
    const items = layout(g.snapshot());
    const maxY = Math.max(...items.filter((r) => r.text === undefined).map((r) => r.y));
    expect(maxY).toBeLessThanOrEqual(BOARD_Y + 20 * CELL);
  });

  it('ready state: shows PRESS ENTER TO START overlay', () => {
    const g = new Game();
    const texts = layout(g.snapshot()).filter((r) => r.text !== undefined);
    expect(texts.map((t) => t.text)).toContain('PRESS ENTER TO START');
  });

  it('playing state: no ready overlay', () => {
    const g = new Game(); g.start();
    const texts = layout(g.snapshot()).filter((r) => r.text !== undefined);
    expect(texts.map((t) => t.text)).not.toContain('PRESS ENTER TO START');
  });

  it('hud texts present', () => {
    const g = new Game(); g.start();
    const texts = layout(g.snapshot()).filter((r) => r.text !== undefined);
    expect(texts.map((t) => t.text)).toContain('SCORE');
    expect(texts.map((t) => t.text)).toContain('NEXT');
    expect(texts.map((t) => t.text)).toContain('HOLD');
  });
});
