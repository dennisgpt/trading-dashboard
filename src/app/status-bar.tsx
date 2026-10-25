import { useEffect, useState } from "react";
import type { ConnectionStatus } from "@/core/market/types";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection";
import { marketRegistry } from "./market";

const STATUS_TEXT: Record<ConnectionStatus, string> = {
  connected: "verbunden",
  connecting: "verbindet …",
  disconnected: "getrennt",
};

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connected: "bg-up",
  connecting: "bg-amber animate-pulse",
  disconnected: "bg-down",
};

// Sources that need an API key; they get a real status with the settings in phase 4 part B.
const KEY_SOURCES = ["Finnhub", "Twelve Data"];

const timeFormat = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="tabular-nums">{timeFormat.format(now)}</span>;
}

function Source({ name, dot, text }: { name: string; dot: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
      <span className="text-foreground/80">{name}</span>
      <span>{text}</span>
    </span>
  );
}

export function StatusBar() {
  const status = useConnectionStore((s) => s.status);

  return (
    <footer className="chrome flex h-7 shrink-0 items-center gap-4 border-t border-border px-3 text-xs text-muted-foreground">
      {marketRegistry.list().map((provider) => {
        const state = status[provider.id] ?? "disconnected";
        return <Source key={provider.id} name={provider.name} dot={STATUS_DOT[state]} text={STATUS_TEXT[state]} />;
      })}
      {KEY_SOURCES.map((name) => (
        <Source key={name} name={name} dot="bg-muted-foreground/50" text="kein API-Key" />
      ))}
      <div className="flex-1" />
      <Clock />
    </footer>
  );
}
