import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { activeGateway } from './game/gateway';
import { initialGame, ownPieceAt, validSetupMove } from './game/rules';
import { GameState, label, Player, rowOf, Square, squareName } from './game/types';
import './styles.css';

const glyph = { king: '♔', knight: '♘', pawn: '♙' };
const gateway = activeGateway;

function App() {
  const [game, setGame] = useState<GameState>(initialGame);
  const [wallet, setWallet] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const placeSetup = (from: Square, to: Square) => {
    if (validSetupMove(game, game.viewer, from, to)) {
      setGame({ ...game, pieces: game.pieces.map((piece) => piece.square === from && piece.owner === game.viewer ? { ...piece, square: to } : piece), selected: null });
    }
  };
  const clickSquare = async (square: Square) => {
    const own = ownPieceAt(game, game.viewer, square);
    if (game.selected === null) { if (own) setGame({ ...game, selected: square }); return; }
    const from = game.selected;
    if (own) { setGame({ ...game, selected: square }); return; }
    if (game.phase === 'setup') {
      if (validSetupMove(game, game.viewer, from, square)) placeSetup(from, square);
      else setGame({ ...game, selected: null });
      return;
    }
    if (game.viewer !== game.turn || game.phase !== 'play') return;
    setBusy(true); setGame(await gateway.submitMove(game, from, square)); setBusy(false);
  };
  const markReady = () => { const ready = { ...game.ready, [game.viewer]: true }; setGame({ ...game, ready, selected: null, phase: ready.amber && ready.violet ? 'play' : 'setup', turn: ready.amber && ready.violet ? 'amber' : game.turn }); };
  const moveHint = game.phase === 'setup' ? `Arrange ${label(game.viewer)}'s five pieces in its two home rows.` : game.phase === 'over' ? 'The king was captured — this MVP has no checkmate rule.' : game.turn === game.viewer ? 'Select one of your pieces, then a destination.' : `Waiting for ${label(game.turn)}.`;
  return <main>
    <header><div><p className="eyebrow">MIDNIGHT × GAMING TRACK</p><h1>Refereeless <em>Kriegspiel</em></h1></div><button className="wallet" onClick={async () => setWallet((await gateway.connectWallet()).identity)}>{wallet ? `Session ${wallet}` : 'Connect Lace session'}</button></header>
    <section className="warning"><strong>LOCAL DEMO MODE</strong><span>Rules run in this browser. The production adapter must submit Compact proofs; this screen never treats the mock as a privacy guarantee.</span></section>
    <section className="controls"><div><span className={`dot ${game.turn}`}></span><b>{game.phase === 'play' ? `${label(game.turn)} to move` : game.phase === 'over' ? 'Game complete' : 'Secret setup'}</b><small>{moveHint}</small></div><div className="perspective"><span>Demo perspective</span>{(['amber', 'violet'] as Player[]).map((player) => <button key={player} className={game.viewer === player ? 'active' : ''} onClick={() => setGame({ ...game, viewer: player, selected: null })}>{label(player)}</button>)}</div></section>
    <div className="layout"><section className="board" aria-label="6 by 6 game board">{Array.from({ length: 36 }, (_, square) => { const known = ownPieceAt(game, game.viewer, square); const publicToken = game.observed.find((token) => token.square === square && token.owner !== game.viewer); const selected = game.selected === square; return <button key={square} className={`cell ${(rowOf(square) + square % 6) % 2 ? 'dark' : 'light'} ${selected ? 'selected' : ''}`} onClick={() => clickSquare(square)} onDragOver={(event) => { if (game.phase === 'setup') event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/plain')); if (Number.isInteger(from)) placeSetup(from, square); }} disabled={busy}><span className="coordinate">{squareName(square)}</span>{known && <span className={`piece ${known.owner}`} draggable={game.phase === 'setup' && !game.ready[game.viewer]} onDragStart={(event) => event.dataTransfer.setData('text/plain', String(known.square))} title={known.kind}>{glyph[known.kind]}</span>}{publicToken && <span className={`token ${publicToken.owner}`} title="Unidentified opponent piece">◉</span>}</button>; })}</section>
      <aside><div className="panel"><p className="eyebrow">YOUR PRIVATE VIEW</p><h2>{label(game.viewer)} {game.phase === 'setup' ? 'setup' : 'pieces'}</h2><div className="piece-list">{game.pieces.filter((piece) => piece.owner === game.viewer && !piece.captured).map((piece) => <span key={piece.id}>{glyph[piece.kind]} {piece.kind} · {squareName(piece.square)}</span>)}</div>{game.phase === 'setup' && <button className="ready" disabled={game.ready[game.viewer]} onClick={markReady}>{game.ready[game.viewer] ? 'Setup committed' : 'Commit setup'}</button>}</div><div className="panel feed"><p className="eyebrow">REFEREE FEEDBACK</p>{game.feedback.length ? game.feedback.slice(0, 4).map((entry, index) => <p key={index} className={entry.kind}>{entry.text}</p>) : <p>Only legal outcomes appear here.</p>}</div><div className="panel leak"><p className="eyebrow">PRIVACY WATCH</p><p>Origin/destination are visible after a legal move. An L-shape identifies the mover as a knight; diagonal pawn captures also narrow identity. This is an intentional gameplay leak in the current rules.</p></div></aside></div>
    <footer>6×6 · 1 king · 2 knights · 2 pawns · capture the king to win · no castling, promotion, en passant, or checkmate</footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);
