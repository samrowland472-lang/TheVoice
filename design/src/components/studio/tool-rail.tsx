import {
  ArrowUpRight,
  Circle,
  Droplet,
  Eraser,
  Frame,
  Hand,
  Hexagon,
  ImagePlus,
  Minus,
  MousePointer2,
  Paintbrush,
  PenTool,
  Square,
  Star,
  Type,
} from "lucide-react";
import { useDesign } from "@/lib/design/store";
import type { Tool } from "@/lib/design/types";
import { cn } from "@/lib/utils";

const TOOLS: { id: Tool; label: string; icon: typeof Square; k?: string }[] = [
  { id: "select", label: "Select", icon: MousePointer2, k: "V" },
  { id: "hand", label: "Pan", icon: Hand, k: "H" },
  { id: "frame", label: "Frame", icon: Frame, k: "F" },
  { id: "rect", label: "Rectangle", icon: Square, k: "R" },
  { id: "ellipse", label: "Ellipse", icon: Circle, k: "O" },
  { id: "line", label: "Line", icon: Minus, k: "L" },
  { id: "polygon", label: "Polygon", icon: Hexagon },
  { id: "star", label: "Star", icon: Star },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
  { id: "text", label: "Text", icon: Type, k: "T" },
  { id: "pen", label: "Pen", icon: PenTool, k: "P" },
  { id: "brush", label: "Brush", icon: Paintbrush, k: "B" },
  { id: "eraser", label: "Eraser", icon: Eraser, k: "E" },
  { id: "image", label: "Image", icon: ImagePlus },
  { id: "eyedropper", label: "Eyedropper", icon: Droplet, k: "I" },
];

export function ToolRail() {
  const tool = useDesign((s) => s.tool);
  const setTool = useDesign((s) => s.setTool);

  return (
    <div className="flex gap-1 overflow-x-auto p-2 md:w-14 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-r md:border-border">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const active = tool === t.id;
        return (
          <button
            key={t.id}
            type="button"
            title={`${t.label}${t.k ? ` (${t.k})` : ""}`}
            aria-label={t.label}
            aria-pressed={active}
            onClick={() => setTool(t.id)}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-[12px] transition-colors",
              active ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
