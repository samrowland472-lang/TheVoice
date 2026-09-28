import type { DesignDocument, ProjectMeta } from "./types";
import { campaignPages } from "./campaign";
import { downloadDataUrl, exportJpeg, exportSvg, slug } from "./export";
import { loadDoc } from "./persist";

export const CAMPAIGN_GAP = 48;

function esc(s: string) {
  return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, """);
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
  const boards = docs
    .map((d, i) => {
      const inner = exportSvg(d).replace(/^<\?xml[^>]*>/, "");
      const y = offsets[i] ?? 0;
      return `<g id="${esc(slug(d.name) || d.id)}" data-page="${i + 1}" transform="translate(0 ${y})">${inner}</g>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${boards}</svg>`;
}

export function downloadCampaignSvg(docs: DesignDocument[], name?: string) {
  const blob = new Blob([exportCampaignSvg(docs)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${slug(name || docs[0]?.name || "campaign")}-campaign.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

const te = new TextEncoder();

/** One PDF page per board. JPEG of each artboard, page size matches the board. */
export function exportCampaignPdf(docs: DesignDocument[], scale = 2): Uint8Array {
  const pages = (docs.length ? docs : []).map((d) => {
    const jpeg = dataUrlToBytes(exportJpeg(d, scale, 0.92));
    return { w: d.artboard.width, h: d.artboard.height, jpeg };
  });
  if (!pages.length) {
    pages.push({ w: 1, h: 1, jpeg: new Uint8Array() });
  }

  const offsets: number[] = [0];
  let buf: Uint8Array = te.encode("%PDF-1.4\n");

  function addObj(body: Uint8Array) {
    offsets.push(buf.length);
    const header = te.encode(`${offsets.length - 1} 0 obj\n`);
    const end = te.encode("\nendobj\n");
    buf = concatBytes([buf, header, body, end]);
    return offsets.length - 1;
  }

  const catalogId = 1;
  const pagesId = 2;
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  const imageIds: number[] = [];

  let next = 3;
  for (let i = 0; i < pages.length; i++) {
    pageIds.push(next++);
    contentIds.push(next++);
    imageIds.push(next++);
  }

  const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
  addObj(te.encode(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`));
  addObj(te.encode(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`));

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]!;
    const imgName = `Im${i + 1}`;
    addObj(
      te.encode(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${p.w} ${p.h}] /Resources << /XObject << /${imgName} ${imageIds[i]} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`,
      ),
    );
    const stream = `q ${p.w} 0 0 ${p.h} 0 0 cm /${imgName} Do Q`;
    addObj(te.encode(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`));
    const imgHeader = te.encode(
      `<< /Type /XObject /Subtype /Image /Width ${Math.round(p.w * scale)} /Height ${Math.round(p.h * scale)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
    );
    const imgTail = te.encode("\nendstream");
    addObj(concatBytes([imgHeader, p.jpeg, imgTail]));
  }

  const xrefAt = buf.length;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${offsets.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return concatBytes([buf, te.encode(xref), te.encode(trailer)]);
}

export function downloadCampaignPdf(docs: DesignDocument[], name?: string, scale = 2) {
  const bytes = exportCampaignPdf(docs, scale);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${slug(name || docs[0]?.name || "campaign")}-campaign.pdf`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
