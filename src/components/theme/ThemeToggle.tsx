import { useTheme } from "../../hooks/useTheme";

/** Sun/moon pill toggle in the topbar. All theme logic lives in useTheme(). */
export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      type="button"
    >
      <span className="tt-icon tt-sun">☀️</span>
      <span className="tt-icon tt-moon">🌙</span>
      <span className="tt-thumb"></span>
      <span className="tt-ripple"></span>
    </button>
  );
}
