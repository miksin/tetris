export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Cell = PieceType | null;
export interface Pos { x: number; y: number }
export interface Piece { type: PieceType; pos: Pos; rot: 0 | 1 | 2 | 3 }
export type GameState = 'ready' | 'playing' | 'paused' | 'gameover';
export interface Actions { rotCW: boolean; rotCCW: boolean; hard: boolean; hold: boolean }
export interface Held { left: boolean; right: boolean; down: boolean; actions: Actions }
export interface Snapshot {
  state: GameState; board: Cell[][]; piece: Piece | null; ghostPos: Pos | null;
  queue: PieceType[]; hold: PieceType | null; score: number; level: number; lines: number; canHold: boolean;
}
