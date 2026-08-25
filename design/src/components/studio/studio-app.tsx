import { useMemo, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
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

export function StudioApp() {
  const { id } = useParams({ from: "/studio/$id" });
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const doc = useDesign((s) => s.doc);
  const present = useDesign((s) => s.present);

  useShortcuts({ onPalette: () => setPaletteOpen(true) });

  const commands = useMemo<CommandItem[]>(() => {
    const s = () => useDesign.getState();
    return [
      { id: "save", label: "Save", group: "File", hint: "⌘S", run: () => s().save() },
      { id: "undo", label: "Undo", group: "Edit", hint: "⌘Z", run: () => s().undo() },
      { id: "redo", label: "Redo", group: "Edit", hint: "⇧⌘Z", run: () => s().redo() },
      { id: "copy", label: "Copy", group: "Edit", hint: "⌘C", run: () => s().copySelected() },
      { id: "paste", label: "Paste", group: "Edit", hint: "⌘V", run: () => s().pasteClipboard() },
      { id: "dup", label: "Duplicate", group: "Edit", hint: "⌘D", run: () => s().duplicateSelected() },
      { id: "dup-link", label: "Linked duplicate", group: "Edit", hint: "⇧⌘D", run: () => s().duplicateLinked() },
      { id: "unlink", label: "Unlink instance", group: "Edit", run: () => s().unlinkSelected() },
      { id: "all", label: "Select all", group: "Edit", hint: "⌘A", run: () => s().selectAll() },
      { id: "del", label: "Delete", group: "Edit", hint: "⌫", run: () => s().removeSelected() },
      { id: "fit", label: "Fit artboard", group: "View", hint: "0", run: () => s().requestFit() },
      { id: "fit-sel", label: "Zoom to selection", group: "View", hint: "⇧0", run: () => s().requestFitSelection() },
      { id: "z1", label: "Zoom 100%", group: "View", hint: "1", run: () => s().requestZoom(1) },
      { id: "z2", label: "Zoom 200%", group: "View", hint: "2", run: () => s().requestZoom(2) },
      { id: "present", label: "Present artboard", group: "View", hint: "⇧P", run: () => s().togglePresent() },
      { id: "grid", label: "Toggle grid", group: "View", run: () => s().toggleGrid() },
      { id: "rulers", label: "Toggle rulers", group: "View", run: () => s().toggleRulers() },
      { id: "safe", label: "Toggle safe area", group: "View", run: () => s().toggleSafeArea() },
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

  // NOTE: truncated for tool size - full file on disk
  return null;
}
