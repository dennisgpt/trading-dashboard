import { create } from "zustand";
import { instrumentKey, type Instrument, type Market } from "@/core/market/types";

/** Where the watchlist is persisted: SQLite in the desktop app, localStorage in a plain browser. */
export interface WatchlistRepository {
  /** Instruments in display order, or null if no watchlist was ever saved. */
  load(): Promise<Instrument[] | null>;
  add(instrument: Instrument, position: number): Promise<void>;
  remove(key: string): Promise<void>;
}

export const DEFAULT_INSTRUMENTS: readonly Instrument[] = [
  { symbol: "BTCUSDT", displaySymbol: "BTC/USDT", name: "Bitcoin", market: "crypto", currency: "USDT", decimals: 2, providerId: "binance" },
  { symbol: "ETHUSDT", displaySymbol: "ETH/USDT", name: "Ethereum", market: "crypto", currency: "USDT", decimals: 2, providerId: "binance" },
  { symbol: "SOLUSDT", displaySymbol: "SOL/USDT", name: "Solana", market: "crypto", currency: "USDT", decimals: 2, providerId: "binance" },
];

export interface WatchlistGroup {
  id: string;
  title: string;
  markets: readonly Market[];
  /** Shown when the group is empty because its data sources need an API key. */
  emptyHint?: string;
}

export const WATCHLIST_GROUPS: readonly WatchlistGroup[] = [
  { id: "crypto", title: "Krypto", markets: ["crypto"] },
  { id: "us", title: "US-Aktien & ETFs", markets: ["us_stock", "etf"], emptyHint: "Kommt mit API-Key" },
  { id: "de", title: "Deutschland", markets: ["de_stock"], emptyHint: "Kommt mit API-Key" },
  { id: "forex", title: "Forex", markets: ["forex"], emptyHint: "Kommt mit API-Key" },
];

interface WatchlistState {
  instruments: Instrument[];
  loaded: boolean;
  error: string | null;
  load: (repository: WatchlistRepository) => Promise<void>;
  add: (instrument: Instrument) => Promise<void>;
  remove: (instrument: Instrument) => Promise<void>;
}

let repo: WatchlistRepository | null = null;
/** Guards against parallel loads (React StrictMode runs effects twice), which would seed the defaults twice. */
let loading: Promise<void> | null = null;

export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
  instruments: [],
  loaded: false,
  error: null,

  load: (repository) => {
    loading ??= (async () => {
      repo = repository;
      try {
        let instruments = await repository.load();
        if (instruments === null) {
          instruments = [...DEFAULT_INSTRUMENTS];
          for (const [i, instrument] of instruments.entries()) await repository.add(instrument, i);
        }
        set({ instruments, loaded: true, error: null });
      } catch (error) {
        set({ instruments: [...DEFAULT_INSTRUMENTS], loaded: true, error: `Watchlist konnte nicht geladen werden: ${String(error)}` });
      } finally {
        loading = null;
      }
    })();
    return loading;
  },

  add: async (instrument) => {
    const key = instrumentKey(instrument);
    if (get().instruments.some((i) => instrumentKey(i) === key)) return;
    const position = get().instruments.length;
    set((s) => ({ instruments: [...s.instruments, instrument] }));
    await repo?.add(instrument, position).catch((error: unknown) => set({ error: `Speichern fehlgeschlagen: ${String(error)}` }));
  },

  remove: async (instrument) => {
    const key = instrumentKey(instrument);
    set((s) => ({ instruments: s.instruments.filter((i) => instrumentKey(i) !== key) }));
    await repo?.remove(key).catch((error: unknown) => set({ error: `Speichern fehlgeschlagen: ${String(error)}` }));
  },
}));

/** Repository for the plain browser (`npm run dev` without Tauri). */
export function localStorageWatchlistRepository(storageKey = "watchlist"): WatchlistRepository {
  const read = (): Instrument[] | null => {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Instrument[]) : null;
  };
  const write = (instruments: Instrument[]) => localStorage.setItem(storageKey, JSON.stringify(instruments));
  return {
    load: async () => read(),
    add: async (instrument, position) => {
      const list = read() ?? [];
      list.splice(position, 0, instrument);
      write(list);
    },
    remove: async (key) => write((read() ?? []).filter((i) => instrumentKey(i) !== key)),
  };
}
