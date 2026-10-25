import { LayoutPanelLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resetLayout, showPanel, useDockStore } from "./dock-controller";
import { PANELS } from "./panels";

/** Title bar menu: open closed panels again, reset the layout. */
export function PanelsMenu() {
  const openPanels = useDockStore((s) => s.openPanels);
  const api = useDockStore((s) => s.api);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <LayoutPanelLeft />
          Panels
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Panels</DropdownMenuLabel>
        {PANELS.map((panel) => {
          const open = openPanels.includes(panel.id);
          return (
            <DropdownMenuCheckboxItem
              key={panel.id}
              checked={open}
              onCheckedChange={(checked) => {
                if (checked) showPanel(panel.id);
                else api?.getPanel(panel.id)?.api.close();
              }}
            >
              {panel.title}
            </DropdownMenuCheckboxItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={resetLayout}>
          <RotateCcw />
          Layout zurücksetzen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
