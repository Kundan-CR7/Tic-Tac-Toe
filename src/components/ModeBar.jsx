import { Collapse } from "./Collapse";
import { DifficultyField } from "./GameSettings";
import { Segmented } from "./Segmented";
import { MODE_OPTIONS } from "./options";

export function ModeBar({ settings, onChange }) {
  return (
    <div className="mode-bar">
      <Segmented
        label="Game mode"
        value={settings.mode}
        options={MODE_OPTIONS}
        onChange={(mode) => onChange({ mode })}
      />
      <Collapse open={settings.mode === "cpu"}>
        <DifficultyField settings={settings} onChange={onChange} size="sm" />
      </Collapse>
    </div>
  );
}
