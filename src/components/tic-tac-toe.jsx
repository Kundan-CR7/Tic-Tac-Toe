import React from "react";
import useTicTacToe from "./hooks/use-tic-tac-toe";

function TicTacToe() {
  const {
    board,
    handleClick,
    calculateWinner,
    resetGame,
    getStatusMessage,
    emojiCategories,
    selectedCategory,
    setSelectedCategory,
    player1Category,
    player2Category,
    setPlayer1Category,
    setPlayer2Category,
  } = useTicTacToe();
  console.log(board);
  return (
    <div className="container">
      <div className="game">
        <h1 className="title">Tic Tac Toe</h1>
        <div className="status">
          <p className="text-xl">{getStatusMessage()}</p>
          <button className="reset-btn" onClick={resetGame}>
            Play Again
          </button>
        </div>

        <div className="category">
          <label htmlFor="category1">Player1 Category</label>
          <select
            id="category1"
            value={selectedCategory}
            onChange={(e) => setPlayer1Category(e.target.value)}
          >
            {Object.keys(emojiCategories).map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
          <label htmlFor="category2">Player2 Category</label>
          <select
            id="category2"
            value={selectedCategory}
            onChange={(e) => setPlayer2Category(e.target.value)}
          >
            {Object.keys(emojiCategories).map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="board">
          {board.map((b, index) => {
            return (
              <button
                key={index}
                className="cell"
                onClick={() => handleClick(index)}
                disabled={b !== null}
              >
                {b?.emoji || ""}
              </button>
            );
          })}
        </div>
      </div>
      {/* <div>
        <h2>Player Information</h2>
        <p>{player1Category}</p>
        <p>{player2Category}</p>
      </div> */}
    </div>
  );
}

export default TicTacToe;
