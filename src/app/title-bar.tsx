import { Moon, Sun } from "lucide-react";
import { PaperBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { useTheme } from "./use-theme";

export function TitleBar() {
  const { theme, toggle } = useTheme();

  return (
    <header className="chrome flex h-10 shrink-0 items-center gap-3 border-b border-border px-3">
      <span className="text-[13px] font-semibold">Trading Dashboard</span>
      <PaperBadge />
      <div className="flex-1" />
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
    </header>
  );
}
