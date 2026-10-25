import type { ReactNode } from "react";

/** Centered hint shown by panels that have no content yet. Panel frames come from dockview (src/app/layout). */
export function PanelPlaceholder({ children }: { children: ReactNode }) {
  return <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">{children}</div>;
}
