import { Piece, PieceType, Pos } from './types';
import { MATRICES, SPAWN, KICKS_JLSTZ, KICKS_I } from './constants';

export { SPAWN };

const cache = new Map<string, Pos[]>();

function rotateCW(m: number[][]): number[][] {
  return m[0].map((_, i) => m.map((row) => row[i]).reverse());
}

function offsets(type: PieceType, rot: 0 | 1 | 2 | 3): Pos[] {
  const key = `${type},${rot}`;
  if (!cache.has(key)) {
    let m = MATRICES[type];
    for (let i = 0; i < rot; i++) m = rotateCW(m);
    const list: Pos[] = [];
    m.forEach((row, y) => row.forEach((v, x) => { if (v) list.push({ x, y }); }));
    cache.set(key, list);
  }
  return cache.get(key)!;
}

export { offsets as cells };

export function tryKick(piece: Piece, dir: 1 | -1, collide: (p: Piece) => boolean): Piece | null {
  const nextRot = (((piece.rot + dir) % 4) + 4) % 4;
  const table = piece.type === 'O' ? {} : piece.type === 'I' ? KICKS_I : KICKS_JLSTZ;
  const kicks = table[`${piece.rot}>${nextRot}`] ?? [[0, 0]];
  for (const [dx, dy] of kicks) {
    const candidate: Piece = {
      type: piece.type,
      pos: { x: piece.pos.x + dx, y: piece.pos.y + dy },
      rot: nextRot as 0 | 1 | 2 | 3,
    };
    if (!collide(candidate)) return candidate;
  }
  return null;
}

export function ghostY(piece: Piece, collide: (p: Piece) => boolean): number {
  let y = piece.pos.y;
  while (!collide({ ...piece, pos: { x: piece.pos.x, y: y + 1 } })) y++;
  return y;
}
