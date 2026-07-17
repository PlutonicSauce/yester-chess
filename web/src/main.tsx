import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { activeGateway } from './game/gateway';
import { initialGame, ownPieceAt, validSetupMove } from './game/rules';
import { GameState, label, PieceKind, Player, rowOf, Square, squareName } from './game/types';
import './styles.css';

const gateway = activeGateway;

function PieceMark({ kind, player, compact = false }: { kind: PieceKind; player: Player; compact?: boolean }) {
  const className = `piece-mark ${player === 'amber' ? 'white-piece' : 'black-piece'} ${compact ? 'compact' : ''}`;
  if (kind === 'king') return <svg className={className} viewBox="0 0 40 40" aria-label="King" role="img"><path d="M20 6v10M15 11h10M13 18h14l-2 6 5 9H10l5-9-2-6Z" /><path d="M12 34h16" /></svg>;
  if (kind === 'knight') return <svg className={className} viewBox="0 0 40 40" aria-label="Knight" role="img"><path d="M13 33h16l-2-8-7-3-2-7 6-7 4 5-3 4 3 5-2 6" /><path d="M15 19c3 1 6 1 9-1M12 34h17" /></svg>;
  return <svg className={className} viewBox="0 0 40 40" aria-label="Pawn" role="img"><circle cx="20" cy="12" r="5" /><path d="M15 30h10l-2-9h-6l-2 9ZM12 34h16" /></svg>;
}

function SideMark({ player }: { player: Player }) { return <span className={`side-mark ${player === 'amber' ? 'white-side' : 'black-side'}`} aria-hidden="true" />; }

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

  const markReady = () => {
    const ready = { ...game.ready, [game.viewer]: true };
    setGame({ ...game, ready, selected: null, phase: ready.amber && ready.violet ? 'play' : 'setup', turn: ready.amber && ready.violet ? 'amber' : game.turn });
  };

  const phaseTitle = game.phase === 'setup' ? 'Arrange your formation' : game.phase === 'over' ? 'The game is complete' : `${label(game.turn)} to move`;
  const phaseDetail = game.phase === 'setup'
    ? `Place ${label(game.viewer)}’s pieces anywhere in the two home ranks.`
    : game.phase === 'over'
      ? 'The king was captured. This variant ends immediately.'
      : game.turn === game.viewer ? 'Choose one of your pieces, then choose its destination.' : `Waiting for ${label(game.turn)} to make a move.`;
  const ownPieces = game.pieces.filter((piece) => piece.owner === game.viewer && !piece.captured);

  return <main className="app-shell">
    <header className="masthead">
      <div className="brand"><span className="brand-mark">K</span><div><p>Refereeless Kriegspiel</p><span>Blind chess, verified privately</span></div></div>
      <div className="masthead-actions"><span className="demo-note">Prototype mode</span><button className="wallet" onClick={async () => setWallet((await gateway.connectWallet()).identity)}>{wallet ? 'Session connected' : 'Connect Lace'}</button></div>
    </header>

    <section className="intro">
      <div><p className="section-label">A private game of chess</p><h1>Every move is visible.<br /><em>Every intention is not.</em></h1></div>
      <p className="intro-copy">A 6×6 game of deduction where you know your pieces, not theirs. Captures reveal only what the rules require.</p>
    </section>

    <section className="game-bar" aria-label="Game controls">
      <div className="turn-status"><SideMark player={game.phase === 'play' ? game.turn : game.viewer} /><div><strong>{phaseTitle}</strong><span>{phaseDetail}</span></div></div>
      <div className="viewer-switch"><span>Viewing as</span><div className="switch-control">{(['amber', 'violet'] as Player[]).map((player) => <button key={player} className={game.viewer === player ? 'active' : ''} onClick={() => setGame({ ...game, viewer: player, selected: null })}><SideMark player={player} />{label(player)}</button>)}</div></div>
    </section>

    <div className="game-layout">
      <section className="board-area">
        <div className="board-meta"><span>Game board</span><span>6 × 6</span></div>
        <section className="board" aria-label="6 by 6 game board">
          {Array.from({ length: 36 }, (_, square) => {
            const known = ownPieceAt(game, game.viewer, square);
            const publicToken = game.observed.find((token) => token.square === square && token.owner !== game.viewer);
            const selected = game.selected === square;
            return <button key={square} className={`cell ${(rowOf(square) + square % 6) % 2 ? 'dark' : 'light'} ${selected ? 'selected' : ''}`} onClick={() => clickSquare(square)} onDragOver={(event) => { if (game.phase === 'setup') event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/plain')); if (Number.isInteger(from)) placeSetup(from, square); }} disabled={busy}>
              <span className="coordinate">{squareName(square)}</span>
              {known && <span className="piece" draggable={game.phase === 'setup' && !game.ready[game.viewer]} onDragStart={(event) => event.dataTransfer.setData('text/plain', String(known.square))}><PieceMark kind={known.kind} player={known.owner} /></span>}
              {publicToken && <span className={`unknown-token ${publicToken.owner === 'amber' ? 'white-token' : 'black-token'}`} title="Unidentified opponent piece"><i /></span>}
            </button>;
          })}
        </section>
      </section>

      <aside className="game-detail">
        <section className="position-detail">
          <div className="detail-heading"><div><p className="section-label">Your position</p><h2>{label(game.viewer)}</h2></div><span className="concealed">Concealed</span></div>
          <p className="detail-copy">Your piece identities and formation remain yours alone.</p>
          <ul className="piece-list">{ownPieces.map((piece) => <li key={piece.id}><PieceMark kind={piece.kind} player={piece.owner} compact /><span>{piece.kind}<small>{squareName(piece.square)}</small></span></li>)}</ul>
          {game.phase === 'setup' && <button className="ready" disabled={game.ready[game.viewer]} onClick={markReady}>{game.ready[game.viewer] ? 'Formation committed' : 'Commit formation'}</button>}
        </section>

        <section className="activity-detail">
          <div className="detail-heading"><div><p className="section-label">Game activity</p><h2>Referee</h2></div></div>
          <div className="activity-list">{game.feedback.length ? game.feedback.slice(0, 4).map((entry, index) => <p key={index} className={entry.kind}><span />{entry.text}</p>) : <p className="empty-activity"><span />The referee will report only confirmed outcomes.</p>}</div>
        </section>

        <section className="privacy-detail"><p className="section-label">What the board reveals</p><p>Successful moves expose their path. An L-shape proves a knight; a diagonal capture narrows a pawn. The hidden strategy stays hidden.</p></section>
      </aside>
    </div>

    <footer><span>Capture the king to win</span><span>One king · Two knights · Two pawns</span><span>No checkmate, promotion, castling, or en passant</span></footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
