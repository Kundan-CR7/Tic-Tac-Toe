import { useState, useEffect } from "react";

const initialBoard = () => Array(9).fill(null);

const emojiCategories = {
  Animal: ["🐶", "🐱", "🐵", "🐰"],
  Food: ["🍕", "🍟", "🍔", "🍩"],
  Sport: ["⚽️", "🏀", "🏈", "🎾"],
  Face: ["😀", "😎", "😡", "🥳"],
  Nature: ["🌸", "🌞", "🌧️", "🌈"],
};

const useTicTacToe = () => {
  const [board, setBoard] = useState(initialBoard());
  const [isXNext, setIsXNext] = useState(true);
  const [player1Category, setPlayer1Category] = useState("Sport");
  const [player2Category, setPlayer2Category] = useState("Nature");
  const [player1Index, setPlayer1Index] = useState([]);
  const [player2Index, setPlayer2Index] = useState([]);

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

  const calculateWinner = (currentBoard) => {
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
    const winner = calculateWinner(board);
    if (winner || board[index]) return;

    const newBoard = [...board];
    const currentPlayer = isXNext ? "Player1" : "Player2";
    const currentCategory = isXNext ? player1Category : player2Category;
    const currentIndex = isXNext ? player1Index : player2Index;
    const setCurrentIndex = isXNext ? setPlayer1Index : setPlayer2Index;

    let updatedIndices = [...currentIndex, index];
    let removedIndex = null;

    if (updatedIndices.length > 3) {
      removedIndex = updatedIndices.shift();
      newBoard[removedIndex] = null;
    }

    newBoard[index] = {
      emoji: getRandomEmoji(currentCategory),
      player: currentPlayer,
    };

    setCurrentIndex(updatedIndices);
    setBoard(newBoard);
    setIsXNext((prev) => !prev);
  };

  useEffect(() => {
    console.log("Player1", player1Index);
  }, [player1Index]);

  useEffect(() => {
    console.log("Player2", player2Index);
  }, [player2Index]);

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
    setBoard(initialBoard());
    setIsXNext(true);
    setPlayer1Index([]);
    setPlayer2Index([]);
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
