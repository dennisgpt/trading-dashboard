import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "dark" | "light" | "system";
export type Theme = "dark" | "light";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

/** Theme choice of the user, persisted in localStorage (no secrets, see CLAUDE.md). Dark is the default. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "dark",
      setPreference: (preference) => set({ preference }),
    }),
    { name: "theme" },
  ),
);

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

/** Sets the light theme markers on <html>; dark needs none because it is the default. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.classList.toggle("light", theme === "light");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}
