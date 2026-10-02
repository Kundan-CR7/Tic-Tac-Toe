import { useId } from "react";

/**
 * A native radio group styled as a segmented control, so arrow keys,
 * form semantics and screen reader announcements come for free.
 */
export function Segmented({
  label,
  value,
  options,
  onChange,
  size = "md",
  showLabel = false,
  disabled = false,
  describedBy,
}) {
  const name = useId();
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  return (
    <fieldset
      className={`segmented segmented-${size}`}
      style={{ "--count": options.length, "--index": index }}
      disabled={disabled}
      aria-describedby={describedBy}
    >
      <legend className={showLabel ? "field-label" : "sr-only"}>{label}</legend>
      <div className="segmented-track">
        <span className="segmented-thumb" aria-hidden="true" />
        {options.map((option) => (
          <label className="segmented-option" key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              aria-label={option.ariaLabel}
            />
            <span className="segmented-label">
              {option.icon}
              <span>{option.label}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Switch({ checked, onChange, labelledBy, describedBy }) {
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
    />
  );
}
