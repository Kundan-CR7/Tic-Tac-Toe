import {
  HistoryIcon,
  MoonIcon,
  SlidersIcon,
  SoundOffIcon,
  SoundOnIcon,
  SunIcon,
} from "./icons";

export function Logo({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="18" fill="var(--logo-bg)" />
      <path
        d="M16 16 30 30M30 16 16 30"
        fill="none"
        stroke="var(--logo-x)"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <circle cx="41.5" cy="41.5" r="8" fill="none" stroke="var(--logo-o)" strokeWidth="6.5" />
    </svg>
  );
}

export function Header({ theme, sound, showHistory, onToggleTheme, onToggleSound, onOpenHistory, onOpenSettings }) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  return (
    <header className="topbar">
      <h1 className="brand">
        <Logo className="brand-logo" />
        <span className="brand-name">Tic Tac Toe</span>
      </h1>
      <div className="toolbar">
        {showHistory && (
          <button
            type="button"
            className="icon-btn"
            aria-label="Match history"
            aria-haspopup="dialog"
            data-tooltip="History"
            onClick={onOpenHistory}
          >
            <HistoryIcon />
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          aria-label="Sound effects"
          aria-pressed={sound}
          data-tooltip={sound ? "Sound on" : "Sound off"}
          onClick={onToggleSound}
        >
          {sound ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Switch to ${nextTheme} theme`}
          data-tooltip={`${nextTheme === "dark" ? "Dark" : "Light"} theme`}
          onClick={onToggleTheme}
        >
          <span className="icon-swap" key={theme}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </span>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Settings"
          aria-haspopup="dialog"
          data-tooltip="Settings"
          data-tooltip-align="end"
          onClick={onOpenSettings}
        >
          <SlidersIcon />
        </button>
      </div>
    </header>
  );
}
