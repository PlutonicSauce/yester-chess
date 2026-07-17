export type Player = 'amber' | 'violet';
export type PieceKind = 'king' | 'knight' | 'pawn';
export type Square = number;
export type Piece = { id: string; owner: Player; kind: PieceKind; square: Square; captured: boolean };
export type PublicToken = { id: string; owner: Player; square: Square };
export type Feedback =
  | { kind: 'quiet'; text: string }
  | { kind: 'capture'; text: string; captured: PieceKind; square: Square }
  | { kind: 'check'; text: string }
  | { kind: 'illegal'; text: string }
  | { kind: 'win'; text: string };
export type GameState = { phase: 'setup' | 'play' | 'over'; turn: Player; viewer: Player; pieces: Piece[]; ready: Record<Player, boolean>; observed: PublicToken[]; feedback: Feedback[]; selected: Square | null };
export const opponent = (player: Player): Player => player === 'amber' ? 'violet' : 'amber';
export const rowOf = (square: Square) => Math.floor(square / 6);
export const colOf = (square: Square) => square % 6;
export const squareName = (square: Square) => `${String.fromCharCode(65 + colOf(square))}${6 - rowOf(square)}`;
export const homeRows = (player: Player) => player === 'amber' ? [4, 5] : [0, 1];
// Internal keys stay stable for the rules engine. The product only exposes classic chess sides.
export const label = (player: Player) => player === 'amber' ? 'White' : 'Black';
