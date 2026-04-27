import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PALETTE,
  clearCanvas,
  drawGrid,
  drawBoard,
  drawPiece,
  drawGhost,
  drawMiniPiece,
} from '../canvas';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from '../../game/constants';

// Mock CanvasRenderingContext2D
function makeCtx() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('PALETTE', () => {
  it('has all 7 tetromino types', () => {
    for (const t of ['I','O','T','S','Z','J','L']) {
      expect(PALETTE[t]).toBeTruthy();
    }
  });
});

describe('clearCanvas', () => {
  it('calls fillRect with full dimensions', () => {
    const ctx = makeCtx();
    clearCanvas(ctx, 320, 640);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 320, 640);
  });
});

describe('drawGrid', () => {
  it('draws correct number of lines', () => {
    const ctx = makeCtx();
    drawGrid(ctx);
    // BOARD_ROWS+1 horizontal + BOARD_COLS+1 vertical beginPath calls
    expect(ctx.beginPath).toHaveBeenCalledTimes(BOARD_ROWS + 1 + BOARD_COLS + 1);
  });
});

describe('drawBoard', () => {
  it('draws filled cells only', () => {
    const ctx = makeCtx();
    const board: (string | null)[][] = Array.from({ length: BOARD_ROWS }, () =>
      Array(BOARD_COLS).fill(null)
    );
    board[19][5] = 'I';
    board[18][3] = 'T';
    drawBoard(ctx, board as any);
    // Each filled cell calls fillRect twice (body + highlight)
    expect(ctx.fillRect).toHaveBeenCalledTimes(4);
  });

  it('skips empty cells', () => {
    const ctx = makeCtx();
    const board: (string | null)[][] = Array.from({ length: BOARD_ROWS }, () =>
      Array(BOARD_COLS).fill(null)
    );
    drawBoard(ctx, board as any);
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });
});

describe('drawPiece', () => {
  it('draws each cell of the piece', () => {
    const ctx = makeCtx();
    const piece = { type: 'I', row: 0, col: 3, rotation: 0 as const };
    drawPiece(ctx, piece);
    // I piece has 4 cells, each 2 fillRect calls
    expect(ctx.fillRect).toHaveBeenCalledTimes(8);
  });
});

describe('drawGhost', () => {
  it('draws ghost using strokeRect', () => {
    const ctx = makeCtx();
    const ghost = { type: 'T', row: 16, col: 3, rotation: 0 as const };
    drawGhost(ctx, ghost);
    // T piece has 4 cells => 4 strokeRect calls
    expect(ctx.strokeRect).toHaveBeenCalledTimes(4);
  });
});

describe('drawMiniPiece', () => {
  it('clears canvas and fills cells', () => {
    const ctx = makeCtx();
    drawMiniPiece(ctx, 'O', 72, 72);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 72, 72);
    // O has 4 cells, each 2 fillRect + 1 background fillRect = 9 total
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('handles unknown type gracefully', () => {
    const ctx = makeCtx();
    expect(() => drawMiniPiece(ctx, 'X', 72, 72)).not.toThrow();
  });
});
