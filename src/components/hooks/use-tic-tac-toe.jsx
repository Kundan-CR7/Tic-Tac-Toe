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
  let [board, setBoard] = useState(initialBoard());
  const [isXNext, setIsXNext] = useState(true);
  const [player1Category, setPlayer1Category] = useState("Sport");
  const [player2Category, setPlayer2Category] = useState("Nature");
  let [player1Index, setPlayer1Index] = useState([]);
  let [player2Index, setPlayer2Index] = useState([]);

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
    const winner = calculateWinner(board);
    if (winner || board[index]) return;

    const newBoard = [...board];
    const currentPlayer = isXNext ? "Player1" : "Player2";
    const currentCategory = isXNext ? player1Category : player2Category;

    isXNext
      ? setPlayer1Index((prev) => {
          const updated = prev.length >= 3 ? prev.slice(1) : [...prev];
          return [...updated, index];
        })
      : setPlayer2Index((prev) => {
          const updated = prev.length >= 3 ? prev.slice(1) : [...prev];
          return [...updated, index];
        });

    const generatedEmoji = getRandomEmoji(currentCategory);

    newBoard[index] = {
      emoji: generatedEmoji,
      player: currentPlayer,
    };

    // let retainIndex = [...player1Index, ...player2Index];
    // let filtered = newBoard.filter((_, index) => {
    //   return retainIndex.includes(index);
    // });

    setBoard(newBoard);
    setIsXNext((prev) => !prev);
  };

  useEffect(() => {
    console.log("Player1 updated:", player1Index);
  }, [player1Index]);

  useEffect(() => {
    console.log("Player2 updated:", player2Index);
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
    setBoard(initialBoard);
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
