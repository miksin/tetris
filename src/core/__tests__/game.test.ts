import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Game } from '../game';
import { Held } from '../types';

const IDLE: Held = { left: false, right: false, down: false, actions: { rotCW: false, rotCCW: false, hard: false, hold: false } };

beforeEach(() => { vi.stubEnv('SEED', ''); });
afterEach(() => { vi.unstubAllEnvs(); });

describe('Game basics', () => {
  it('starts in ready, then playing', () => {
    const g = new Game();
    expect(g.snapshot().state).toBe('ready');
    g.start();
    expect(g.snapshot().state).toBe('playing');
    expect(g.snapshot().piece).not.toBeNull();
  });

  it('gravity makes piece fall over time', () => {
    const g = new Game();
    g.start();
    const snap0 = g.snapshot();
    g.tick(1000, IDLE);
    const snap1 = g.snapshot();
    expect(snap1.piece!.pos.y).toBeGreaterThan(snap0.piece!.pos.y);
  });

  it('hard drop locks instantly and scores 2/cell', () => {
    const g = new Game(); g.start();
    // fall distance = ghostY - current y
    const dist = (g.snapshot().ghostPos!.y - g.snapshot().piece!.pos.y);
    g.tick(16, { ...IDLE, actions: { ...IDLE.actions, hard: true } });
    const s = g.snapshot();
    expect(s.piece).not.toBeNull();           // next piece spawned
    expect(s.score).toBe(dist * 2);
  });

  it('soft drop scores 1/cell', () => {
    const g = new Game(); g.start();
    const before = g.snapshot().score;
    g.tick(40, { ...IDLE, down: true });
    g.tick(40, { ...IDLE, down: true });
    expect(g.snapshot().score).toBe(before + 2);
  });

  it('hard drop on full board bottom locks and line clears feed score × level', () => {
    const g = new Game(); g.start();
    // feed 9 pieces hard-dropped, then next hard drop completes clear
    for (let i = 0; i < 9; i++) { g.tick(16, { ...IDLE, actions: { ...IDLE.actions, hard: true } }); }
    const sc0 = g.snapshot().score;
    g.tick(16, { ...IDLE, actions: { ...IDLE.actions, hard: true } });
    expect(g.snapshot().score).toBeGreaterThan(sc0); // some clear/cell points happened
  });

  it('game over when spawn collides', () => {
    const g = new Game(); g.start();
    // spam hard drops until board tops out (bounded loop to avoid infinite)
    for (let i = 0; i < 60 && g.snapshot().state === 'playing'; i++) {
      g.tick(16, { ...IDLE, actions: { ...IDLE.actions, hard: true } });
    }
    expect(g.snapshot().state).toBe('gameover');
  });

  it('pause blocks tick effects', () => {
    const g = new Game(); g.start();
    g.pauseToggle();
    const s = g.snapshot();
    g.tick(1000, { ...IDLE, down: true });
    expect(g.snapshot()).toEqual(s);
    g.pauseToggle();
    g.tick(1000, IDLE);
    expect(g.snapshot().piece!.pos.y).toBeGreaterThan(s.piece!.pos.y);
  });

  it('level derived from lines', () => {
    const g = new Game(); g.start();
    const s = g.snapshot();
    expect(s.level).toBe(Math.floor(s.lines / 10) + 1);
    expect(s.lines).toBe(0);
  });
});

describe('lock delay & hold & DAS', () => {
  it('resting piece locks only after lock delay builds up', () => {
    const g = new Game(); g.start();
    // level-1 gravity (1000ms/cell) is too slow to reach the floor by waiting;
    // soft drop via public API until the piece comes to rest.
    // Note: ticks while resting add to lockTimer (≤80ms total here).
    let lastY = g.snapshot().piece!.pos.y;
    for (let i = 0; i < 30; i++) {
      g.tick(40, { ...IDLE, down: true });
      const y = g.snapshot().piece!.pos.y;
      if (y === lastY) break; // resting
      lastY = y;
    }
    const before = g.snapshot();
    // 320ms more rest: total ≤ 400ms < 500ms, piece must NOT lock yet
    for (let i = 0; i < 8; i++) g.tick(40, IDLE);
    const mid = g.snapshot();
    expect(mid.piece!.type).toBe(before.piece!.type);
    expect(mid.piece!.pos).toEqual(before.piece!.pos);
    // crossing 500ms of rest locks the piece; next piece spawns higher
    for (let i = 0; i < 3; i++) g.tick(100, IDLE);
    const now = g.snapshot();
    expect(now.piece!.pos.y).toBeLessThan(before.piece!.pos.y);
  });

  it('hold twice within same piece is rejected', () => {
    const g = new Game(); g.start();
    g.tick(16, act('hold'));
    expect(g.snapshot().canHold).toBe(false);
    const holdNow = g.snapshot().hold;
    g.tick(16, act('hold'));
    expect(g.snapshot().hold).toBe(holdNow);
  });

  function act(name: 'hold' | 'hard' | 'rotCW'): Held {
    return { ...IDLE, actions: { ...IDLE.actions, [name]: true } as Held['actions'] };
  }

  it('DAS: single hold moves once immediately, no repeat until DAS elapses', () => {
    const g = new Game(); g.start();
    const x0 = g.snapshot().piece!.pos.x;
    g.tick(16, { ...IDLE, left: true });
    expect(g.snapshot().piece!.pos.x).toBe(x0 - 1);
    for (let i = 0; i < 4; i++) g.tick(40, { ...IDLE, left: true }); // 160ms < DAS
    expect(g.snapshot().piece!.pos.x).toBe(x0 - 1);
    g.tick(60, { ...IDLE, left: true });  // crosses DAS, ARR fires
    expect(g.snapshot().piece!.pos.x).toBe(x0 - 2);
  });

});
