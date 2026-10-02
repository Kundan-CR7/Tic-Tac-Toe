import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  THEME_COLORS,
  normalizePrefs,
  resolveMotion,
  resolveTheme,
} from "../state/preferences";
import { STORAGE_KEYS, readJSON, writeJSON } from "../state/storage";
import { useMediaQuery } from "./useMediaQuery";

export function usePreferences() {
  const [prefs, setPrefs] = useState(() => normalizePrefs(readJSON(STORAGE_KEYS.prefs)));
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const systemReduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const theme = resolveTheme(prefs.theme, systemDark);
  const reducedMotion = resolveMotion(prefs.motion, systemReduce);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.prefs, prefs);
  }, [prefs]);

  // Layout effect so a theme change inside a view transition is applied
  // before the new snapshot is taken.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.motion = reducedMotion ? "reduce" : "full";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  }, [theme, reducedMotion]);

  const update = useCallback((patch) => setPrefs((current) => normalizePrefs({ ...current, ...patch })), []);

  return { prefs, update, theme, reducedMotion };
}
