import { useDesign } from "@/lib/design/store";
import type { BlendMode, DesignNode, Shadow } from "@/lib/design/types";
import { cn } from "@/lib/utils";

const BLENDS: BlendMode[] = [
  "source-over",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "soft-light",
];

const DEFAULT_SHADOW: Shadow = { color: "#000000", blur: 28, ox: 0, oy: 18 };

function shadowKey(shadow: Shadow | null): string {
  if (!shadow) return "off";
  return `on:${shadow.color}:${shadow.blur}:${shadow.ox}:${shadow.oy}`;
}
