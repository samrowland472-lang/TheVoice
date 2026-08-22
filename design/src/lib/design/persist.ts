import type { BrandKit, DesignDocument, ProjectMeta } from "./types";

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

export function loadIndex(): ProjectMeta[] {
  return readJson<ProjectMeta[]>(INDEX_KEY, []);
}

export function saveIndex(index: ProjectMeta[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
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
  const index = loadIndex().filter((p) => p.id !== doc.id);
  index.unshift({
    id: doc.id,
    name: doc.name,
    formatId: doc.artboard.formatId,
    width: doc.artboard.width,
    height: doc.artboard.height,
    updatedAt: doc.updatedAt,
    thumbnail: doc.thumbnail,
  });
  saveIndex(index.slice(0, 40));
}

export function deleteDoc(id: string) {
  const all = readJson<Record<string, DesignDocument>>(DOCS_KEY, {});
  delete all[id];
  localStorage.setItem(DOCS_KEY, JSON.stringify(all));
  saveIndex(loadIndex().filter((p) => p.id !== id));
}

export const DEFAULT_BRAND: BrandKit = {
  name: "The Voice",
  colors: ["#0a0d0c", "#d9f5e3", "#3fc6ff", "#7d9689", "#ffb238", "#121613"],
  fonts: ["Chakra Petch", "Share Tech Mono", "Syne"],
};

export function loadBrand(): BrandKit {
  return readJson<BrandKit>(BRAND_KEY, DEFAULT_BRAND);
}

export function saveBrand(kit: BrandKit) {
  localStorage.setItem(BRAND_KEY, JSON.stringify(kit));
}
