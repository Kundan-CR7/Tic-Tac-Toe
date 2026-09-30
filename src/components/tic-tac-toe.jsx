import { useEffect, useRef, useState } from "react";
import useTicTacToe from "./hooks/use-tic-tac-toe";

const WINNING_PATTERNS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinningCells(currentBoard) {
  for (let i = 0; i < WINNING_PATTERNS.length; i++) {
    const [a, b, c] = WINNING_PATTERNS[i];
    const cellA = currentBoard[a];
    const cellB = currentBoard[b];
    const cellC = currentBoard[c];
    if (
      cellA &&
      cellB &&
      cellC &&
      cellA.player === cellB.player &&
      cellA.player === cellC.player
    ) {
      return WINNING_PATTERNS[i];
    }
  }
  return null;
}

function playerName(player) {
  return player === "Player1" ? "Player 1" : "Player 2";
}

function PlayerPanel({
  player,
  categoryInputId,
  category,
  blockedCategory,
  indices,
  categories,
  onSelect,
  active,
  won,
}) {
  const oldestLeaves = indices.length === 3;

  return (
    <section
      className={`information-wrapper ${
        player === "Player1" ? "player1-dashboard" : "player2-dashboard"
      } ${active ? "is-active" : "is-idle"} ${won ? "is-winner" : ""}`}
      aria-label={playerName(player)}
    >
      <div className="player-heading">
        <span className="avatar" aria-hidden="true">
          {categories[category][0]}
        </span>
        <div>
          <h2 className="info-title">{playerName(player)}</h2>
          <p className="player-category">{category}</p>
        </div>
        {won ? (
          <span className="turn-pill">Winner</span>
        ) : active ? (
          <span className="turn-pill">Turn</span>
        ) : null}
      </div>

      <div className="information">
        <p className="moves" id={`${categoryInputId}-moves`}>
          Marks, oldest first
        </p>
        <div className="move-list" aria-labelledby={`${categoryInputId}-moves`}>
          {indices.length === 0 ? (
            <span className="moves-empty">No marks yet</span>
          ) : (
            indices.map((pos, idx) => (
              <span
                key={`${pos}-${idx}`}
                className={`move ${oldestLeaves && idx === 0 ? "move-oldest" : ""}`}
                aria-label={`Square ${pos + 1}${
                  oldestLeaves && idx === 0 ? ", leaves on the next mark" : ""
                }`}
              >
                {pos + 1}
              </span>
            ))
          )}
        </div>
        {oldestLeaves && (
          <p className="vanish-note">
            Next mark replaces square {indices[0] + 1}
          </p>
        )}
      </div>

      <div className="category-select">
        <label htmlFor={categoryInputId}>Category</label>
        <select
          id={categoryInputId}
          value={category}
          onChange={(e) => onSelect(e.target.value)}
        >
          {Object.keys(categories).map((option) => (
            <option
              key={option}
              value={option}
              disabled={option === blockedCategory}
            >
              {option}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

function TicTacToe() {
  const [showHelp, setShowHelp] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [showVictory, setShowVictory] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [stroke, setStroke] = useState(null);
  const boardRef = useRef(null);
  const startBtnRef = useRef(null);
  const playAgainRef = useRef(null);
  const {
    board,
    handleClick,
    resetGame,
    getStatusMessage,
    emojiCategories,
    player1Category,
    player2Category,
    setPlayer1Category,
    setPlayer2Category,
    player1Index,
    player2Index,
    isXNext,
    calculateWinner,
  } = useTicTacToe();

  const winner = calculateWinner(board);
  const winningLine = getWinningCells(board);
  const buttonText = winner ? "Play Again" : "Reset";

  useEffect(() => {
    const currentWinner = calculateWinner(board);
    if (currentWinner && !showVictory) {
      console.log("Winner detected, showing victory overlay:", currentWinner);
      setShowVictory(true);
      const confettiElements = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
      }));
      setConfetti(confettiElements);
    } else if (!currentWinner && showVictory) {
      setShowVictory(false);
      setConfetti([]);
    }
  }, [board, showVictory, calculateWinner]);

  useEffect(() => {
    if (showHelp) startBtnRef.current?.focus();
  }, [showHelp]);

  useEffect(() => {
    if (!showHelp) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setShowHelp(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showHelp]);

  useEffect(() => {
    if (showVictory) playAgainRef.current?.focus();
  }, [showVictory]);

  useEffect(() => {
    const line = getWinningCells(board);
    if (!line || !boardRef.current) {
      setStroke(null);
      return undefined;
    }

    const measure = () => {
      const boardEl = boardRef.current;
      if (!boardEl) return;
      const cells = boardEl.querySelectorAll(".cell");
      const startCell = cells[line[0]];
      const endCell = cells[line[2]];
      if (!startCell || !endCell) return;
      const boardRect = boardEl.getBoundingClientRect();
      const startRect = startCell.getBoundingClientRect();
      const endRect = endCell.getBoundingClientRect();
      const x1 = startRect.left + startRect.width / 2 - boardRect.left;
      const y1 = startRect.top + startRect.height / 2 - boardRect.top;
      const x2 = endRect.left + endRect.width / 2 - boardRect.left;
      const y2 = endRect.top + endRect.height / 2 - boardRect.top;
      const length = Math.hypot(x2 - x1, y2 - y1);
      const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      setStroke({
        width: `${length}px`,
        transform: `translate(${x1}px, ${y1 - 4}px) rotate(${angle}deg)`,
      });
    };

    measure();
    document.fonts?.ready?.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [board]);

  const handlePlayAgain = () => {
    console.log("Play Again clicked, starting reset sequence...");
    resetGame();
    setPlayer1Category("Animal");
    setPlayer2Category("Food");
    setCategoryError("");
    console.log("Game reset complete");
  };

  const handleReset = () => {
    console.log("Reset clicked, starting reset sequence...");
    setShowVictory(false);
    setConfetti([]);
    setCategoryError("");
    resetGame();
    setPlayer1Category("Animal");
    setPlayer2Category("Food");
    console.log("Game reset complete");
  };

  const handleCategorySelect = (player, category) => {
    if (player === "Player1" && category === player2Category) {
      setCategoryError("This category is already selected by Player 2");
      setTimeout(() => setCategoryError(""), 2000);
      return;
    }
    if (player === "Player2" && category === player1Category) {
      setCategoryError("This category is already selected by Player 1");
      setTimeout(() => setCategoryError(""), 2000);
      return;
    }
    if (player === "Player1") {
      setPlayer1Category(category);
    } else {
      setPlayer2Category(category);
    }
    setCategoryError("");
  };

  const statusClass = winner
    ? "status-win"
    : isXNext
      ? "turn1"
      : "turn2";

  return (
    <main className="app" data-testid="tic-tac-toe">
      {showVictory && (
        <div className="victory-overlay">
          <div className="confetti-layer" aria-hidden="true">
            {confetti.map((c) => (
              <div
                key={c.id}
                className="confetti"
                style={{
                  left: c.left,
                  animationDelay: c.animationDelay,
                }}
              />
            ))}
          </div>
          <div
            className={`victory-content ${
              winner === "Player2" ? "victory-p2" : "victory-p1"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="victory-title"
          >
            <div>
              <h2 id="victory-title" className="victory-title">
                Victory
              </h2>
              <p className="victory-message">
                {winner === "Player1" ? "Player 1" : "Player 2"} has won the
                game!
              </p>
            </div>
            <button
              ref={playAgainRef}
              type="button"
              className="start-game-btn"
              onClick={handlePlayAgain}
              data-testid="play-again-button"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div
          className="help-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
          <div className="help-content">
            <div className="help-scroll">
              <p className="eyebrow">Emoji Clash</p>
              <h2 id="help-title">How to Play</h2>
              <div className="help-section">
                <h3>Game Rules</h3>
                <ul>
                  <li>Players take turns placing their emojis on the board</li>
                  <li>Each player can choose their own emoji category</li>
                  <li>
                    Get three of your emojis in a row (horizontally, vertically,
                    or diagonally) to win
                  </li>
                  <li>Players can only place 3 emojis on the board at a time</li>
                  <li>
                    When placing a 4th emoji, the oldest one will be removed
                  </li>
                  <li>Players cannot select the same category</li>
                </ul>
              </div>
              <div className="help-section">
                <h3>Tips</h3>
                <ul>
                  <li>Choose your emoji category before starting</li>
                  <li>Plan your moves strategically</li>
                  <li>Watch out for your opponent&apos;s patterns</li>
                  <li>Use the &quot;Reset&quot; button to start a new game</li>
                </ul>
              </div>
            </div>
            <div className="help-actions">
              <button
                ref={startBtnRef}
                type="button"
                className="start-game-btn"
                onClick={() => setShowHelp(false)}
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="hero" inert={showHelp || showVictory}>
        <p className="eyebrow">Emoji Clash</p>
        <h1 className="title">Tic Tac Toe</h1>
        <p className="tagline">
          Three marks each. Line them up before your oldest one disappears.
        </p>
        <button
          type="button"
          className="text-btn"
          onClick={() => setShowHelp(true)}
        >
          How to play
        </button>
      </header>

      <div className="stage" inert={showHelp || showVictory}>
        <PlayerPanel
          player="Player1"
          categoryInputId="category1"
          category={player1Category}
          blockedCategory={player2Category}
          indices={player1Index || []}
          categories={emojiCategories}
          onSelect={(category) => handleCategorySelect("Player1", category)}
          active={!winner && isXNext}
          won={winner === "Player1"}
        />

        <section className="game" aria-label="Game">
          <div className={`status-message ${statusClass}`} role="status" aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {getStatusMessage()
              .replaceAll("Player1", "Player 1")
              .replaceAll("Player2", "Player 2")}
          </div>

          <div className="legend" aria-hidden="true">
            <span className={`legend-item ${!winner && isXNext ? "is-active" : ""}`}>
              <i className="swatch swatch-1" />
              Player 1
            </span>
            <span className={`legend-item ${!winner && !isXNext ? "is-active" : ""}`}>
              <i className="swatch swatch-2" />
              Player 2
            </span>
          </div>

          {categoryError && (
            <p className="category-error" role="alert">
              {categoryError}
            </p>
          )}

          <div className="board-shell">
            <div
              className={`board ${isXNext ? "board-p1" : "board-p2"}`}
              ref={boardRef}
              role="grid"
              aria-label="Tic-tac-toe board"
            >
              {stroke && (
                <span className="win-stroke" style={stroke} aria-hidden="true" />
              )}
              {[0, 1, 2].map((row) => (
                <div className="board-row" role="row" key={row}>
                  {[0, 1, 2].map((col) => {
                    const index = row * 3 + col;
                    const cell = board[index];
                    const occupied = cell !== null;
                    const locked = occupied || Boolean(winner);
                    const onWinningLine = Boolean(winningLine?.includes(index));
                    const owner =
                      cell?.player === "Player1"
                        ? "player1"
                        : cell?.player === "Player2"
                          ? "player2"
                          : "";
                    return (
                      <button
                        key={index}
                        type="button"
                        role="gridcell"
                        aria-rowindex={row + 1}
                        aria-colindex={col + 1}
                        aria-label={
                          occupied
                            ? `${playerName(cell.player)}, ${cell.emoji}, row ${row + 1} column ${col + 1}${
                                onWinningLine ? ", winning line" : ""
                              }`
                            : `Empty square, row ${row + 1} column ${col + 1}`
                        }
                        className={`cell ${owner} ${
                          occupied ? "" : "cell-empty"
                        } ${onWinningLine ? "cell-win" : ""}`}
                        onClick={() => handleClick(index)}
                        disabled={locked}
                      >
                        {occupied ? (
                          <span className="mark">{cell.emoji}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="reset-btn"
            onClick={handleReset}
            aria-label={winner ? "Play again" : "Reset the game"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="reset-icon">
              <path
                d="M20 12a8 8 0 1 1-2.2-5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M20 4v5h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {buttonText}
          </button>
        </section>

        <PlayerPanel
          player="Player2"
          categoryInputId="category2"
          category={player2Category}
          blockedCategory={player1Category}
          indices={player2Index || []}
          categories={emojiCategories}
          onSelect={(category) => handleCategorySelect("Player2", category)}
          active={!winner && !isXNext}
          won={winner === "Player2"}
        />
      </div>
    </main>
  );
}

export default TicTacToe;
