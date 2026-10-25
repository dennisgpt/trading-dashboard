import { useEffect, useMemo, useRef, useState } from "react";
import {
  DockviewReact,
  type DockviewApi,
  type DockviewTheme,
  type IDockviewHeaderActionsProps,
  type IDockviewPanelHeaderProps,
  type IDockviewPanelProps,
} from "dockview-react";
import "dockview-react/dist/styles/dockview.css";
import { ExternalLink, GripVertical, PanelTopClose, X } from "lucide-react";
import { useTheme } from "@/app/use-theme";
import { initDock } from "./dock-controller";
import { PANELS } from "./panels";
import "./dockview-theme.css";

/**
 * Builds on dockview's "abyss spaced" theme for the structure (gaps, rounded groups),
 * all colours are overridden with the Graphite Glass tokens in dockview-theme.css.
 */
function graphiteTheme(colorScheme: "dark" | "light"): DockviewTheme {
  return {
    name: "graphite",
    className: "dockview-theme-abyss-spaced",
    colorScheme,
    gap: 8,
    dndOverlayMounting: "absolute",
    dndPanelOverlay: "group",
    dndTabIndicator: "line",
    dndOverlayBorder: "2px solid var(--dv-active-sash-color)",
  };
}

/** Tab = panel header: drag handle, title, close button. Dragging the tab moves the panel. */
function PanelTab({ api }: IDockviewPanelHeaderProps) {
  const [title, setTitle] = useState(api.title ?? "");
  useEffect(() => {
    const sub = api.onDidTitleChange((e) => setTitle(e.title));
    return () => sub.dispose();
  }, [api]);

  return (
    <div className="gg-tab flex h-full items-center gap-1.5 pr-1 pl-1">
      <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
      <span className="truncate font-semibold">{title}</span>
      <button
        type="button"
        className="gg-tab-close ml-1 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Schließen"
        aria-label={`${title} schließen`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          api.close();
        }}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

/** Right side of every group header: undock (float) or dock back. */
function GroupActions({ api, containerApi, activePanel, location }: IDockviewHeaderActionsProps) {
  const floating = location?.type === "floating";
  const label = floating ? "Wieder andocken" : "Abdocken";
  return (
    <div className="flex h-full items-center pr-1.5">
      <button
        type="button"
        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        title={label}
        aria-label={label}
        onClick={() => {
          if (floating) api.moveTo({ position: "right" });
          else if (activePanel) containerApi.addFloatingGroup(activePanel, { width: 420, height: 320 });
        }}
      >
        {floating ? <PanelTopClose className="size-3.5" /> : <ExternalLink className="size-3.5" />}
      </button>
    </div>
  );
}

function Watermark() {
  return (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      Alle Panels geschlossen. Über „Panels“ in der Titelleiste wieder öffnen.
    </div>
  );
}

export function DockLayout() {
  const { theme } = useTheme();
  const dockTheme = useMemo(() => graphiteTheme(theme), [theme]);
  const cleanup = useRef<(() => void) | null>(null);

  const components = useMemo(
    () =>
      Object.fromEntries(
        PANELS.map((p) => {
          const Content = p.component;
          const Wrapped = (_props: IDockviewPanelProps) => (
            <div className="h-full overflow-auto p-3">
              <Content />
            </div>
          );
          Wrapped.displayName = `${p.id}Panel`;
          return [p.id, Wrapped];
        }),
      ),
    [],
  );


  return (
    <DockviewReact
      className="gg-dock h-full w-full"
      theme={dockTheme}
      components={components}
      defaultTabComponent={PanelTab}
      rightHeaderActionsComponent={GroupActions}
      watermarkComponent={Watermark}
      floatingGroupBounds="boundedWithinViewport"
      onReady={(event: { api: DockviewApi }) => {
        // Re-initialise only if dockview creates a new instance; StrictMode's simulated
        // unmount must not tear down the listeners of the instance that stays.
        cleanup.current?.();
        cleanup.current = initDock(event.api);
      }}
    />
  );
}
