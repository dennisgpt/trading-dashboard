import { DockLayout } from "./layout/dock-layout";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { TitleBar } from "./title-bar";

export function AppShell() {
  return (
    <div className="flex h-screen flex-col overflow-hidden text-foreground">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-h-0 min-w-0 flex-1">
          <DockLayout />
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
