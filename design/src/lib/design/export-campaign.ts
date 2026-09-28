import { campaignPages } from "./campaign";
import type { DesignDocument, ProjectMeta } from "./types";
import { loadDoc } from "./persist";
import {
  buildJpegPdf,
  collectSvgDefs,
  downloadBytes,
  downloadDataUrl,
  exportSvg,
  exportSvgBody,
  printJpegPage,
  slug,
} from "./export";

export const CAMPAIGN_GAP = 48;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function campaignDocsFromIndex(index: ProjectMeta[], current: DesignDocument): DesignDocument[] {
  if (!current.campaignId) return [current];
  const pages = campaignPages(index, current.campaignId);
  const docs = pages.map((p) => (p.id === current.id ? current : loadDoc(p.id))).filter((d): d is DesignDocument => !!d);
  return docs.length ? docs : [current];
}

export function campaignStackLayout(docs: DesignDocument[]) {
  const widths = docs.map((d) => d.artboard.width);
  const heights = docs.map((d) => d.artboard.height);
  const width = docs.length ? Math.max(...widths) : 1;
  const height = docs.length
    ? heights.reduce((sum, h) => sum + h, 0) + CAMPAIGN_GAP * Math.max(0, docs.length - 1)
    : 1;
  const offsets: number[] = [];
  let y = 0;
  for (const d of docs) {
    offsets.push(y);
    y += d.artboard.height + CAMPAIGN_GAP;
  }
  return { width, height, offsets };
}

export function exportCampaignSvg(docs: DesignDocument[]): string {
  if (docs.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"/>`;
  }
  if (docs.length === 1) return exportSvg(docs[0]!);
  const { width, height, offsets } = campaignStackLayout(docs);
  const defs = docs.map((d, i) => collectSvgDefs(d, `p${i}-`)).join("");
  const boards = docs
    .map((d, i) => {
      const bg = typeof d.artboard.background === "string" ? d.artboard.background : "#ffffff";
      const y = offsets[i] ?? 0;
      return `<g id="${esc(slug(d.name) || d.id)}" data-page="${i + 1}" transform="translate(0 ${y})"><rect width="${d.artboard.width}" height="${d.artboard.height}" fill="${esc(bg)}"/>${exportSvgBody(d, `p${i}-`)}</g>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${boards}</svg>`;
}

/** One PDF page per board. JPEG /Filter /DCTDecode, same order as Campaign SVG. */
export function exportCampaignPdf(docs: DesignDocument[]): Uint8Array {
  const pages = (docs.length ? docs : []).map((d) => printJpegPage(d));
  return buildJpegPdf(pages, docs[0]?.name ?? "Campaign");
}

export function downloadCampaignSvg(docs: DesignDocument[], name?: string) {
  const blob = new Blob([exportCampaignSvg(docs)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${slug(name || docs[0]?.name || "campaign")}-campaign.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadCampaignPdf(docs: DesignDocument[], name?: string) {
  downloadBytes(exportCampaignPdf(docs), `${slug(name || docs[0]?.name || "campaign")}-campaign.pdf`, "application/pdf");
}
