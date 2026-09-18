import { useDesign } from "./store-impl";

export type GuideDash = "solid" | "dash" | "tight";

export type GuideAxisLook = {
  color: string;
  dash: GuideDash;
};

export type GuideLooks = {
  x: GuideAxisLook;
  y: GuideAxisLook;
};

export const GUIDE_COLORS = [
  { id: "cyan", hex: "#3fc6ff" },
  { id: "ice", hex: "#9ee7ff" },
  { id: "phosphor", hex: "#c4ff4d" },
] as const;

export const GUIDE_DASHES: GuideDash[] = ["dash", "tight", "solid"];

export const DEFAULT_GUIDE_LOOKS: GuideLooks = {
  x: { color: "#3fc6ff", dash: "dash" },
  y: { color: "#9ee7ff", dash: "tight" },
};

const PREF = "voice-design-guide-looks";

function sanitizeLook(raw: unknown, fallback: GuideAxisLook): GuideAxisLook {
  if (!raw || typeof raw !== "object") return fallback;
  const rec = raw as { color?: unknown; dash?: unknown };
  const color =
    typeof rec.color === "string" && /^#[0-9a-fA-F]{6}$/.test(rec.color) ? rec.color : fallback.color;
  const dash = GUIDE_DASHES.includes(rec.dash as GuideDash) ? (rec.dash as GuideDash) : fallback.dash;
  return { color, dash };
}

export function loadGuideLooks(): GuideLooks {
  if (typeof localStorage === "undefined") return DEFAULT_GUIDE_LOOKS;
  try {
    const raw = localStorage.getItem(PREF);
    if (!raw) return DEFAULT_GUIDE_LOOKS;
    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
    return {
      x: sanitizeLook(parsed.x, DEFAULT_GUIDE_LOOKS.x),
      y: sanitizeLook(parsed.y, DEFAULT_GUIDE_LOOKS.y),
    };
  } catch {
    return DEFAULT_GUIDE_LOOKS;
  }
}

export function saveGuideLooks(looks: GuideLooks) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREF, JSON.stringify(looks));
}

export function resolveGuideLook(axis: "x" | "y", looks?: GuideLooks): GuideAxisLook {
  const src = looks ?? loadGuideLooks();
  return axis === "x" ? src.x : src.y;
}

export function dashArray(dash: GuideDash): number[] {
  if (dash === "solid") return [];
  if (dash === "tight") return [3, 3];
  return [5, 4];
}

export function hexToRgba(hex: string, alpha: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const looks = loadGuideLooks();

useDesign.setState({
  guideLooks: looks,
  setGuideLook: (axis: "x" | "y", patch: Partial<GuideAxisLook>) => {
    const cur = ((useDesign.getState() as { guideLooks?: GuideLooks }).guideLooks ?? loadGuideLooks()) as GuideLooks;
    const next: GuideLooks = {
      ...cur,
      [axis]: { ...cur[axis], ...patch },
    };
    saveGuideLooks(next);
    useDesign.setState({ guideLooks: next });
  },
});
