function SunIcon() {
  return (
    <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M8 20h8M12 16v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const THEME_OPTIONS = [
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "system", label: "System", Icon: SystemIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
];

function ThemeToggle({ themeMode, setThemeMode }) {
  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {THEME_OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={themeMode === id ? "is-active" : ""}
          onClick={() => setThemeMode(id)}
          aria-label={label}
          aria-pressed={themeMode === id}
          data-tooltip={label}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;
