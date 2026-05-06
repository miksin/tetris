import { writable } from 'svelte/store';
import { emptyBoard, isValidPosition, lockPiece, clearLines, getGhostPiece } from '../game/board';
import { newBag, spawnPiece, tryRotate } from '../game/tetromino';
import { calcScore, getGravity } from '../game/scoring';
import type { Board } from '../game/board';
import type { ActivePiece, TetrominoType } from '../game/tetromino';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export interface GameState {
  board: Board;
  active: ActivePiece | null;
  ghost: ActivePiece | null;
  held: TetrominoType | null;
  canHold: boolean;
  bag: TetrominoType[];
  next: TetrominoType[];
  score: number;
  level: number;
  lines: number;
  status: GameStatus;
}

function initialState(): GameState {
  const bag = newBag();
  const next = bag.splice(0, 3);
  return {
    board: emptyBoard(),
    active: null,
    ghost: null,
    held: null,
    canHold: true,
    bag,
    next,
    score: 0,
    level: 1,
    lines: 0,
    status: 'idle',
  };
}

function createGameStore() {
  const { subscribe, set, update } = writable<GameState>(initialState());

  /** Auto-refill bag, spawn from next queue, detect gameover. */
  function spawnNext(state: GameState): GameState {
    let bag = state.bag;
    if (bag.length < 4) {
      bag = [...bag, ...newBag()];
    }
    const next = [...state.next];
    const consumeBag = [...bag];
    const type = next.shift()!;
    next.push(consumeBag.shift()!);
    const active = spawnPiece(type);
    if (!isValidPosition(state.board, active)) {
      return { ...state, next, bag: consumeBag, status: 'gameover', active: null, ghost: null };
    }
    const ghost = getGhostPiece(state.board, active);
    return { ...state, next, bag: consumeBag, active, ghost, canHold: true };
  }

  /** Lock piece, clear lines, calc score, then spawn next. */
  function lockAndClear(state: GameState): GameState {
    if (!state.active) return state;
    const locked = lockPiece(state.board, state.active);
    const [board, linesCleared] = clearLines(locked);
    const { score, level, lines } = calcScore(
      { score: state.score, level: state.level, lines: state.lines },
      linesCleared
    );
    return spawnNext({ ...state, board, score, level, lines, active: null, ghost: null });
  }

  return {
    subscribe,

    start() {
      const state = initialState();
      const started = spawnNext(state);
      set({ ...started, status: 'playing' });
    },

    pause() {
      update(s => {
        if (s.status === 'playing') return { ...s, status: 'paused' };
        if (s.status === 'paused') return { ...s, status: 'playing' };
        return s;
      });
    },

    moveLeft() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const moved = { ...s.active, col: s.active.col - 1 };
        if (!isValidPosition(s.board, moved)) return s;
        return { ...s, active: moved, ghost: getGhostPiece(s.board, moved) };
      });
    },

    moveRight() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const moved = { ...s.active, col: s.active.col + 1 };
        if (!isValidPosition(s.board, moved)) return s;
        return { ...s, active: moved, ghost: getGhostPiece(s.board, moved) };
      });
    },

    softDrop() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const moved = { ...s.active, row: s.active.row + 1 };
        if (!isValidPosition(s.board, moved)) return lockAndClear(s);
        return { ...s, active: moved, score: s.score + 1 };
      });
    },

    hardDrop() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const ghost = s.ghost!;
        const dist = ghost.row - s.active.row;
        return lockAndClear({ ...s, active: ghost, score: s.score + dist * 2 });
      });
    },

    rotateCW() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const rotated = tryRotate(s.board, isValidPosition, s.active, 1);
        if (!rotated) return s;
        return { ...s, active: rotated, ghost: getGhostPiece(s.board, rotated) };
      });
    },

    rotateCCW() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const rotated = tryRotate(s.board, isValidPosition, s.active, -1);
        if (!rotated) return s;
        return { ...s, active: rotated, ghost: getGhostPiece(s.board, rotated) };
      });
    },

    hold() {
      update(s => {
        if (!s.active || !s.canHold || s.status !== 'playing') return s;
        if (s.held === null) {
          // Spread spawnNext result first, then override canHold — spawnNext always sets it true
          // but for hold() the new piece cannot be held again until it locks.
          const spawned = spawnNext({ ...s, held: s.active.type, active: null, canHold: false });
          return { ...spawned, canHold: false };
        }
        const swapType = s.held;
        const active = spawnPiece(swapType);
        const ghost = getGhostPiece(s.board, active);
        return { ...s, held: s.active.type, active, ghost, canHold: false };
      });
    },

    gravity() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const moved = { ...s.active, row: s.active.row + 1 };
        if (!isValidPosition(s.board, moved)) return lockAndClear(s);
        return { ...s, active: moved };
      });
    },

    reset() {
      set(initialState());
    },
  };
}

export const game = createGameStore();
export { getGravity };
