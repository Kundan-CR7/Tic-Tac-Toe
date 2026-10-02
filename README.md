# Tic Tac Toe

A carefully crafted Tic Tac Toe for the browser. Play a friend on one device or take on the computer at three levels, in light or dark, with a keyboard, a mouse or a thumb.

Live at [tic-tac-toe-creative.vercel.app](https://tic-tac-toe-creative.vercel.app).

## Features

- **Two modes.** Two players on one device, or against the computer: Easy plays randomly, Medium takes wins and blocks most threats, and Hard plays perfect minimax, so it never loses a classic game. The computer pauses briefly to "think" before each move.
- **Two rule sets.** Classic, and Vanishing, where each player keeps only their three newest marks. The oldest mark fades before it disappears.
- **Scoreboard and history.** Wins and draws are kept per opponent and rule set, together with win streaks and the last 50 games. Everything is saved in `localStorage`.
- **Game controls.** Undo (Ctrl/⌘ + Z), restart, editable player names, and a choice of who moves first: X, O, or alternating.
- **Design.** A token-based design system with light and dark themes. The theme follows the system until you pick one, and switching animates as a circular reveal. X and O are drawn as animated SVG strokes.
- **Motion.** Previews of the next mark on hover, press feedback, a drawn strike-through on the winning line, confetti on a win, a draw animation and a staggered board reset. It all respects `prefers-reduced-motion`, and animations can also be reduced in Settings.
- **Sound.** Optional synthesized sound effects (Web Audio, no audio files). Off by default, and the choice is remembered.
- **Accessibility.** A full keyboard flow (arrow keys, Home/End, Enter/Space) on an ARIA grid with a single tab stop. Moves and results are announced in a live region, the skip link jumps to the board, focus moves sensibly when a game ends and dialogs trap focus. Colours meet WCAG AA contrast in both themes.
- **Responsive.** Designed for phones (touch targets, safe areas, landscape), tablets and wide desktops, where setup and history sit beside the board.
- **Installable.** A web app manifest with maskable icons.

## Getting started

```bash
npm install
npm run dev
```

| Script             | What it does                                                  |
| ------------------ | ------------------------------------------------------------- |
| `npm run dev`      | Start the Vite dev server                                     |
| `npm run build`    | Build for production into `dist/`                             |
| `npm run preview`  | Serve the production build                                    |
| `npm run lint`     | Run ESLint                                                    |
| `npm test`         | Run the unit tests (Vitest)                                   |
| `npm run test:e2e` | Build, serve and run the end-to-end tests (Playwright)        |

The end-to-end tests need a Playwright browser the first time: `npx playwright install chromium`.

## How it is built

React 19 and Vite, with plain CSS on design tokens and no runtime dependencies beyond React.

```
src/
  game/        Pure rules engine and computer opponent, with unit tests
  state/       Reducer for rounds, scores and history; storage and preferences
  hooks/       Store, preferences, computer opponent, sound, announcements
  components/  UI components, each with its own stylesheet
  effects/     Canvas confetti
  audio/       Web Audio sound effects
  styles/      Tokens, base styles and layout
e2e/           Playwright tests
```

- `game/rules.js` replays a move list into the full game state: board, turn, winner, winning lines and draw reason. Because it never mutates anything, undo, persistence and history all come from the same move list.
- `game/ai.js` holds the three difficulty levels. Hard uses memoized negamax for Classic, and a depth-limited alpha-beta search for Vanishing, where games can loop.
- Themes are sets of custom properties on `[data-theme]`. An inline script in `index.html` applies the saved theme before first paint, so there is no flash.

## Tests

- **Unit tests** cover the engine (wins including double lines, draws, illegal moves, the vanishing rule and repetition), the computer (in Classic, Hard is played against every possible sequence of human moves, whoever starts, and never loses) and the store (scores, history, undo, persistence).
- **End-to-end tests** play full games in both modes. They also cover keyboard-only play, focus management, theme and motion preferences, persistence across reloads, and layout from a 360px phone to a desktop. They run in desktop Chrome and a Pixel 7 profile, and any console error fails a test.

## Deployment

The app is a static site. Vercel detects Vite automatically, and `vercel.json` adds long-lived caching for Vite's fingerprinted assets.
