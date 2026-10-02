import { useEffect, useId, useState } from "react";
import { NAME_MAX_LENGTH, defaultName } from "../state/store";
import { Dialog } from "./Dialog";
import { GameSettings } from "./GameSettings";
import { Mark } from "./Mark";
import { Segmented, Switch } from "./Segmented";
import { MOTION_OPTIONS, THEME_OPTIONS } from "./options";
import "./settings.css";

function ConfirmButton({ children, confirmLabel, disabled, onConfirm }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <button
      type="button"
      className="btn btn-danger"
      data-confirming={confirming || undefined}
      disabled={disabled}
      onBlur={() => setConfirming(false)}
      onClick={() => {
        if (confirming) {
          setConfirming(false);
          onConfirm();
        } else {
          setConfirming(true);
        }
      }}
    >
      {confirming ? confirmLabel : children}
    </button>
  );
}

function Section({ title, note, children }) {
  const id = useId();
  return (
    <section className="settings-section" aria-labelledby={id}>
      <div className="section-head">
        <h3 className="section-title" id={id}>
          {title}
        </h3>
        {note && <p className="section-note">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function NameField({ settings, player, onRename }) {
  const id = useId();
  const computer = settings.mode === "cpu" && player === "O";
  return (
    <div className="name-field">
      <label className="field-label" htmlFor={id}>
        <Mark player={player} className="option-mark" />
        Player {player}
      </label>
      <input
        id={id}
        className="text-input"
        value={computer ? "" : settings.names[player]}
        placeholder={defaultName(settings, player)}
        maxLength={NAME_MAX_LENGTH}
        autoComplete="off"
        spellCheck={false}
        disabled={computer}
        onChange={(event) => onRename(player, event.target.value)}
      />
    </div>
  );
}

export function SettingsDialog({
  open,
  onRequestClose,
  reducedMotion,
  settings,
  prefs,
  hasScores,
  hasHistory,
  onChangeSettings,
  onRename,
  onChangePrefs,
  onResetScores,
  onClearHistory,
}) {
  const soundLabel = useId();
  const soundHint = useId();
  return (
    <Dialog
      open={open}
      onRequestClose={onRequestClose}
      title="Settings"
      reducedMotion={reducedMotion}
      className="settings-dialog"
    >
      <Section title="Game" note="Changing these starts a new round.">
        <GameSettings settings={settings} onChange={onChangeSettings} />
      </Section>

      <Section title="Players">
        <div className="name-fields">
          <NameField settings={settings} player="X" onRename={onRename} />
          <NameField settings={settings} player="O" onRename={onRename} />
        </div>
      </Section>

      <Section title="Look and sound">
        <div className="field-stack">
          <Segmented
            label="Theme"
            showLabel
            value={prefs.theme}
            options={THEME_OPTIONS}
            onChange={(theme) => onChangePrefs({ theme })}
          />
          <Segmented
            label="Animations"
            showLabel
            value={prefs.motion}
            options={MOTION_OPTIONS}
            onChange={(motion) => onChangePrefs({ motion })}
          />
          <div className="switch-row">
            <div className="switch-text">
              <span className="switch-label" id={soundLabel}>
                Sound effects
              </span>
              <span className="field-hint" id={soundHint}>
                Soft tones for moves, wins and draws.
              </span>
            </div>
            <Switch
              checked={prefs.sound}
              labelledBy={soundLabel}
              describedBy={soundHint}
              onChange={(sound) => onChangePrefs({ sound })}
            />
          </div>
        </div>
      </Section>

      <Section title="Data" note="Scores and history are saved on this device only.">
        <div className="data-actions">
          <ConfirmButton confirmLabel="Confirm reset" disabled={!hasScores} onConfirm={onResetScores}>
            Reset all scores
          </ConfirmButton>
          <ConfirmButton confirmLabel="Confirm clear" disabled={!hasHistory} onConfirm={onClearHistory}>
            Clear history
          </ConfirmButton>
        </div>
      </Section>
    </Dialog>
  );
}
