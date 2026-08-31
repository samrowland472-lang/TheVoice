import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FORMATS } from "@/lib/design/formats";
import { screenToDoc } from "@/lib/design/render";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CanvasStage } from "./canvas-stage";

export function PresentView() {
  const navigate = useNavigate();
  const doc = useDesign((s) => s.doc);
  const index = useDesign((s) => s.index);
  const save = useDesign((s) => s.save);
  const setPresent = useDesign((s) => s.setPresent);
  const [hot, setHot] = useState<{
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
  } | null>(null);
  const viewport = useDesign((s) => s.viewport);
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
    const next = node?.href
      ? { label: hotspotLabel(node.href), x: node.x, y: node.y, w: node.w, h: node.h, rotation: node.rotation }
      : null;
    e.currentTarget.style.cursor = next ? "pointer" : "default";
    setHot((cur) => (cur?.label === next?.label && cur?.x === next?.x && cur?.y === next?.y ? cur : next));
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
        <span className={cn("ml-auto font-mono text-[10px] uppercase", hot ? "text-phosphor" : "text-ink-faint")}>
          {hot ? hot.label : "Present \u00b7 click or \u2192"}
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <CanvasStage />
        {hot && (
          <div
            className="pointer-events-none absolute border border-phosphor"
            style={{
              left: hot.x * viewport.zoom + viewport.x,
              top: hot.y * viewport.zoom + viewport.y,
              width: hot.w * viewport.zoom,
              height: hot.h * viewport.zoom,
              transform: hot.rotation ? `rotate(${hot.rotation}deg)` : undefined,
              transformOrigin: "center center",
              boxShadow: "0 0 0 1px rgba(63,198,255,0.35), 0 0 12px rgba(63,198,255,0.25)",
            }}
          />
        )}
        <button
          type="button"
          className="absolute inset-0 bg-transparent"
          style={{ cursor: hot ? "pointer" : "default" }}
          aria-label={hot ? `Open ${hot.label}` : "Next frame"}
          onClick={onStageClick}
          onMouseMove={onStageMove}
          onMouseLeave={() => setHot(null)}
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

export function CampaignStrip() {
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
          Campaign \u00b7 story + square + banner
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
