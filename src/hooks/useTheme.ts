import { useThemeContext } from "../context/ThemeContext";

/**
 * Preferred way for components to read/toggle theme.
 * Kept as a hook (rather than importing useThemeContext directly)
 * so call sites read `useTheme()` per the architecture spec, and so
 * the context implementation can change without touching components.
 */
export function useTheme() {
  return useThemeContext();
}
