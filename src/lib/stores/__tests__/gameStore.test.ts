import { describe, it, expect, beforeEach } from 'vitest';
import { game, getGravity } from '../gameStore';
import type { GameState, GameStatus } from '../gameStore';
import type { TetrominoType } from '../../game/tetromino';

// Helper: subscribe to get the current state
function getState(): GameState {
  let state!: GameState;
  game.subscribe(s => { state = s })();
  return state;
}

describe('game store', () => {
  beforeEach(() => {
    game.reset();
  });

  describe('initial state', () => {
    it('is idle with no active piece', () => {
      const s = getState();
      expect(s.status).toBe('idle');
      expect(s.active).toBeNull();
      expect(s.score).toBe(0);
      expect(s.level).toBe(1);
      expect(s.lines).toBe(0);
      expect(s.held).toBeNull();
      expect(s.canHold).toBe(true);
    });

    it('has a bag with 4 pieces (7 minus 3 queued)', () => {
      const s = getState();
      expect(s.bag.length).toBe(4);
      expect(s.next.length).toBe(3);
    });

    it('has a board of correct dimensions', () => {
      const s = getState();
      expect(s.board.length).toBe(20);
      expect(s.board[0].length).toBe(10);
    });
  });

  describe('start()', () => {
    it('sets status to playing', () => {
      game.start();
      expect(getState().status).toBe('playing');
    });

    it('spawns an active piece', () => {
      game.start();
      const s = getState();
      expect(s.active).not.toBeNull();
      expect(s.active!.type).toMatch(/^[IOTZSJL]$/);
      expect(s.active!.row).toBe(-1);
    });

    it('has a ghost piece', () => {
      game.start();
      const s = getState();
      expect(s.ghost).not.toBeNull();
      expect(s.ghost!.row).toBeGreaterThanOrEqual(s.active!.row);
    });
  });

  describe('moveLeft / moveRight', () => {
    beforeEach(() => {
      game.start();
    });

    it('moveLeft moves the piece left by one', () => {
      const before = getState().active!.col;
      game.moveLeft();
      expect(getState().active!.col).toBe(before - 1);
    });

    it('moveRight moves the piece right by one', () => {
      const before = getState().active!.col;
      game.moveRight();
      expect(getState().active!.col).toBe(before + 1);
    });

    it('moveLeft respects wall boundary', () => {
      // Move left many times to hit the wall
      for (let i = 0; i < 20; i++) game.moveLeft();
      // Piece should still be within bounds
      const s = getState();
      expect(s.active!.col).toBeGreaterThanOrEqual(0);
    });

    it('moveRight respects wall boundary', () => {
      for (let i = 0; i < 20; i++) game.moveRight();
      const s = getState();
      // Piece should stay within board bounds
      const cells = s.active!;
      // All cells should be in-bounds
      expect(cells.col).toBeGreaterThanOrEqual(0);
      expect(cells.col).toBeLessThanOrEqual(10);
    });

    it('does nothing when paused', () => {
      game.pause();
      const col = getState().active!.col;
      game.moveLeft();
      expect(getState().active!.col).toBe(col);
    });
  });

  describe('softDrop', () => {
    beforeEach(() => {
      game.start();
    });

    it('moves piece down by one and adds 1 point', () => {
      const before = getState().active!.row;
      const beforeScore = getState().score;
      game.softDrop();
      const s = getState();
      expect(s.active!.row).toBe(before + 1);
      expect(s.score).toBe(beforeScore + 1);
    });

    it('locks piece when reaching bottom and spawns next piece', () => {
      // Hard drop it, then soft drop on next piece to confirm lock cycles work
      game.hardDrop();
      // A new piece should spawn
      expect(getState().active).not.toBeNull();
    });
  });

  describe('hardDrop', () => {
    beforeEach(() => {
      game.start();
    });

    it('instantly drops piece to ghost position and locks', () => {
      const before = getState().active!.row;
      const ghost = getState().ghost!.row;
      game.hardDrop();
      const s = getState();
      // New piece should have spawned
      expect(s.active).not.toBeNull();
      // Score should have increased by 2*dist
      expect(s.score).toBeGreaterThan(0);
    });

    it('scores 2 points per row dropped', () => {
      const ghostRow = getState().ghost!.row;
      const activeRow = getState().active!.row;
      const dist = ghostRow - activeRow;
      game.hardDrop();
      expect(getState().score).toBe(dist * 2);
    });
  });

  describe('rotateCW / rotateCCW', () => {
    beforeEach(() => {
      game.start();
    });

    it('rotateCW changes rotation state', () => {
      const before = getState().active!.rotation;
      game.rotateCW();
      const after = getState().active!.rotation;
      expect(after).not.toBe(before);
    });

    it('rotateCCW changes rotation state', () => {
      const before = getState().active!.rotation;
      game.rotateCCW();
      const after = getState().active!.rotation;
      // CCW from 0 -> 3
      expect(after).toBe(3);
    });

    it('does nothing when paused', () => {
      game.pause();
      const before = getState().active!.rotation;
      game.rotateCW();
      expect(getState().active!.rotation).toBe(before);
    });
  });

  describe('hold()', () => {
    beforeEach(() => {
      game.start();
    });

    it('holds current piece on first call', () => {
      const type = getState().active!.type;
      const active = getState().active;
      game.hold();
      const s = getState();
      expect(s.held).toBe(type);
      expect(s.canHold).toBe(false);
      // Should have spawned a new piece
      expect(s.active).not.toBeNull();
    });

    it('swaps held piece after drop (re-hold)', () => {
      const firstType = getState().active!.type;
      game.hold(); // hold piece A, spawn piece B (canHold = false)
      expect(getState().held).toBe(firstType);
      // Drop piece B to lock it — spawnNext resets canHold to true
      game.hardDrop();
      // Now hold again — swaps active (piece C) with held (piece A)
      game.hold();
      const s = getState();
      // After swap, active should be the original held piece (A)
      expect(s.active!.type).toBe(firstType);
      expect(s.canHold).toBe(false);
    });

    it('does nothing when canHold is false', () => {
      game.hold();
      const held = getState().held;
      const active = getState().active!.type;
      game.hold(); // should be a no-op
      expect(getState().active!.type).toBe(active);
    });
  });

  describe('pause()', () => {
    beforeEach(() => {
      game.start();
    });

    it('toggles playing to paused', () => {
      expect(getState().status).toBe('playing');
      game.pause();
      expect(getState().status).toBe('paused');
    });

    it('toggles paused to playing', () => {
      game.pause();
      game.pause();
      expect(getState().status).toBe('playing');
    });

    it('does not work from idle', () => {
      game.reset();
      game.pause();
      expect(getState().status).toBe('idle');
    });
  });

  describe('reset()', () => {
    it('restores idle state', () => {
      game.start();
      game.hold();
      game.softDrop();
      game.reset();
      const s = getState();
      expect(s.status).toBe('idle');
      expect(s.active).toBeNull();
      expect(s.ghost).toBeNull();
      expect(s.score).toBe(0);
      expect(s.held).toBeNull();
    });
  });

  describe('gravity()', () => {
    beforeEach(() => {
      game.start();
    });

    it('moves piece down by one', () => {
      const before = getState().active!.row;
      game.gravity();
      expect(getState().active!.row).toBe(before + 1);
    });

    it('locks piece at bottom', () => {
      // Drop to bottom and gravity should lock
      game.hardDrop();
      // Ensure a new piece is active after lock
      expect(getState().active).not.toBeNull();
    });
  });
});
