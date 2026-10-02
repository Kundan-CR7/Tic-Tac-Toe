// Board gap as a percentage of the board width; must match --board-gap.
const GAP = 4;
const CELL = (100 - 2 * GAP) / 3;
const OVERSHOOT = CELL * 0.34;

const center = (cell) => [
  CELL / 2 + (cell % 3) * (CELL + GAP),
  CELL / 2 + Math.floor(cell / 3) * (CELL + GAP),
];

function strikePath([first, , last]) {
  const [x1, y1] = center(first);
  const [x2, y2] = center(last);
  const length = Math.hypot(x2 - x1, y2 - y1);
  const ux = ((x2 - x1) / length) * OVERSHOOT;
  const uy = ((y2 - y1) / length) * OVERSHOOT;
  const point = (x, y) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  return `M${point(x1 - ux, y1 - uy)}L${point(x2 + ux, y2 + uy)}`;
}

export function WinLines({ lines, winner }) {
  if (!lines.length) return null;
  return (
    <svg
      className="win-lines"
      data-winner={winner}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {lines.map((line, index) => {
        const d = strikePath(line);
        return (
          <g key={line.join("-")} style={{ "--line-delay": `${index * 180}ms` }}>
            <path className="win-line-halo" d={d} pathLength="1" />
            <path className="win-line" d={d} pathLength="1" />
          </g>
        );
      })}
    </svg>
  );
}
