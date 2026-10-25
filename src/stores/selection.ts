import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Instrument } from "@/core/market/types";

interface SelectionState {
  /** Instrument shown in the chart and order panel. */
  selected: Instrument | null;
  select: (instrument: Instrument) => void;
}

/** Shared selection between watchlist, chart and order panel; remembered across restarts. */
export const useSelectionStore = create<SelectionState>()(
  persist(
    (set) => ({
      selected: null,
      select: (instrument) => set({ selected: instrument }),
    }),
    { name: "selection" },
  ),
);
