import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useDesign } from "@/lib/design/store";
import type { DesignNode } from "@/lib/design/types";
import { CanvasStage } from "./canvas-stage";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { MixedInk } from "./mixed-ink";
import { PaintDock } from "./paint-dock";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";
import { CommandPalette, type CommandItem } from "./command-palette";
import { useShortcuts } from "./use-shortcuts";
import { AiPanel } from "./ai-panel";

export function StudioApp({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const doc = useDesign((s) => s.doc);
  const present = useDesign((s) => s.present);
  const selection = useDesign((s) => s.selection);
  const brand = useDesign((s) => s.brand);
  const color = useDesign((s) => s.color);
  useShortcuts({ onPalette: () => setPaletteOpen(true) });
  useEffect(() => {
    if (!id) return;
    const s = useDesign.getState();
    if (s.doc?.id !== id) s.open(id);
  }, [id]);

  const selectedNodes = (doc?.nodes ?? []).filter((n): n is DesignNode => selection.includes(n.id));

  const commands = useMemo<CommandItem[]>(() => {
    const s = () => useDesign.getState();
    return [
      { id: "save", label: "Save", group: "File", hint: "Cmd+S", run: () => s().save() },
      { id: "undo", label: "Undo", group: "Edit", hint: "Cmd+Z", run: () => s().undo() },
      { id: "fit", label: "Fit artboard", group: "View", hint: "0", run: () => s().requestFit() },
      { id: "present", label: "Present artboard", group: "View", run: () => s().togglePresent() },
      { id: "select", label: "Select tool", group: "Tools", hint: "V", run: () => s().setTool("select") },
      { id: "pen", label: "Pen", group: "Tools", hint: "P", run: () => s().setTool("pen") },
      { id: "home", label: "Back to templates", group: "File", run: () => void navigate({ to: "/" }) },
    ];
  }, [navigate]);

  if (!doc) {
    return <div className="flex flex-1 items-center justify-center text-ink-dim">Loading artboard</div>;
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
            {selectedNodes.length >= 2 && (
              <div className="px-3">
                <MixedInk nodes={selectedNodes} brandColors={brand.colors} ink={color} />
              </div>
            )}
            <Inspector />
          </div>
          <AiPanel />
        </aside>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <Toaster theme="dark" />
    </div>
  );
}
