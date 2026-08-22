import type { BrandColor, BrandKit, DesignDocument, ProjectMeta } from "./types";

const DOCS_KEY = "voice-design:docs:v1";
const BRAND_KEY = "voice-design:brand:v1";
const INDEX_KEY = "voice-design:index:v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function sortIndex(index: ProjectMeta[]): ProjectMeta[] {
  return [...index].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return b.updatedAt - a.updatedAt;
  });
}

export function loadIndex(): ProjectMeta[] {
  return sortIndex(readJson<ProjectMeta[]>(INDEX_KEY, []));
}

export function saveIndex(index: ProjectMeta[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(sortIndex(index)));
}

export function loadDoc(id: string): DesignDocument | null {
  const all = readJson<Record<string, DesignDocument>>(DOCS_KEY, {});
  return all[id] ?? null;
}

export function saveDoc(doc: DesignDocument) {
  const all = readJson<Record<string, DesignDocument>>(DOCS_KEY, {});
  all[doc.id] = doc;
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify(all));
  } catch {
    const ids = Object.keys(all);
    if (ids.length > 8) {
      const sorted = Object.values(all).sort((a, b) => a.updatedAt - b.updatedAt);
      const keep = sorted.slice(-8);
      const next: Record<string, DesignDocument> = {};
      for (const d of keep) next[d.id] = d;
      next[doc.id] = doc;
      localStorage.setItem(DOCS_KEY, JSON.stringify(next));
    }
  }
  const prev = loadIndex().find((p) => p.id === doc.id);
  const index = loadIndex().filter((p) => p.id !== doc.id);
  index.unshift({
    id: doc.id,
    name: doc.name,
    formatId: doc.artboard.formatId,
    width: doc.artboard.width,
    height: doc.artboard.height,
    updatedAt: doc.updatedAt,
    thumbnail: doc.thumbnail,
    pinned: prev?.pinned,
    folder: prev?.folder,
    tags: prev?.tags,
    campaignId: doc.campaignId ?? prev?.campaignId,
  });
  saveIndex(index.slice(0, 40));
}

export function patchIndex(id: string, patch: Partial<ProjectMeta>) {
  const index = loadIndex().map((p) => (p.id === id ? { ...p, ...patch } : p));
  saveIndex(index);
  return loadIndex();
}

export function deleteDoc(id: string) {
  const all = readJson<Record<string, DesignDocument>>(DOCS_KEY, {});
  delete all[id];
  localStorage.setItem(DOCS_KEY, JSON.stringify(all));
  saveIndex(loadIndex().filter((p) => p.id !== id));
}

export const DEFAULT_BRAND: BrandKit = {
  name: "The Voice",
  colors: [
    { name: "Ground", hex: "#0a0d0c" },
    { name: "Ink", hex: "#d9f5e3" },
    { name: "Phosphor", hex: "#3fc6ff" },
    { name: "Moss", hex: "#7d9689" },
    { name: "Amber", hex: "#ffb238" },
    { name: "Surface", hex: "#121613" },
  ],
  displayFont: "Chakra Petch",
  bodyFont: "Outfit",
  fonts: ["Chakra Petch", "Syne", "Share Tech Mono", "Outfit"],
};

function normalizeBrand(raw: unknown): BrandKit {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_BRAND);
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name : DEFAULT_BRAND.name;
  let colors: BrandKit["colors"] = DEFAULT_BRAND.colors;
  if (Array.isArray(r.colors) && r.colors.length) {
    colors = r.colors.map((c, i) => {
      if (typeof c === "string") {
        const known = DEFAULT_BRAND.colors.find((d) => d.hex.toLowerCase() === c.toLowerCase());
        return { name: known?.name ?? `Colour ${i + 1}`, hex: c };
      }
      if (c && typeof c === "object" && typeof (c as BrandColor).hex === "string") {
        const o = c as BrandColor;
        return { name: typeof o.name === "string" && o.name ? o.name : `Colour ${i + 1}`, hex: o.hex };
      }
      return { name: `Colour ${i + 1}`, hex: "#d9f5e3" };
    });
  }
  const fonts = Array.isArray(r.fonts)
    ? (r.fonts.filter((f) => typeof f === "string") as string[])
    : DEFAULT_BRAND.fonts;
  const displayFont =
    typeof r.displayFont === "string" && r.displayFont
      ? r.displayFont
      : fonts[0] ?? DEFAULT_BRAND.displayFont;
  const bodyFont =
    typeof r.bodyFont === "string" && r.bodyFont
      ? r.bodyFont
      : fonts.find((f) => f !== displayFont) ?? DEFAULT_BRAND.bodyFont;
  return { name, colors, displayFont, bodyFont, fonts: fonts.length ? fonts : DEFAULT_BRAND.fonts };
}

export function loadBrand(): BrandKit {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (!raw) return structuredClone(DEFAULT_BRAND);
    return normalizeBrand(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_BRAND);
  }
}

export function saveBrand(kit: BrandKit) {
  localStorage.setItem(BRAND_KEY, JSON.stringify(normalizeBrand(kit)));
}

export function brandHexes(kit: BrandKit): string[] {
  return kit.colors.map((c) => c.hex);
}
