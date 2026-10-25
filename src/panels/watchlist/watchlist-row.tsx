import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { marketRegistry } from "@/app/market";
import { DataModeBadge } from "@/components/badges";
import { Sparkline } from "@/components/sparkline";
import type { Instrument } from "@/core/market/types";
import { formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuote } from "@/stores/quotes";

/** Last 24 hourly closes for the sparkline; the live price replaces the last point. */
function useSparkline(instrument: Instrument, livePrice: number | undefined): number[] {
  const { data } = useQuery({
    queryKey: ["sparkline", instrument.providerId, instrument.symbol],
    queryFn: ({ signal }) => marketRegistry.providerFor(instrument).getCandles(instrument.symbol, "1H", 24, signal),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
  const closes = data?.map((c) => c.close) ?? [];
  if (closes.length > 0 && livePrice !== undefined) closes[closes.length - 1] = livePrice;
  return closes;
}

interface WatchlistRowProps {
  instrument: Instrument;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function WatchlistRow({ instrument, selected, onSelect, onRemove }: WatchlistRowProps) {
  const quote = useQuote(instrument);
  const sparkline = useSparkline(instrument, quote?.price);
  const dataMode = quote?.dataMode ?? marketRegistry.providerFor(instrument).dataMode;
  const change = quote?.changePercent;
  const label = instrument.displaySymbol ?? instrument.symbol;

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          "group relative grid cursor-pointer grid-cols-[minmax(0,1fr)_40px_auto] items-center gap-x-2 rounded-lg px-2 py-1.5 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50",
          selected && "bg-sel hover:bg-sel",
        )}
      >
        <div className="min-w-0">
          <div className="truncate font-semibold">{label}</div>
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs text-muted-foreground">{instrument.name}</span>
            <DataModeBadge mode={dataMode} className="h-4 shrink-0 px-1.5 text-[10px]" />
          </div>
        </div>
        <Sparkline values={sparkline} width={40} />
        <div className="text-right">
          <div className="font-medium">{quote ? formatPrice(quote.price, instrument.decimals) : "—"}</div>
          <div className={cn("text-xs", change === undefined ? "text-muted-foreground" : change >= 0 ? "text-up" : "text-down")}>
            {change === undefined ? "—" : formatPercent(change)}
          </div>
        </div>
        <button
          type="button"
          title="Aus Watchlist entfernen"
          aria-label={`${label} aus Watchlist entfernen`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1/2 -left-1 hidden size-5 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-popover text-muted-foreground shadow-sm group-hover:flex hover:text-down"
        >
          <X className="size-3" />
        </button>
      </div>
    </li>
  );
}
