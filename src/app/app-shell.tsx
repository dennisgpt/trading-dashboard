import { AccountPanel } from "@/panels/account/account-panel";
import { ChartPanel } from "@/panels/chart/chart-panel";
import { OrderPanel } from "@/panels/order/order-panel";
import { PositionsPanel } from "@/panels/positions/positions-panel";
import { WatchlistPanel } from "@/panels/watchlist/watchlist-panel";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { TitleBar } from "./title-bar";

/** Fixed mockup layout; replaced by a dockview layout in phase 4. */
export function AppShell() {
  return (
    <div className="flex h-screen flex-col overflow-hidden text-foreground">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="grid min-h-0 min-w-0 flex-1 grid-cols-[280px_minmax(0,1fr)_300px] grid-rows-[minmax(0,3fr)_minmax(0,2fr)] gap-2 p-2">
          <WatchlistPanel />
          <ChartPanel />
          <OrderPanel />
          <PositionsPanel />
          <AccountPanel />
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
