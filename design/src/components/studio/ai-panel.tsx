import { useState } from "react";
import { toast } from "sonner";
import { generateFill, magicLayout, rewriteCopy } from "@/lib/ai/design";
import { uid } from "@/lib/design/id";
import { useDesign } from "@/lib/design/store";
import { Button } from "@/components/ui/button";
import type { DesignNode } from "@/lib/design/types";

export function AiPanel() {
  const doc = useDesign((s) => s.doc);
  const brand = useDesign((s) => s.brand);
  const applyNodes = useDesign((s) => s.applyNodes);
  const selection = useDesign((s) => s.selection);
  const updateNodes = useDesign((s) => s.updateNodes);
  const addNode = useDesign((s) => s.addNode);
  const [prompt, setPrompt] = useState("concert poster, stacked type, cyan crop marks");
  const [busy, setBusy] = useState(false);

  async function layout() {
    if (!doc || busy) return;
    setBusy(true);
    try {
      const res = await magicLayout({
        data: {
          prompt,
          width: doc.artboard.width,
          height: doc.artboard.height,
          brandColors: brand.colors,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const nodes = (res.nodes as Record<string, unknown>[]).map((raw) => normalizeNode(raw, doc.artboard.width, doc.artboard.height));
      applyNodes(nodes);
      toast.success("Layout placed");
    } finally {
      setBusy(false);
    }
  }

  async function rewrite() {
    if (!doc || busy) return;
    const n = doc.nodes.find((x) => selection.includes(x.id) && x.kind === "text");
    if (!n || n.kind !== "text") {
      toast.error("Select a text layer");
      return;
    }
    setBusy(true);
    try {
      const res = await rewriteCopy({ data: { text: n.text, tone: prompt || "editorial" } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      updateNodes([n.id], { text: res.text } as Partial<DesignNode>, true);
    } finally {
      setBusy(false);
    }
  }

  async function image() {
    if (!doc || busy) return;
    setBusy(true);
    try {
      const res = await generateFill({ data: { prompt } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      addNode({
        id: uid("im"),
        name: "Generated",
        kind: "image",
        x: 80,
        y: 80,
        w: Math.min(640, doc.artboard.width - 160),
        h: Math.min(640, doc.artboard.height - 160),
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        blend: "source-over",
        fill: "transparent",
        stroke: "transparent",
        strokeWidth: 0,
        radius: 0,
        shadow: null,
        src: res.url,
        crop: null,
        filters: { brightness: 1, contrast: 1, saturate: 1, blur: 0 },
      });
      toast.success("Image placed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-border px-3 py-3">
      <div className="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Director</div>
      <textarea
        className="field mt-2 min-h-16 w-full text-sm"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe a layout, a tone, or an image"
      />
      <div className="mt-2 flex flex-col gap-1.5">
        <Button size="sm" variant="primary" disabled={busy} onClick={() => void layout()}>
          {busy ? "Working…" : "Magic layout"}
        </Button>
        <Button size="sm" disabled={busy} onClick={() => void rewrite()}>
          Rewrite copy
        </Button>
        <Button size="sm" disabled={busy} onClick={() => void image()}>
          Generate image
        </Button>
      </div>
    </div>
  );
}

function normalizeNode(raw: Record<string, unknown>, maxW: number, maxH: number): DesignNode {
  const kind = (["rect", "ellipse", "text", "star", "polygon", "line", "arrow"].includes(String(raw.kind))
    ? raw.kind
    : "rect") as DesignNode["kind"];
  const base = {
    id: uid("ai"),
    name: String(raw.name ?? kind),
    kind,
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    w: Math.min(maxW, Number(raw.w) || 120),
    h: Math.min(maxH, Number(raw.h) || 80),
    rotation: Number(raw.rotation) || 0,
    opacity: typeof raw.opacity === "number" ? raw.opacity : 1,
    visible: true,
    locked: false,
    blend: "source-over" as const,
    fill: String(raw.fill ?? "#3fc6ff"),
    stroke: String(raw.stroke ?? "transparent"),
    strokeWidth: Number(raw.strokeWidth) || 0,
    radius: Number(raw.radius) || 0,
    shadow: null,
  };
  if (kind === "text") {
    return {
      ...base,
      kind: "text",
      text: String(raw.text ?? "Text"),
      fontFamily: String(raw.fontFamily ?? "Chakra Petch"),
      fontWeight: Number(raw.fontWeight) || 600,
      fontSize: Number(raw.fontSize) || 48,
      letterSpacing: Number(raw.letterSpacing) || 0,
      lineHeight: Number(raw.lineHeight) || 1.1,
      align: (raw.align as "left" | "center" | "right") || "left",
      uppercase: Boolean(raw.uppercase),
    };
  }
  return base as DesignNode;
}
