import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommandPalette, type CommandItem } from "./command-palette";
import { AiPanel } from "./ai-panel";
import { CanvasStage } from "./canvas-stage";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { PaintDock } from "./paint-dock";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";
import { useShortcuts } from "./use-shortcuts";

export function StudioApp({ id }: { id: string }) {
  const navigate = useNavigate();
  const open = useDesign((s) => s.open);
  const doc = useDesign((s) => s.doc);
  const save = useDesign((s) => s.save);
  const present = useDesign((s) => s.present);
  const paletteOpen = useDesign((s) => s.paletteOpen);
  const setPaletteOpen = useDesign((s) => s.setPaletteOpen);
  const setPresent = useDesign((s) => s.setPresent);
  const [pane, setPane] = useState<"layers" | "inspect" | "ai">("inspect");
  useShortcuts();

  useEffect(() => {
    open(id);
    if (!useDesign.getState().doc) {
      void navigate({ to: "/" });
    }
  }, [id, open, navigate]);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (useDesign.getState().dirty) useDesign.getState().save();
    }, 8000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const onLeave = () => {
      if (useDesign.getState().dirty) save();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [save]);

  const commands = useMemo<CommandItem[]>(() => {
    const s = () => useDesign.getState();
    return [
      { id: "save", label: "Save", group: "File", hint: "⌘S", run: () => s().save() },
      { id: "undo", label: "Undo", group: "Edit", hint: "⌘Z", run: () => s().undo() },
      { id: "redo", label: "Redo", group: "Edit", hint: "⇧⌘Z", run: () => s().redo() },
      { id: "copy", label: "Copy", group: "Edit", hint: "⌘C", run: () => s().copySelected() },
      { id: "paste", label: "Paste", group: "Edit", hint: "⌘V", run: () => s().pasteClipboard() },
      { id: "dup", label: "Duplicate", group: "Edit", hint: "⌘D", run: () => s().duplicateSelected() },
      { id: "all", label: "Select all", group: "Edit", hint: "⌘A", run: () => s().selectAll() },
      { id: "del", label: "Delete", group: "Edit", hint: "⌫", run: () => s().removeSelected() },
      { id: "fit", label: "Fit artboard", group: "View", hint: "0", run: () => s().requestFit() },
      { id: "z1", label: "Zoom 100%", group: "View", hint: "1", run: () => s().requestZoom(1) },
      { id: "z2", label: "Zoom 200%", group: "View", hint: "2", run: () => s().requestZoom(2) },
      { id: "present", label: "Present artboard", group: "View", hint: "⇧P", run: () => s().togglePresent() },
      { id: "grid", label: "Toggle grid", group: "View", run: () => s().toggleGrid() },
      { id: "rulers", label: "Toggle rulers", group: "View", run: () => s().toggleRulers() },
      { id: "clearguides", label: "Clear guides", group: "View", run: () => s().clearGuides() },
      { id: "snap", label: "Toggle snap", group: "View", run: () => s().toggleSnap() },
      { id: "fliph", label: "Flip horizontal", group: "Arrange", run: () => s().flipSelected("h") },
      { id: "flipv", label: "Flip vertical", group: "Arrange", run: () => s().flipSelected("v") },
      { id: "r90", label: "Rotate 90°", group: "Arrange", run: () => s().rotateSelected(90) },
      { id: "front", label: "Bring to front", group: "Arrange", run: () => s().bringSelected("top") },
      { id: "back", label: "Send to back", group: "Arrange", run: () => s().bringSelected("bottom") },
      { id: "select", label: "Select tool", group: "Tools", hint: "V", run: () => s().setTool("select") },
      { id: "rect", label: "Rectangle", group: "Tools", hint: "R", run: () => s().setTool("rect") },
      { id: "ellipse", label: "Ellipse", group: "Tools", hint: "O", run: () => s().setTool("ellipse") },
      { id: "text", label: "Text", group: "Tools", hint: "T", run: () => s().setTool("text") },
      { id: "brush", label: "Brush", group: "Tools", hint: "B", run: () => s().setTool("brush") },
      { id: "pen", label: "Pen", group: "Tools", hint: "P", run: () => s().setTool("pen") },
      { id: "pen-close", label: "Close path", group: "Tools", hint: "Enter", run: () => s().closeSelectedPath() },
      { id: "pen-pop", label: "Undo last pen point", group: "Tools", hint: "⌫", run: () => s().popLastPathPoint() },
      { id: "image", label: "Place image", group: "Tools", run: () => s().setTool("image") },
      { id: "home", label: "Back to templates", group: "File", run: () => void navigate({ to: "/" }) },
    ];
  }, [navigate]);

  if (!doc) {
    return (
      <div className="flex flex-1 items-center justify-center text-ink-dim">
        Loading artboard…
      </div>
    );
  }

  if (present) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-ground">
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
          <Button size="sm" onClick={() => setPresent(false)}>
            Exit
          </Button>
          <span className="truncate text-sm text-ink">{doc.name}</span>
          <span className="ml-auto font-mono text-[10px] text-ink-faint uppercase">Present · Esc</span>
        </div>
        <CanvasStage />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
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
        <aside className="flex max-h-[38vh] w-full shrink-0 flex-col border-t border-border bg-surface md:max-h-none md:w-[280px] md:border-t-0 md:border-l">
          <div className="flex border-b border-border md:hidden">
            {(["layers", "inspect", "ai"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPane(id)}
                className={cn(
                  "h-10 flex-1 text-xs font-medium capitalize",
                  pane === id ? "text-phosphor" : "text-ink-dim",
                )}
              >
                {id === "ai" ? "Director" : id}
              </button>
            ))}
          </div>
          <div className={cn("min-h-0 flex-1 overflow-auto md:contents", pane !== "layers" && "hidden md:flex md:flex-col")}>
            <LayersPanel />
          </div>
          <div className={cn("min-h-0 flex-1 overflow-auto md:contents", pane !== "inspect" && "hidden md:block")}>
            <Inspector />
          </div>
          <div className={cn("min-h-0 flex-1 overflow-auto md:contents", pane !== "ai" && "hidden md:block")}>
            <AiPanel />
          </div>
        </aside>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "#121613",
            border: "1px solid #263029",
            color: "#d9f5e3",
          },
        }}
      />
    </div>
  );
}
