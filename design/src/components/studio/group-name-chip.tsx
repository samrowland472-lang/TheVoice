import { useState } from "react";
import { groupBox, selectionLabelScreen } from "@/lib/design/group-transform";
import { useDesign } from "@/lib/design/store";
import { isGroup } from "@/lib/design/types";

export function GroupNameChip() {
  const doc = useDesign((s) => s.doc);
  const viewport = useDesign((s) => s.viewport);
  const selection = useDesign((s) => s.selection);
  const tool = useDesign((s) => s.tool);
  const present = useDesign((s) => s.present);
  const updateNodes = useDesign((s) => s.updateNodes);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const selectedGroup =
    !present && tool === "select" && selection.length === 1 && doc
      ? doc.nodes.find((n) => n.id === selection[0] && isGroup(n))
      : undefined;
  const box = selectedGroup && doc ? groupBox(doc.nodes, selectedGroup.id) : null;
  const pos = box ? selectionLabelScreen(box, viewport) : null;
  if (!selectedGroup || !pos) return null;

  function commit() {
    if (!renameId) return;
    const next = renameDraft.trim();
    const current = doc?.nodes.find((n) => n.id === renameId);
    if (next && current && next !== current.name) updateNodes([renameId], { name: next }, true);
    setRenameId(null);
  }

  return (
    <div
      className="absolute z-20"
      style={{ left: pos.left, top: Math.max(4, pos.top) }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {renameId === selectedGroup.id ? (
        <input
          autoFocus
          value={renameDraft}
          aria-label="Group name"
          className="h-6 min-w-[72px] rounded-[6px] border border-phosphor bg-ground px-1.5 font-mono text-[11px] text-ink outline-none"
          onChange={(e) => setRenameDraft(e.target.value)}
          onBlur={() => commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setRenameId(null);
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="h-6 max-w-[220px] truncate rounded-[6px] border border-phosphor/40 bg-ground/90 px-1.5 font-mono text-[11px] tracking-wide text-phosphor hover:border-phosphor"
          title="Double-click to rename"
          onDoubleClick={() => {
            setRenameDraft(selectedGroup.name || "Group");
            setRenameId(selectedGroup.id);
          }}
        >
          {selectedGroup.name || "Group"}
        </button>
      )}
    </div>
  );
}
