import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { campaignPages } from "@/lib/design/campaign";
import { FORMATS } from "@/lib/design/formats";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";

export function CampaignStrip() {
  const navigate = useNavigate();
  const doc = useDesign((s) => s.doc);
  const index = useDesign((s) => s.index);
  const makeCampaign = useDesign((s) => s.makeCampaign);
  const addCampaignPage = useDesign((s) => s.addCampaignPage);
  const duplicateCampaignPage = useDesign((s) => s.duplicateCampaignPage);
  const unlinkCampaignPage = useDesign((s) => s.unlinkCampaignPage);
  const removeCampaignPage = useDesign((s) => s.removeCampaignPage);
  const renameCampaignPage = useDesign((s) => s.renameCampaignPage);
  const reorderCampaignPages = useDesign((s) => s.reorderCampaignPages);
  const save = useDesign((s) => s.save);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  if (!doc) return null;
  const pages = campaignPages(index, doc.campaignId);
  const used = new Set(pages.map((p) => p.formatId));

  function go(id: string) {
    save();
    void navigate({ to: "/studio/$id", params: { id } });
  }

  function confirmDeleteLast() {
    return window.confirm("Delete the last page in this set? The board will be removed.");
  }

  function moveChip(fromId: string, toId: string) {
    if (!fromId || !toId || fromId === toId) return;
    const ids = pages.map((p) => p.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, fromId);
    reorderCampaignPages(ids);
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
        <div key={p.id} className="relative shrink-0">
          {renaming === p.id ? (
            <input
              autoFocus
              className="h-7 w-28 rounded-[8px] border border-phosphor bg-surface px-2 font-mono text-[10px] text-ink"
              value={draft}
              aria-label="Rename campaign page"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                renameCampaignPage(p.id, draft);
                setRenaming(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  renameCampaignPage(p.id, draft);
                  setRenaming(null);
                }
                if (e.key === "Escape") setRenaming(null);
              }}
            />
          ) : (
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                setDragging(p.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", p.id);
                setMenuId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromId = e.dataTransfer.getData("text/plain") || dragging;
                moveChip(fromId, p.id);
                setDragging(null);
              }}
              onDragEnd={() => setDragging(null)}
              onClick={() => go(p.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                setRenaming(p.id);
                setDraft(p.name ?? shortFormat(p.formatId));
                setMenuId(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenuId(menuId === p.id ? null : p.id);
              }}
              className={cn(
                "h-7 shrink-0 cursor-grab rounded-[8px] px-2 font-mono text-[10px] uppercase tracking-wide active:cursor-grabbing",
                p.id === doc.id ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:text-ink",
                dragging === p.id && "opacity-50",
              )}
              aria-haspopup="menu"
              aria-expanded={menuId === p.id}
            >
              {shortFormat(p.formatId)}
            </button>
          )}
          {menuId === p.id && (
            <div role="menu" className="absolute left-0 top-8 z-30 min-w-36 border border-border bg-surface py-1 shadow-lg">
              <button type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor" onClick={() => { setRenaming(p.id); setDraft(p.name ?? shortFormat(p.formatId)); setMenuId(null); }}>Rename</button>
              <button type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor" onClick={() => { const pageId = duplicateCampaignPage(); setMenuId(null); if (pageId) go(pageId); }}>Duplicate</button>
              <button type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor" onClick={() => { unlinkCampaignPage(p.id); setMenuId(null); }}>Unlink</button>
              <button type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor" onClick={() => {
                if (pages.length <= 1 && !confirmDeleteLast()) { setMenuId(null); return; }
                const next = removeCampaignPage(p.id);
                setMenuId(null);
                if (next) go(next);
                else void navigate({ to: "/" });
              }}>Delete page</button>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="h-7 shrink-0 rounded-[8px] px-2 font-mono text-[10px] uppercase tracking-wide text-ink-faint hover:text-phosphor" onClick={() => { const pageId = duplicateCampaignPage(); if (pageId) go(pageId); }} aria-label="Duplicate campaign page">Duplicate</button>
      <select className="h-7 rounded-[8px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-ink-dim" value="" aria-label="Add campaign page" onChange={(e) => { const id = e.target.value; if (!id) return; const pageId = addCampaignPage(id); if (pageId) go(pageId); }}>
        <option value="">+ page</option>
        {FORMATS.filter((f) => !used.has(f.id)).map((f) => (
          <option key={f.id} value={f.id}>{f.label}</option>
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
