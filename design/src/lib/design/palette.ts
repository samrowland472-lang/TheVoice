/** Sample a bitmap and return the strongest distinct hex colours. */

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function dist(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function paletteName(hex: string, i: number): string {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16) / 255;
  const g = Number.parseInt(h.slice(2, 4), 16) / 255;
  const b = Number.parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  if (s < 0.12) return l < 0.2 ? "Ink" : l > 0.8 ? "Paper" : "Stone";
  let hue = 0;
  const d = max - min;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue = (hue * 60 + 360) % 360;
  const names = [
    [15, "Red"],
    [45, "Amber"],
    [75, "Gold"],
    [150, "Moss"],
    [190, "Teal"],
    [230, "Cyan"],
    [270, "Blue"],
    [310, "Violet"],
    [345, "Magenta"],
    [360, "Red"],
  ] as const;
  const label = names.find(([deg]) => hue <= deg)?.[1] ?? `Swatch ${i + 1}`;
  return l < 0.35 ? `Deep ${label}` : l > 0.7 ? `Pale ${label}` : label;
}

export function paletteFromImageData(data: Uint8ClampedArray, count = 6): string[] {
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3] ?? 0;
    if (a < 80) continue;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const cur = buckets.get(key);
    if (cur) {
      cur.n += 1;
      cur.r += r;
      cur.g += g;
      cur.b += b;
    } else buckets.set(key, { n: 1, r, g, b });
  }
  const ranked = [...buckets.values()]
    .map((c) => ({
      n: c.n,
      rgb: [Math.round(c.r / c.n), Math.round(c.g / c.n), Math.round(c.b / c.n)] as [number, number, number],
    }))
    .sort((a, b) => b.n - a.n);
  const picked: [number, number, number][] = [];
  for (const c of ranked) {
    if (picked.some((p) => dist(p, c.rgb) < 42)) continue;
    picked.push(c.rgb);
    if (picked.length >= count) break;
  }
  return picked.map(([r, g, b]) => toHex(r, g, b));
}

export function paletteFromSrc(src: string, count = 6): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = 64;
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve([]);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(paletteFromImageData(ctx.getImageData(0, 0, w, h).data, count));
    };
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = src;
  });
}
