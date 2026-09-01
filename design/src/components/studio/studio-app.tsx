import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";
import { CommandPalette, type CommandItem } from "./command-palette";
import { AiPanel } from "./ai-panel";
import { CanvasStage } from "./canvas-stage";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { MixedInk } from "./mixed-ink";
import { MixedType } from "./mixed-type";
import type { DesignNode, TextNode } from "@/lib/design/types";
import { PaintDock } from "./paint-dock";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";
import { useShortcuts } from "./use-shortcuts";
import { CampaignStrip, PresentView } from "./present-chrome";

export function StudioApp({ id }: { id: string }) {
  const navigate = useNavigate();
  const open = useDesign((s) => s.open);
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const brand = useDesign((s) => s.brand);
  const color = useDesign((s) => s.color);
  const save = useDesign((s) => s.save);
  const present = useDesign((s) => s.present);
  const paletteOpen = useDesign((s) => s.paletteOpen);
  const setPaletteOpen = useDesign((s) => s.setPaletteOpen);
  const [sheet, setSheet] = useState<"layers" | "inspect" | "ai" | null>(null);
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
      { id: "save", label: "Save", group: "File", hint: "Cmd+S", run: () => s().save() },
      { id: "undo", label: "Undo", group: "Edit", hint: "Cmd+Z", run: () => s().undo() },
      { id: "fit", label: "Fit artboard", group: "View", hint: "0", run: () => s().requestFit() },
      { id: "present", label: "Present artboard", group: "View", run: () => s().togglePresent() },
      { id: "select", label: "Select tool", group: "Tools", hint: "V", run: () => s().setTool("select") },
      { id: "pen", label: "Pen", group: "Tools", hint: "P", run: () => s().setTool("pen") },
      { id: "knife", label: "Knife — cut a path segment", group: "Tools", hint: "K", run: () => s().setTool("knife") },
      { id: "home", label: "Back to templates", group: "File", run: () => void navigate({ to: "/" }) },
    ];
  }, [navigate]);

  const selectedNodes = (doc?.nodes ?? []).filter((n): n is DesignNode => selection.includes(n.id));
  const selectedText = selectedNodes.filter((n): n is TextNode => n.kind === "text");

  if (!doc) {
    return (
      <div className="flex flex-1 items-center justify-center text-ink-dim">
        Loading artboard
      </div>
    );
  }

  if (present) {
    return <PresentView />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ground">
      <TopBar />
      <CampaignStrip />
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
                {selectedText.length >= 2 && <MixedType nodes={selectedText} />}
              </div>
            )}
            <Inspector />
          </div>
          <AiPanel />
        </aside>
      </div>
      <div className="flex shrink-0 border-t border-border md:hidden">
        {(["layers", "inspect", "ai"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSheet(sheet === tab ? null : tab)}
            className={cn(
              "h-12 flex-1 text-xs font-medium capitalize",
              sheet === tab ? "text-phosphor" : "text-ink-dim",
            )}
          >
            {tab === "ai" ? "Director" : tab === "inspect" ? "Inspect" : "Layers"}
          </button>
        ))}
      </div>
      {sheet && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-ground/70" aria-label="Close sheet" onClick={() => setSheet(null)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[75vh] flex-col rounded-t-[20px] border-t border-border bg-surface">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="font-mono text-[10px] tracking-[0.2em] text-phosphor uppercase">
                {sheet === "ai" ? "Director" : sheet === "inspect" ? "Inspect" : "Layers"}
              </span>
              <button type="button" className="text-xs text-ink-dim" onClick={() => setSheet(null)}>
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {sheet === "layers" && <LayersPanel />}
              {sheet === "inspect" && (
                <>
                  {selectedNodes.length >= 2 && (
                    <div className="px-3">
                      <MixedInk nodes={selectedNodes} brandColors={brand.colors} ink={color} />
                      {selectedText.length >= 2 && <MixedType nodes={selectedText} />}
                    </div>
                  )}
                  <Inspector />
                </>
              )}
              {sheet === "ai" && <AiPanel />}
            </div>
          </div>
        </div>
      )}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <Toaster theme="dark" />
    </div>
  );
}
