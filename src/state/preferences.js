/*
 * Device preferences, stored separately from the game so clearing scores
 * never touches them. The inline script in index.html mirrors resolveTheme
 * and resolveMotion to apply them before first paint.
 */

export const THEMES = ["system", "light", "dark"];
export const MOTION = ["system", "reduce", "full"];

export const DEFAULT_PREFS = Object.freeze({ theme: "system", sound: false, motion: "system" });

/** Browser chrome colour per theme; matches --bg in tokens.css. */
export const THEME_COLORS = Object.freeze({ light: "#f6f3ec", dark: "#12110f" });

export function normalizePrefs(raw) {
  const value = raw && typeof raw === "object" ? raw : {};
  return {
    theme: THEMES.includes(value.theme) ? value.theme : DEFAULT_PREFS.theme,
    sound: value.sound === true,
    motion: MOTION.includes(value.motion) ? value.motion : DEFAULT_PREFS.motion,
  };
}

export const resolveTheme = (theme, systemDark) =>
  theme === "system" ? (systemDark ? "dark" : "light") : theme;

export const resolveMotion = (motion, systemReduce) =>
  motion === "system" ? systemReduce : motion === "reduce";
