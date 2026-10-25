import type { ReactNode } from "react";
import { ExternalLink, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  /** Extra controls shown in the header, left of the undock button. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Glass panel frame with drag handle and undock button (both wired up with dockview in phase 4). */
export function Panel({ title, actions, className, children }: PanelProps) {
  return (
    <section className={cn("glass-panel flex min-h-0 min-w-0 flex-col", className)} aria-label={title}>
      <header className="flex h-9 shrink-0 items-center gap-1.5 border-b border-border px-2">
        <span className="cursor-grab text-muted-foreground" title="Verschieben" aria-hidden>
          <GripVertical className="size-4" />
        </span>
        <h2 className="flex-1 truncate text-xs font-semibold tracking-wide text-foreground">{title}</h2>
        {actions}
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Abdocken"
          aria-label={`${title} abdocken`}
        >
          <ExternalLink className="size-3.5" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>
    </section>
  );
}

/** Centered hint shown by panels that have no content yet. */
export function PanelPlaceholder({ children }: { children: ReactNode }) {
  return <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">{children}</div>;
}
