import { beforeEach, describe, expect, it } from "vitest";
import type { Instrument } from "@/core/market/types";
import { DEFAULT_INSTRUMENTS, useWatchlistStore, type WatchlistRepository } from "./watchlist";

function memoryRepository(initial: Instrument[] | null): WatchlistRepository & { items: Instrument[] | null } {
  const repo = {
    items: initial,
    load: async () => repo.items,
    add: async (instrument: Instrument, position: number) => {
      repo.items = [...(repo.items ?? [])];
      repo.items.splice(position, 0, instrument);
    },
    remove: async (key: string) => {
      repo.items = (repo.items ?? []).filter((i) => `${i.providerId ?? i.market}:${i.symbol}` !== key);
    },
  };
  return repo;
}

const doge: Instrument = { symbol: "DOGEUSDT", displaySymbol: "DOGE/USDT", name: "Dogecoin", market: "crypto", currency: "USDT", decimals: 5, providerId: "binance" };

describe("useWatchlistStore", () => {
  beforeEach(() => useWatchlistStore.setState({ instruments: [], loaded: false, error: null }));

  it("seeds BTC, ETH and SOL on first start and saves them", async () => {
    const repo = memoryRepository(null);
    await useWatchlistStore.getState().load(repo);
    expect(useWatchlistStore.getState().instruments.map((i) => i.displaySymbol)).toEqual(["BTC/USDT", "ETH/USDT", "SOL/USDT"]);
    expect(repo.items).toEqual(DEFAULT_INSTRUMENTS);
  });

  it("seeds only once when loaded twice in parallel", async () => {
    const repo = memoryRepository(null);
    await Promise.all([useWatchlistStore.getState().load(repo), useWatchlistStore.getState().load(repo)]);
    expect(repo.items).toHaveLength(3);
  });

  it("keeps a saved (even empty) watchlist", async () => {
    await useWatchlistStore.getState().load(memoryRepository([]));
    expect(useWatchlistStore.getState().instruments).toEqual([]);
  });

  it("adds without duplicates and removes, persisting both", async () => {
    const repo = memoryRepository([...DEFAULT_INSTRUMENTS]);
    const store = useWatchlistStore.getState();
    await store.load(repo);
    await store.add(doge);
    await store.add(doge);
    expect(repo.items?.map((i) => i.symbol)).toEqual(["BTCUSDT", "ETHUSDT", "SOLUSDT", "DOGEUSDT"]);

    await useWatchlistStore.getState().remove(DEFAULT_INSTRUMENTS[1]);
    expect(useWatchlistStore.getState().instruments.map((i) => i.symbol)).toEqual(["BTCUSDT", "SOLUSDT", "DOGEUSDT"]);
    expect(repo.items?.map((i) => i.symbol)).toEqual(["BTCUSDT", "SOLUSDT", "DOGEUSDT"]);
  });

  it("falls back to the defaults when loading fails", async () => {
    const broken: WatchlistRepository = { load: async () => Promise.reject(new Error("db locked")), add: async () => {}, remove: async () => {} };
    await useWatchlistStore.getState().load(broken);
    expect(useWatchlistStore.getState().instruments).toHaveLength(3);
    expect(useWatchlistStore.getState().error).toMatch(/db locked/);
  });
});
