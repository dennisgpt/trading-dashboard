import { ArrowLeftRight, Briefcase, CandlestickChart, List, Settings, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: LucideIcon;
}

const PANELS: NavItem[] = [
  { label: "Watchlist", icon: List },
  { label: "Chart", icon: CandlestickChart },
  { label: "Order", icon: ArrowLeftRight },
  { label: "Positionen", icon: Briefcase },
  { label: "Paper-Konto", icon: Wallet },
];

function NavButton({ item, active = false }: { item: NavItem; active?: boolean }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground",
        active && "bg-sel text-accent-fg hover:bg-sel hover:text-accent-fg",
      )}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}

export function Sidebar() {
  return (
    <nav className="chrome flex w-13 shrink-0 flex-col items-center gap-1 border-r border-border py-2" aria-label="Panels">
      {PANELS.map((item, i) => (
        <NavButton key={item.label} item={item} active={i === 0} />
      ))}
      <div className="flex-1" />
      <NavButton item={{ label: "Einstellungen", icon: Settings }} />
    </nav>
  );
}
