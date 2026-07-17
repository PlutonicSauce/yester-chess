# Refereeless Kriegspiel: Compact protocol boundary

The `battleship.compact` file is the unmodified official `create-mn-app` Battleship
reference. It compiles with the generated toolchain and is retained as the syntax/reference
contract; it is not the Kriegspiel contract.

## What is safe to build in Compact 0.31.1

Each player keeps `Vector<5, Piece>` and a 32-byte secret salt in their private state.
`Piece` contains only a kind (`KING`, `KNIGHT`, `PAWN`) and a 0–35 square. A setup circuit
must prove all of the following in one call:

1. Exact multiset: 1 king, 2 knights, 2 pawns.
2. All squares are distinct and in that player's two home rows.
3. Insert five salted `persistentHash(kind, square, salt)` commitments into that player's
   public `Set<Bytes<32>>`; never disclose the pieces, squares, or salt.
4. Store only the player's dApp-specific public key, setup-complete flag, and commitments.

For a non-capturing move, the mover can privately witness their current board, prove an
origin contains their own piece, prove the destination is empty of their own pieces, prove
the piece's move geometry, replace the old salted commitment with a new one, and disclose
only the intentionally public origin/destination event.

## Do not implement capture/check as a one-party witness

That would be unsound. The moving player's witness cannot know whether the destination
contains an opponent piece or whether an opponent king is in check. Conversely, the defender
does not know the mover's hidden kind. A `localCheckBoard()`-style defender report only works
if the defender can prove their report against a commitment *and* the protocol binds the
moving piece's identity to the relevant check calculation without revealing it.

The official Battleship sample has the defender resolve an incoming shot against its own
committed cells. It is useful precedent for the response turn, but cannot directly establish
the hidden-kind chess rule.

## Required design decision before a production Compact implementation

Choose and document one of these before writing the `move`/`resolve` circuits:

1. **Joint/shared proving witness (recommended):** both players encrypt their state to a
   game-specific shared proving key. The active proof can read both committed boards, prove
   occupancy, capture, and check, and disclose only the prescribed event. Verify that the
   Preview Wallet SDK/DApp Connector can supply this shared private input to the prover.
2. **Two-step response protocol:** mover commits an intent; defender proves capture/no-capture
   and check with a zero-knowledge response. This needs a hiding binding between the mover's
   piece commitment and a defender-verifiable attack predicate. It also introduces a response
   turn; with no timer, either player can deliberately stall the match.

Until that choice has a current Midnight example or documentation reference, any Compact
source claiming complete capture/check verification would be speculative.

## Privacy ledger: intentional and unavoidable leaks

| Public item | What it leaks |
| --- | --- |
| A successful origin → destination move | The moved token's location, trajectory, and active player. |
| Knight L-shaped geometry | The mover is definitely a knight. |
| Pawn diagonal capture | Strongly identifies a pawn; a one-square quiet diagonal is illegal. |
| King-only adjacent move (in many positions) | Can identify/narrow a king. |
| Capture square and revealed victim kind | The victim's identity, square, removal, and likely attack route. |
| `check` bit | The defender's king is attacked; across move geometry it narrows the attacker's kind. |
| Transaction timing / failed submission | Turn activity and potential attempted move; invalid attempts must fail before ledger mutation, but network-level metadata still needs review. |

The UI's Privacy Watch panel makes the move-geometry leak explicit in the demo. It is not a
bug the compiler can prevent: it follows from the rules' public move event.

## Compact syntax used as reference

Current official docs confirm `witness` callbacks, `Vector`, `Set`, `persistentHash`, and
explicit `disclose()` handling. The generated `battleship.compact` shows the currently
maintained syntax for the exact compiler family, including commitment insertion and the
defender-response pattern. Pin the compiler before compiling:

```bash
compact update 0.31.1
```
