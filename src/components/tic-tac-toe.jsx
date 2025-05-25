import React, { useState, useEffect } from "react";
import useTicTacToe from "./hooks/use-tic-tac-toe";

function TicTacToe() {
  const [showHelp, setShowHelp] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [showVictory, setShowVictory] = useState(false);
  const [confetti, setConfetti] = useState([]);
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
  const buttonText = winner ? "Play Again" : "Reset";

  useEffect(() => {
    if (winner && !showVictory) {
      console.log("Winner detected, showing victory overlay:", winner);
      setShowVictory(true);
      const confettiElements = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
      }));
      setConfetti(confettiElements);
    }
  }, [winner, showVictory]);

  const handlePlayAgain = () => {
    console.log("Play Again clicked, resetting game...");
    // Reset all states in a single batch
    setShowVictory(false);
    setConfetti([]);
    resetGame();
    setPlayer1Category("Animal");
    setPlayer2Category("Food");
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

  return (
    <div className="container" data-testid="tic-tac-toe">
      {showVictory && (
        <div className="victory-overlay">
          <div className="victory-content">
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
            <h1 className="victory-title">🎉 VICTORY! 🎉</h1>
            <p className="victory-message">
              {winner === "Player1" ? "Player 1" : "Player 2"} has won the game!
            </p>
            <button
              className="start-game-btn"
              onClick={() => {
                console.log("Play Again button clicked");
                handlePlayAgain();
              }}
              data-testid="play-again-button"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="help-overlay">
          <div className="help-content">
            <h2>How to Play</h2>
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
                <li>Watch out for your opponent's patterns</li>
                <li>Use the "Reset" button to start a new game</li>
              </ul>
            </div>
            <button
              className="start-game-btn"
              onClick={() => setShowHelp(false)}
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      <section className="information-wrapper player1-dashboard">
        <h2 className="info-title">Player 1</h2>
        <div className="information">
          <p>
            Category: <strong>{player1Category}</strong>
          </p>
          <div className="index-display">
            <strong className="moves">Move positions: </strong>
            {(player1Index || []).map((pos, idx) => (
              <span key={idx} className="move">
                {pos + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="category-select">
          <label htmlFor="category1" className="turn1">
            Select Category
          </label>
          <select
            id="category1"
            value={player1Category}
            onChange={(e) => handleCategorySelect("Player1", e.target.value)}
          >
            {Object.keys(emojiCategories).map((category) => (
              <option
                key={category}
                value={category}
                disabled={category === player2Category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="game">
        <h1 className="title">Tic Tac Toe</h1>

        <div>
          <p className={`status-message ${isXNext ? "turn1" : "turn2"}`}>
            {getStatusMessage()}
          </p>
        </div>
        {categoryError && <p className="category-error">{categoryError}</p>}
        <div>
          <button
            className="reset-btn"
            onClick={resetGame}
            aria-label="Reset the game"
          >
            {buttonText}
          </button>
        </div>

        <div className="board">
          {board.map((cell, index) => (
            <button
              key={index}
              className={`cell ${
                cell?.player === "Player1"
                  ? "player1"
                  : cell?.player === "Player2"
                  ? "player2"
                  : ""
              }`}
              onClick={() => handleClick(index)}
              disabled={cell !== null || winner}
            >
              {cell?.emoji || ""}
            </button>
          ))}
        </div>
      </section>

      <section className="information-wrapper player2-dashboard">
        <h2 className="info-title">Player 2</h2>
        <div className="information">
          <p>
            Category: <strong>{player2Category}</strong>
          </p>
          <div className="index-display">
            <strong className="moves">Move positions: </strong>
            {(player2Index || []).map((pos, idx) => (
              <span key={idx} className="move">
                {pos + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="category-select">
          <label htmlFor="category2" className="turn2">
            Select Category
          </label>
          <select
            id="category2"
            value={player2Category}
            onChange={(e) => handleCategorySelect("Player2", e.target.value)}
          >
            {Object.keys(emojiCategories).map((category) => (
              <option
                key={category}
                value={category}
                disabled={category === player1Category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}

export default TicTacToe;
