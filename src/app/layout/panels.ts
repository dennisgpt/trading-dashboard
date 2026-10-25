import type { FunctionComponent } from "react";
import { ArrowLeftRight, Briefcase, CandlestickChart, List, Wallet, type LucideIcon } from "lucide-react";
import { AccountPanel } from "@/panels/account/account-panel";
import { ChartPanel } from "@/panels/chart/chart-panel";
import { OrderPanel } from "@/panels/order/order-panel";
import { PositionsPanel } from "@/panels/positions/positions-panel";
import { WatchlistPanel } from "@/panels/watchlist/watchlist-panel";

export type PanelId = "watchlist" | "chart" | "order" | "positions" | "account";

export interface PanelDefinition {
  id: PanelId;
  title: string;
  icon: LucideIcon;
  component: FunctionComponent;
}

/** All panels of the workspace. The id doubles as dockview panel id and component name. */
export const PANELS: readonly PanelDefinition[] = [
  { id: "watchlist", title: "Watchlist", icon: List, component: WatchlistPanel },
  { id: "chart", title: "Chart", icon: CandlestickChart, component: ChartPanel },
  { id: "order", title: "Order", icon: ArrowLeftRight, component: OrderPanel },
  { id: "positions", title: "Positionen", icon: Briefcase, component: PositionsPanel },
  { id: "account", title: "Paper-Konto", icon: Wallet, component: AccountPanel },
];

export function panelDefinition(id: string): PanelDefinition | undefined {
  return PANELS.find((p) => p.id === id);
}
