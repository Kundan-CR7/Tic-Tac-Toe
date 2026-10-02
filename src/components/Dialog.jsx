import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon } from "./icons";
import "./dialog.css";

const CLOSE_MS = 180;

/**
 * Modal built on the native <dialog>, which provides the focus trap, Escape
 * handling and inert background. Children only render while it is open.
 */
export function Dialog({ open, onRequestClose, title, reducedMotion, className = "", children }) {
  const ref = useRef(null);
  const titleId = useId();
  const restoreFocus = useRef(null);
  const pressedBackdrop = useRef(false);
  const [rendered, setRendered] = useState(open);

  if (open && !rendered) setRendered(true);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      delete dialog.dataset.closing;
      if (!dialog.open) {
        restoreFocus.current = document.activeElement;
        dialog.showModal();
      }
      return;
    }
    if (!dialog.open) return;
    const finish = () => {
      delete dialog.dataset.closing;
      dialog.close();
      setRendered(false);
      if (restoreFocus.current?.isConnected) restoreFocus.current.focus();
    };
    if (reducedMotion) {
      finish();
      return;
    }
    dialog.dataset.closing = "";
    const timer = setTimeout(finish, CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open, reducedMotion]);

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`.trim()}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onClose={() => {
        if (open) onRequestClose();
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) onRequestClose();
      }}
    >
      {rendered && (
        <div className="dialog-panel">
          <header className="dialog-header">
            <h2 id={titleId} className="dialog-title">
              {title}
            </h2>
            <button type="button" className="icon-btn dialog-close" aria-label="Close" onClick={onRequestClose}>
              <CloseIcon />
            </button>
          </header>
          <div className="dialog-body">{children}</div>
        </div>
      )}
    </dialog>
  );
}
