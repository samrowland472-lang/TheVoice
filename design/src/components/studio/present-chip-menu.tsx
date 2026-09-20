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
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

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
              title={`${p.name ?? shortFormat(p.formatId)} — right-click for page actions`}
              className={cn(
                "h-2.5 w-2.5 rounded-full border transition-colors",
                p.id === liveId
                  ? "border-phosphor bg-phosphor"
                  : "border-ink-faint bg-transparent hover:border-phosphor hover:bg-phosphor/40",
              )}
              onClick={() => {
                setMenuId(null);
                onGo(p.id);
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
