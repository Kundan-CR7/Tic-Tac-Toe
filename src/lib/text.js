/** "You" takes the plural verb: "You win", but "Ada wins". */
export const subjectVerb = (name, plural, singular) =>
  `${name} ${name === "You" ? plural : singular}`;

export const possessive = (name) => {
  if (name === "You") return "Your";
  return name.endsWith("s") ? `${name}’` : `${name}’s`;
};

export const capitalize = (text) => (text ? text[0].toUpperCase() + text.slice(1) : text);

const relative =
  typeof Intl !== "undefined" && Intl.RelativeTimeFormat
    ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    : null;

export function relativeTime(at, now = Date.now()) {
  const seconds = Math.round((at - now) / 1000);
  const elapsed = Math.abs(seconds);
  if (elapsed < 45 || !relative) return "just now";
  if (elapsed < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (elapsed < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  if (elapsed < 7 * 86400) return relative.format(Math.round(seconds / 86400), "day");
  return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
