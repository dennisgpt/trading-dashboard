import { useEffect, useSyncExternalStore } from "react";
import { setWindowTheme } from "@/lib/native/window";
import { applyTheme, resolveTheme, useThemeStore, type Theme, type ThemePreference } from "@/stores/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeToSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/** Current theme, kept in sync with the stored preference and the OS setting. */
export function useTheme(): {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
} {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const prefersDark = useSyncExternalStore(subscribeToSystemTheme, systemPrefersDark);
  const theme = resolveTheme(preference, prefersDark);

  useEffect(() => applyTheme(theme), [theme]);
  // With "system" the native theme must follow the OS, otherwise it would pin prefers-color-scheme.
  useEffect(() => void setWindowTheme(preference === "system" ? null : theme), [preference, theme]);

  return { theme, preference, setPreference, toggle: () => setPreference(theme === "dark" ? "light" : "dark") };
}

/** Applies the stored theme before the first render to avoid a flash of the wrong theme. */
export function applyInitialTheme(): void {
  applyTheme(resolveTheme(useThemeStore.getState().preference, systemPrefersDark()));
}
