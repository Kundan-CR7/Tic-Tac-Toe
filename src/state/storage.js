export const STORAGE_KEYS = Object.freeze({
  game: "ttt:game:v1",
  prefs: "ttt:prefs:v1",
});

export function readJSON(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or blocked (e.g. some private modes); the game works without it.
  }
}
