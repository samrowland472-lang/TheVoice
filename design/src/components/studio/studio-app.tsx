import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Toaster } from "sonner";
import {
  convertSelectedShapeToPath,
  convertSelectedTextToPath,
  offsetSelectedPath,
  outlineSelectedStroke,
  roundSelectedPathCorners,
  simplifySelectedPath,
} from "@/lib/design/offset-actions";
import { watchFontsForWrapCache } from "@/lib/design/watch-fonts";
import { bleedMmToPx } from "@/lib/design/print-marks";
import { GUIDE_LOOK_PRESETS } from "@/lib/design/guide-style";
import { setStudioStatus } from "@/lib/design/studio-status";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";
import { CommandPalette, type CommandItem } from "./command-palette";
import { AiPanel } from "./ai-panel";
import CanvasStage from "./canvas-stage";
import { RulerLayer } from "./ruler-layer";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { MixedInk } from "./mixed-ink";
import { MixedType } from "./mixed-type";
import type { DesignNode, TextNode } from "@/lib/design/types";
import { PaintDock } from "./paint-dock";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";
import { useShortcuts } from "./use-shortcuts";
import { CampaignStrip } from "./campaign-strip";
import { StudioStatusStrip } from "./studio-status-strip";
import { PresentView } from "./present-chrome";

export function StudioApp({ id }: { id: string }) {
  const navigate = useNavigate();
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const present = useDesign((s) => s.present);
  const paletteOpen = useDesign((s) => s.paletteOpen);
  const setPaletteOpen = useDesign((s) => s.setPaletteOpen);
  const save = useDesign((s) => s.save);

  useEffect(() => {
    watchFontsForWrapCache();
  }, []);

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (useDesign.getState().dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [save]);

  const commands = useMemo<CommandItem[]>(() => {
    const s = () => useDesign.getState();
    return [
      { id: "save", label: "Save", group: "File", hint: "Cmd+S", run: () => s().save() },
      { id: "undo", label: "Undo", group: "Edit", hint: "Cmd+Z", run: () => s().undo() },
      { id: "duplicate", label: "Duplicate selection", group: "Edit", hint: "Cmd+D", run: () => s().duplicateSelected() },
      { id: "copy", label: "Copy selection", group: "Edit", hint: "Cmd+C", run: () => s().copySelected() },
      { id: "cut", label: "Cut selection", group: "Edit", hint: "Cmd+X", run: () => s().cutSelected() },
      { id: "paste", label: "Paste", group: "Edit", hint: "Cmd+V", run: () => s().pasteClipboard() },
      { id: "copy-opacity", label: "Copy opacity", group: "Edit", hint: "Cmd+Shift+C", run: () => s().copyOpacity() },
      { id: "paste-opacity", label: "Paste opacity", group: "Edit", hint: "Cmd+Shift+V", run: () => s().pasteOpacity() },
      { id: "copy-style", label: "Copy style", group: "Edit", hint: "Cmd+Alt+C", run: () => s().copyStyle() },
      { id: "paste-style", label: "Paste style", group: "Edit", hint: "Cmd+Alt+V", run: () => s().pasteStyle() },
      { id: "fit", label: "Fit artboard", group: "View", hint: "0", run: () => s().requestFit() },
      { id: "present", label: "Present artboard", group: "View", hint: "Shift+P", run: () => s().togglePresent() },
      {
        id: "present-full",
        label: "Fullscreen present (keep campaign rail)",
        group: "View",
        hint: "F in present",
        run: () => {
          s().setPresent(true);
        },
      },
      { id: "safe-area", label: "Show / hide safe area", group: "View", run: () => s().toggleSafeArea() },
      { id: "print-marks", label: "Show / hide print marks", group: "Print", run: () => s().togglePrintMarks() },
      { id: "select", label: "Select tool", group: "Tools", hint: "V", run: () => s().setTool("select") },
      { id: "pen", label: "Pen", group: "Tools", hint: "P", run: () => s().setTool("pen") },
      { id: "knife", label: "Knife — cut a path segment", group: "Tools", hint: "K", run: () => s().setTool("knife") },
      { id: "polygon", label: "Polygon", group: "Tools", hint: "G", run: () => s().setTool("polygon") },
      { id: "star", label: "Star", group: "Tools", hint: "S", run: () => s().setTool("star") },
      { id: "arrow", label: "Arrow", group: "Tools", hint: "A", run: () => s().setTool("arrow") },
      { id: "image", label: "Image", group: "Tools", hint: "M", run: () => s().setTool("image") },
      { id: "type-to-path", label: "Convert type to path", group: "Path", run: () => convertSelectedTextToPath() },
      { id: "shape-to-path", label: "Convert shape to path", group: "Path", run: () => convertSelectedShapeToPath() },
      { id: "outline", label: "Outline stroke", group: "Path", run: () => outlineSelectedStroke() },
      { id: "offset-out", label: "Offset path out", group: "Path", run: () => offsetSelectedPath("out") },
      { id: "offset-in", label: "Offset path in", group: "Path", run: () => offsetSelectedPath("in") },
      { id: "round-corners", label: "Round path corners", group: "Path", run: () => roundSelectedPathCorners() },
      { id: "simplify", label: "Simplify path", group: "Path", run: () => simplifySelectedPath() },
      { id: "home", label: "Back to templates", group: "File", run: () => void navigate({ to: "/" }) },
      { id: "bleed-none", label: "Bleed none", group: "Print", run: () => s().setBleed(0) },
      { id: "bleed-3mm", label: "Bleed 3 mm", group: "Print", run: () => s().setBleed(bleedMmToPx(3)) },
      { id: "bleed-6mm", label: "Bleed 6 mm", group: "Print", run: () => s().setBleed(bleedMmToPx(6)) },
      { id: "reset-guide-colors", label: "Reset guide colors", group: "Print", run: () => s().resetGuideColors?.() },
      { id: "reset-guide-dashes", label: "Reset guide dashes", group: "Print", run: () => s().resetGuideDashes?.() },
      { id: "clear-guide-names", label: "Clear guide names", group: "Print", run: () => s().clearGuideLabels?.() },
      ...GUIDE_LOOK_PRESETS.map((preset) => ({
        id: `guide-preset-${preset.id}`,
        label: `Guide preset: ${preset.label}`,
        group: "Print",
        run: () => {
          s().setSelectedGuidesColor?.(preset.color);
          s().setSelectedGuidesDash?.(preset.dash);
          setStudioStatus(`Guide preset: ${preset.label}`);
        },
      })),
      {
        id: "guide-look-reset",
        label: "Reset guide look (color + dash)",
        group: "Print",
        run: () => {
          s().setSelectedGuidesColor?.(undefined);
          s().setSelectedGuidesDash?.(undefined);
          setStudioStatus("Guide look cleared");
        },
      },
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
          <div className="relative min-h-0 flex-1">
            <CanvasStage />
            <RulerLayer />
          </div>
          <PaintDock />
        </div>
        <div className="flex w-full shrink-0 flex-col border-t border-border md:w-[320px] md:border-t-0 md:border-l">
          <LayersPanel />
          <Inspector />
          {selectedNodes.length > 1 && (
            <MixedInk
              nodes={selectedNodes}
              brandColors={useDesign.getState().brand.colors}
              ink={useDesign.getState().color}
            />
          )}
          {selectedText.length > 0 && <MixedType nodes={selectedText} />}
          <AiPanel />
        </div>
      </div>
      <StudioStatusStrip />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
