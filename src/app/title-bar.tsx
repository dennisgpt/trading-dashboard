import { Moon, Sun } from "lucide-react";
import { PaperBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { isMacDesktop } from "@/lib/native/platform";
import { cn } from "@/lib/utils";
import { PanelsMenu } from "./layout/panels-menu";
import { useTheme } from "./use-theme";
import { WindowControls } from "./window-controls";

/**
 * Custom title bar. Windows: undecorated window with our own buttons on the right.
 * macOS: native traffic lights on the left (overlay title bar), so the content is indented.
 * `data-tauri-drag-region` only applies to the element it is set on, so every
 * non-interactive child carries it too.
 */
export function TitleBar() {
  const { theme, toggle } = useTheme();

  return (
    <header data-tauri-drag-region className={cn("chrome flex h-10 shrink-0 items-center gap-3 border-b border-border pr-3", isMacDesktop ? "pl-20" : "pl-3")}>
      <span data-tauri-drag-region className="text-[13px] font-semibold">
        Trading Dashboard
      </span>
      <PaperBadge />
      <div data-tauri-drag-region className="h-full flex-1" />
      <PanelsMenu />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        className="text-muted-foreground"
        title={theme === "dark" ? "Helles Design" : "Dunkles Design"}
        aria-label={theme === "dark" ? "Zu hellem Design wechseln" : "Zu dunklem Design wechseln"}
      >
        {theme === "dark" ? <Sun /> : <Moon />}
      </Button>
      {!isMacDesktop && <WindowControls />}
    </header>
  );
}
