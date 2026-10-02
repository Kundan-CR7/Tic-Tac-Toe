import { BotIcon, MonitorIcon, MoonIcon, SunIcon, UsersIcon } from "./icons";
import { Mark } from "./Mark";

export const MODE_OPTIONS = [
  { value: "local", label: "2 Players", icon: <UsersIcon /> },
  { value: "cpu", label: "vs Computer", icon: <BotIcon /> },
];

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const starterOptions = (cpu) =>
  cpu
    ? [
        { value: "X", label: "You" },
        { value: "O", label: "Computer" },
        { value: "alternate", label: "Alternate" },
      ]
    : [
        { value: "X", label: "X", ariaLabel: "Player X", icon: <Mark player="X" className="option-mark" /> },
        { value: "O", label: "O", ariaLabel: "Player O", icon: <Mark player="O" className="option-mark" /> },
        { value: "alternate", label: "Alternate" },
      ];

export const RULE_OPTIONS = [
  {
    value: "classic",
    title: "Classic",
    text: "Three in a row wins. A full board is a draw.",
  },
  {
    value: "vanishing",
    title: "Vanishing",
    text: "Only your three newest marks stay. Placing a fourth removes your oldest.",
  },
];

export const THEME_OPTIONS = [
  { value: "system", label: "System", icon: <MonitorIcon /> },
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
];

export const MOTION_OPTIONS = [
  { value: "system", label: "System" },
  { value: "reduce", label: "Reduced" },
  { value: "full", label: "Full" },
];

export function difficultyHint({ difficulty, rules }) {
  if (difficulty === "easy") return "Plays anywhere. Great for warming up.";
  if (difficulty === "medium") return "Takes wins and blocks most threats, but can be tricked.";
  return rules === "vanishing"
    ? "Searches ten moves ahead. Very hard to beat."
    : "Perfect play. It never loses, so a draw is a good result.";
}
