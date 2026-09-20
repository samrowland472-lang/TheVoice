import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FORMATS } from "@/lib/design/formats";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";

type Page = { id: string; name?: string; formatId: string };

function shortFormat(id: string) {
  if (id === "ig-story" || id === "tiktok") return "Story";
  if (id === "ig-post" || id === "square" || id === "album") return "Square";
  if (id === "x-post" || id === "linkedin" || id === "wide") return "Banner";
  return FORMATS.find((f) => f.id === id)?.label ?? id;
}

export function PresentChipRail({
  pages,
  liveId,
  onGo,
}: {
  pages: Page[];
  liveId: string;
  onGo: (id: string) => void;
}) {
  const navigate = useNavigate();
  const save = useDesign((s) => s.save);
  const setPresent = useDesign((s) => s.setPresent);
  const unlinkCampaignPage = useDesign((s) => s.unlinkCampaignPage);
  const removeCampaignPage = useDesign((s) => s.removeCampaignPage);
  const duplicateCampaignPage = useDesign((s) => s.duplicateCampaignPage);
  const renameCampaignPage = useDesign((s) => s.renameCampaignPage);
  const reorderCampaignPages = useDesign((s) => s.reorderCampaignPages);
  const nudgeCampaignPage = useDesign((s) => s.nudgeCampaignPage);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

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

  return (
    <div className="mx-1 flex items-center gap-1" role="tablist" aria-label="Campaign pages">
      {pages.map((p, n) => (
        <div key={p.id} className="relative">
          {renaming === p.id ? (
            <input
              autoFocus
              className="h-6 w-24 rounded-[6px] border border-phosphor bg-surface px-1.5 font-mono text-[10px] text-ink"
              value={draft}
              aria-label="Rename campaign page"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                renameCampaignPage(p.id, draft);
                setRenaming(null);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
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
              role="tab"
              aria-selected={p.id === liveId}
              aria-haspopup="menu"
              aria-expanded={menuId === p.id}
              aria-label={`${p.name ?? shortFormat(p.formatId)} (${n + 1} of ${pages.length})`}
              title={`${p.name ?? shortFormat(p.formatId)} — drag or Alt+Left / Alt+Right to reorder`}
              tabIndex={0}
              draggable
              className={cn(
                "h-2.5 w-2.5 cursor-grab rounded-full border transition-colors active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-ground",
                p.id === liveId
                  ? "border-phosphor bg-phosphor"
                  : "border-ink-faint bg-transparent hover:border-phosphor hover:bg-phosphor/40",
                dragging === p.id && "opacity-40",
                overId === p.id && dragging && dragging !== p.id && "ring-2 ring-phosphor ring-offset-1 ring-offset-ground",
              )}
              onClick={() => {
                setMenuId(null);
                onGo(p.id);
              }}
              onKeyDown={(e) => {
                if (!e.altKey) return;
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                e.preventDefault();
                e.stopPropagation();
                nudgeCampaignPage(p.id, e.key === "ArrowLeft" ? -1 : 1);
              }}
              onDragStart={(e) => {
                setDragging(p.id);
                setMenuId(null);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", p.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverId(p.id);
              }}
              onDragLeave={() => {
                setOverId((cur) => (cur === p.id ? null : cur));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromId = e.dataTransfer.getData("text/plain") || dragging;
                if (fromId) moveChip(fromId, p.id);
                setDragging(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOverId(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuId(menuId === p.id ? null : p.id);
              }}
            />
          )}
          {menuId === p.id && (
            <div role="menu" className="absolute left-0 top-5 z-40 min-w-36 border border-border bg-surface py-1 shadow-lg">
              <button type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor" onClick={() => { setRenaming(p.id); setDraft(p.name ?? shortFormat(p.formatId)); setMenuId(null); }}>Rename</button>
              <button type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor" onClick={() => { save(); const pageId = duplicateCampaignPage(); setMenuId(null); if (pageId) onGo(pageId); }}>Duplicate</button>
              <button type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor" onClick={() => { unlinkCampaignPage(p.id); setMenuId(null); }}>Unlink</button>
              <button type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor" onClick={() => {
                if (pages.length <= 1 && !window.confirm("Delete the last page in this set? The board will be removed.")) { setMenuId(null); return; }
                const next = removeCampaignPage(p.id);
                setMenuId(null);
                if (next) onGo(next);
                else { setPresent(false); void navigate({ to: "/" }); }
              }}>Delete page</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
