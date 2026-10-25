import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SourceState = "connected" | "delayed" | "disconnected";

interface DataSource {
  name: string;
  state: SourceState;
  detail: string;
}

// Static until the real providers report their state (phase 4).
const SOURCES: DataSource[] = [
  { name: "Binance", state: "disconnected", detail: "nicht verbunden" },
  { name: "Finnhub", state: "disconnected", detail: "kein API-Key" },
  { name: "Twelve Data", state: "disconnected", detail: "kein API-Key" },
];

const DOT: Record<SourceState, string> = {
  connected: "bg-up",
  delayed: "bg-amber",
  disconnected: "bg-muted-foreground/50",
};

const timeFormat = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="tabular-nums">{timeFormat.format(now)}</span>;
}

export function StatusBar() {
  return (
    <footer className="chrome flex h-7 shrink-0 items-center gap-4 border-t border-border px-3 text-xs text-muted-foreground">
      {SOURCES.map((source) => (
        <span key={source.name} className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", DOT[source.state])} aria-hidden />
          <span className="text-foreground/80">{source.name}</span>
          <span>{source.detail}</span>
        </span>
      ))}
      <div className="flex-1" />
      <Clock />
    </footer>
  );
}
