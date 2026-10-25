import type { DataMode } from "@/core/market/types";
import { cn } from "@/lib/utils";

const badgeBase = "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium leading-none";

/** "Live" / "Verzögert" badge; every price shown carries its data mode. */
export function DataModeBadge({ mode, className }: { mode: DataMode; className?: string }) {
  return mode === "live" ? (
    <span className={cn(badgeBase, "bg-up/12 text-up", className)}>
      <span className="size-1.5 rounded-full bg-up" aria-hidden />
      Live
    </span>
  ) : (
    <span className={cn(badgeBase, "bg-amber/12 text-amber", className)}>Verzögert</span>
  );
}

/** Permanent reminder that all trading is simulated. */
export function PaperBadge({ className }: { className?: string }) {
  return (
    <span className={cn(badgeBase, "bg-sel text-accent-fg", className)} title="Paper-Trading: alle Orders sind simuliert">
      Paper
    </span>
  );
}
