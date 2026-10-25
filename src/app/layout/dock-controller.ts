import type { DockviewApi, SerializedDockview } from "dockview-react";
import { create } from "zustand";
import { PANELS, panelDefinition, type PanelId } from "./panels";

const STORAGE_KEY = "layout";

interface DockState {
  api: DockviewApi | null;
  /** Ids of the panels currently in the layout. */
  openPanels: PanelId[];
  activePanel: PanelId | null;
}

/** dockview API plus the derived state the title bar menu and sidebar need. */
export const useDockStore = create<DockState>(() => ({ api: null, openPanels: [], activePanel: null }));

function syncState(api: DockviewApi): void {
  useDockStore.setState({
    openPanels: api.panels.map((p) => p.id as PanelId),
    activePanel: (api.activePanel?.id as PanelId | undefined) ?? null,
  });
}

/** Standard layout from the mockup: watchlist left at full height, chart and positions in the middle, order and account right. */
export function applyDefaultLayout(api: DockviewApi): void {
  api.clear();
  api.addPanel({ id: "watchlist", component: "watchlist", title: "Watchlist" });
  api.addPanel({ id: "chart", component: "chart", title: "Chart", position: { referencePanel: "watchlist", direction: "right" } });
  api.addPanel({ id: "order", component: "order", title: "Order", position: { referencePanel: "chart", direction: "right" } });
  api.addPanel({ id: "account", component: "account", title: "Paper-Konto", position: { referencePanel: "order", direction: "below" } });
  api.addPanel({ id: "positions", component: "positions", title: "Positionen", position: { referencePanel: "chart", direction: "below" } });

  api.getPanel("watchlist")?.group.api.setSize({ width: 280 });
  api.getPanel("order")?.group.api.setSize({ width: 300 });
  api.getPanel("positions")?.group.api.setSize({ height: Math.round(api.height * 0.38) });
  api.getPanel("chart")?.api.setActive();
}

function loadSavedLayout(): SerializedDockview | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SerializedDockview) : null;
  } catch {
    return null;
  }
}

function saveLayout(api: DockviewApi): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(api.toJSON()));
  } catch {
    // Storage full or unavailable: the layout simply is not persisted.
  }
}

/** Restores the saved layout (or the default one) and keeps it persisted. Returns a cleanup function. */
export function initDock(api: DockviewApi): () => void {
  const saved = loadSavedLayout();
  let restored = false;
  if (saved) {
    try {
      api.fromJSON(saved);
      // Drop panels of an older app version that no longer exist.
      for (const panel of api.panels) if (!panelDefinition(panel.id)) api.removePanel(panel);
      restored = api.panels.length > 0;
    } catch {
      restored = false;
    }
  }
  if (!restored) applyDefaultLayout(api);

  useDockStore.setState({ api });
  syncState(api);

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const changed = () => {
    syncState(api);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveLayout(api), 300);
  };
  // onDidLayoutChange alone misses floating/closing changes, so listen to every structural event.
  const subs = [
    api.onDidLayoutChange(changed),
    api.onDidMutateLayout(changed),
    api.onDidAddPanel(changed),
    api.onDidRemovePanel(changed),
    api.onDidMovePanel(changed),
    api.onDidAddGroup(changed),
    api.onDidRemoveGroup(changed),
    api.onDidActivePanelChange(() => syncState(api)),
  ];
  const saveNow = () => saveLayout(api);
  window.addEventListener("beforeunload", saveNow);

  return () => {
    clearTimeout(saveTimer);
    saveLayout(api);
    for (const sub of subs) sub.dispose();
    window.removeEventListener("beforeunload", saveNow);
    useDockStore.setState({ api: null });
  };
}


/** Focuses the panel, or reopens it if it was closed (next to its default neighbour). */
export function showPanel(id: PanelId): void {
  const api = useDockStore.getState().api;
  if (!api) return;
  const existing = api.getPanel(id);
  if (existing) {
    existing.api.setActive();
    return;
  }
  const definition = panelDefinition(id);
  if (!definition) return;
  const reference = api.panels[0];
  api.addPanel({
    id,
    component: id,
    title: definition.title,
    ...(reference ? { position: { referencePanel: reference, direction: "right" } } : {}),
  });
}

export function resetLayout(): void {
  const api = useDockStore.getState().api;
  if (api) applyDefaultLayout(api);
}

export { PANELS };
