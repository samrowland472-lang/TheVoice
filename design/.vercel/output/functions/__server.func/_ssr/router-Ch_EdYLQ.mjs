import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, _ as Outlet, b as createRootRoute, f as Scripts, g as createRouter, p as HeadContent, v as lazyRouteComponent, w as require_jsx_runtime, y as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as literal, c as string, l as union, o as number, s as object } from "../_libs/zod.mjs";
import { K as isGroup, Lt as useDesign, Q as loadDoc, Rt as variationSettings, W as isConvertibleShape, Z as layoutTextLines, a as FONT_LINK, b as canvasShadowParams, g as blankDocument, h as bakeRotatedPoints, k as drawDocument, lt as pathD, nt as measureTracked, v as campaignPages, wt as shapeContour, x as clampAxis, y as canvasFont } from "./render-Dkgk1Dgz.mjs";
import { i as TriangleAlert } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-Ch_EdYLQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function pathFillRule(n) {
	return n.fillRule ?? ((n.holes?.length ?? 0) > 0 ? "evenodd" : "nonzero");
}
function holeFillRule(n, index) {
	return n.holeFillRules?.[index] ?? pathFillRule(n);
}
function dropHole(n, hole) {
	return {
		...n,
		holes: (n.holes ?? []).filter((_, i) => i !== hole),
		holeFillRules: n.holeFillRules ? n.holeFillRules.filter((_, i) => i !== hole) : n.holeFillRules
	};
}
function setHoleFillRule(n, hole, rule) {
	const count = n.holes?.length ?? 0;
	if (hole < 0 || hole >= count) return n;
	const next = [...n.holeFillRules ?? []];
	while (next.length < count) next.push(pathFillRule(n));
	next[hole] = rule;
	return {
		...n,
		holeFillRules: next
	};
}
function partitionPathHoles(n) {
	const cut = [];
	const islands = [];
	(n.holes ?? []).forEach((ring, i) => {
		if (ring.length < 3) return;
		if (holeFillRule(n, i) === "nonzero") islands.push(ring);
		else cut.push(ring);
	});
	return {
		cut,
		islands
	};
}
function resolveBleed(doc) {
	const raw = doc.artboard.bleedEdges;
	if (raw) return {
		top: Math.max(0, raw.top ?? 0),
		right: Math.max(0, raw.right ?? 0),
		bottom: Math.max(0, raw.bottom ?? 0),
		left: Math.max(0, raw.left ?? 0)
	};
	const b = Math.max(0, doc.artboard.bleed ?? 0);
	return {
		top: b,
		right: b,
		bottom: b,
		left: b
	};
}
function uniformBleed(edges) {
	if (edges.top === edges.right && edges.right === edges.bottom && edges.bottom === edges.left) return edges.top;
	return null;
}
/** CSS-pixel bleed from millimetres (96 CSS px / in). */
function bleedMmToPx(mm) {
	return Math.max(0, Math.round(mm * 96 / 25.4));
}
var BLEED_PRESETS = [
	{
		id: "none",
		label: "None",
		mm: 0,
		px: 0
	},
	{
		id: "3mm",
		label: "3 mm",
		mm: 3,
		px: bleedMmToPx(3)
	},
	{
		id: "6mm",
		label: "6 mm",
		mm: 6,
		px: bleedMmToPx(6)
	}
];
function printMarkLayout(doc) {
	const edges = resolveBleed(doc);
	const bleed = Math.max(edges.top, edges.right, edges.bottom, edges.left);
	const { width, height } = doc.artboard;
	const mark = Math.max(16, Math.min(42, Math.min(width, height) * .035));
	return {
		bleed,
		edges,
		width,
		height,
		mark,
		gap: Math.max(3, Math.min(8, mark * .18)),
		corners: [
			{
				x: 0,
				y: 0,
				sx: -1,
				sy: -1
			},
			{
				x: width,
				y: 0,
				sx: 1,
				sy: -1
			},
			{
				x: 0,
				y: height,
				sx: -1,
				sy: 1
			},
			{
				x: width,
				y: height,
				sx: 1,
				sy: 1
			}
		]
	};
}
/** Live bleed band + crop / registration marks in document space (trim origin). */
function drawPrintMarks(ctx, doc, zoom, opts) {
	const { edges, width, height, mark, gap, corners } = printMarkLayout(doc);
	const hair = 1 / Math.max(zoom, .05);
	const hasBleed = edges.top > 0 || edges.right > 0 || edges.bottom > 0 || edges.left > 0;
	const bleedBand = opts?.bleedBand ?? hasBleed;
	const marks = opts?.marks ?? true;
	ctx.save();
	if (bleedBand && hasBleed) {
		ctx.beginPath();
		ctx.rect(-edges.left, -edges.top, width + edges.left + edges.right, height + edges.top + edges.bottom);
		ctx.rect(0, 0, width, height);
		ctx.fillStyle = "rgba(63,198,255,0.08)";
		ctx.fill("evenodd");
		ctx.strokeStyle = "rgba(63,198,255,0.55)";
		ctx.lineWidth = 1.05 * hair;
		ctx.setLineDash([7 * hair, 5 * hair]);
		ctx.strokeRect(-edges.left, -edges.top, width + edges.left + edges.right, height + edges.top + edges.bottom);
		ctx.setLineDash([]);
	}
	if (!marks) {
		ctx.restore();
		return;
	}
	ctx.strokeStyle = "rgba(63,198,255,0.28)";
	ctx.lineWidth = hair;
	ctx.strokeRect(0, 0, width, height);
	const strokes = [{
		color: "rgba(7,9,8,0.92)",
		width: 2.6 * hair
	}, {
		color: "rgba(63,198,255,0.95)",
		width: 1.05 * hair
	}];
	for (const s of strokes) {
		ctx.strokeStyle = s.color;
		ctx.lineWidth = s.width;
		ctx.beginPath();
		for (const c of corners) {
			ctx.moveTo(c.x + c.sx * gap, c.y);
			ctx.lineTo(c.x + c.sx * (gap + mark), c.y);
			ctx.moveTo(c.x, c.y + c.sy * gap);
			ctx.lineTo(c.x, c.y + c.sy * (gap + mark));
		}
		ctx.stroke();
	}
	const midX = width / 2;
	const midY = height / 2;
	const arm = Math.min(10, mark * .35);
	const regs = [
		[midX, -Math.max(edges.top, gap + arm + 4)],
		[midX, height + Math.max(edges.bottom, gap + arm + 4)],
		[-Math.max(edges.left, gap + arm + 4), midY],
		[width + Math.max(edges.right, gap + arm + 4), midY]
	];
	for (const s of strokes) {
		ctx.strokeStyle = s.color;
		ctx.lineWidth = s.width;
		for (const [rx, ry] of regs) {
			ctx.beginPath();
			ctx.moveTo(rx - arm, ry);
			ctx.lineTo(rx + arm, ry);
			ctx.moveTo(rx, ry - arm);
			ctx.lineTo(rx, ry + arm);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(rx, ry, arm * .45, 0, Math.PI * 2);
			ctx.stroke();
		}
	}
	ctx.restore();
}
function jpegFromDataUrl(dataUrl) {
	const b64 = dataUrl.split(",")[1] ?? "";
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}
function pdfEsc(s) {
	return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
/** Minimal PDF 1.4: one JPEG page per entry, /Filter /DCTDecode. */
function buildJpegPdf$1(pages, title = "The Voice") {
	const list = pages.length ? pages : [{
		width: 1,
		height: 1,
		jpeg: new Uint8Array([
			255,
			216,
			255,
			217
		])
	}];
	const enc = new TextEncoder();
	const chunks = [];
	let size = 0;
	const push = (part) => {
		const u = typeof part === "string" ? enc.encode(part) : part;
		chunks.push(u);
		size += u.length;
	};
	push("%PDF-1.4\n%\n");
	const objAt = [];
	const startObj = (n) => {
		objAt[n] = size;
		push(`${n} 0 obj\n`);
	};
	const endObj = () => push("\nendobj\n");
	const nPages = list.length;
	const catalog = 1;
	const pagesObj = 2;
	const pageStart = 3;
	const imageOf = (i) => pageStart + i * 3;
	const contentOf = (i) => pageStart + i * 3 + 1;
	const pageOf = (i) => pageStart + i * 3 + 2;
	const infoId = pageStart + nPages * 3;
	startObj(catalog);
	push(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);
	endObj();
	startObj(pagesObj);
	push(`<< /Type /Pages /Kids [${list.map((_, i) => `${pageOf(i)} 0 R`).join(" ")}] /Count ${nPages} >>`);
	endObj();
	for (let i = 0; i < nPages; i++) {
		const p = list[i];
		const w = Math.max(1, Math.round(p.width));
		const h = Math.max(1, Math.round(p.height));
		startObj(imageOf(i));
		push(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
		push(p.jpeg);
		push("\nendstream");
		endObj();
		const content = `q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`;
		startObj(contentOf(i));
		push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
		endObj();
		startObj(pageOf(i));
		push(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${imageOf(i)} 0 R >> >> /Contents ${contentOf(i)} 0 R >>`);
		endObj();
	}
	startObj(infoId);
	push(`<< /Title (${pdfEsc(title)}) /Producer (The Voice Design) >>`);
	endObj();
	const xrefAt = size;
	const maxId = infoId;
	push(`xref\n0 ${maxId + 1}\n`);
	push("0000000000 65535 f \n");
	for (let i = 1; i <= maxId; i++) push(`${String(objAt[i] ?? 0).padStart(10, "0")} 00000 n \n`);
	push(`trailer\n<< /Size ${maxId + 1} /Root ${catalog} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);
	const out = new Uint8Array(size);
	let o = 0;
	for (const c of chunks) {
		out.set(c, o);
		o += c.length;
	}
	return out;
}
function downloadBytes(bytes, filename, mime) {
	const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
	const blob = new Blob([ab], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 2e3);
}
/** JPEG pages are written with /Filter /DCTDecode. */
function buildJpegPdf(pages, title = "The Voice") {
	return buildJpegPdf$1(pages, title);
}
function svgFilterId(id, prefix = "") {
	return `${prefix}sh-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
function svgShadowFilter(id, shadow, prefix = "") {
	const p = canvasShadowParams(shadow);
	const fid = svgFilterId(id, prefix);
	const std = Math.max(.01, p.blur / 2);
	if (p.inset) return `<filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx="${p.ox}" dy="${p.oy}" result="off"/><feGaussianBlur in="off" stdDeviation="${std}" result="blur"/><feComposite in="SourceAlpha" in2="blur" operator="out" result="hollow"/><feFlood flood-color="${esc$1(p.color)}" result="tint"/><feComposite in="tint" in2="hollow" operator="in" result="shade"/><feComposite in="shade" in2="SourceGraphic" operator="over"/></filter>`;
	return `<filter id="${fid}" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB">${p.spread > 0 ? `<feMorphology in="SourceAlpha" operator="dilate" radius="${p.spread}" result="fat"/><feOffset in="fat" dx="${p.ox}" dy="${p.oy}" result="off"/>` : `<feOffset in="SourceAlpha" dx="${p.ox}" dy="${p.oy}" result="off"/>`}<feGaussianBlur in="off" stdDeviation="${std}" result="blur"/><feFlood flood-color="${esc$1(p.color)}" result="tint"/><feComposite in="tint" in2="blur" operator="in" result="shade"/><feMerge><feMergeNode in="shade"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}
function shadowAttr(n, prefix = "") {
	if (!n.shadow) return "";
	return ` filter="url(#${svgFilterId(n.id, prefix)})"`;
}
var SVG_BLENDS = "multiply,screen,overlay,darken,lighten,soft-light,hard-light,color-dodge,color-burn";
function blendAttr(n) {
	const blend = n.blend;
	if (!blend || blend === "source-over") return "";
	if (!SVG_BLENDS.split(",").includes(blend)) return "";
	return ` style="mix-blend-mode:${blend}"`;
}
/** Non-normal group blend. Isolation flattens the nest before the blend hits the artboard. */
function svgGroupBlendStyle(n) {
	const blend = n.blend;
	if (!blend || blend === "source-over") return "";
	if (!SVG_BLENDS.split(",").includes(blend)) return "";
	return ` style="isolation:isolate;mix-blend-mode:${blend}" data-isolate="1"`;
}
/** Own opacity. A wrapping group multiplies this via the parent <g>, it does not replace it. */
function svgOpacityAttr(n) {
	if (n.opacity === 1 || Number.isNaN(n.opacity)) return "";
	return ` opacity="${n.opacity}"`;
}
/** Canvas rotates about the node box center — SVG must match. */
function svgRotateTransform(n) {
	const rot = n.rotation ?? 0;
	if (!rot) return "";
	return `rotate(${rot} ${n.x + n.w / 2} ${n.y + n.h / 2})`;
}
/** Group rotation turns the nest about the group box centre. Children keep their own rotation inside it. */
function svgGroupRotateTransform(n) {
	const t = svgRotateTransform(n);
	if (!t) return "";
	return ` transform="${t}" data-rotate="1"`;
}
function rotateWrap(n, inner) {
	const t = svgRotateTransform(n);
	if (!t) return inner;
	return `<g transform="${t}">${inner}</g>`;
}
/** World-space path d with rotation baked into anchors and cubic handles. */
function bakedPathD(n, pts, closed) {
	const rot = n.rotation ?? 0;
	const cx = n.x + n.w / 2;
	const cy = n.y + n.h / 2;
	const baked = bakeRotatedPoints(n.x, n.y, pts, rot, cx, cy);
	return pathD(0, 0, baked, closed);
}
function svgStrokeStyle(n) {
	const parts = [];
	const dash = n.strokeDash ?? 0;
	if (dash > 0) {
		parts.push(` stroke-dasharray="${dash} ${dash}"`);
		const off = n.strokeDashOffset ?? 0;
		if (off) parts.push(` stroke-dashoffset="${off}"`);
	}
	const cap = n.lineCap ?? "round";
	parts.push(` stroke-linecap="${cap}"`);
	const join = n.lineJoin ?? "round";
	parts.push(` stroke-linejoin="${join}"`);
	const miter = n.miterLimit ?? 4;
	if (join === "miter") parts.push(` stroke-miterlimit="${miter}"`);
	return parts.join("");
}
function rasterize(doc, scale = 1, opts) {
	const edges = resolveBleed(doc);
	const paperBase = opts?.cropMarks ? opts.paper ?? 36 : 0;
	const paper = Math.max(edges.left, edges.right, edges.top, edges.bottom, paperBase);
	const canvas = document.createElement("canvas");
	canvas.width = Math.round((doc.artboard.width + paper * 2) * scale);
	canvas.height = Math.round((doc.artboard.height + paper * 2) * scale);
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	drawDocument(ctx, doc, {
		skipChrome: true,
		dpr: scale,
		ox: paper,
		oy: paper
	});
	if (opts?.cropMarks) {
		ctx.save();
		ctx.setTransform(scale, 0, 0, scale, 0, 0);
		ctx.translate(paper, paper);
		drawPrintMarks(ctx, doc, scale, {
			bleedBand: false,
			marks: true
		});
		ctx.restore();
	}
	return canvas;
}
function exportPng(doc, scale = 2) {
	return rasterize(doc, scale).toDataURL("image/png");
}
function exportJpeg(doc, scale = 2, quality = .92) {
	return rasterize(doc, scale).toDataURL("image/jpeg", quality);
}
function exportPrintPng(doc) {
	return rasterize(doc, 4, {
		cropMarks: true,
		paper: 36
	}).toDataURL("image/png");
}
function downloadDataUrl(dataUrl, filename) {
	const a = document.createElement("a");
	a.href = dataUrl;
	a.download = filename;
	a.click();
}
function slug(name) {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "artboard";
}
function printJpegPage(doc, scale = 2, quality = .92) {
	const url = rasterize(doc, scale, {
		cropMarks: true,
		paper: 36
	}).toDataURL("image/jpeg", quality);
	const edges = resolveBleed(doc);
	const paper = Math.max(edges.left, edges.right, edges.top, edges.bottom, 36);
	return {
		width: Math.round((doc.artboard.width + paper * 2) * scale),
		height: Math.round((doc.artboard.height + paper * 2) * scale),
		jpeg: jpegFromDataUrl(url)
	};
}
function downloadPrintPdf(doc) {
	downloadBytes(buildJpegPdf([printJpegPage(doc, 2, .92)], doc.name), `${slug(doc.name)}-print.pdf`, "application/pdf");
}
function estimateGlyphWidth(text, fontSize, opticalScale = 1) {
	if (!text) return 0;
	return text.length * fontSize * .52 * opticalScale;
}
/**
* Caption optical size (low opsz) runs wider per em than display optical size.
* Canvas wrap uses measureText after applyFontFace — SVG wrap must follow the
* same direction so line breaks do not drift when opsz moves off fontSize.
*/
function opticalWrapScale(t) {
	const axis = canvasFont(t.fontFamily)?.opsz;
	if (!axis) return 1;
	const opsz = clampAxis(axis, t.opticalSize, t.fontSize);
	const span = Math.max(1, axis.max - axis.min);
	return 1.08 - .12 * ((opsz - axis.min) / span);
}
function estimateWidth(text, fontSize, letterSpacing, opticalScale = 1) {
	return measureTracked(text, (s) => estimateGlyphWidth(s, fontSize, opticalScale), letterSpacing);
}
function svgTextClipId(id, prefix = "") {
	return `${prefix}tb-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
/** Clip overflowing glyphs to the text box, matching canvas ctx.clip() on the node rect. */
function svgTextBoxClip(t, prefix = "") {
	return `<clipPath id="${svgTextClipId(t.id, prefix)}"><rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}"/></clipPath>`;
}
function collectSvgDefs(doc, prefix = "") {
	const parts = [];
	for (const n of doc.nodes) {
		if (!n.visible) continue;
		if (n.shadow) parts.push(svgShadowFilter(n.id, n.shadow, prefix));
		if (n.kind === "text") parts.push(svgTextBoxClip(n, prefix));
	}
	return parts.join("");
}
function svgTextMarkup(t, fill, prefix = "") {
	const opszScale = opticalWrapScale(t);
	const measure = (s) => estimateWidth(s, t.fontSize, t.letterSpacing ?? 0, opszScale);
	const { lines, lineHeight, startY } = layoutTextLines(t, measure);
	const anchor = t.align === "center" ? "middle" : t.align === "right" ? "end" : "start";
	let ax = t.x;
	if (t.align === "center") ax = t.x + t.w / 2;
	if (t.align === "right") ax = t.x + t.w;
	const family = esc$1(t.fontFamily || "sans-serif");
	const weight = t.fontWeight || 400;
	const tracking = t.letterSpacing ? ` letter-spacing="${t.letterSpacing}"` : "";
	const axes = variationSettings(t);
	const blend = blendAttr(t);
	const styles = [];
	if (axes) styles.push(`font-variation-settings:${axes}`);
	const blendMatch = blend.match(/mix-blend-mode:([^"]+)/);
	if (blendMatch) styles.push(`mix-blend-mode:${blendMatch[1]}`);
	const styleAttr = styles.length ? ` style="${esc$1(styles.join(";"))}"` : "";
	const tspans = lines.map((line, i) => {
		const y = t.y + startY + i * lineHeight;
		return `<tspan x="${ax}" y="${y}">${esc$1(line)}</tspan>`;
	}).join("");
	const clip = ` clip-path="url(#${svgTextClipId(t.id, prefix)})"`;
	const baseline = useDesign.getState().typeBaseline ?? "hanging";
	return `<text fill="${esc$1(fill)}" font-size="${t.fontSize}" font-family="${family}" font-weight="${weight}" text-anchor="${anchor}" dominant-baseline="${baseline}"${tracking}${styleAttr}${svgOpacityAttr(t)}${shadowAttr(t, prefix)}${clip}>${tspans}</text>`;
}
function svgLeafMarkup(n, prefix) {
	const fill = typeof n.fill === "string" ? n.fill : "#3fc6ff";
	const extra = svgStrokeStyle(n);
	if (n.kind === "text") return rotateWrap(n, svgTextMarkup(n, fill, prefix));
	if (n.kind === "path") {
		const p = n;
		const { cut, islands } = partitionPathHoles(p);
		const parts = [bakedPathD(p, p.points, p.closed), ...cut.map((ring) => bakedPathD(p, ring, true))];
		const rule = pathFillRule(p);
		const ruleAttr = cut.length || rule === "evenodd" ? ` fill-rule="${rule}"` : "";
		const holeIslands = islands.map((ring) => `<path d="${esc$1(bakedPathD(p, ring, true))}" fill="${esc$1(fill)}" stroke="${esc$1(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${svgOpacityAttr(n)}${blendAttr(n)}/>`).join("");
		const islandGroup = holeIslands ? `<g data-islands="1">${holeIslands}</g>` : "";
		return `<path d="${esc$1(parts.join(" "))}" fill="${esc$1(fill)}" stroke="${esc$1(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${ruleAttr}${svgOpacityAttr(n)}${shadowAttr(n, prefix)}${blendAttr(n)}/>${islandGroup}`;
	}
	if (isConvertibleShape(n)) {
		const s = n;
		const contour = shapeContour(s);
		return `<path d="${esc$1(bakedPathD(s, contour.points, contour.closed))}" fill="${esc$1(fill)}" stroke="${esc$1(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${svgOpacityAttr(n)}${shadowAttr(n, prefix)}${blendAttr(n)}/>`;
	}
	return rotateWrap(n, `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${esc$1(fill)}" stroke="${esc$1(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${svgOpacityAttr(n)}${shadowAttr(n, prefix)}${blendAttr(n)}/>`);
}
function svgGroupId(id, prefix = "") {
	return `${prefix}g-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
/** Logical group wrapper. Rotation sits on this <g> and turns the nest about the group centre.
*  Opacity sits on this <g>. A non-normal blend also isolates the nest so the group composites
*  as one unit against the artboard, not child-by-child against siblings inside the group.
*  Leaves still write their own opacity and their own rotation.
*/
function svgGroupOpen(n, prefix = "") {
	return `<g id="${svgGroupId(n.id, prefix)}" data-kind="group" data-name="${esc$1(n.name || "Group")}"${svgGroupRotateTransform(n)}${svgOpacityAttr(n)}${svgGroupBlendStyle(n)}>`;
}
/** Hidden groups hoist children and do not paint a group box.
*  Opacity, blend, and rotation still wrap that nest so they ride the export.
*  A fully opaque, unrotated, normal blend stays a bare hoist (no extra tag).
*/
function svgHiddenGroupHoist(n, inner) {
	if (!inner) return "";
	const opacity = svgOpacityAttr(n);
	const blend = svgGroupBlendStyle(n);
	const rot = svgGroupRotateTransform(n);
	if (!opacity && !blend && !rot) return inner;
	return `<g data-hoist="1" data-name="${esc$1(n.name || "Group")}"${rot}${opacity}${blend}>${inner}</g>`;
}
function exportSvgBody(doc, prefix = "") {
	const ids = new Set(doc.nodes.map((n) => n.id));
	const byParent = /* @__PURE__ */ new Map();
	for (const n of doc.nodes) {
		const key = n.parentId && ids.has(n.parentId) ? n.parentId : void 0;
		const list = byParent.get(key) ?? [];
		list.push(n);
		byParent.set(key, list);
	}
	const walk = (parentId) => {
		return (byParent.get(parentId) ?? []).map((n) => {
			if (isGroup(n)) {
				const inner = walk(n.id);
				if (!n.visible) return svgHiddenGroupHoist(n, inner);
				return `${svgGroupOpen(n, prefix)}${inner}</g>`;
			}
			if (!n.visible) return "";
			return svgLeafMarkup(n, prefix);
		}).join("");
	};
	return walk(void 0);
}
function exportSvg(doc) {
	const { width, height, background } = doc.artboard;
	const bg = typeof background === "string" ? background : "#ffffff";
	const defs = collectSvgDefs(doc);
	const defsBlock = defs ? `<defs>${defs}</defs>` : "";
	const body = exportSvgBody(doc);
	return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defsBlock}<rect width="100%" height="100%" fill="${esc$1(bg)}"/>${body}</svg>`;
}
function downloadSvg(doc) {
	const blob = new Blob([exportSvg(doc)], { type: "image/svg+xml" });
	const url = URL.createObjectURL(blob);
	downloadDataUrl(url, `${slug(doc.name)}.svg`);
	setTimeout(() => URL.revokeObjectURL(url), 2e3);
}
function esc$1(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function pdfTypePageCount(bytes) {
	return (new TextDecoder("latin1").decode(bytes).match(/\/Type\s*\/Page(?!s)/g) || []).length;
}
function pdfPagesCountField(bytes) {
	const match = new TextDecoder("latin1").decode(bytes).match(/\/Count\s+(\d+)/);
	return match ? Number(match[1]) : 0;
}
function esc(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function campaignDocsFromIndex(index, current) {
	if (!current.campaignId) return [current];
	const docs = campaignPages(index, current.campaignId).map((p) => p.id === current.id ? current : loadDoc(p.id)).filter((d) => !!d);
	return docs.length ? docs : [current];
}
function campaignStackLayout(docs) {
	return campaignStackFromSizes(docs.map((d) => ({
		width: d.artboard.width,
		height: d.artboard.height
	})));
}
/** Shared stack math for SVG export and the campaign readout. */
function campaignStackFromSizes(sizes) {
	const widths = sizes.map((s) => s.width);
	const heights = sizes.map((s) => s.height);
	const width = sizes.length ? Math.max(...widths) : 1;
	const height = sizes.length ? heights.reduce((sum, h) => sum + h, 0) + 48 * Math.max(0, sizes.length - 1) : 1;
	const offsets = [];
	let y = 0;
	for (const h of heights) {
		offsets.push(y);
		y += h + 48;
	}
	return {
		width,
		height,
		offsets
	};
}
function campaignReadoutFromSizes(sizes) {
	const boards = sizes.length;
	if (!boards) return {
		boards: 0,
		stackWidth: 0,
		stackHeight: 0,
		label: "No boards"
	};
	const { width, height } = campaignStackFromSizes(sizes);
	return {
		boards,
		stackWidth: width,
		stackHeight: height,
		label: `${boards} board${boards === 1 ? "" : "s"} · stack ${width}×${height}`
	};
}
function exportCampaignSvg(docs) {
	if (docs.length === 0) return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"/>`;
	if (docs.length === 1) return exportSvg(docs[0]);
	const { width, height, offsets } = campaignStackLayout(docs);
	return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${docs.map((d, i) => collectSvgDefs(d, `p${i}-`)).join("")}</defs>${docs.map((d, i) => {
		const bg = typeof d.artboard.background === "string" ? d.artboard.background : "#ffffff";
		const y = offsets[i] ?? 0;
		return `<g id="${esc(slug(d.name) || d.id)}" data-page="${i + 1}" transform="translate(0 ${y})"><rect width="${d.artboard.width}" height="${d.artboard.height}" fill="${esc(bg)}"/>${exportSvgBody(d, `p${i}-`)}</g>`;
	}).join("")}</svg>`;
}
/** JPEG pages in campaign stack order — same sequence Present walks. */
function campaignPdfPages(docs) {
	return (docs.length ? docs : []).map((d) => printJpegPage(d));
}
function campaignPdfPageCount(docs) {
	return docs.length;
}
/** One PDF page per board. JPEG /Filter /DCTDecode, same order as Campaign SVG. */
function exportCampaignPdf(docs, _scale = 1) {
	return buildJpegPdf(campaignPdfPages(docs), docs[0]?.name ?? "Campaign");
}
function downloadCampaignSvg(docs, name) {
	const blob = new Blob([exportCampaignSvg(docs)], { type: "image/svg+xml" });
	const url = URL.createObjectURL(blob);
	downloadDataUrl(url, `${slug(name || docs[0]?.name || "campaign")}-campaign.svg`);
	setTimeout(() => URL.revokeObjectURL(url), 2e3);
}
function downloadCampaignPdf(docs, name, _scale = 2) {
	downloadBytes(exportCampaignPdf(docs), `${slug(name || docs[0]?.name || "campaign")}-campaign.pdf`, "application/pdf");
}
function threeBoardCampaignFixture$1() {
	return [
		{
			...blankDocument("poster", "Board A"),
			campaignId: "smoke-campaign"
		},
		{
			...blankDocument("square", "Board B"),
			campaignId: "smoke-campaign"
		},
		{
			...blankDocument("ig-story", "Board C"),
			campaignId: "smoke-campaign"
		}
	];
}
/** Raster each board to JPEG and pack a multi-page PDF. Browser-only (needs canvas). */
function probeRasterCampaignPdf(docs = threeBoardCampaignFixture$1()) {
	const bytes = exportCampaignPdf(docs);
	const latin = new TextDecoder("latin1").decode(bytes);
	return {
		boards: docs.length,
		typePage: pdfTypePageCount(bytes),
		countField: pdfPagesCountField(bytes),
		header: latin.slice(0, 8),
		bytes: bytes.length
	};
}
function installCampaignPdfSmokeHook$1() {
	if (typeof window === "undefined") return;
	window.__voiceDesignCampaignPdf = {
		probeRaster: probeRasterCampaignPdf,
		threeBoard: threeBoardCampaignFixture$1
	};
}
function countPdfTypePageObjects(bytes) {
	return pdfTypePageCount(bytes);
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: (error instanceof Error ? error.message : String(error ?? "")) || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		import("./export-campaign-BK354iBB.mjs").then((m) => m.installCampaignPdfSmokeHook());
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function threeBoardCampaignFixture() {
	return [
		blankDocument("card", "Board A"),
		blankDocument("card", "Board B"),
		blankDocument("card", "Board C")
	];
}
function rasterThreeBoardCampaignPdf(scale = 1) {
	const docs = threeBoardCampaignFixture();
	const pdf = exportCampaignPdf(docs, scale);
	const typePages = countPdfTypePageObjects(pdf);
	return {
		expected: campaignPdfPageCount(docs),
		typePages,
		bytes: pdf.byteLength,
		header: new TextDecoder("latin1").decode(pdf.slice(0, 8))
	};
}
function installCampaignPdfSmokeHook() {
	if (typeof window === "undefined") return;
	window.__voiceDesignCampaignPdfSmoke = rasterThreeBoardCampaignPdf;
}
installCampaignPdfSmokeHook();
function CampaignPdfSmokeBridge() {
	(0, import_react.useEffect)(() => {
		installCampaignPdfSmokeHook();
	}, []);
	return null;
}
var styles_default = "/assets/styles-DQ0g9-qP.css";
var APP_NAME = "The Voice Design";
var Route$2 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Artboard, paint, and press — a graphic design studio inside The Voice, built to outpace Canva and KRESKA."
			},
			{
				name: "theme-color",
				content: "#0a0d0c"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: FONT_LINK
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-ground font-sans text-ink",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignPdfSmokeBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter$1 = () => import("./routes-Cf6A3Xxi.mjs");
var Route$1 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./studio._id-Bcsx9H1h.mjs");
var Route = createFileRoute("/studio/$id")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$1.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$2
	}),
	StudioIdRoute: Route.update({
		id: "/studio/$id",
		path: "/studio/$id",
		getParentRoute: () => Route$2
	})
};
var routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { pathFillRule as A, slug as C, uniformBleed as D, resolveBleed as E, dropHole as O, exportPrintPng as S, bleedMmToPx as T, downloadDataUrl as _, exportJpeg as b, downloadCampaignSvg as d, setHoleFillRule as j, holeFillRule as k, installCampaignPdfSmokeHook$1 as m, Route as n, campaignReadoutFromSizes as o, campaignDocsFromIndex as r, router_exports as t, downloadCampaignPdf as u, downloadPrintPdf as v, BLEED_PRESETS as w, exportPng as x, downloadSvg as y };
