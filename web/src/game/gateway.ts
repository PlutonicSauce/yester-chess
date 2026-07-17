import { GameState, Square } from './types';
import { submitLocalMove } from './rules';
/** The UI only depends on this boundary. Replace the local engine with Compact.js transactions once the cross-player commitment protocol is ready. */
export interface GameGateway { submitMove(state: GameState, from: Square, to: Square): Promise<GameState>; connectWallet(): Promise<{ identity: string; mode: 'demo' | 'lace' }>; }
export class LocalDemoGateway implements GameGateway { async submitMove(state: GameState, from: Square, to: Square) { return submitLocalMove(state, from, to); } async connectWallet() { return { identity: 'demo-session-7f3a', mode: 'demo' as const }; } }
export class MidnightGateway implements GameGateway { async connectWallet(): Promise<{ identity: string; mode: 'lace' }> { throw new Error('Lace connector wiring is pending the project-specific DApp Connector example. Demo mode remains available.'); } async submitMove(_state: GameState, _from: Square, _to: Square): Promise<GameState> { throw new Error('Compact move protocol is not configured. Do not fall back to browser state for a privacy claim.'); } }
export const activeGateway: GameGateway = new LocalDemoGateway();
