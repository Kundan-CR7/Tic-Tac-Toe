import { describe, expect, it } from "vitest";
import {
  LINES,
  cellName,
  deriveGame,
  findWin,
  isPlayable,
  lineName,
  playerForMove,
  sanitizeMoves,
} from "./rules";

const boardFrom = (rows) =>
  rows
    .join("")
    .split("")
    .map((ch) => (ch === "." ? null : ch));

describe("findWin", () => {
  it.each(LINES.map((line) => [line]))("detects X and O on line %j", (line) => {
    for (const player of ["X", "O"]) {
      const board = Array(9).fill(null);
      line.forEach((cell) => (board[cell] = player));
      expect(findWin(board)).toEqual({ winner: player, lines: [line] });
    }
  });

  it("returns null for empty, partial and blocked boards", () => {
    expect(findWin(Array(9).fill(null))).toBeNull();
    expect(findWin(boardFrom(["XX.", "OO.", "..."]))).toBeNull();
    expect(findWin(boardFrom(["XOX", "XOO", "OXX"]))).toBeNull();
  });

  it("reports every line completed by the same move", () => {
    const result = findWin(boardFrom(["XXX", "XOO", "XOO"]));
    expect(result.winner).toBe("X");
    expect(result.lines).toEqual([
      [0, 1, 2],
      [0, 3, 6],
    ]);
  });
});

describe("deriveGame (classic)", () => {
  it("starts empty with the chosen starter to move", () => {
    expect(deriveGame([]).turn).toBe("X");
    const game = deriveGame([], { starter: "O" });
    expect(game).toMatchObject({ turn: "O", status: "playing", moveCount: 0, winner: null });
    expect(game.board.every((cell) => cell === null)).toBe(true);
  });

  it("alternates turns from the starter", () => {
    expect(playerForMove(0, "X")).toBe("X");
    expect(playerForMove(1, "X")).toBe("O");
    expect(playerForMove(0, "O")).toBe("O");
    const game = deriveGame([4, 0, 8], { starter: "O" });
    expect(game.board[4]).toBe("O");
    expect(game.board[0]).toBe("X");
    expect(game.board[8]).toBe("O");
    expect(game.turn).toBe("X");
  });

  it("declares a win and stops accepting moves", () => {
    // X: 0 1 2 across the top, O: 3 4
    const game = deriveGame([0, 3, 1, 4, 2, 5]);
    expect(game).toMatchObject({ status: "won", winner: "X", lines: [[0, 1, 2]], moveCount: 5 });
    expect(game.board[5]).toBeNull();
    expect(isPlayable(game, 5)).toBe(false);
  });

  it("lets O win as the second player", () => {
    const game = deriveGame([0, 2, 1, 4, 8, 6]);
    expect(game).toMatchObject({ status: "won", winner: "O", lines: [[2, 4, 6]] });
  });

  it("declares a draw only when the board fills without a line", () => {
    // X O X / X O O / O X X
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    const game = deriveGame(moves);
    expect(game).toMatchObject({ status: "draw", drawReason: "board-full", winner: null });
    expect(deriveGame(moves.slice(0, 8)).status).toBe("playing");
  });

  it("treats a winning ninth move as a win, not a draw", () => {
    // X takes the bottom-right corner last to complete the diagonal.
    const moves = [0, 1, 4, 2, 5, 3, 6, 7, 8];
    const game = deriveGame(moves);
    expect(game).toMatchObject({ status: "won", winner: "X", moveCount: 9 });
    expect(game.lines).toContainEqual([0, 4, 8]);
  });

  it("stops replaying at an illegal move", () => {
    expect(deriveGame([4, 4, 0]).moveCount).toBe(1);
    expect(deriveGame([9]).moveCount).toBe(0);
    expect(deriveGame([-1]).moveCount).toBe(0);
    expect(deriveGame([1.5]).moveCount).toBe(0);
  });

  it("rejects occupied and out-of-range cells", () => {
    const game = deriveGame([4]);
    expect(isPlayable(game, 4)).toBe(false);
    expect(isPlayable(game, 9)).toBe(false);
    expect(isPlayable(game, 0)).toBe(true);
  });

  it("tracks the last move and move order", () => {
    const game = deriveGame([4, 0, 8]);
    expect(game.lastMove).toBe(8);
    expect(game.placedAt[4]).toBe(0);
    expect(game.placedAt[0]).toBe(1);
    expect(game.placedAt[8]).toBe(2);
    expect(game.placedAt[1]).toBe(-1);
  });
});

describe("deriveGame (vanishing)", () => {
  const vanishing = { rules: "vanishing", starter: "X" };

  it("removes a player's oldest mark when they place a fourth", () => {
    // X: 0, 2, 6 then 7, so 0 vanishes. O: 4, 5, 1.
    const game = deriveGame([0, 4, 2, 5, 6, 1, 7], vanishing);
    expect(game.board[0]).toBeNull();
    expect(game.board[7]).toBe("X");
    expect(game.lastRemoved).toBe(0);
    expect(game.queues.X).toEqual([2, 6, 7]);
    expect(game.status).toBe("playing");
  });

  it("flags the mark that will vanish on the next move", () => {
    expect(deriveGame([0, 4], vanishing).vanishingCell).toBeNull();
    const xToMove = deriveGame([0, 4, 2, 5, 6, 1], vanishing);
    expect(xToMove.turn).toBe("X");
    expect(xToMove.vanishingCell).toBe(0);
    const oToMove = deriveGame([0, 4, 2, 5, 6, 1, 7], vanishing);
    expect(oToMove.turn).toBe("O");
    expect(oToMove.vanishingCell).toBe(4);
  });

  it("never fills the board, so there is no board-full draw", () => {
    const game = deriveGame([0, 1, 2, 4, 3, 5, 7, 6], vanishing);
    expect(game.board.filter(Boolean)).toHaveLength(6);
    expect(game.status).toBe("playing");
  });

  it("only counts marks that are still on the board", () => {
    // X: 0, 1, 7 then 2. Placing 2 removes 0, so the top row is not complete.
    const game = deriveGame([0, 4, 1, 5, 7, 6, 2], vanishing);
    expect(game.board[0]).toBeNull();
    expect(game.status).toBe("playing");
  });

  it("wins with the three marks currently on the board", () => {
    // X: 6, 1, 2, then 0 removes 6 and completes the top row. O: 4, 5, 8.
    const game = deriveGame([6, 4, 1, 5, 2, 8, 0], vanishing);
    expect(game.board[6]).toBeNull();
    expect(game).toMatchObject({ status: "won", winner: "X", lines: [[0, 1, 2]] });
  });

  it("does not allow placing on your own mark that is about to vanish", () => {
    const game = deriveGame([0, 4, 2, 5, 6, 1], vanishing);
    expect(game.vanishingCell).toBe(0);
    expect(isPlayable(game, 0)).toBe(false);
  });

  it("declares a draw when the same position appears three times", () => {
    // X cycles 0, 1, 5, 6 and O cycles 2, 3, 7, 8: no three of either set
    // form a line, so the position after move 6 recurs after moves 14 and 22.
    const cycle = [0, 2, 1, 3, 5, 7, 6, 8];
    const moves = [...cycle, ...cycle, ...cycle];
    expect(deriveGame(moves.slice(0, 21), vanishing).status).toBe("playing");
    expect(deriveGame(moves, vanishing)).toMatchObject({
      status: "draw",
      drawReason: "repetition",
      winner: null,
      moveCount: 22,
    });
  });

  it("never declares a repetition draw in classic rules", () => {
    const game = deriveGame([0, 2, 1, 3, 5, 7, 6, 8]);
    expect(game.drawReason).toBeNull();
  });
});

describe("sanitizeMoves", () => {
  it("keeps the legal prefix and drops moves after the game ended", () => {
    expect(sanitizeMoves([0, 3, 1, 4, 2, 5, 6])).toEqual([0, 3, 1, 4, 2]);
    expect(sanitizeMoves([4, 4])).toEqual([4]);
    expect(sanitizeMoves("nope")).toEqual([]);
  });
});

describe("names", () => {
  it("describes cells and lines for announcements", () => {
    expect(cellName(0)).toBe("top left");
    expect(cellName(4)).toBe("center");
    expect(cellName(7)).toBe("bottom center");
    expect(lineName([3, 4, 5])).toBe("middle row");
    expect(lineName([2, 5, 8])).toBe("right column");
    expect(lineName([2, 4, 6])).toBe("diagonal");
  });
});
