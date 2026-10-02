import { useEffect, useReducer } from "react";
import { createInitialState, gameReducer, persistable } from "../state/store";
import { STORAGE_KEYS, readJSON, writeJSON } from "../state/storage";

const init = () => createInitialState(readJSON(STORAGE_KEYS.game));

export function useGameStore() {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.game, persistable(state));
  }, [state]);

  return [state, dispatch];
}
