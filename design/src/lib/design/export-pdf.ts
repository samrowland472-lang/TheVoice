export function jpegFromDataUrl(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export type JpegPdfPage = { width: number; height: number; jpeg: Uint8Array };

function pdfEsc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Minimal PDF 1.4: one JPEG page per entry, /Filter /DCTDecode. */
export function buildJpegPdf(pages: JpegPdfPage[], title = "The Voice"): Uint8Array {
  const list = pages.length ? pages : [{ width: 1, height: 1, jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]) }];
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const push = (part: string | Uint8Array) => {
    const u = typeof part === "string" ? enc.encode(part) : part;
    chunks.push(u);
    size += u.length;
  };
  push("%PDF-1.4\n%\x80\x80\x80\x80\n");
  const objAt: number[] = [];
  const startObj = (n: number) => {
    objAt[n] = size;
    push(`${n} 0 obj\n`);
  };
  const endObj = () => push("\nendobj\n");

  const nPages = list.length;
  const catalog = 1;
  const pagesObj = 2;
  const pageStart = 3;
  const imageOf = (i: number) => pageStart + i * 3;
  const contentOf = (i: number) => pageStart + i * 3 + 1;
  const pageOf = (i: number) => pageStart + i * 3 + 2;
  const infoId = pageStart + nPages * 3;

  startObj(catalog);
  push(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);
  endObj();

  startObj(pagesObj);
  const kids = list.map((_, i) => `${pageOf(i)} 0 R`).join(" ");
  push(`<< /Type /Pages /Kids [${kids}] /Count ${nPages} >>`);
  endObj();

  for (let i = 0; i < nPages; i++) {
    const p = list[i]!;
    const w = Math.max(1, Math.round(p.width));
    const h = Math.max(1, Math.round(p.height));
    startObj(imageOf(i));
    push(
      `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
    );
    push(p.jpeg);
    push("\nendstream");
    endObj();

    const content = `q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`;
    startObj(contentOf(i));
    push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
    endObj();

    startObj(pageOf(i));
    push(
      `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${imageOf(i)} 0 R >> >> /Contents ${contentOf(i)} 0 R >>`,
    );
    endObj();
  }

  startObj(infoId);
  push(`<< /Title (${pdfEsc(title)}) /Producer (The Voice Design) >>`);
  endObj();

  const xrefAt = size;
  const maxId = infoId;
  push(`xref\n0 ${maxId + 1}\n`);
  push("0000000000 65535 f \n");
  for (let i = 1; i <= maxId; i++) {
    push(`${String(objAt[i] ?? 0).padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${maxId + 1} /Root ${catalog} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);
  const out = new Uint8Array(size);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime: string) {
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([ab], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
