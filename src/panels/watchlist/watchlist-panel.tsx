import { Panel, PanelPlaceholder } from "@/components/panel";

export function WatchlistPanel() {
  return (
    <Panel title="Watchlist" className="row-span-2">
      <PanelPlaceholder>
        Noch keine Instrumente.
        <br />
        Kurse folgen mit den Datenquellen in Phase 4.
      </PanelPlaceholder>
    </Panel>
  );
}
