import { RestartIcon, UndoIcon } from "./icons";

export function Controls({ canUndo, finished, restartRef, onUndo, onRestart }) {
  return (
    <div className="controls">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={!canUndo}
        aria-keyshortcuts="Control+Z Meta+Z"
        onClick={onUndo}
      >
        <UndoIcon />
        Undo
      </button>
      <button
        ref={restartRef}
        type="button"
        className={`btn ${finished ? "btn-primary btn-attention" : "btn-secondary"}`}
        onClick={onRestart}
      >
        <RestartIcon />
        {finished ? "Play again" : "Restart"}
      </button>
    </div>
  );
}
