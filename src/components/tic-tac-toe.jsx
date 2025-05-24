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
  } = useTicTacToe();

  return (
    <div className="container" data-testid="tic-tac-toe">
      <section className="game">
        <h1 className="title">Tic Tac Toe</h1>

        <div className="status">
          <p className="status-message">{getStatusMessage()}</p>
          <button
            className="reset-btn"
            onClick={resetGame}
            aria-label="Reset the game"
          >
            Play Again
          </button>
        </div>
        <div className="category">
          <div className="category-select">
            <label htmlFor="category1">Player 1 Category</label>
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
          <div className="category-select">
            <label htmlFor="category2">Player 2 Category</label>
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
        </div>

        <div className="board">
          {board.map((cell, index) => (
            <button
              key={index}
              className="cell"
              onClick={() => handleClick(index)}
              disabled={cell !== null}
              aria-label={`Cell ${index + 1}, ${cell ? cell.emoji : "empty"}`}
            >
              {cell?.emoji || ""}
            </button>
          ))}
        </div>
      </section>

      <section className="information-wrapper">
        <h2 className="info-title">Player Information</h2>
        <div className="information">
          <p>
            Player 1 Category: <strong>{player1Category}</strong>
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
        <div className="information">
          <p>
            Player 2 Category: <strong>{player2Category}</strong>
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
      </section>
    </div>
  );
}

export default TicTacToe;
