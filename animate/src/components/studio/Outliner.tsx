import {
  Box,
  Camera,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Folder,
  Lock,
  Unlock,
  Lightbulb,
} from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { childIds, rootIds, useStudio } from "@/lib/studio/store";
import type { SceneNode } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

function KindIcon({ node }: { node: SceneNode }) {
  const cls = "size-3.5 shrink-0 text-muted";
  if (node.kind === "light") return <Lightbulb className={cls} />;
  if (node.kind === "camera") return <Camera className={cls} />;
  if (node.kind === "group") return <Folder className={cls} />;
  return <Box className={cls} />;
}

function Row({ id, depth }: { id: string; depth: number }) {
  const node = useStudio((s) => s.nodes[id]);
  const selected = useStudio((s) => s.selectedIds.includes(id) || s.selectedId === id);
  const kids = useStudio(useShallow((s) => childIds(s.nodes, id)));
  const [open, setOpen] = useState(true);
  if (!node) return null;

  return (
    <div>
      <div
        className={cn(
          "group flex h-7 items-center gap-1 rounded-sm pr-1 text-xs",
          selected ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/60 hover:text-fg",
        )}
        style={{ paddingLeft: 6 + depth * 12 }}
        onClick={(e) =>
          useStudio.getState().setSelected(id, { additive: e.shiftKey || e.metaKey || e.ctrlKey })
        }
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/voice-id", id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const src = e.dataTransfer.getData("text/voice-id") || e.dataTransfer.getData("text/aether-id");
          if (src && src !== id) useStudio.getState().setParent(src, id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") useStudio.getState().setSelected(id);
        }}
        role="treeitem"
        aria-selected={selected}
        tabIndex={0}
      >
        {kids.length > 0 ? (
          <button
            type="button"
            className="grid size-5 place-items-center text-subtle"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <span className="size-5" />
        )}
        <KindIcon node={node} />
        <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
        <button
          type="button"
          className="grid size-6 place-items-center opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            useStudio.getState().setNodeLocked(id, !node.locked);
          }}
          aria-label={node.locked ? "Unlock" : "Lock"}
        >
          {node.locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
        </button>
        <button
          type="button"
          className="grid size-6 place-items-center"
          onClick={(e) => {
            e.stopPropagation();
            useStudio.getState().setNodeVisible(id, !node.visible);
          }}
          aria-label={node.visible ? "Hide" : "Show"}
        >
          {node.visible ? <Eye className="size-3" /> : <EyeOff className="size-3 text-subtle" />}
        </button>
      </div>
      {open
        ? kids.map((cid) => <Row key={cid} id={cid} depth={depth + 1} />)
        : null}
    </div>
  );
}

export function Outliner() {
  const roots = useStudio(useShallow((s) => rootIds(s.nodes)));
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-8 items-center border-b border-border px-3">
        <span className="text-2xs font-medium uppercase tracking-wider text-subtle">Outliner</span>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto px-1 py-1"
        role="tree"
        aria-label="Scene"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const src = e.dataTransfer.getData("text/voice-id") || e.dataTransfer.getData("text/aether-id");
          if (src) useStudio.getState().setParent(src, null);
        }}
      >
        {roots.map((id) => (
          <Row key={id} id={id} depth={0} />
        ))}
      </div>
    </div>
  );
}
