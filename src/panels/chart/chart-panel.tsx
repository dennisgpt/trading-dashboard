import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketRegistry } from "@/app/market";
import { useTheme } from "@/app/use-theme";
import { PanelPlaceholder } from "@/components/panel";
import type { Instrument } from "@/core/market/types";
import { useChartSettings } from "@/stores/chart";
import { useConnectionStore } from "@/stores/connection";
import { useLiveQuotes, useQuote } from "@/stores/quotes";
import { useSelectionStore } from "@/stores/selection";
import { ChartHeader } from "./chart-header";
import { useCandleChart } from "./use-candle-chart";

const HISTORY_CANDLES = 500;

function ChartView({ instrument }: { instrument: Instrument }) {
  const { theme } = useTheme();
  const timeframe = useChartSettings((s) => s.timeframe);
  const setTimeframe = useChartSettings((s) => s.setTimeframe);
  const provider = marketRegistry.providerFor(instrument);
  // Reload history after a reconnect: candles may be missing for the time the connection was down.
  const reconnects = useConnectionStore((s) => s.reconnects[provider.id] ?? 0);

  useLiveQuotes(marketRegistry, [instrument]);
  const quote = useQuote(instrument);
  const chart = useCandleChart(theme, instrument.decimals);

  const history = useQuery({
    queryKey: ["candles", provider.id, instrument.symbol, timeframe, reconnects],
    queryFn: ({ signal }) => provider.getCandles(instrument.symbol, timeframe, HISTORY_CANDLES, signal),
    staleTime: 30_000,
  });

  // `chart` is a new object on every render but its functions only touch refs, so it is no dependency.
  useEffect(() => {
    if (history.data) chart.setCandles(history.data);
  }, [history.data]);

  // Live updates of the running candle, only once the history is in place.
  useEffect(() => {
    if (!history.data) return;
    return provider.subscribeCandles(instrument.symbol, timeframe, chart.updateCandle);
  }, [provider, instrument.symbol, timeframe, history.data]);

  return (
    <div className="flex h-full flex-col gap-2">
      <ChartHeader
        instrument={instrument}
        quote={quote}
        source={provider.name}
        dataMode={quote?.dataMode ?? provider.dataMode}
        timeframe={timeframe}
        onTimeframe={setTimeframe}
      />
      <div className="relative min-h-0 flex-1">
        <div ref={chart.containerRef} className="absolute inset-0" />
        {history.isPending && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Lade Kerzen …</div>}
        {history.isError && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-down">Kerzen konnten nicht geladen werden. Verbindung prüfen.</div>
        )}
      </div>
    </div>
  );
}

export function ChartPanel() {
  const selected = useSelectionStore((s) => s.selected);
  if (!selected) return <PanelPlaceholder>Instrument in der Watchlist auswählen.</PanelPlaceholder>;
  if (marketRegistry.forMarket(selected.market).length === 0) {
    return <PanelPlaceholder>Für dieses Instrument ist noch keine Datenquelle eingerichtet.</PanelPlaceholder>;
  }
  return <ChartView instrument={selected} />;
}
