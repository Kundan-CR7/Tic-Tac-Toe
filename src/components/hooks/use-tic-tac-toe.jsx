import { useState } from "react";

const initialBoard = () => Array(9).fill(null);

const emojiCategories = {
  Animal: ["🐶", "🐱", "🐵", "🐰"],
  Food: ["🍕", "🍟", "🍔", "🍩"],
  Sport: ["⚽️", "🏀", "🏈", "🎾"],
  Face: ["😀", "😎", "😡", "🥳"],
  Nature: ["🌸", "🌞", "🌧️", "🌈"],
};

const useTicTacToe = () => {
  let [board, setBoard] = useState(initialBoard());
  const [isXNext, setIsXNext] = useState(true);
  const [player1Category, setPlayer1Category] = useState("Sport");
  const [player2Category, setPlayer2Category] = useState("Nature");

  const WINNING_PATTERS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const calculateWinner = (currentBoard) => {
    for (let i = 0; i < WINNING_PATTERS.length; i++) {
      const [a, b, c] = WINNING_PATTERS[i];
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
        return cellA.player;
      }
    }
    return null;
  };
  const getRandomEmoji = (category) => {
    const options = emojiCategories[category];
    return options[Math.floor(Math.random() * options.length)];
  };

  const handleClick = (index) => {
    console.log(Object.entries(emojiCategories));
    const winner = calculateWinner(board);
    if (winner || board[index]) return;

    const newBoard = [...board];
    const currentPlayer = isXNext ? "Player1" : "Player2";
    const currentCategory = isXNext ? player1Category : player2Category;

    newBoard[index] = {
      emoji: getRandomEmoji(currentCategory),
      player: currentPlayer,
    };

    setBoard(newBoard);
    setIsXNext((prev) => !prev);
  };

  const getStatusMessage = () => {
    const winner = calculateWinner(board);
    if (winner) {
      return `${winner} wins`;
    }
    if (!board.includes(null)) {
      return `It's a draw!`;
    }
    return `Player ${isXNext ? "X" : "O"} turn`;
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setIsXNext(true);
  };

  return {
    board,
    player1Category,
    player2Category,
    handleClick,
    calculateWinner,
    getStatusMessage,
    resetGame,
  };
};
export default useTicTacToe;
