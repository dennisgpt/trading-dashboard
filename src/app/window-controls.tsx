import { useEffect, useState } from "react";
import { Copy, Minus, Square, X } from "lucide-react";
import { closeWindow, isWindowMaximized, minimizeWindow, onWindowResized, toggleMaximizeWindow } from "@/lib/native/window";
import { cn } from "@/lib/utils";

function useIsMaximized(): boolean {
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    const update = () => void isWindowMaximized().then(setMaximized);
    update();
    return onWindowResized(update);
  }, []);
  return maximized;
}

const buttonClass =
  "flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

/** Minimize / maximize / close for the undecorated window. */
export function WindowControls() {
  const maximized = useIsMaximized();

  return (
    <div className="-mr-3 flex h-full">
      <button type="button" className={buttonClass} onClick={() => void minimizeWindow()} title="Minimieren" aria-label="Minimieren">
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => void toggleMaximizeWindow()}
        title={maximized ? "Wiederherstellen" : "Maximieren"}
        aria-label={maximized ? "Wiederherstellen" : "Maximieren"}
      >
        {maximized ? <Copy className="size-3.5 -scale-x-100" /> : <Square className="size-3.5" />}
      </button>
      <button
        type="button"
        className={cn(buttonClass, "hover:bg-[#c42b1c] hover:text-white")}
        onClick={() => void closeWindow()}
        title="Schließen"
        aria-label="Schließen"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
