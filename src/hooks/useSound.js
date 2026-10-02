import { useCallback } from "react";
import { playSound } from "../audio/sound";

export function useSound(enabled) {
  return useCallback(
    (name) => {
      if (enabled) playSound(name);
    },
    [enabled],
  );
}
