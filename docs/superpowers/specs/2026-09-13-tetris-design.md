# Tetris — Design Spec

Date: 2026-09-13

## Overview

Modern-standard Tetris for the web browser, using Phaser 3 for rendering and input, with all game rules in a dependency-free TypeScript core. Visual style: modern minimal, black & white monochrome. Testing: full (Vitest unit tests for core, smoke tests for rendering, manual playtest).

Stack: TypeScript + Vite, Phaser 3, Vitest.

## Architecture

Strict separation: `src/core/` contains all game rules as pure TypeScript modules with **zero Phaser dependency**. `src/render/` contains Phaser scene, drawing, and input mapping. Core exposes a `Game` class and read-only state snapshots; the render layer reads snapshots only.

```
Input (keyboard) → InputController → Input data → Game.tick(dt, input) → snapshot → Phaser scene draws
```

## Core (`src/core/`, no deps)

- **types.ts** — `PieceType` (I,O,T,S,Z,J,L), `Cell = PieceType | null`, `Input` flags, `GameState` (`ready|playing|paused|gameover`), snapshot types.
- **constants.ts** — SRS kick tables (JLSTZ set, I set, O no kick), gravity curve, scoring table.
- **board.ts** — 10×22 grid (top 2 rows hidden spawn zone). `collide`, `lock`, `clearLines`, `isGameOver`.
- **piece.ts** — piece shapes in 4 rotation states; wall-kick rotation attempts; ghost projection (drop to contact); T-spin detection (3-corner rule).
- **bag.ts** — 7-bag shuffle, `next()`, reshuffles per bag.
- **game.ts** — state machine (`ready / playing / paused / gameover`), driven solely by `Game.tick(dt, input)`.
  - Current piece, ghost, hold (once per piece), next queue (5 visible).
  - Level = lines / 10; gravity interval decreases per level (level 1 ≈ 1000ms, decreasing to a floor).
  - Lock delay 500ms; move/rotate resets the timer, max 15 resets per piece.
  - Scoring: soft drop 1/cell, hard drop 2/cell, line clears 100/300/500/800 × level, back-to-back ×1.5, simplified T-spin bonus.

Public surface: `Game`, plus read-only snapshot (`board`, `piece`, `ghost`, `next`, `hold`, `score`, `level`, `lines`, `state`).

## Render (`src/render/`)

- **main.ts** — Phaser game config, boots scene.
- **board-scene.ts** — single scene; each frame calls `game.update(dt, inputState)` then redraws from snapshot. Blocks drawn via Phaser Graphics with cached textures (one texture per shade, generated once). No sprite sheet.
- **input-controller.ts** — keyboard → input data; game rules handled in core only.

### Layout & style

- Monochrome: near-black page background (#111), grid lines dark gray, cells white with 2px black border; ghost piece is a hollow 2px white outline; locked pieces use a gray shade tier. Monospace font (system monospace, no font files).
- Centered playfield 10×20 visible, 32px cells → 320×640. Left: HOLD box + score/level/lines. Right: NEXT queue (5).
- Game over / pause: translucent black overlay + white text; any key restarts.

### Controls

| Key | Action |
|---|---|
| ← / → | Move (DAS 170ms, ARR 40ms) |
| ↓ | Soft drop (40ms/cell) |
| ↑ / X | Rotate CW |
| Z / Ctrl | Rotate CCW |
| Space | Hard drop |
| C / Shift | Hold |
| P / Esc | Pause |

## Project structure

```
tetris/
├── index.html
├── vitest.config.ts
├── package.json / tsconfig.json
└── src/
    ├── core/           (types, constants, board, piece, bag, game)
    ├── core/__tests__/
    ├── render/         (main, board-scene, input-controller)
    └── render/__tests__/
```

## Testing (Vitest, full)

- **Core unit tests** (node env):
  - `board`: boundary/floor/stack collision, line clears incl. overflow, game over detection.
  - `piece`: all 7 pieces × 4 rotation states correct, wall kicks (incl. I table), T-spin 3-corner rule, ghost.
  - `bag`: exactly one full cycle per 7 draws, uniform distribution, reshuffle per bag.
  - `game`: state machine transitions, hold-once limit, lock delay (reset cap 15), DAS/ARR timing under tick, scoring (soft/hard drop, clears × level, B2B/T-spin).
- **Render tests** (jsdom + Phaser headless):
  - Scene smoke test: construct scene, feed fixed snapshot, assert key object counts (active piece, ghost, next slots) and cell→px coordinate conversion.
  - `InputController`: synthetic keyboard events → correct input data; DAS/ARR via fake timers.

Manual acceptance: `npm run dev`, play a full round to verify feel and visuals.
