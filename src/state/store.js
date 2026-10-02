import {
  RULES,
  deriveGame,
  isPlayable,
  opponent,
  playerForMove,
  sanitizeMoves,
} from "../game/rules";
import { DIFFICULTIES } from "../game/ai";

export const HUMAN = "X";
export const COMPUTER = "O";
export const HISTORY_LIMIT = 50;
export const NAME_MAX_LENGTH = 16;

const MODES = ["local", "cpu"];
const STARTERS = ["X", "O", "alternate"];
const GAME_SETTINGS = ["mode", "difficulty", "starter", "rules"];

export const DEFAULT_SETTINGS = Object.freeze({
  mode: "local",
  difficulty: "medium",
  starter: "X",
  rules: RULES.classic,
  names: Object.freeze({ X: "", O: "" }),
});

const oneOf = (value, options, fallback) => (options.includes(value) ? value : fallback);

/** Names are stored as typed, so inputs can hold spaces mid-edit, and tidied for display. */
export const cleanName = (value) => (typeof value === "string" ? value.slice(0, NAME_MAX_LENGTH) : "");

const tidyName = (value) => value.replace(/\s+/g, " ").trim();

function normalizeSettings(raw = {}) {
  const value = raw && typeof raw === "object" ? raw : {};
  return {
    mode: oneOf(value.mode, MODES, DEFAULT_SETTINGS.mode),
    difficulty: oneOf(value.difficulty, DIFFICULTIES, DEFAULT_SETTINGS.difficulty),
    starter: oneOf(value.starter, STARTERS, DEFAULT_SETTINGS.starter),
    rules: oneOf(value.rules, Object.values(RULES), DEFAULT_SETTINGS.rules),
    names: { X: cleanName(value.names?.X), O: cleanName(value.names?.O) },
  };
}

const count = (value) => (Number.isInteger(value) && value > 0 ? value : 0);

function normalizeScores(raw) {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      { X: count(value?.X), O: count(value?.O), draw: count(value?.draw) },
    ]),
  );
}

function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry) =>
        entry &&
        typeof entry.id === "string" &&
        Number.isFinite(entry.at) &&
        Array.isArray(entry.moves) &&
        typeof entry.matchup === "string",
    )
    .slice(0, HISTORY_LIMIT);
}

export const roundOptions = (state) => ({
  starter: state.round.starter,
  rules: state.settings.rules,
});

export const selectGame = (state) => deriveGame(state.round.moves, roundOptions(state));

/** Scoreboards are kept per opponent and rule set, e.g. "cpu-hard:classic". */
export function matchupKey(settings) {
  const against = settings.mode === "cpu" ? `cpu-${settings.difficulty}` : "local";
  return `${against}:${settings.rules}`;
}

export function defaultName(settings, player) {
  if (settings.mode === "cpu") return player === COMPUTER ? "Computer" : "You";
  return `Player ${player}`;
}

export function displayName(settings, player) {
  if (settings.mode === "cpu" && player === COMPUTER) return "Computer";
  return tidyName(settings.names[player]) || defaultName(settings, player);
}

export const isComputerTurn = (state, game = selectGame(state)) =>
  state.settings.mode === "cpu" && game.status === "playing" && game.turn === COMPUTER;

function nextStarter(settings, previous) {
  if (settings.starter !== "alternate") return settings.starter;
  return previous ? opponent(previous) : "X";
}

function freshRound(state, settings = state.settings) {
  return {
    id: (state.round?.id ?? 0) + 1,
    starter: nextStarter(settings, state.round?.starter),
    moves: [],
  };
}

export function createInitialState(saved) {
  const settings = normalizeSettings(saved?.settings);
  const state = {
    settings,
    scores: normalizeScores(saved?.scores),
    history: normalizeHistory(saved?.history),
    round: null,
  };
  const round = saved?.round;
  if (round && Number.isInteger(round.id) && (round.starter === "X" || round.starter === "O")) {
    state.round = {
      id: round.id,
      starter: round.starter,
      moves: sanitizeMoves(round.moves, { starter: round.starter, rules: settings.rules }),
    };
    if (selectGame(state).status !== "playing") state.round = freshRound(state);
  } else {
    state.round = { id: 1, starter: nextStarter(settings), moves: [] };
  }
  return state;
}

function recordResult(state, game, at) {
  const key = matchupKey(state.settings);
  const outcome = game.winner ?? "draw";
  const current = state.scores[key] ?? { X: 0, O: 0, draw: 0 };
  const entry = {
    id: `${at}-${state.round.id}`,
    at,
    matchup: key,
    mode: state.settings.mode,
    difficulty: state.settings.mode === "cpu" ? state.settings.difficulty : null,
    rules: state.settings.rules,
    starter: state.round.starter,
    moves: game.moves,
    winner: game.winner,
    drawReason: game.drawReason,
    names: { X: displayName(state.settings, "X"), O: displayName(state.settings, "O") },
  };
  return {
    scores: { ...state.scores, [key]: { ...current, [outcome]: current[outcome] + 1 } },
    history: [entry, ...state.history].slice(0, HISTORY_LIMIT),
  };
}

/** Moves left after an undo. Against the computer, undo returns to your last turn. */
export function movesAfterUndo(state) {
  const { moves, starter } = state.round;
  const game = selectGame(state);
  if (game.status !== "playing" || moves.length === 0) return moves;
  if (state.settings.mode !== "cpu") return moves.slice(0, -1);
  for (let i = moves.length - 1; i >= 0; i--) {
    if (playerForMove(i, starter) === HUMAN) return moves.slice(0, i);
  }
  return moves;
}

export const canUndo = (state) => movesAfterUndo(state) !== state.round.moves;

export function gameReducer(state, action) {
  switch (action.type) {
    case "move": {
      const game = selectGame(state);
      if (!isPlayable(game, action.cell)) return state;
      if (action.player && action.player !== game.turn) return state;
      const computerTurn = state.settings.mode === "cpu" && game.turn === COMPUTER;
      if (computerTurn !== Boolean(action.byComputer)) return state;
      const moves = [...state.round.moves, action.cell];
      const next = { ...state, round: { ...state.round, moves } };
      const result = selectGame(next);
      if (result.status === "playing") return next;
      return { ...next, ...recordResult(next, { ...result, moves }, action.at ?? Date.now()) };
    }
    case "undo": {
      const moves = movesAfterUndo(state);
      if (moves === state.round.moves) return state;
      return { ...state, round: { ...state.round, moves } };
    }
    case "newRound":
      // `from` lets a delayed request (after the clearing animation) skip
      // itself if something else already started a new round.
      if (action.from !== undefined && action.from !== state.round.id) return state;
      return { ...state, round: freshRound(state) };
    case "updateSettings": {
      const settings = normalizeSettings({
        ...state.settings,
        ...action.patch,
        names: { ...state.settings.names, ...action.patch.names },
      });
      const gameChanged = GAME_SETTINGS.some((key) => settings[key] !== state.settings[key]);
      return { ...state, settings, round: gameChanged ? freshRound(state, settings) : state.round };
    }
    case "resetScores":
      return { ...state, scores: {} };
    case "clearHistory":
      return { ...state, history: [] };
    default:
      return state;
  }
}

export function scoresFor(state) {
  return state.scores[matchupKey(state.settings)] ?? { X: 0, O: 0, draw: 0 };
}

/** Consecutive wins by the same player, most recent first, for the current matchup. */
export function currentStreak(state) {
  const key = matchupKey(state.settings);
  let player = null;
  let length = 0;
  for (const entry of state.history) {
    if (entry.matchup !== key) continue;
    if (!entry.winner || (player && entry.winner !== player)) break;
    player = entry.winner;
    length += 1;
  }
  return { player, length };
}

export const persistable = ({ settings, scores, history, round }) => ({
  settings,
  scores,
  history,
  round,
});
