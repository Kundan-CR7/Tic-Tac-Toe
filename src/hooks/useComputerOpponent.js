import { useEffect } from "react";
import { chooseMove } from "../game/ai";
import { COMPUTER, isComputerTurn } from "../state/store";

/** A short, slightly random pause reads as "thinking" rather than lag. */
const THINKING_MS = {
  easy: [380, 620],
  medium: [520, 820],
  hard: [640, 980],
};

/** Plays the computer's moves. Returns true while the computer is thinking. */
export function useComputerOpponent({ state, game, paused, dispatch }) {
  const thinking = !paused && isComputerTurn(state, game);
  const { round } = state;
  const { difficulty, rules } = state.settings;

  useEffect(() => {
    if (!thinking) return;
    const [min, max] = THINKING_MS[difficulty];
    const timer = setTimeout(() => {
      const cell = chooseMove(round.moves, { starter: round.starter, rules, difficulty });
      if (cell !== null) {
        dispatch({ type: "move", cell, player: COMPUTER, byComputer: true, at: Date.now() });
      }
    }, min + Math.random() * (max - min));
    return () => clearTimeout(timer);
  }, [thinking, round, difficulty, rules, dispatch]);

  return thinking;
}
