import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Crop, Download, Grid3x3, Maximize2, Redo2, Ruler, Save, Scan, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { campaignDocsFromIndex, downloadCampaignPdf, downloadCampaignSvg } from "@/lib/design/export-campaign";
import { downloadDataUrl, downloadPrintPdf, downloadSvg, exportJpeg, exportPng, exportPrintPng, slug } from "@/lib/design/export";
import {
  cropIsolateDocument,
  cropSelectionDocument,
  isolateDocument,
  selectionDocument,
} from "@/lib/design/selection-document";
import { FORMATS } from "@/lib/design/formats";
import { markStayOnHub } from "@/lib/design/persist";
import { useDesign } from "@/lib/design/store";
import { Button } from "@/components/ui/button";

function svgGroupExportNote(nodes: { kind: string; opacity: number; blend: string; visible: boolean; rotation?: number }[]) {
  const groups = nodes.filter((n) => n.kind === "group");
  if (!groups.length) return "";
  const rides = groups.some((n) => n.opacity !== 1);
  const isolated = groups.some((n) => n.blend && n.blend !== "source-over");
  const turned = groups.some((n) => n.rotation);
  const hoisted = groups.some(
    (n) => !n.visible && (n.opacity !== 1 || (n.blend && n.blend !== "source-over") || Boolean(n.rotation)),
  );
  return ` · ${groups.length} group${groups.length === 1 ? "" : "s"} wrapped${rides ? " · opacity rides the group" : ""}${isolated ? " · blend isolated" : ""}${turned ? " · rotation rides the group" : ""}${hoisted ? " · hidden nest keeps opacity on PNG" : ""}`;
}

export function TopBar() {
  const navigate = useNavigate();
  const doc = useDesign((s) => s.doc);
  const index = useDesign((s) => s.index);
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
  const togglePrintMarks = useDesign((s) => s.togglePrintMarks);
  const printMarks = useDesign((s) => s.printMarks);
  const zoom = useDesign((s) => s.viewport.zoom);
  const togglePresent = useDesign((s) => s.togglePresent);
  const setPaletteOpen = useDesign((s) => s.setPaletteOpen);
  const selection = useDesign((s) => s.selection);
  const isolateSnapshot = useDesign((s) => s.isolateSnapshot);
  const [scale, setScale] = useState(2);
  const [exportOpen, setExportOpen] = useState(false);

  if (!doc) return null;

  function exportFile(
    kind:
      | "png"
      | "jpg"
      | "svg"
      | "print"
      | "pdf"
      | "campaign-svg"
      | "campaign-pdf"
      | "sel-png"
      | "sel-svg"
      | "crop-png"
      | "crop-svg"
      | "iso-png"
      | "iso-svg"
      | "iso-crop-png"
      | "iso-crop-svg",
  ) {
    if (!doc) return;
    save();
    const campaign = campaignDocsFromIndex(index, doc);
    if (
      kind === "sel-png" ||
      kind === "sel-svg" ||
      kind === "crop-png" ||
      kind === "crop-svg" ||
      kind === "iso-png" ||
      kind === "iso-svg" ||
      kind === "iso-crop-png" ||
      kind === "iso-crop-svg"
    ) {
      const slice =
        kind === "iso-crop-png" || kind === "iso-crop-svg"
          ? cropIsolateDocument(doc)
          : kind === "iso-png" || kind === "iso-svg"
            ? isolateDocument(doc)
            : kind === "crop-png" || kind === "crop-svg"
              ? cropSelectionDocument(doc, selection)
              : selectionDocument(doc, selection);
      if (!slice) {
        toast.error(kind.startsWith("iso") ? "Isolate a layer first" : "Select a layer first");
        return;
      }
      if (kind.endsWith("svg")) downloadSvg(slice);
      else downloadDataUrl(exportPng(slice, scale), `${slug(slice.name)}.png`);
      const label = kind.startsWith("iso-crop")
        ? "isolate crop"
        : kind.startsWith("iso")
          ? "isolate"
          : kind.startsWith("crop")
            ? "crop"
            : "selection";
      toast.success(
        kind.endsWith("svg")
          ? `Exported ${label} SVG · ${slice.nodes.length} layer${slice.nodes.length === 1 ? "" : "s"}${svgGroupExportNote(slice.nodes)}`
          : `Exported ${label} PNG @${scale}× · ${slice.artboard.width}×${slice.artboard.height}`,
      );
      setExportOpen(false);
      return;
    }
    if (kind === "svg") {
      downloadSvg(doc);
    } else if (kind === "jpg") {
      downloadDataUrl(exportJpeg(doc, scale), `${slug(doc.name)}.jpg`);
    } else if (kind === "print") {
      downloadDataUrl(exportPrintPng(doc), `${slug(doc.name)}-print.png`);
    } else if (kind === "pdf") {
      downloadPrintPdf(doc);
    } else if (kind === "campaign-svg") {
      downloadCampaignSvg(campaign, doc.name);
    } else if (kind === "campaign-pdf") {
      downloadCampaignPdf(campaign, doc.name, scale);
    } else {
      downloadDataUrl(exportPng(doc, scale), `${slug(doc.name)}.png`);
    }
    toast.success(
      kind === "campaign-pdf"
        ? `Exported campaign PDF · ${campaign.length} boards`
        : kind === "campaign-svg"
          ? `Exported campaign SVG · ${campaign.length} boards`
          : kind === "pdf"
            ? "Exported print PDF"
            : kind === "print"
              ? "Exported print PNG @4×"
              : kind === "svg"
                ? `Exported SVG${svgGroupExportNote(doc.nodes)}`
                : `Exported ${kind.toUpperCase()} @${scale}×`,
    );
    setExportOpen(false);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-2 md:gap-2 md:px-3">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          markStayOnHub();
          void navigate({ to: "/" });
        }}
        aria-label="Back"
      >
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
      <div className="hidden items-center gap-1 md:flex">
        <Button variant="ghost" size="icon-sm" onClick={toggleGrid} aria-label="Toggle grid" aria-pressed={grid}>
          <Grid3x3 className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={toggleRulers} aria-label="Toggle rulers" aria-pressed={rulers}>
          <Ruler className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={toggleSafeArea} aria-label="Toggle safe area" aria-pressed={safeArea}>
          <Scan className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={togglePrintMarks} aria-label="Toggle print marks" aria-pressed={printMarks}>
          <Crop className="size-4" />
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
      </div>
      <div className="relative">
        <Button size="sm" onClick={() => setExportOpen((v) => !v)} aria-expanded={exportOpen} aria-label="Export">
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        {exportOpen && (
          <div className="absolute top-11 right-0 z-40 w-44 rounded-[12px] border border-border bg-surface p-2 shadow-lg">
            <select
              className="mb-2 h-8 w-full rounded-[8px] border border-border bg-surface-alt px-1 font-mono text-[11px] text-ink"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              aria-label="Export scale"
            >
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={3}>3×</option>
            </select>
            <Button size="sm" className="mb-1 w-full" onClick={() => exportFile("png")}>
              PNG
            </Button>
            <Button size="sm" className="mb-1 w-full" onClick={() => exportFile("jpg")}>
              JPG
            </Button>
            <Button size="sm" className="mb-1 w-full" onClick={() => exportFile("svg")}>
              SVG
            </Button>
            <Button
              size="sm"
              className="mb-1 w-full"
              disabled={selection.length === 0}
              onClick={() => exportFile("sel-png")}
            >
              Selection PNG
            </Button>
            <Button
              size="sm"
              className="mb-1 w-full"
              disabled={selection.length === 0}
              onClick={() => exportFile("sel-svg")}
            >
              Selection SVG
            </Button>
            <Button
              size="sm"
              className="mb-1 w-full"
              disabled={selection.length === 0}
              onClick={() => exportFile("crop-png")}
            >
              Crop PNG
            </Button>
            <Button
              size="sm"
              className="mb-1 w-full"
              disabled={selection.length === 0}
              onClick={() => exportFile("crop-svg")}
            >
              Crop SVG
            </Button>
            <Button
              size="sm"
              className="mb-1 w-full"
              disabled={!isolateSnapshot}
              onClick={() => exportFile("iso-png")}
            >
              Isolate PNG
            </Button>
            <Button
              size="sm"
              className="mb-1 w-full"
              disabled={!isolateSnapshot}
              onClick={() => exportFile("iso-svg")}
            >
              Isolate SVG
            </Button>
            <Button
              size="sm"
              className="mb-1 w-full"
              disabled={!isolateSnapshot}
              onClick={() => exportFile("iso-crop-png")}
            >
              Isolate crop PNG
            </Button>
            <Button
              size="sm"
              className="mb-1 w-full"
              disabled={!isolateSnapshot}
              onClick={() => exportFile("iso-crop-svg")}
            >
              Isolate crop SVG
            </Button>
            <Button size="sm" className="mb-1 w-full" variant="primary" onClick={() => exportFile("print")}>
              Print PNG
            </Button>
            <Button size="sm" className="w-full" variant="primary" onClick={() => exportFile("pdf")}>
              Print PDF
            </Button>
            {doc.campaignId && (
              <>
                <Button size="sm" className="mt-1 w-full" onClick={() => exportFile("campaign-svg")}>
                  Campaign SVG
                </Button>
                <Button size="sm" className="mt-1 w-full" variant="primary" onClick={() => exportFile("campaign-pdf")}>
                  Campaign PDF
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
