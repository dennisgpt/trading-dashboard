import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus, Search } from "lucide-react";
import { marketRegistry } from "@/app/market";
import { instrumentKey, type Instrument } from "@/core/market/types";
import { cn } from "@/lib/utils";

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

interface SymbolSearchProps {
  existing: readonly Instrument[];
  onAdd: (instrument: Instrument) => void;
}

/** Search field with result list; picking a result adds it to the watchlist. */
export function SymbolSearch({ existing, onAdd }: SymbolSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const term = useDebounced(query.trim(), 200);

  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ["search", term],
    queryFn: ({ signal }) => marketRegistry.searchInstruments(term, signal),
    enabled: term.length > 0,
    staleTime: 60_000,
  });

  const existingKeys = new Set(existing.map(instrumentKey));

  useEffect(() => setHighlight(0), [term]);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const pick = (instrument: Instrument) => {
    onAdd(instrument);
    setQuery("");
    setOpen(false);
  };

  const showList = open && term.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <label className="flex h-8 items-center gap-2 rounded-lg border border-border bg-input-bg px-2 focus-within:ring-2 focus-within:ring-ring/50">
        <Search className="size-3.5 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") setHighlight((h) => Math.min(h + 1, results.length - 1));
            if (e.key === "ArrowUp") setHighlight((h) => Math.max(h - 1, 0));
            if (e.key === "Enter" && results[highlight]) pick(results[highlight]);
          }}
          placeholder="Symbol hinzufügen …"
          aria-label="Symbol suchen"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
      </label>

      {showList && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-9 z-20 max-h-72 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {isError && <li className="px-2 py-1.5 text-xs text-down">Suche fehlgeschlagen. Verbindung prüfen.</li>}
          {!isError && results.length === 0 && (
            <li className="px-2 py-1.5 text-xs text-muted-foreground">{isFetching ? "Suche …" : "Keine Treffer"}</li>
          )}
          {results.map((instrument, i) => {
            const added = existingKeys.has(instrumentKey(instrument));
            return (
              <li key={instrumentKey(instrument)} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  disabled={added}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(instrument)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left disabled:opacity-50",
                    i === highlight && "bg-accent",
                  )}
                >
                  <span className="font-semibold">{instrument.displaySymbol ?? instrument.symbol}</span>
                  <span className="flex-1 truncate text-xs text-muted-foreground">{instrument.name}</span>
                  {added ? <Check className="size-3.5 text-muted-foreground" /> : <Plus className="size-3.5 text-muted-foreground" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
