import { useEffect } from "react";
import { create } from "zustand";
import type { ProviderRegistry } from "@/core/market/registry";
import { instrumentKey, type Instrument, type Quote } from "@/core/market/types";

interface QuotesState {
  /** Latest quote per instrument key. */
  quotes: Record<string, Quote>;
  setQuote: (key: string, quote: Quote) => void;
}

export const useQuotesStore = create<QuotesState>()((set) => ({
  quotes: {},
  setQuote: (key, quote) => set((state) => ({ quotes: { ...state.quotes, [key]: quote } })),
}));

/**
 * Streams quotes for the instruments into the store while subscribed. Several subscriptions to
 * the same symbol are cheap: providers share one connection and count references.
 */
export function subscribeQuotes(registry: ProviderRegistry, instruments: readonly Instrument[]): () => void {
  if (instruments.length === 0) return () => {};
  const { setQuote } = useQuotesStore.getState();
  // Quotes carry the source symbol; map it back to the instrument key per provider.
  const keys = new Map<string, string>();
  for (const instrument of instruments) {
    keys.set(`${registry.providerFor(instrument).id}|${instrument.symbol}`, instrumentKey(instrument));
  }
  const unsubscribers = instruments.map((instrument) => {
    const provider = registry.providerFor(instrument);
    return provider.subscribeQuotes([instrument.symbol], (quote) => {
      const key = keys.get(`${provider.id}|${quote.symbol}`);
      if (key) setQuote(key, quote);
    });
  });
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

/** React binding: keeps the quotes of the given instruments live while the component is mounted. */
export function useLiveQuotes(registry: ProviderRegistry, instruments: readonly Instrument[]): void {
  const signature = instruments.map(instrumentKey).join(",");
  useEffect(() => {
    try {
      return subscribeQuotes(registry, instruments);
    } catch {
      // No provider for one of the instruments (e.g. stocks without API key): nothing to stream.
      return undefined;
    }
    // `signature` stands for the instrument list; depending on the array itself would re-subscribe on every render.
  }, [registry, signature]);
}

export function useQuote(instrument: Instrument | null): Quote | undefined {
  return useQuotesStore((s) => (instrument ? s.quotes[instrumentKey(instrument)] : undefined));
}
