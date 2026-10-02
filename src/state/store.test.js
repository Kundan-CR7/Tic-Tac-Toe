import { describe, expect, it } from "vitest";
import {
  HISTORY_LIMIT,
  canUndo,
  createInitialState,
  currentStreak,
  displayName,
  gameReducer,
  matchupKey,
  scoresFor,
  selectGame,
} from "./store";

const play = (state, cells, extra = {}) =>
  cells.reduce((current, cell, i) => gameReducer(current, { type: "move", cell, at: 1000 + i, ...extra }), state);

const settings = (state, patch) => gameReducer(state, { type: "updateSettings", patch });

const X_WINS = [0, 3, 1, 4, 2];
const O_WINS = [0, 3, 1, 4, 8, 5];
const DRAW = [0, 1, 2, 4, 3, 5, 7, 6, 8];

describe("createInitialState", () => {
  it("falls back to defaults for missing or corrupted data", () => {
    const state = createInitialState({ settings: { mode: "online", names: { X: 42 } }, scores: "x", history: {} });
    expect(state.settings).toMatchObject({ mode: "local", difficulty: "medium", starter: "X", rules: "classic" });
    expect(state.settings.names).toEqual({ X: "", O: "" });
    expect(state.scores).toEqual({});
    expect(state.history).toEqual([]);
    expect(state.round).toMatchObject({ id: 1, starter: "X", moves: [] });
  });

  it("restores an unfinished round and drops illegal moves", () => {
    const state = createInitialState({ round: { id: 4, starter: "O", moves: [4, 0, 0, 8] } });
    expect(state.round).toEqual({ id: 4, starter: "O", moves: [4, 0] });
  });

  it("starts a fresh round if the saved one had already finished", () => {
    const state = createInitialState({ round: { id: 2, starter: "X", moves: X_WINS } });
    expect(state.round).toMatchObject({ id: 3, moves: [] });
  });
});

describe("moves and results", () => {
  it("records a win once, with a history entry", () => {
    const state = play(createInitialState(), X_WINS);
    expect(selectGame(state)).toMatchObject({ status: "won", winner: "X" });
    expect(scoresFor(state)).toEqual({ X: 1, O: 0, draw: 0 });
    expect(state.history).toHaveLength(1);
    expect(state.history[0]).toMatchObject({
      matchup: "local:classic",
      winner: "X",
      moves: X_WINS,
      names: { X: "Player X", O: "Player O" },
    });
    // Further clicks after the game ended change nothing.
    expect(gameReducer(state, { type: "move", cell: 8 })).toBe(state);
  });

  it("counts O wins and draws", () => {
    let state = play(createInitialState(), O_WINS);
    state = play(gameReducer(state, { type: "newRound" }), DRAW);
    expect(scoresFor(state)).toEqual({ X: 0, O: 1, draw: 1 });
    expect(state.history.map((entry) => entry.winner)).toEqual([null, "O"]);
  });

  it("ignores moves on occupied cells and moves for the wrong player", () => {
    const state = play(createInitialState(), [4]);
    expect(gameReducer(state, { type: "move", cell: 4 })).toBe(state);
    expect(gameReducer(state, { type: "move", cell: 0, player: "X" })).toBe(state);
    expect(gameReducer(state, { type: "move", cell: 0, player: "O" }).round.moves).toEqual([4, 0]);
  });

  it("keeps separate scoreboards per opponent and rules", () => {
    let state = play(createInitialState(), X_WINS);
    state = settings(state, { mode: "cpu", difficulty: "easy" });
    expect(matchupKey(state.settings)).toBe("cpu-easy:classic");
    expect(scoresFor(state)).toEqual({ X: 0, O: 0, draw: 0 });
    state = settings(state, { mode: "local" });
    expect(scoresFor(state)).toEqual({ X: 1, O: 0, draw: 0 });
  });

  it("caps the match history", () => {
    let state = createInitialState();
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) {
      state = gameReducer(play(state, X_WINS), { type: "newRound" });
    }
    expect(state.history).toHaveLength(HISTORY_LIMIT);
    expect(scoresFor(state).X).toBe(HISTORY_LIMIT + 5);
  });

  it("tracks win streaks for the current matchup", () => {
    let state = createInitialState();
    for (const moves of [O_WINS, X_WINS, X_WINS, X_WINS]) {
      state = gameReducer(play(state, moves), { type: "newRound" });
    }
    expect(currentStreak(state)).toEqual({ player: "X", length: 3 });
    state = gameReducer(play(state, DRAW), { type: "newRound" });
    expect(currentStreak(state)).toEqual({ player: null, length: 0 });
  });
});

describe("undo", () => {
  it("takes back one move in two-player mode", () => {
    const state = play(createInitialState(), [4, 0]);
    expect(canUndo(state)).toBe(true);
    expect(gameReducer(state, { type: "undo" }).round.moves).toEqual([4]);
  });

  it("returns to the human's turn against the computer", () => {
    let state = settings(createInitialState(), { mode: "cpu" });
    state = play(state, [4]);
    state = gameReducer(state, { type: "move", cell: 0, player: "O", byComputer: true });
    expect(gameReducer(state, { type: "undo" }).round.moves).toEqual([]);
    // While the computer is still thinking, undo removes just the human move.
    const thinking = play(gameReducer(state, { type: "undo" }), [8]);
    expect(gameReducer(thinking, { type: "undo" }).round.moves).toEqual([]);
  });

  it("cannot undo the computer's opening move", () => {
    let state = settings(createInitialState(), { mode: "cpu", starter: "O" });
    state = gameReducer(state, { type: "move", cell: 4, player: "O", byComputer: true });
    expect(canUndo(state)).toBe(false);
    expect(gameReducer(state, { type: "undo" })).toBe(state);
  });

  it("is not available once the round has ended", () => {
    const state = play(createInitialState(), X_WINS);
    expect(canUndo(state)).toBe(false);
  });
});

describe("computer turns", () => {
  it("rejects human moves while the computer is to move", () => {
    let state = settings(createInitialState(), { mode: "cpu" });
    state = play(state, [4]);
    expect(gameReducer(state, { type: "move", cell: 0 })).toBe(state);
    expect(gameReducer(state, { type: "move", cell: 0, player: "O" })).toBe(state);
  });
});

describe("rounds and settings", () => {
  it("alternates the starting player each round when asked", () => {
    let state = settings(createInitialState(), { starter: "alternate" });
    const starters = [state.round.starter];
    for (let i = 0; i < 3; i++) {
      state = gameReducer(state, { type: "newRound" });
      starters.push(state.round.starter);
    }
    expect(new Set(starters)).toEqual(new Set(["X", "O"]));
    expect(starters[1]).not.toBe(starters[0]);
    expect(starters[2]).toBe(starters[0]);
  });

  it("ignores a delayed new-round request once another round has started", () => {
    const base = play(createInitialState(), [4]);
    const changed = settings(base, { mode: "cpu" });
    expect(gameReducer(changed, { type: "newRound", from: base.round.id })).toBe(changed);
    expect(gameReducer(changed, { type: "newRound", from: changed.round.id }).round.id).toBe(changed.round.id + 1);
  });

  it("uses the chosen starter", () => {
    const state = settings(createInitialState(), { starter: "O" });
    expect(state.round.starter).toBe("O");
    expect(selectGame(state).turn).toBe("O");
  });

  it("starts a new round when game options change but not for names", () => {
    const base = play(createInitialState(), [4, 0]);
    const renamed = settings(base, { names: { X: " Ada  Lovelace " } });
    expect(renamed.round).toBe(base.round);
    expect(renamed.settings.names).toEqual({ X: " Ada  Lovelace ", O: "" });
    expect(displayName(renamed.settings, "X")).toBe("Ada Lovelace");
    for (const patch of [{ mode: "cpu" }, { difficulty: "hard" }, { rules: "vanishing" }, { starter: "O" }]) {
      const next = settings(base, patch);
      expect(next.round.moves).toEqual([]);
      expect(next.round.id).toBe(base.round.id + 1);
    }
  });

  it("clips long names and resets scores and history on request", () => {
    let state = settings(createInitialState(), { names: { O: "A very long player name indeed" } });
    expect(state.settings.names.O).toHaveLength(16);
    state = play(state, X_WINS);
    state = gameReducer(state, { type: "resetScores" });
    expect(scoresFor(state)).toEqual({ X: 0, O: 0, draw: 0 });
    expect(state.history).toHaveLength(1);
    expect(gameReducer(state, { type: "clearHistory" }).history).toEqual([]);
  });

  it("names players sensibly in each mode", () => {
    const local = createInitialState();
    expect(displayName(local.settings, "X")).toBe("Player X");
    const cpu = settings(local, { mode: "cpu" });
    expect(displayName(cpu.settings, "X")).toBe("You");
    expect(displayName(cpu.settings, "O")).toBe("Computer");
    const named = settings(cpu, { names: { X: "Ada", O: "Grace" } });
    expect(displayName(named.settings, "X")).toBe("Ada");
    expect(displayName(named.settings, "O")).toBe("Computer");
    const blank = settings(local, { names: { O: "   " } });
    expect(displayName(blank.settings, "O")).toBe("Player O");
  });
});
