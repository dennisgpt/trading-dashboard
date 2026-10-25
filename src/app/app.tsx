import { AppShell } from "./app-shell";
import { useTheme } from "./use-theme";

export function App() {
  // Keeps <html> in sync with the stored theme and the OS setting.
  useTheme();
  return <AppShell />;
}
