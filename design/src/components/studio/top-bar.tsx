import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, Grid3x3, Maximize2, Redo2, Ruler, Save, Scan, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { downloadDataUrl, downloadSvg, exportJpeg, exportPng, slug } from "@/lib/design/export";
import { FORMATS } from "@/lib/design/formats";
import { useDesign } from "@/lib/design/store";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const navigate = useNavigate();
  const doc = useDesign((s) => s.doc);
  const dirty = useDesign((s) => s.dirty);
  const save = useDesign((s) => s.save);
  const undo = useDesign((s) => s.undo);
  const redo = useDesign((s) => s.redo);
  const rename = useDesign((s) => s.rename);
  const resizeArtboard = useDesign((s) => s.resizeArtboard);
  const toggleGrid = useDesign((s) => s.toggleGrid);
  const grid = useDesign((s) => s.grid);
  const toggleRulers = useDesign((s) => s.toggleRulers);
  const rulers = useDesign((s) => s.rulers);
  const toggleSafeArea = useDesign((s) => s.toggleSafeArea);
  const safeArea = useDesign((s) => s.safeArea);
  const zoom = useDesign((s) => s.viewport.zoom);
  const togglePresent = useDesign((s) => s.togglePresent);
  const setPaletteOpen = useDesign((s) => s.setPaletteOpen);
  const [scale, setScale] = useState(2);

  if (!doc) return null;

  function exportFile(kind: "png" | "jpg" | "svg") {
    if (!doc) return;
    save();
    if (kind === "svg") {
      downloadSvg(doc);
    } else if (kind === "jpg") {
      downloadDataUrl(exportJpeg(doc, scale), `${slug(doc.name)}.jpg`);
    } else {
      downloadDataUrl(exportPng(doc, scale), `${slug(doc.name)}.png`);
    }
    toast.success(`Exported ${kind.toUpperCase()}${kind === "svg" ? "" : ` @${scale}×`}`);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2 md:px-3">
      <Button variant="ghost" size="icon-sm" onClick={() => void navigate({ to: "/" })} aria-label="Back">
        <ArrowLeft className="size-4" />
      </Button>
      <input
        value={doc.name}
        onChange={(e) => rename(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none md:max-w-xs"
      />
      {dirty && <span className="hidden font-mono text-[10px] text-ink-faint uppercase md:inline">Unsaved</span>}
      <select
        className="hidden h-8 max-w-[140px] rounded-[8px] border border-border bg-surface-alt px-2 text-xs text-ink md:block"
        value={doc.artboard.formatId}
        onChange={(e) => resizeArtboard(e.target.value, true)}
        aria-label="Magic resize"
      >
        {FORMATS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <span className="hidden font-mono text-[11px] text-ink-faint tabular-nums md:inline">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="icon-sm" onClick={() => setPaletteOpen(true)} aria-label="Command palette">
        <Search className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={toggleGrid} aria-label="Toggle grid" aria-pressed={grid}>
        <Grid3x3 className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={toggleRulers} aria-label="Toggle rulers" aria-pressed={rulers}>
        <Ruler className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={toggleSafeArea} aria-label="Toggle safe area" aria-pressed={safeArea}>
        <Scan className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={togglePresent} aria-label="Present">
        <Maximize2 className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={undo} aria-label="Undo">
        <Undo2 className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={redo} aria-label="Redo">
        <Redo2 className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => save()} aria-label="Save">
        <Save className="size-4" />
      </Button>
      <Button size="sm" onClick={() => exportFile("png")}>
        <Download className="size-3.5" />
        PNG
      </Button>
      <div className="hidden items-center gap-1 sm:flex">
        <select
          className="h-8 rounded-[8px] border border-border bg-surface-alt px-1 font-mono text-[11px] text-ink"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          aria-label="Export scale"
        >
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={3}>3×</option>
        </select>
        <Button size="sm" onClick={() => exportFile("jpg")}>
          JPG
        </Button>
        <Button size="sm" onClick={() => exportFile("svg")}>
          SVG
        </Button>
      </div>
    </header>
  );
}
