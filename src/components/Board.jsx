import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { cellName } from "../game/rules";
import { Mark } from "./Mark";
import { WinLines } from "./WinLines";
import "./board.css";

const ROWS = [0, 1, 2];

const distanceFromCenter = (cell) => Math.abs(Math.floor(cell / 3) - 1) + Math.abs((cell % 3) - 1);

function cellLabel(game, cell) {
  const name = cellName(cell);
  const position = name[0].toUpperCase() + name.slice(1);
  const mark = game.board[cell];
  if (!mark) return `${position}, empty`;
  const parts = [position, mark];
  if (game.lines.some((line) => line.includes(cell))) parts.push("winning line");
  if (game.vanishingCell === cell) parts.push("vanishes next");
  return parts.join(", ");
}

const NAVIGATION = {
  ArrowUp: (cell) => (cell >= 3 ? cell - 3 : cell),
  ArrowDown: (cell) => (cell <= 5 ? cell + 3 : cell),
  ArrowLeft: (cell) => (cell % 3 > 0 ? cell - 1 : cell),
  ArrowRight: (cell) => (cell % 3 < 2 ? cell + 1 : cell),
  Home: (cell, ctrl) => (ctrl ? 0 : cell - (cell % 3)),
  End: (cell, ctrl) => (ctrl ? 8 : cell - (cell % 3) + 2),
};

export function Board({ ref, game, turn, interactive, clearing, roundId, reducedMotion, onPlay, onBlocked }) {
  const [activeCell, setActiveCell] = useState(4);
  const [exit, setExit] = useState(null);
  const [seenMoveCount, setSeenMoveCount] = useState(game.moveCount);
  const frameRef = useRef(null);
  const gridRef = useRef(null);
  const cellRefs = useRef([]);
  const lastRoundRef = useRef(roundId);

  // A mark removed by the vanishing rule leaves the board state immediately;
  // keep a copy for one move so it can animate out.
  if (game.moveCount !== seenMoveCount) {
    setSeenMoveCount(game.moveCount);
    const fresh = game.moveCount > seenMoveCount && game.lastRemoved !== null;
    setExit(fresh ? { cell: game.lastRemoved, player: game.board[game.lastMove], key: game.moveCount } : null);
  }

  useImperativeHandle(
    ref,
    () => ({
      focus: () => cellRefs.current[activeCell]?.focus(),
      contains: (node) => Boolean(node && gridRef.current?.contains(node)),
      element: () => frameRef.current,
    }),
    [activeCell],
  );

  useEffect(() => {
    if (lastRoundRef.current === roundId) return;
    lastRoundRef.current = roundId;
    if (reducedMotion) return;
    cellRefs.current.forEach((cell, index) => {
      cell?.animate(
        [
          { transform: "scale(0.86)", opacity: 0.4 },
          { transform: "scale(1.02)", opacity: 1, offset: 0.7 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 460, delay: distanceFromCenter(index) * 55, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" },
      );
    });
  }, [roundId, reducedMotion]);

  const onKeyDown = (event) => {
    const move = NAVIGATION[event.key];
    if (!move) return;
    event.preventDefault();
    const next = move(activeCell, event.ctrlKey || event.metaKey);
    setActiveCell(next);
    cellRefs.current[next]?.focus();
  };

  const onCellClick = (cell, element) => {
    if (interactive && game.board[cell] === null) {
      onPlay(cell);
      return;
    }
    if (game.status === "playing" && game.board[cell] !== null && !reducedMotion) {
      element.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-5px)" },
          { transform: "translateX(5px)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 320, easing: "ease-out" },
      );
    }
    onBlocked(cell);
  };

  const winningOrder = (cell) => {
    for (const line of game.lines) {
      const index = line.indexOf(cell);
      if (index !== -1) return index;
    }
    return -1;
  };

  return (
    <div
      ref={frameRef}
      id="board"
      className="board-frame"
      data-status={game.status}
      data-turn={turn}
      data-winner={game.winner ?? undefined}
      data-clearing={clearing || undefined}
      data-interactive={interactive || undefined}
    >
      <div className="board-surface">
        <div
          ref={gridRef}
          className="board"
          role="grid"
          aria-label="Game board"
          aria-describedby="board-help"
          onKeyDown={onKeyDown}
        >
          {ROWS.map((row) => (
            <div className="board-row" role="row" key={row}>
              {ROWS.map((col) => {
                const cell = row * 3 + col;
                const mark = game.board[cell];
                const order = winningOrder(cell);
                const playable = interactive && mark === null;
                return (
                  <div className="board-cell" role="gridcell" key={col}>
                    <button
                      ref={(node) => {
                        cellRefs.current[cell] = node;
                      }}
                      type="button"
                      className="cell"
                      tabIndex={cell === activeCell ? 0 : -1}
                      aria-label={cellLabel(game, cell)}
                      aria-disabled={playable ? undefined : true}
                      data-cell={cell}
                      data-mark={mark ?? undefined}
                      data-last={(game.lastMove === cell && mark !== null) || undefined}
                      data-win={order !== -1 || undefined}
                      data-fading={game.vanishingCell === cell || undefined}
                      style={{ "--i": cell, "--d": distanceFromCenter(cell), "--win-order": order }}
                      onFocus={() => setActiveCell(cell)}
                      onClick={(event) => onCellClick(cell, event.currentTarget)}
                    >
                      {mark && <Mark key={game.placedAt[cell]} player={mark} variant="placed" />}
                      {!mark && exit?.cell === cell && (
                        <Mark key={`exit-${exit.key}`} player={exit.player} variant="exit" />
                      )}
                      {playable && <Mark player={turn} variant="ghost" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <WinLines lines={game.lines} winner={game.winner} />
      </div>
      <p id="board-help" className="sr-only">
        Use the arrow keys to move between squares, and Enter or Space to place a mark.
      </p>
    </div>
  );
}
