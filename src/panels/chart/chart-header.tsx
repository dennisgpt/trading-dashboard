import { DataModeBadge } from "@/components/badges";
import type { DataMode, Instrument, Quote, Timeframe } from "@/core/market/types";
import { formatChange, formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TIMEFRAMES } from "@/stores/chart";

interface ChartHeaderProps {
  instrument: Instrument;
  quote: Quote | undefined;
  source: string;
  dataMode: DataMode;
  timeframe: Timeframe;
  onTimeframe: (timeframe: Timeframe) => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
      <span className="text-xs">{value}</span>
    </div>
  );
}

/** Symbol, price, change, 24h high/low, source and data mode, plus the timeframe picker. */
export function ChartHeader({ instrument, quote, source, dataMode, timeframe, onTimeframe }: ChartHeaderProps) {
  const d = instrument.decimals;
  const change = quote?.changePercent;
  // Absolute change derived from the percentage against the reference price.
  const absolute = quote && change !== undefined ? quote.price - quote.price / (1 + change / 100) : undefined;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold">{instrument.displaySymbol ?? instrument.symbol}</span>
        <span className="text-xs text-muted-foreground">{instrument.name}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold">{quote ? formatPrice(quote.price, d) : "—"}</span>
        {change !== undefined && absolute !== undefined && (
          <span className={cn("text-xs", change >= 0 ? "text-up" : "text-down")}>
            {formatChange(absolute, d)} ({formatPercent(change)})
          </span>
        )}
      </div>
      <Stat label="Hoch 24h" value={quote?.high !== undefined ? formatPrice(quote.high, d) : "—"} />
      <Stat label="Tief 24h" value={quote?.low !== undefined ? formatPrice(quote.low, d) : "—"} />
      <Stat label="Quelle" value={source} />
      <DataModeBadge mode={dataMode} />
      <div className="ml-auto flex rounded-lg border border-border p-0.5" role="group" aria-label="Zeitraum">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            type="button"
            aria-pressed={tf === timeframe}
            onClick={() => onTimeframe(tf)}
            className={cn(
              "rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground",
              tf === timeframe && "bg-sel text-accent-fg hover:text-accent-fg",
            )}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
}
