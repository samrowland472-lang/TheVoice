import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { FORMATS } from "@/lib/design/formats";
import { screenToDoc } from "@/lib/design/render";
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

  if (!doc) {
    return (
      <div className="flex flex-1 items-center justify-center text-ink-dim">
        Loading artboard…
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
            className={cn(
              "h-12 flex-1 text-xs font-medium capitalize",
              sheet === id ? "text-phosphor" : "text-ink-dim",
            )}
          >
            {id === "ai" ? "Director" : id === "inspect" ? "Inspect" : "Layers"}
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
              {sheet === "inspect" && <Inspector />}
              {sheet === "ai" && <AiPanel />}
            </div>
          </div>
        </div>
      )}
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

function PresentView() {
  const navigate = useNavigate();
  const doc = useDesign((s) => s.doc);
  const index = useDesign((s) => s.index);
  const save = useDesign((s) => s.save);
  const setPresent = useDesign((s) => s.setPresent);
  const [hint, setHint] = useState<string | null>(null);
  if (!doc) return null;
  const live = doc;
  const pages = live.campaignId ? index.filter((p) => p.campaignId === live.campaignId) : [{ id: live.id, name: live.name }];
  const i = Math.max(0, pages.findIndex((p) => p.id === live.id));

  function go(delta: number) {
    const next = pages[i + delta];
    if (!next) return;
    save();
    void navigate({ to: "/studio/$id", params: { id: next.id } });
  }

  function follow(href: string) {
    if (href.startsWith("doc:")) {
      const id = href.slice(4);
      if (!id || id === live.id) return;
      save();
      void navigate({ to: "/studio/$id", params: { id } });
      return;
    }
    if (href.startsWith("https://") || href.startsWith("http://")) {
      window.open(href, "_blank", "noopener");
    }
  }

  function hotspotAt(e: MouseEvent<HTMLButtonElement>) {
    const viewport = useDesign.getState().viewport;
    const rect = e.currentTarget.getBoundingClientRect();
    const d = screenToDoc(e.clientX - rect.left, e.clientY - rect.top, viewport);
    for (let n = live.nodes.length - 1; n >= 0; n--) {
      const node = live.nodes[n]!;
      if (!node.visible || !node.href) continue;
      if (d.x >= node.x && d.x <= node.x + node.w && d.y >= node.y && d.y <= node.y + node.h) return node;
    }
    return null;
  }

  function hotspotLabel(href: string) {
    if (href.startsWith("doc:")) {
      const id = href.slice(4);
      return index.find((p) => p.id === id)?.name ?? "Frame";
    }
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return href;
    }
  }

  function onStageClick(e: MouseEvent<HTMLButtonElement>) {
    const node = hotspotAt(e);
    if (node?.href) {
      follow(node.href);
      return;
    }
    go(1);
  }

  function onStageMove(e: MouseEvent<HTMLButtonElement>) {
    const node = hotspotAt(e);
    const next = node?.href ? hotspotLabel(node.href) : null;
    e.currentTarget.style.cursor = next ? "pointer" : "default";
    setHint((cur) => (cur === next ? cur : next));
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ground">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Button size="sm" onClick={() => setPresent(false)}>
          Exit
        </Button>
        <span className="truncate text-sm text-ink">{doc.name}</span>
        {pages.length > 1 && (
          <span className="font-mono text-[10px] text-ink-faint">
            {i + 1} / {pages.length}
          </span>
        )}
        <span className={cn("ml-auto font-mono text-[10px] uppercase", hint ? "text-phosphor" : "text-ink-faint")}>
          {hint ? hint : "Present · click or →"}
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <CanvasStage />
        <button
          type="button"
          className="absolute inset-0 bg-transparent"
          style={{ cursor: hint ? "pointer" : "default" }}
          aria-label={hint ? `Open ${hint}` : "Next frame"}
          onClick={onStageClick}
          onMouseMove={onStageMove}
          onMouseLeave={() => setHint(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            go(-1);
          }}
        />
      </div>
      {(doc.notes || pages.length > 1) && (
        <div className="flex shrink-0 items-start gap-3 border-t border-border bg-surface px-4 py-3">
          <p className="min-w-0 flex-1 text-sm text-ink-dim whitespace-pre-wrap">{doc.notes || "No notes"}</p>
          {pages.length > 1 && (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" disabled={i <= 0} onClick={() => go(-1)}>
                Prev
              </Button>
              <Button size="sm" variant="ghost" disabled={i >= pages.length - 1} onClick={() => go(1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignStrip() {
  const navigate = useNavigate();
  const doc = useDesign((s) => s.doc);
  const index = useDesign((s) => s.index);
  const makeCampaign = useDesign((s) => s.makeCampaign);
  const addCampaignPage = useDesign((s) => s.addCampaignPage);
  const save = useDesign((s) => s.save);
  if (!doc) return null;
  const pages = doc.campaignId ? index.filter((p) => p.campaignId === doc.campaignId) : [];
  const used = new Set(pages.map((p) => p.formatId));

  function go(id: string) {
    save();
    void navigate({ to: "/studio/$id", params: { id } });
  }

  if (!doc.campaignId) {
    return (
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
        <button
          type="button"
          className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase hover:text-phosphor"
          onClick={() => makeCampaign()}
        >
          Campaign · story + square + banner
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2">
      {pages.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => go(p.id)}
          className={cn(
            "h-7 shrink-0 rounded-[8px] px-2 font-mono text-[10px] uppercase tracking-wide",
            p.id === doc.id ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:text-ink",
          )}
        >
          {shortFormat(p.formatId)}
        </button>
      ))}
      <select
        className="h-7 rounded-[8px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-ink-dim"
        value=""
        aria-label="Add campaign page"
        onChange={(e) => {
          const id = e.target.value;
          if (!id) return;
          const pageId = addCampaignPage(id);
          if (pageId) go(pageId);
        }}
      >
        <option value="">+ page</option>
        {FORMATS.filter((f) => !used.has(f.id)).map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function shortFormat(id: string) {
  if (id === "ig-story" || id === "tiktok") return "Story";
  if (id === "ig-post" || id === "square" || id === "album") return "Square";
  if (id === "x-post" || id === "linkedin" || id === "wide") return "Banner";
  return FORMATS.find((f) => f.id === id)?.label ?? id;
}

