export const CELL_COUNT = 9;
export const VANISH_LIMIT = 3;
export const REPETITION_LIMIT = 3;

export const RULES = Object.freeze({
  classic: "classic",
  vanishing: "vanishing",
});

export const LINES = Object.freeze([
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]);

export const opponent = (player) => (player === "X" ? "O" : "X");

export function playerForMove(moveIndex, starter = "X") {
  return moveIndex % 2 === 0 ? starter : opponent(starter);
}

/**
 * Finds every completed line on a board. Only one player can own a line in
 * a real game, so the owner of the first completed line is the winner.
 */
export function findWin(board) {
  let winner = null;
  const lines = [];
  for (const line of LINES) {
    const [a, b, c] = line;
    const mark = board[a];
    if (!mark || mark !== board[b] || mark !== board[c]) continue;
    if (winner && mark !== winner) continue;
    winner = mark;
    lines.push(line);
  }
  return winner ? { winner, lines } : null;
}

export const isBoardFull = (board) => board.every((cell) => cell !== null);

export function emptyCells(board) {
  const cells = [];
  for (let i = 0; i < CELL_COUNT; i++) if (board[i] === null) cells.push(i);
  return cells;
}

const positionKey = (turn, queues) =>
  `${turn}|${queues.X.join("")}|${queues.O.join("")}`;

/**
 * Replays a move list and returns everything the UI and AI need to know
 * about the position. Moves are cell indices (0-8, row by row). Replay stops
 * at the first illegal move and ignores anything played after the game ended,
 * so `moveCount` tells how many moves were actually applied.
 */
export function deriveGame(moves, { starter = "X", rules = RULES.classic } = {}) {
  const vanishing = rules === RULES.vanishing;
  const board = Array(CELL_COUNT).fill(null);
  const placedAt = Array(CELL_COUNT).fill(-1);
  const queues = { X: [], O: [] };
  const seen = new Map();
  let win = null;
  let drawReason = null;
  let lastMove = null;
  let lastRemoved = null;
  let moveCount = 0;

  for (const cell of moves) {
    if (win || drawReason) break;
    if (!Number.isInteger(cell) || cell < 0 || cell >= CELL_COUNT) break;
    if (board[cell] !== null) break;

    const player = playerForMove(moveCount, starter);
    const queue = queues[player];
    lastRemoved = null;
    if (vanishing && queue.length === VANISH_LIMIT) {
      lastRemoved = queue.shift();
      board[lastRemoved] = null;
      placedAt[lastRemoved] = -1;
    }
    board[cell] = player;
    placedAt[cell] = moveCount;
    queue.push(cell);
    lastMove = cell;
    moveCount += 1;

    win = findWin(board);
    if (win) break;
    if (!vanishing && isBoardFull(board)) {
      drawReason = "board-full";
      break;
    }
    if (vanishing) {
      const key = positionKey(playerForMove(moveCount, starter), queues);
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      if (count >= REPETITION_LIMIT) drawReason = "repetition";
    }
  }

  const turn = playerForMove(moveCount, starter);
  const status = win ? "won" : drawReason ? "draw" : "playing";
  const vanishingCell =
    vanishing && status === "playing" && queues[turn].length === VANISH_LIMIT
      ? queues[turn][0]
      : null;

  return {
    board,
    placedAt,
    queues,
    turn,
    status,
    winner: win?.winner ?? null,
    lines: win?.lines ?? [],
    drawReason,
    vanishingCell,
    lastMove,
    lastRemoved,
    moveCount,
    starter,
    rules,
  };
}

export const isPlayable = (game, cell) =>
  game.status === "playing" &&
  Number.isInteger(cell) &&
  cell >= 0 &&
  cell < CELL_COUNT &&
  game.board[cell] === null;

/** Returns the longest legal prefix of `moves` (used when loading saved games). */
export function sanitizeMoves(moves, options) {
  if (!Array.isArray(moves)) return [];
  const game = deriveGame(moves, options);
  return moves.slice(0, game.moveCount);
}

const ROW_NAMES = ["top", "middle", "bottom"];
const COL_NAMES = ["left", "center", "right"];

/** Human-friendly cell name, e.g. "top left" or "center". */
export function cellName(cell) {
  const row = Math.floor(cell / 3);
  const col = cell % 3;
  if (row === 1 && col === 1) return "center";
  return `${ROW_NAMES[row]} ${COL_NAMES[col]}`;
}

/** Describes a winning line, e.g. "top row", "left column", "diagonal". */
export function lineName(line) {
  const [a, , c] = line;
  if (c - a === 2) return `${ROW_NAMES[a / 3]} row`;
  if (c - a === 6) return `${COL_NAMES[a]} column`;
  return "diagonal";
}
