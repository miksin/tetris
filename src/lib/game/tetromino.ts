import { BOARD_ROWS, BOARD_COLS, HIDDEN_ROWS } from './constants';

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Rotation = 0 | 1 | 2 | 3;

export interface ActivePiece {
  type: TetrominoType;
  rotation: Rotation;
  row: number;
  col: number;
}

// Tetromino shapes: [rotation][cells] as [row, col] offsets
export const TETROMINOES: Record<TetrominoType, [number, number][][]> = {
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

// SRS wall kicks for JLSTZ pieces
export const WALL_KICKS_JLSTZ: Record<string, [number, number][]> = {
  '0->1': [[0,0],[ 0,-1],[+1,-1],[-2, 0],[-2,-1]],
  '1->0': [[0,0],[ 0,+1],[-1,+1],[+2, 0],[+2,+1]],
  '1->2': [[0,0],[ 0,+1],[-1,+1],[+2, 0],[+2,+1]],
  '2->1': [[0,0],[ 0,-1],[+1,-1],[-2, 0],[-2,-1]],
  '2->3': [[0,0],[ 0,+1],[+1,+1],[-2, 0],[-2,+1]],
  '3->2': [[0,0],[ 0,-1],[-1,-1],[+2, 0],[+2,-1]],
  '3->0': [[0,0],[ 0,-1],[-1,-1],[+2, 0],[+2,-1]],
  '0->3': [[0,0],[ 0,+1],[+1,+1],[-2, 0],[-2,+1]],
};

// SRS wall kicks for I piece
export const WALL_KICKS_I: Record<string, [number, number][]> = {
  '0->1': [[0,0],[0,-2],[0,+1],[-1,-2],[+2,+1]],
  '1->0': [[0,0],[0,+2],[0,-1],[+1,+2],[-2,-1]],
  '1->2': [[0,0],[0,-1],[0,+2],[+2,-1],[-1,+2]],
  '2->1': [[0,0],[0,+1],[0,-2],[-2,+1],[+1,-2]],
  '2->3': [[0,0],[0,+2],[0,-1],[-1,+2],[+2,-1]],
  '3->2': [[0,0],[0,-2],[0,+1],[+1,-2],[-2,+1]],
  '3->0': [[0,0],[0,+1],[0,-2],[+2,+1],[-1,-2]],
  '0->3': [[0,0],[0,-1],[0,+2],[-2,-1],[+1,+2]],
};

/** Get absolute [row, col] cells for a piece on the board */
export function getCells(piece: ActivePiece): [number, number][] {
  return TETROMINOES[piece.type][piece.rotation].map(
    ([dr, dc]) => [piece.row + dr, piece.col + dc]
  );
}

/** 7-bag random generator */
export function newBag(): TetrominoType[] {
  const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

/** Spawn a new piece at top of board */
export function spawnPiece(type: TetrominoType): ActivePiece {
  return {
    type,
    rotation: 0,
    row: -1,
    col: type === 'O' ? 4 : 3,
  };
}

/** Try to rotate a piece with SRS wall kicks. Returns new ActivePiece or null if failed. */
export function tryRotate(
  board: import('./board').Board,
  isValidPosition: (board: import('./board').Board, piece: ActivePiece) => boolean,
  piece: ActivePiece,
  dir: 1 | -1
): ActivePiece | null {
  const nextRot = ((piece.rotation + dir + 4) % 4) as Rotation;
  const kicks = piece.type === 'I' ? WALL_KICKS_I : WALL_KICKS_JLSTZ;
  const key = `${piece.rotation}->${nextRot}`;
  const kickList = kicks[key] ?? [[0, 0]];
  for (const [dr, dc] of kickList) {
    const candidate: ActivePiece = { ...piece, rotation: nextRot, row: piece.row + dr, col: piece.col + dc };
    if (isValidPosition(board, candidate)) return candidate;
  }
  return null;
}
