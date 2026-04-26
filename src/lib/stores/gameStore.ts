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

  function spawnNext(state: GameState): GameState {
    if (state.bag.length < 4) state = { ...state, bag: [...state.bag, ...newBag()] };
    const next = [...state.next];
    const bag = [...state.bag];
    const type = next.shift()!;
    next.push(bag.shift()!);
    const active = spawnPiece(type);
    if (!isValidPosition(state.board, active)) {
      return { ...state, next, bag, status: 'gameover', active: null, ghost: null };
    }
    const ghost = getGhostPiece(state.board, active);
    return { ...state, next, bag, active, ghost, canHold: true };
  }

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
      update(s => ({ ...s, status: s.status === 'playing' ? 'paused' : 'playing' }));
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
        const dropped = { ...s.active, row: s.ghost!.row };
        const dist = dropped.row - s.active.row;
        return lockAndClear({ ...s, active: dropped, score: s.score + dist * 2 });
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
          return spawnNext({ ...s, held: s.active.type, active: null, canHold: false });
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
