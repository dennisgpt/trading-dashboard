import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getWindowEffect } from "@/lib/native/window";
import { trackConnectionStatus } from "@/stores/connection";
import { AppShell } from "./app-shell";
import { marketRegistry } from "./market";
import { useTheme } from "./use-theme";

/** One-off requests (candles, search); live streams go through the stores. */
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, refetchOnWindowFocus: false } },
});

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

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
