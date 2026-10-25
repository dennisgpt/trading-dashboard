import { useEffect } from "react";
import { getWindowEffect } from "@/lib/native/window";
import { trackConnectionStatus } from "@/stores/connection";
import { AppShell } from "./app-shell";
import { marketRegistry } from "./market";
import { useTheme } from "./use-theme";

export function App() {
  // Keeps <html> and the native window in sync with the stored theme and the OS setting.
  useTheme();

  useEffect(() => {
    // With a native glass effect the page background turns transparent (see globals.css).
    void getWindowEffect().then((effect) => {
      if (effect !== "none") document.documentElement.dataset.glass = effect;
    });
  }, []);

  useEffect(() => trackConnectionStatus(marketRegistry), []);

  return <AppShell />;
}
