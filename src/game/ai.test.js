import { describe, expect, it } from "vitest";
import { bestMoves, chooseMove } from "./ai";
import { deriveGame, emptyCells, isPlayable, opponent } from "./rules";

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const constant = (value) => () => value;

function randomPosition(rng, options) {
  const moves = [];
  const length = Math.floor(rng() * 8);
  for (let i = 0; i < length; i++) {
    const game = deriveGame(moves, options);
    if (game.status !== "playing") break;
    const cells = emptyCells(game.board);
    moves.push(cells[Math.floor(rng() * cells.length)]);
  }
  return deriveGame(moves, options).status === "playing" ? moves : moves.slice(0, -1);
}

describe("chooseMove", () => {
  it("returns null once the game is over", () => {
    const won = [0, 3, 1, 4, 2];
    for (const difficulty of ["easy", "medium", "hard"]) {
      expect(chooseMove(won, { difficulty })).toBeNull();
    }
  });

  it.each(["easy", "medium", "hard"])("%s always picks a playable cell", (difficulty) => {
    const rng = mulberry32(7);
    for (const rules of ["classic", "vanishing"]) {
      for (let trial = 0; trial < 60; trial++) {
        const options = { rules, starter: rng() < 0.5 ? "X" : "O" };
        const moves = randomPosition(rng, options);
        const cell = chooseMove(moves, { ...options, difficulty, rng });
        expect(isPlayable(deriveGame(moves, options), cell)).toBe(true);
      }
    }
  });
});

describe("easy", () => {
  it("picks uniformly from the empty cells", () => {
    const moves = [4, 0];
    expect(chooseMove(moves, { difficulty: "easy", rng: constant(0) })).toBe(1);
    expect(chooseMove(moves, { difficulty: "easy", rng: constant(0.999) })).toBe(8);
  });
});

describe("medium", () => {
  it("takes a winning move instead of blocking", () => {
    // X: 0 1 8, O: 3 4 to move. O wins at 5 even though X threatens 2.
    for (const value of [0, 0.5, 0.99]) {
      expect(chooseMove([0, 3, 1, 4, 8], { difficulty: "medium", rng: constant(value) })).toBe(5);
    }
  });

  it("blocks an immediate threat", () => {
    expect(chooseMove([0, 4, 1], { difficulty: "medium", rng: constant(0) })).toBe(2);
  });

  it("prefers the center on an open board", () => {
    expect(chooseMove([0], { difficulty: "medium", rng: constant(0.5) })).toBe(4);
  });

  it("can be beaten with a fork", () => {
    const rng = constant(0.5);
    const script = [0, 8, 2, 1, 5];
    const moves = [];
    while (deriveGame(moves).status === "playing") {
      const game = deriveGame(moves);
      if (game.turn === "X") moves.push(script.find((cell) => isPlayable(game, cell)));
      else moves.push(chooseMove(moves, { difficulty: "medium", rng }));
    }
    expect(deriveGame(moves).winner).toBe("X");
  });
});

describe("hard (classic)", () => {
  it("wins immediately when it can", () => {
    expect(bestMoves([0, 3, 1, 4, 8], {})).toEqual([5]);
  });

  it("blocks an immediate threat", () => {
    expect(bestMoves([0, 4, 1], {})).toEqual([2]);
  });

  it("answers a corner opening with the center", () => {
    expect(bestMoves([0], {})).toEqual([4]);
  });

  /**
   * Plays every possible human reply against every move the computer rates
   * as best, so the computer can never be beaten whichever optimal move its
   * random tie-break picks.
   */
  function exploreAll(computer, starter) {
    const options = { starter, rules: "classic" };
    const losses = [];
    let games = 0;
    const visit = (moves) => {
      const game = deriveGame(moves, options);
      if (game.status !== "playing") {
        games += 1;
        if (game.winner === opponent(computer)) losses.push(moves);
        return;
      }
      const replies = game.turn === computer ? bestMoves(moves, options) : emptyCells(game.board);
      for (const cell of replies) visit([...moves, cell]);
    };
    visit([]);
    return { losses, games };
  }

  it("never loses when the human starts", () => {
    const { losses, games } = exploreAll("O", "X");
    expect(games).toBeGreaterThan(100);
    expect(losses).toEqual([]);
  });

  it("never loses when the computer starts", () => {
    const { losses, games } = exploreAll("O", "O");
    expect(games).toBeGreaterThan(100);
    expect(losses).toEqual([]);
  });

  it("beats a random player most of the time without ever losing", () => {
    const rng = mulberry32(42);
    const results = { win: 0, draw: 0, loss: 0 };
    for (let round = 0; round < 200; round++) {
      const moves = [];
      const starter = round % 2 === 0 ? "X" : "O";
      const options = { starter, rules: "classic" };
      let game = deriveGame(moves, options);
      while (game.status === "playing") {
        const difficulty = game.turn === "O" ? "hard" : "easy";
        moves.push(chooseMove(moves, { ...options, difficulty, rng }));
        game = deriveGame(moves, options);
      }
      results[game.winner === "O" ? "win" : game.winner === "X" ? "loss" : "draw"] += 1;
    }
    expect(results.loss).toBe(0);
    expect(results.win).toBeGreaterThan(results.draw);
  });
});

describe("hard (vanishing)", () => {
  const vanishing = { rules: "vanishing", starter: "X" };

  it("wins when its oldest mark leaving completes a line", () => {
    // X: 6 1 2 to move. Playing 0 removes 6 and completes the top row.
    expect(bestMoves([6, 4, 1, 5, 2, 8], vanishing)).toEqual([0]);
  });

  it("blocks an immediate threat", () => {
    expect(bestMoves([0, 4, 1], vanishing)).toEqual([2]);
  });

  it("decides quickly even on an open board", () => {
    const started = performance.now();
    const cell = chooseMove([], { ...vanishing, difficulty: "hard" });
    expect(isPlayable(deriveGame([], vanishing), cell)).toBe(true);
    expect(performance.now() - started).toBeLessThan(1500);
  });

  it("never loses to a random player", () => {
    const rng = mulberry32(3);
    for (let round = 0; round < 25; round++) {
      const options = { rules: "vanishing", starter: round % 2 === 0 ? "X" : "O" };
      const moves = [];
      let game = deriveGame(moves, options);
      while (game.status === "playing" && moves.length < 60) {
        const difficulty = game.turn === "O" ? "hard" : "easy";
        moves.push(chooseMove(moves, { ...options, difficulty, rng }));
        game = deriveGame(moves, options);
      }
      expect(game.winner).not.toBe("X");
    }
  });
});
