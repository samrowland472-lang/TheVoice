import { useMemo, useState } from "react";
import { useNavigate, useParams } from "tanstack/react-router";
import { Toaster } from "sonner";
import { useDesign } from "@/lib/design/store";
import { CanvasStage } from "./canvas-stage";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { PaintDock } from "./paint-dock";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";
import { CommandPalette, type CommandItem } from "./command-palette";
import { useShortcuts } from "./use-shortcuts";
import { AiPanel } from "./ai-panel";
import { cn } from "@/lib/utils";

export function StudioApp() {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sheet, setSheet] = useState<"layers" | "inspect" | "ai" | null>(null);
  const doc = useDesign((s) => s.doc);
  const present = useDesign((s) => s.present);
  useShortcuts({ onPalette: () => setPaletteOpen(true) });
  useParams({ from: "/studio/$id" });

  const commands = useMemo<CommandItem[]>(() => {
    const s = () => useDesign.getState();
    return [
      { id: "save", label: "Save", group: "File", hint: "⌘S", run: () => s().save() },
      { id: "undo", label: "Undo", group: "Edit", hint: "⌘Z", run: () => s().undo() },
      { id: "redo", label: "Redo", group: "Edit", hint: "⇧⌘Z", run: () => s().redo() },
      { id: "fit", label: "Fit artboard", group: "View", hint: "0", run: () => s().requestFit() },
      { id: "present", label: "Present artboard", group: "View", hint: "⇧P", run: () => s().togglePresent() },
      { id: "select", label: "Select tool", group: "Tools", hint: "V", run: () => s().setTool("select") },
      { id: "pen", label: "Pen", group: "Tools", hint: "P", run: () => s().setTool("pen") },
      { id: "home", label: "Back to templates", group: "File", run: () => void navigate({ to: "/" }) },
    ];
  }, [navigate]);

  if (!doc) {
    return <div className="flex flex-1 items-center justify-center text-ink-dim">Loading artboard…</div>;
  }

  if (present) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-ground">
        <CanvasStage />
        <button type="button" className="h-10 text-xs text-phosphor" onClick={() => useDesign.getState().setPresent(false)}>
          Exit present
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ground">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ToolRail />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <CanvasStage />
          <PaintDock />
        </div>
        <aside className="hidden w-[280px] shrink-0 flex-col border-l border-border bg-surface md:flex">
          <div className="min-h-0 flex-1 overflow-auto">
            <LayersPanel />
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <Inspector />
          </div>
          <AiPanel />
        </aside>
      </div>
      <div className="flex shrink-0 border-t border-border md:hidden">
        {(["layers", "inspect", "ai"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSheet(sheet === id ? null : id)}
            className={cn("h-12 flex-1 text-xs font-medium capitalize", sheet === id ? "text-phosphor" : "text-ink-dim")}
          >
            {id === "ai" ? "Director" : id === "inspect" ? "Inspect" : "Layers"}
          </button>
        ))}
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <Toaster theme="dark" />
    </div>
  );
}
