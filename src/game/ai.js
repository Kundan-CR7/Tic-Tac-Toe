import {
  LINES,
  RULES,
  VANISH_LIMIT,
  deriveGame,
  emptyCells,
  opponent,
} from "./rules";

export const DIFFICULTIES = Object.freeze(["easy", "medium", "hard"]);

const CENTER = 4;
const CORNERS = [0, 2, 6, 8];
const MEDIUM_BLOCK_RATE = 0.85;
const MEDIUM_SLIP_RATE = 0.2;

const WIN = 1000;
const MATE_THRESHOLD = 900;
const VANISHING_DEPTH = 10;

export const pick = (items, rng = Math.random) =>
  items[Math.min(items.length - 1, Math.floor(rng() * items.length))];

const hasLine = (board, player) =>
  LINES.some(([a, b, c]) => board[a] === player && board[b] === player && board[c] === player);

function toState(game) {
  return {
    board: game.board.slice(),
    queues: { X: game.queues.X.slice(), O: game.queues.O.slice() },
    turn: game.turn,
    vanishing: game.rules === RULES.vanishing,
  };
}

/** Applies `cell` for the player to move, honouring the vanishing rule. */
function play(state, cell) {
  const player = state.turn;
  const board = state.board.slice();
  const queues = { X: state.queues.X.slice(), O: state.queues.O.slice() };
  const queue = queues[player];
  if (state.vanishing && queue.length === VANISH_LIMIT) board[queue.shift()] = null;
  board[cell] = player;
  queue.push(cell);
  return {
    board,
    queues,
    turn: opponent(player),
    vanishing: state.vanishing,
    winner: hasLine(board, player) ? player : null,
  };
}

const winningCells = (state, player = state.turn) => {
  const asPlayer = player === state.turn ? state : { ...state, turn: player };
  return emptyCells(state.board).filter((cell) => play(asPlayer, cell).winner === player);
};

function positionalPick(cells, rng) {
  if (cells.includes(CENTER)) return CENTER;
  const corners = cells.filter((cell) => CORNERS.includes(cell));
  return pick(corners.length ? corners : cells, rng);
}

/**
 * Medium: always takes a win, usually refuses moves that hand the opponent
 * an immediate win, otherwise plays center > corner > edge. It does not
 * look for forks, so a player who sets one up will beat it.
 */
function mediumMove(state, rng) {
  const legal = emptyCells(state.board);
  const wins = winningCells(state);
  if (wins.length) return pick(wins, rng);

  if (rng() < MEDIUM_BLOCK_RATE) {
    const safe = legal.filter((cell) => winningCells(play(state, cell)).length === 0);
    if (safe.length && safe.length < legal.length) return positionalPick(safe, rng);
  }
  if (rng() < MEDIUM_SLIP_RATE) return pick(legal, rng);
  return positionalPick(legal, rng);
}

const classicMemo = new Map();

/** Perfect-play value of a classic position for the player to move. */
function classicValue(board, player) {
  const key = board.map((cell) => cell ?? "-").join("") + player;
  const cached = classicMemo.get(key);
  if (cached !== undefined) return cached;

  const empties = emptyCells(board);
  let best = -Infinity;
  for (const cell of empties) {
    board[cell] = player;
    let score;
    if (hasLine(board, player)) score = 10 + empties.length - 1;
    else if (empties.length === 1) score = 0;
    else score = -classicValue(board, opponent(player));
    board[cell] = null;
    if (score > best) best = score;
  }
  classicMemo.set(key, best);
  return best;
}

function scoreClassicMoves(state) {
  const board = state.board.slice();
  const empties = emptyCells(board);
  return empties.map((cell) => {
    board[cell] = state.turn;
    let score;
    if (hasLine(board, state.turn)) score = 10 + empties.length - 1;
    else if (empties.length === 1) score = 0;
    else score = -classicValue(board, opponent(state.turn));
    board[cell] = null;
    return { cell, score };
  });
}

function linePotential(board, player) {
  const rival = opponent(player);
  let score = board[CENTER] === player ? 2 : 0;
  for (const [a, b, c] of LINES) {
    const marks = [board[a], board[b], board[c]];
    if (marks.includes(rival)) continue;
    const own = marks.filter((mark) => mark === player).length;
    score += own === 2 ? 4 : own;
  }
  return score;
}

/** Static evaluation for the player to move at the search horizon. */
function evaluate(state) {
  if (winningCells(state).length) return WIN - 1;
  const rival = opponent(state.turn);
  const threats = winningCells(state, rival).length;
  if (threats >= 2) return -(WIN - 2);
  return linePotential(state.board, state.turn) - linePotential(state.board, rival) - threats * 8;
}

const stateKey = (state) => `${state.turn}${state.queues.X.join("")}|${state.queues.O.join("")}`;

const EXACT = 0;
const LOWER = 1;
const UPPER = 2;

function orderedMoves(state) {
  return emptyCells(state.board).sort((a, b) => rank(a) - rank(b));
}
const rank = (cell) => (cell === CENTER ? 0 : CORNERS.includes(cell) ? 1 : 2);

/**
 * Depth-limited negamax with alpha-beta and a transposition table for the
 * vanishing variant, where games can loop and exhaustive search is not
 * possible. Mate scores are node-relative and decay by one per ply so the
 * search prefers faster wins and slower losses.
 */
function searchVanishing(state, depth, alpha, beta, table) {
  const key = stateKey(state);
  const alphaStart = alpha;
  const entry = table.get(key);
  if (entry && entry.depth >= depth) {
    if (entry.flag === EXACT) return entry.value;
    if (entry.flag === LOWER) alpha = Math.max(alpha, entry.value);
    else beta = Math.min(beta, entry.value);
    if (alpha >= beta) return entry.value;
  }

  let best = -Infinity;
  for (const cell of orderedMoves(state)) {
    const next = play(state, cell);
    let score;
    if (next.winner) score = WIN;
    else if (depth <= 1) score = -evaluate(next);
    else {
      score = -searchVanishing(next, depth - 1, -beta - 1, -alpha + 1, table);
      if (score > MATE_THRESHOLD) score -= 1;
      else if (score < -MATE_THRESHOLD) score += 1;
    }
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }

  const flag = best <= alphaStart ? UPPER : best >= beta ? LOWER : EXACT;
  table.set(key, { depth, value: best, flag });
  return best;
}

const vanishingScores = new Map();

function scoreVanishingMoves(state) {
  const key = stateKey(state);
  if (!vanishingScores.has(key)) vanishingScores.set(key, searchVanishingRoot(state));
  return vanishingScores.get(key);
}

function searchVanishingRoot(state, depth = VANISHING_DEPTH) {
  const table = new Map();
  return orderedMoves(state).map((cell) => {
    const next = play(state, cell);
    if (next.winner) return { cell, score: WIN };
    let score = -searchVanishing(next, depth - 1, -Infinity, Infinity, table);
    if (score > MATE_THRESHOLD) score -= 1;
    else if (score < -MATE_THRESHOLD) score += 1;
    return { cell, score };
  });
}

function topCells(scored) {
  const best = Math.max(...scored.map((move) => move.score));
  return scored.filter((move) => move.score === best).map((move) => move.cell);
}

/** Every move the hard computer considers best in the given position. */
export function bestMoves(moves, options) {
  const game = deriveGame(moves, options);
  if (game.status !== "playing") return [];
  const state = toState(game);
  return topCells(state.vanishing ? scoreVanishingMoves(state) : scoreClassicMoves(state));
}

/**
 * Picks the computer's next cell for the given position, or null when the
 * game is already over. `rng` is injectable so tests can be deterministic.
 */
export function chooseMove(moves, { starter, rules, difficulty, rng = Math.random }) {
  const game = deriveGame(moves, { starter, rules });
  if (game.status !== "playing") return null;
  const state = toState(game);
  if (difficulty === "easy") return pick(emptyCells(state.board), rng);
  if (difficulty === "medium") return mediumMove(state, rng);
  return pick(bestMoves(moves, { starter, rules }), rng);
}
