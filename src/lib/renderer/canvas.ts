import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from '../game/constants';
import type { Board } from '../game/board';
import type { ActivePiece } from '../game/tetromino';
import { getCells } from '../game/tetromino';

export const PALETTE: Record<string, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
  empty: '#111827',
  ghost: '#334155',
  grid: '#1f2937',
};

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, width, height);
}

export function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= BOARD_ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL_SIZE);
    ctx.lineTo(BOARD_COLS * CELL_SIZE, r * CELL_SIZE);
    ctx.stroke();
  }
  for (let c = 0; c <= BOARD_COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL_SIZE, 0);
    ctx.lineTo(c * CELL_SIZE, BOARD_ROWS * CELL_SIZE);
    ctx.stroke();
  }
}

export function drawBoard(ctx: CanvasRenderingContext2D, board: Board): void {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      if (cell) {
        drawCell(ctx, r, c, PALETTE[cell] ?? '#ffffff');
      }
    }
  }
}

function drawCell(ctx: CanvasRenderingContext2D, row: number, col: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 2, 3);
}

export function drawPiece(ctx: CanvasRenderingContext2D, piece: ActivePiece): void {
  ctx.globalAlpha = 1;
  for (const [r, c] of getCells(piece)) {
    if (r >= 0) {
      drawCell(ctx, r, c, PALETTE[piece.type] ?? '#ffffff');
    }
  }
}

export function drawGhost(ctx: CanvasRenderingContext2D, ghost: ActivePiece): void {
  ctx.globalAlpha = 1;
  for (const [r, c] of getCells(ghost)) {
    if (r >= 0) {
      ctx.strokeStyle = PALETTE[ghost.type] ?? '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(c * CELL_SIZE + 2, r * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    }
  }
}

const MINI_CELL = 16;

const MINI_SHAPES: Record<string, [number, number][]> = {
  I: [[1,0],[1,1],[1,2],[1,3]],
  O: [[1,1],[1,2],[2,1],[2,2]],
  T: [[1,1],[2,0],[2,1],[2,2]],
  S: [[1,1],[1,2],[2,0],[2,1]],
  Z: [[1,0],[1,1],[2,1],[2,2]],
  J: [[1,0],[2,0],[2,1],[2,2]],
  L: [[1,2],[2,0],[2,1],[2,2]],
};

export function drawMiniPiece(
  ctx: CanvasRenderingContext2D,
  type: string,
  canvasWidth: number,
  canvasHeight: number
): void {
  const cells = MINI_SHAPES[type] ?? [];
  const color = PALETTE[type] ?? '#888';
  const offsetX = Math.floor((canvasWidth - 4 * MINI_CELL) / 2);
  const offsetY = Math.floor((canvasHeight - 4 * MINI_CELL) / 2);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  for (const [r, c] of cells) {
    ctx.fillStyle = color;
    ctx.fillRect(offsetX + c * MINI_CELL + 1, offsetY + r * MINI_CELL + 1, MINI_CELL - 2, MINI_CELL - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(offsetX + c * MINI_CELL + 1, offsetY + r * MINI_CELL + 1, MINI_CELL - 2, 3);
  }
}
