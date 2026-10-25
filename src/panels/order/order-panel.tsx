import { marketRegistry } from "@/app/market";
import { DataModeBadge } from "@/components/badges";
import { PanelPlaceholder } from "@/components/panel";
import { formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLiveQuotes, useQuote } from "@/stores/quotes";
import { useSelectionStore } from "@/stores/selection";

/** Shows the instrument selected in the watchlist; the order form follows in phase 5. */
export function OrderPanel() {
  const selected = useSelectionStore((s) => s.selected);
  useLiveQuotes(marketRegistry, selected ? [selected] : []);
  const quote = useQuote(selected);

  if (!selected) return <PanelPlaceholder>Instrument in der Watchlist auswählen.</PanelPlaceholder>;

  const change = quote?.changePercent;
  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{selected.displaySymbol ?? selected.symbol}</span>
          <DataModeBadge mode={quote?.dataMode ?? marketRegistry.providerFor(selected).dataMode} />
        </div>
        <div className="text-xs text-muted-foreground">{selected.name}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold">{quote ? formatPrice(quote.price, selected.decimals) : "—"}</span>
        <span className="text-xs text-muted-foreground">{selected.currency}</span>
        {change !== undefined && <span className={cn("text-xs", change >= 0 ? "text-up" : "text-down")}>{formatPercent(change)}</span>}
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
        Order-Eingabe (Paper-Trading) folgt in Phase 5.
      </div>
    </div>
  );
}
