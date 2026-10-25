import { useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { marketRegistry } from "@/app/market";
import { instrumentKey } from "@/core/market/types";
import { sqliteWatchlistRepository } from "@/lib/native/database";
import { useLiveQuotes } from "@/stores/quotes";
import { useSelectionStore } from "@/stores/selection";
import { WATCHLIST_GROUPS, localStorageWatchlistRepository, useWatchlistStore } from "@/stores/watchlist";
import { SymbolSearch } from "./symbol-search";
import { WatchlistRow } from "./watchlist-row";

export function WatchlistPanel() {
  const { instruments, loaded, error, load, add, remove } = useWatchlistStore();
  const selected = useSelectionStore((s) => s.selected);
  const select = useSelectionStore((s) => s.select);

  useEffect(() => {
    if (!loaded) void load(isTauri() ? sqliteWatchlistRepository() : localStorageWatchlistRepository());
  }, [loaded, load]);

  // Select the first instrument when nothing is selected yet, so the chart has something to show.
  useEffect(() => {
    if (loaded && !selected && instruments[0]) select(instruments[0]);
  }, [loaded, selected, instruments, select]);

  // Only instruments with a registered provider can stream (stocks need an API key first).
  const streamable = instruments.filter((i) => marketRegistry.forMarket(i.market).length > 0);
  useLiveQuotes(marketRegistry, streamable);

  const selectedKey = selected ? instrumentKey(selected) : null;

  return (
    <div className="flex h-full flex-col gap-2">
      <SymbolSearch existing={instruments} onAdd={(i) => void add(i)} />
      {error && <p className="text-xs text-down">{error}</p>}
      <div className="-mx-1 min-h-0 flex-1 overflow-auto px-1">
        {WATCHLIST_GROUPS.map((group) => {
          const items = instruments.filter((i) => group.markets.includes(i.market));
          return (
            <section key={group.id} className="mb-2" aria-label={group.title}>
              <h3 className="px-2 pt-1 pb-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{group.title}</h3>
              {items.length === 0 ? (
                <p className="px-2 py-1 text-xs text-muted-foreground/80">
                  {group.emptyHint && marketRegistry.forMarket(group.markets[0]).length === 0 ? group.emptyHint : "Keine Instrumente"}
                </p>
              ) : (
                <ul>
                  {items.map((instrument) => (
                    <WatchlistRow
                      key={instrumentKey(instrument)}
                      instrument={instrument}
                      selected={instrumentKey(instrument) === selectedKey}
                      onSelect={() => select(instrument)}
                      onRemove={() => void remove(instrument)}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
