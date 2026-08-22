import { useState } from "react";
import { toast } from "sonner";
import { generateFill, magicLayout, rewriteCopy } from "@/lib/ai/design";
import { uid } from "@/lib/design/id";
import { useDesign } from "@/lib/design/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [preview, setPreview] = useState<DesignNode[] | null>(null);

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
          displayFont: brand.fonts[0],
          bodyFont: brand.fonts[1],
        },
      });
      let rawNodes: Record<string, unknown>[];
      if (!res.ok) {
        rawNodes = fallbackLayout(prompt, doc.artboard.width, doc.artboard.height, brand.colors, brand.fonts);
        toast.message("Director offline — local layout ready to preview");
      } else {
        rawNodes = res.nodes as Record<string, unknown>[];
      }
      const nodes = rawNodes.map((raw) =>
        normalizeNode(raw, doc.artboard.width, doc.artboard.height, brand.fonts[0], brand.fonts[1]),
      );
      setPreview(nodes);
    } finally {
      setBusy(false);
    }
  }

  function applyPreview() {
    if (!preview?.length) return;
    applyNodes(preview, mode);
    setPreview(null);
    toast.success(mode === "replace" ? "Board replaced" : "Layout appended");
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
      <div className="mt-2 flex gap-1">
        {(["append", "replace"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              "h-8 flex-1 rounded-[8px] text-[10px] font-medium uppercase tracking-wide",
              mode === id ? "bg-phosphor text-phosphor-ink" : "border border-border text-ink-dim hover:text-ink",
            )}
          >
            {id}
          </button>
        ))}
      </div>
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
      {preview && (
        <div className="mt-3 rounded-[12px] border border-border bg-surface-alt p-2">
          <div className="font-mono text-[10px] tracking-[0.16em] text-phosphor uppercase">
            Preview · {preview.length} layers · {mode}
          </div>
          <ul className="mt-2 max-h-32 overflow-auto scrollbar-thin">
            {preview.map((n) => (
              <li key={n.id} className="flex h-7 items-center gap-2 text-[11px] text-ink-dim">
                <span className="size-3 rounded-sm border border-border" style={{ background: typeof n.fill === "string" ? n.fill : "#3fc6ff" }} />
                <span className="truncate">{n.name || n.kind}</span>
                <span className="ml-auto font-mono text-[9px] text-ink-faint uppercase">{n.kind}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-1">
            <Button size="sm" variant="primary" className="flex-1" onClick={applyPreview}>
              Apply
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setPreview(null)}>
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function fallbackLayout(
  prompt: string,
  w: number,
  h: number,
  colors: string[],
  fonts: string[],
): Record<string, unknown>[] {
  const ink = colors[1] ?? "#d9f5e3";
  const ground = colors[0] ?? "#0a0d0c";
  const cyan = colors[2] ?? "#3fc6ff";
  const display = fonts[0] ?? "Chakra Petch";
  const body = fonts[1] ?? "Outfit";
  const title = prompt.split(",")[0]?.trim().slice(0, 28) || "THE VOICE";
  return [
    { kind: "rect", name: "Ground", x: 0, y: 0, w, h, fill: ground },
    { kind: "rect", name: "Bar", x: 48, y: 48, w: w - 96, h: 8, fill: cyan },
    { kind: "text", name: "Headline", x: 64, y: h * 0.28, w: w - 128, h: 160, fill: ink, text: title.toUpperCase(), fontFamily: display, fontSize: Math.min(96, w / 10), fontWeight: 700, uppercase: true },
    { kind: "text", name: "Deck", x: 64, y: h * 0.52, w: w - 128, h: 80, fill: cyan, text: prompt.slice(0, 80), fontFamily: body, fontSize: 28, fontWeight: 400 },
    { kind: "rect", name: "Mark", x: 64, y: h - 120, w: 72, h: 8, fill: cyan },
  ];
}

function normalizeNode(
  raw: Record<string, unknown>,
  maxW: number,
  maxH: number,
  display = "Chakra Petch",
  body = "Outfit",
): DesignNode {
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
    const size = Number(raw.fontSize) || 48;
    return {
      ...base,
      kind: "text",
      text: String(raw.text ?? "Text"),
      fontFamily: String(raw.fontFamily ?? (size >= 40 ? display : body)),
      fontWeight: Number(raw.fontWeight) || 600,
      fontSize: size,
      letterSpacing: Number(raw.letterSpacing) || 0,
      lineHeight: Number(raw.lineHeight) || 1.1,
      align: (raw.align as "left" | "center" | "right") || "left",
      uppercase: Boolean(raw.uppercase),
    };
  }
  return base as DesignNode;
}
