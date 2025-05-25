import React from "react";
import useTicTacToe from "./hooks/use-tic-tac-toe";

function TicTacToe() {
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

  return (
    <div className="container" data-testid="tic-tac-toe">
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
            onChange={(e) => setPlayer1Category(e.target.value)}
          >
            {Object.keys(emojiCategories).map((category) => (
              <option key={category} value={category}>
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
              disabled={cell !== null}
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
            onChange={(e) => setPlayer2Category(e.target.value)}
          >
            {Object.keys(emojiCategories).map((category) => (
              <option key={category} value={category}>
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
