# Refereeless Kriegspiel

A focused Midnight gaming-track MVP: a 6×6 blind chess variant with free secret setup,
one king, two knights, and two pawns per player. Capturing the king wins; checkmate,
promotion, castling, and en passant are deliberately out of scope.

## Run the playable demo

```bash
npm run dev
```

Open the displayed local URL. In **Secret setup**, choose a player perspective, place the
five pieces anywhere in its two home rows, and commit both setups. The board then shows the
viewer only their own true pieces; opponent pieces become anonymous tokens only after they
move. The perspective toggle is solely for a one-browser demo.

The app is deliberately labelled **Local demo mode**. Its `LocalDemoGateway` executes rules
in memory. `MidnightGateway` is the production seam and refuses to silently fall back to
browser state. The current DApp Connector 4.0.1 example is still needed to wire a concrete
Lace session call; no browser-global API is guessed.

## Midnight scaffold

The project was created with Midnight's official generator:

```bash
npx create-mn-app refereeless-kriegspiel --template battleship --use-npm --skip-git
```

It uses the maintained Battleship reference contract and generated Midnight.js 4.1.1 /
Wallet SDK 1.2.0 dependency set. Compact CLI 0.5.1 is installed locally with the compiler
pinned to 0.31.1. The generated contract remains in `contract/battleship.compact` as the
current, compiling syntax reference.

## Important: production proof protocol is intentionally gated

Read [`contract/PROTOCOL.md`](contract/PROTOCOL.md) before turning on the network adapter.
The requested combination of hidden piece kinds, hidden opponent board state, capture, and
check cannot be correctly verified from a mover's private witness alone. The document names
the exact unresolved shared-witness/two-step-response decision and the public information
leaks the game rules inherently cause.

## Useful commands

```bash
npm run build:web
npm run compile
npm run env:up
npm run test:local
```

`npm run compile` and the local-network tests target the unmodified official reference until
the protocol decision above is implemented and verified against a current Compact example.
