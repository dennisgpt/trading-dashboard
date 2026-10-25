import type { MarketDataProvider, QuoteListener, Unsubscribe } from "./provider";
import type { Instrument, Market } from "./types";

export class NoProviderError extends Error {
  constructor(instrument: Instrument) {
    super(`No market data provider for ${instrument.symbol} (${instrument.market})`);
    this.name = "NoProviderError";
  }
}

/**
 * Holds all registered providers and picks the right one per instrument:
 * 1. the provider named in `instrument.providerId`, if registered,
 * 2. otherwise the first registered provider for the market, live before delayed.
 */
export class ProviderRegistry {
  private readonly providers = new Map<string, MarketDataProvider>();

  register(provider: MarketDataProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider "${provider.id}" is already registered`);
    }
    this.providers.set(provider.id, provider);
  }

  get(id: string): MarketDataProvider | undefined {
    return this.providers.get(id);
  }

  list(): MarketDataProvider[] {
    return [...this.providers.values()];
  }

  /** Providers that serve the market, live ones first, otherwise in registration order. */
  forMarket(market: Market): MarketDataProvider[] {
    const matching = this.list().filter((p) => p.markets.includes(market));
    return [...matching.filter((p) => p.dataMode === "live"), ...matching.filter((p) => p.dataMode !== "live")];
  }

  /** @throws NoProviderError when no registered provider serves the instrument. */
  providerFor(instrument: Instrument): MarketDataProvider {
    if (instrument.providerId) {
      const preferred = this.providers.get(instrument.providerId);
      if (preferred?.markets.includes(instrument.market)) return preferred;
    }
    const [first] = this.forMarket(instrument.market);
    if (!first) throw new NoProviderError(instrument);
    return first;
  }

  /**
   * Searches all providers in parallel and concatenates the results in registration order.
   * Fails only if every provider fails, so one unreachable source does not break the search.
   */
  async searchInstruments(query: string, signal?: AbortSignal): Promise<Instrument[]> {
    const results = await Promise.allSettled(this.list().map((p) => p.searchInstruments(query, signal)));
    const found = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (found.length === 0 && failure && results.every((r) => r.status === "rejected")) throw failure.reason;
    return found;
  }

  /**
   * Subscribes to quotes for instruments from several sources at once,
   * one subscription per provider. The returned function stops all of them.
   */
  subscribeQuotes(
    instruments: readonly Instrument[],
    onQuote: QuoteListener,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const symbolsByProvider = new Map<MarketDataProvider, string[]>();
    for (const instrument of instruments) {
      const provider = this.providerFor(instrument);
      const symbols = symbolsByProvider.get(provider) ?? [];
      if (!symbols.includes(instrument.symbol)) symbols.push(instrument.symbol);
      symbolsByProvider.set(provider, symbols);
    }
    const unsubscribers = [...symbolsByProvider].map(([provider, symbols]) =>
      provider.subscribeQuotes(symbols, onQuote, onError),
    );
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }
}
