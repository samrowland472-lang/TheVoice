import { useEffect } from "react";
import { imageNode } from "@/lib/design/node-factory";
import { useDesign } from "@/lib/design/store";
import type { Tool } from "@/lib/design/types";

const KEYS: Record<string, Tool> = {
  v: "select",
  h: "hand",
  r: "rect",
  o: "ellipse",
  l: "line",
  t: "text",
  p: "pen",
  b: "brush",
  e: "eraser",
  i: "eyedropper",
  f: "frame",
};

export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      const s = useDesign.getState();
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        s.setPaletteOpen(!s.paletteOpen);
        return;
      }

      if (typing) return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        s.setPaletteOpen(true);
        return;
      }

      if (e.key === "Escape") {
        if (s.paletteOpen) {
          s.setPaletteOpen(false);
          return;
        }
        if (s.present) {
          s.setPresent(false);
          return;
        }
        if (s.tool === "pen") {
          e.preventDefault();
          s.finishPen();
          return;
        }
        s.select([]);
        s.setTool("select");
        return;
      }

      if (s.present) return;

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        s.save();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (e.shiftKey) s.duplicateLinked();
        else s.duplicateSelected();
        return;
      }
      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        s.selectAll();
        return;
      }
      if (meta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        s.copySelected();
        return;
      }
      if (meta && e.key.toLowerCase() === "x") {
        e.preventDefault();
        s.cutSelected();
        return;
      }
      if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        s.pasteClipboard();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (s.tool === "pen") {
          const n = s.doc?.nodes.find((x) => x.id === s.selection[0]);
          if (n?.kind === "path") {
            s.popLastPathPoint();
            return;
          }
        }
        s.removeSelected();
        return;
      }

      if (e.key === "Enter" && s.tool === "pen") {
        e.preventDefault();
        s.closeSelectedPath();
        return;
      }

      if (e.shiftKey && e.code === "KeyP" && !meta) {
        e.preventDefault();
        s.togglePresent();
        return;
      }

      if (e.key === "0") {
        e.preventDefault();
        s.requestFit();
        return;
      }
      if (e.key === "1" && !meta) {
        e.preventDefault();
        s.requestZoom(1);
        return;
      }
      if (e.key === "2" && !meta) {
        e.preventDefault();
        s.requestZoom(2);
        return;
      }
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        s.requestZoom(s.viewport.zoom * 1.15);
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        s.requestZoom(s.viewport.zoom / 1.15);
        return;
      }
      if (e.key === "[" ) {
        s.setBrush({ size: Math.max(2, s.brush.size - 4) });
        return;
      }
      if (e.key === "]") {
        s.setBrush({ size: Math.min(120, s.brush.size + 4) });
        return;
      }

      const nudge = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        s.translateSelected(-nudge, 0);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        s.translateSelected(nudge, 0);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        s.translateSelected(0, -nudge);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        s.translateSelected(0, nudge);
      }
      if (meta) return;
      const tool = KEYS[e.key.toLowerCase()];
      if (tool) s.setTool(tool);
    };

    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        const img = new Image();
        img.onload = () => {
          const doc = useDesign.getState().doc;
          if (!doc) return;
          const max = 720;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          useDesign.getState().addNode(
            imageNode({
              x: 80,
              y: 80,
              w: img.width * scale,
              h: img.height * scale,
              src,
            }),
          );
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
    };
  }, []);
}
