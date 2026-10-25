import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Timeframe } from "@/core/market/types";

export const TIMEFRAMES: readonly Timeframe[] = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];

interface ChartSettingsState {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
}

/** Chart preferences, remembered across restarts. */
export const useChartSettings = create<ChartSettingsState>()(
  persist(
    (set) => ({
      timeframe: "1H",
      setTimeframe: (timeframe) => set({ timeframe }),
    }),
    { name: "chart-settings" },
  ),
);
