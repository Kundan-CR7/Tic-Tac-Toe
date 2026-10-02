import { useId } from "react";
import { Collapse } from "./Collapse";
import { Segmented } from "./Segmented";
import { DIFFICULTY_OPTIONS, MODE_OPTIONS, RULE_OPTIONS, difficultyHint, starterOptions } from "./options";
import "./settings.css";

function RulesPicker({ value, onChange }) {
  const name = useId();
  return (
    <fieldset className="field">
      <legend className="field-label">Rules</legend>
      <div className="choice-list">
        {RULE_OPTIONS.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="choice-body">
              <span className="choice-title">{option.title}</span>
              <span className="choice-text">{option.text}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DifficultyField({ settings, onChange, size = "md" }) {
  const hintId = useId();
  return (
    <div className="field">
      <Segmented
        label="Difficulty"
        showLabel={size === "md"}
        size={size}
        value={settings.difficulty}
        options={DIFFICULTY_OPTIONS}
        describedBy={hintId}
        onChange={(difficulty) => onChange({ difficulty })}
      />
      <p className={size === "md" ? "field-hint" : "sr-only"} id={hintId}>
        {difficultyHint(settings)}
      </p>
    </div>
  );
}

export function GameSettings({ settings, onChange }) {
  const cpu = settings.mode === "cpu";
  return (
    <div className="field-stack">
      <Segmented
        label="Mode"
        showLabel
        value={settings.mode}
        options={MODE_OPTIONS}
        onChange={(mode) => onChange({ mode })}
      />
      <Collapse open={cpu}>
        <DifficultyField settings={settings} onChange={onChange} />
      </Collapse>
      <Segmented
        label="First move"
        showLabel
        value={settings.starter}
        options={starterOptions(cpu)}
        onChange={(starter) => onChange({ starter })}
      />
      <RulesPicker value={settings.rules} onChange={(rules) => onChange({ rules })} />
    </div>
  );
}
