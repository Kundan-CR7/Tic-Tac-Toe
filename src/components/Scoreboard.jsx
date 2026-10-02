import { useEffect, useRef, useState } from "react";
import { NAME_MAX_LENGTH, defaultName } from "../state/store";
import { capitalize } from "../lib/text";
import { FlameIcon, PencilIcon } from "./icons";
import { Mark } from "./Mark";
import "./scoreboard.css";

function EditableName({ player, name, value, placeholder, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const finished = useRef(false);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      buttonRef.current?.focus();
    }
  }, [editing]);

  const start = () => {
    finished.current = false;
    setDraft(value);
    setEditing(true);
  };

  const finish = (save, fromKeyboard) => {
    if (finished.current) return;
    finished.current = true;
    if (save) onRename(draft.trim());
    returnFocus.current = fromKeyboard;
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="name-input"
        value={draft}
        maxLength={NAME_MAX_LENGTH}
        placeholder={placeholder}
        aria-label={`Name for player ${player}`}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => finish(true, false)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            finish(true, true);
          } else if (event.key === "Escape") {
            event.preventDefault();
            finish(false, true);
          }
        }}
      />
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className="name-button"
      aria-label={`Rename ${name}, player ${player}`}
      onClick={start}
    >
      <span className="name-text">{name}</span>
      <PencilIcon className="name-edit" />
    </button>
  );
}

function PlayerScore({
  player,
  name,
  rawName,
  placeholder,
  editable,
  score,
  caption,
  active,
  thinking,
  winner,
  streak,
  onRename,
}) {
  return (
    <div
      className="score-card"
      data-player={player}
      data-active={active || undefined}
      data-winner={winner || undefined}
      data-thinking={thinking || undefined}
    >
      <div className="score-head">
        <Mark player={player} className="score-mark" />
        {editable ? (
          <EditableName
            player={player}
            name={name}
            value={rawName}
            placeholder={placeholder}
            onRename={(next) => onRename(player, next)}
          />
        ) : (
          <span className="name-static">{name}</span>
        )}
      </div>
      <div className="score-value">
        <span className="score-count" key={score}>
          {score}
        </span>
        <span className="sr-only">{score === 1 ? "win" : "wins"}</span>
        {streak >= 2 && (
          <span className="streak" title={`${streak} wins in a row`}>
            <FlameIcon />
            <span aria-hidden="true">{streak}</span>
            <span className="sr-only">, {streak} wins in a row</span>
          </span>
        )}
      </div>
      <p className="score-caption">
        {thinking ? (
          <>
            Thinking<span className="dots" aria-hidden="true"><i /><i /><i /></span>
          </>
        ) : (
          caption
        )}
      </p>
      <span className="score-bar" aria-hidden="true" />
    </div>
  );
}

export function Scoreboard({ settings, names, scores, game, thinking, streak, onRename }) {
  const playing = game.status === "playing";
  const cpu = settings.mode === "cpu";
  const caption = (player) => {
    if (game.winner === player) return "Winner";
    if (playing && game.turn === player) return cpu && player === "X" ? "Your move" : "To move";
    if (cpu && player === "O") return capitalize(settings.difficulty);
    return "\u00a0";
  };

  const player = (mark) => (
    <PlayerScore
      player={mark}
      name={names[mark]}
      rawName={settings.names[mark]}
      placeholder={defaultName(settings, mark)}
      editable={!(cpu && mark === "O")}
      score={scores[mark]}
      caption={caption(mark)}
      active={playing && game.turn === mark}
      thinking={thinking && mark === "O"}
      winner={game.winner === mark}
      streak={streak.player === mark ? streak.length : 0}
      onRename={onRename}
    />
  );

  return (
    <section className="scoreboard" aria-label="Scoreboard">
      {player("X")}
      <div className="score-card score-draws" data-active={game.status === "draw" || undefined}>
        <span className="score-label">Draws</span>
        <div className="score-value">
          <span className="score-count" key={scores.draw}>
            {scores.draw}
          </span>
        </div>
        <p className="score-caption" aria-hidden="true">
          {"\u00a0"}
        </p>
      </div>
      {player("O")}
    </section>
  );
}
