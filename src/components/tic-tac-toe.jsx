import React from "react";
import useTicTacToe from "./hooks/use-tic-tac-toe";

function TicTacToe() {
  const { board, handleClick, calculateWinner, resetGame, getStatusMessage } =
    useTicTacToe();
  console.log(board);
  return (
    <div className="game">
      <div className="status">
        <p className="text-xl">{getStatusMessage()}</p>
        <button className="reset-btn" onClick={resetGame}>
          Reset Game
        </button>
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
              {b}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TicTacToe;
