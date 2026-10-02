import "./mark.css";

/**
 * The X and O marks. Each stroke is a path with pathLength="1", so CSS can
 * draw it by animating stroke-dashoffset from 1 to 0 regardless of size.
 * Variants: "placed" draws itself in, "ghost" is the hover preview, "exit"
 * animates out (vanishing rule) and "static" is for icons and thumbnails.
 */
export function Mark({ player, variant = "static", className = "", style }) {
  const classes = `mark mark-${player.toLowerCase()} mark-${variant} ${className}`.trim();
  return (
    <svg className={classes} viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={style}>
      {player === "X" ? (
        <>
          <path className="mark-stroke" d="M29 29 71 71" pathLength="1" />
          <path className="mark-stroke" d="M71 29 29 71" pathLength="1" />
        </>
      ) : (
        <path
          className="mark-stroke"
          d="M50 26a24 24 0 1 1 0 48a24 24 0 1 1 0-48"
          pathLength="1"
        />
      )}
    </svg>
  );
}
