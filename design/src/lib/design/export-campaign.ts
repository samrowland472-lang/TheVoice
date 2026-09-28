import type { DesignDocument } from "./types";
import { collectSvgDefs, exportSvg, exportSvgBody, slug } from "./export";

const CAMPAIGN_GAP = 48;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function exportCampaignSvg(docs: DesignDocument[]): string {
  if (docs.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"/>`;
  }
  if (docs.length === 1) return exportSvg(docs[0]!);
  const widths = docs.map((d) => d.artboard.width);
  const heights = docs.map((d) => d.artboard.height);
  const width = Math.max(...widths);
  const height = heights.reduce((sum, h) => sum + h, 0) + CAMPAIGN_GAP * (docs.length - 1);
  const defs = docs.map((d, i) => collectSvgDefs(d, `p${i}-`)).join("");
  let y = 0;
  const boards = docs
    .map((d, i) => {
      const bg = typeof d.artboard.background === "string" ? d.artboard.background : "#ffffff";
      const g = `<g id="${esc(slug(d.name) || d.id)}" data-page="${i + 1}" transform="translate(0 ${y})"><rect width="${d.artboard.width}" height="${d.artboard.height}" fill="${esc(bg)}"/>${exportSvgBody(d, `p${i}-`)}</g>`;
      y += d.artboard.height + CAMPAIGN_GAP;
      return g;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${boards}</svg>`;
}
