# Tetris MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a browser-based standard Tetris game with modern minimal UI, deployable to Cloudflare Pages.

**Architecture:** SvelteKit (static adapter) + HTML5 Canvas. Game logic is pure TypeScript (no framework dependency), rendered via a single Canvas element. Svelte stores bridge game state to UI components.

**Tech Stack:** SvelteKit, TypeScript, HTML5 Canvas, @sveltejs/adapter-static, Vite

---

## Phase 1: Project Setup

### Task 1: Initialize SvelteKit project

**Objective:** Bootstrap SvelteKit with TypeScript and static adapter.

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`

**Steps:**

```bash
npm create svelte@latest . -- --template skeleton --types typescript --no-prettier --no-eslint --no-playwright --no-vitest
npm install
npm install -D @sveltejs/adapter-static
```

Update `svelte.config.js`:
```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '404.html'
    })
  }
};
```

Add `src/routes/+layout.ts`:
```ts
export const prerender = true;
```

**Verify:**
```bash
npm run build
# Expected: .svelte-kit/output/ generated with no errors
```

**Commit:**
```bash
git add -A && git commit -m "chore: init SvelteKit with static adapter"
```

---

### Task 2: Set up project structure

**Objective:** Create all empty placeholder files to establish folder structure.

**Files to create:**
```
src/
├── lib/
│   ├── game/
│   │   ├── constants.ts
│   │   ├── tetromino.ts
│   │   ├── board.ts
│   │   ├── scoring.ts
│   │   └── gameLoop.ts
│   ├── renderer/
│   │   └── canvas.ts
│   └── stores/
│       └── gameStore.ts
├── components/
│   ├── GameCanvas.svelte
│   ├── NextPiece.svelte
│   ├── HoldPiece.svelte
│   ├── ScoreBoard.svelte
│   └── GameOverlay.svelte
└── routes/
    └── +page.svelte
```

**Commit:**
```bash
git add -A && git commit -m "chore: scaffold project structure"
```

---

## Phase 2: Core Game Logic (Pure TypeScript)

### Task 3: Define constants

**Objective:** Centralize all game constants.

**File:** `src/lib/game/constants.ts`

```ts
export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;
export const CELL_SIZE = 32; // px

export const COLORS: Record<string, string> = {
  I: '#00BCD4',
  O: '#FFC107',
  T: '#9C27B0',
  S: '#4CAF50',
  Z: '#F44336',
  J: '#2196F3',
  L: '#FF9800',
  ghost: 'rgba(255,255,255,0.15)',
  empty: '#0d0d0d',
  grid: '#1a1a1a',
};

// Gravity: ms per row drop per level (level 1–15)
export const GRAVITY_MS = [
  800, 717, 633, 550, 467, 383, 300, 217, 133, 100,
  83, 83, 83, 67, 50
];
```

**Commit:**
```bash
git add -A && git commit -m "feat: add game constants"
```

---

### Task 4: Define Tetrominoes

**Objective:** Define all 7 tetromino shapes and their rotation states using SRS (Super Rotation System).

**File:** `src/lib/game/tetromino.ts`

```ts
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

// Each piece: array of 4 rotation states, each state is array of [row, col] offsets
export const TETROMINOES: Record<TetrominoType, number[][][]> = {
  I: [
    [[0,0],[0,1],[0,2],[0,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,1],[1,1],[2,1],[3,1]],
  ],
  O: [
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0],[1,1]],
  ],
  T: [
    [[0,1],[1,0],[1,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,1]],
    [[1,0],[1,1],[1,2],[2,1]],
    [[0,1],[1,0],[1,1],[2,1]],
  ],
  S: [
    [[0,1],[0,2],[1,0],[1,1]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,1],[1,2],[2,0],[2,1]],
    [[0,0],[1,0],[1,1],[2,1]],
  ],
  Z: [
    [[0,0],[0,1],[1,1],[1,2]],
    [[0,2],[1,1],[1,2],[2,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[0,1],[1,0],[1,1],[2,0]],
  ],
  J: [
    [[0,0],[1,0],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,0],[2,1]],
  ],
  L: [
    [[0,2],[1,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[1,2],[2,0]],
    [[0,0],[0,1],[1,1],[2,1]],
  ],
};

// SRS wall kick data for J/L/S/T/Z
export const WALL_KICKS_JLSTZ: Record<string, [number, number][]> = {
  '0->1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '1->0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1->2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '2->1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2->3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '3->2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3->0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '0->3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};

// SRS wall kick data for I
export const WALL_KICKS_I: Record<string, [number, number][]> = {
  '0->1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '1->0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1->2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  '2->1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2->3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '3->2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3->0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '0->3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};

export interface ActivePiece {
  type: TetrominoType;
  rotation: number; // 0–3
  row: number;
  col: number;
}

export const PIECE_TYPES: TetrominoType[] = ['I','O','T','S','Z','J','L'];

/** Get absolute cell positions of a piece */
export function getCells(piece: ActivePiece): [number, number][] {
  return TETROMINOES[piece.type][piece.rotation].map(
    ([r, c]) => [piece.row + r, piece.col + c]
  );
}

/** Generate a new random bag of 7 (7-bag randomizer) */
export function newBag(): TetrominoType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/** Spawn position for a new piece */
export function spawnPiece(type: TetrominoType): ActivePiece {
  return { type, rotation: 0, row: 0, col: type === 'O' ? 4 : 3 };
}
```

**Commit:**
```bash
git add -A && git commit -m "feat: define tetrominoes with SRS rotation"
```

---

### Task 5: Implement board logic

**Objective:** Board state management — collision detection, locking pieces, clearing lines.

**File:** `src/lib/game/board.ts`

```ts
import { BOARD_COLS, BOARD_ROWS } from './constants';
import type { TetrominoType } from './tetromino';
import { getCells } from './tetromino';
import type { ActivePiece } from './tetromino';

export type Cell = TetrominoType | null;
export type Board = Cell[][];

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
}

export function isValidPosition(board: Board, piece: ActivePiece): boolean {
  for (const [r, c] of getCells(piece)) {
    if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return false;
    if (r >= 0 && board[r][c] !== null) return false;
  }
  return true;
}

/** Lock active piece into board, return new board */
export function lockPiece(board: Board, piece: ActivePiece): Board {
  const next = board.map(row => [...row]);
  for (const [r, c] of getCells(piece)) {
    if (r >= 0) next[r][c] = piece.type;
  }
  return next;
}

/** Clear full lines, return [new board, lines cleared] */
export function clearLines(board: Board): [Board, number] {
  const remaining = board.filter(row => row.some(cell => cell === null));
  const cleared = BOARD_ROWS - remaining.length;
  const empty = Array.from({ length: cleared }, () => Array(BOARD_COLS).fill(null));
  return [[...empty, ...remaining], cleared];
}

/** Calculate ghost piece position (lowest valid row) */
export function getGhostPiece(board: Board, piece: ActivePiece): ActivePiece {
  let ghost = { ...piece };
  while (isValidPosition(board, { ...ghost, row: ghost.row + 1 })) {
    ghost = { ...ghost, row: ghost.row + 1 };
  }
  return ghost;
}
```

**Commit:**
```bash
git add -A && git commit -m "feat: implement board logic with collision and line clear"
```

---

### Task 6: Implement scoring

**Objective:** Score calculation by lines cleared, level progression, gravity speed.

**File:** `src/lib/game/scoring.ts`

```ts
import { GRAVITY_MS } from './constants';

export interface ScoreState {
  score: number;
  level: number;
  lines: number;
}

const LINE_POINTS = [0, 100, 300, 500, 800]; // 0–4 lines

export function calcScore(state: ScoreState, linesCleared: number): ScoreState {
  const points = LINE_POINTS[linesCleared] * state.level;
  const lines = state.lines + linesCleared;
  const level = Math.floor(lines / 10) + 1;
  return { score: state.score + points, level, lines };
}

export function getGravity(level: number): number {
  const idx = Math.min(level - 1, GRAVITY_MS.length - 1);
  return GRAVITY_MS[idx];
}
```

**Commit:**
```bash
git add -A && git commit -m "feat: implement scoring and level system"
```

---

### Task 7: Implement SRS rotation with wall kicks

**Objective:** Add tryRotate helper that applies SRS wall kicks.

**File:** `src/lib/game/tetromino.ts` (add to existing file)

```ts
import { WALL_KICKS_JLSTZ, WALL_KICKS_I } from './tetromino';
import { isValidPosition } from './board';
import type { Board } from './board';

export function tryRotate(
  board: Board,
  piece: ActivePiece,
  dir: 1 | -1  // 1 = CW, -1 = CCW
): ActivePiece | null {
  const nextRot = ((piece.rotation + dir + 4) % 4) as 0|1|2|3;
  const key = `${piece.rotation}->${nextRot}`;
  const kicks = piece.type === 'I' ? WALL_KICKS_I[key] : WALL_KICKS_JLSTZ[key];
  const rotated = { ...piece, rotation: nextRot };

  for (const [dr, dc] of (kicks ?? [[0,0]])) {
    const candidate = { ...rotated, row: rotated.row + dr, col: rotated.col + dc };
    if (isValidPosition(board, candidate)) return candidate;
  }
  return null;
}
```

**Commit:**
```bash
git add -A && git commit -m "feat: add SRS wall kick rotation"
```

---

### Task 8: Implement game state store

**Objective:** Central Svelte store managing full game state and actions.

**File:** `src/lib/stores/gameStore.ts`

```ts
import { writable, get } from 'svelte/store';
import { emptyBoard, isValidPosition, lockPiece, clearLines, getGhostPiece } from '../game/board';
import { spawnPiece, newBag, tryRotate, getCells } from '../game/tetromino';
import { calcScore, getGravity } from '../game/scoring';
import type { Board, Cell } from '../game/board';
import type { ActivePiece, TetrominoType } from '../game/tetromino';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export interface GameState {
  board: Board;
  active: ActivePiece | null;
  ghost: ActivePiece | null;
  held: TetrominoType | null;
  canHold: boolean;
  bag: TetrominoType[];
  next: TetrominoType[];  // next 3 pieces
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
    if (state.bag.length < 4) state.bag = [...state.bag, ...newBag()];
    const type = state.next.shift()!;
    state.next.push(state.bag.shift()!);
    const active = spawnPiece(type);
    if (!isValidPosition(state.board, active)) {
      return { ...state, status: 'gameover', active: null, ghost: null };
    }
    const ghost = getGhostPiece(state.board, active);
    return { ...state, active, ghost, canHold: true };
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
      set(spawnNext(state));
      update(s => ({ ...s, status: 'playing' }));
    },
    pause() {
      update(s => ({ ...s, status: s.status === 'playing' ? 'paused' : 'playing' }));
    },
    moveLeft() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const moved = { ...s.active, col: s.active.col - 1 };
        if (!isValidPosition(s.board, moved)) return s;
        const ghost = getGhostPiece(s.board, moved);
        return { ...s, active: moved, ghost };
      });
    },
    moveRight() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const moved = { ...s.active, col: s.active.col + 1 };
        if (!isValidPosition(s.board, moved)) return s;
        const ghost = getGhostPiece(s.board, moved);
        return { ...s, active: moved, ghost };
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
        const rotated = tryRotate(s.board, s.active, 1);
        if (!rotated) return s;
        return { ...s, active: rotated, ghost: getGhostPiece(s.board, rotated) };
      });
    },
    rotateCCW() {
      update(s => {
        if (!s.active || s.status !== 'playing') return s;
        const rotated = tryRotate(s.board, s.active, -1);
        if (!rotated) return s;
        return { ...s, active: rotated, ghost: getGhostPiece(s.board, rotated) };
      });
    },
    hold() {
      update(s => {
        if (!s.active || !s.canHold || s.status !== 'playing') return s;
        if (s.held === null) {
          const state = spawnNext({ ...s, held: s.active.type, active: null, canHold: false });
          return state;
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
  };
}

export const game = createGameStore();
```

**Commit:**
```bash
git add -A && git commit -m "feat: implement game store with all actions"
```

---

## Phase 3: Canvas Renderer

### Task 9: Implement Canvas renderer

**Objective:** Pure draw functions for board, active piece, ghost, and mini previews.

**File:** `src/lib/renderer/canvas.ts`

```ts
import { CELL_SIZE, COLORS, BOARD_COLS, BOARD_ROWS } from '../game/constants';
import { getCells } from '../game/tetromino';
import type { Board } from '../game/board';
import type { ActivePiece, TetrominoType } from '../game/tetromino';

function drawCell(
  ctx: CanvasRenderingContext2D,
  row: number, col: number,
  color: string,
  alpha = 1
) {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  // Subtle highlight
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, 4);
  ctx.globalAlpha = 1;
}

export function drawBoard(ctx: CanvasRenderingContext2D, board: Board) {
  // Background
  ctx.fillStyle = COLORS.empty;
  ctx.fillRect(0, 0, BOARD_COLS * CELL_SIZE, BOARD_ROWS * CELL_SIZE);

  // Grid lines
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  // Locked cells
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      if (cell) drawCell(ctx, r, c, COLORS[cell]);
    }
  }
}

export function drawPiece(ctx: CanvasRenderingContext2D, piece: ActivePiece, alpha = 1) {
  for (const [r, c] of getCells(piece)) {
    if (r >= 0) drawCell(ctx, r, c, COLORS[piece.type], alpha);
  }
}

export function drawGhost(ctx: CanvasRenderingContext2D, ghost: ActivePiece) {
  for (const [r, c] of getCells(ghost)) {
    if (r >= 0) {
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      ctx.strokeStyle = COLORS[ghost.type];
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      ctx.globalAlpha = 1;
    }
  }
}

/** Draw a mini piece preview (for Next/Hold panels) */
export function drawMiniPiece(
  ctx: CanvasRenderingContext2D,
  type: TetrominoType,
  offsetX: number,
  offsetY: number,
  size = 20
) {
  const cells = getCells({ type, rotation: 0, row: 0, col: 0 });
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  ctx.fillStyle = COLORS[type];
  for (const [r, c] of cells) {
    ctx.fillRect(
      offsetX + (c - minC) * size + 1,
      offsetY + (r - minR) * size + 1,
      size - 2,
      size - 2
    );
  }
}
```

**Commit:**
```bash
git add -A && git commit -m "feat: implement canvas renderer"
```

---

## Phase 4: Svelte Components

### Task 10: GameCanvas component + game loop

**Objective:** Mount canvas, run requestAnimationFrame loop, handle keyboard input.

**File:** `src/components/GameCanvas.svelte`

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { game } from '$lib/stores/gameStore';
  import { drawBoard, drawPiece, drawGhost } from '$lib/renderer/canvas';
  import { getGravity } from '$lib/game/scoring';
  import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from '$lib/game/constants';

  let canvas: HTMLCanvasElement;
  let animId: number;
  let lastGravity = 0;

  const W = BOARD_COLS * CELL_SIZE;
  const H = BOARD_ROWS * CELL_SIZE;

  function loop(ts: number) {
    const state = $game;
    const ctx = canvas.getContext('2d')!;

    // Gravity
    if (state.status === 'playing') {
      const interval = getGravity(state.level);
      if (ts - lastGravity >= interval) {
        game.gravity();
        lastGravity = ts;
      }
    }

    // Draw
    drawBoard(ctx, state.board);
    if (state.ghost) drawGhost(ctx, state.ghost);
    if (state.active) drawPiece(ctx, state.active);

    animId = requestAnimationFrame(loop);
  }

  function handleKey(e: KeyboardEvent) {
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyX','KeyZ','KeyC','KeyP','Escape'].includes(e.code)) {
      e.preventDefault();
    }
    const s = $game.status;
    if (s === 'idle' || s === 'gameover') {
      if (e.code === 'Space' || e.code === 'Enter') game.start();
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') { game.pause(); return; }
    if (s !== 'playing') return;

    switch (e.code) {
      case 'ArrowLeft':  game.moveLeft(); break;
      case 'ArrowRight': game.moveRight(); break;
      case 'ArrowDown':  game.softDrop(); break;
      case 'Space':      game.hardDrop(); break;
      case 'ArrowUp':
      case 'KeyX':       game.rotateCW(); break;
      case 'KeyZ':       game.rotateCCW(); break;
      case 'KeyC':       game.hold(); break;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKey);
    animId = requestAnimationFrame(loop);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKey);
    cancelAnimationFrame(animId);
  });
</script>

<canvas bind:this={canvas} width={W} height={H} />

<style>
  canvas {
    display: block;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
  }
</style>
```

**Commit:**
```bash
git add -A && git commit -m "feat: GameCanvas with game loop and keyboard input"
```

---

### Task 11: ScoreBoard component

**File:** `src/components/ScoreBoard.svelte`

```svelte
<script lang="ts">
  import { game } from '$lib/stores/gameStore';
</script>

<div class="scoreboard">
  <div class="item">
    <span class="label">SCORE</span>
    <span class="value">{$game.score.toLocaleString()}</span>
  </div>
  <div class="item">
    <span class="label">LEVEL</span>
    <span class="value">{$game.level}</span>
  </div>
  <div class="item">
    <span class="label">LINES</span>
    <span class="value">{$game.lines}</span>
  </div>
</div>

<style>
  .scoreboard { display: flex; flex-direction: column; gap: 1.5rem; }
  .item { display: flex; flex-direction: column; gap: 0.25rem; }
  .label {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: #666;
    font-weight: 600;
  }
  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f0f0f0;
    font-variant-numeric: tabular-nums;
  }
</style>
```

---

### Task 12: NextPiece + HoldPiece components

**File:** `src/components/NextPiece.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '$lib/stores/gameStore';
  import { drawMiniPiece } from '$lib/renderer/canvas';

  let canvas: HTMLCanvasElement;
  const SIZE = 20;

  $: if (canvas && $game.next.length) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    $game.next.forEach((type, i) => drawMiniPiece(ctx, type, 4, 4 + i * (SIZE * 2 + 8), SIZE));
  }
</script>

<div class="panel">
  <p class="label">NEXT</p>
  <canvas bind:this={canvas} width={100} height={180} />
</div>

<style>
  .panel { display: flex; flex-direction: column; gap: 0.5rem; }
  .label { font-size: 0.65rem; letter-spacing: 0.15em; color: #666; font-weight: 600; margin: 0; }
  canvas { border-radius: 4px; }
</style>
```

**File:** `src/components/HoldPiece.svelte`

```svelte
<script lang="ts">
  import { game } from '$lib/stores/gameStore';
  import { drawMiniPiece } from '$lib/renderer/canvas';

  let canvas: HTMLCanvasElement;
  const SIZE = 20;

  $: if (canvas) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if ($game.held) {
      ctx.globalAlpha = $game.canHold ? 1 : 0.4;
      drawMiniPiece(ctx, $game.held, 4, 4, SIZE);
      ctx.globalAlpha = 1;
    }
  }
</script>

<div class="panel">
  <p class="label">HOLD</p>
  <canvas bind:this={canvas} width={100} height={60} />
</div>

<style>
  .panel { display: flex; flex-direction: column; gap: 0.5rem; }
  .label { font-size: 0.65rem; letter-spacing: 0.15em; color: #666; font-weight: 600; margin: 0; }
  canvas { border-radius: 4px; }
</style>
```

**Commit:**
```bash
git add -A && git commit -m "feat: NextPiece and HoldPiece preview components"
```

---

### Task 13: GameOverlay component

**File:** `src/components/GameOverlay.svelte`

```svelte
<script lang="ts">
  import { game } from '$lib/stores/gameStore';
  import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from '$lib/game/constants';

  const W = BOARD_COLS * CELL_SIZE;
  const H = BOARD_ROWS * CELL_SIZE;
</script>

{#if $game.status !== 'playing'}
<div class="overlay" style="width:{W}px;height:{H}px">
  {#if $game.status === 'idle'}
    <h2>TETRIS</h2>
    <p>Press <kbd>Space</kbd> to start</p>
  {:else if $game.status === 'paused'}
    <h2>PAUSED</h2>
    <p>Press <kbd>P</kbd> to resume</p>
  {:else if $game.status === 'gameover'}
    <h2>GAME OVER</h2>
    <p class="final-score">{$game.score.toLocaleString()}</p>
    <p>Press <kbd>Space</kbd> to restart</p>
  {/if}
</div>
{/if}

<style>
  .overlay {
    position: absolute;
    top: 0; left: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    border-radius: 4px;
    color: #f0f0f0;
  }
  h2 {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    margin: 0;
  }
  p { margin: 0; color: #aaa; font-size: 0.9rem; }
  .final-score { font-size: 2.5rem; font-weight: 700; color: #fff; }
  kbd {
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 3px;
    padding: 0 6px;
    font-size: 0.85rem;
  }
</style>
```

**Commit:**
```bash
git add -A && git commit -m "feat: GameOverlay for start/pause/gameover states"
```

---

## Phase 5: Main Page & Global Styles

### Task 14: Compose main page

**File:** `src/routes/+page.svelte`

```svelte
<script lang="ts">
  import GameCanvas from '$components/GameCanvas.svelte';
  import ScoreBoard from '$components/ScoreBoard.svelte';
  import NextPiece from '$components/NextPiece.svelte';
  import HoldPiece from '$components/HoldPiece.svelte';
  import GameOverlay from '$components/GameOverlay.svelte';
</script>

<svelte:head>
  <title>Tetris</title>
</svelte:head>

<main>
  <div class="left-panel">
    <HoldPiece />
  </div>

  <div class="board-wrapper">
    <GameCanvas />
    <GameOverlay />
  </div>

  <div class="right-panel">
    <ScoreBoard />
    <NextPiece />
  </div>
</main>

<style>
  main {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 1.5rem;
    padding: 2rem;
    min-height: 100vh;
    padding-top: 10vh;
  }
  .board-wrapper {
    position: relative;
  }
  .left-panel, .right-panel {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    min-width: 100px;
  }
</style>
```

**File:** `src/app.css`

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #080808;
  color: #f0f0f0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { display: none; }
```

**File:** `src/routes/+layout.svelte`

```svelte
<script>
  import '../app.css';
</script>
<slot />
```

**Commit:**
```bash
git add -A && git commit -m "feat: compose main page and global styles"
```

---

## Phase 6: Final QA & Deploy

### Task 15: Build and verify

```bash
npm run build
# Expected: no errors, .svelte-kit/output/prerendered generated

npm run preview
# Open http://localhost:4173, test:
# - All 7 pieces spawn
# - Rotation with wall kicks
# - Hard drop, soft drop
# - Hold piece
# - Line clears + scoring
# - Level progression
# - Game over detection
# - Pause/resume
```

### Task 16: Push to GitHub

```bash
git remote add origin git@github.com:miksin/tetris.git
git push -u origin main
```

### Task 17: Deploy to Cloudflare Pages

1. Cloudflare Dashboard → Pages → Create project → Connect GitHub → `miksin/tetris`
2. Build settings:
   - **Framework preset:** SvelteKit
   - **Build command:** `npm run build`
   - **Output directory:** `.svelte-kit/output/client`  
     *(or `build` if using older adapter-static — check after first build)*
3. Save & Deploy

---

## Keyboard Controls Reference

| Key | Action |
|-----|--------|
| `←` `→` | Move left/right |
| `↓` | Soft drop |
| `Space` | Hard drop |
| `↑` or `X` | Rotate CW |
| `Z` | Rotate CCW |
| `C` | Hold |
| `P` / `Esc` | Pause |
| `Space` / `Enter` | Start / Restart |
