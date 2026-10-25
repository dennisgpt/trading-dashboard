// Composition root for market data: the one place that knows the concrete providers.
// Panels and stores only use the registry (ADR 0003).
import { ProviderRegistry } from "@/core/market/registry";
import { BinanceProvider } from "@/core/providers/binance/binance-provider";

export const marketRegistry = new ProviderRegistry();
marketRegistry.register(new BinanceProvider());
