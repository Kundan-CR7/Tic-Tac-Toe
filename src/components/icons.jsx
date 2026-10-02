function Icon({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SunIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Icon>
);

export const MoonIcon = (props) => (
  <Icon {...props}>
    <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
  </Icon>
);

export const MonitorIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="12.5" rx="2.5" />
    <path d="M8.5 20.5h7M12 16.5v4" />
  </Icon>
);

export const SoundOnIcon = (props) => (
  <Icon {...props}>
    <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" />
    <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.3 6.3a8 8 0 0 1 0 11.4" />
  </Icon>
);

export const SoundOffIcon = (props) => (
  <Icon {...props}>
    <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </Icon>
);

export const SlidersIcon = (props) => (
  <Icon {...props}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2.2" />
    <circle cx="9" cy="17" r="2.2" />
  </Icon>
);

export const HistoryIcon = (props) => (
  <Icon {...props}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
    <path d="M3.5 4v4.5H8M12 7.5V12l3 2" />
  </Icon>
);

export const UndoIcon = (props) => (
  <Icon {...props}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icon>
);

export const RestartIcon = (props) => (
  <Icon {...props}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v4.5h-4.5" />
  </Icon>
);

export const UsersIcon = (props) => (
  <Icon {...props}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18.5 14.2a6.5 6.5 0 0 1 3 5.8" />
  </Icon>
);

export const BotIcon = (props) => (
  <Icon {...props}>
    <rect x="4" y="8" width="16" height="12" rx="4" />
    <path d="M12 8V4.5M9.5 4.5h5" />
    <path d="M9 13.5v1M15 13.5v1M1.5 13v2.5M22.5 13v2.5" />
  </Icon>
);

export const TrophyIcon = (props) => (
  <Icon {...props}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 6H4.5a3 3 0 0 0 3.6 4.4M16 6h3.5a3 3 0 0 1-3.6 4.4M12 13v3.5M8.5 20h7M10 16.5h4l.5 3.5h-5l.5-3.5Z" />
  </Icon>
);

export const PencilIcon = (props) => (
  <Icon {...props}>
    <path d="M15.5 4.5 19.5 8.5 9 19H5v-4L15.5 4.5Z" />
    <path d="m13.5 6.5 4 4" />
  </Icon>
);

export const CloseIcon = (props) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const FlameIcon = (props) => (
  <Icon {...props}>
    <path d="M12 21a6 6 0 0 0 6-6c0-3.5-2.5-5.5-3.5-8.5-1.5 2-2 3.5-2 5-1.5-1-2.5-3-2.5-5C7 8.5 6 11.5 6 15a6 6 0 0 0 6 6Z" />
  </Icon>
);

export const HandshakeIcon = (props) => (
  <Icon {...props}>
    <path d="M7.5 7.5 3 12M16.5 7.5 21 12" />
    <path d="m7.5 7.5 3-1.5 4.5 3.5c.8.6.8 1.8 0 2.4-.6.5-1.5.5-2.1 0L11 10.5" />
    <path d="m5 10 5.5 6c.7.8 1.9.8 2.6.1l3.9-3.6c.6-.6.7-1.6.1-2.3L16.5 7.5l-2.5-1" />
  </Icon>
);
