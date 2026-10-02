import { memo, useEffect, useState } from "react";
import { deriveGame } from "../game/rules";
import { capitalize, relativeTime } from "../lib/text";
import { HistoryIcon } from "./icons";
import { Mark } from "./Mark";
import "./history.css";

function useNow(interval) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return now;
}

const opponentLabel = ({ mode, difficulty }) =>
  mode === "cpu" ? `vs Computer · ${capitalize(difficulty)}` : "2 players";

const percent = (value, total) => (total ? Math.round((value / total) * 100) : 0);

function MiniBoard({ game }) {
  const winning = new Set(game.lines.flat());
  return (
    <div className="mini-board" aria-hidden="true">
      {game.board.map((mark, cell) => (
        <span className="mini-cell" key={cell} data-win={winning.has(cell) || undefined}>
          {mark && <Mark player={mark} />}
        </span>
      ))}
    </div>
  );
}

const HistoryItem = memo(function HistoryItem({ entry, now }) {
  const game = deriveGame(entry.moves, { starter: entry.starter, rules: entry.rules });
  const title = entry.winner
    ? `${entry.names[entry.winner]} won`
    : entry.drawReason === "repetition"
      ? "Draw by repetition"
      : "Draw";
  const players = entry.mode === "cpu" ? opponentLabel(entry) : `${entry.names.X} vs ${entry.names.O}`;
  const details = [players, `${entry.moves.length} moves`];
  if (entry.rules === "vanishing") details.push("Vanishing");

  return (
    <li className="history-item" data-result={entry.winner ?? "draw"}>
      <MiniBoard game={game} />
      <div className="history-body">
        <div className="history-row">
          <p className="history-title">
            {entry.winner ? <Mark player={entry.winner} className="history-mark" /> : null}
            <span>{title}</span>
          </p>
          <time className="history-time" dateTime={new Date(entry.at).toISOString()}>
            {relativeTime(entry.at, Math.max(now, entry.at))}
          </time>
        </div>
        <p className="history-meta">{details.join(" · ")}</p>
      </div>
    </li>
  );
});

function Summary({ settings, names, scores }) {
  const total = scores.X + scores.O + scores.draw;
  const label = `${opponentLabel(settings)} · ${capitalize(settings.rules)}`;
  const parts = [
    { key: "X", name: names.X, value: scores.X },
    { key: "draw", name: "Draws", value: scores.draw },
    { key: "O", name: names.O, value: scores.O },
  ];
  return (
    <div className="summary">
      <div className="summary-head">
        <span className="summary-label">{label}</span>
        <span className="summary-total">
          {total} {total === 1 ? "game" : "games"}
        </span>
      </div>
      <div
        className="summary-bar"
        role="img"
        aria-label={parts.map((part) => `${part.name}: ${part.value}`).join(", ")}
      >
        {total > 0 &&
          parts.map((part) => (
            <span className="summary-segment" data-kind={part.key} key={part.key} style={{ flexGrow: part.value }} />
          ))}
      </div>
      <ul className="summary-legend" aria-hidden="true">
        {parts.map((part) => (
          <li data-kind={part.key} key={part.key}>
            {part.key === "draw" ? (
              <>
                <span className="summary-dot" />
                <span className="summary-name">Draws</span>
              </>
            ) : (
              <Mark player={part.key} className="summary-mark" />
            )}
            <span className="summary-percent">{percent(part.value, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HistoryPanel({ history, settings, names, scores, titleId, showTitle = true, scrollable = false }) {
  const now = useNow(30_000);
  return (
    <div className="history">
      {showTitle && (
        <h2 className="panel-title" id={titleId}>
          Match history
        </h2>
      )}
      <Summary settings={settings} names={names} scores={scores} />
      {history.length === 0 ? (
        <div className="history-empty">
          <HistoryIcon />
          <p>Finished games will show up here, newest first.</p>
        </div>
      ) : (
        <ol
          className="history-list"
          aria-label="Recent games, newest first"
          tabIndex={scrollable ? 0 : undefined}
          data-scrollable={scrollable || undefined}
        >
          {history.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} now={now} />
          ))}
        </ol>
      )}
    </div>
  );
}
