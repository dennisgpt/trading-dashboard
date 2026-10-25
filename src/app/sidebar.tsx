import { Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { showPanel, useDockStore } from "./layout/dock-controller";
import { PANELS } from "./layout/panels";

interface NavButtonProps {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

function NavButton({ label, icon: Icon, active = false, dimmed = false, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground",
        dimmed && "opacity-50",
        active && "bg-sel text-accent-fg hover:bg-sel hover:text-accent-fg",
      )}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}

/** Panel shortcuts: click focuses a panel or reopens it when it was closed. */
export function Sidebar() {
  const openPanels = useDockStore((s) => s.openPanels);
  const activePanel = useDockStore((s) => s.activePanel);

  return (
    <nav className="chrome flex w-13 shrink-0 flex-col items-center gap-1 border-r border-border py-2" aria-label="Panels">
      {PANELS.map((panel) => (
        <NavButton
          key={panel.id}
          label={openPanels.includes(panel.id) ? panel.title : `${panel.title} öffnen`}
          icon={panel.icon}
          active={activePanel === panel.id}
          dimmed={!openPanels.includes(panel.id)}
          onClick={() => showPanel(panel.id)}
        />
      ))}
      <div className="flex-1" />
      <NavButton label="Einstellungen" icon={Settings} />
    </nav>
  );
}
