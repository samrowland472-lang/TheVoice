import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as useNavigate, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { c as string, o as number, r as array, s as object } from "../_libs/zod.mjs";
import { $ as makeShape, A as drawPathTangents, At as stampShadowOffset, B as holdStudioStatus, C as cloneShadow, Ct as shadowSpreadLabel, D as descendantsOf, Dt as stampShadowBlur, E as degToRad, Et as smoothPathCorners, F as fitViewport, Ft as subscribeStudioStatus, G as isGradient, I as flattenLayers, It as uid, J as isPath, K as isGroup, L as getStudioStatus, Lt as useDesign, M as faceAxis, Mt as stampShadowOy, N as filterChipLabel, Nt as stampShadowSpread, O as dragPathHandle, Ot as stampShadowColor, P as filterKey, Pt as strokeSegment, R as hasHandle, S as cloneFilters, St as shadowSpread, T as cssFilterStyle, Tt as shapeToPathNode, U as isBitmap, V as imageNode, W as isConvertibleShape, X as layerDropLegal, Y as isText, _ as brushById, _t as shadowInset, at as nodeCenter, bt as shadowOffsetChipLabel, ct as normalizeFilters, d as applyFontFace, dt as releaseStudioStatus, et as makeText, f as arrowPoints, ft as rotatePoint, gt as shadowCropExtents, ht as shadowChipLabel, i as DEFAULT_SHADOW, it as nearPenClose, j as expandMovePlaces, jt as stampShadowOx, k as drawDocument, kt as stampShadowInset, l as aabb, m as autoSmoothPoint, mt as setStudioStatus, n as CANVAS_FONTS, o as FORMATS, ot as nodeWorldAabb, p as asEditablePath, pt as screenToDoc, q as isHeldStudioStatus, r as DEFAULT_FILTERS, rt as mirrorHandle, st as normalizeCrop, t as BRUSHES, tt as markStayOnHub, u as anyFaceHasAxis, ut as pathNode, v as campaignPages, vt as shadowInsetLabel, w as closePathWithCubic, x as clampAxis, xt as shadowPreviewCss, yt as shadowKey, z as hitPathEdit } from "./render-Dkgk1Dgz.mjs";
import { A as Grid3x3, C as LockOpen, D as Hexagon, E as ImagePlus, F as Eraser, G as ArrowUpRight, H as ChevronUp, I as Ellipsis, K as ArrowLeft, L as Droplet, N as Eye, O as Hand, P as EyeOff, R as Download, S as Lock, U as ChevronRight, V as Circle, W as ChevronDown, _ as PenTool, b as Minus, c as Square, d as Scan, f as Save, j as Frame, k as GripVertical, l as Search, m as Redo2, n as Undo2, p as Ruler, r as Type, s as Star, t as X, u as Scissors, v as Paintbrush, w as Link2, x as Maximize2, y as MousePointer2, z as Crop } from "../_libs/lucide-react.mjs";
import { A as pathFillRule, C as slug, D as uniformBleed, E as resolveBleed, O as dropHole, S as exportPrintPng, T as bleedMmToPx, _ as downloadDataUrl, b as exportJpeg, d as downloadCampaignSvg, j as setHoleFillRule, k as holeFillRule, n as Route, o as campaignReadoutFromSizes, r as campaignDocsFromIndex, u as downloadCampaignPdf, v as downloadPrintPdf, w as BLEED_PRESETS, x as exportPng, y as downloadSvg } from "./router-Ch_EdYLQ.mjs";
import { i as cn, n as Button, r as CommandPalette, t as AppShell } from "./command-palette-B9n8NFIu.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio._id-Bcsx9H1h.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RESIZE_HANDLES = [
	"nw",
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w"
];
function handlePoint(box, handle) {
	const midX = box.x + box.w / 2;
	const midY = box.y + box.h / 2;
	const right = box.x + box.w;
	const bottom = box.y + box.h;
	switch (handle) {
		case "nw": return {
			x: box.x,
			y: box.y
		};
		case "n": return {
			x: midX,
			y: box.y
		};
		case "ne": return {
			x: right,
			y: box.y
		};
		case "e": return {
			x: right,
			y: midY
		};
		case "se": return {
			x: right,
			y: bottom
		};
		case "s": return {
			x: midX,
			y: bottom
		};
		case "sw": return {
			x: box.x,
			y: bottom
		};
		case "w": return {
			x: box.x,
			y: midY
		};
	}
}
function hitResizeHandle(box, x, y, zoom) {
	const r = 7 / Math.max(zoom, .01);
	let best = null;
	let bestD = r;
	for (const h of RESIZE_HANDLES) {
		const p = handlePoint(box, h);
		const d = Math.hypot(x - p.x, y - p.y);
		if (d <= bestD) {
			bestD = d;
			best = h;
		}
	}
	return best;
}
var EPS$1 = 1e-9;
var GRID$2 = 1e-4;
var MAX_VERTS = 480;
function snap$1(n) {
	return Math.round(n / GRID$2) * GRID$2;
}
function snapPt$1(p) {
	return {
		x: snap$1(p.x),
		y: snap$1(p.y)
	};
}
function almost$1(a, b) {
	return Math.abs(a - b) <= GRID$2 * 2;
}
function ringArea$1(pts) {
	let a = 0;
	const n = pts.length;
	if (n < 3) return 0;
	for (let i = 0; i < n; i++) {
		const p = pts[i];
		const q = pts[(i + 1) % n];
		a += p.x * q.y - q.x * p.y;
	}
	return a / 2;
}
function eq$1(a, b) {
	return almost$1(a.x, b.x) && almost$1(a.y, b.y);
}
function keyOf$1(p) {
	return `${snap$1(p.x)},${snap$1(p.y)}`;
}
function dist2$1(a, b) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}
function cleanRing$1(pts) {
	const snapped = pts.map(snapPt$1);
	const out = [];
	for (const p of snapped) {
		const last = out[out.length - 1];
		if (!last || !eq$1(last, p)) out.push(p);
	}
	if (out.length > 1 && eq$1(out[0], out[out.length - 1])) out.pop();
	if (out.length > MAX_VERTS) {
		const step = out.length / MAX_VERTS;
		const slim = [];
		for (let i = 0; i < MAX_VERTS; i++) slim.push(out[Math.min(out.length - 1, Math.floor(i * step))]);
		return slim;
	}
	return out;
}
function collapseColinear(pts) {
	if (pts.length < 4) return pts;
	const out = [];
	const n = pts.length;
	for (let i = 0; i < n; i++) {
		const a = pts[(i + n - 1) % n];
		const b = pts[i];
		const c = pts[(i + 1) % n];
		const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
		const dot = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y);
		if (Math.abs(cross) <= GRID$2 * 8 && dot > 0) continue;
		out.push(b);
	}
	return out.length >= 3 ? out : pts;
}
function winding(pt, rings) {
	let w = 0;
	for (const ring of rings) if (pointInRing$4(pt, ring)) w += 1;
	return w % 2;
}
function pointInRing$4(pt, ring) {
	let inside = false;
	const n = ring.length;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const a = ring[i];
		const b = ring[j];
		if (a.y > pt.y !== b.y > pt.y && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y || EPS$1) + a.x) inside = !inside;
	}
	return inside;
}
function ringCentroid$1(ring) {
	let x = 0;
	let y = 0;
	for (const p of ring) {
		x += p.x;
		y += p.y;
	}
	const n = ring.length || 1;
	return {
		x: x / n,
		y: y / n
	};
}
function ringContains$1(outer, inner) {
	if (inner.length < 3 || outer.length < 3) return false;
	if (Math.abs(ringArea$1(inner)) >= Math.abs(ringArea$1(outer)) - GRID$2) return false;
	const samples = [ringCentroid$1(inner)];
	const count = inner.length;
	const take = Math.min(count, 9);
	for (let i = 0; i < take; i++) samples.push(inner[Math.floor(i * count / take)]);
	let hits = 0;
	for (const s of samples) if (pointInRing$4(s, outer)) hits += 1;
	return hits >= Math.ceil(samples.length * .6);
}
function segIntersect$1(a1, a2, b1, b2) {
	const dx1 = a2.x - a1.x;
	const dy1 = a2.y - a1.y;
	const dx2 = b2.x - b1.x;
	const dy2 = b2.y - b1.y;
	const den = dx1 * dy2 - dy1 * dx2;
	if (Math.abs(den) < 1e-12) return null;
	const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / den;
	const u = ((b1.x - a1.x) * dy1 - (b1.y - a1.y) * dx1) / den;
	if (t < -1e-8 || t > 1 + 1e-8 || u < -1e-8 || u > 1 + 1e-8) return null;
	return {
		p: snapPt$1({
			x: a1.x + t * dx1,
			y: a1.y + t * dy1
		}),
		t
	};
}
function onSeg$1(h, a, b) {
	const minx = Math.min(a.x, b.x) - GRID$2 * 2;
	const maxx = Math.max(a.x, b.x) + GRID$2 * 2;
	const miny = Math.min(a.y, b.y) - GRID$2 * 2;
	const maxy = Math.max(a.y, b.y) + GRID$2 * 2;
	if (h.x < minx || h.x > maxx || h.y < miny || h.y > maxy) return false;
	const cross = (h.x - a.x) * (b.y - a.y) - (h.y - a.y) * (b.x - a.x);
	return Math.abs(cross) <= GRID$2 * 20;
}
function splitRingAtHits$1(ring, hits) {
	if (!hits.length) return ring;
	const out = [];
	const n = ring.length;
	for (let i = 0; i < n; i++) {
		const a = ring[i];
		const b = ring[(i + 1) % n];
		out.push(a);
		const mid = hits.filter((h) => !eq$1(h, a) && !eq$1(h, b)).filter((h) => onSeg$1(h, a, b)).sort((p, q) => dist2$1(a, p) - dist2$1(a, q));
		for (const h of mid) if (!eq$1(out[out.length - 1], h)) out.push(h);
	}
	return cleanRing$1(out);
}
function collectCrossings(a, b) {
	const hits = [];
	for (let i = 0; i < a.length; i++) {
		const a1 = a[i];
		const a2 = a[(i + 1) % a.length];
		for (let j = 0; j < b.length; j++) {
			const b1 = b[j];
			const b2 = b[(j + 1) % b.length];
			const hit = segIntersect$1(a1, a2, b1, b2);
			if (hit) hits.push(hit.p);
		}
	}
	return hits;
}
function selfCrossings$1(ring) {
	const hits = [];
	const n = ring.length;
	for (let i = 0; i < n; i++) {
		const a1 = ring[i];
		const a2 = ring[(i + 1) % n];
		for (let j = i + 1; j < n; j++) {
			if (Math.abs(i - j) <= 1 || i === 0 && j === n - 1) continue;
			const b1 = ring[j];
			const b2 = ring[(j + 1) % n];
			if (eq$1(a1, b1) || eq$1(a1, b2) || eq$1(a2, b1) || eq$1(a2, b2)) continue;
			const hit = segIntersect$1(a1, a2, b1, b2);
			if (hit && !eq$1(hit.p, a1) && !eq$1(hit.p, a2)) hits.push(hit.p);
		}
	}
	return hits;
}
function splitSelfOverlapping$1(ring) {
	const raw = cleanRing$1(ring);
	if (raw.length < 4) return raw.length >= 3 ? [raw] : [];
	const hits = selfCrossings$1(raw);
	if (!hits.length) return [raw];
	const split = splitRingAtHits$1(raw, hits);
	if (split.length < 4) return [raw];
	const firstAt = /* @__PURE__ */ new Map();
	const lobes = [];
	const consumed = /* @__PURE__ */ new Set();
	for (let i = 0; i < split.length; i++) {
		const k = keyOf$1(split[i]);
		const prev = firstAt.get(k);
		if (prev != null && i - prev >= 3) {
			const lobe = cleanRing$1(split.slice(prev, i));
			if (lobe.length >= 3 && Math.abs(ringArea$1(lobe)) > GRID$2 * 40) {
				lobes.push(lobe);
				for (let j = prev; j < i; j++) consumed.add(`${j}`);
			}
		} else if (prev == null) firstAt.set(k, i);
	}
	if (lobes.length === 1) {
		const k = keyOf$1(lobes[0][0]);
		const idxs = split.map((p, i) => keyOf$1(p) === k ? i : -1).filter((i) => i >= 0);
		if (idxs.length >= 2) {
			const a = idxs[0];
			const b = idxs[1];
			const wrap = cleanRing$1([...split.slice(b), ...split.slice(0, a)]);
			if (wrap.length >= 3 && Math.abs(ringArea$1(wrap)) > GRID$2 * 40) lobes.push(wrap);
		}
	}
	if (!lobes.length) return [raw];
	const unique = [];
	for (const lobe of lobes) {
		const sig = lobe.map(keyOf$1).sort().join("|");
		if (!unique.some((u) => u.map(keyOf$1).sort().join("|") === sig)) unique.push(lobe);
	}
	return unique.length ? unique : [raw];
}
function insideResult(wa, wb, op) {
	const a = wa !== 0;
	const b = wb !== 0;
	if (op === "union") return a || b;
	if (op === "intersect") return a && b;
	if (op === "subtract") return a && !b;
	return a !== b;
}
function leftOf(a, b, scale = .05) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = Math.hypot(dx, dy) || 1;
	return {
		x: (a.x + b.x) / 2 - dy / len * scale,
		y: (a.y + b.y) / 2 + dx / len * scale
	};
}
function rightOf(a, b, scale = .05) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = Math.hypot(dx, dy) || 1;
	return {
		x: (a.x + b.x) / 2 + dy / len * scale,
		y: (a.y + b.y) / 2 - dx / len * scale
	};
}
function splitAgainst(rings, other) {
	return rings.map((r) => {
		return splitRingAtHits$1(r, other.flatMap((o) => collectCrossings(r, o)));
	});
}
function halves(rings) {
	const out = [];
	for (const r of rings) for (let i = 0; i < r.length; i++) out.push({
		a: r[i],
		b: r[(i + 1) % r.length]
	});
	return out;
}
function clipTwo(aRings, bRings, op) {
	const A0 = aRings.flatMap(splitSelfOverlapping$1).map(cleanRing$1).filter((r) => r.length >= 3);
	const B0 = bRings.flatMap(splitSelfOverlapping$1).map(cleanRing$1).filter((r) => r.length >= 3);
	if (!A0.length) return op === "intersect" || op === "subtract" ? [] : B0;
	if (!B0.length) return op === "intersect" ? [] : A0;
	const A = splitAgainst(A0, B0);
	const B = splitAgainst(B0, A0);
	const edges = [...halves(A), ...halves(B)];
	const kept = [];
	for (const e of edges) {
		if (eq$1(e.a, e.b)) continue;
		const L = leftOf(e.a, e.b);
		const R = rightOf(e.a, e.b);
		const inL = insideResult(winding(L, A0), winding(L, B0), op);
		const inR = insideResult(winding(R, A0), winding(R, B0), op);
		if (inL && !inR) kept.push(e);
		else if (inR && !inL) kept.push({
			a: e.b,
			b: e.a
		});
	}
	return chainHalves(kept);
}
function chainHalves(frags) {
	const unused = frags.map((f) => ({
		...f,
		used: false
	}));
	const rings = [];
	for (let i = 0; i < unused.length; i++) {
		if (unused[i].used) continue;
		unused[i].used = true;
		const ring = [unused[i].a, unused[i].b];
		let guard = 0;
		while (guard++ < unused.length + 4) {
			const tip = ring[ring.length - 1];
			let found = -1;
			let best = Infinity;
			for (let j = 0; j < unused.length; j++) {
				const f = unused[j];
				if (f.used) continue;
				const d = dist2$1(tip, f.a);
				if (d <= best && (eq$1(tip, f.a) || d < GRID$2 * GRID$2 * 80)) {
					best = d;
					found = j;
				}
			}
			if (found < 0) break;
			unused[found].used = true;
			const nxt = unused[found].b;
			if (!eq$1(ring[ring.length - 1], unused[found].a)) ring.push(unused[found].a);
			ring.push(nxt);
			if (eq$1(nxt, ring[0]) && ring.length > 3) break;
		}
		const cleaned = collapseColinear(cleanRing$1(ring));
		if (cleaned.length >= 3 && Math.abs(ringArea$1(cleaned)) > GRID$2 * 40) rings.push(cleaned);
	}
	return rings;
}
/**
* Nest result rings by nearest (smallest) container.
* Each uncontained ring is an island outer. Every descendant — including an
* island that sits inside a punched hole — stays on that island as an evenodd
* contour so apply keeps hole ownership instead of minting a second fill.
*/
function groupIslands(rings) {
	const cleaned = rings.map(cleanRing$1).filter((r) => r.length >= 3);
	if (!cleaned.length) return [];
	const n = cleaned.length;
	const area = cleaned.map((r) => Math.abs(ringArea$1(r)));
	const parent = new Array(n).fill(-1);
	for (let i = 0; i < n; i++) {
		let best = -1;
		let bestArea = Infinity;
		for (let j = 0; j < n; j++) {
			if (i === j) continue;
			if (area[j] + GRID$2 <= area[i]) continue;
			if (!ringContains$1(cleaned[j], cleaned[i])) continue;
			if (area[j] < bestArea) {
				bestArea = area[j];
				best = j;
			}
		}
		parent[i] = best;
	}
	const children = Array.from({ length: n }, () => []);
	const roots = [];
	for (let i = 0; i < n; i++) if (parent[i] < 0) roots.push(i);
	else children[parent[i]].push(i);
	const islands = [];
	for (const root of roots) {
		const holes = [];
		const stack = [...children[root]];
		while (stack.length) {
			const c = stack.pop();
			holes.push(cleaned[c]);
			stack.push(...children[c]);
		}
		islands.push({
			outer: cleaned[root],
			holes
		});
	}
	return islands;
}
function clipMany(groups, op) {
	const prepared = groups.map((g) => g.flatMap(splitSelfOverlapping$1).map(cleanRing$1).filter((r) => r.length >= 3)).filter((g) => g.length);
	if (prepared.length < 2) return prepared[0] ?? [];
	let acc = prepared[0];
	for (let i = 1; i < prepared.length; i++) {
		acc = clipTwo(acc, prepared[i], op);
		if (!acc.length && (op === "intersect" || op === "subtract")) return [];
		acc = groupIslands(acc).flatMap((island) => [island.outer, ...island.holes]);
	}
	return acc;
}
var GRID$1 = 1e-4;
function pointInRing$3(pt, ring) {
	let inside = false;
	const n = ring.length;
	const EPS = 1e-9;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const a = ring[i];
		const b = ring[j];
		if (a.y > pt.y !== b.y > pt.y && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y || EPS) + a.x) inside = !inside;
	}
	return inside;
}
function ringContains(outer, inner) {
	if (inner.length < 3 || outer.length < 3) return false;
	let hits = 0;
	const sample = Math.min(inner.length, 5);
	for (let i = 0; i < sample; i++) if (pointInRing$3(inner[Math.floor(i * inner.length / sample)], outer)) hits += 1;
	return hits >= Math.ceil(sample / 2);
}
function smallestParent(rings, index) {
	let parent = -1;
	let parentArea = Infinity;
	const inner = rings[index];
	for (let i = 0; i < rings.length; i++) {
		if (i === index) continue;
		const cand = rings[i];
		if (!ringContains(cand, inner)) continue;
		const area = Math.abs(ringArea$1(cand));
		if (area + GRID$1 < parentArea) {
			parentArea = area;
			parent = i;
		}
	}
	return parent;
}
function groupIslandsNested(rings) {
	if (!rings.length) return [];
	const byArea = [...rings].sort((a, b) => Math.abs(ringArea$1(b)) - Math.abs(ringArea$1(a)));
	const parent = byArea.map((_, i) => smallestParent(byArea, i));
	const roots = [];
	for (let i = 0; i < byArea.length; i++) if (parent[i] === -1) roots.push(i);
	return roots.map((root) => {
		const holes = [];
		for (let j = 0; j < byArea.length; j++) {
			if (j === root) continue;
			let walk = parent[j];
			let owned = false;
			const seen = /* @__PURE__ */ new Set();
			while (walk >= 0 && !seen.has(walk)) {
				seen.add(walk);
				if (walk === root) {
					owned = true;
					break;
				}
				walk = parent[walk];
			}
			if (owned) holes.push(byArea[j]);
		}
		return {
			outer: byArea[root],
			holes
		};
	});
}
var GRID = 1e-4;
function snap(n) {
	return Math.round(n / GRID) * GRID;
}
function snapPt(p) {
	return {
		x: snap(p.x),
		y: snap(p.y)
	};
}
function almost(a, b) {
	return Math.abs(a - b) <= GRID * 2;
}
function eq(a, b) {
	return almost(a.x, b.x) && almost(a.y, b.y);
}
function keyOf(p) {
	return `${snap(p.x)},${snap(p.y)}`;
}
function dist2(a, b) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}
function cleanRing(pts) {
	const snapped = pts.map(snapPt);
	const out = [];
	for (const p of snapped) {
		const last = out[out.length - 1];
		if (!last || !eq(last, p)) out.push(p);
	}
	if (out.length > 1 && eq(out[0], out[out.length - 1])) out.pop();
	return out;
}
function onSeg(h, a, b) {
	const minx = Math.min(a.x, b.x) - GRID * 2;
	const maxx = Math.max(a.x, b.x) + GRID * 2;
	const miny = Math.min(a.y, b.y) - GRID * 2;
	const maxy = Math.max(a.y, b.y) + GRID * 2;
	if (h.x < minx || h.x > maxx || h.y < miny || h.y > maxy) return false;
	const cross = (h.x - a.x) * (b.y - a.y) - (h.y - a.y) * (b.x - a.x);
	return Math.abs(cross) <= GRID * 20;
}
function segIntersect(a1, a2, b1, b2) {
	const dx1 = a2.x - a1.x;
	const dy1 = a2.y - a1.y;
	const dx2 = b2.x - b1.x;
	const dy2 = b2.y - b1.y;
	const den = dx1 * dy2 - dy1 * dx2;
	if (Math.abs(den) < 1e-12) return null;
	const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / den;
	const u = ((b1.x - a1.x) * dy1 - (b1.y - a1.y) * dx1) / den;
	if (t < -1e-8 || t > 1 + 1e-8 || u < -1e-8 || u > 1 + 1e-8) return null;
	return {
		p: snapPt({
			x: a1.x + t * dx1,
			y: a1.y + t * dy1
		}),
		t
	};
}
function splitRingAtHits(ring, hits) {
	if (!hits.length) return ring;
	const out = [];
	const n = ring.length;
	for (let i = 0; i < n; i++) {
		const a = ring[i];
		const b = ring[(i + 1) % n];
		out.push(a);
		const mid = hits.filter((h) => !eq(h, a) && !eq(h, b)).filter((h) => onSeg(h, a, b)).sort((p, q) => dist2(a, p) - dist2(a, q));
		for (const h of mid) if (!eq(out[out.length - 1], h)) out.push(h);
	}
	return cleanRing(out);
}
function selfCrossings(ring) {
	const hits = [];
	const n = ring.length;
	for (let i = 0; i < n; i++) {
		const a1 = ring[i];
		const a2 = ring[(i + 1) % n];
		for (let j = i + 1; j < n; j++) {
			if (Math.abs(i - j) <= 1 || i === 0 && j === n - 1) continue;
			const b1 = ring[j];
			const b2 = ring[(j + 1) % n];
			if (eq(a1, b1) || eq(a1, b2) || eq(a2, b1) || eq(a2, b2)) continue;
			const hit = segIntersect(a1, a2, b1, b2);
			if (hit && !eq(hit.p, a1) && !eq(hit.p, a2)) hits.push(hit.p);
		}
	}
	return hits;
}
/**
* Winding pass: walk a self-overlapping trace (figure-eight / bowtie),
* close a simple lobe every time the polyline returns to a vertex, then
* recurse so clip sees simple rings instead of one twisted contour.
*/
function extractWindingLobes(split) {
	const lastAt = /* @__PURE__ */ new Map();
	const lobes = [];
	const pushLobe = (slice) => {
		const lobe = cleanRing(slice);
		if (lobe.length >= 3 && Math.abs(ringArea$1(lobe)) > GRID * 40) lobes.push(lobe);
	};
	for (let i = 0; i < split.length; i++) {
		const k = keyOf(split[i]);
		const prev = lastAt.get(k);
		if (prev != null && i - prev >= 3) pushLobe(split.slice(prev, i));
		lastAt.set(k, i);
	}
	if (split.length >= 4) {
		if (keyOf(split[0]) !== keyOf(split[split.length - 1])) pushLobe(split);
	}
	return lobes;
}
function asPathPoint(p) {
	return {
		x: p.x,
		y: p.y,
		in: p.in ?? null,
		out: p.out ?? null,
		smooth: p.smooth
	};
}
function pointInRing$2(pt, ring) {
	let inside = false;
	const n = ring.length;
	const EPS = 1e-9;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const a = ring[i];
		const b = ring[j];
		if (a.y > pt.y !== b.y > pt.y && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y || EPS) + a.x) inside = !inside;
	}
	return inside;
}
function holeFitsLobe(hole, lobe) {
	if (hole.length < 3 || lobe.length < 3) return false;
	let hits = 0;
	const sample = Math.min(hole.length, 5);
	for (let i = 0; i < sample; i++) if (pointInRing$2(hole[Math.floor(i * hole.length / sample)], lobe)) hits += 1;
	return hits >= Math.ceil(sample / 2);
}
/** Split a figure-eight / bowtie path into simple closed lobes for knife. */
function explodeTwistedPath(n) {
	if (!n.closed || n.points.length < 4) return [n];
	const lobes = splitSelfOverlapping(n.points);
	if (lobes.length <= 1) return [n];
	const unusedHoles = [...n.holes ?? []];
	return lobes.map((lobe, i) => {
		const holes = [];
		for (let h = unusedHoles.length - 1; h >= 0; h--) {
			const hole = unusedHoles[h];
			if (holeFitsLobe(hole, lobe)) {
				holes.push(hole);
				unusedHoles.splice(h, 1);
			}
		}
		return {
			...n,
			id: i === 0 ? n.id : uid("pt"),
			name: i === 0 ? n.name : `${n.name} ${i + 1}`,
			points: lobe.map(asPathPoint),
			holes: holes.length ? holes.map((ring) => ring.map(asPathPoint)) : void 0,
			closed: true
		};
	});
}
function splitSelfOverlapping(ring, depth = 0) {
	const raw = cleanRing(ring);
	if (depth > 6) return raw.length >= 3 ? [raw] : [];
	if (raw.length < 4) return raw.length >= 3 ? [raw] : [];
	const hits = selfCrossings(raw);
	const split = hits.length ? splitRingAtHits(raw, hits) : raw;
	if (split.length < 4) return [raw];
	let lobes = extractWindingLobes(split);
	if (hits.length && lobes.length < 2) {
		const k = keyOf(split[0]);
		const idxs = split.map((p, i) => keyOf(p) === k ? i : -1).filter((i) => i >= 0);
		if (idxs.length >= 2) {
			const a = idxs[0];
			const b = idxs[1];
			const wrap = cleanRing([...split.slice(b), ...split.slice(0, a)]);
			if (wrap.length >= 3 && Math.abs(ringArea$1(wrap)) > GRID * 40) lobes.push(wrap);
		}
	}
	if (!lobes.length) return [raw];
	const unique = [];
	const seen = /* @__PURE__ */ new Set();
	for (const lobe of lobes) {
		const sig = lobe.map(keyOf).sort().join("|");
		if (seen.has(sig)) continue;
		seen.add(sig);
		if (selfCrossings(lobe).length && lobe !== raw) for (const n of splitSelfOverlapping(lobe, depth + 1)) {
			const ns = n.map(keyOf).sort().join("|");
			if (seen.has(ns)) continue;
			seen.add(ns);
			unique.push(n);
		}
		else unique.push(lobe);
	}
	return unique.length ? unique : [raw];
}
var SHAPE_KINDS = /* @__PURE__ */ new Set([
	"rect",
	"ellipse",
	"polygon",
	"star",
	"arrow",
	"path"
]);
function canBoolean(n) {
	if (!n.visible || n.locked) return false;
	if (!SHAPE_KINDS.has(n.kind)) return false;
	if (isPath(n)) return n.points.length >= 3;
	return n.w > 1 && n.h > 1;
}
function booleanableOf(nodes) {
	return nodes.filter(canBoolean);
}
function worldPoint(n, lx, ly) {
	const local = {
		x: n.x + lx,
		y: n.y + ly
	};
	if (!n.rotation) return local;
	const c = nodeCenter(n);
	return rotatePoint(local.x, local.y, c.x, c.y, n.rotation);
}
function sampleEllipse(cx, cy, rx, ry, steps = 32) {
	const pts = [];
	for (let i = 0; i < steps; i++) {
		const a = i / steps * Math.PI * 2 - Math.PI / 2;
		pts.push({
			x: cx + Math.cos(a) * rx,
			y: cy + Math.sin(a) * ry
		});
	}
	return pts;
}
function roundedRectLocal(n) {
	const r = Math.max(0, Math.min(n.radius, Math.min(n.w, n.h) / 2));
	if (r < .5) return [
		{
			x: 0,
			y: 0
		},
		{
			x: n.w,
			y: 0
		},
		{
			x: n.w,
			y: n.h
		},
		{
			x: 0,
			y: n.h
		}
	];
	const steps = 5;
	const pts = [];
	const corners = [
		[
			n.w - r,
			r,
			0,
			Math.PI / 2
		],
		[
			n.w - r,
			n.h - r,
			Math.PI / 2,
			Math.PI
		],
		[
			r,
			n.h - r,
			Math.PI,
			3 * Math.PI / 2
		],
		[
			r,
			r,
			3 * Math.PI / 2,
			Math.PI * 2
		]
	];
	for (const [cx, cy, a0, a1] of corners) for (let i = 0; i <= steps; i++) {
		const a = a0 + (a1 - a0) * i / steps;
		pts.push({
			x: cx + Math.cos(a) * r,
			y: cy + Math.sin(a) * r
		});
	}
	return pts;
}
function polygonLocal(n, sides) {
	const cx = n.w / 2;
	const cy = n.h / 2;
	const rx = n.w / 2;
	const ry = n.h / 2;
	const pts = [];
	for (let i = 0; i < sides; i++) {
		const a = i / sides * Math.PI * 2 - Math.PI / 2;
		pts.push({
			x: cx + Math.cos(a) * rx,
			y: cy + Math.sin(a) * ry
		});
	}
	return pts;
}
function starLocal(n, points = 5) {
	const cx = n.w / 2;
	const cy = n.h / 2;
	const rx = n.w / 2;
	const ry = n.h / 2;
	const pts = [];
	for (let i = 0; i < points * 2; i++) {
		const inner = i % 2 === 0 ? 1 : .4;
		const a = i * Math.PI / points - Math.PI / 2;
		pts.push({
			x: cx + Math.cos(a) * rx * inner,
			y: cy + Math.sin(a) * ry * inner
		});
	}
	return pts;
}
function arrowLocal(n) {
	return arrowPoints(n.w, n.h, "headScale" in n ? n.headScale ?? 1 : 1);
}
function flattenLocal(pts, steps = 8) {
	if (!pts.length) return [];
	const n = pts.length;
	const out = [];
	for (let i = 0; i < n; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % n];
		out.push({
			x: a.x,
			y: a.y
		});
		if (hasHandle(a.out) || hasHandle(b.in)) {
			const c1x = a.x + (a.out?.x ?? 0);
			const c1y = a.y + (a.out?.y ?? 0);
			const c2x = b.x + (b.in?.x ?? 0);
			const c2y = b.y + (b.in?.y ?? 0);
			for (let s = 1; s < steps; s++) {
				const t = s / steps;
				const u = 1 - t;
				out.push({
					x: u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * b.x,
					y: u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * b.y
				});
			}
		}
	}
	return out;
}
function mapContour(n, local) {
	return flattenLocal(local).map((p) => {
		const w = worldPoint(n, p.x, p.y);
		return {
			x: w.x,
			y: w.y
		};
	});
}
function nodeToWorldContours(n) {
	if (isPath(n)) return [mapContour(n, n.points), ...(n.holes ?? []).map((h) => mapContour(n, h))];
	let local = [];
	switch (n.kind) {
		case "rect":
			local = roundedRectLocal(n);
			break;
		case "ellipse":
			local = sampleEllipse(n.w / 2, n.h / 2, Math.abs(n.w / 2), Math.abs(n.h / 2));
			break;
		case "polygon":
			local = polygonLocal(n, n.sides ?? 6);
			break;
		case "star":
			local = starLocal(n, n.sides ?? 5);
			break;
		case "arrow":
			local = arrowLocal(n);
			break;
		default: return [];
	}
	return [mapContour(n, local)];
}
function contourArea(pts) {
	let a = 0;
	const n = pts.length;
	if (n < 3) return 0;
	for (let i = 0; i < n; i++) {
		const p = pts[i];
		const q = pts[(i + 1) % n];
		a += p.x * q.y - q.x * p.y;
	}
	return a / 2;
}
function orientContour(pts, clockwise) {
	if (pts.length < 3) return pts;
	if (!(contourArea(pts) >= 0) === clockwise) return pts;
	return pts.slice().reverse();
}
function composeBooleanParts(usable, groups, op) {
	const first = usable[0];
	const clipped = clipMany(groups.map((g) => g.flatMap(splitSelfOverlapping)), op);
	if (!clipped.length) return [];
	const islands = groupIslandsNested(clipped);
	if (!islands.length) return [];
	const label = op === "union" ? "Union" : op === "subtract" ? "Subtract" : op === "intersect" ? "Intersect" : "Exclude";
	return islands.map((island, i) => ringToPath(first, island.outer, island.holes, i === 0 ? label : `${label} ${i + 1}`, i === 0 ? first.id : void 0));
}
function ringToPath(first, outer, holes, name, id) {
	const allPts = [outer, ...holes].flat();
	const minX = Math.min(...allPts.map((p) => p.x));
	const minY = Math.min(...allPts.map((p) => p.y));
	const maxX = Math.max(...allPts.map((p) => p.x));
	const maxY = Math.max(...allPts.map((p) => p.y));
	const ox = Number.isFinite(minX) ? minX : 0;
	const oy = Number.isFinite(minY) ? minY : 0;
	const rel = (c) => c.map((p) => ({
		...p,
		x: p.x - ox,
		y: p.y - oy
	}));
	const outerRel = rel(outer);
	const outerCw = contourArea(outerRel) < 0;
	return pathNode({
		...id ? { id } : {},
		name,
		x: ox,
		y: oy,
		w: Math.max(1, maxX - ox),
		h: Math.max(1, maxY - oy),
		rotation: 0,
		opacity: first.opacity,
		visible: true,
		locked: false,
		blend: first.blend,
		fill: first.fill,
		stroke: first.stroke,
		strokeWidth: first.strokeWidth,
		radius: 0,
		shadow: first.shadow,
		points: outerRel,
		holes: holes.map((h) => orientContour(rel(h), !outerCw)),
		closed: true,
		fillRule: "evenodd"
	});
}
function computeBooleanParts(nodes, op) {
	const usable = booleanableOf(nodes);
	if (usable.length < 2) return [];
	const groups = usable.map((n) => nodeToWorldContours(n)).filter((g) => g.length && g[0].length >= 3);
	if (groups.length < 2) return [];
	return composeBooleanParts(usable, groups, op);
}
function lerp(a, b, t) {
	return a + (b - a) * t;
}
function lerpV(a, b, t) {
	return {
		x: lerp(a.x, b.x, t),
		y: lerp(a.y, b.y, t)
	};
}
function clonePt(p) {
	return {
		x: p.x,
		y: p.y,
		in: p.in ? { ...p.in } : null,
		out: p.out ? { ...p.out } : null,
		smooth: p.smooth
	};
}
function segmentControls(a, b) {
	const p0 = {
		x: a.x,
		y: a.y
	};
	const p3 = {
		x: b.x,
		y: b.y
	};
	const curved = hasHandle(a.out) || hasHandle(b.in);
	return {
		p0,
		p1: curved ? {
			x: a.x + (a.out?.x ?? 0),
			y: a.y + (a.out?.y ?? 0)
		} : lerpV(p0, p3, 1 / 3),
		p2: curved ? {
			x: b.x + (b.in?.x ?? 0),
			y: b.y + (b.in?.y ?? 0)
		} : lerpV(p0, p3, 2 / 3),
		p3,
		curved
	};
}
function cubicAt(p0, p1, p2, p3, t) {
	const u = 1 - t;
	const uu = u * u;
	const tt = t * t;
	return {
		x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
		y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y
	};
}
function splitCubic(p0, p1, p2, p3, t) {
	const a = lerpV(p0, p1, t);
	const b = lerpV(p1, p2, t);
	const c = lerpV(p2, p3, t);
	const d = lerpV(a, b, t);
	const e = lerpV(b, c, t);
	const m = lerpV(d, e, t);
	return {
		left: [
			p0,
			a,
			d,
			m
		],
		right: [
			m,
			e,
			c,
			p3
		],
		mid: m
	};
}
function sampleDist(p0, p1, p2, p3, x, y) {
	let bestT = 0;
	let best = Infinity;
	const steps = 24;
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const p = cubicAt(p0, p1, p2, p3, t);
		const d = Math.hypot(p.x - x, p.y - y);
		if (d < best) {
			best = d;
			bestT = t;
		}
	}
	const span = 1 / steps;
	let lo = Math.max(0, bestT - span);
	let hi = Math.min(1, bestT + span);
	for (let k = 0; k < 10; k++) {
		const t1 = lo + (hi - lo) / 3;
		const t2 = hi - (hi - lo) / 3;
		if (Math.hypot(cubicAt(p0, p1, p2, p3, t1).x - x, cubicAt(p0, p1, p2, p3, t1).y - y) < Math.hypot(cubicAt(p0, p1, p2, p3, t2).x - x, cubicAt(p0, p1, p2, p3, t2).y - y)) hi = t2;
		else lo = t1;
	}
	const t = (lo + hi) / 2;
	const p = cubicAt(p0, p1, p2, p3, t);
	return {
		t,
		dist: Math.hypot(p.x - x, p.y - y),
		point: p
	};
}
function hitPathSegment(pts, closed, lx, ly, zoom) {
	const n = pts.length;
	if (n < 2) return null;
	const last = closed ? n : n - 1;
	let best = null;
	for (let i = 0; i < last; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % n];
		const { p0, p1, p2, p3 } = segmentControls(a, b);
		const s = sampleDist(p0, p1, p2, p3, lx, ly);
		if (!best || s.dist < best.dist) best = {
			index: i,
			t: s.t,
			local: s.point,
			dist: s.dist
		};
	}
	if (!best || best.dist > 10 / zoom) return null;
	if (best.t < .04 || best.t > .96) best = {
		...best,
		t: Math.min(.96, Math.max(.04, best.t))
	};
	return best;
}
function applySplit(pts, closed, hit) {
	const n = pts.length;
	const aIdx = hit.index;
	const bIdx = (hit.index + 1) % n;
	const a = clonePt(pts[aIdx]);
	const b = clonePt(pts[bIdx]);
	const { p0, p1, p2, p3, curved } = segmentControls(a, b);
	const { left, right, mid } = splitCubic(p0, p1, p2, p3, hit.t);
	if (curved) {
		a.out = {
			x: left[1].x - a.x,
			y: left[1].y - a.y
		};
		b.in = {
			x: right[2].x - b.x,
			y: right[2].y - b.y
		};
	}
	const midPt = {
		x: mid.x,
		y: mid.y,
		in: curved ? {
			x: left[2].x - mid.x,
			y: left[2].y - mid.y
		} : null,
		out: curved ? {
			x: right[1].x - mid.x,
			y: right[1].y - mid.y
		} : null,
		smooth: curved
	};
	const next = pts.map(clonePt);
	next[aIdx] = a;
	next[bIdx] = b;
	next.splice(aIdx + 1, 0, midPt);
	return next;
}
function cutContourMany(pts, closed, hits) {
	if (!hits.length) return [pts.map(clonePt)];
	const ordered = hits.slice().sort((a, b) => a.index === b.index ? a.t - b.t : a.index - b.index);
	let ring = pts.map(clonePt);
	const wasClosed = closed;
	const cutIdxs = [];
	let shift = 0;
	for (const hit of ordered) {
		const adj = {
			...hit,
			index: hit.index + shift,
			t: Math.min(.96, Math.max(.04, hit.t))
		};
		ring = applySplit(ring, wasClosed, adj);
		cutIdxs.push(adj.index + 1);
		shift += 1;
	}
	if (ring.length < 2) return [ring];
	if (wasClosed && cutIdxs.length === 1) return [cutContour(pts, true, ordered[0]).keep];
	const unique = [...new Set(cutIdxs)].sort((a, b) => a - b);
	const pieces = [];
	const nick = (idx) => {
		const p = clonePt(ring[idx]);
		p.in = null;
		p.out = null;
		p.smooth = false;
		return p;
	};
	if (wasClosed) {
		for (let i = 0; i < unique.length; i++) {
			const a = unique[i];
			const b = unique[(i + 1) % unique.length];
			const slice = a < b ? ring.slice(a, b + 1) : [...ring.slice(a), ...ring.slice(0, b + 1)];
			if (slice.length < 2) continue;
			const copy = slice.map(clonePt);
			copy[0] = nick(a);
			copy[copy.length - 1] = nick(b);
			pieces.push(copy);
		}
		return pieces.length ? pieces : [ring];
	}
	let start = 0;
	for (const cut of unique) {
		const slice = ring.slice(start, cut + 1).map(clonePt);
		if (slice.length >= 2) {
			slice[slice.length - 1] = nick(cut);
			if (start > 0) slice[0] = nick(start);
			pieces.push(slice);
		}
		start = cut;
	}
	const tail = ring.slice(start).map(clonePt);
	if (tail.length >= 2) {
		tail[0] = nick(start);
		pieces.push(tail);
	}
	return pieces.length ? pieces : [ring];
}
function cutContour(pts, closed, hit) {
	const inserted = applySplit(pts, closed, hit);
	const cutIndex = hit.index + 1;
	if (closed) {
		const rotated = [...inserted.slice(cutIndex), ...inserted.slice(0, cutIndex)];
		const start = clonePt(rotated[0]);
		start.in = null;
		const end = clonePt(rotated[rotated.length - 1]);
		end.out = null;
		rotated[0] = start;
		rotated[rotated.length - 1] = end;
		return {
			keep: rotated,
			extra: null,
			closed: false,
			cutIndex: 0
		};
	}
	const left = inserted.slice(0, cutIndex + 1).map(clonePt);
	const right = inserted.slice(cutIndex).map(clonePt);
	if (left.length) {
		const last = left[left.length - 1];
		last.out = null;
		last.smooth = false;
	}
	if (right.length) {
		const first = right[0];
		first.in = null;
		first.smooth = false;
	}
	return {
		keep: left,
		extra: right.length >= 2 ? right : null,
		closed: false,
		cutIndex
	};
}
function hitCompoundSegment(n, lx, ly, zoom) {
	let best = null;
	const outer = hitPathSegment(n.points, n.closed, lx, ly, zoom);
	if (outer) best = {
		hole: null,
		hit: outer
	};
	(n.holes ?? []).forEach((ring, i) => {
		const h = hitPathSegment(ring, true, lx, ly, zoom);
		if (h && (!best || h.dist < best.hit.dist)) best = {
			hole: i,
			hit: h
		};
	});
	return best;
}
function knifePreviewPoint(n, lx, ly, zoom) {
	const hit = knifePreviewLobe(n, lx, ly, zoom);
	return hit ? {
		x: hit.x,
		y: hit.y
	} : null;
}
function knifePointSplitPieces(n, lx, ly, zoom) {
	const preview = knifePreviewLobe(n, lx, ly, zoom);
	if (!preview) return [];
	const found = hitCompoundSegment(preview.lobe, lx, ly, zoom);
	if (!found) return [];
	const ring = found.hole == null ? preview.lobe.points : preview.lobe.holes?.[found.hole];
	if (!ring || ring.length < 2) return [];
	return cutContourMany(ring, found.hole == null ? preview.lobe.closed : true, [found.hit]);
}
/** Nearest planar lobe under the pointer — the ring a click-cut would open. */
function knifePreviewLobe(n, lx, ly, zoom) {
	let best = null;
	for (const part of explodeTwistedPath(n)) {
		const found = hitCompoundSegment(part, lx, ly, zoom);
		if (!found) continue;
		if (!best || found.hit.dist < best.dist) best = {
			x: n.x + found.hit.local.x,
			y: n.y + found.hit.local.y,
			dist: found.hit.dist,
			lobe: part
		};
	}
	return best;
}
/** World-space cut marks on only the lobes a stroke will open. Untouched bowtie rings stay unmarked. */
function knifeStrokePreview(n, ax, ay, bx, by) {
	const a = {
		x: ax - n.x,
		y: ay - n.y
	};
	const b = {
		x: bx - n.x,
		y: by - n.y
	};
	const marks = [];
	const lobes = [];
	const seen = /* @__PURE__ */ new Set();
	for (const part of explodeTwistedPath(n)) {
		const hits = strokeHitsCompound(part, a, b);
		if (!hits.length) continue;
		lobes.push(part);
		for (const h of hits) {
			const wx = n.x + h.hit.local.x;
			const wy = n.y + h.hit.local.y;
			const key = `${wx.toFixed(2)},${wy.toFixed(2)}`;
			if (seen.has(key)) continue;
			seen.add(key);
			marks.push({
				x: wx,
				y: wy
			});
		}
	}
	marks.sort((p, q) => Math.hypot(p.x - ax, p.y - ay) - Math.hypot(q.x - ax, q.y - ay));
	return {
		marks,
		lobes
	};
}
function segSeg(a, b, c, d) {
	const rx = b.x - a.x;
	const ry = b.y - a.y;
	const sx = d.x - c.x;
	const sy = d.y - c.y;
	const den = rx * sy - ry * sx;
	if (Math.abs(den) < 1e-9) return null;
	const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den;
	const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den;
	if (t < 0 || t > 1 || u < 0 || u > 1) return null;
	return {
		t,
		u,
		p: {
			x: a.x + t * rx,
			y: a.y + t * ry
		}
	};
}
function strokeHitsContour(pts, closed, a, b) {
	const n = pts.length;
	if (n < 2) return [];
	const last = closed ? n : n - 1;
	const hits = [];
	for (let i = 0; i < last; i++) {
		const pa = pts[i];
		const pb = pts[(i + 1) % n];
		const { p0, p1, p2, p3 } = segmentControls(pa, pb);
		let prev = p0;
		const steps = 16;
		for (let s = 1; s <= steps; s++) {
			const cur = cubicAt(p0, p1, p2, p3, s / steps);
			const hit = segSeg(prev, cur, a, b);
			if (hit) {
				const tSeg = (s - 1 + hit.t) / steps;
				hits.push({
					index: i,
					t: Math.min(.96, Math.max(.04, tSeg)),
					local: hit.p,
					dist: 0
				});
				break;
			}
			prev = cur;
		}
	}
	hits.sort((x, y) => {
		const dx = (p) => Math.hypot(p.local.x - a.x, p.local.y - a.y);
		return dx(x) - dx(y);
	});
	return hits;
}
function strokeHitsCompound(n, a, b) {
	const out = [];
	for (const hit of strokeHitsContour(n.points, n.closed, a, b)) out.push({
		hole: null,
		hit
	});
	(n.holes ?? []).forEach((ring, i) => {
		for (const hit of strokeHitsContour(ring, true, a, b)) out.push({
			hole: i,
			hit
		});
	});
	return out;
}
/** Resulting open contours a knife stroke would produce on this path (local space). */
function knifeSplitPieces(n, ax, ay, bx, by) {
	const a = {
		x: ax - n.x,
		y: ay - n.y
	};
	const b = {
		x: bx - n.x,
		y: by - n.y
	};
	const pieces = [];
	for (const part of explodeTwistedPath(n)) {
		const hits = strokeHitsCompound(part, a, b);
		if (!hits.length) continue;
		const groups = /* @__PURE__ */ new Map();
		for (const h of hits) {
			const key = h.hole == null ? "outer" : h.hole;
			const arr = groups.get(key) ?? [];
			arr.push(h.hit);
			groups.set(key, arr);
		}
		for (const [key, hitList] of groups) {
			const ring = key === "outer" ? part.points : part.holes?.[Number(key)] ?? [];
			if (ring.length < 2) continue;
			const result = cutContourMany(ring, key === "outer" ? part.closed : true, hitList);
			for (const piece of result) if (piece.length >= 2) pieces.push(piece);
		}
	}
	return pieces;
}
var EPS = 1e-6;
function clonePts(pts) {
	return pts.map((p) => ({
		x: p.x,
		y: p.y,
		in: p.in ? { ...p.in } : null,
		out: p.out ? { ...p.out } : null,
		smooth: p.smooth
	}));
}
function sub(a, b) {
	return {
		x: a.x - b.x,
		y: a.y - b.y
	};
}
function add(a, b) {
	return {
		x: a.x + b.x,
		y: a.y + b.y
	};
}
function mul(a, s) {
	return {
		x: a.x * s,
		y: a.y * s
	};
}
function len(a) {
	return Math.hypot(a.x, a.y);
}
function norm(a) {
	const l = len(a);
	if (l < EPS) return {
		x: 0,
		y: 0
	};
	return {
		x: a.x / l,
		y: a.y / l
	};
}
function perpLeft(t) {
	return {
		x: -t.y,
		y: t.x
	};
}
function cubicDeriv(p0, p1, p2, p3, t) {
	const u = 1 - t;
	return {
		x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
		y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
	};
}
function signedArea(pts) {
	let a = 0;
	const n = pts.length;
	for (let i = 0; i < n; i++) {
		const p = pts[i];
		const q = pts[(i + 1) % n];
		a += p.x * q.y - q.x * p.y;
	}
	return a / 2;
}
function sampleContour(pts, closed) {
	const n = pts.length;
	if (n < 2) return [];
	const out = [];
	const segs = closed ? n : n - 1;
	for (let i = 0; i < segs; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % n];
		const { p0, p1, p2, p3, curved } = segmentControls(a, b);
		const chord = len(sub(p3, p0));
		const steps = curved ? Math.max(6, Math.min(28, Math.ceil(chord / 8))) : Math.max(1, Math.min(8, Math.ceil(chord / 24)));
		const start = i === 0 ? 0 : 1;
		for (let s = start; s <= steps; s++) {
			const t = s / steps;
			const p = cubicAt(p0, p1, p2, p3, t);
			let tan = cubicDeriv(p0, p1, p2, p3, t);
			if (len(tan) < EPS) tan = sub(p3, p0);
			out.push({
				p,
				t: norm(tan)
			});
		}
	}
	return out;
}
function offsetWithMiter(samples, distance, miterLimit = 4) {
	if (!samples.length) return [];
	const pts = [];
	for (let i = 0; i < samples.length; i++) {
		const cur = samples[i];
		const prev = samples[i - 1];
		const next = samples[i + 1];
		const n0 = perpLeft(cur.t);
		if (!prev || !next) {
			pts.push(add(cur.p, mul(n0, distance)));
			continue;
		}
		const joined = norm(add(perpLeft(norm(add(prev.t, cur.t))), perpLeft(norm(add(cur.t, next.t)))));
		let scale = distance / Math.max(EPS, joined.x * n0.x + joined.y * n0.y);
		const limit = Math.abs(distance) * miterLimit;
		if (Math.abs(scale) > limit) scale = Math.sign(scale) * limit;
		pts.push(add(cur.p, mul(joined, scale)));
	}
	return pts;
}
function simplifyPolyline(pts, eps) {
	if (pts.length < 3) return pts.slice();
	const keep = new Array(pts.length).fill(false);
	keep[0] = true;
	keep[pts.length - 1] = true;
	const stack = [[0, pts.length - 1]];
	while (stack.length) {
		const [a, b] = stack.pop();
		const pa = pts[a];
		const pb = pts[b];
		const ab = sub(pb, pa);
		const lab = len(ab);
		let maxD = 0;
		let maxI = a;
		for (let i = a + 1; i < b; i++) {
			const p = pts[i];
			let d;
			if (lab < EPS) d = len(sub(p, pa));
			else d = len(sub(p, add(pa, mul(ab, Math.max(0, Math.min(1, ((p.x - pa.x) * ab.x + (p.y - pa.y) * ab.y) / (lab * lab)))))));
			if (d > maxD) {
				maxD = d;
				maxI = i;
			}
		}
		if (maxD > eps && maxI !== a) {
			keep[maxI] = true;
			stack.push([a, maxI], [maxI, b]);
		}
	}
	return pts.filter((_, i) => keep[i]);
}
function toPathPoints(pts) {
	return pts.map((p) => ({
		x: p.x,
		y: p.y,
		in: null,
		out: null,
		smooth: false
	}));
}
/** Fillet sharp corners. Radius is clamped to half the shorter adjoining edge. */
function roundPolylineCorners(pts, radius, closed) {
	if (pts.length < 3 || radius < .4) return pts.slice();
	const n = pts.length;
	const out = [];
	const last = closed ? n : n - 1;
	const first = closed ? 0 : 1;
	if (!closed) out.push(pts[0]);
	for (let i = first; i < last; i++) {
		const prev = pts[(i - 1 + n) % n];
		const cur = pts[i];
		const next = pts[(i + 1) % n];
		const inDir = norm(sub(cur, prev));
		const outDir = norm(sub(next, cur));
		const inLen = len(sub(cur, prev));
		const outLen = len(sub(next, cur));
		if (len(inDir) < EPS || len(outDir) < EPS) {
			out.push(cur);
			continue;
		}
		const cross = inDir.x * outDir.y - inDir.y * outDir.x;
		const dot = Math.max(-1, Math.min(1, inDir.x * outDir.x + inDir.y * outDir.y));
		if (Math.abs(cross) < .04 && dot > 0) {
			out.push(cur);
			continue;
		}
		const turn = Math.acos(dot);
		if (turn < .08) {
			out.push(cur);
			continue;
		}
		const maxPull = Math.min(inLen, outLen) * .48;
		const pull = Math.min(radius, maxPull);
		const start = add(cur, mul(inDir, -pull));
		const end = add(cur, mul(outDir, pull));
		const sign = cross >= 0 ? 1 : -1;
		const joined = norm(add(mul(perpLeft(inDir), sign), mul(perpLeft(outDir), sign)));
		const filletR = pull / Math.max(EPS, Math.tan(turn / 2));
		const c = add(cur, mul(joined, -filletR));
		const a0 = Math.atan2(start.y - c.y, start.x - c.x);
		let delta = Math.atan2(end.y - c.y, end.x - c.x) - a0;
		if (sign > 0) {
			while (delta <= 0) delta += Math.PI * 2;
			if (delta > Math.PI) delta -= Math.PI * 2;
		} else {
			while (delta >= 0) delta -= Math.PI * 2;
			if (delta < -Math.PI) delta += Math.PI * 2;
		}
		const steps = Math.max(3, Math.min(10, Math.ceil(Math.abs(delta) * Math.max(4, filletR) / 12)));
		out.push(start);
		const rr = len(sub(start, c)) || filletR;
		for (let s = 1; s < steps; s++) {
			const a = a0 + delta * s / steps;
			out.push({
				x: c.x + Math.cos(a) * rr,
				y: c.y + Math.sin(a) * rr
			});
		}
		out.push(end);
	}
	if (!closed) out.push(pts[n - 1]);
	return out;
}
function finishOffset(raw, closed, distance, radius) {
	const simple = simplifyPolyline(roundPolylineCorners(raw, radius ?? Math.abs(distance), closed), Math.max(.75, Math.abs(distance) * .12));
	return simple.length >= 2 ? simple : raw;
}
function offsetPolyline(pts, closed, distance, cornerRadius) {
	if (Math.abs(distance) < .25 || pts.length < 2) return clonePts(pts);
	const samples = sampleContour(pts, closed);
	if (samples.length < 2) return clonePts(pts);
	let raw = offsetWithMiter(samples, distance);
	if (closed && raw.length > 2) {
		const srcArea = signedArea(pts);
		const dstArea = signedArea(raw);
		if (srcArea !== 0 && dstArea !== 0 && Math.sign(srcArea) !== Math.sign(dstArea)) raw = raw.slice().reverse();
	}
	const simple = finishOffset(raw, closed, distance, cornerRadius);
	if (simple.length < 2) return clonePts(pts);
	return toPathPoints(simple);
}
function capArc(center, from, to, steps = 5) {
	const a0 = Math.atan2(from.y - center.y, from.x - center.x);
	let delta = Math.atan2(to.y - center.y, to.x - center.x) - a0;
	while (delta <= 0) delta += Math.PI * 2;
	while (delta > Math.PI * 2) delta -= Math.PI * 2;
	const out = [];
	const r = len(sub(from, center));
	for (let i = 1; i < steps; i++) {
		const a = a0 + delta * i / steps;
		out.push({
			x: center.x + Math.cos(a) * r,
			y: center.y + Math.sin(a) * r
		});
	}
	return out;
}
/** Expand a stroke into a filled contour. Closed paths keep the original as a hole. */
function outlineStroke(pts, closed, strokeWidth, cornerRadius) {
	const half = Math.max(.5, strokeWidth / 2);
	if (pts.length < 2) return null;
	const samples = sampleContour(pts, closed);
	if (samples.length < 2) return null;
	const left = offsetWithMiter(samples, half);
	const right = offsetWithMiter(samples, -half);
	if (closed) {
		const outerCand = Math.abs(signedArea(left)) >= Math.abs(signedArea(right)) ? left : right;
		const innerCand = outerCand === left ? right : left;
		const outer = finishOffset(outerCand, true, half, cornerRadius);
		const inner = finishOffset(innerCand, true, half, cornerRadius);
		if (outer.length < 3) return null;
		const hole = inner.length >= 3 && Math.abs(signedArea(inner)) > 4 ? toPathPoints(signedArea(inner) * signedArea(outer) > 0 ? inner.slice().reverse() : inner) : null;
		return {
			points: toPathPoints(outer),
			hole,
			closed: true
		};
	}
	const start = samples[0];
	const end = samples[samples.length - 1];
	const l0 = left[0];
	const r0 = right[0];
	const lN = left[left.length - 1];
	const rN = right[right.length - 1];
	const simple = finishOffset([
		...left,
		...capArc(end.p, lN, rN),
		...right.slice().reverse(),
		...capArc(start.p, r0, l0)
	], true, half, cornerRadius);
	if (simple.length < 3) return null;
	return {
		points: toPathPoints(simple),
		hole: null,
		closed: true
	};
}
function shiftRing(ring, dx, dy) {
	return ring.map((p) => ({
		...p,
		x: p.x + dx,
		y: p.y + dy
	}));
}
function rotateOffset(h, deg) {
	if (!h) return h;
	const r = rotatePoint(h.x, h.y, 0, 0, deg);
	return {
		x: r.x,
		y: r.y
	};
}
function unrotateOffset(h, deg) {
	if (!h) return h;
	const r = rotatePoint(h.x, h.y, 0, 0, -deg);
	return {
		x: r.x,
		y: r.y
	};
}
/** Flatten node rotation into path points so island boxes match ink on the artboard. */
function bakePathRotation(n) {
	if (!n.rotation) return n;
	const c = nodeCenter(n);
	const deg = n.rotation;
	const mapRing = (ring) => ring.map((p) => {
		const w = rotatePoint(n.x + p.x, n.y + p.y, c.x, c.y, deg);
		return {
			...p,
			x: w.x,
			y: w.y,
			in: rotateOffset(p.in, deg) ?? p.in,
			out: rotateOffset(p.out, deg) ?? p.out
		};
	});
	return {
		...n,
		rotation: 0,
		x: 0,
		y: 0,
		points: mapRing(n.points),
		holes: n.holes?.map(mapRing)
	};
}
function convexHull(pts) {
	const uniq = /* @__PURE__ */ new Map();
	for (const p of pts) uniq.set(`${p.x.toFixed(4)},${p.y.toFixed(4)}`, p);
	const points = [...uniq.values()].sort((a, b) => a.x - b.x || a.y - b.y);
	if (points.length <= 2) return points;
	const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
	const lower = [];
	for (const p of points) {
		while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
		lower.push(p);
	}
	const upper = [];
	for (let i = points.length - 1; i >= 0; i--) {
		const p = points[i];
		while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
		upper.push(p);
	}
	lower.pop();
	upper.pop();
	return lower.concat(upper);
}
/** Minimum-area oriented box around world samples (rotating calipers on the hull). */
function minAreaObb(pts) {
	const hull = convexHull(pts);
	if (hull.length === 0) return {
		cx: 0,
		cy: 0,
		w: 1,
		h: 1,
		rotation: 0
	};
	if (hull.length === 1) return {
		cx: hull[0].x,
		cy: hull[0].y,
		w: 1,
		h: 1,
		rotation: 0
	};
	if (hull.length === 2) {
		const a = hull[0];
		const b = hull[1];
		const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
		return {
			cx: (a.x + b.x) / 2,
			cy: (a.y + b.y) / 2,
			w: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
			h: 1,
			rotation: ang
		};
	}
	let best = {
		area: Infinity,
		cx: 0,
		cy: 0,
		w: 1,
		h: 1,
		rotation: 0
	};
	for (let i = 0; i < hull.length; i++) {
		const a = hull[i];
		const b = hull[(i + 1) % hull.length];
		const ang = Math.atan2(b.y - a.y, b.x - a.x);
		const c = Math.cos(ang);
		const s = Math.sin(ang);
		let minP = Infinity;
		let maxP = -Infinity;
		let minQ = Infinity;
		let maxQ = -Infinity;
		for (const p of hull) {
			const pr = p.x * c + p.y * s;
			const qr = -p.x * s + p.y * c;
			minP = Math.min(minP, pr);
			maxP = Math.max(maxP, pr);
			minQ = Math.min(minQ, qr);
			maxQ = Math.max(maxQ, qr);
		}
		const w = maxP - minP;
		const h = maxQ - minQ;
		const area = w * h;
		if (area < best.area) {
			const midP = (minP + maxP) / 2;
			const midQ = (minQ + maxQ) / 2;
			best = {
				area,
				cx: midP * c - midQ * s,
				cy: midP * s + midQ * c,
				w: Math.max(1, w),
				h: Math.max(1, h),
				rotation: ang * 180 / Math.PI
			};
		}
	}
	return best;
}
/** Rebase a path onto its minimum-area oriented frame so align uses rotated ink, not the AABB. */
function applyOrientedFrame(n) {
	const samples = [];
	for (const p of n.points) samples.push({
		x: n.x + p.x,
		y: n.y + p.y
	});
	for (const hole of n.holes ?? []) for (const p of hole) samples.push({
		x: n.x + p.x,
		y: n.y + p.y
	});
	if (samples.length < 2) return n;
	const obb = minAreaObb(samples);
	const x = obb.cx - obb.w / 2;
	const y = obb.cy - obb.h / 2;
	const mapRing = (ring) => ring.map((p) => {
		const world = {
			x: n.x + p.x,
			y: n.y + p.y
		};
		const local = rotatePoint(world.x, world.y, obb.cx, obb.cy, -obb.rotation);
		return {
			...p,
			x: local.x - x,
			y: local.y - y,
			in: unrotateOffset(p.in, obb.rotation) ?? p.in,
			out: unrotateOffset(p.out, obb.rotation) ?? p.out
		};
	});
	return {
		...n,
		x,
		y,
		w: obb.w,
		h: obb.h,
		rotation: obb.rotation,
		points: mapRing(n.points),
		holes: n.holes?.map(mapRing)
	};
}
/** Pull a path node's box onto its actual contour so islands can align independently. */
function tightenPathNode(n) {
	const baked = bakePathRotation(n);
	const samples = [];
	for (const p of baked.points) samples.push(p);
	for (const hole of baked.holes ?? []) for (const p of hole) samples.push(p);
	if (!samples.length) return baked;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const p of samples) {
		minX = Math.min(minX, p.x);
		minY = Math.min(minY, p.y);
		maxX = Math.max(maxX, p.x);
		maxY = Math.max(maxY, p.y);
	}
	if (!Number.isFinite(minX)) return baked;
	const dx = minX;
	const dy = minY;
	return applyOrientedFrame({
		...baked,
		x: baked.x + dx,
		y: baked.y + dy,
		w: Math.max(1, maxX - minX),
		h: Math.max(1, maxY - minY),
		points: shiftRing(baked.points, -dx, -dy),
		holes: baked.holes?.map((h) => shiftRing(h, -dx, -dy))
	});
}
/** Axis-aligned projection of the node's oriented frame (rotated box, not raw ink AABB). */
function geometryBox(n) {
	const c = {
		x: n.x + n.w / 2,
		y: n.y + n.h / 2
	};
	const pts = [
		{
			x: n.x,
			y: n.y
		},
		{
			x: n.x + n.w,
			y: n.y
		},
		{
			x: n.x + n.w,
			y: n.y + n.h
		},
		{
			x: n.x,
			y: n.y + n.h
		}
	];
	const corners = n.rotation ? pts.map((p) => rotatePoint(p.x, p.y, c.x, c.y, n.rotation)) : pts;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const p of corners) {
		minX = Math.min(minX, p.x);
		minY = Math.min(minY, p.y);
		maxX = Math.max(maxX, p.x);
		maxY = Math.max(maxY, p.y);
	}
	if (!Number.isFinite(minX)) return aabb([n]);
	return {
		x: minX,
		y: minY,
		w: maxX - minX,
		h: maxY - minY
	};
}
function ringBox(ring) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const p of ring) {
		minX = Math.min(minX, p.x);
		minY = Math.min(minY, p.y);
		maxX = Math.max(maxX, p.x);
		maxY = Math.max(maxY, p.y);
	}
	if (!Number.isFinite(minX)) return {
		x: 0,
		y: 0,
		w: 0,
		h: 0
	};
	return {
		x: minX,
		y: minY,
		w: maxX - minX,
		h: maxY - minY
	};
}
/** Disjoint outer rings on one path (holes stay attached to their parent). */
function splitCompoundIslands(n) {
	n = tightenPathNode(n);
	const rings = [n.points, ...n.holes ?? []].filter((r) => r.length >= 3);
	if (rings.length < 2) return [n];
	const groups = groupIslandsNested(rings);
	if (groups.length <= 1) return [n];
	return groups.map((g, i) => {
		const box = ringBox([g.outer, ...g.holes].flat());
		const dx = box.x;
		const dy = box.y;
		return applyOrientedFrame({
			...n,
			id: i === 0 ? n.id : uid("pt"),
			name: i === 0 ? n.name : `${n.name} ${i + 1}`,
			x: n.x + dx,
			y: n.y + dy,
			w: Math.max(1, box.w),
			h: Math.max(1, box.h),
			rotation: 0,
			points: shiftRing(g.outer, -dx, -dy),
			holes: g.holes.length ? g.holes.map((h) => shiftRing(h, -dx, -dy)) : void 0,
			fillRule: g.holes.length ? n.fillRule ?? "evenodd" : n.fillRule
		});
	});
}
function key(x, y) {
	return `${x},${y}`;
}
/** Marching-squares segments on a binary mask, then chain into closed rings. */
function traceMaskContours(mask, width, height) {
	const segs = /* @__PURE__ */ new Map();
	const points = [];
	const indexOf = (x, y) => {
		const k = key(x, y);
		const existing = segs.get(k);
		if (existing) return existing[0];
		const i = points.length;
		points.push({
			x,
			y
		});
		segs.set(k, [i]);
		return i;
	};
	const edges = [];
	const at = (x, y) => {
		if (x < 0 || y < 0 || x >= width || y >= height) return 0;
		return mask[y * width + x] ? 1 : 0;
	};
	for (let y = -1; y < height; y++) for (let x = -1; x < width; x++) {
		const tl = at(x, y);
		const tr = at(x + 1, y);
		const br = at(x + 1, y + 1);
		const bl = at(x, y + 1);
		const code = tl << 3 | tr << 2 | br << 1 | bl;
		if (code === 0 || code === 15) continue;
		const top = {
			x: x + 1,
			y
		};
		const right = {
			x: x + 1.5,
			y: y + 1
		};
		const bottom = {
			x: x + 1,
			y: y + 1.5
		};
		const left = {
			x: x + .5,
			y: y + 1
		};
		const pair = (a, b) => {
			const ia = indexOf(a.x, a.y);
			const ib = indexOf(b.x, b.y);
			edges.push([ia, ib]);
		};
		switch (code) {
			case 1:
				pair(left, bottom);
				break;
			case 2:
				pair(bottom, right);
				break;
			case 3:
				pair(left, right);
				break;
			case 4:
				pair(top, right);
				break;
			case 5:
				pair(left, top);
				pair(bottom, right);
				break;
			case 6:
				pair(top, bottom);
				break;
			case 7:
				pair(left, top);
				break;
			case 8:
				pair(left, top);
				break;
			case 9:
				pair(top, bottom);
				break;
			case 10:
				pair(left, bottom);
				pair(top, right);
				break;
			case 11:
				pair(top, right);
				break;
			case 12:
				pair(left, right);
				break;
			case 13:
				pair(bottom, right);
				break;
			case 14: pair(left, bottom);
		}
	}
	const adj = /* @__PURE__ */ new Map();
	for (const [a, b] of edges) {
		if (a === b) continue;
		const la = adj.get(a) ?? [];
		const lb = adj.get(b) ?? [];
		la.push(b);
		lb.push(a);
		adj.set(a, la);
		adj.set(b, lb);
	}
	const used = /* @__PURE__ */ new Set();
	const rings = [];
	const edgeKey = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
	for (const start of adj.keys()) for (const first of adj.get(start) ?? []) {
		if (used.has(edgeKey(start, first))) continue;
		const ring = [];
		let prev = start;
		let cur = first;
		used.add(edgeKey(prev, cur));
		ring.push(points[prev]);
		let guard = 0;
		while (guard++ < points.length + 4) {
			ring.push(points[cur]);
			const nexts = adj.get(cur) ?? [];
			let nxt = -1;
			for (const cand of nexts) {
				if (cand === prev) continue;
				if (!used.has(edgeKey(cur, cand))) {
					nxt = cand;
					break;
				}
			}
			if (nxt < 0) break;
			used.add(edgeKey(cur, nxt));
			prev = cur;
			cur = nxt;
			if (cur === start) break;
		}
		if (ring.length >= 4) rings.push(ring);
	}
	return rings;
}
function pointInRing$1(pt, ring) {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const a = ring[i];
		const b = ring[j];
		if (a.y > pt.y !== b.y > pt.y && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y + 1e-12) + a.x) inside = !inside;
	}
	return inside;
}
function ringCentroid(ring) {
	let x = 0;
	let y = 0;
	for (const p of ring) {
		x += p.x;
		y += p.y;
	}
	const n = Math.max(1, ring.length);
	return {
		x: x / n,
		y: y / n
	};
}
function ringArea(ring) {
	let a = 0;
	for (let i = 0; i < ring.length; i++) {
		const p = ring[i];
		const q = ring[(i + 1) % ring.length];
		a += p.x * q.y - q.x * p.y;
	}
	return a / 2;
}
/** Nest smaller rings that sit inside a larger one as holes. */
function nestContours(rings) {
	const cleaned = rings.map((r) => {
		const simple = r.length > 8 ? simplifyPolyline(r, .85) : r;
		return simple.length >= 3 ? simple : r;
	}).filter((r) => Math.abs(ringArea(r)) > 4).sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
	const claimed = new Array(cleaned.length).fill(false);
	const glyphs = [];
	for (let i = 0; i < cleaned.length; i++) {
		if (claimed[i]) continue;
		const outer = cleaned[i];
		const holes = [];
		claimed[i] = true;
		for (let j = i + 1; j < cleaned.length; j++) {
			if (claimed[j]) continue;
			const cand = cleaned[j];
			if (pointInRing$1(ringCentroid(cand), outer)) {
				holes.push(cand);
				claimed[j] = true;
			}
		}
		glyphs.push({
			outer,
			holes
		});
	}
	return glyphs;
}
function paintText(ctx, n, ox, oy) {
	applyFontFace(ctx, n);
	ctx.textAlign = n.align === "center" ? "center" : n.align === "right" ? "right" : "left";
	ctx.textBaseline = useDesign.getState().typeBaseline ?? "hanging";
	ctx.fillStyle = "#fff";
	const lines = n.text.split("\n");
	const lh = n.fontSize * n.lineHeight;
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		if (n.uppercase) line = line.toUpperCase();
		let ax = ox;
		if (n.align === "center") ax = ox + n.w / 2;
		if (n.align === "right") ax = ox + n.w;
		ctx.fillText(line, ax, oy + i * lh, n.w);
	}
}
function rasterizeText(n, pad, scale) {
	if (typeof document === "undefined") return null;
	const w = Math.max(2, Math.ceil((n.w + pad * 2) * scale));
	const h = Math.max(2, Math.ceil((n.h + pad * 2) * scale));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return null;
	ctx.scale(scale, scale);
	ctx.clearRect(0, 0, w, h);
	paintText(ctx, n, pad, pad);
	const data = ctx.getImageData(0, 0, w, h).data;
	const mask = new Uint8Array(w * h);
	for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > 24 ? 1 : 0;
	return {
		mask,
		width: w,
		height: h
	};
}
function toLocalPoints(ring, scale, pad) {
	return toPathPoints(simplifyPolyline(ring.map((p) => ({
		x: p.x / scale - pad,
		y: p.y / scale - pad
	})), Math.max(.6, 1.2 / scale)));
}
function textNodeToPathNodes(n) {
	const pad = Math.max(4, n.fontSize * .15);
	const scale = n.fontSize >= 72 ? 2 : n.fontSize >= 28 ? 3 : 4;
	const raster = rasterizeText(n, pad, scale);
	if (!raster) return [];
	const glyphs = nestContours(traceMaskContours(raster.mask, raster.width, raster.height));
	const nodes = [];
	for (const g of glyphs) {
		const points = toLocalPoints(g.outer, scale, pad);
		if (points.length < 3) continue;
		const holes = g.holes.map((h) => toLocalPoints(h, scale, pad)).filter((h) => h.length >= 3);
		const outerPos = contourArea(points) >= 0;
		const orientedHoles = holes.map((h) => orientContour(h, !outerPos));
		const node = pathNode({
			x: n.x,
			y: n.y,
			w: n.w,
			h: n.h,
			rotation: n.rotation,
			points,
			closed: true,
			holes: orientedHoles.length ? orientedHoles : void 0,
			fillRule: orientedHoles.length ? "evenodd" : "nonzero",
			fill: n.fill,
			stroke: "transparent",
			strokeWidth: 0,
			opacity: n.opacity,
			blend: n.blend,
			name: n.name,
			visible: n.visible,
			locked: n.locked,
			shadow: n.shadow
		});
		node.linkId = n.linkId;
		node.href = n.href;
		nodes.push(tightenPathNode(node));
	}
	return nodes;
}
function withOrientedHoles(points, holes) {
	if (!holes?.length) return holes;
	const outerPos = contourArea(points) >= 0;
	return holes.map((h) => orientContour(h, !outerPos));
}
function selectedPath(convert = true) {
	const { doc, selection } = useDesign.getState();
	if (!doc || !selection.length) return null;
	const n = doc.nodes.find((x) => x.id === selection[0]);
	if (!n) return null;
	if (isPath(n)) return n;
	if (convert && isText(n)) return convertSelectedTextToPath() ?? null;
	if (convert && isConvertibleShape(n)) return convertSelectedShapeToPath() ?? asEditablePath(n);
	return null;
}
/** Replace a primitive shape with an editable path that keeps the same id. */
function convertSelectedShapeToPath() {
	const s = useDesign.getState();
	const doc = s.doc;
	if (!doc || !s.selection.length) return null;
	const n = doc.nodes.find((x) => x.id === s.selection[0]);
	if (!n || isPath(n) || !isConvertibleShape(n)) return n && isPath(n) ? n : null;
	const path = shapeToPathNode(n);
	s.commit();
	s.replaceNode(n.id, path, false);
	return path;
}
/** Replace selected type with editable outline paths (counters become holes). */
function convertSelectedTextToPath() {
	const s = useDesign.getState();
	const doc = s.doc;
	if (!doc || !s.selection.length) return null;
	const n = doc.nodes.find((x) => x.id === s.selection[0]);
	if (!n || !isText(n) || !n.text.trim()) return null;
	const paths = textNodeToPathNodes(n);
	if (!paths.length) return null;
	const [first, ...rest] = paths;
	first.id = n.id;
	s.commit();
	s.replaceNode(n.id, first, false);
	const ids = [n.id];
	for (const extra of rest) {
		extra.name = n.name;
		s.addNode(extra, false);
		ids.push(extra.id);
	}
	s.select(ids);
	return first;
}
function addOutlined(n, points, holes) {
	const s = useDesign.getState();
	const node = pathNode({
		x: n.x,
		y: n.y,
		w: n.w,
		h: n.h,
		rotation: n.rotation,
		points,
		closed: true,
		holes,
		fillRule: holes?.length ? "evenodd" : n.fillRule,
		fill: n.fill === "transparent" ? n.stroke || "#3fc6ff" : n.fill,
		stroke: "transparent",
		strokeWidth: 0,
		name: `${n.name} outline`,
		opacity: n.opacity
	});
	s.addNode(node, true);
}
function outlineSelectedStroke(cornerRadius) {
	const n = selectedPath();
	if (!n || n.points.length < 2) return false;
	const width = Math.max(1, n.strokeWidth || 3);
	const outlined = outlineStroke(n.points, n.closed, width, cornerRadius ?? width / 2);
	if (!outlined) return false;
	const holes = [...outlined.hole ? [outlined.hole] : [], ...(n.holes ?? []).flatMap((h) => {
		const inner = outlineStroke(h, true, width, cornerRadius ?? width / 2);
		return inner ? [inner.points, ...inner.hole ? [inner.hole] : []] : [];
	})];
	addOutlined(n, outlined.points, holes.length ? withOrientedHoles(outlined.points, holes) : void 0);
	return true;
}
function offsetSelectedPath(direction, cornerRadius) {
	const n = selectedPath();
	if (!n || n.points.length < 2) return false;
	const dist = Math.max(1, n.strokeWidth || 8) * (direction === "out" ? 1 : -1);
	const points = offsetPolyline(n.points, n.closed, dist, cornerRadius ?? Math.abs(dist));
	const holes = n.holes?.map((h) => offsetPolyline(h, true, -dist, cornerRadius ?? Math.abs(dist)));
	const s = useDesign.getState();
	const node = pathNode({
		x: n.x,
		y: n.y,
		w: n.w,
		h: n.h,
		rotation: n.rotation,
		points,
		closed: n.closed,
		holes: withOrientedHoles(points, holes),
		fillRule: holes?.length ? "evenodd" : n.fillRule,
		fill: "transparent",
		stroke: n.stroke === "transparent" ? "#3fc6ff" : n.stroke,
		strokeWidth: Math.max(1, n.strokeWidth || 2),
		name: `${n.name} offset`,
		opacity: n.opacity
	});
	s.addNode(node, true);
	return true;
}
function simplifySelectedPath(eps = 1.6) {
	const n = selectedPath();
	if (!n || n.points.length < 3) return false;
	const simple = simplifyPolyline(n.points.map((p) => ({
		x: p.x,
		y: p.y
	})), eps);
	if (simple.length < 2) return false;
	const s = useDesign.getState();
	s.commit();
	s.replaceNode(n.id, {
		...n,
		points: toPathPoints(simple),
		holes: n.holes?.map((h) => toPathPoints(simplifyPolyline(h.map((p) => ({
			x: p.x,
			y: p.y
		})), eps)))
	}, false);
	return true;
}
function roundSelectedPathCorners(radius) {
	const n = selectedPath();
	if (!n || n.points.length < 3) return false;
	const r = radius ?? Math.max(4, n.strokeWidth || 8);
	const rounded = roundPolylineCorners(n.points.map((p) => ({
		x: p.x,
		y: p.y
	})), r, n.closed);
	const s = useDesign.getState();
	s.commit();
	s.replaceNode(n.id, {
		...n,
		points: toPathPoints(simplifyPolyline(rounded, Math.max(.6, r * .08))),
		holes: n.holes?.map((h) => {
			return toPathPoints(simplifyPolyline(roundPolylineCorners(h.map((p) => ({
				x: p.x,
				y: p.y
			})), r, true), Math.max(.6, r * .08)));
		})
	}, false);
	return true;
}
function watchFontsForWrapCache() {
	const fonts = typeof document !== "undefined" ? document.fonts : void 0;
	if (!fonts) return () => {};
	const onDone = () => {};
	fonts.addEventListener("loadingdone", onDone);
	fonts.ready.then(onDone);
	return () => fonts.removeEventListener("loadingdone", onDone);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var layoutSchema = object({
	prompt: string().min(3).max(400),
	width: number(),
	height: number(),
	brandColors: array(string()).optional(),
	displayFont: string().optional(),
	bodyFont: string().optional()
});
var magicLayout = createServerFn({ method: "POST" }).validator((input) => layoutSchema.parse(input)).handler(createSsrRpc("45a6ea9767f4ef6ceebe05cab50395b5d12e42954555957f4bd81e77a4326654"));
var rewriteCopy = createServerFn({ method: "POST" }).validator((input) => object({
	text: string().max(500),
	tone: string().max(40)
}).parse(input)).handler(createSsrRpc("ddbfcc430d4343e9a8e4d2bfb9e25397852f38157b77428bbd6b4a36ed2a0fcf"));
var generateFill = createServerFn({ method: "POST" }).validator((input) => object({ prompt: string().min(3).max(300) }).parse(input)).handler(createSsrRpc("7f7bb9aeda8dcf652f0e72d5daddb75ef12fa13df6fff1f12f550cc0434f60eb"));
function AiPanel() {
	const doc = useDesign((s) => s.doc);
	const brand = useDesign((s) => s.brand);
	const applyNodes = useDesign((s) => s.applyNodes);
	const selection = useDesign((s) => s.selection);
	const updateNodes = useDesign((s) => s.updateNodes);
	const addNode = useDesign((s) => s.addNode);
	const [prompt, setPrompt] = (0, import_react.useState)("concert poster, stacked type, cyan crop marks");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [mode, setMode] = (0, import_react.useState)("append");
	const [preview, setPreview] = (0, import_react.useState)(null);
	async function layout() {
		if (!doc || busy) return;
		setBusy(true);
		try {
			const res = await magicLayout({ data: {
				prompt,
				width: doc.artboard.width,
				height: doc.artboard.height,
				brandColors: brand.colors.map((c) => c.hex),
				displayFont: brand.displayFont,
				bodyFont: brand.bodyFont
			} });
			let rawNodes;
			if (!res.ok) {
				rawNodes = fallbackLayout(prompt, doc.artboard.width, doc.artboard.height, brand.colors.map((c) => c.hex), [brand.displayFont, brand.bodyFont]);
				toast.message("Director offline — local layout ready to preview");
			} else rawNodes = res.nodes;
			const nodes = rawNodes.map((raw) => normalizeNode(raw, doc.artboard.width, doc.artboard.height, brand.displayFont, brand.bodyFont));
			setPreview(nodes);
		} finally {
			setBusy(false);
		}
	}
	function applyPreview() {
		if (!preview?.length) return;
		applyNodes(preview, mode);
		setPreview(null);
		toast.success(mode === "replace" ? "Board replaced" : "Layout appended");
	}
	async function rewrite() {
		if (!doc || busy) return;
		const n = doc.nodes.find((x) => selection.includes(x.id) && x.kind === "text");
		if (!n || n.kind !== "text") {
			toast.error("Select a text layer");
			return;
		}
		setBusy(true);
		try {
			const res = await rewriteCopy({ data: {
				text: n.text,
				tone: prompt || "editorial"
			} });
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			updateNodes([n.id], { text: res.text }, true);
		} finally {
			setBusy(false);
		}
	}
	async function image() {
		if (!doc || busy) return;
		setBusy(true);
		try {
			const res = await generateFill({ data: { prompt } });
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			addNode({
				id: uid("im"),
				name: "Generated",
				kind: "image",
				x: 80,
				y: 80,
				w: Math.min(640, doc.artboard.width - 160),
				h: Math.min(640, doc.artboard.height - 160),
				rotation: 0,
				opacity: 1,
				visible: true,
				locked: false,
				blend: "source-over",
				fill: "transparent",
				stroke: "transparent",
				strokeWidth: 0,
				strokeDash: 0,
				strokeDashOffset: 0,
				lineCap: "butt",
				lineJoin: "miter",
				miterLimit: 10,
				radius: 0,
				shadow: null,
				src: res.url,
				crop: null,
				filters: {
					brightness: 1,
					contrast: 1,
					saturate: 1,
					blur: 0
				}
			});
			toast.success("Image placed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-t border-border px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: "Director"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				className: "field mt-2 min-h-16 w-full text-sm",
				value: prompt,
				onChange: (e) => setPrompt(e.target.value),
				placeholder: "Describe a layout, a tone, or an image"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex gap-1",
				children: ["append", "replace"].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setMode(id),
					className: cn("h-8 flex-1 rounded-[8px] text-[10px] font-medium uppercase tracking-wide", mode === id ? "bg-phosphor text-phosphor-ink" : "border border-border text-ink-dim hover:text-ink"),
					children: id
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-col gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "primary",
						disabled: busy,
						onClick: () => void layout(),
						children: busy ? "Working…" : "Magic layout"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						disabled: busy,
						onClick: () => void rewrite(),
						children: "Rewrite copy"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						disabled: busy,
						onClick: () => void image(),
						children: "Generate image"
					})
				]
			}),
			preview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 rounded-[12px] border border-border bg-surface-alt p-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-mono text-[10px] tracking-[0.16em] text-phosphor uppercase",
						children: [
							"Preview · ",
							preview.length,
							" layers · ",
							mode
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 max-h-32 overflow-auto scrollbar-thin",
						children: preview.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex h-7 items-center gap-2 text-[11px] text-ink-dim",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-3 rounded-sm border border-border",
									style: { background: typeof n.fill === "string" ? n.fill : "#3fc6ff" }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate",
									children: n.name || n.kind
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-auto font-mono text-[9px] text-ink-faint uppercase",
									children: n.kind
								})
							]
						}, n.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "primary",
							className: "flex-1",
							onClick: applyPreview,
							children: "Apply"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "flex-1",
							onClick: () => setPreview(null),
							children: "Discard"
						})]
					})
				]
			})
		]
	});
}
function fallbackLayout(prompt, w, h, colors, fonts) {
	const ink = colors[1] ?? "#d9f5e3";
	const ground = colors[0] ?? "#0a0d0c";
	const cyan = colors[2] ?? "#3fc6ff";
	const display = fonts[0] ?? "Chakra Petch";
	const body = fonts[1] ?? "Outfit";
	const title = prompt.split(",")[0]?.trim().slice(0, 28) || "THE VOICE";
	return [
		{
			kind: "rect",
			name: "Ground",
			x: 0,
			y: 0,
			w,
			h,
			fill: ground
		},
		{
			kind: "rect",
			name: "Bar",
			x: 48,
			y: 48,
			w: w - 96,
			h: 8,
			fill: cyan
		},
		{
			kind: "text",
			name: "Headline",
			x: 64,
			y: h * .28,
			w: w - 128,
			h: 160,
			fill: ink,
			text: title.toUpperCase(),
			fontFamily: display,
			fontSize: Math.min(96, w / 10),
			fontWeight: 700,
			uppercase: true
		},
		{
			kind: "text",
			name: "Deck",
			x: 64,
			y: h * .52,
			w: w - 128,
			h: 80,
			fill: cyan,
			text: prompt.slice(0, 80),
			fontFamily: body,
			fontSize: 28,
			fontWeight: 400
		},
		{
			kind: "rect",
			name: "Mark",
			x: 64,
			y: h - 120,
			w: 72,
			h: 8,
			fill: cyan
		}
	];
}
function normalizeNode(raw, maxW, maxH, display = "Chakra Petch", body = "Outfit") {
	const kind = [
		"rect",
		"ellipse",
		"text",
		"star",
		"polygon",
		"line",
		"arrow"
	].includes(String(raw.kind)) ? raw.kind : "rect";
	const base = {
		id: uid("ai"),
		name: String(raw.name ?? kind),
		kind,
		x: Number(raw.x) || 0,
		y: Number(raw.y) || 0,
		w: Math.min(maxW, Number(raw.w) || 120),
		h: Math.min(maxH, Number(raw.h) || 80),
		rotation: Number(raw.rotation) || 0,
		opacity: typeof raw.opacity === "number" ? raw.opacity : 1,
		visible: true,
		locked: false,
		blend: "source-over",
		fill: String(raw.fill ?? "#3fc6ff"),
		stroke: String(raw.stroke ?? "transparent"),
		strokeWidth: Number(raw.strokeWidth) || 0,
		strokeDash: Number(raw.strokeDash) || 0,
		strokeDashOffset: Number(raw.strokeDashOffset) || 0,
		lineCap: raw.lineCap || "butt",
		lineJoin: raw.lineJoin || "miter",
		miterLimit: Number(raw.miterLimit) || 10,
		radius: Number(raw.radius) || 0,
		shadow: null
	};
	if (kind === "text") {
		const size = Number(raw.fontSize) || 48;
		return {
			...base,
			kind: "text",
			text: String(raw.text ?? "Text"),
			fontFamily: String(raw.fontFamily ?? (size >= 40 ? display : body)),
			fontWeight: Number(raw.fontWeight) || 600,
			fontSize: size,
			letterSpacing: Number(raw.letterSpacing) || 0,
			lineHeight: Number(raw.lineHeight) || 1.1,
			align: raw.align || "left",
			uppercase: Boolean(raw.uppercase)
		};
	}
	return base;
}
function nodeLocalPoint(n, x, y) {
	const c = nodeCenter(n);
	const r = -degToRad(n.rotation);
	const dx = x - c.x;
	const dy = y - c.y;
	return {
		x: c.x + dx * Math.cos(r) - dy * Math.sin(r),
		y: c.y + dx * Math.sin(r) + dy * Math.cos(r)
	};
}
function hitNode(n, x, y, opts) {
	if (!n.visible || n.kind === "group" || n.locked && !opts?.ignoreLock) return false;
	const p = nodeLocalPoint(n, x, y);
	if (n.kind === "ellipse") {
		const cx = n.x + n.w / 2;
		const cy = n.y + n.h / 2;
		const rx = n.w / 2 || 1;
		const ry = n.h / 2 || 1;
		const dx = (p.x - cx) / rx;
		const dy = (p.y - cy) / ry;
		return dx * dx + dy * dy <= 1;
	}
	const pad = Math.max(6, n.strokeWidth);
	return p.x >= n.x - pad && p.x <= n.x + n.w + pad && p.y >= n.y - pad && p.y <= n.y + n.h + pad;
}
function hitTop(nodes, x, y) {
	for (let i = nodes.length - 1; i >= 0; i--) {
		const n = nodes[i];
		if (hitNode(n, x, y)) return n;
	}
	return null;
}
function hitHandle(n, sx, sy, zoom) {
	const size = 9 / zoom;
	const rot = 18 / zoom;
	nodeCenter(n);
	const handles = [
		{
			id: "nw",
			x: n.x,
			y: n.y,
			r: size
		},
		{
			id: "n",
			x: n.x + n.w / 2,
			y: n.y,
			r: size
		},
		{
			id: "ne",
			x: n.x + n.w,
			y: n.y,
			r: size
		},
		{
			id: "e",
			x: n.x + n.w,
			y: n.y + n.h / 2,
			r: size
		},
		{
			id: "se",
			x: n.x + n.w,
			y: n.y + n.h,
			r: size
		},
		{
			id: "s",
			x: n.x + n.w / 2,
			y: n.y + n.h,
			r: size
		},
		{
			id: "sw",
			x: n.x,
			y: n.y + n.h,
			r: size
		},
		{
			id: "w",
			x: n.x,
			y: n.y + n.h / 2,
			r: size
		},
		{
			id: "rotate",
			x: n.x + n.w / 2,
			y: n.y - 28 / zoom,
			r: rot
		}
	];
	const p = nodeLocalPoint(n, sx, sy);
	for (const h of handles) if (Math.hypot(p.x - h.x, p.y - h.y) <= h.r + 4 / zoom) return h.id;
	if (hitNode({
		...n,
		locked: false
	}, sx, sy)) return "move";
	return null;
}
function applyHandle(n, handle, dx, dy) {
	const p = {
		x: n.x,
		y: n.y,
		w: n.w,
		h: n.h
	};
	switch (handle) {
		case "move":
			p.x += dx;
			p.y += dy;
			break;
		case "e":
			p.w += dx;
			break;
		case "w":
			p.x += dx;
			p.w -= dx;
			break;
		case "s":
			p.h += dy;
			break;
		case "n":
			p.y += dy;
			p.h -= dy;
			break;
		case "se":
			p.w += dx;
			p.h += dy;
			break;
		case "nw":
			p.x += dx;
			p.y += dy;
			p.w -= dx;
			p.h -= dy;
			break;
		case "ne":
			p.y += dy;
			p.w += dx;
			p.h -= dy;
			break;
		case "sw":
			p.x += dx;
			p.w -= dx;
			p.h += dy;
	}
	if (p.w < 8) p.w = 8;
	if (p.h < 8) p.h = 8;
	return p;
}
function pathWorldToLocal(n, wx, wy) {
	const c = nodeCenter(n);
	const p = n.rotation ? rotatePoint(wx, wy, c.x, c.y, -n.rotation) : {
		x: wx,
		y: wy
	};
	return {
		x: p.x - n.x,
		y: p.y - n.y
	};
}
function pointInRing(pt, ring) {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const a = ring[i];
		const b = ring[j];
		if (a.y > pt.y !== b.y > pt.y && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y + 1e-9) + a.x) inside = !inside;
	}
	return inside;
}
/** Hit holes first so subtract diamonds stay grabable. Ring body picks the hole itself. */
function hitPathNode(n, wx, wy, zoom) {
	const local = pathWorldToLocal(n, wx, wy);
	const holes = n.holes ?? [];
	for (let h = holes.length - 1; h >= 0; h--) {
		const ring = holes[h];
		const hit = hitPathEdit(0, 0, ring, local.x, local.y, zoom);
		if (hit) return {
			...hit,
			hole: h
		};
	}
	for (let h = holes.length - 1; h >= 0; h--) {
		const ring = holes[h];
		if (ring.length >= 3 && pointInRing(local, ring)) return {
			index: 0,
			arm: "anchor",
			hole: h
		};
	}
	return hitPathEdit(0, 0, n.points, local.x, local.y, zoom);
}
function contourOf(n, hole) {
	if (hole == null) return n.points;
	return n.holes?.[hole] ?? [];
}
function clonePathPoint(p) {
	return {
		...p,
		in: p.in ? { ...p.in } : p.in,
		out: p.out ? { ...p.out } : p.out
	};
}
/** Frozen geometry for undo and mid-drag apply. Points travel with the box. */
function snapshotPathNode(n) {
	return {
		...n,
		points: n.points.map(clonePathPoint),
		holes: n.holes?.map((ring) => ring.map(clonePathPoint))
	};
}
function applyPathEdit(n, hit, localX, localY, keepSmooth) {
	const ring = contourOf(n, hit.hole);
	const pt = ring[hit.index];
	if (!pt) return n;
	let nextPt;
	if (hit.arm === "anchor") nextPt = {
		...pt,
		x: localX,
		y: localY
	};
	else nextPt = dragPathHandle(pt, hit.arm, localX, localY, keepSmooth && pt.smooth !== false);
	const nextRing = ring.map((p, i) => i === hit.index ? nextPt : p);
	if (hit.hole == null) return {
		...n,
		points: nextRing
	};
	const holes = (n.holes ?? []).map((h, i) => i === hit.hole ? nextRing : h);
	return {
		...n,
		holes
	};
}
function drawPathNodeTangents(ctx, n, zoom, active, showLengths = false) {
	const c = nodeCenter(n);
	ctx.save();
	if (n.rotation) {
		ctx.translate(c.x, c.y);
		ctx.rotate(n.rotation * Math.PI / 180);
		ctx.translate(-c.x, -c.y);
	}
	const outerActive = active && active.hole == null ? active : null;
	drawPathTangents(ctx, n.x, n.y, n.points, zoom, outerActive, "phosphor", showLengths);
	const holes = n.holes ?? [];
	for (let h = 0; h < holes.length; h++) {
		const holeActive = active && active.hole === h ? {
			...active,
			hole: void 0
		} : null;
		if (holeActive) {
			ctx.save();
			ctx.beginPath();
			const ring = holes[h];
			if (ring[0]) ctx.moveTo(n.x + ring[0].x, n.y + ring[0].y);
			for (let i = 1; i < ring.length; i++) ctx.lineTo(n.x + ring[i].x, n.y + ring[i].y);
			ctx.closePath();
			ctx.strokeStyle = "rgba(126,224,255,0.85)";
			ctx.lineWidth = 2 / zoom;
			ctx.stroke();
			ctx.restore();
		}
		drawPathTangents(ctx, n.x, n.y, holes[h], zoom, holeActive, "cool", showLengths);
	}
	ctx.restore();
}
/** Hit-test the live tangent length labels drawn by drawPathTangents. */
function hitPathLengthLabel(n, wx, wy, zoom, active) {
	if (!active) return null;
	const c = nodeCenter(n);
	function checkRing(pts, hole, ringActive) {
		if (!ringActive) return null;
		for (let i = 0; i < pts.length; i++) {
			const p = pts[i];
			const isAnchorActive = ringActive.index === i && ringActive.arm === "anchor";
			const arms = [];
			if (p.in && (Math.abs(p.in.x) > .2 || Math.abs(p.in.y) > .2)) arms.push({
				arm: "in",
				h: p.in
			});
			if (p.out && (Math.abs(p.out.x) > .2 || Math.abs(p.out.y) > .2)) arms.push({
				arm: "out",
				h: p.out
			});
			for (const { arm, h } of arms) {
				if (!(ringActive.index === i && ringActive.arm === arm || isAnchorActive)) continue;
				const ax = n.x + p.x;
				const ay = n.y + p.y;
				const hx = ax + h.x;
				const hy = ay + h.y;
				const va = n.rotation ? rotatePoint(ax, ay, c.x, c.y, n.rotation) : {
					x: ax,
					y: ay
				};
				const vh = n.rotation ? rotatePoint(hx, hy, c.x, c.y, n.rotation) : {
					x: hx,
					y: hy
				};
				const dx = vh.x - va.x;
				const dy = vh.y - va.y;
				const len = Math.hypot(dx, dy) || 1;
				const ux = dx / len;
				const uy = dy / len;
				const off = 14 / zoom;
				const lx = vh.x + ux * off;
				const ly = vh.y + uy * off;
				const hitR = 18 / zoom;
				if (Math.hypot(wx - lx, wy - ly) <= hitR) return {
					index: i,
					arm,
					hole,
					labelX: lx,
					labelY: ly,
					length: Math.round(len)
				};
			}
		}
		return null;
	}
	const outerActive = active.hole == null ? active : null;
	const outer = checkRing(n.points, void 0, outerActive);
	if (outer) return outer;
	const holes = n.holes ?? [];
	for (let h = 0; h < holes.length; h++) {
		const holeActive = active.hole === h ? {
			...active,
			hole: void 0
		} : null;
		const hit = checkRing(holes[h], h, holeActive);
		if (hit) return hit;
	}
	return null;
}
function worldPathEnd(n, end) {
	const p = end === "start" ? n.points[0] : n.points[n.points.length - 1];
	if (!p) return null;
	return {
		x: n.x + p.x,
		y: n.y + p.y
	};
}
function reversePoints(pts) {
	return pts.map((p) => ({
		...p,
		in: p.out ? { ...p.out } : null,
		out: p.in ? { ...p.in } : null
	})).reverse();
}
function toKeepSpace(p, from, keep) {
	return {
		...p,
		x: from.x + p.x - keep.x,
		y: from.y + p.y - keep.y,
		in: p.in ? { ...p.in } : null,
		out: p.out ? { ...p.out } : null
	};
}
/** Concatenate two open contours at the named ends. Same node + opposite ends closes. */
function joinOpenPathNodes(keep, keepEnd, other, otherEnd) {
	if (keep.id === other.id) {
		if (keep.points.length >= 3 && keepEnd !== otherEnd) return closePathWithCubic(keep);
		return keep;
	}
	if (keep.closed || other.closed || keep.points.length < 1 || other.points.length < 1) return keep;
	let a = keep.points.map((p) => ({
		...p,
		in: p.in ? { ...p.in } : null,
		out: p.out ? { ...p.out } : null
	}));
	let b = other.points.map((p) => toKeepSpace(p, other, keep));
	if (keepEnd === "start") a = reversePoints(a);
	if (otherEnd === "end") b = reversePoints(b);
	const last = a[a.length - 1];
	const first = b[0];
	const joined = {
		x: (last.x + first.x) / 2,
		y: (last.y + first.y) / 2,
		in: last.in ?? null,
		out: first.out ?? null,
		smooth: Boolean(hasHandle(last.in) && hasHandle(first.out) || last.smooth || first.smooth)
	};
	return {
		...keep,
		points: [
			...a.slice(0, -1),
			joined,
			...b.slice(1)
		],
		closed: false
	};
}
function nearestOpenPathEnd(nodes, wx, wy, thresh, exclude) {
	let best = null;
	for (const n of nodes) {
		if (n.closed || n.points.length < 1) continue;
		for (const end of ["start", "end"]) {
			if (exclude && exclude.id === n.id && exclude.end === end) continue;
			if (exclude && exclude.id === n.id && n.points.length < 2) continue;
			const pt = worldPathEnd(n, end);
			if (!pt) continue;
			const dist = Math.hypot(wx - pt.x, wy - pt.y);
			if (dist <= thresh && (!best || dist < best.dist)) best = {
				node: n,
				end,
				dist
			};
		}
	}
	return best;
}
function cloneRing(ring) {
	return ring.map(clonePathPoint);
}
function clonePathStyle(n, points, closed, holes) {
	const extra = pathNode({
		x: n.x,
		y: n.y,
		w: n.w,
		h: n.h,
		points: cloneRing(points),
		closed,
		holes: holes && holes.length ? holes.map(cloneRing) : void 0,
		fill: n.fill,
		stroke: n.stroke,
		strokeWidth: n.strokeWidth,
		opacity: n.opacity,
		blend: n.blend,
		rotation: n.rotation
	});
	extra.name = n.name;
	return extra;
}
function applyCutsToPath(n, groups) {
	if (!groups.length) return null;
	const frozen = snapshotPathNode(n);
	let keep = frozen;
	const extras = [];
	const outerGroup = groups.find((g) => g.hole == null);
	const holeGroups = groups.filter((g) => g.hole != null);
	if (outerGroup) {
		const pieces = cutContourMany(keep.points, keep.closed, outerGroup.hits);
		const released = keep.closed && (keep.holes?.length ?? 0) > 0;
		keep = {
			...keep,
			points: pieces[0] ?? keep.points,
			closed: false,
			holes: released ? void 0 : keep.holes
		};
		for (const piece of pieces.slice(1)) if (piece.length >= 2) extras.push(clonePathStyle(n, piece, false));
		if (released) {
			for (const hole of frozen.holes ?? []) if (hole.length >= 3) extras.push(clonePathStyle(n, hole, true));
		}
	}
	const survivingHoles = (keep.holes ?? []).map(cloneRing);
	const removed = /* @__PURE__ */ new Set();
	for (const g of holeGroups.sort((a, b) => (b.hole ?? 0) - (a.hole ?? 0))) {
		const idx = g.hole;
		const ring = survivingHoles[idx];
		if (!ring) continue;
		const pieces = cutContourMany(ring, true, g.hits);
		removed.add(idx);
		for (const piece of pieces) if (piece.length >= 2) extras.push(clonePathStyle(n, piece, false));
	}
	if (removed.size) keep = {
		...keep,
		holes: survivingHoles.filter((_, i) => !removed.has(i))
	};
	return {
		keep,
		extras
	};
}
function groupCompoundHits(hits) {
	const grouped = /* @__PURE__ */ new Map();
	for (const h of hits) {
		const key = h.hole == null ? "outer" : h.hole;
		const g = grouped.get(key) ?? {
			hole: h.hole,
			hits: []
		};
		g.hits.push(h.hit);
		grouped.set(key, g);
	}
	return [...grouped.values()];
}
function closedSibling(n, lobe) {
	return clonePathStyle(n, lobe.points, true, lobe.holes);
}
/** Planarize figure-eight / bowtie traces, then cut only the lobes the stroke actually crosses. Untouched lobes stay closed siblings. */
function applyKnifeStrokeToPath(n, ax, ay, bx, by) {
	const source = snapshotPathNode(n);
	const a = {
		x: ax - source.x,
		y: ay - source.y
	};
	const b = {
		x: bx - source.x,
		y: by - source.y
	};
	const lobes = explodeTwistedPath(source);
	const extras = [];
	let keep = null;
	let any = false;
	lobes.forEach((lobe, i) => {
		const hits = strokeHitsCompound(lobe, a, b);
		if (!hits.length) {
			const intact = i === 0 ? {
				...lobe,
				id: source.id,
				name: source.name
			} : closedSibling(source, lobe);
			if (!keep) keep = intact;
			else extras.push(intact);
			return;
		}
		const applied = applyCutsToPath(lobe, groupCompoundHits(hits));
		if (!applied) {
			const intact = i === 0 ? {
				...lobe,
				id: source.id,
				name: source.name
			} : closedSibling(source, lobe);
			if (!keep) keep = intact;
			else extras.push(intact);
			return;
		}
		any = true;
		const first = i === 0 ? {
			...applied.keep,
			id: source.id,
			name: source.name
		} : applied.keep;
		if (!keep) keep = first;
		else extras.push(first);
		extras.push(...applied.extras);
	});
	if (!any || !keep) return null;
	return {
		keep,
		extras
	};
}
function applyKnifePointToPath(n, wx, wy, zoom) {
	const source = snapshotPathNode(n);
	const local = pathWorldToLocal(source, wx, wy);
	const lobes = explodeTwistedPath(source);
	let bestLobe = null;
	let bestIndex = -1;
	let bestHole = null;
	let bestHit = null;
	for (let index = 0; index < lobes.length; index++) {
		const lobe = lobes[index];
		const found = hitCompoundSegment(lobe, local.x, local.y, zoom);
		if (!found) continue;
		if (!bestHit || found.hit.dist < bestHit.dist) {
			bestLobe = lobe;
			bestIndex = index;
			bestHole = found.hole;
			bestHit = found.hit;
		}
	}
	if (!bestLobe || !bestHit || bestIndex < 0) return null;
	const applied = applyCutsToPath(bestLobe, [{
		hole: bestHole,
		hits: [bestHit]
	}]);
	if (!applied) return null;
	const nodes = [];
	lobes.forEach((lobe, i) => {
		if (i === bestIndex) {
			const cut = i === 0 ? {
				...applied.keep,
				id: source.id,
				name: source.name
			} : applied.keep;
			nodes.push(cut, ...applied.extras);
			return;
		}
		nodes.push(i === 0 ? {
			...lobe,
			id: source.id,
			name: source.name
		} : closedSibling(source, lobe));
	});
	const keep = nodes.find((p) => p.id === source.id) ?? nodes[0];
	return {
		keep,
		extras: nodes.filter((p) => p !== keep)
	};
}
var preview$1 = null;
var listeners$2 = /* @__PURE__ */ new Set();
function emit$1() {
	for (const fn of listeners$2) fn();
}
function getDistributePreview() {
	return preview$1;
}
function clearDistributePreview() {
	preview$1 = null;
	emit$1();
}
function commitDistributePreview() {
	const plan = preview$1;
	if (!plan || plan.deltas.length === 0) {
		clearDistributePreview();
		return;
	}
	const s = useDesign.getState();
	for (const d of plan.deltas) {
		const n = s.doc?.nodes.find((x) => x.id === d.id);
		if (!n) continue;
		s.updateNodes?.([d.id], {
			x: n.x + d.dx,
			y: n.y + d.dy
		}, false);
	}
	s.commit?.();
	clearDistributePreview();
}
function subscribeDistributePreview(fn) {
	listeners$2.add(fn);
	return () => listeners$2.delete(fn);
}
function formatDistributeGap(gap) {
	if (gap < .05) return "0";
	if (gap < 10) return gap.toFixed(1).replace(/\.0$/, "");
	return Math.round(gap).toString();
}
/** Arm a distribute preview for the given axis using current selection. */
function armDistributePreview(axis) {
	const s = useDesign.getState();
	const doc = s.doc;
	const selection = s.selection;
	if (!doc || selection.length < 3) {
		preview$1 = null;
		emit$1();
		return null;
	}
	const nodes = selection.map((id) => doc.nodes.find((n) => n.id === id)).filter((n) => !!n && !n.locked);
	if (nodes.length < 3) {
		preview$1 = null;
		emit$1();
		return null;
	}
	const boxes = nodes.map((n) => ({
		id: n.id,
		box: geometryBox(n),
		node: n
	}));
	boxes.sort((a, b) => axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y);
	const first = boxes[0].box;
	const last = boxes[boxes.length - 1].box;
	const start = axis === "h" ? first.x : first.y;
	const end = axis === "h" ? last.x + last.w : last.y + last.h;
	const total = boxes.reduce((s, item) => s + (axis === "h" ? item.box.w : item.box.h), 0);
	const plan = buildPlan(axis, boxes.length > 1 ? Math.max(0, (end - start - total) / (boxes.length - 1)) : 0, boxes);
	preview$1 = plan;
	emit$1();
	return plan;
}
/** Live update of the gap during drag. */
function setLiveDistributePreview(axis, gap) {
	const s = useDesign.getState();
	const doc = s.doc;
	const selection = s.selection;
	if (!doc || selection.length < 3) {
		preview$1 = null;
		emit$1();
		return;
	}
	const nodes = selection.map((id) => doc.nodes.find((n) => n.id === id)).filter((n) => !!n && !n.locked);
	if (nodes.length < 3) {
		preview$1 = null;
		emit$1();
		return;
	}
	const boxes = nodes.map((n) => ({
		id: n.id,
		box: geometryBox(n),
		node: n
	}));
	boxes.sort((a, b) => axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y);
	preview$1 = buildPlan(axis, Math.max(0, gap), boxes);
	emit$1();
}
function buildPlan(axis, gap, boxes) {
	const first = boxes[0].box;
	const last = boxes[boxes.length - 1].box;
	const start = axis === "h" ? first.x : first.y;
	const end = axis === "h" ? last.x + last.w : last.y + last.h;
	const total = boxes.reduce((s, item) => s + (axis === "h" ? item.box.w : item.box.h), 0);
	let cursor = start + (end - start - (total + gap * (boxes.length - 1))) / 2;
	const ghosts = [];
	const deltas = [];
	for (const item of boxes) {
		const b = item.box;
		const size = axis === "h" ? b.w : b.h;
		const target = cursor;
		const dx = axis === "h" ? target - b.x : 0;
		const dy = axis === "v" ? target - b.y : 0;
		ghosts.push({
			id: item.id,
			x: b.x + dx,
			y: b.y + dy,
			w: b.w,
			h: b.h,
			stay: Math.abs(dx) < .5 && Math.abs(dy) < .5
		});
		if (Math.abs(dx) > .1 || Math.abs(dy) > .1) deltas.push({
			id: item.id,
			dx,
			dy
		});
		cursor += size + gap;
	}
	return {
		axis,
		gap,
		ghosts,
		deltas
	};
}
/** Phosphor flush diamond with lag companion spark and peak halo.
* Continuous expanding breath: primary diamond, nested marks and denary breath
* on the thirteenth, quiet fourteenth at the absolute extreme trail with
* even quieter undenary breath, ... up through quiet thirty-eighth mark
* only at the absolute extreme trail of the joint crest with even quieter
* unseptuagintal breath, quiet thirty-ninth mark with unseptuagintal-plus breath,
* quiet fortieth mark with unseptuagintal-plus-plus breath,
* and now a quiet forty-first mark only at the absolute extreme trail of the joint crest
* with an even quieter unseptuagintal-plus-plus-plus breath of its own,
* and a quiet forty-second mark only at the absolute extreme trail of the joint crest
* with an even quieter unseptuagintal-plus-plus-plus-plus breath of its own,
* and a quiet forty-third mark only at the absolute extreme trail of the joint crest
* with an even quieter unseptuagintal-plus-plus-plus-plus-plus breath of its own,
* and a quiet forty-fourth mark only at the absolute extreme trail of the joint crest
* with an even quieter unseptuagintal-plus-plus-plus-plus-plus-plus breath of its own,
* and a quiet forty-fifth mark only at the absolute extreme trail of the joint crest
* with an even quieter unseptuagintal-plus-plus-plus-plus-plus-plus-plus breath of its own,
* and a quiet forty-sixth mark only at the absolute extreme trail of the joint crest
* with an even quieter unseptuagintal-plus-plus-plus-plus-plus-plus-plus-plus breath of its own,
* and a quiet forty-seventh mark only at the absolute extreme trail of the joint crest
* with an even quieter unseptuagintal-plus-plus-plus-plus-plus-plus-plus-plus-plus breath of its own,
* and a quiet forty-eighth mark only at the absolute extreme trail of the joint crest
* with an even quieter unseptuagintal-plus-plus-plus-plus-plus-plus-plus-plus-plus-plus breath of its own. All family members
* inherit familyLagRot. Phosphor-on-ground.
*/
function drawDistributePreview(ctx, plan, zoom, pulse, lag, rotate, slow, trail) {
	if (!plan || plan.ghosts.length < 2) return;
	let cx = 0, cy = 0;
	for (const g of plan.ghosts) {
		cx += g.x + g.w / 2;
		cy += g.y + g.h / 2;
	}
	cx /= plan.ghosts.length;
	cy /= plan.ghosts.length;
	const baseR = Math.max(18, 28 / zoom);
	const familyLagRot = rotate;
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(familyLagRot);
	drawDiamond(ctx, baseR * (1 + .18 * (pulse - .5)), `rgba(63, 198, 255, ${.55 + .35 * pulse})`, zoom);
	const lScale = 1 + .12 * (lag - .5);
	ctx.save();
	ctx.rotate(.4);
	drawDiamond(ctx, baseR * .72 * lScale, `rgba(63, 198, 255, ${.28 + .22 * lag})`, zoom);
	ctx.restore();
	const sScale = 1 + .08 * (slow - .5);
	drawDiamond(ctx, baseR * 1.35 * sScale, `rgba(63, 198, 255, ${.12 + .1 * slow})`, zoom);
	const tAng = trail * Math.PI * 2;
	const tR = baseR * 1.6;
	ctx.beginPath();
	ctx.arc(Math.cos(tAng) * tR, Math.sin(tAng) * tR, 2.2 / zoom, 0, Math.PI * 2);
	ctx.fillStyle = `rgba(63, 198, 255, ${.4 + .4 * trail})`;
	ctx.fill();
	const marks = [
		{
			idx: 1,
			size: .92,
			op: .32,
			breath: pulse
		},
		{
			idx: 2,
			size: .84,
			op: .26,
			breath: lag
		},
		{
			idx: 3,
			size: .76,
			op: .21,
			breath: slow
		},
		{
			idx: 27,
			size: .22,
			op: .045,
			breath: trail * .6
		},
		{
			idx: 28,
			size: .16,
			op: .028,
			breath: trail * .35
		},
		{
			idx: 29,
			size: .11,
			op: .016,
			breath: trail * .18
		},
		{
			idx: 30,
			size: .07,
			op: .008,
			breath: trail * .09
		},
		{
			idx: 31,
			size: .045,
			op: .004,
			breath: trail * .045
		},
		{
			idx: 32,
			size: .028,
			op: .002,
			breath: trail * .022
		},
		{
			idx: 33,
			size: .018,
			op: .001,
			breath: trail * .011
		},
		{
			idx: 34,
			size: .011,
			op: 5e-4,
			breath: trail * .0055
		},
		{
			idx: 35,
			size: .007,
			op: 25e-5,
			breath: trail * .00275
		},
		{
			idx: 36,
			size: .0045,
			op: 12e-5,
			breath: trail * .0014
		},
		{
			idx: 37,
			size: .0028,
			op: 6e-5,
			breath: trail * 7e-4
		},
		{
			idx: 38,
			size: .0017,
			op: 3e-5,
			breath: trail * 35e-5
		},
		{
			idx: 39,
			size: .00105,
			op: 15e-6,
			breath: trail * 175e-6
		},
		{
			idx: 40,
			size: 65e-5,
			op: 75e-7,
			breath: trail * 875e-7
		},
		{
			idx: 41,
			size: 4e-4,
			op: 375e-8,
			breath: trail * 4375e-8
		},
		{
			idx: 42,
			size: 25e-5,
			op: 1875e-9,
			breath: trail * 21875e-9
		},
		{
			idx: 43,
			size: 15e-5,
			op: 9e-7,
			breath: trail * 109e-7
		},
		{
			idx: 44,
			size: 9e-5,
			op: 45e-8,
			breath: trail * 545e-8
		},
		{
			idx: 45,
			size: 55e-6,
			op: 22e-8,
			breath: trail * 27e-7
		},
		{
			idx: 46,
			size: 33e-6,
			op: 11e-8,
			breath: trail * 135e-8
		},
		{
			idx: 47,
			size: 2e-5,
			op: 55e-9,
			breath: trail * 675e-9
		},
		{
			idx: 48,
			size: 12e-6,
			op: 27e-9,
			breath: trail * 3.375e-7
		}
	];
	for (const m of marks) {
		const maxB = m.idx >= 28 ? m.idx === 28 ? .35 : m.idx === 29 ? .18 : m.idx === 30 ? .09 : m.idx === 31 ? .045 : m.idx === 32 ? .022 : m.idx === 33 ? .011 : m.idx === 34 ? .0055 : m.idx === 35 ? .00275 : m.idx === 36 ? .0014 : m.idx === 37 ? 7e-4 : m.idx === 38 ? 35e-5 : m.idx === 39 ? 175e-6 : m.idx === 40 ? 875e-7 : m.idx === 41 ? 4375e-8 : m.idx === 42 ? 21875e-9 : m.idx === 43 ? 109e-7 : m.idx === 44 ? 545e-8 : m.idx === 45 ? 27e-7 : m.idx === 46 ? 135e-8 : m.idx === 47 ? 675e-9 : 3.375e-7 : 1;
		const rel = m.breath / maxB;
		const peak = rel > .82;
		if (m.idx > 10 && !peak) continue;
		const mScale = 1 + .04 * (rel - .5);
		const alpha = m.op * (.4 + .6 * rel);
		ctx.save();
		ctx.rotate(m.idx * .11);
		if (m.idx >= 20) drawMicroTaper(ctx, baseR * m.size * mScale, alpha, zoom, m.idx);
		else drawDiamond(ctx, baseR * m.size * mScale, `rgba(63, 198, 255, ${alpha})`, zoom);
		ctx.restore();
	}
	ctx.restore();
}
function drawDiamond(ctx, r, style, zoom) {
	ctx.beginPath();
	ctx.moveTo(0, -r);
	ctx.lineTo(r, 0);
	ctx.lineTo(0, r);
	ctx.lineTo(-r, 0);
	ctx.closePath();
	ctx.strokeStyle = style;
	ctx.lineWidth = Math.max(.6, 1.1 / zoom);
	ctx.stroke();
}
function drawMicroTaper(ctx, r, alpha, zoom, idx) {
	const segs = 4;
	for (let i = 0; i < segs; i++) {
		const a0 = i / segs * Math.PI * 2 + idx * .05;
		const a1 = (i + .72) / segs * Math.PI * 2 + idx * .05;
		const taper = 1 - i * .12;
		ctx.beginPath();
		ctx.arc(0, 0, r * taper, a0, a1);
		ctx.strokeStyle = `rgba(63, 198, 255, ${alpha * (1 - i * .15)})`;
		ctx.lineWidth = Math.max(.4, .7 / zoom);
		ctx.stroke();
	}
}
function cornerLastPenPoint() {
	const s = useDesign.getState();
	const doc = s.doc;
	if (!doc || s.tool !== "pen") return false;
	const sel = s.selection[0] ? doc.nodes.find((x) => x.id === s.selection[0]) : null;
	if (!sel || !isPath(sel) || sel.closed || !sel.points.length) return false;
	const last = sel.points[sel.points.length - 1];
	if (!hasHandle(last.out) && last.smooth === false) return false;
	const nextPt = {
		...last,
		out: null,
		smooth: false
	};
	const points = sel.points.map((p, i) => i === sel.points.length - 1 ? nextPt : p);
	s.commit();
	s.replaceNode(sel.id, {
		...sel,
		points
	}, false);
	setPathEditHit({
		index: points.length - 1,
		arm: "anchor"
	});
	return true;
}
function appendPenPoint(wx, wy) {
	const s = useDesign.getState();
	const doc = s.doc;
	if (!doc) return null;
	const sel = s.selection[0] ? doc.nodes.find((x) => x.id === s.selection[0]) : null;
	if (sel && isPath(sel) && !sel.closed) {
		const pt = {
			x: wx - sel.x,
			y: wy - sel.y,
			in: null,
			out: null,
			smooth: true
		};
		s.commit();
		s.replaceNode(sel.id, {
			...sel,
			points: [...sel.points, pt]
		}, false);
		return sel.id;
	}
	const node = pathNode({
		x: 0,
		y: 0,
		w: doc.artboard.width,
		h: doc.artboard.height,
		points: [{
			x: wx,
			y: wy,
			in: null,
			out: null,
			smooth: true
		}],
		closed: false,
		stroke: s.color || "#3fc6ff",
		strokeWidth: 3,
		fill: "transparent"
	});
	s.addNode(node, true);
	return node.id;
}
function setPathEditHit(hit) {
	useDesign.setState({ pathEditHit: hit });
}
function togglePathPointSelection(index, hole) {
	const s = useDesign.getState();
	const key = (p) => `${p.hole ?? ""}:${p.index}`;
	const targetKey = `${hole ?? ""}:${index}`;
	const cur = s.pathPointSelection ?? [];
	const next = cur.some((p) => key(p) === targetKey) ? cur.filter((p) => key(p) !== targetKey) : [...cur, {
		index,
		hole
	}];
	useDesign.setState({
		pathPointSelection: next,
		pathEditHit: {
			index,
			arm: "anchor",
			hole
		}
	});
}
function setPathPointSelection(points) {
	useDesign.setState({ pathPointSelection: points });
}
function editPathHit(id, hit, localX, localY, keepSmooth, commit = false) {
	const s = useDesign.getState();
	const doc = s.doc;
	if (!doc) return;
	const n = doc.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) return;
	if (commit) s.commit();
	const next = applyPathEdit(n, hit, localX, localY, keepSmooth);
	s.replaceNode(id, next, false);
	setPathEditHit(hit);
}
function livePath(id) {
	const n = useDesign.getState().doc?.nodes.find((x) => x.id === id);
	return n && isPath(n) ? n : null;
}
function selectPathPoint(index, hole) {
	setPathEditHit({
		index,
		arm: "anchor",
		hole
	});
}
function selectPathHole(hole) {
	setPathEditHit({
		index: 0,
		arm: "anchor",
		hole
	});
}
/** Walk the selected compound path's holes. Returns true when the hit moved. */
function stepPathHole(delta) {
	if (!delta) return false;
	const s = useDesign.getState();
	const hit = s.pathEditHit;
	if (hit?.hole == null) return false;
	const id = s.selection[0];
	if (!id) return false;
	const count = livePath(id)?.holes?.length ?? 0;
	if (count < 1) return false;
	const next = Math.max(0, Math.min(count - 1, hit.hole + delta));
	if (next === hit.hole) return false;
	selectPathHole(next);
	return true;
}
/** Jump to the first (end=false) or last hole. Returns true when the hit moved. */
function jumpPathHole(end) {
	const s = useDesign.getState();
	const hit = s.pathEditHit;
	if (hit?.hole == null) return false;
	const id = s.selection[0];
	if (!id) return false;
	const count = livePath(id)?.holes?.length ?? 0;
	if (count < 1) return false;
	const next = end ? count - 1 : 0;
	if (next === hit.hole) return false;
	selectPathHole(next);
	return true;
}
/** Walk points on the picked hole ring. Left/Right. Returns true when handled. */
function stepPathHolePoint(delta) {
	if (!delta) return false;
	const s = useDesign.getState();
	const hit = s.pathEditHit;
	if (hit?.hole == null) return false;
	const id = s.selection[0];
	if (!id) return false;
	const count = (livePath(id)?.holes?.[hit.hole])?.length ?? 0;
	if (count < 1) return false;
	selectPathPoint((((hit.index % count + count) % count + delta) % count + count) % count, hit.hole);
	return true;
}
/** Jump to the first (end=false) or last point on the picked hole ring. */
function jumpPathHolePoint(end) {
	const s = useDesign.getState();
	const hit = s.pathEditHit;
	if (hit?.hole == null) return false;
	const id = s.selection[0];
	if (!id) return false;
	const count = (livePath(id)?.holes?.[hit.hole])?.length ?? 0;
	if (count < 1) return false;
	const next = end ? count - 1 : 0;
	if ((hit.index % count + count) % count === next) return false;
	selectPathPoint(next, hit.hole);
	return true;
}
function joinSelectedPathToNearest(wx, wy, zoom) {
	const s = useDesign.getState();
	const doc = s.doc;
	if (!doc) return false;
	const thresh = 9 / zoom;
	const open = doc.nodes.filter(isPath).filter((n) => !n.closed);
	const sel = s.selection[0] ? open.find((n) => n.id === s.selection[0]) : null;
	const from = sel ? nearestOpenPathEnd([sel], wx, wy, thresh) ?? nearestOpenPathEnd(open, wx, wy, thresh) : nearestOpenPathEnd(open, wx, wy, thresh);
	if (!from) return false;
	const to = nearestOpenPathEnd(open, wx, wy, thresh, {
		id: from.node.id,
		end: from.end
	});
	if (!to) return false;
	if (from.node.id === to.node.id) {
		if (from.node.points.length < 3) return false;
		s.commit();
		s.replaceNode(from.node.id, closePathWithCubic(from.node), false);
		setPathEditHit({
			index: 0,
			arm: "anchor"
		});
		return true;
	}
	const keep = from.node;
	const other = to.node;
	const keepEnd = from.end;
	const merged = joinOpenPathNodes(keep, keepEnd, other, to.end);
	s.commit();
	s.replaceNode(keep.id, merged, false);
	const leftover = useDesign.getState().doc;
	if (leftover) useDesign.setState({
		doc: {
			...leftover,
			nodes: leftover.nodes.filter((n) => n.id !== other.id)
		},
		selection: [keep.id],
		dirty: true
	});
	setPathEditHit({
		index: keepEnd === "end" ? Math.max(0, keep.points.length - 1) : 0,
		arm: "anchor"
	});
	return true;
}
function knifePaths() {
	const s = useDesign.getState();
	const doc = s.doc;
	if (!doc) return [];
	const paths = [];
	for (const n of doc.nodes) {
		if (!n.visible || n.locked) continue;
		const p = asEditablePath(n);
		if (!p || p.points.length < 2) continue;
		paths.push(p);
	}
	const preferred = s.selection[0] ? paths.find((n) => n.id === s.selection[0]) : void 0;
	return preferred ? [preferred, ...paths.filter((n) => n.id !== preferred.id)] : paths;
}
function knifeCutAt(wx, wy, zoom) {
	const s = useDesign.getState();
	for (const n of knifePaths()) {
		const applied = applyKnifePointToPath(n, wx, wy, zoom);
		if (!applied) continue;
		s.commit();
		s.replaceNode(n.id, applied.keep, false);
		const ids = [n.id];
		for (const extra of applied.extras) {
			s.addNode(extra, false);
			ids.push(extra.id);
		}
		s.select(ids);
		setPathEditHit({
			index: 0,
			arm: "anchor"
		});
		return true;
	}
	return false;
}
function knifeCutStroke(ax, ay, bx, by, zoom) {
	if (Math.hypot(bx - ax, by - ay) < 4 / zoom) return knifeCutAt(bx, by, zoom);
	const s = useDesign.getState();
	let any = false;
	let firstKeep = null;
	const extraIds = [];
	for (const n of knifePaths()) {
		const applied = applyKnifeStrokeToPath(n, ax, ay, bx, by);
		if (!applied) continue;
		if (!any) s.commit();
		any = true;
		s.replaceNode(n.id, applied.keep, false);
		if (!firstKeep) firstKeep = n.id;
		for (const extra of applied.extras) {
			s.addNode(extra, false);
			extraIds.push(extra.id);
		}
	}
	if (!any) return knifeCutAt(bx, by, zoom);
	s.select([firstKeep, ...extraIds].filter(Boolean));
	setPathEditHit({
		index: 0,
		arm: "anchor"
	});
	return true;
}
/** Rotate multi-selected path points (and their handles) around the selection center by angleDeg.
* If basePoints/baseHoles are provided, rotate from those (for live drag from original).
* Returns true if applied.
*/
function rotateSelectedPathPoints(angleDeg, basePoints, baseHoles) {
	const s = useDesign.getState();
	if (s.selection.length !== 1 || Math.abs(angleDeg) < .01) return false;
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) return false;
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 2) return false;
	const points = basePoints ?? n.points;
	const holes = baseHoles ?? n.holes;
	const coords = selectedPointCoords({
		...n,
		points,
		holes
	}, selected);
	if (coords.length < 2) return false;
	const xs = coords.map((c) => c.x);
	const ys = coords.map((c) => c.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const cx = (minX + maxX) / 2;
	const cy = (minY + maxY) / 2;
	const rad = angleDeg * Math.PI / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const nextPoints = points.map(clonePathPoint);
	const nextHoles = holes?.map((ring) => ring.map(clonePathPoint));
	for (const { sel } of coords) {
		const ring = sel.hole == null ? nextPoints : nextHoles?.[sel.hole];
		if (!ring) continue;
		const p = ring[sel.index];
		if (!p) continue;
		const dx = p.x - cx;
		const dy = p.y - cy;
		const nx = cx + dx * cos - dy * sin;
		const ny = cy + dx * sin + dy * cos;
		const rotH = (h) => {
			if (!h) return h ?? null;
			return {
				x: h.x * cos - h.y * sin,
				y: h.x * sin + h.y * cos
			};
		};
		ring[sel.index] = {
			...p,
			x: nx,
			y: ny,
			in: rotH(p.in),
			out: rotH(p.out)
		};
	}
	s.replaceNode(id, {
		...n,
		points: nextPoints,
		holes: nextHoles && nextHoles.length ? nextHoles : void 0
	}, false);
	setStudioStatus(`Rotated ${coords.length} points · ${Math.round(angleDeg)}°`);
	return true;
}
var lastPathScale = {
	sx: 1,
	sy: 1
};
/** Scale multi-selected path points (and their Bézier handles) from the original bbox.
* Fixed edge/corner is the opposite of the dragged handle. Drag past the fixed point to flip (negative scale). Shift locks aspect (signs follow the cursor half-planes). Alt scales from center.
* basePoints/baseHoles for live drag from original. Returns true if applied.
*/
function scaleSelectedPathPoints(handle, mouseLocalX, mouseLocalY, shiftKey, altKey, basePoints, baseHoles) {
	const s = useDesign.getState();
	if (s.selection.length !== 1) return false;
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) return false;
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 2) return false;
	const points = basePoints ?? n.points;
	const holes = baseHoles ?? n.holes;
	const coords = selectedPointCoords({
		...n,
		points,
		holes
	}, selected);
	if (coords.length < 2) return false;
	const xs = coords.map((c) => c.x);
	const ys = coords.map((c) => c.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const origW = Math.max(1e-6, maxX - minX);
	const origH = Math.max(1e-6, maxY - minY);
	const cx = (minX + maxX) / 2;
	const cy = (minY + maxY) / 2;
	let fixedX = cx;
	let fixedY = cy;
	if (!altKey) {
		if (handle.includes("w")) fixedX = maxX;
		else if (handle.includes("e")) fixedX = minX;
		if (handle.includes("n")) fixedY = maxY;
		else if (handle.includes("s")) fixedY = minY;
	}
	let sx = 1;
	let sy = 1;
	const involvesX = handle === "e" || handle === "w" || handle === "ne" || handle === "nw" || handle === "se" || handle === "sw";
	const involvesY = handle === "n" || handle === "s" || handle === "ne" || handle === "nw" || handle === "se" || handle === "sw";
	if (involvesX) {
		const origDelta = (handle.includes("w") ? minX : maxX) - fixedX;
		const newDelta = mouseLocalX - fixedX;
		sx = Math.abs(origDelta) > 1e-6 ? newDelta / origDelta : 1;
	}
	if (involvesY) {
		const origDelta = (handle.includes("n") ? minY : maxY) - fixedY;
		const newDelta = mouseLocalY - fixedY;
		sy = Math.abs(origDelta) > 1e-6 ? newDelta / origDelta : 1;
	}
	if (shiftKey) {
		if (involvesX && involvesY) {
			const origDiag = Math.hypot(origW, origH);
			const mouseDx = mouseLocalX - fixedX;
			const mouseDy = mouseLocalY - fixedY;
			const mag = origDiag > 1e-6 ? Math.hypot(mouseDx, mouseDy) / origDiag : 1;
			const signX = Math.sign(sx) || 1;
			const signY = Math.sign(sy) || 1;
			sx = mag * signX;
			sy = mag * signY;
		} else if (involvesX) sy = sx;
		else if (involvesY) sx = sy;
	}
	const clamp = (v) => {
		return (Math.sign(v) || 1) * Math.max(.01, Math.abs(v));
	};
	sx = clamp(sx);
	sy = clamp(sy);
	lastPathScale = {
		sx,
		sy
	};
	const nextPoints = points.map(clonePathPoint);
	const nextHoles = holes?.map((ring) => ring.map(clonePathPoint));
	for (const { sel } of coords) {
		const ring = sel.hole == null ? nextPoints : nextHoles?.[sel.hole];
		if (!ring) continue;
		const p = ring[sel.index];
		if (!p) continue;
		const dx = p.x - fixedX;
		const dy = p.y - fixedY;
		const nx = fixedX + dx * sx;
		const ny = fixedY + dy * sy;
		const scaleH = (h) => {
			if (!h) return h ?? null;
			return {
				x: h.x * sx,
				y: h.y * sy
			};
		};
		ring[sel.index] = {
			...p,
			x: nx,
			y: ny,
			in: scaleH(p.in),
			out: scaleH(p.out)
		};
	}
	s.replaceNode(id, {
		...n,
		points: nextPoints,
		holes: nextHoles && nextHoles.length ? nextHoles : void 0
	}, false);
	const pct = Math.round((Math.abs(sx) + Math.abs(sy)) / 2 * 100);
	const lock = shiftKey ? " · aspect" : "";
	let flip = "";
	if (sx < 0 && sy < 0) flip = " · flip XY";
	else if (sx < 0) flip = " · flip X";
	else if (sy < 0) flip = " · flip Y";
	setStudioStatus(`Scaled ${coords.length} points · ${pct}%${lock}${flip}`);
	return true;
}
function nudgeSelectedPathPoints(dx, dy) {
	const s = useDesign.getState();
	const doc = s.doc;
	if (!doc || dx === 0 && dy === 0) return false;
	if (s.selection.length !== 1) return false;
	const id = s.selection[0];
	const n = doc.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) return false;
	const pointsToMove = s.pathPointSelection?.length ? s.pathPointSelection : s.pathEditHit ? [{
		index: s.pathEditHit.index,
		hole: s.pathEditHit.hole
	}] : [];
	if (!pointsToMove.length) return false;
	let ldx = dx;
	let ldy = dy;
	if (n.rotation) {
		const rad = -n.rotation * Math.PI / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);
		ldx = dx * cos - dy * sin;
		ldy = dx * sin + dy * cos;
	}
	s.commit();
	const nextPoints = n.points.map(clonePathPoint);
	const nextHoles = n.holes?.map((ring) => ring.map(clonePathPoint));
	for (const pt of pointsToMove) {
		const ring = pt.hole == null ? nextPoints : nextHoles?.[pt.hole];
		if (!ring || pt.index < 0 || pt.index >= ring.length) continue;
		const p = ring[pt.index];
		ring[pt.index] = {
			...p,
			x: p.x + ldx,
			y: p.y + ldy
		};
	}
	s.replaceNode(id, {
		...n,
		points: nextPoints,
		holes: nextHoles && nextHoles.length ? nextHoles : void 0
	}, false);
	const count = pointsToMove.length;
	setStudioStatus(`Nudged ${count} point${count > 1 ? "s" : ""}`);
	return true;
}
function selectedPointCoords(n, selected) {
	const out = [];
	for (const sel of selected) {
		const p = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
		if (p) out.push({
			sel,
			x: p.x,
			y: p.y
		});
	}
	return out;
}
/** Align multi-selected path points to the selection bounds (local space). */
function alignSelectedPathPoints(edge) {
	const s = useDesign.getState();
	if (s.selection.length !== 1) return false;
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) return false;
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 2) return false;
	const coords = selectedPointCoords(n, selected);
	if (coords.length < 2) return false;
	const xs = coords.map((c) => c.x);
	const ys = coords.map((c) => c.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const midX = (minX + maxX) / 2;
	const midY = (minY + maxY) / 2;
	let targetX = null;
	let targetY = null;
	if (edge === "left") targetX = minX;
	else if (edge === "center") targetX = midX;
	else if (edge === "right") targetX = maxX;
	else if (edge === "top") targetY = minY;
	else if (edge === "middle") targetY = midY;
	else if (edge === "bottom") targetY = maxY;
	s.commit();
	const nextPoints = n.points.map(clonePathPoint);
	const nextHoles = n.holes?.map((ring) => ring.map(clonePathPoint));
	for (const { sel } of coords) {
		const ring = sel.hole == null ? nextPoints : nextHoles?.[sel.hole];
		if (!ring) continue;
		const p = ring[sel.index];
		if (!p) continue;
		const next = { ...p };
		if (targetX != null) next.x = targetX;
		if (targetY != null) next.y = targetY;
		ring[sel.index] = next;
	}
	s.replaceNode(id, {
		...n,
		points: nextPoints,
		holes: nextHoles && nextHoles.length ? nextHoles : void 0
	}, false);
	setStudioStatus(`Aligned ${coords.length} points · ${edge}`);
	return true;
}
/** Compute align positions for live preview (does not commit). */
function previewAlignSelectedPathPoints(edge) {
	const s = useDesign.getState();
	if (s.selection.length !== 1) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 2) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const coords = selectedPointCoords(n, selected);
	if (coords.length < 2) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const xs = coords.map((c) => c.x);
	const ys = coords.map((c) => c.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const midX = (minX + maxX) / 2;
	const midY = (minY + maxY) / 2;
	let targetX = null;
	let targetY = null;
	if (edge === "left") targetX = minX;
	else if (edge === "center") targetX = midX;
	else if (edge === "right") targetX = maxX;
	else if (edge === "top") targetY = minY;
	else if (edge === "middle") targetY = midY;
	else if (edge === "bottom") targetY = maxY;
	const points = coords.map((c) => ({
		index: c.sel.index,
		hole: c.sel.hole,
		fromX: c.x,
		fromY: c.y,
		toX: targetX != null ? targetX : c.x,
		toY: targetY != null ? targetY : c.y
	}));
	s.setPathPointAlignPreview?.({
		nodeId: id,
		edge,
		points
	});
	setStudioStatus(`Preview · Align ${edge} · ${points.length} points`);
	return true;
}
function clearPathPointAlignPreview() {
	useDesign.getState().setPathPointAlignPreview?.(null);
}
/** Distribute multi-selected path points evenly between extremes (local space). Needs 3+. */
function distributeSelectedPathPoints(axis) {
	const s = useDesign.getState();
	if (s.selection.length !== 1) return false;
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) return false;
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 3) return false;
	const coords = selectedPointCoords(n, selected);
	if (coords.length < 3) return false;
	const sorted = coords.slice().sort((a, b) => axis === "h" ? a.x - b.x : a.y - b.y);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	const start = axis === "h" ? first.x : first.y;
	const step = ((axis === "h" ? last.x : last.y) - start) / (sorted.length - 1);
	s.commit();
	const nextPoints = n.points.map(clonePathPoint);
	const nextHoles = n.holes?.map((ring) => ring.map(clonePathPoint));
	sorted.forEach((item, i) => {
		const ring = item.sel.hole == null ? nextPoints : nextHoles?.[item.sel.hole];
		if (!ring) return;
		const p = ring[item.sel.index];
		if (!p) return;
		const next = { ...p };
		if (axis === "h") next.x = start + step * i;
		else next.y = start + step * i;
		ring[item.sel.index] = next;
	});
	s.replaceNode(id, {
		...n,
		points: nextPoints,
		holes: nextHoles && nextHoles.length ? nextHoles : void 0
	}, false);
	setStudioStatus(`Distributed ${coords.length} points · ${axis === "h" ? "horizontal" : "vertical"}`);
	return true;
}
/** Compute distribute positions for live preview (does not commit). */
function previewDistributeSelectedPathPoints(axis) {
	const s = useDesign.getState();
	if (s.selection.length !== 1) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 3) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const coords = selectedPointCoords(n, selected);
	if (coords.length < 3) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const sorted = coords.slice().sort((a, b) => axis === "h" ? a.x - b.x : a.y - b.y);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	const start = axis === "h" ? first.x : first.y;
	const step = ((axis === "h" ? last.x : last.y) - start) / (sorted.length - 1);
	const points = sorted.map((item, i) => ({
		index: item.sel.index,
		hole: item.sel.hole,
		fromX: item.x,
		fromY: item.y,
		toX: axis === "h" ? start + step * i : item.x,
		toY: axis === "v" ? start + step * i : item.y
	}));
	s.setPathPointAlignPreview?.({
		nodeId: id,
		edge: axis === "h" ? "dist-h" : "dist-v",
		points
	});
	setStudioStatus(`Preview · Dist ${axis === "h" ? "H" : "V"} · ${points.length} points`);
	return true;
}
/** Preview distribute with a specific gap, centered on current extremes. */
function previewDistributeWithGap(axis, gap) {
	const s = useDesign.getState();
	if (s.selection.length !== 1) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 3) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const coords = selectedPointCoords(n, selected);
	if (coords.length < 3) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const sorted = coords.slice().sort((a, b) => axis === "h" ? a.x - b.x : a.y - b.y);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	const center = ((axis === "h" ? first.x : first.y) + (axis === "h" ? last.x : last.y)) / 2;
	const count = sorted.length;
	const start = center - Math.max(0, gap) * (count - 1) / 2;
	const points = sorted.map((item, i) => ({
		index: item.sel.index,
		hole: item.sel.hole,
		fromX: item.x,
		fromY: item.y,
		toX: axis === "h" ? start + gap * i : item.x,
		toY: axis === "v" ? start + gap * i : item.y
	}));
	s.setPathPointAlignPreview?.({
		nodeId: id,
		edge: axis === "h" ? "dist-h" : "dist-v",
		points
	});
	setStudioStatus(`Gap ${formatDistributeGap(gap)} · ${axis === "h" ? "H" : "V"}`);
	return true;
}
/** Apply distribute with a specific gap, centered on current extremes. */
function applyDistributeWithGap(axis, gap) {
	const s = useDesign.getState();
	if (s.selection.length !== 1) return false;
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) return false;
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 3) return false;
	const coords = selectedPointCoords(n, selected);
	if (coords.length < 3) return false;
	const sorted = coords.slice().sort((a, b) => axis === "h" ? a.x - b.x : a.y - b.y);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	const center = ((axis === "h" ? first.x : first.y) + (axis === "h" ? last.x : last.y)) / 2;
	const count = sorted.length;
	const start = center - Math.max(0, gap) * (count - 1) / 2;
	s.commit();
	const nextPoints = n.points.map(clonePathPoint);
	const nextHoles = n.holes?.map((ring) => ring.map(clonePathPoint));
	sorted.forEach((item, i) => {
		const ring = item.sel.hole == null ? nextPoints : nextHoles?.[item.sel.hole];
		if (!ring) return;
		const p = ring[item.sel.index];
		if (!p) return;
		const next = { ...p };
		if (axis === "h") next.x = start + gap * i;
		else next.y = start + gap * i;
		ring[item.sel.index] = next;
	});
	s.replaceNode(id, {
		...n,
		points: nextPoints,
		holes: nextHoles && nextHoles.length ? nextHoles : void 0
	}, false);
	setStudioStatus(`Distributed · gap ${formatDistributeGap(gap)} · ${axis === "h" ? "horizontal" : "vertical"}`);
	return true;
}
/** Flip multi-selected path points (and their Bézier handles) around the selection center.
* axis "x" mirrors horizontally (sx=-1), "y" vertically, "xy" both.
* Returns true if applied.
*/
function flipSelectedPathPoints(axis) {
	const s = useDesign.getState();
	if (s.selection.length !== 1) return false;
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) return false;
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 2) return false;
	const coords = selectedPointCoords(n, selected);
	if (coords.length < 2) return false;
	const xs = coords.map((c) => c.x);
	const ys = coords.map((c) => c.y);
	const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
	const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
	const sx = axis === "y" ? 1 : -1;
	const sy = axis === "x" ? 1 : -1;
	const nextPoints = n.points.map(clonePathPoint);
	const nextHoles = n.holes?.map((ring) => ring.map(clonePathPoint));
	for (const { sel } of coords) {
		const ring = sel.hole == null ? nextPoints : nextHoles?.[sel.hole];
		if (!ring) continue;
		const p = ring[sel.index];
		if (!p) continue;
		const dx = p.x - cx;
		const dy = p.y - cy;
		const nx = cx + dx * sx;
		const ny = cy + dy * sy;
		const scaleH = (h) => {
			if (!h) return h ?? null;
			return {
				x: h.x * sx,
				y: h.y * sy
			};
		};
		ring[sel.index] = {
			...p,
			x: nx,
			y: ny,
			in: scaleH(p.in),
			out: scaleH(p.out)
		};
	}
	s.replaceNode(id, {
		...n,
		points: nextPoints,
		holes: nextHoles && nextHoles.length ? nextHoles : void 0
	}, false);
	const label = axis === "xy" ? "XY" : axis.toUpperCase();
	setStudioStatus(`Flipped ${coords.length} points · ${label}`);
	return true;
}
/** Compute flip positions for live preview (does not commit). */
function previewFlipSelectedPathPoints(axis) {
	const s = useDesign.getState();
	if (s.selection.length !== 1) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const id = s.selection[0];
	const n = s.doc?.nodes.find((x) => x.id === id);
	if (!n || !isPath(n)) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const selected = s.pathPointSelection ?? [];
	if (selected.length < 2) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const coords = selectedPointCoords(n, selected);
	if (coords.length < 2) {
		s.setPathPointAlignPreview?.(null);
		return false;
	}
	const xs = coords.map((c) => c.x);
	const ys = coords.map((c) => c.y);
	const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
	const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
	const sx = axis === "y" ? 1 : -1;
	const sy = axis === "x" ? 1 : -1;
	const points = coords.map((item) => ({
		index: item.sel.index,
		hole: item.sel.hole,
		fromX: item.x,
		fromY: item.y,
		toX: cx + (item.x - cx) * sx,
		toY: cy + (item.y - cy) * sy
	}));
	s.setPathPointAlignPreview?.({
		nodeId: id,
		edge: `flip-${axis}`,
		points
	});
	setStudioStatus(`Preview · Flip ${axis === "xy" ? "XY" : axis.toUpperCase()} · ${points.length} points`);
	return true;
}
/** Snapshot the live explode preview so residual can replay it after the cut lands. */
function collectKnifeResidual(doc, ax, ay, bx, by, zoom) {
	if (!doc) return null;
	const dist = Math.hypot(bx - ax, by - ay);
	const preferred = useDesign.getState().selection[0];
	const paths = [];
	for (const n of doc.nodes) {
		if (!n.visible || n.locked) continue;
		const p = asEditablePath(n);
		if (p && p.points.length >= 2) paths.push(p);
	}
	const ordered = preferred ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) : paths;
	const cutMidX = (ax + bx) / 2;
	const cutMidY = (ay + by) / 2;
	const baseExplode = Math.min(22 / zoom, Math.max(0, dist - 8) * .18);
	const allPieces = [];
	for (const n of ordered) {
		const p = asEditablePath(n);
		if (!p) continue;
		const pieces = dist < 4 / zoom ? knifePointSplitPieces(p, bx - n.x, by - n.y, zoom) : knifeSplitPieces(p, ax, ay, bx, by);
		for (const piece of pieces) {
			if (piece.length < 2) continue;
			let sx = 0;
			let sy = 0;
			for (const pt of piece) {
				sx += pt.x;
				sy += pt.y;
			}
			const cnt = piece.length;
			const localCx = sx / cnt;
			const localCy = sy / cnt;
			const worldCx = n.x + localCx;
			const worldCy = n.y + localCy;
			allPieces.push({
				worldCx,
				worldCy,
				piece,
				nodeX: n.x,
				nodeY: n.y,
				angle: Math.atan2(worldCy - cutMidY, worldCx - cutMidX)
			});
		}
	}
	if (!allPieces.length) return null;
	allPieces.sort((a, b) => a.angle - b.angle);
	return {
		pieces: allPieces.map((info, idx) => {
			const stagger = allPieces.length > 1 ? .65 + .55 * (idx / Math.max(1, allPieces.length - 1)) : 1;
			const explode = Math.max(baseExplode * stagger, allPieces.length > 1 ? 10 / zoom : 0);
			let ox = 0;
			let oy = 0;
			if (explode > .5) {
				const dx = info.worldCx - cutMidX;
				const dy = info.worldCy - cutMidY;
				const len = Math.hypot(dx, dy) || 1;
				ox = dx / len * explode;
				oy = dy / len * explode;
			}
			return {
				pts: info.piece.map((pt) => ({
					x: info.nodeX + pt.x + ox,
					y: info.nodeY + pt.y + oy
				})),
				cx: info.worldCx,
				cy: info.worldCy,
				ox,
				oy,
				label: String(idx + 1)
			};
		}),
		midX: cutMidX,
		midY: cutMidY,
		t0: performance.now(),
		duration: 880
	};
}
function drawKnifeResidual(ctx, residual, vp, dpr) {
	const age = performance.now() - residual.t0;
	if (age >= residual.duration) return;
	const t = age / residual.duration;
	const hold = .48;
	let alpha = 1;
	if (t > hold) {
		const fade = Math.min(1, (t - hold) / .52);
		alpha = Math.cos(fade * Math.PI / 2);
	}
	if (alpha < .015) return;
	ctx.save();
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.translate(vp.x, vp.y);
	ctx.scale(vp.zoom, vp.zoom);
	ctx.globalAlpha = alpha;
	ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
	ctx.lineWidth = 1.35 / vp.zoom;
	ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
	for (const piece of residual.pieces) {
		if (piece.pts.length < 2) continue;
		ctx.beginPath();
		ctx.moveTo(piece.pts[0].x, piece.pts[0].y);
		for (let i = 1; i < piece.pts.length; i++) {
			const pt = piece.pts[i];
			ctx.lineTo(pt.x, pt.y);
		}
		ctx.stroke();
	}
	ctx.setLineDash([]);
	if (residual.pieces.length > 1) {
		ctx.font = `${Math.max(10, 12 / vp.zoom)}px ui-sans-serif, system-ui, sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		for (const lab of residual.pieces) {
			const lx = lab.cx + lab.ox;
			const ly = lab.cy + lab.oy;
			if (Math.hypot(lab.ox, lab.oy) > 2 / vp.zoom) {
				ctx.strokeStyle = "rgba(63, 198, 255, 0.4)";
				ctx.lineWidth = .75 / vp.zoom;
				ctx.setLineDash([2 / vp.zoom, 2 / vp.zoom]);
				ctx.beginPath();
				ctx.moveTo(lab.cx, lab.cy);
				ctx.lineTo(lx, ly);
				ctx.stroke();
				ctx.setLineDash([]);
			}
			const pad = 6 / vp.zoom;
			const bw = ctx.measureText(lab.label).width + pad * 2;
			const bh = 16 / vp.zoom;
			ctx.fillStyle = "rgba(6, 23, 15, 0.9)";
			ctx.strokeStyle = "#3fc6ff";
			ctx.lineWidth = 1.25 / vp.zoom;
			ctx.beginPath();
			ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 4 / vp.zoom);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = "#3fc6ff";
			ctx.beginPath();
			ctx.arc(lx, ly, 1.5 / vp.zoom, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillText(lab.label, lx, ly);
		}
	}
	ctx.restore();
}
function hits(n, mq) {
	const b = aabb([n]);
	return b.x < mq.x + mq.w && b.x + b.w > mq.x && b.y < mq.y + mq.h && b.y + b.h > mq.y;
}
function contains(n, mq) {
	const b = aabb([n]);
	return b.x >= mq.x && b.y >= mq.y && b.x + b.w <= mq.x + mq.w && b.y + b.h <= mq.y + mq.h;
}
/** Hitting a group box also selects its unlocked visible children. Locked layers stay out. */
function nodesInMarquee(nodes, mq, mode = "intersect") {
	const test = mode === "contain" ? contains : hits;
	const picked = /* @__PURE__ */ new Set();
	for (const n of nodes) {
		if (!n.visible || n.locked || !test(n, mq)) continue;
		picked.add(n.id);
		if (n.kind === "group") {
			for (const child of descendantsOf(nodes, n.id)) if (child.visible && !child.locked) picked.add(child.id);
		}
	}
	return nodes.filter((n) => picked.has(n.id)).map((n) => n.id);
}
/** Draw equal-spacing ticks along a horizontal or vertical span. */
function drawEqualGapTicks(ctx, axis, boxX, boxY, boxW, boxH, count, zoom) {
	const n = Math.max(3, count);
	ctx.strokeStyle = "rgba(126, 224, 255, 0.9)";
	ctx.lineWidth = 1.4 / zoom;
	if (axis === "h") {
		const y = boxY + boxH / 2;
		const tickH = 5 / zoom;
		for (let i = 0; i < n; i++) {
			const tx = boxX + (n === 1 ? .5 : i / (n - 1)) * boxW;
			ctx.beginPath();
			ctx.moveTo(tx, y - tickH);
			ctx.lineTo(tx, y + tickH);
			ctx.stroke();
		}
	} else {
		const x = boxX + boxW / 2;
		const tickW = 5 / zoom;
		for (let i = 0; i < n; i++) {
			const ty = boxY + (n === 1 ? .5 : i / (n - 1)) * boxH;
			ctx.beginPath();
			ctx.moveTo(x - tickW, ty);
			ctx.lineTo(x + tickW, ty);
			ctx.stroke();
		}
	}
}
/** Draw gap-size badges between equal-spacing ticks when zoom allows readable text. */
function drawGapBadges(ctx, axis, boxX, boxY, boxW, boxH, count, zoom, gapLabel) {
	if (zoom < 1.2 || count < 3) return;
	const n = Math.max(3, count);
	const fontSize = Math.min(11, Math.max(8, 10 / zoom * 1.4));
	ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
	ctx.fillStyle = "rgba(6, 23, 15, 0.85)";
	ctx.strokeStyle = "rgba(126, 224, 255, 0.95)";
	ctx.lineWidth = .8 / zoom;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	const pad = 3 / zoom;
	const tw = ctx.measureText(gapLabel).width + pad * 2;
	const th = fontSize + pad;
	if (axis === "h") {
		const y = boxY + boxH / 2;
		for (let i = 0; i < n - 1; i++) {
			const mx = boxX + (i / (n - 1) + (i + 1) / (n - 1)) / 2 * boxW;
			const bx = mx - tw / 2;
			const by = y - th / 2 - 6 / zoom;
			ctx.fillRect(bx, by, tw, th);
			ctx.strokeRect(bx, by, tw, th);
			ctx.fillStyle = "#7ee0ff";
			ctx.fillText(gapLabel, mx, by + th / 2);
			ctx.fillStyle = "rgba(6, 23, 15, 0.85)";
		}
	} else {
		const x = boxX + boxW / 2;
		for (let i = 0; i < n - 1; i++) {
			const my = boxY + (i / (n - 1) + (i + 1) / (n - 1)) / 2 * boxH;
			const bx = x + 6 / zoom;
			const by = my - th / 2;
			ctx.fillRect(bx, by, tw, th);
			ctx.strokeRect(bx, by, tw, th);
			ctx.fillStyle = "#7ee0ff";
			ctx.fillText(gapLabel, bx + tw / 2, my);
			ctx.fillStyle = "rgba(6, 23, 15, 0.85)";
		}
	}
}
/** Draw a phosphor square handle with three equal-gap dots oriented to axis. */
function drawDistHandle(ctx, x, y, axis, zoom) {
	const ds = 7 / zoom;
	const half = ds / 2;
	const dotR = .9 / zoom;
	const span = 4.2 / zoom;
	ctx.fillStyle = "#3fc6ff";
	ctx.strokeStyle = "#06170f";
	ctx.lineWidth = 1 / zoom;
	ctx.fillRect(x - half, y - half, ds, ds);
	ctx.strokeRect(x - half, y - half, ds, ds);
	ctx.fillStyle = "#06170f";
	if (axis === "h") for (const t of [
		-1,
		0,
		1
	]) {
		ctx.beginPath();
		ctx.arc(x + t * (span / 2), y, dotR, 0, Math.PI * 2);
		ctx.fill();
	}
	else for (const t of [
		-1,
		0,
		1
	]) {
		ctx.beginPath();
		ctx.arc(x, y + t * (span / 2), dotR, 0, Math.PI * 2);
		ctx.fill();
	}
}
/** Spine + ticks connecting distribute target ghost positions. */
function drawDistTargetSpine(ctx, axis, targets, zoom) {
	if (targets.length < 3) return;
	const sorted = targets.slice().sort((a, b) => axis === "h" ? a.x - b.x : a.y - b.y);
	ctx.setLineDash([]);
	ctx.strokeStyle = "rgba(126, 224, 255, 0.85)";
	ctx.lineWidth = 1.2 / zoom;
	ctx.beginPath();
	if (axis === "h") {
		const y = sorted.reduce((s, p) => s + p.y, 0) / sorted.length;
		ctx.moveTo(sorted[0].x, y);
		ctx.lineTo(sorted[sorted.length - 1].x, y);
		ctx.stroke();
		const tickH = 4 / zoom;
		for (const p of sorted) {
			ctx.beginPath();
			ctx.moveTo(p.x, y - tickH);
			ctx.lineTo(p.x, y + tickH);
			ctx.stroke();
		}
	} else {
		const x = sorted.reduce((s, p) => s + p.x, 0) / sorted.length;
		ctx.moveTo(x, sorted[0].y);
		ctx.lineTo(x, sorted[sorted.length - 1].y);
		ctx.stroke();
		const tickW = 4 / zoom;
		for (const p of sorted) {
			ctx.beginPath();
			ctx.moveTo(x - tickW, p.y);
			ctx.lineTo(x + tickW, p.y);
			ctx.stroke();
		}
	}
}
function snapGap(gap, shift) {
	const step = shift ? 5 : 1;
	return Math.max(0, Math.round(gap / step) * step);
}
function snap15(deg, force) {
	if (!force) return deg;
	return Math.round(deg / 15) * 15;
}
function localDelta(n, dx, dy) {
	const r = -degToRad(n.rotation);
	return {
		dx: dx * Math.cos(r) - dy * Math.sin(r),
		dy: dx * Math.sin(r) + dy * Math.cos(r)
	};
}
function CanvasStage() {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	const drag = (0, import_react.useRef)(null);
	const doc = useDesign((s) => s.doc);
	const selection = useDesign((s) => s.selection);
	const tool = useDesign((s) => s.tool);
	const viewport = useDesign((s) => s.viewport);
	const color = useDesign((s) => s.color);
	const viewIntent = useDesign((s) => s.viewIntent);
	const pathEditHit = useDesign((s) => s.pathEditHit);
	const pathPointSelection = useDesign((s) => s.pathPointSelection);
	const pathPointAlignPreview = useDesign((s) => s.pathPointAlignPreview);
	const pathPointNumericPreview = useDesign((s) => s.pathPointNumericPreview);
	const pathPointHandleNumericPreview = useDesign((s) => s.pathPointHandleNumericPreview);
	const showTangentLengths = useDesign((s) => s.showTangentLengths);
	const distributePreview = (0, import_react.useSyncExternalStore)(subscribeDistributePreview, getDistributePreview, getDistributePreview);
	const [marquee, setMarquee] = (0, import_react.useState)(null);
	const [knifeStroke, setKnifeStroke] = (0, import_react.useState)(null);
	const [knifeHover, setKnifeHover] = (0, import_react.useState)(null);
	const [knifeResidual, setKnifeResidual] = (0, import_react.useState)(null);
	const [flushPulse, setFlushPulse] = (0, import_react.useState)(0);
	const [flushPulseLag, setFlushPulseLag] = (0, import_react.useState)(0);
	const [flushPulseRotate, setFlushPulseRotate] = (0, import_react.useState)(0);
	const [flushPulseSlow, setFlushPulseSlow] = (0, import_react.useState)(0);
	const [flushPulseTrail, setFlushPulseTrail] = (0, import_react.useState)(0);
	const [scaleFlip, setScaleFlip] = (0, import_react.useState)(null);
	const [rotateAngle, setRotateAngle] = (0, import_react.useState)(null);
	const [rotateHover, setRotateHover] = (0, import_react.useState)(null);
	const [scaleHover, setScaleHover] = (0, import_react.useState)(null);
	const [distHover, setDistHover] = (0, import_react.useState)(null);
	const [distCursorLabel, setDistCursorLabel] = (0, import_react.useState)(null);
	const [flipHover, setFlipHover] = (0, import_react.useState)(null);
	const [alignHover, setAlignHover] = (0, import_react.useState)(null);
	const [lengthHover, setLengthHover] = (0, import_react.useState)(null);
	const setViewport = useDesign((s) => s.setViewport);
	const select = useDesign((s) => s.select);
	const updateNodes = useDesign((s) => s.updateNodes);
	const addNode = useDesign((s) => s.addNode);
	const setTool = useDesign((s) => s.setTool);
	const commit = useDesign((s) => s.commit);
	const replaceNode = useDesign((s) => s.replaceNode);
	(0, import_react.useEffect)(() => {
		if (!doc || !wrapRef.current) return;
		const el = wrapRef.current;
		const w = el.clientWidth;
		const h = el.clientHeight;
		if (w < 8 || h < 8) return;
		if (viewIntent?.type === "fit" || viewport.x === 0 && viewport.y === 0 && viewport.zoom === .4) {
			const fit = fitViewport(doc.artboard.width, doc.artboard.height, w, h);
			setViewport(fit);
			useDesign.setState({ viewIntent: null });
		} else if (viewIntent?.type === "fit-sel" && selection.length) {
			const nodes = doc.nodes.filter((n) => selection.includes(n.id));
			if (nodes.length) {
				let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
				for (const n of nodes) {
					minX = Math.min(minX, n.x);
					minY = Math.min(minY, n.y);
					maxX = Math.max(maxX, n.x + n.w);
					maxY = Math.max(maxY, n.y + n.h);
				}
				const box = {
					x: minX,
					y: minY,
					w: maxX - minX,
					h: maxY - minY
				};
				const fit = fitViewport(box.w, box.h, w, h, 64);
				setViewport({
					zoom: fit.zoom,
					x: w / 2 - (box.x + box.w / 2) * fit.zoom,
					y: h / 2 - (box.y + box.h / 2) * fit.zoom
				});
			}
			useDesign.setState({ viewIntent: null });
		}
	}, [
		doc?.id,
		viewIntent,
		setViewport,
		selection,
		doc,
		viewport.x,
		viewport.y,
		viewport.zoom
	]);
	(0, import_react.useEffect)(() => {
		if (!knifeResidual) return;
		let raf = 0;
		const tick = () => {
			if (performance.now() - knifeResidual.t0 >= knifeResidual.duration + 16) {
				setKnifeResidual(null);
				return;
			}
			setKnifeResidual({ ...knifeResidual });
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [knifeResidual?.t0]);
	(0, import_react.useEffect)(() => {
		const plan = distributePreview;
		if (!plan || plan.gap > 1.5) {
			setFlushPulse(0);
			setFlushPulseLag(0);
			setFlushPulseRotate(0);
			setFlushPulseSlow(0);
			setFlushPulseTrail(0);
			return;
		}
		let raf = 0;
		const tick = () => {
			const t = performance.now() * .004;
			setFlushPulse(.5 + .5 * Math.sin(t));
			setFlushPulseLag(.5 + .5 * Math.sin(t - 1.15));
			setFlushPulseRotate(performance.now() * 55e-5 % (Math.PI * 2));
			const tSlow = performance.now() * .0016;
			setFlushPulseSlow(.5 + .5 * Math.sin(tSlow));
			setFlushPulseTrail(.5 + .5 * Math.sin(t - 2.35));
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [distributePreview]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap || !doc) return;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const w = wrap.clientWidth;
		const h = wrap.clientHeight;
		if (w < 8 || h < 8) return;
		canvas.width = Math.floor(w * dpr);
		canvas.height = Math.floor(h * dpr);
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawDocument(ctx, doc, {
			viewport,
			dpr
		});
		drawSelection(ctx, doc.nodes, selection, viewport, dpr, pathEditHit, pathPointSelection, scaleFlip, showTangentLengths, rotateAngle, alignHover);
		const distPlan = getDistributePreview();
		if (distPlan) {
			ctx.save();
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.translate(viewport.x, viewport.y);
			ctx.scale(viewport.zoom, viewport.zoom);
			drawDistributePreview(ctx, distPlan, viewport.zoom, flushPulse, flushPulseLag, flushPulseRotate, flushPulseSlow, flushPulseTrail);
			ctx.restore();
		}
		if (pathPointAlignPreview) drawPathPointAlignPreview(ctx, pathPointAlignPreview, doc, viewport, dpr);
		if (pathPointNumericPreview) drawPathPointNumericPreview(ctx, pathPointNumericPreview, doc, viewport, dpr);
		if (pathPointHandleNumericPreview) drawPathPointHandleNumericPreview(ctx, pathPointHandleNumericPreview, doc, viewport, dpr);
		if (marquee) drawMarquee(ctx, marquee, viewport, dpr);
		if (lengthHover && showTangentLengths) {
			const { lx, ly, length } = lengthHover;
			const zoom = viewport.zoom;
			const label = String(length);
			ctx.save();
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.translate(viewport.x, viewport.y);
			ctx.scale(zoom, zoom);
			ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			const pad = 5 / zoom;
			const bw = ctx.measureText(label).width + pad * 2;
			const bh = 14 / zoom;
			ctx.fillStyle = "rgba(6, 23, 15, 0.72)";
			ctx.strokeStyle = "rgba(63, 198, 255, 0.75)";
			ctx.lineWidth = 1 / zoom;
			ctx.beginPath();
			ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 3 / zoom);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = "rgba(63, 198, 255, 0.9)";
			ctx.fillText(label, lx, ly);
			ctx.restore();
		}
		if (rotateHover) {
			const { cx, cy, radius } = rotateHover;
			const zoom = viewport.zoom;
			ctx.save();
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.translate(viewport.x, viewport.y);
			ctx.scale(zoom, zoom);
			ctx.beginPath();
			const start = -Math.PI * .85;
			const end = Math.PI * .65;
			ctx.arc(cx, cy, radius, start, end);
			ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
			ctx.lineWidth = 2.2 / zoom;
			ctx.lineCap = "round";
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, radius * .92, start, end);
			ctx.closePath();
			ctx.fillStyle = "rgba(63, 198, 255, 0.08)";
			ctx.fill();
			const arrowLen = 10 / zoom;
			const arrowAng = .45;
			for (const ang of [start, end]) {
				const ax = cx + Math.cos(ang) * radius;
				const ay = cy + Math.sin(ang) * radius;
				const dir = ang === start ? -1 : 1;
				ctx.beginPath();
				ctx.moveTo(ax, ay);
				ctx.lineTo(ax - Math.cos(ang - dir * arrowAng) * arrowLen, ay - Math.sin(ang - dir * arrowAng) * arrowLen);
				ctx.moveTo(ax, ay);
				ctx.lineTo(ax - Math.cos(ang + dir * arrowAng) * arrowLen, ay - Math.sin(ang + dir * arrowAng) * arrowLen);
				ctx.strokeStyle = "rgba(126, 224, 255, 0.8)";
				ctx.lineWidth = 1.6 / zoom;
				ctx.stroke();
			}
			ctx.restore();
		}
		if (scaleHover && selection.length === 1 && pathPointSelection.length > 1) {
			const n = doc.nodes.find((x) => x.id === selection[0]);
			if (n && isPath(n)) {
				const coords = [];
				for (const sel of pathPointSelection) {
					const pt = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
					if (pt) coords.push({
						x: pt.x,
						y: pt.y
					});
				}
				if (coords.length > 1) {
					const xs = coords.map((c) => c.x);
					const ys = coords.map((c) => c.y);
					const minX = Math.min(...xs);
					const maxX = Math.max(...xs);
					const minY = Math.min(...ys);
					const maxY = Math.max(...ys);
					const pad = 6 / viewport.zoom;
					const boxX = n.x + minX - pad;
					const boxY = n.y + minY - pad;
					const boxW = maxX - minX + pad * 2;
					const boxH = maxY - minY + pad * 2;
					const zoom = viewport.zoom;
					ctx.save();
					ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
					ctx.translate(viewport.x, viewport.y);
					ctx.scale(zoom, zoom);
					const nc = nodeCenter(n);
					if (n.rotation) {
						ctx.translate(nc.x, nc.y);
						ctx.rotate(degToRad(n.rotation));
						ctx.translate(-nc.x, -nc.y);
					}
					ctx.beginPath();
					ctx.rect(boxX, boxY, boxW, boxH);
					ctx.fillStyle = "rgba(63, 198, 255, 0.06)";
					ctx.fill();
					ctx.strokeStyle = "rgba(63, 198, 255, 0.45)";
					ctx.lineWidth = 1.8 / zoom;
					ctx.setLineDash([6 / zoom, 4 / zoom]);
					ctx.stroke();
					ctx.setLineDash([]);
					const hp = handlePoint({
						x: boxX,
						y: boxY,
						w: boxW,
						h: boxH
					}, scaleHover);
					const mark = 11 / zoom;
					ctx.beginPath();
					ctx.arc(hp.x, hp.y, mark / 2, 0, Math.PI * 2);
					ctx.fillStyle = "rgba(63, 198, 255, 0.25)";
					ctx.fill();
					ctx.strokeStyle = "rgba(126, 224, 255, 0.85)";
					ctx.lineWidth = 1.6 / zoom;
					ctx.stroke();
					const tick = 5 / zoom;
					ctx.beginPath();
					ctx.moveTo(hp.x - tick, hp.y);
					ctx.lineTo(hp.x + tick, hp.y);
					ctx.moveTo(hp.x, hp.y - tick);
					ctx.lineTo(hp.x, hp.y + tick);
					ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
					ctx.lineWidth = 1.2 / zoom;
					ctx.stroke();
					ctx.restore();
				}
			}
		}
		if ((distHover || flipHover || alignHover) && selection.length === 1 && pathPointSelection.length > 1) {
			const n = doc.nodes.find((x) => x.id === selection[0]);
			if (n && isPath(n)) {
				const coords = [];
				for (const sel of pathPointSelection) {
					const pt = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
					if (pt) coords.push({
						x: pt.x,
						y: pt.y
					});
				}
				if (coords.length > 1) {
					const xs = coords.map((c) => c.x);
					const ys = coords.map((c) => c.y);
					const minX = Math.min(...xs);
					const maxX = Math.max(...xs);
					const minY = Math.min(...ys);
					const maxY = Math.max(...ys);
					const pad = 6 / viewport.zoom;
					const boxX = n.x + minX - pad;
					const boxY = n.y + minY - pad;
					const boxW = maxX - minX + pad * 2;
					const boxH = maxY - minY + pad * 2;
					const zoom = viewport.zoom;
					ctx.save();
					ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
					ctx.translate(viewport.x, viewport.y);
					ctx.scale(zoom, zoom);
					const nc = nodeCenter(n);
					if (n.rotation) {
						ctx.translate(nc.x, nc.y);
						ctx.rotate(degToRad(n.rotation));
						ctx.translate(-nc.x, -nc.y);
					}
					const cx = boxX + boxW / 2;
					const cy = boxY + boxH / 2;
					ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
					ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
					ctx.lineWidth = 1.6 / zoom;
					ctx.setLineDash([5 / zoom, 4 / zoom]);
					if (distHover === "h") {
						const y = cy;
						ctx.beginPath();
						ctx.moveTo(boxX - 8 / zoom, y);
						ctx.lineTo(boxX + boxW + 8 / zoom, y);
						ctx.stroke();
						const al = 7 / zoom;
						ctx.setLineDash([]);
						ctx.beginPath();
						ctx.moveTo(boxX - 8 / zoom, y);
						ctx.lineTo(boxX - 8 / zoom + al, y - 2.5 / zoom);
						ctx.lineTo(boxX - 8 / zoom + al, y + 2.5 / zoom);
						ctx.closePath();
						ctx.fill();
						ctx.beginPath();
						ctx.moveTo(boxX + boxW + 8 / zoom, y);
						ctx.lineTo(boxX + boxW + 8 / zoom - al, y - 2.5 / zoom);
						ctx.lineTo(boxX + boxW + 8 / zoom - al, y + 2.5 / zoom);
						ctx.closePath();
						ctx.fill();
						if (coords.length >= 3) {
							const sortedX = coords.map((c) => c.x).sort((a, b) => a - b);
							const start = n.x + sortedX[0];
							const end = n.x + sortedX[sortedX.length - 1];
							const gap = (end - start) / (sortedX.length - 1);
							drawEqualGapTicks(ctx, "h", start, y - 1, end - start, 2, coords.length, zoom);
							if (gap > .5) drawGapBadges(ctx, "h", start, y - 1, end - start, 2, coords.length, zoom, formatDistributeGap(gap));
						}
					} else if (distHover === "v") {
						const x = cx;
						ctx.beginPath();
						ctx.moveTo(x, boxY - 8 / zoom);
						ctx.lineTo(x, boxY + boxH + 8 / zoom);
						ctx.stroke();
						ctx.setLineDash([]);
						const al = 7 / zoom;
						ctx.beginPath();
						ctx.moveTo(x, boxY - 8 / zoom);
						ctx.lineTo(x - 2.5 / zoom, boxY - 8 / zoom + al);
						ctx.lineTo(x + 2.5 / zoom, boxY - 8 / zoom + al);
						ctx.closePath();
						ctx.fill();
						ctx.beginPath();
						ctx.moveTo(x, boxY + boxH + 8 / zoom);
						ctx.lineTo(x - 2.5 / zoom, boxY + boxH + 8 / zoom - al);
						ctx.lineTo(x + 2.5 / zoom, boxY + boxH + 8 / zoom - al);
						ctx.closePath();
						ctx.fill();
						if (coords.length >= 3) {
							const sortedY = coords.map((c) => c.y).sort((a, b) => a - b);
							const start = n.y + sortedY[0];
							const end = n.y + sortedY[sortedY.length - 1];
							const gap = (end - start) / (sortedY.length - 1);
							drawEqualGapTicks(ctx, "v", x - 1, start, 2, end - start, coords.length, zoom);
							if (gap > .5) drawGapBadges(ctx, "v", x - 1, start, 2, end - start, coords.length, zoom, formatDistributeGap(gap));
						}
					}
					if (flipHover === "x" || flipHover === "xy") {
						ctx.beginPath();
						ctx.moveTo(cx, boxY - 10 / zoom);
						ctx.lineTo(cx, boxY + boxH + 10 / zoom);
						ctx.stroke();
					}
					if (flipHover === "y" || flipHover === "xy") {
						ctx.beginPath();
						ctx.moveTo(boxX - 10 / zoom, cy);
						ctx.lineTo(boxX + boxW + 10 / zoom, cy);
						ctx.stroke();
					}
					if (flipHover === "xy") {
						ctx.setLineDash([]);
						const xl = 6 / zoom;
						ctx.beginPath();
						ctx.moveTo(cx - xl, cy - xl);
						ctx.lineTo(cx + xl, cy + xl);
						ctx.moveTo(cx + xl, cy - xl);
						ctx.lineTo(cx - xl, cy + xl);
						ctx.stroke();
					}
					if (alignHover) {
						ctx.setLineDash([5 / zoom, 4 / zoom]);
						6 / zoom;
						const al = 7 / zoom;
						if (alignHover === "left") {
							const x = boxX;
							ctx.beginPath();
							ctx.moveTo(x, boxY - 10 / zoom);
							ctx.lineTo(x, boxY + boxH + 10 / zoom);
							ctx.stroke();
							ctx.setLineDash([]);
							ctx.beginPath();
							ctx.moveTo(x, cy);
							ctx.lineTo(x + al, cy - 2.5 / zoom);
							ctx.lineTo(x + al, cy + 2.5 / zoom);
							ctx.closePath();
							ctx.fill();
						} else if (alignHover === "right") {
							const x = boxX + boxW;
							ctx.beginPath();
							ctx.moveTo(x, boxY - 10 / zoom);
							ctx.lineTo(x, boxY + boxH + 10 / zoom);
							ctx.stroke();
							ctx.setLineDash([]);
							ctx.beginPath();
							ctx.moveTo(x, cy);
							ctx.lineTo(x - al, cy - 2.5 / zoom);
							ctx.lineTo(x - al, cy + 2.5 / zoom);
							ctx.closePath();
							ctx.fill();
						} else if (alignHover === "center") {
							const x = boxX + boxW / 2;
							ctx.beginPath();
							ctx.moveTo(x, boxY - 10 / zoom);
							ctx.lineTo(x, boxY + boxH + 10 / zoom);
							ctx.stroke();
							ctx.setLineDash([]);
							ctx.beginPath();
							ctx.moveTo(x - al, cy);
							ctx.lineTo(x, cy - 2.5 / zoom);
							ctx.lineTo(x, cy + 2.5 / zoom);
							ctx.closePath();
							ctx.fill();
							ctx.beginPath();
							ctx.moveTo(x + al, cy);
							ctx.lineTo(x, cy - 2.5 / zoom);
							ctx.lineTo(x, cy + 2.5 / zoom);
							ctx.closePath();
							ctx.fill();
						} else if (alignHover === "top") {
							const y = boxY;
							ctx.beginPath();
							ctx.moveTo(boxX - 10 / zoom, y);
							ctx.lineTo(boxX + boxW + 10 / zoom, y);
							ctx.stroke();
							ctx.setLineDash([]);
							ctx.beginPath();
							ctx.moveTo(cx, y);
							ctx.lineTo(cx - 2.5 / zoom, y + al);
							ctx.lineTo(cx + 2.5 / zoom, y + al);
							ctx.closePath();
							ctx.fill();
						} else if (alignHover === "bottom") {
							const y = boxY + boxH;
							ctx.beginPath();
							ctx.moveTo(boxX - 10 / zoom, y);
							ctx.lineTo(boxX + boxW + 10 / zoom, y);
							ctx.stroke();
							ctx.setLineDash([]);
							ctx.beginPath();
							ctx.moveTo(cx, y);
							ctx.lineTo(cx - 2.5 / zoom, y - al);
							ctx.lineTo(cx + 2.5 / zoom, y - al);
							ctx.closePath();
							ctx.fill();
						} else if (alignHover === "middle") {
							const y = boxY + boxH / 2;
							ctx.beginPath();
							ctx.moveTo(boxX - 10 / zoom, y);
							ctx.lineTo(boxX + boxW + 10 / zoom, y);
							ctx.stroke();
							ctx.setLineDash([]);
							ctx.beginPath();
							ctx.moveTo(cx, y - al);
							ctx.lineTo(cx - 2.5 / zoom, y);
							ctx.lineTo(cx + 2.5 / zoom, y);
							ctx.closePath();
							ctx.fill();
							ctx.beginPath();
							ctx.moveTo(cx, y + al);
							ctx.lineTo(cx - 2.5 / zoom, y);
							ctx.lineTo(cx + 2.5 / zoom, y);
							ctx.closePath();
							ctx.fill();
						}
					}
					ctx.setLineDash([]);
					ctx.restore();
				}
			}
		}
		if (knifeStroke) drawKnifeStroke(ctx, knifeStroke, doc, viewport, dpr);
		else if (knifeHover) drawKnifeHover(ctx, knifeHover, doc, viewport, dpr);
		if (knifeResidual) drawKnifeResidual(ctx, knifeResidual, viewport, dpr);
		if (distCursorLabel) {
			ctx.save();
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.translate(viewport.x, viewport.y);
			ctx.scale(viewport.zoom, viewport.zoom);
			const z = Math.max(viewport.zoom, .01);
			const flush = distCursorLabel.gap <= 1.5;
			const ox = (flush ? 22 : 14) / z;
			const oy = (flush ? 28 : 18) / z;
			const lx = distCursorLabel.x + ox;
			const ly = distCursorLabel.y - oy;
			const text = flush ? `flush · ${formatDistributeGap(distCursorLabel.gap)} px` : `${formatDistributeGap(distCursorLabel.gap)} px`;
			ctx.font = `${11 / z}px "IBM Plex Mono", ui-monospace, monospace`;
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			const metrics = ctx.measureText(text);
			const padX = 5 / z;
			3 / z;
			const bw = metrics.width + padX * 2;
			const bh = 14 / z;
			ctx.fillStyle = "rgba(6, 23, 15, 0.78)";
			ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
			ctx.lineWidth = 1 / z;
			ctx.beginPath();
			ctx.roundRect(lx - padX, ly - bh / 2, bw, bh, 3 / z);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = "rgba(63, 198, 255, 0.95)";
			ctx.fillText(text, lx, ly);
			ctx.restore();
		}
	}, [
		doc,
		selection,
		viewport,
		pathEditHit,
		pathPointSelection,
		marquee,
		knifeStroke,
		knifeHover,
		knifeResidual,
		scaleFlip,
		pathPointAlignPreview,
		pathPointNumericPreview,
		pathPointHandleNumericPreview,
		showTangentLengths,
		rotateAngle,
		lengthHover,
		rotateHover,
		scaleHover,
		distHover,
		flipHover,
		alignHover,
		distributePreview,
		distCursorLabel,
		flushPulse,
		flushPulseLag,
		flushPulseRotate,
		flushPulseSlow,
		flushPulseTrail
	]);
	(0, import_react.useEffect)(() => {
		const wrap = wrapRef.current;
		if (!wrap) return;
		const ro = new ResizeObserver(() => {
			const canvas = canvasRef.current;
			if (!canvas || !doc) return;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const w = wrap.clientWidth;
			const h = wrap.clientHeight;
			if (w < 8 || h < 8) return;
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			drawDocument(ctx, doc, {
				viewport,
				dpr
			});
			drawSelection(ctx, doc.nodes, selection, viewport, dpr, pathEditHit, pathPointSelection, scaleFlip, showTangentLengths, rotateAngle, alignHover);
			const distPlan = getDistributePreview();
			if (distPlan) {
				ctx.save();
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				ctx.translate(viewport.x, viewport.y);
				ctx.scale(viewport.zoom, viewport.zoom);
				drawDistributePreview(ctx, distPlan, viewport.zoom, flushPulse, flushPulseLag, flushPulseRotate, flushPulseSlow, flushPulseTrail);
				ctx.restore();
			}
			if (pathPointAlignPreview) drawPathPointAlignPreview(ctx, pathPointAlignPreview, doc, viewport, dpr);
			if (pathPointNumericPreview) drawPathPointNumericPreview(ctx, pathPointNumericPreview, doc, viewport, dpr);
			if (pathPointHandleNumericPreview) drawPathPointHandleNumericPreview(ctx, pathPointHandleNumericPreview, doc, viewport, dpr);
			if (marquee) drawMarquee(ctx, marquee, viewport, dpr);
			if (lengthHover && showTangentLengths) {
				const { lx, ly, length } = lengthHover;
				const zoom = viewport.zoom;
				const label = String(length);
				ctx.save();
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				ctx.translate(viewport.x, viewport.y);
				ctx.scale(zoom, zoom);
				ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				const pad = 5 / zoom;
				const bw = ctx.measureText(label).width + pad * 2;
				const bh = 14 / zoom;
				ctx.fillStyle = "rgba(6, 23, 15, 0.72)";
				ctx.strokeStyle = "rgba(63, 198, 255, 0.75)";
				ctx.lineWidth = 1 / zoom;
				ctx.beginPath();
				ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 3 / zoom);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = "rgba(63, 198, 255, 0.9)";
				ctx.fillText(label, lx, ly);
				ctx.restore();
			}
			if (rotateHover) {
				const { cx, cy, radius } = rotateHover;
				const zoom = viewport.zoom;
				ctx.save();
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				ctx.translate(viewport.x, viewport.y);
				ctx.scale(zoom, zoom);
				ctx.beginPath();
				const start = -Math.PI * .85;
				const end = Math.PI * .65;
				ctx.arc(cx, cy, radius, start, end);
				ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
				ctx.lineWidth = 2.2 / zoom;
				ctx.lineCap = "round";
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(cx, cy);
				ctx.arc(cx, cy, radius * .92, start, end);
				ctx.closePath();
				ctx.fillStyle = "rgba(63, 198, 255, 0.08)";
				ctx.fill();
				const arrowLen = 10 / zoom;
				const arrowAng = .45;
				for (const ang of [start, end]) {
					const ax = cx + Math.cos(ang) * radius;
					const ay = cy + Math.sin(ang) * radius;
					const dir = ang === start ? -1 : 1;
					ctx.beginPath();
					ctx.moveTo(ax, ay);
					ctx.lineTo(ax - Math.cos(ang - dir * arrowAng) * arrowLen, ay - Math.sin(ang - dir * arrowAng) * arrowLen);
					ctx.moveTo(ax, ay);
					ctx.lineTo(ax - Math.cos(ang + dir * arrowAng) * arrowLen, ay - Math.sin(ang + dir * arrowAng) * arrowLen);
					ctx.strokeStyle = "rgba(126, 224, 255, 0.8)";
					ctx.lineWidth = 1.6 / zoom;
					ctx.stroke();
				}
				ctx.restore();
			}
			if (scaleHover && selection.length === 1 && pathPointSelection.length > 1) {
				const n = doc.nodes.find((x) => x.id === selection[0]);
				if (n && isPath(n)) {
					const coords = [];
					for (const sel of pathPointSelection) {
						const pt = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
						if (pt) coords.push({
							x: pt.x,
							y: pt.y
						});
					}
					if (coords.length > 1) {
						const xs = coords.map((c) => c.x);
						const ys = coords.map((c) => c.y);
						const minX = Math.min(...xs);
						const maxX = Math.max(...xs);
						const minY = Math.min(...ys);
						const maxY = Math.max(...ys);
						const pad = 6 / viewport.zoom;
						const boxX = n.x + minX - pad;
						const boxY = n.y + minY - pad;
						const boxW = maxX - minX + pad * 2;
						const boxH = maxY - minY + pad * 2;
						const zoom = viewport.zoom;
						ctx.save();
						ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
						ctx.translate(viewport.x, viewport.y);
						ctx.scale(zoom, zoom);
						const nc = nodeCenter(n);
						if (n.rotation) {
							ctx.translate(nc.x, nc.y);
							ctx.rotate(degToRad(n.rotation));
							ctx.translate(-nc.x, -nc.y);
						}
						ctx.beginPath();
						ctx.rect(boxX, boxY, boxW, boxH);
						ctx.fillStyle = "rgba(63, 198, 255, 0.06)";
						ctx.fill();
						ctx.strokeStyle = "rgba(63, 198, 255, 0.45)";
						ctx.lineWidth = 1.8 / zoom;
						ctx.setLineDash([6 / zoom, 4 / zoom]);
						ctx.stroke();
						ctx.setLineDash([]);
						const hp = handlePoint({
							x: boxX,
							y: boxY,
							w: boxW,
							h: boxH
						}, scaleHover);
						const mark = 11 / zoom;
						ctx.beginPath();
						ctx.arc(hp.x, hp.y, mark / 2, 0, Math.PI * 2);
						ctx.fillStyle = "rgba(63, 198, 255, 0.25)";
						ctx.fill();
						ctx.strokeStyle = "rgba(126, 224, 255, 0.85)";
						ctx.lineWidth = 1.6 / zoom;
						ctx.stroke();
						const tick = 5 / zoom;
						ctx.beginPath();
						ctx.moveTo(hp.x - tick, hp.y);
						ctx.lineTo(hp.x + tick, hp.y);
						ctx.moveTo(hp.x, hp.y - tick);
						ctx.lineTo(hp.x, hp.y + tick);
						ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
						ctx.lineWidth = 1.2 / zoom;
						ctx.stroke();
						ctx.restore();
					}
				}
			}
			if ((distHover || flipHover || alignHover) && selection.length === 1 && pathPointSelection.length > 1) {
				const n = doc.nodes.find((x) => x.id === selection[0]);
				if (n && isPath(n)) {
					const coords = [];
					for (const sel of pathPointSelection) {
						const pt = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
						if (pt) coords.push({
							x: pt.x,
							y: pt.y
						});
					}
					if (coords.length > 1) {
						const xs = coords.map((c) => c.x);
						const ys = coords.map((c) => c.y);
						const minX = Math.min(...xs);
						const maxX = Math.max(...xs);
						const minY = Math.min(...ys);
						const maxY = Math.max(...ys);
						const pad = 6 / viewport.zoom;
						const boxX = n.x + minX - pad;
						const boxY = n.y + minY - pad;
						const boxW = maxX - minX + pad * 2;
						const boxH = maxY - minY + pad * 2;
						const zoom = viewport.zoom;
						ctx.save();
						ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
						ctx.translate(viewport.x, viewport.y);
						ctx.scale(zoom, zoom);
						const nc = nodeCenter(n);
						if (n.rotation) {
							ctx.translate(nc.x, nc.y);
							ctx.rotate(degToRad(n.rotation));
							ctx.translate(-nc.x, -nc.y);
						}
						const cx = boxX + boxW / 2;
						const cy = boxY + boxH / 2;
						ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
						ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
						ctx.lineWidth = 1.6 / zoom;
						ctx.setLineDash([5 / zoom, 4 / zoom]);
						if (distHover === "h") {
							const y = cy;
							ctx.beginPath();
							ctx.moveTo(boxX - 8 / zoom, y);
							ctx.lineTo(boxX + boxW + 8 / zoom, y);
							ctx.stroke();
							const al = 7 / zoom;
							ctx.setLineDash([]);
							ctx.beginPath();
							ctx.moveTo(boxX - 8 / zoom, y);
							ctx.lineTo(boxX - 8 / zoom + al, y - 2.5 / zoom);
							ctx.lineTo(boxX - 8 / zoom + al, y + 2.5 / zoom);
							ctx.closePath();
							ctx.fill();
							ctx.beginPath();
							ctx.moveTo(boxX + boxW + 8 / zoom, y);
							ctx.lineTo(boxX + boxW + 8 / zoom - al, y - 2.5 / zoom);
							ctx.lineTo(boxX + boxW + 8 / zoom - al, y + 2.5 / zoom);
							ctx.closePath();
							ctx.fill();
							if (coords.length >= 3) {
								const sortedX = coords.map((c) => c.x).sort((a, b) => a - b);
								const start = n.x + sortedX[0];
								const end = n.x + sortedX[sortedX.length - 1];
								const gap = (end - start) / (sortedX.length - 1);
								drawEqualGapTicks(ctx, "h", start, y - 1, end - start, 2, coords.length, zoom);
								if (gap > .5) drawGapBadges(ctx, "h", start, y - 1, end - start, 2, coords.length, zoom, formatDistributeGap(gap));
							}
						} else if (distHover === "v") {
							const x = cx;
							ctx.beginPath();
							ctx.moveTo(x, boxY - 8 / zoom);
							ctx.lineTo(x, boxY + boxH + 8 / zoom);
							ctx.stroke();
							ctx.setLineDash([]);
							const al = 7 / zoom;
							ctx.beginPath();
							ctx.moveTo(x, boxY - 8 / zoom);
							ctx.lineTo(x - 2.5 / zoom, boxY - 8 / zoom + al);
							ctx.lineTo(x + 2.5 / zoom, boxY - 8 / zoom + al);
							ctx.closePath();
							ctx.fill();
							ctx.beginPath();
							ctx.moveTo(x, boxY + boxH + 8 / zoom);
							ctx.lineTo(x - 2.5 / zoom, boxY + boxH + 8 / zoom - al);
							ctx.lineTo(x + 2.5 / zoom, boxY + boxH + 8 / zoom - al);
							ctx.closePath();
							ctx.fill();
							if (coords.length >= 3) {
								const sortedY = coords.map((c) => c.y).sort((a, b) => a - b);
								const start = n.y + sortedY[0];
								const end = n.y + sortedY[sortedY.length - 1];
								const gap = (end - start) / (sortedY.length - 1);
								drawEqualGapTicks(ctx, "v", x - 1, start, 2, end - start, coords.length, zoom);
								if (gap > .5) drawGapBadges(ctx, "v", x - 1, start, 2, end - start, coords.length, zoom, formatDistributeGap(gap));
							}
						}
						if (flipHover === "x" || flipHover === "xy") {
							ctx.beginPath();
							ctx.moveTo(cx, boxY - 10 / zoom);
							ctx.lineTo(cx, boxY + boxH + 10 / zoom);
							ctx.stroke();
						}
						if (flipHover === "y" || flipHover === "xy") {
							ctx.beginPath();
							ctx.moveTo(boxX - 10 / zoom, cy);
							ctx.lineTo(boxX + boxW + 10 / zoom, cy);
							ctx.stroke();
						}
						if (flipHover === "xy") {
							ctx.setLineDash([]);
							const xl = 6 / zoom;
							ctx.beginPath();
							ctx.moveTo(cx - xl, cy - xl);
							ctx.lineTo(cx + xl, cy + xl);
							ctx.moveTo(cx + xl, cy - xl);
							ctx.lineTo(cx - xl, cy + xl);
							ctx.stroke();
						}
						if (alignHover) {
							ctx.setLineDash([5 / zoom, 4 / zoom]);
							6 / zoom;
							const al = 7 / zoom;
							if (alignHover === "left") {
								const x = boxX;
								ctx.beginPath();
								ctx.moveTo(x, boxY - 10 / zoom);
								ctx.lineTo(x, boxY + boxH + 10 / zoom);
								ctx.stroke();
								ctx.setLineDash([]);
								ctx.beginPath();
								ctx.moveTo(x, cy);
								ctx.lineTo(x + al, cy - 2.5 / zoom);
								ctx.lineTo(x + al, cy + 2.5 / zoom);
								ctx.closePath();
								ctx.fill();
							} else if (alignHover === "right") {
								const x = boxX + boxW;
								ctx.beginPath();
								ctx.moveTo(x, boxY - 10 / zoom);
								ctx.lineTo(x, boxY + boxH + 10 / zoom);
								ctx.stroke();
								ctx.setLineDash([]);
								ctx.beginPath();
								ctx.moveTo(x, cy);
								ctx.lineTo(x - al, cy - 2.5 / zoom);
								ctx.lineTo(x - al, cy + 2.5 / zoom);
								ctx.closePath();
								ctx.fill();
							} else if (alignHover === "center") {
								const x = boxX + boxW / 2;
								ctx.beginPath();
								ctx.moveTo(x, boxY - 10 / zoom);
								ctx.lineTo(x, boxY + boxH + 10 / zoom);
								ctx.stroke();
								ctx.setLineDash([]);
								ctx.beginPath();
								ctx.moveTo(x - al, cy);
								ctx.lineTo(x, cy - 2.5 / zoom);
								ctx.lineTo(x, cy + 2.5 / zoom);
								ctx.closePath();
								ctx.fill();
								ctx.beginPath();
								ctx.moveTo(x + al, cy);
								ctx.lineTo(x, cy - 2.5 / zoom);
								ctx.lineTo(x, cy + 2.5 / zoom);
								ctx.closePath();
								ctx.fill();
							} else if (alignHover === "top") {
								const y = boxY;
								ctx.beginPath();
								ctx.moveTo(boxX - 10 / zoom, y);
								ctx.lineTo(boxX + boxW + 10 / zoom, y);
								ctx.stroke();
								ctx.setLineDash([]);
								ctx.beginPath();
								ctx.moveTo(cx, y);
								ctx.lineTo(cx - 2.5 / zoom, y + al);
								ctx.lineTo(cx + 2.5 / zoom, y + al);
								ctx.closePath();
								ctx.fill();
							} else if (alignHover === "bottom") {
								const y = boxY + boxH;
								ctx.beginPath();
								ctx.moveTo(boxX - 10 / zoom, y);
								ctx.lineTo(boxX + boxW + 10 / zoom, y);
								ctx.stroke();
								ctx.setLineDash([]);
								ctx.beginPath();
								ctx.moveTo(cx, y);
								ctx.lineTo(cx - 2.5 / zoom, y - al);
								ctx.lineTo(cx + 2.5 / zoom, y - al);
								ctx.closePath();
								ctx.fill();
							} else if (alignHover === "middle") {
								const y = boxY + boxH / 2;
								ctx.beginPath();
								ctx.moveTo(boxX - 10 / zoom, y);
								ctx.lineTo(boxX + boxW + 10 / zoom, y);
								ctx.stroke();
								ctx.setLineDash([]);
								ctx.beginPath();
								ctx.moveTo(cx, y - al);
								ctx.lineTo(cx - 2.5 / zoom, y);
								ctx.lineTo(cx + 2.5 / zoom, y);
								ctx.closePath();
								ctx.fill();
								ctx.beginPath();
								ctx.moveTo(cx, y + al);
								ctx.lineTo(cx - 2.5 / zoom, y);
								ctx.lineTo(cx + 2.5 / zoom, y);
								ctx.closePath();
								ctx.fill();
							}
						}
						ctx.setLineDash([]);
						ctx.restore();
					}
				}
			}
			if (knifeStroke) drawKnifeStroke(ctx, knifeStroke, doc, viewport, dpr);
		});
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [
		doc,
		selection,
		viewport,
		pathEditHit,
		pathPointSelection,
		marquee,
		knifeStroke,
		scaleFlip,
		pathPointAlignPreview,
		pathPointNumericPreview,
		pathPointHandleNumericPreview,
		showTangentLengths,
		rotateAngle,
		lengthHover,
		rotateHover,
		scaleHover,
		distHover,
		flipHover,
		alignHover,
		distributePreview,
		flushPulse,
		flushPulseLag,
		flushPulseRotate,
		flushPulseSlow,
		flushPulseTrail
	]);
	function onPointerDown(e) {
		if (!doc || e.button > 1) return;
		e.target.setPointerCapture?.(e.pointerId);
		const rect = canvasRef.current.getBoundingClientRect();
		const sx = e.clientX - rect.left;
		const sy = e.clientY - rect.top;
		const docPt = screenToDoc(sx, sy, viewport);
		if (tool === "hand" || e.button === 1 || e.button === 0 && e.altKey && tool === "select") {
			drag.current = {
				type: "pan",
				startX: sx,
				startY: sy,
				vx: viewport.x,
				vy: viewport.y
			};
			return;
		}
		if (tool === "pen" && e.button === 0) {
			const sel = selection[0] ? doc.nodes.find((n) => n.id === selection[0]) : null;
			if (sel && isPath(sel) && !sel.closed && sel.points.length >= 1) {
				const first = sel.points[0];
				const fx = sel.x + first.x;
				const fy = sel.y + first.y;
				if (sel.points.length >= 3 && nearPenClose(docPt.x, docPt.y, fx, fy, viewport.zoom)) {
					commit();
					replaceNode(sel.id, closePathWithCubic(sel), false);
					setPathEditHit({
						index: 0,
						arm: "anchor"
					});
					setStudioStatus("Path closed");
					setTool("select");
					return;
				}
				if (joinSelectedPathToNearest(docPt.x, docPt.y, viewport.zoom)) {
					setStudioStatus("Paths joined");
					return;
				}
			}
			const id = appendPenPoint(docPt.x, docPt.y);
			if (id) {
				const n = useDesign.getState().doc?.nodes.find((x) => x.id === id);
				if (n && isPath(n)) {
					setPathEditHit({
						index: n.points.length - 1,
						arm: "anchor"
					});
					setStudioStatus(`Point ${n.points.length}`);
				}
			}
			return;
		}
		if (tool === "knife" && e.button === 0) {
			drag.current = {
				type: "knife",
				startX: docPt.x,
				startY: docPt.y
			};
			setKnifeStroke({
				ax: docPt.x,
				ay: docPt.y,
				bx: docPt.x,
				by: docPt.y
			});
			setKnifeHover(null);
			setStudioStatus("Knife · drag to cut");
			return;
		}
		if (tool === "select") {
			const selected = doc.nodes.filter((n) => selection.includes(n.id));
			if (selection.length === 1 && pathPointSelection.length > 1) {
				const n = selected[0];
				if (n && isPath(n)) {
					const coords = [];
					for (const sel of pathPointSelection) {
						const pt = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
						if (pt) coords.push({
							x: pt.x,
							y: pt.y
						});
					}
					if (coords.length > 1) {
						const xs = coords.map((c) => c.x);
						const ys = coords.map((c) => c.y);
						const minX = Math.min(...xs);
						const maxX = Math.max(...xs);
						const minY = Math.min(...ys);
						const maxY = Math.max(...ys);
						const lcx = (minX + maxX) / 2;
						const lcy = (minY + maxY) / 2;
						const pad = 6 / viewport.zoom;
						const handleLocalX = n.x + lcx;
						const handleLocalY = n.y + minY - pad - 28 / viewport.zoom;
						const nc = nodeCenter(n);
						const worldHandle = n.rotation ? rotatePoint(handleLocalX, handleLocalY, nc.x, nc.y, n.rotation) : {
							x: handleLocalX,
							y: handleLocalY
						};
						const worldCenter = n.rotation ? rotatePoint(n.x + lcx, n.y + lcy, nc.x, nc.y, n.rotation) : {
							x: n.x + lcx,
							y: n.y + lcy
						};
						if (Math.hypot(docPt.x - worldHandle.x, docPt.y - worldHandle.y) <= 18 / viewport.zoom + 4 / viewport.zoom) {
							const ang = Math.atan2(docPt.y - worldCenter.y, docPt.x - worldCenter.x);
							drag.current = {
								type: "path-points-rotate",
								id: n.id,
								startAngle: ang,
								cx: worldCenter.x,
								cy: worldCenter.y,
								basePoints: n.points.map((p) => ({
									...p,
									in: p.in ? { ...p.in } : p.in,
									out: p.out ? { ...p.out } : p.out
								})),
								baseHoles: n.holes?.map((ring) => ring.map((p) => ({
									...p,
									in: p.in ? { ...p.in } : p.in,
									out: p.out ? { ...p.out } : p.out
								})))
							};
							commit();
							setStudioStatus("Rotate path points");
							setRotateAngle(0);
							setRotateHover(null);
							return;
						}
						const box = {
							x: n.x + minX - pad,
							y: n.y + minY - pad,
							w: maxX - minX + pad * 2,
							h: maxY - minY + pad * 2
						};
						const localPt = n.rotation ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation) : docPt;
						const scaleHit = hitResizeHandle(box, localPt.x, localPt.y, viewport.zoom);
						if (scaleHit) {
							drag.current = {
								type: "path-points-scale",
								id: n.id,
								handle: scaleHit,
								basePoints: n.points.map((p) => ({
									...p,
									in: p.in ? { ...p.in } : p.in,
									out: p.out ? { ...p.out } : p.out
								})),
								baseHoles: n.holes?.map((ring) => ring.map((p) => ({
									...p,
									in: p.in ? { ...p.in } : p.in,
									out: p.out ? { ...p.out } : p.out
								})))
							};
							commit();
							setStudioStatus("Scale path points");
							setScaleHover(null);
							return;
						}
						const alignOff = 16 / viewport.zoom;
						const centerOff = 24 / viewport.zoom;
						const alignHitR = 14 / viewport.zoom;
						const alignHandles = [
							{
								x: box.x - alignOff,
								y: box.y + box.h / 2,
								edge: "left"
							},
							{
								x: box.x + box.w + alignOff,
								y: box.y + box.h / 2,
								edge: "right"
							},
							{
								x: box.x + box.w / 2,
								y: box.y - alignOff,
								edge: "top"
							},
							{
								x: box.x + box.w / 2,
								y: box.y + box.h + alignOff,
								edge: "bottom"
							},
							{
								x: box.x - centerOff,
								y: box.y + box.h / 2,
								edge: "center"
							},
							{
								x: box.x + box.w + centerOff,
								y: box.y + box.h / 2,
								edge: "center"
							},
							{
								x: box.x + box.w / 2,
								y: box.y - centerOff,
								edge: "middle"
							},
							{
								x: box.x + box.w / 2,
								y: box.y + box.h + centerOff,
								edge: "middle"
							}
						];
						for (const ah of alignHandles) if (Math.hypot(localPt.x - ah.x, localPt.y - ah.y) <= alignHitR) {
							previewAlignSelectedPathPoints(ah.edge);
							drag.current = {
								type: "path-points-align",
								id: n.id,
								edge: ah.edge
							};
							setStudioStatus(`Align ${ah.edge} · drag to snap`);
							return;
						}
						if (pathPointSelection.length >= 3) {
							const distOff = 32 / viewport.zoom;
							const distHitR = 14 / viewport.zoom;
							const distHandles = [
								{
									x: box.x - distOff,
									y: box.y + box.h / 2,
									axis: "h"
								},
								{
									x: box.x + box.w + distOff,
									y: box.y + box.h / 2,
									axis: "h"
								},
								{
									x: box.x + box.w / 2,
									y: box.y - distOff,
									axis: "v"
								},
								{
									x: box.x + box.w / 2,
									y: box.y + box.h + distOff,
									axis: "v"
								}
							];
							for (const dh of distHandles) if (Math.hypot(localPt.x - dh.x, localPt.y - dh.y) <= distHitR) {
								const sorted = coords.slice().sort((a, b) => dh.axis === "h" ? a.x - b.x : a.y - b.y);
								const first = sorted[0];
								const last = sorted[sorted.length - 1];
								const start = dh.axis === "h" ? first.x : first.y;
								const end = dh.axis === "h" ? last.x : last.y;
								const center = (start + end) / 2;
								const count = sorted.length;
								const initialGap = count > 1 ? (end - start) / (count - 1) : 0;
								previewDistributeWithGap(dh.axis, initialGap);
								drag.current = {
									type: "path-points-dist",
									id: n.id,
									axis: dh.axis,
									center,
									count,
									initialGap
								};
								setDistCursorLabel({
									x: docPt.x,
									y: docPt.y,
									gap: Math.max(0, initialGap),
									axis: dh.axis
								});
								setStudioStatus(`Gap ${formatDistributeGap(initialGap)} · drag to snap`);
								setDistHover(null);
								setFlipHover(null);
								setAlignHover(null);
								return;
							}
						}
						const flipOff = 48 / viewport.zoom;
						const flipHitR = 14 / viewport.zoom;
						const flipHandles = [
							{
								x: box.x - flipOff,
								y: box.y + box.h / 2,
								axis: "x"
							},
							{
								x: box.x + box.w + flipOff,
								y: box.y + box.h / 2,
								axis: "x"
							},
							{
								x: box.x + box.w / 2,
								y: box.y - flipOff,
								axis: "y"
							},
							{
								x: box.x + box.w / 2,
								y: box.y + box.h + flipOff,
								axis: "y"
							},
							{
								x: box.x - flipOff,
								y: box.y - flipOff,
								axis: "xy"
							},
							{
								x: box.x + box.w + flipOff,
								y: box.y - flipOff,
								axis: "xy"
							},
							{
								x: box.x - flipOff,
								y: box.y + box.h + flipOff,
								axis: "xy"
							},
							{
								x: box.x + box.w + flipOff,
								y: box.y + box.h + flipOff,
								axis: "xy"
							}
						];
						for (const fh of flipHandles) if (Math.hypot(localPt.x - fh.x, localPt.y - fh.y) <= flipHitR) {
							previewFlipSelectedPathPoints(fh.axis);
							drag.current = {
								type: "path-points-flip",
								id: n.id,
								axis: fh.axis
							};
							setStudioStatus(`Flip ${fh.axis.toUpperCase()} · drag to apply`);
							setDistHover(null);
							setFlipHover(null);
							setAlignHover(null);
							return;
						}
					}
				}
			}
			if (selection.length >= 3 && pathPointSelection.length === 0) {
				const roots = doc.nodes.filter((n) => selection.includes(n.id) && !n.locked && n.visible);
				if (roots.length >= 3) {
					const boxes = roots.map((n) => ({
						n,
						box: {
							x: n.x,
							y: n.y,
							w: n.w,
							h: n.h
						}
					}));
					let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
					for (const { box } of boxes) {
						minX = Math.min(minX, box.x);
						minY = Math.min(minY, box.y);
						maxX = Math.max(maxX, box.x + box.w);
						maxY = Math.max(maxY, box.y + box.h);
					}
					const ux = minX, uy = minY, uw = maxX - minX, uh = maxY - minY;
					const distOff = 36 / viewport.zoom;
					const distHitR = 16 / viewport.zoom;
					const distHandles = [
						{
							x: ux - distOff,
							y: uy + uh / 2,
							axis: "h"
						},
						{
							x: ux + uw + distOff,
							y: uy + uh / 2,
							axis: "h"
						},
						{
							x: ux + uw / 2,
							y: uy - distOff,
							axis: "v"
						},
						{
							x: ux + uw / 2,
							y: uy + uh + distOff,
							axis: "v"
						}
					];
					for (const dh of distHandles) if (Math.hypot(docPt.x - dh.x, docPt.y - dh.y) <= distHitR) {
						const axis = dh.axis;
						const sorted = boxes.slice().sort((a, b) => axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y);
						const first = sorted[0].box;
						const last = sorted[sorted.length - 1].box;
						const start0 = axis === "h" ? first.x : first.y;
						const end0 = axis === "h" ? last.x + last.w : last.y + last.h;
						const center = (start0 + end0) / 2;
						const total = sorted.reduce((s, item) => s + (axis === "h" ? item.box.w : item.box.h), 0);
						const initialGap = sorted.length > 1 ? (end0 - start0 - total) / (sorted.length - 1) : 0;
						setLiveDistributePreview(axis, Math.max(0, initialGap));
						drag.current = {
							type: "layer-dist",
							axis,
							center,
							count: sorted.length,
							total
						};
						setDistCursorLabel({
							x: docPt.x,
							y: docPt.y,
							gap: Math.max(0, initialGap),
							axis
						});
						setStudioStatus(`Gap ${formatDistributeGap(Math.max(0, initialGap))} · drag to snap`);
						return;
					}
				}
			}
			if (showTangentLengths && pathEditHit) for (const n of selected) {
				if (!isPath(n) || !n.points.length) continue;
				const labelHit = hitPathLengthLabel(n, docPt.x, docPt.y, viewport.zoom, pathEditHit);
				if (labelHit && labelHit.index === pathEditHit.index && (labelHit.hole ?? void 0) === (pathEditHit.hole ?? void 0)) {
					const pt = (labelHit.hole == null ? n.points : n.holes?.[labelHit.hole] ?? [])[labelHit.index];
					const h = labelHit.arm === "in" ? pt?.in : pt?.out;
					if (h && (Math.abs(h.x) > .2 || Math.abs(h.y) > .2)) {
						drag.current = {
							type: "path-handle-length",
							id: n.id,
							index: labelHit.index,
							arm: labelHit.arm,
							hole: labelHit.hole,
							baseVec: {
								x: h.x,
								y: h.y
							},
							started: false
						};
						setStudioStatus(`Length ${labelHit.arm} · ${labelHit.length}`);
						return;
					}
				}
			}
			for (const n of selected) {
				if (!isPath(n) || !n.points.length) continue;
				const hit = hitPathNode(n, docPt.x, docPt.y, viewport.zoom);
				if (hit) {
					if (e.shiftKey && hit.arm === "anchor") {
						togglePathPointSelection(hit.index, hit.hole);
						setStudioStatus(`Path points · ${useDesign.getState().pathPointSelection.length} selected`);
					} else {
						setPathEditHit(hit);
						if (hit.arm === "anchor") setPathPointSelection([{
							index: hit.index,
							hole: hit.hole
						}]);
						else setPathPointSelection([]);
						const arm = hit.arm === "anchor" ? "anchor" : hit.arm;
						setStudioStatus(`Path ${arm}${hit.hole != null ? ` · hole ${hit.hole + 1}` : ""}`);
					}
					drag.current = {
						type: "path-point",
						id: n.id,
						hit,
						keepSmooth: !e.altKey,
						started: false
					};
					return;
				}
			}
			let hitH = null;
			for (const n of selected) {
				const h = hitHandle(n, docPt.x, docPt.y, viewport.zoom);
				if (h) {
					hitH = {
						node: n,
						handle: h
					};
					break;
				}
			}
			if (hitH) {
				const n = hitH.node;
				if (hitH.handle === "rotate") {
					const c = nodeCenter(n);
					const ang = Math.atan2(docPt.y - c.y, docPt.x - c.x);
					drag.current = {
						type: "rotate",
						id: n.id,
						startAngle: ang,
						origRot: n.rotation,
						cx: c.x,
						cy: c.y
					};
					setStudioStatus(`Rotate ${Math.round(n.rotation)}°`);
				} else if (hitH.handle === "move") drag.current = {
					type: "move",
					id: n.id,
					startX: docPt.x,
					startY: docPt.y,
					ox: n.x,
					oy: n.y
				};
				else drag.current = {
					type: "resize",
					id: n.id,
					handle: hitH.handle,
					startX: docPt.x,
					startY: docPt.y,
					orig: { ...n }
				};
				return;
			}
			const hit = hitTop(doc.nodes, docPt.x, docPt.y);
			const additive = e.shiftKey || e.metaKey || e.ctrlKey;
			if (hit) {
				select([hit.id], additive);
				if (isPath(hit)) setPathEditHit(hitPathNode(hit, docPt.x, docPt.y, viewport.zoom));
				else setPathEditHit(null);
				drag.current = {
					type: "move",
					id: hit.id,
					startX: docPt.x,
					startY: docPt.y,
					ox: hit.x,
					oy: hit.y
				};
			} else {
				drag.current = {
					type: "marquee",
					startX: docPt.x,
					startY: docPt.y,
					endX: docPt.x,
					endY: docPt.y,
					additive: e.shiftKey || e.metaKey || e.ctrlKey
				};
				setMarquee({
					x1: docPt.x,
					y1: docPt.y,
					x2: docPt.x,
					y2: docPt.y
				});
			}
			return;
		}
		if ([
			"rect",
			"ellipse",
			"line",
			"polygon",
			"star",
			"arrow",
			"text"
		].includes(tool)) drag.current = {
			type: "create",
			tool,
			startX: docPt.x,
			startY: docPt.y,
			id: null
		};
	}
	function onPointerMove(e) {
		if (!doc) return;
		const rect = canvasRef.current.getBoundingClientRect();
		const sx = e.clientX - rect.left;
		const sy = e.clientY - rect.top;
		const docPt = screenToDoc(sx, sy, viewport);
		if (tool === "knife" && !drag.current) {
			let best = null;
			const preferred = selection[0];
			const paths = [];
			for (const n of doc.nodes) {
				if (!n.visible || n.locked) continue;
				const p = asEditablePath(n);
				if (p && p.points.length >= 2) paths.push(p);
			}
			const ordered = preferred ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) : paths;
			for (const n of ordered) {
				const p = asEditablePath(n);
				if (!p) continue;
				const local = pathWorldToLocal(p, docPt.x, docPt.y);
				const mark = knifePreviewPoint(p, local.x, local.y, viewport.zoom);
				if (mark) {
					const d = Math.hypot(mark.x - docPt.x, mark.y - docPt.y);
					if (!best || d < best.dist) best = {
						x: mark.x,
						y: mark.y,
						dist: d
					};
				}
			}
			if (best && best.dist < 20 / viewport.zoom) {
				setKnifeHover(best);
				let pieceNote = "";
				const preferred = selection[0];
				const paths = [];
				for (const n of doc.nodes) {
					if (!n.visible || n.locked) continue;
					const p = asEditablePath(n);
					if (p && p.points.length >= 2) paths.push(p);
				}
				const ordered = preferred ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) : paths;
				for (const n of ordered) {
					const p = asEditablePath(n);
					if (!p) continue;
					const local = pathWorldToLocal(p, best.x, best.y);
					const valid = knifePointSplitPieces(p, local.x, local.y, viewport.zoom).filter((pc) => pc.length >= 2).length;
					if (valid > 1) {
						pieceNote = ` · ${valid} pieces`;
						break;
					}
				}
				setStudioStatus(`Knife · cut here${pieceNote}`);
			} else {
				setKnifeHover(null);
				setStudioStatus("Knife · drag to cut");
			}
			return;
		}
		if (showTangentLengths && !drag.current && tool === "select" && selection.length === 1) {
			const n = doc.nodes.find((x) => x.id === selection[0]);
			if (n && isPath(n)) {
				const hit = hitPathNode(n, docPt.x, docPt.y, viewport.zoom);
				if (hit && (hit.arm === "in" || hit.arm === "out")) {
					const pt = (hit.hole == null ? n.points : n.holes?.[hit.hole] ?? [])[hit.index];
					const h = hit.arm === "in" ? pt?.in : pt?.out;
					if (h && (Math.abs(h.x) > .2 || Math.abs(h.y) > .2)) {
						const ax = n.x + pt.x;
						const ay = n.y + pt.y;
						const hx = ax + h.x;
						const hy = ay + h.y;
						const c = nodeCenter(n);
						const va = n.rotation ? rotatePoint(ax, ay, c.x, c.y, n.rotation) : {
							x: ax,
							y: ay
						};
						const vh = n.rotation ? rotatePoint(hx, hy, c.x, c.y, n.rotation) : {
							x: hx,
							y: hy
						};
						const dx = vh.x - va.x;
						const dy = vh.y - va.y;
						const len = Math.hypot(dx, dy) || 1;
						const ux = dx / len;
						const uy = dy / len;
						const off = 14 / viewport.zoom;
						const lx = vh.x + ux * off;
						const ly = vh.y + uy * off;
						const length = Math.round(len);
						setLengthHover({
							nodeId: n.id,
							index: hit.index,
							arm: hit.arm,
							hole: hit.hole,
							length,
							lx,
							ly
						});
						setStudioStatus(`Length ${hit.arm} · ${length}`);
						return;
					}
				}
			}
			if (lengthHover) setLengthHover(null);
		} else if (lengthHover) setLengthHover(null);
		if (tool === "select" && !drag.current && selection.length === 1 && pathPointSelection.length > 1) {
			const n = doc.nodes.find((x) => x.id === selection[0]);
			if (n && isPath(n)) {
				const coords = [];
				for (const sel of pathPointSelection) {
					const pt = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
					if (pt) coords.push({
						x: pt.x,
						y: pt.y
					});
				}
				if (coords.length > 1) {
					const xs = coords.map((c) => c.x);
					const ys = coords.map((c) => c.y);
					const minX = Math.min(...xs);
					const maxX = Math.max(...xs);
					const minY = Math.min(...ys);
					const maxY = Math.max(...ys);
					const lcx = (minX + maxX) / 2;
					const lcy = (minY + maxY) / 2;
					const pad = 6 / viewport.zoom;
					const handleLocalX = n.x + lcx;
					const handleLocalY = n.y + minY - pad - 28 / viewport.zoom;
					const nc = nodeCenter(n);
					const worldHandle = n.rotation ? rotatePoint(handleLocalX, handleLocalY, nc.x, nc.y, n.rotation) : {
						x: handleLocalX,
						y: handleLocalY
					};
					const worldCenter = n.rotation ? rotatePoint(n.x + lcx, n.y + lcy, nc.x, nc.y, n.rotation) : {
						x: n.x + lcx,
						y: n.y + lcy
					};
					if (Math.hypot(docPt.x - worldHandle.x, docPt.y - worldHandle.y) <= 18 / viewport.zoom + 4 / viewport.zoom) {
						const radius = Math.max(36 / viewport.zoom, Math.hypot(worldHandle.x - worldCenter.x, worldHandle.y - worldCenter.y) * .85);
						setRotateHover({
							cx: worldCenter.x,
							cy: worldCenter.y,
							radius
						});
						setStudioStatus("Rotate path points");
					} else if (rotateHover) setRotateHover(null);
				} else if (rotateHover) setRotateHover(null);
			} else if (rotateHover) setRotateHover(null);
		} else if (rotateHover) setRotateHover(null);
		if (tool === "select" && !drag.current && selection.length === 1 && pathPointSelection.length > 1) {
			const n = doc.nodes.find((x) => x.id === selection[0]);
			if (n && isPath(n)) {
				const coords = [];
				for (const sel of pathPointSelection) {
					const pt = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
					if (pt) coords.push({
						x: pt.x,
						y: pt.y
					});
				}
				if (coords.length > 1) {
					const xs = coords.map((c) => c.x);
					const ys = coords.map((c) => c.y);
					const minX = Math.min(...xs);
					const maxX = Math.max(...xs);
					const minY = Math.min(...ys);
					const maxY = Math.max(...ys);
					const pad = 6 / viewport.zoom;
					const box = {
						x: n.x + minX - pad,
						y: n.y + minY - pad,
						w: maxX - minX + pad * 2,
						h: maxY - minY + pad * 2
					};
					const nc = nodeCenter(n);
					const localPt = n.rotation ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation) : docPt;
					const scaleHit = hitResizeHandle(box, localPt.x, localPt.y, viewport.zoom);
					if (scaleHit) {
						setScaleHover(scaleHit);
						setStudioStatus("Scale path points");
					} else if (scaleHover) setScaleHover(null);
				} else if (scaleHover) setScaleHover(null);
			} else if (scaleHover) setScaleHover(null);
		} else if (scaleHover) setScaleHover(null);
		if (tool === "select" && !drag.current && selection.length === 1 && pathPointSelection.length > 1) {
			const n = doc.nodes.find((x) => x.id === selection[0]);
			if (n && isPath(n)) {
				const coords = [];
				for (const sel of pathPointSelection) {
					const pt = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
					if (pt) coords.push({
						x: pt.x,
						y: pt.y
					});
				}
				if (coords.length > 1) {
					const xs = coords.map((c) => c.x);
					const ys = coords.map((c) => c.y);
					const minX = Math.min(...xs);
					const maxX = Math.max(...xs);
					const minY = Math.min(...ys);
					const maxY = Math.max(...ys);
					const pad = 6 / viewport.zoom;
					const box = {
						x: n.x + minX - pad,
						y: n.y + minY - pad,
						w: maxX - minX + pad * 2,
						h: maxY - minY + pad * 2
					};
					const nc = nodeCenter(n);
					const localPt = n.rotation ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation) : docPt;
					const alignOff = 16 / viewport.zoom;
					const centerOff = 24 / viewport.zoom;
					const hitR = 14 / viewport.zoom;
					const alignHandles = [
						{
							x: box.x - alignOff,
							y: box.y + box.h / 2,
							edge: "left"
						},
						{
							x: box.x + box.w + alignOff,
							y: box.y + box.h / 2,
							edge: "right"
						},
						{
							x: box.x + box.w / 2,
							y: box.y - alignOff,
							edge: "top"
						},
						{
							x: box.x + box.w / 2,
							y: box.y + box.h + alignOff,
							edge: "bottom"
						},
						{
							x: box.x - centerOff,
							y: box.y + box.h / 2,
							edge: "center"
						},
						{
							x: box.x + box.w + centerOff,
							y: box.y + box.h / 2,
							edge: "center"
						},
						{
							x: box.x + box.w / 2,
							y: box.y - centerOff,
							edge: "middle"
						},
						{
							x: box.x + box.w / 2,
							y: box.y + box.h + centerOff,
							edge: "middle"
						}
					];
					let hitEdge = null;
					for (const ah of alignHandles) if (Math.hypot(localPt.x - ah.x, localPt.y - ah.y) <= hitR) {
						hitEdge = ah.edge;
						break;
					}
					if (hitEdge) {
						previewAlignSelectedPathPoints(hitEdge);
						setAlignHover(hitEdge);
						setDistHover(null);
						setFlipHover(null);
					} else {
						if (alignHover) setAlignHover(null);
						let handled = false;
						if (pathPointSelection.length >= 3) {
							const distOff = 32 / viewport.zoom;
							const distHitR = 14 / viewport.zoom;
							const distHandles = [
								{
									x: box.x - distOff,
									y: box.y + box.h / 2,
									axis: "h"
								},
								{
									x: box.x + box.w + distOff,
									y: box.y + box.h / 2,
									axis: "h"
								},
								{
									x: box.x + box.w / 2,
									y: box.y - distOff,
									axis: "v"
								},
								{
									x: box.x + box.w / 2,
									y: box.y + box.h + distOff,
									axis: "v"
								}
							];
							let hitAxis = null;
							for (const dh of distHandles) if (Math.hypot(localPt.x - dh.x, localPt.y - dh.y) <= distHitR) {
								hitAxis = dh.axis;
								break;
							}
							if (hitAxis) {
								previewDistributeSelectedPathPoints(hitAxis);
								setDistHover(hitAxis);
								setFlipHover(null);
								setAlignHover(null);
								handled = true;
							} else if (distHover) setDistHover(null);
						}
						if (!handled) {
							const flipOff = 48 / viewport.zoom;
							const flipHitR = 14 / viewport.zoom;
							const flipHandles = [
								{
									x: box.x - flipOff,
									y: box.y + box.h / 2,
									axis: "x"
								},
								{
									x: box.x + box.w + flipOff,
									y: box.y + box.h / 2,
									axis: "x"
								},
								{
									x: box.x + box.w / 2,
									y: box.y - flipOff,
									axis: "y"
								},
								{
									x: box.x + box.w / 2,
									y: box.y + box.h + flipOff,
									axis: "y"
								},
								{
									x: box.x - flipOff,
									y: box.y - flipOff,
									axis: "xy"
								},
								{
									x: box.x + box.w + flipOff,
									y: box.y - flipOff,
									axis: "xy"
								},
								{
									x: box.x - flipOff,
									y: box.y + box.h + flipOff,
									axis: "xy"
								},
								{
									x: box.x + box.w + flipOff,
									y: box.y + box.h + flipOff,
									axis: "xy"
								}
							];
							let hitFlip = null;
							for (const fh of flipHandles) if (Math.hypot(localPt.x - fh.x, localPt.y - fh.y) <= flipHitR) {
								hitFlip = fh.axis;
								break;
							}
							if (hitFlip) {
								previewFlipSelectedPathPoints(hitFlip);
								setFlipHover(hitFlip);
								setDistHover(null);
								setAlignHover(null);
							} else {
								clearPathPointAlignPreview();
								if (flipHover) setFlipHover(null);
								if (distHover) setDistHover(null);
								if (alignHover) setAlignHover(null);
							}
						}
					}
				}
			}
		} else {
			if (distHover) setDistHover(null);
			if (flipHover) setFlipHover(null);
			if (alignHover) setAlignHover(null);
		}
		if (!drag.current) return;
		const d = drag.current;
		if (d.type === "pan") {
			setViewport({
				x: d.vx + (sx - d.startX),
				y: d.vy + (sy - d.startY)
			});
			return;
		}
		if (d.type === "knife") {
			d.endX = docPt.x;
			d.endY = docPt.y;
			setKnifeStroke({
				ax: d.startX,
				ay: d.startY,
				bx: docPt.x,
				by: docPt.y
			});
			const dx = docPt.x - d.startX;
			const dy = docPt.y - d.startY;
			const len = Math.hypot(dx, dy);
			const ang = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
			const lenStr = len < 10 ? len.toFixed(1) : Math.round(len).toString();
			const cuts = knifeCutCount(d.startX, d.startY, docPt.x, docPt.y, doc.nodes);
			const cutStr = cuts === 0 ? "miss" : cuts === 1 ? "1 cut" : `${cuts} cuts`;
			let pieces = 0;
			for (const n of doc.nodes) {
				if (!n.visible || n.locked) continue;
				const ep = asEditablePath(n);
				if (ep) pieces += knifeSplitPieces(ep, d.startX, d.startY, docPt.x, docPt.y).length;
			}
			const pieceStr = pieces > 1 ? ` · ${pieces} pieces` : "";
			setStudioStatus(`Knife · ${lenStr}px · ${Math.round(ang)}° · ${cutStr}${pieceStr}`);
			return;
		}
		if (d.type === "move") {
			const dx = docPt.x - d.startX;
			const dy = docPt.y - d.startY;
			updateNodes([d.id], {
				x: d.ox + dx,
				y: d.oy + dy
			}, false);
			return;
		}
		if (d.type === "resize") {
			const local = localDelta(d.orig, docPt.x - d.startX, docPt.y - d.startY);
			const patch = applyHandle(d.orig, d.handle, local.dx, local.dy);
			updateNodes([d.id], patch, false);
			return;
		}
		if (d.type === "path-points-rotate") {
			let deg = (Math.atan2(docPt.y - d.cy, docPt.x - d.cx) - d.startAngle) * 180 / Math.PI;
			deg = snap15(deg, e.shiftKey);
			rotateSelectedPathPoints(deg, d.basePoints, d.baseHoles);
			setRotateAngle(deg);
			return;
		}
		if (d.type === "path-points-align") return;
		if (d.type === "path-points-dist") {
			const n = doc.nodes.find((x) => x.id === d.id);
			if (!n || !isPath(n)) return;
			const nc = nodeCenter(n);
			const localPt = n.rotation ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation) : docPt;
			const mouseLocal = d.axis === "h" ? localPt.x - n.x : localPt.y - n.y;
			const proposedSpan = Math.abs(mouseLocal - d.center) * 2;
			const snapped = snapGap(d.count > 1 ? proposedSpan / (d.count - 1) : 0, e.shiftKey);
			previewDistributeWithGap(d.axis, snapped);
			setDistCursorLabel({
				x: docPt.x,
				y: docPt.y,
				gap: snapped,
				axis: d.axis
			});
			setStudioStatus(snapped <= 1.5 ? `Flush · ${formatDistributeGap(snapped)} px · drag to snap` : `Gap ${formatDistributeGap(snapped)} · drag to snap`);
			return;
		}
		if (d.type === "layer-dist") {
			const mouse = d.axis === "h" ? docPt.x : docPt.y;
			const proposedSpan = Math.abs(mouse - d.center) * 2;
			const proposedGap = d.count > 1 ? (proposedSpan - d.total) / (d.count - 1) : 0;
			const snapped = snapGap(Math.max(0, proposedGap), e.shiftKey);
			setLiveDistributePreview(d.axis, snapped);
			setDistCursorLabel({
				x: docPt.x,
				y: docPt.y,
				gap: snapped,
				axis: d.axis
			});
			setStudioStatus(snapped <= 1.5 ? `Flush · ${formatDistributeGap(snapped)} px · drag to snap` : `Gap ${formatDistributeGap(snapped)} · drag to snap`);
			return;
		}
		if (d.type === "path-points-scale") {
			const n = doc.nodes.find((x) => x.id === d.id);
			if (!n || !isPath(n)) return;
			const nc = nodeCenter(n);
			const localPt = n.rotation ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation) : docPt;
			const mouseLocalX = localPt.x - n.x;
			const mouseLocalY = localPt.y - n.y;
			scaleSelectedPathPoints(d.handle, mouseLocalX, mouseLocalY, e.shiftKey, e.altKey, d.basePoints, d.baseHoles);
			setScaleFlip({
				x: lastPathScale.sx < 0,
				y: lastPathScale.sy < 0
			});
			return;
		}
		if (d.type === "rotate") {
			const ang = Math.atan2(docPt.y - d.cy, docPt.x - d.cx);
			let deg = d.origRot + (ang - d.startAngle) * 180 / Math.PI;
			deg = snap15(deg, e.shiftKey);
			updateNodes([d.id], { rotation: deg }, false);
			setStudioStatus(`Rotate ${Math.round(deg)}°`);
			return;
		}
		if (d.type === "path-handle-length") {
			const n = doc.nodes.find((x) => x.id === d.id);
			if (!n || !isPath(n)) return;
			if (!d.started) {
				commit();
				drag.current = {
					...d,
					started: true
				};
			}
			const ring = d.hole == null ? n.points : n.holes?.[d.hole] ?? [];
			const pt = ring[d.index];
			if (!pt) return;
			const ax = n.x + pt.x;
			const ay = n.y + pt.y;
			const c = nodeCenter(n);
			const worldAnchor = n.rotation ? rotatePoint(ax, ay, c.x, c.y, n.rotation) : {
				x: ax,
				y: ay
			};
			const dx = docPt.x - worldAnchor.x;
			const dy = docPt.y - worldAnchor.y;
			const newLen = Math.max(0, Math.hypot(dx, dy));
			const scale = newLen / (Math.hypot(d.baseVec.x, d.baseVec.y) || 1);
			const next = {
				x: d.baseVec.x * scale,
				y: d.baseVec.y * scale
			};
			const s = useDesign.getState();
			const mirrorKey = `${d.id}:${d.hole ?? ""}:${d.index}`;
			const mir = !!(s.mirrorPoints && s.mirrorPoints[mirrorKey]);
			const nextPt = { ...pt };
			if (mir) {
				const mirrored = mirrorHandle(next);
				if (d.arm === "in") {
					nextPt.in = next;
					nextPt.out = mirrored;
				} else {
					nextPt.out = next;
					nextPt.in = mirrored;
				}
			} else if (d.arm === "in") nextPt.in = next;
			else nextPt.out = next;
			const nextRing = ring.map((p, i) => i === d.index ? nextPt : p);
			const nextNode = d.hole == null ? {
				...n,
				points: nextRing
			} : {
				...n,
				holes: (n.holes ?? []).map((h, i) => i === d.hole ? nextRing : h)
			};
			replaceNode(d.id, nextNode, false);
			setPathEditHit({
				index: d.index,
				arm: d.arm,
				hole: d.hole
			});
			setStudioStatus(`Length ${d.arm} · ${Math.round(newLen)}`);
			return;
		}
		if (d.type === "path-point") {
			const n = doc.nodes.find((x) => x.id === d.id);
			if (!n || !isPath(n)) return;
			if (!d.started) {
				commit();
				drag.current = {
					...d,
					started: true
				};
			}
			const local = pathWorldToLocal(n, docPt.x, docPt.y);
			editPathHit(d.id, d.hit, local.x, local.y, d.keepSmooth && !e.altKey, false);
			if (d.hit.arm === "anchor") setStudioStatus(`Point ${d.hit.index + 1} · ${Math.round(local.x)}, ${Math.round(local.y)}`);
			else setStudioStatus(`Handle ${d.hit.arm} · point ${d.hit.index + 1}`);
			return;
		}
		if (d.type === "marquee") {
			drag.current = {
				...d,
				endX: docPt.x,
				endY: docPt.y
			};
			setMarquee({
				x1: d.startX,
				y1: d.startY,
				x2: docPt.x,
				y2: docPt.y
			});
			return;
		}
		if (d.type === "create") {
			const x0 = Math.min(d.startX, docPt.x);
			const y0 = Math.min(d.startY, docPt.y);
			const w = Math.abs(docPt.x - d.startX);
			const h = Math.abs(docPt.y - d.startY);
			if (!d.id) {
				if (w < 2 && h < 2 && d.tool !== "text") return;
				if (d.tool === "text") {
					const node = makeText(d.startX, d.startY, color);
					addNode(node, true);
					drag.current = {
						...d,
						id: node.id
					};
					setTool("select");
					return;
				}
				const node = makeShape(d.tool, x0, y0, Math.max(w, 4), Math.max(h, 4), color);
				addNode(node, true);
				drag.current = {
					...d,
					id: node.id
				};
			} else if (d.tool !== "text") updateNodes([d.id], {
				x: x0,
				y: y0,
				w: Math.max(w, 4),
				h: Math.max(h, 4)
			}, false);
		}
	}
	function onPointerUp() {
		const d = drag.current;
		drag.current = null;
		setMarquee(null);
		setScaleFlip(null);
		setRotateAngle(null);
		setLengthHover(null);
		setRotateHover(null);
		setScaleHover(null);
		setDistHover(null);
		setDistCursorLabel(null);
		setFlipHover(null);
		setAlignHover(null);
		if (d?.type === "path-points-align") {
			alignSelectedPathPoints(d.edge);
			clearPathPointAlignPreview();
			return;
		}
		if (d?.type === "path-points-dist") {
			const preview = useDesign.getState().pathPointAlignPreview;
			let finalGap = d.initialGap;
			if (preview && preview.points.length >= 2 && (preview.edge === "dist-h" || preview.edge === "dist-v")) {
				const sorted = preview.points.slice().sort((a, b) => d.axis === "h" ? a.toX - b.toX : a.toY - b.toY);
				const start = d.axis === "h" ? sorted[0].toX : sorted[0].toY;
				finalGap = ((d.axis === "h" ? sorted[sorted.length - 1].toX : sorted[sorted.length - 1].toY) - start) / (sorted.length - 1);
			}
			applyDistributeWithGap(d.axis, finalGap);
			clearPathPointAlignPreview();
			return;
		}
		if (d?.type === "layer-dist") {
			commitDistributePreview();
			return;
		}
		if (d?.type === "path-points-flip") {
			flipSelectedPathPoints(d.axis);
			clearPathPointAlignPreview();
			return;
		}
		if (d?.type === "knife") {
			const bx = d.endX ?? d.startX;
			const by = d.endY ?? d.startY;
			if (knifeCutStroke(d.startX, d.startY, bx, by, viewport.zoom)) {
				const residual = collectKnifeResidual(doc, d.startX, d.startY, bx, by, viewport.zoom);
				if (residual) {
					setKnifeResidual(residual);
					const pieces = residual.pieces.length;
					setStudioStatus(pieces > 1 ? `Knife · ${pieces} pieces` : "Knife · cut");
				} else setStudioStatus("Knife · cut");
			} else setStudioStatus("Knife · miss");
			setKnifeStroke(null);
			return;
		}
		if (d?.type === "create" && d.id && d.tool !== "text") setTool("select");
		if (d?.type === "path-point") {}
		if (d?.type === "marquee") {
			const dx = Math.abs(d.endX - d.startX);
			const dy = Math.abs(d.endY - d.startY);
			if (dx < 3 && dy < 3) {
				if (!d.additive) {
					select([]);
					setPathEditHit(null);
					setPathPointSelection([]);
				}
				return;
			}
			const minX = Math.min(d.startX, d.endX);
			const minY = Math.min(d.startY, d.endY);
			const maxX = Math.max(d.startX, d.endX);
			const maxY = Math.max(d.startY, d.endY);
			const mq = {
				x: minX,
				y: minY,
				w: maxX - minX,
				h: maxY - minY
			};
			if (selection.length === 1) {
				const n = doc?.nodes.find((x) => x.id === selection[0]);
				if (n && isPath(n)) {
					const picked = [];
					const c = nodeCenter(n);
					const consider = (ring, hole) => {
						ring.forEach((pt, index) => {
							const localWx = n.x + pt.x;
							const localWy = n.y + pt.y;
							const world = n.rotation ? rotatePoint(localWx, localWy, c.x, c.y, n.rotation) : {
								x: localWx,
								y: localWy
							};
							if (world.x >= minX && world.x <= maxX && world.y >= minY && world.y <= maxY) picked.push({
								index,
								hole
							});
						});
					};
					consider(n.points);
					(n.holes ?? []).forEach((ring, hole) => consider(ring, hole));
					if (d.additive) {
						const cur = useDesign.getState().pathPointSelection ?? [];
						const key = (p) => `${p.hole ?? ""}:${p.index}`;
						const seen = new Set(cur.map(key));
						for (const p of picked) if (!seen.has(key(p))) cur.push(p);
						setPathPointSelection(cur);
					} else setPathPointSelection(picked);
					if (picked.length) setPathEditHit({
						index: picked[0].index,
						arm: "anchor",
						hole: picked[0].hole
					});
					setStudioStatus(`Marquee · ${picked.length} path point${picked.length === 1 ? "" : "s"}`);
					return;
				}
			}
			const ids = nodesInMarquee(doc?.nodes ?? [], mq, "intersect");
			if (d.additive) {
				const cur = new Set(selection);
				for (const id of ids) cur.add(id);
				select(Array.from(cur));
			} else select(ids);
			setPathEditHit(null);
			setPathPointSelection([]);
			setStudioStatus(`Marquee · ${ids.length} layer${ids.length === 1 ? "" : "s"}`);
		}
	}
	function onWheel(e) {
		if (!doc) return;
		e.preventDefault();
		const rect = canvasRef.current.getBoundingClientRect();
		const sx = e.clientX - rect.left;
		const sy = e.clientY - rect.top;
		const docPt = screenToDoc(sx, sy, viewport);
		const factor = e.deltaY < 0 ? 1.08 : .92;
		const nextZ = Math.max(.05, Math.min(8, viewport.zoom * factor));
		setViewport({
			zoom: nextZ,
			x: sx - docPt.x * nextZ,
			y: sy - docPt.y * nextZ
		});
	}
	if (!doc) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-ground" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "absolute inset-0 overflow-hidden bg-ground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block h-full w-full touch-none",
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerCancel: onPointerUp,
			onWheel
		})
	});
}
function drawMarquee(ctx, mq, vp, dpr) {
	const x = Math.min(mq.x1, mq.x2);
	const y = Math.min(mq.y1, mq.y2);
	const w = Math.abs(mq.x2 - mq.x1);
	const h = Math.abs(mq.y2 - mq.y1);
	if (w < 1 && h < 1) return;
	ctx.save();
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.translate(vp.x, vp.y);
	ctx.scale(vp.zoom, vp.zoom);
	ctx.strokeStyle = "#3fc6ff";
	ctx.fillStyle = "rgba(63,198,255,0.08)";
	ctx.lineWidth = 1 / vp.zoom;
	ctx.setLineDash([4 / vp.zoom, 3 / vp.zoom]);
	ctx.beginPath();
	ctx.rect(x, y, w, h);
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}
function drawPathPointAlignPreview(ctx, preview, doc, vp, dpr) {
	const n = doc.nodes.find((x) => x.id === preview.nodeId);
	if (!n || !isPath(n)) return;
	ctx.save();
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.translate(vp.x, vp.y);
	ctx.scale(vp.zoom, vp.zoom);
	const c = nodeCenter(n);
	if (n.rotation) {
		ctx.translate(c.x, c.y);
		ctx.rotate(degToRad(n.rotation));
		ctx.translate(-c.x, -c.y);
	}
	ctx.strokeStyle = "#3fc6ff";
	ctx.fillStyle = "rgba(63,198,255,0.35)";
	ctx.lineWidth = 1 / vp.zoom;
	ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
	const r = 5 / vp.zoom;
	const targets = [];
	for (const pt of preview.points) {
		const fx = n.x + pt.fromX;
		const fy = n.y + pt.fromY;
		const tx = n.x + pt.toX;
		const ty = n.y + pt.toY;
		targets.push({
			x: tx,
			y: ty
		});
		ctx.beginPath();
		ctx.moveTo(fx, fy);
		ctx.lineTo(tx, ty);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(tx, ty, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
	}
	ctx.setLineDash([]);
	if (preview.edge === "dist-h" || preview.edge === "dist-v") {
		const axis = preview.edge === "dist-h" ? "h" : "v";
		drawDistTargetSpine(ctx, axis, targets, vp.zoom);
		if (targets.length >= 3) {
			const sorted = targets.slice().sort((a, b) => axis === "h" ? a.x - b.x : a.y - b.y);
			const start = axis === "h" ? sorted[0].x : sorted[0].y;
			const end = axis === "h" ? sorted[sorted.length - 1].x : sorted[sorted.length - 1].y;
			const gap = (end - start) / (sorted.length - 1);
			if (gap > .5) {
				const mid = sorted.reduce((s, p) => s + (axis === "h" ? p.y : p.x), 0) / sorted.length;
				if (axis === "h") drawGapBadges(ctx, "h", start, mid - 1, end - start, 2, targets.length, vp.zoom, formatDistributeGap(gap));
				else drawGapBadges(ctx, "v", mid - 1, start, 2, end - start, targets.length, vp.zoom, formatDistributeGap(gap));
			}
		}
	}
	ctx.restore();
}
function drawPathPointNumericPreview(ctx, preview, doc, vp, dpr) {
	const n = doc.nodes.find((x) => x.id === preview.nodeId);
	if (!n || !isPath(n)) return;
	ctx.save();
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.translate(vp.x, vp.y);
	ctx.scale(vp.zoom, vp.zoom);
	const c = nodeCenter(n);
	if (n.rotation) {
		ctx.translate(c.x, c.y);
		ctx.rotate(degToRad(n.rotation));
		ctx.translate(-c.x, -c.y);
	}
	ctx.strokeStyle = "#3fc6ff";
	ctx.fillStyle = "rgba(63,198,255,0.45)";
	ctx.lineWidth = 1 / vp.zoom;
	ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
	const r = 6 / vp.zoom;
	const fx = n.x + preview.fromX;
	const fy = n.y + preview.fromY;
	const tx = n.x + preview.toX;
	const ty = n.y + preview.toY;
	ctx.beginPath();
	ctx.moveTo(fx, fy);
	ctx.lineTo(tx, ty);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(tx, ty, r, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	const cross = 4 / vp.zoom;
	ctx.beginPath();
	if (preview.axis === "x") {
		ctx.moveTo(tx - cross, ty);
		ctx.lineTo(tx + cross, ty);
	} else {
		ctx.moveTo(tx, ty - cross);
		ctx.lineTo(tx, ty + cross);
	}
	ctx.stroke();
	ctx.setLineDash([]);
	ctx.restore();
}
function drawPathPointHandleNumericPreview(ctx, preview, doc, vp, dpr) {
	const n = doc.nodes.find((x) => x.id === preview.nodeId);
	if (!n || !isPath(n)) return;
	const pt = (preview.hole == null ? n.points : n.holes?.[preview.hole])?.[preview.index];
	if (!pt) return;
	ctx.save();
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.translate(vp.x, vp.y);
	ctx.scale(vp.zoom, vp.zoom);
	const c = nodeCenter(n);
	if (n.rotation) {
		ctx.translate(c.x, c.y);
		ctx.rotate(degToRad(n.rotation));
		ctx.translate(-c.x, -c.y);
	}
	ctx.strokeStyle = "#3fc6ff";
	ctx.fillStyle = "rgba(63,198,255,0.45)";
	ctx.lineWidth = 1 / vp.zoom;
	ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
	const ax = n.x + pt.x;
	const ay = n.y + pt.y;
	const tx = ax + preview.toX;
	const ty = ay + preview.toY;
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.lineTo(tx, ty);
	ctx.stroke();
	const r = 5 / vp.zoom;
	ctx.beginPath();
	ctx.arc(tx, ty, r, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	if (preview.axis !== "len") {
		const cross = 3.5 / vp.zoom;
		ctx.beginPath();
		if (preview.axis === "x") {
			ctx.moveTo(tx - cross, ty);
			ctx.lineTo(tx + cross, ty);
		} else {
			ctx.moveTo(tx, ty - cross);
			ctx.lineTo(tx, ty + cross);
		}
		ctx.stroke();
	}
	ctx.setLineDash([]);
	ctx.restore();
}
function drawSelection(ctx, nodes, selection, vp, dpr, pathEditHit, pathPointSelection = [], scaleFlip = null, showLengths = false, rotateAngle = null, alignHover = null) {
	const selected = nodes.filter((n) => selection.includes(n.id) && n.visible);
	if (!selected.length) return;
	ctx.save();
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.translate(vp.x, vp.y);
	ctx.scale(vp.zoom, vp.zoom);
	const phosphor = "#3fc6ff";
	for (const n of selected) {
		if (isPath(n) && n.points.length) {
			drawPathNodeTangents(ctx, n, vp.zoom, pathEditHit, showLengths);
			if (pathPointSelection.length > 1) {
				ctx.save();
				const c = nodeCenter(n);
				if (n.rotation) {
					ctx.translate(c.x, c.y);
					ctx.rotate(degToRad(n.rotation));
					ctx.translate(-c.x, -c.y);
				}
				ctx.fillStyle = "rgba(63,198,255,0.9)";
				ctx.strokeStyle = "#7ee0ff";
				const r = 4.5 / vp.zoom;
				let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
				for (const sel of pathPointSelection) {
					const pt = (sel.hole == null ? n.points : n.holes?.[sel.hole])?.[sel.index];
					if (!pt) continue;
					const ax = n.x + pt.x;
					const ay = n.y + pt.y;
					minX = Math.min(minX, ax);
					minY = Math.min(minY, ay);
					maxX = Math.max(maxX, ax);
					maxY = Math.max(maxY, ay);
					ctx.beginPath();
					ctx.arc(ax, ay, r, 0, Math.PI * 2);
					ctx.fill();
					ctx.lineWidth = 1 / vp.zoom;
					ctx.stroke();
				}
				if (Number.isFinite(minX) && pathPointSelection.length > 1) {
					const pad = 6 / vp.zoom;
					ctx.strokeStyle = "#3fc6ff";
					ctx.lineWidth = 1 / vp.zoom;
					ctx.setLineDash([5 / vp.zoom, 4 / vp.zoom]);
					ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
					ctx.setLineDash([]);
					if (scaleFlip && (scaleFlip.x || scaleFlip.y)) {
						ctx.save();
						ctx.strokeStyle = "#ff6b6b";
						ctx.fillStyle = "#ff6b6b";
						ctx.lineWidth = 1.5 / vp.zoom;
						ctx.setLineDash([]);
						const bx = minX - pad;
						const by = minY - pad;
						const bw = maxX - minX + pad * 2;
						const bh = maxY - minY + pad * 2;
						const cx = bx + bw / 2;
						const cy = by + bh / 2;
						const arrowLen = Math.min(bw, bh) * .25;
						const head = 6 / vp.zoom;
						function drawArrowhead(ax, ay, angle) {
							ctx.beginPath();
							ctx.moveTo(ax, ay);
							ctx.lineTo(ax + Math.cos(angle + 2.4) * head, ay + Math.sin(angle + 2.4) * head);
							ctx.lineTo(ax + Math.cos(angle - 2.4) * head, ay + Math.sin(angle - 2.4) * head);
							ctx.closePath();
							ctx.fill();
						}
						if (scaleFlip.x) {
							const left = cx - arrowLen;
							const right = cx + arrowLen;
							ctx.beginPath();
							ctx.moveTo(left + head * .6, cy);
							ctx.lineTo(right - head * .6, cy);
							ctx.stroke();
							drawArrowhead(left, cy, Math.PI);
							drawArrowhead(right, cy, 0);
						}
						if (scaleFlip.y) {
							const top = cy - arrowLen;
							const bot = cy + arrowLen;
							ctx.beginPath();
							ctx.moveTo(cx, top + head * .6);
							ctx.lineTo(cx, bot - head * .6);
							ctx.stroke();
							drawArrowhead(cx, top, -Math.PI / 2);
							drawArrowhead(cx, bot, Math.PI / 2);
						}
						ctx.restore();
					}
					const size = 8 / vp.zoom;
					const half = size / 2;
					const boxX = minX - pad;
					const boxY = minY - pad;
					const boxW = maxX - minX + pad * 2;
					const boxH = maxY - minY + pad * 2;
					const handles = [
						[boxX, boxY],
						[boxX + boxW / 2, boxY],
						[boxX + boxW, boxY],
						[boxX + boxW, boxY + boxH / 2],
						[boxX + boxW, boxY + boxH],
						[boxX + boxW / 2, boxY + boxH],
						[boxX, boxY + boxH],
						[boxX, boxY + boxH / 2]
					];
					ctx.fillStyle = "#06170f";
					ctx.strokeStyle = "#3fc6ff";
					for (const [hx, hy] of handles) {
						ctx.fillRect(hx - half, hy - half, size, size);
						ctx.strokeRect(hx - half, hy - half, size, size);
						if (scaleFlip && scaleFlip.x && scaleFlip.y) {
							ctx.strokeStyle = "#ff6b6b";
							ctx.beginPath();
							ctx.moveTo(hx - half + 1 / vp.zoom, hy - half + 1 / vp.zoom);
							ctx.lineTo(hx + half - 1 / vp.zoom, hy + half - 1 / vp.zoom);
							ctx.moveTo(hx + half - 1 / vp.zoom, hy - half + 1 / vp.zoom);
							ctx.lineTo(hx - half + 1 / vp.zoom, hy + half - 1 / vp.zoom);
							ctx.stroke();
							ctx.strokeStyle = "#3fc6ff";
						}
					}
					const lcx = (minX + maxX) / 2;
					const top = minY - pad;
					const ry = top - 28 / vp.zoom;
					ctx.beginPath();
					ctx.moveTo(lcx, top);
					ctx.lineTo(lcx, ry);
					ctx.stroke();
					ctx.beginPath();
					ctx.arc(lcx, ry, 7 / vp.zoom, 0, Math.PI * 2);
					ctx.fillStyle = "#06170f";
					ctx.fill();
					ctx.stroke();
					if (rotateAngle != null) {
						const label = `${Math.round(rotateAngle)}°`;
						const lx = lcx + 22 / vp.zoom;
						const ly = ry;
						ctx.save();
						ctx.font = `${Math.max(9, 11 / vp.zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
						ctx.textAlign = "center";
						ctx.textBaseline = "middle";
						const pad = 5 / vp.zoom;
						const bw = ctx.measureText(label).width + pad * 2;
						const bh = 14 / vp.zoom;
						ctx.fillStyle = "rgba(6, 23, 15, 0.95)";
						ctx.strokeStyle = "#7ee0ff";
						ctx.lineWidth = 1.5 / vp.zoom;
						ctx.beginPath();
						ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 3 / vp.zoom);
						ctx.fill();
						ctx.stroke();
						ctx.fillStyle = "#3fc6ff";
						ctx.beginPath();
						ctx.arc(lx, ly, 1.2 / vp.zoom, 0, Math.PI * 2);
						ctx.fill();
						ctx.fillStyle = "#7ee0ff";
						ctx.fillText(label, lx, ly);
						ctx.restore();
					}
					const alignOff = 16 / vp.zoom;
					const centerOff = 24 / vp.zoom;
					const ar = 5 / vp.zoom;
					const aligns = [
						{
							x: boxX - alignOff,
							y: boxY + boxH / 2,
							edge: "left"
						},
						{
							x: boxX + boxW + alignOff,
							y: boxY + boxH / 2,
							edge: "right"
						},
						{
							x: boxX + boxW / 2,
							y: boxY - alignOff,
							edge: "top"
						},
						{
							x: boxX + boxW / 2,
							y: boxY + boxH + alignOff,
							edge: "bottom"
						},
						{
							x: boxX - centerOff,
							y: boxY + boxH / 2,
							edge: "center"
						},
						{
							x: boxX + boxW + centerOff,
							y: boxY + boxH / 2,
							edge: "center"
						},
						{
							x: boxX + boxW / 2,
							y: boxY - centerOff,
							edge: "middle"
						},
						{
							x: boxX + boxW / 2,
							y: boxY + boxH + centerOff,
							edge: "middle"
						}
					];
					ctx.fillStyle = "#3fc6ff";
					ctx.strokeStyle = "#06170f";
					ctx.lineWidth = 1 / vp.zoom;
					for (const a of aligns) {
						const r = a.edge === alignHover ? ar * 1.6 : ar;
						ctx.beginPath();
						ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
						ctx.fill();
						ctx.stroke();
						if (a.edge === alignHover) {
							ctx.strokeStyle = "rgba(63,198,255,0.9)";
							ctx.lineWidth = 1.5 / vp.zoom;
							ctx.beginPath();
							ctx.arc(a.x, a.y, r + 2 / vp.zoom, 0, Math.PI * 2);
							ctx.stroke();
							ctx.strokeStyle = "#06170f";
							ctx.lineWidth = 1 / vp.zoom;
						}
					}
					if (pathPointSelection.length >= 3) {
						const distOff = 32 / vp.zoom;
						const dists = [
							{
								x: boxX - distOff,
								y: boxY + boxH / 2,
								axis: "h"
							},
							{
								x: boxX + boxW + distOff,
								y: boxY + boxH / 2,
								axis: "h"
							},
							{
								x: boxX + boxW / 2,
								y: boxY - distOff,
								axis: "v"
							},
							{
								x: boxX + boxW / 2,
								y: boxY + boxH + distOff,
								axis: "v"
							}
						];
						for (const d of dists) drawDistHandle(ctx, d.x, d.y, d.axis, vp.zoom);
					}
					const flipOff = 48 / vp.zoom;
					const fs = 7 / vp.zoom;
					const flips = [
						{
							x: boxX - flipOff,
							y: boxY + boxH / 2,
							axis: "x"
						},
						{
							x: boxX + boxW + flipOff,
							y: boxY + boxH / 2,
							axis: "x"
						},
						{
							x: boxX + boxW / 2,
							y: boxY - flipOff,
							axis: "y"
						},
						{
							x: boxX + boxW / 2,
							y: boxY + boxH + flipOff,
							axis: "y"
						},
						{
							x: boxX - flipOff,
							y: boxY - flipOff,
							axis: "xy"
						},
						{
							x: boxX + boxW + flipOff,
							y: boxY - flipOff,
							axis: "xy"
						},
						{
							x: boxX - flipOff,
							y: boxY + boxH + flipOff,
							axis: "xy"
						},
						{
							x: boxX + boxW + flipOff,
							y: boxY + boxH + flipOff,
							axis: "xy"
						}
					];
					ctx.fillStyle = "#3fc6ff";
					ctx.strokeStyle = "#06170f";
					ctx.lineWidth = 1 / vp.zoom;
					for (const f of flips) {
						ctx.beginPath();
						ctx.moveTo(f.x, f.y - fs);
						ctx.lineTo(f.x + fs, f.y);
						ctx.lineTo(f.x, f.y + fs);
						ctx.lineTo(f.x - fs, f.y);
						ctx.closePath();
						ctx.fill();
						ctx.stroke();
						ctx.strokeStyle = "#06170f";
						ctx.lineWidth = 1.2 / vp.zoom;
						const al = 3.5 / vp.zoom;
						if (f.axis === "x") {
							ctx.beginPath();
							ctx.moveTo(f.x - al, f.y);
							ctx.lineTo(f.x + al, f.y);
							ctx.moveTo(f.x - al + 1.2 / vp.zoom, f.y - 1.5 / vp.zoom);
							ctx.lineTo(f.x - al, f.y);
							ctx.lineTo(f.x - al + 1.2 / vp.zoom, f.y + 1.5 / vp.zoom);
							ctx.moveTo(f.x + al - 1.2 / vp.zoom, f.y - 1.5 / vp.zoom);
							ctx.lineTo(f.x + al, f.y);
							ctx.lineTo(f.x + al - 1.2 / vp.zoom, f.y + 1.5 / vp.zoom);
							ctx.stroke();
						} else if (f.axis === "y") {
							ctx.beginPath();
							ctx.moveTo(f.x, f.y - al);
							ctx.lineTo(f.x, f.y + al);
							ctx.moveTo(f.x - 1.5 / vp.zoom, f.y - al + 1.2 / vp.zoom);
							ctx.lineTo(f.x, f.y - al);
							ctx.lineTo(f.x + 1.5 / vp.zoom, f.y - al + 1.2 / vp.zoom);
							ctx.moveTo(f.x - 1.5 / vp.zoom, f.y + al - 1.2 / vp.zoom);
							ctx.lineTo(f.x, f.y + al);
							ctx.lineTo(f.x + 1.5 / vp.zoom, f.y + al - 1.2 / vp.zoom);
							ctx.stroke();
						} else {
							const xl = 2.8 / vp.zoom;
							ctx.beginPath();
							ctx.moveTo(f.x - xl, f.y - xl);
							ctx.lineTo(f.x + xl, f.y + xl);
							ctx.moveTo(f.x + xl, f.y - xl);
							ctx.lineTo(f.x - xl, f.y + xl);
							ctx.stroke();
						}
						ctx.strokeStyle = "#06170f";
						ctx.lineWidth = 1 / vp.zoom;
					}
				}
				ctx.restore();
			}
			continue;
		}
		ctx.save();
		const c = nodeCenter(n);
		ctx.translate(c.x, c.y);
		ctx.rotate(degToRad(n.rotation));
		ctx.translate(-c.x, -c.y);
		ctx.strokeStyle = phosphor;
		ctx.lineWidth = 1 / vp.zoom;
		ctx.setLineDash([]);
		ctx.strokeRect(n.x, n.y, n.w, n.h);
		const size = 8 / vp.zoom;
		const half = size / 2;
		const pts = [
			[n.x, n.y],
			[n.x + n.w / 2, n.y],
			[n.x + n.w, n.y],
			[n.x + n.w, n.y + n.h / 2],
			[n.x + n.w, n.y + n.h],
			[n.x + n.w / 2, n.y + n.h],
			[n.x, n.y + n.h],
			[n.x, n.y + n.h / 2]
		];
		ctx.fillStyle = "#06170f";
		ctx.strokeStyle = phosphor;
		for (const [px, py] of pts) {
			ctx.fillRect(px - half, py - half, size, size);
			ctx.strokeRect(px - half, py - half, size, size);
		}
		const ry = n.y - 28 / vp.zoom;
		const rx = n.x + n.w / 2;
		ctx.beginPath();
		ctx.moveTo(rx, n.y);
		ctx.lineTo(rx, ry);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(rx, ry, 7 / vp.zoom, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
	if (selection.length >= 3 && pathPointSelection.length === 0) {
		const roots = nodes.filter((n) => selection.includes(n.id) && !n.locked && n.visible);
		if (roots.length >= 3) {
			let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
			for (const n of roots) {
				minX = Math.min(minX, n.x);
				minY = Math.min(minY, n.y);
				maxX = Math.max(maxX, n.x + n.w);
				maxY = Math.max(maxY, n.y + n.h);
			}
			const ux = minX, uy = minY, uw = maxX - minX, uh = maxY - minY;
			const distOff = 36 / vp.zoom;
			const distHandles = [
				{
					x: ux - distOff,
					y: uy + uh / 2,
					axis: "h"
				},
				{
					x: ux + uw + distOff,
					y: uy + uh / 2,
					axis: "h"
				},
				{
					x: ux + uw / 2,
					y: uy - distOff,
					axis: "v"
				},
				{
					x: ux + uw / 2,
					y: uy + uh + distOff,
					axis: "v"
				}
			];
			const hs = 9 / vp.zoom;
			ctx.fillStyle = "#3fc6ff";
			ctx.strokeStyle = "#06170f";
			ctx.lineWidth = 1 / vp.zoom;
			for (const dh of distHandles) {
				ctx.fillRect(dh.x - hs / 2, dh.y - hs / 2, hs, hs);
				ctx.strokeRect(dh.x - hs / 2, dh.y - hs / 2, hs, hs);
				ctx.fillStyle = "#06170f";
				const ds = 1.6 / vp.zoom;
				if (dh.axis === "h") {
					ctx.fillRect(dh.x - ds * 2.2, dh.y - ds / 2, ds, ds);
					ctx.fillRect(dh.x - ds / 2, dh.y - ds / 2, ds, ds);
					ctx.fillRect(dh.x + ds * 1.2, dh.y - ds / 2, ds, ds);
				} else {
					ctx.fillRect(dh.x - ds / 2, dh.y - ds * 2.2, ds, ds);
					ctx.fillRect(dh.x - ds / 2, dh.y - ds / 2, ds, ds);
					ctx.fillRect(dh.x - ds / 2, dh.y + ds * 1.2, ds, ds);
				}
				ctx.fillStyle = "#3fc6ff";
			}
		}
	}
	ctx.restore();
}
/** Count unique cut marks a knife stroke would make on visible editable paths. */
function knifeCutCount(ax, ay, bx, by, nodes) {
	const preferred = useDesign.getState().selection[0];
	const paths = [];
	for (const n of nodes) {
		if (!n.visible || n.locked) continue;
		const ep = asEditablePath(n);
		if (ep && ep.points.length >= 2) paths.push(ep);
	}
	const ordered = preferred ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) : paths;
	const seen = /* @__PURE__ */ new Set();
	for (const n of ordered) {
		const ep = asEditablePath(n);
		if (!ep) continue;
		const prev = knifeStrokePreview(ep, ax, ay, bx, by);
		for (const m of prev.marks) {
			const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
			seen.add(key);
		}
	}
	return seen.size;
}
function drawKnifeStroke(ctx, stroke, doc, vp, dpr) {
	const { ax, ay, bx, by } = stroke;
	const dist = Math.hypot(bx - ax, by - ay);
	if (dist < 1) return;
	ctx.save();
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.translate(vp.x, vp.y);
	ctx.scale(vp.zoom, vp.zoom);
	ctx.strokeStyle = "#3fc6ff";
	ctx.lineWidth = 1.5 / vp.zoom;
	ctx.setLineDash([6 / vp.zoom, 4 / vp.zoom]);
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.lineTo(bx, by);
	ctx.stroke();
	ctx.setLineDash([]);
	const preferred = useDesign.getState().selection[0];
	const paths = [];
	for (const n of doc.nodes) {
		if (!n.visible || n.locked) continue;
		const p = asEditablePath(n);
		if (p && p.points.length >= 2) paths.push(p);
	}
	const ordered = preferred ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) : paths;
	const marks = [];
	const seen = /* @__PURE__ */ new Set();
	for (const n of ordered) {
		const p = asEditablePath(n);
		if (!p) continue;
		const prev = knifeStrokePreview(p, ax, ay, bx, by);
		for (const m of prev.marks) {
			const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
			if (seen.has(key)) continue;
			seen.add(key);
			marks.push(m);
		}
	}
	const r = 4 / vp.zoom;
	ctx.fillStyle = "#3fc6ff";
	ctx.strokeStyle = "#06170f";
	ctx.lineWidth = 1 / vp.zoom;
	for (const m of marks) {
		ctx.beginPath();
		ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(m.x - r * .7, m.y);
		ctx.lineTo(m.x + r * .7, m.y);
		ctx.moveTo(m.x, m.y - r * .7);
		ctx.lineTo(m.x, m.y + r * .7);
		ctx.stroke();
	}
	ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
	ctx.lineWidth = 1.25 / vp.zoom;
	ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
	const allPieces = [];
	const cutMidX = (ax + bx) / 2;
	const cutMidY = (ay + by) / 2;
	const baseExplode = Math.min(22 / vp.zoom, Math.max(0, dist - 8) * .18);
	for (const n of ordered) {
		const p = asEditablePath(n);
		if (!p) continue;
		const pieces = knifeSplitPieces(p, ax, ay, bx, by);
		for (const piece of pieces) {
			if (piece.length < 2) continue;
			let sx = 0, sy = 0;
			for (const pt of piece) {
				sx += pt.x;
				sy += pt.y;
			}
			const cnt = piece.length;
			const localCx = sx / cnt;
			const localCy = sy / cnt;
			const worldCx = n.x + localCx;
			const worldCy = n.y + localCy;
			const ang = Math.atan2(worldCy - cutMidY, worldCx - cutMidX);
			allPieces.push({
				worldCx,
				worldCy,
				piece,
				nodeX: n.x,
				nodeY: n.y,
				angle: ang
			});
		}
	}
	allPieces.sort((a, b) => a.angle - b.angle);
	const labeled = [];
	allPieces.forEach((info, idx) => {
		const stagger = allPieces.length > 1 ? .65 + .55 * (idx / Math.max(1, allPieces.length - 1)) : 1;
		const explode = baseExplode * stagger;
		let ox = 0, oy = 0;
		if (explode > .5) {
			const dx = info.worldCx - cutMidX;
			const dy = info.worldCy - cutMidY;
			const len = Math.hypot(dx, dy) || 1;
			ox = dx / len * explode;
			oy = dy / len * explode;
		}
		ctx.beginPath();
		const first = info.piece[0];
		ctx.moveTo(info.nodeX + first.x + ox, info.nodeY + first.y + oy);
		for (let i = 1; i < info.piece.length; i++) {
			const pt = info.piece[i];
			ctx.lineTo(info.nodeX + pt.x + ox, info.nodeY + pt.y + oy);
		}
		ctx.stroke();
		labeled.push({
			cx: info.worldCx,
			cy: info.worldCy,
			ox,
			oy,
			label: String(idx + 1)
		});
	});
	ctx.setLineDash([]);
	if (labeled.length > 1) {
		ctx.font = `${Math.max(10, 12 / vp.zoom)}px ui-sans-serif, system-ui, sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		for (const lab of labeled) {
			const lx = lab.cx + lab.ox;
			const ly = lab.cy + lab.oy;
			if (Math.hypot(lab.ox, lab.oy) > 2 / vp.zoom) {
				ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
				ctx.lineWidth = .75 / vp.zoom;
				ctx.setLineDash([2 / vp.zoom, 2 / vp.zoom]);
				ctx.beginPath();
				ctx.moveTo(lab.cx, lab.cy);
				ctx.lineTo(lx, ly);
				ctx.stroke();
				ctx.setLineDash([]);
			}
			const pad = 6 / vp.zoom;
			const bw = ctx.measureText(lab.label).width + pad * 2;
			const bh = 16 / vp.zoom;
			ctx.fillStyle = "rgba(6, 23, 15, 0.88)";
			ctx.strokeStyle = "#3fc6ff";
			ctx.lineWidth = 1.25 / vp.zoom;
			ctx.beginPath();
			ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 4 / vp.zoom);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = "#3fc6ff";
			ctx.beginPath();
			ctx.arc(lx, ly, 1.5 / vp.zoom, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillText(lab.label, lx, ly);
		}
	}
	ctx.restore();
}
function drawKnifeHover(ctx, mark, doc, vp, dpr) {
	ctx.save();
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.translate(vp.x, vp.y);
	ctx.scale(vp.zoom, vp.zoom);
	const r = 5 / vp.zoom;
	ctx.fillStyle = "rgba(63, 198, 255, 0.35)";
	ctx.strokeStyle = "#3fc6ff";
	ctx.lineWidth = 1.25 / vp.zoom;
	ctx.beginPath();
	ctx.arc(mark.x, mark.y, r, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(mark.x - r * .8, mark.y);
	ctx.lineTo(mark.x + r * .8, mark.y);
	ctx.moveTo(mark.x, mark.y - r * .8);
	ctx.lineTo(mark.x, mark.y + r * .8);
	ctx.stroke();
	const preferred = useDesign.getState().selection[0];
	const paths = [];
	for (const n of doc.nodes) {
		if (!n.visible || n.locked) continue;
		const p = asEditablePath(n);
		if (p && p.points.length >= 2) paths.push(p);
	}
	const ordered = preferred ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) : paths;
	ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
	ctx.lineWidth = 1.25 / vp.zoom;
	ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
	const hoverPieces = [];
	for (const n of ordered) {
		const p = asEditablePath(n);
		if (!p) continue;
		const local = pathWorldToLocal(p, mark.x, mark.y);
		const pieces = knifePointSplitPieces(p, local.x, local.y, vp.zoom);
		for (const piece of pieces) {
			if (piece.length < 2) continue;
			let sx = 0, sy = 0;
			for (const pt of piece) {
				sx += pt.x;
				sy += pt.y;
			}
			const cnt = piece.length;
			const worldCx = n.x + sx / cnt;
			const worldCy = n.y + sy / cnt;
			const ang = Math.atan2(worldCy - mark.y, worldCx - mark.x);
			hoverPieces.push({
				worldCx,
				worldCy,
				piece,
				nodeX: n.x,
				nodeY: n.y,
				angle: ang
			});
		}
	}
	hoverPieces.sort((a, b) => a.angle - b.angle);
	const hoverLabeled = [];
	hoverPieces.forEach((info, idx) => {
		const stagger = hoverPieces.length > 1 ? .7 + .5 * (idx / Math.max(1, hoverPieces.length - 1)) : 1;
		let ox = 0, oy = 0;
		if (hoverPieces.length > 1) {
			const dx = info.worldCx - mark.x;
			const dy = info.worldCy - mark.y;
			const len = Math.hypot(dx, dy) || 1;
			const e = 10 / vp.zoom * stagger;
			ox = dx / len * e;
			oy = dy / len * e;
		}
		ctx.beginPath();
		const first = info.piece[0];
		ctx.moveTo(info.nodeX + first.x + ox, info.nodeY + first.y + oy);
		for (let i = 1; i < info.piece.length; i++) {
			const pt = info.piece[i];
			ctx.lineTo(info.nodeX + pt.x + ox, info.nodeY + pt.y + oy);
		}
		ctx.stroke();
		hoverLabeled.push({
			cx: info.worldCx + ox,
			cy: info.worldCy + oy,
			label: String(idx + 1)
		});
	});
	ctx.setLineDash([]);
	if (hoverLabeled.length > 1) {
		ctx.font = `${Math.max(9, 11 / vp.zoom)}px ui-sans-serif, system-ui, sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		for (const lab of hoverLabeled) {
			const pad = 5 / vp.zoom;
			const bw = ctx.measureText(lab.label).width + pad * 2;
			const bh = 14 / vp.zoom;
			ctx.fillStyle = "rgba(6, 23, 15, 0.82)";
			ctx.strokeStyle = "#3fc6ff";
			ctx.lineWidth = 1 / vp.zoom;
			ctx.beginPath();
			ctx.roundRect(lab.cx - bw / 2, lab.cy - bh / 2, bw, bh, 3 / vp.zoom);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = "#3fc6ff";
			ctx.fillText(lab.label, lab.cx, lab.cy);
		}
	}
	ctx.restore();
}
function sanitizeGuideLabel(raw) {
	return raw.replace(/\s+/g, " ").trim().slice(0, 32);
}
function guideDisplayName(g) {
	const named = sanitizeGuideLabel(g.label ?? "");
	if (named) return named;
	return `${g.axis === "x" ? "V" : "H"} ${Number.isFinite(g.pos) ? String(Math.round(g.pos * 10) / 10) : "0"}`;
}
function canDistributeGuides(guides, ids) {
	const pick = ids.length ? new Set(ids) : null;
	for (const axis of ["x", "y"]) if (guides.filter((g) => g.axis === axis && !g.hidden && (!pick || pick.has(g.id))).length >= 3) return true;
	return false;
}
function edges(n) {
	return {
		l: n.x,
		c: n.x + n.w / 2,
		r: n.x + n.w,
		t: n.y,
		m: n.y + n.h / 2,
		b: n.y + n.h
	};
}
function collectGuideTargets(axis, nodes, artboard, extra = []) {
	const targets = axis === "x" ? [
		0,
		artboard.width / 2,
		artboard.width
	] : [
		0,
		artboard.height / 2,
		artboard.height
	];
	for (const n of nodes) {
		if (!n.visible) continue;
		const e = edges(nodeWorldAabb(n));
		if (axis === "x") targets.push(e.l, e.c, e.r);
		else targets.push(e.t, e.m, e.b);
	}
	for (const t of extra) targets.push(t);
	return targets;
}
/**
* Snap a ruler guide to artboard edges/centers and visible object bounds.
* Vertical guides (`x`) lock to left / center / right; horizontal to top / mid / bottom.
*/
function snapGuideToObjects(axis, pos, nodes, artboard, threshold = 8) {
	const targets = collectGuideTargets(axis, nodes, artboard);
	let best = threshold + 1;
	let line = null;
	for (const t of targets) {
		const d = Math.abs(t - pos);
		if (d < best - .01) {
			best = d;
			line = t;
		}
	}
	if (line == null || best > threshold) return {
		pos,
		snapped: false,
		line: null
	};
	return {
		pos: line,
		snapped: true,
		line
	};
}
function nearestSide(pos, targets, side) {
	let best = null;
	let bestD = Infinity;
	for (const t of targets) {
		const d = side === "before" ? pos - t : t - pos;
		if (d <= .05) continue;
		if (d < bestD) {
			bestD = d;
			best = Math.round(d * 10) / 10;
		}
	}
	return best;
}
/** Distances from a live guide to the nearest object / artboard target on each side. */
function guideProbe(axis, pos, nodes, artboard, extra = []) {
	const targets = collectGuideTargets(axis, nodes, artboard, extra);
	return {
		axis,
		pos: Math.round(pos * 10) / 10,
		before: nearestSide(pos, targets, "before"),
		after: nearestSide(pos, targets, "after")
	};
}
function formatGuideProbe(p) {
	const a = p.axis === "x" ? "L" : "T";
	const b = p.axis === "x" ? "R" : "B";
	const left = p.before == null ? `${a} —` : `${a} ${p.before}`;
	const right = p.after == null ? `${b} —` : `${b} ${p.after}`;
	return `${p.pos}  ${left}  ${right}`;
}
/** Consecutive parallel-guide gaps, nearest-neighbour on each axis. */
function guidePairs(guides) {
	const out = [];
	for (const axis of ["x", "y"]) {
		const pos = guides.filter((g) => g.axis === axis).map((g) => g.pos).sort((a, b) => a - b);
		const uniq = [];
		for (const p of pos) if (!uniq.length || Math.abs(p - uniq[uniq.length - 1]) > .05) uniq.push(p);
		for (let i = 0; i < uniq.length - 1; i++) {
			const lo = uniq[i];
			const hi = uniq[i + 1];
			const gap = Math.round((hi - lo) * 10) / 10;
			if (gap > .05) out.push({
				axis,
				lo,
				hi,
				gap
			});
		}
	}
	return out;
}
function formatGuidePair(p) {
	return `${p.axis === "x" ? "V" : "H"} ${p.gap}`;
}
function screenFromDoc(pos, origin, zoom) {
	return origin + pos * zoom;
}
function docFromScreen(screen, origin, zoom) {
	return (screen - origin) / zoom;
}
function hitRulerBand(sx, sy) {
	if (sx < 20 && sy < 20) return null;
	if (sy < 20) return "top";
	if (sx < 20) return "left";
	return null;
}
function hitGuide(doc, viewport, sx, sy, thresh = 5) {
	const guides = doc.guides ?? [];
	let best = null;
	for (const g of guides) {
		const d = g.axis === "x" ? Math.abs(sx - screenFromDoc(g.pos, viewport.x, viewport.zoom)) : Math.abs(sy - screenFromDoc(g.pos, viewport.y, viewport.zoom));
		if (d <= thresh && (!best || d < best.d)) best = {
			...g,
			d
		};
	}
	return best ? {
		id: best.id,
		axis: best.axis,
		pos: best.pos
	} : null;
}
function dropDeletesGuide(sx, sy, w, h) {
	if (sx < 20 || sy < 20) return true;
	if (sx < 0 || sy < 0 || sx > w || sy > h) return true;
	return false;
}
function drawDocGuides(ctx, doc, viewport, w, h, live, probe) {
	const guides = [...doc.guides ?? []];
	if (live) {
		if (live.kind === "move") {
			const i = guides.findIndex((g) => g.id === live.id);
			if (i >= 0) guides[i] = {
				...guides[i],
				pos: live.pos
			};
		} else guides.push({
			id: "live",
			axis: live.axis,
			pos: live.pos
		});
	}
	ctx.save();
	ctx.strokeStyle = "rgba(63,198,255,0.72)";
	ctx.lineWidth = 1;
	ctx.setLineDash([5, 4]);
	for (const g of guides) {
		if (g.hidden) continue;
		ctx.beginPath();
		if (g.axis === "x") {
			const x = screenFromDoc(g.pos, viewport.x, viewport.zoom);
			ctx.moveTo(x, 20);
			ctx.lineTo(x, h);
		} else {
			const y = screenFromDoc(g.pos, viewport.y, viewport.zoom);
			ctx.moveTo(20, y);
			ctx.lineTo(w, y);
		}
		ctx.stroke();
	}
	const pairs = guidePairs(guides);
	ctx.setLineDash([]);
	ctx.strokeStyle = "rgba(63,198,255,0.55)";
	ctx.fillStyle = "rgba(63,198,255,0.88)";
	ctx.lineWidth = 1;
	ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	const livePos = live ? live.pos : null;
	const liveAxis = live ? live.axis : null;
	for (const pair of pairs) {
		const hot = liveAxis === pair.axis && livePos != null && (Math.abs(livePos - pair.lo) < .2 || Math.abs(livePos - pair.hi) < .2);
		ctx.strokeStyle = hot ? "rgba(196,255,77,0.7)" : "rgba(63,198,255,0.45)";
		ctx.fillStyle = hot ? "rgba(196,255,77,0.95)" : "rgba(63,198,255,0.88)";
		const mid = (pair.lo + pair.hi) / 2;
		const tick = 6;
		if (pair.axis === "x") {
			const x0 = screenFromDoc(pair.lo, viewport.x, viewport.zoom);
			const x1 = screenFromDoc(pair.hi, viewport.x, viewport.zoom);
			const y = Math.max(48, Math.min(h - 36, h * .12));
			ctx.beginPath();
			ctx.moveTo(x0, y - tick);
			ctx.lineTo(x0, y + tick);
			ctx.moveTo(x1, y - tick);
			ctx.lineTo(x1, y + tick);
			ctx.moveTo(x0, y);
			ctx.lineTo(x1, y);
			ctx.stroke();
			const label = String(pair.gap);
			const tw = ctx.measureText(label).width;
			const cx = screenFromDoc(mid, viewport.x, viewport.zoom);
			ctx.fillStyle = "rgba(12,16,14,0.82)";
			ctx.fillRect(cx - tw / 2 - 4, y - 8, tw + 8, 16);
			ctx.fillStyle = hot ? "rgba(196,255,77,0.95)" : "rgba(63,198,255,0.92)";
			ctx.fillText(label, cx, y);
		} else {
			const y0 = screenFromDoc(pair.lo, viewport.y, viewport.zoom);
			const y1 = screenFromDoc(pair.hi, viewport.y, viewport.zoom);
			const x = Math.max(48, Math.min(w - 48, w * .12));
			ctx.beginPath();
			ctx.moveTo(x - tick, y0);
			ctx.lineTo(x + tick, y0);
			ctx.moveTo(x - tick, y1);
			ctx.lineTo(x + tick, y1);
			ctx.moveTo(x, y0);
			ctx.lineTo(x, y1);
			ctx.stroke();
			const label = String(pair.gap);
			const tw = ctx.measureText(label).width;
			const cy = screenFromDoc(mid, viewport.y, viewport.zoom);
			ctx.fillStyle = "rgba(12,16,14,0.82)";
			ctx.fillRect(x - tw / 2 - 4, cy - 8, tw + 8, 16);
			ctx.fillStyle = hot ? "rgba(196,255,77,0.95)" : "rgba(63,198,255,0.92)";
			ctx.fillText(label, x, cy);
		}
	}
	if (live && probe) {
		const label = formatGuideProbe(probe);
		ctx.setLineDash([]);
		ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
		ctx.textBaseline = "middle";
		const padX = 6;
		const boxH = 16;
		const tw = ctx.measureText(label).width;
		if (live.axis === "x") {
			const x = screenFromDoc(live.pos, viewport.x, viewport.zoom);
			const y = Math.max(38, Math.min(h - 24, h * .18));
			ctx.fillStyle = "rgba(12,16,14,0.86)";
			ctx.fillRect(x + 6, y - boxH / 2, tw + 12, boxH);
			ctx.fillStyle = "rgba(63,198,255,0.95)";
			ctx.textAlign = "left";
			ctx.fillText(label, x + 6 + padX, y);
		} else {
			const y = screenFromDoc(live.pos, viewport.y, viewport.zoom);
			const x = Math.max(38, Math.min(w - tw - 20, w * .18));
			ctx.fillStyle = "rgba(12,16,14,0.86)";
			ctx.fillRect(x, y - boxH - 6, tw + 12, boxH);
			ctx.fillStyle = "rgba(63,198,255,0.95)";
			ctx.textAlign = "left";
			ctx.fillText(label, x + padX, y - boxH / 2 - 6);
		}
	}
	ctx.restore();
}
function drawRulers(ctx, doc, viewport, w, h) {
	const zoom = viewport.zoom || 1;
	ctx.save();
	ctx.fillStyle = "#121614";
	ctx.fillRect(0, 0, w, 20);
	ctx.fillRect(0, 0, 20, h);
	ctx.strokeStyle = "rgba(196,255,77,0.22)";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(0, 19.5);
	ctx.lineTo(w, 19.5);
	ctx.moveTo(19.5, 0);
	ctx.lineTo(19.5, h);
	ctx.stroke();
	ctx.fillStyle = "rgba(196,255,77,0.55)";
	ctx.strokeStyle = "rgba(196,255,77,0.35)";
	ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
	ctx.textBaseline = "top";
	const step = tickStep(zoom);
	const aw = doc.artboard.width;
	const ah = doc.artboard.height;
	const x0 = Math.floor(docFromScreen(20, viewport.x, zoom) / step) * step;
	const x1 = docFromScreen(w, viewport.x, zoom);
	for (let v = x0; v <= x1 + step; v += step) {
		const sx = screenFromDoc(v, viewport.x, zoom);
		if (sx < 20) continue;
		const major = Math.abs(v % (step * 5)) < .001 || Math.abs(v) < .001;
		ctx.beginPath();
		ctx.moveTo(sx + .5, major ? 4 : 10);
		ctx.lineTo(sx + .5, 20);
		ctx.stroke();
		if (major && v >= -.5 && v <= aw + .5) ctx.fillText(String(Math.round(v)), sx + 2, 3);
	}
	ctx.textAlign = "right";
	const y0 = Math.floor(docFromScreen(20, viewport.y, zoom) / step) * step;
	const y1 = docFromScreen(h, viewport.y, zoom);
	for (let v = y0; v <= y1 + step; v += step) {
		const sy = screenFromDoc(v, viewport.y, zoom);
		if (sy < 20) continue;
		const major = Math.abs(v % (step * 5)) < .001 || Math.abs(v) < .001;
		ctx.beginPath();
		ctx.moveTo(major ? 4 : 10, sy + .5);
		ctx.lineTo(20, sy + .5);
		ctx.stroke();
		if (major && v >= -.5 && v <= ah + .5) {
			ctx.save();
			ctx.translate(17, sy + 2);
			ctx.rotate(-Math.PI / 2);
			ctx.textAlign = "left";
			ctx.fillText(String(Math.round(v)), 0, 0);
			ctx.restore();
		}
	}
	drawGuideRulerLabels(ctx, doc.guides ?? [], viewport, w, h);
	ctx.fillStyle = "#0c100e";
	ctx.fillRect(0, 0, 20, 20);
	ctx.strokeStyle = "rgba(196,255,77,0.28)";
	ctx.strokeRect(.5, .5, 19, 19);
	ctx.restore();
}
/** Named (or V/H + pos) captions on the ruler ticks that own each guide. */
function drawGuideRulerLabels(ctx, guides, viewport, w, h) {
	ctx.save();
	ctx.font = "8px ui-monospace, SFMono-Regular, Menlo, monospace";
	ctx.textBaseline = "middle";
	for (const g of guides) {
		if (g.hidden) continue;
		const name = guideDisplayName(g);
		if (g.axis === "x") {
			const sx = screenFromDoc(g.pos, viewport.x, viewport.zoom);
			if (sx < 22 || sx > w - 2) continue;
			ctx.fillStyle = "rgba(63,198,255,0.95)";
			ctx.beginPath();
			ctx.moveTo(sx + .5, 1);
			ctx.lineTo(sx + .5, 20);
			ctx.strokeStyle = "rgba(63,198,255,0.85)";
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.textAlign = "left";
			const tw = Math.min(ctx.measureText(name).width, 72);
			const lx = Math.min(sx + 3, w - tw - 2);
			ctx.fillStyle = "rgba(12,16,14,0.78)";
			ctx.fillRect(lx - 1, 2, tw + 3, 16);
			ctx.fillStyle = "rgba(63,198,255,0.95)";
			ctx.fillText(name, lx, 10, 72);
		} else {
			const sy = screenFromDoc(g.pos, viewport.y, viewport.zoom);
			if (sy < 22 || sy > h - 2) continue;
			ctx.strokeStyle = "rgba(158,231,255,0.85)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(1, sy + .5);
			ctx.lineTo(20, sy + .5);
			ctx.stroke();
			ctx.save();
			ctx.translate(10, sy - 3);
			ctx.rotate(-Math.PI / 2);
			ctx.textAlign = "left";
			const tw = Math.min(ctx.measureText(name).width, 72);
			ctx.fillStyle = "rgba(12,16,14,0.78)";
			ctx.fillRect(-1, -6, tw + 3, 12);
			ctx.fillStyle = "rgba(158,231,255,0.95)";
			ctx.fillText(name, 0, 0, 72);
			ctx.restore();
		}
	}
	ctx.restore();
}
function tickStep(zoom) {
	const raw = 50 / zoom;
	const mag = Math.pow(10, Math.floor(Math.log10(raw)));
	const n = raw / mag;
	if (n < 2) return mag;
	if (n < 5) return 2 * mag;
	return 5 * mag;
}
function RulerLayer() {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	const drag = (0, import_react.useRef)(null);
	const doc = useDesign((s) => s.doc);
	useDesign((s) => s.viewport);
	const rulers = useDesign((s) => s.rulers);
	const present = useDesign((s) => s.present);
	useDesign((s) => s.guideSelection);
	useDesign((s) => s.guideLooks);
	useDesign((s) => s.guideDashPreview);
	function paint() {
		const wrap = wrapRef.current;
		const canvas = canvasRef.current;
		const s = useDesign.getState();
		if (!wrap || !canvas || !s.doc || s.present) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const w = wrap.clientWidth;
		const h = wrap.clientHeight;
		if (w < 8 || h < 8) return;
		canvas.width = Math.floor(w * dpr);
		canvas.height = Math.floor(h * dpr);
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		drawDocGuides(ctx, s.doc, s.viewport, w, h, drag.current, s.guideProbe);
		if (s.rulers) drawRulers(ctx, s.doc, s.viewport, w, h);
	}
	(0, import_react.useEffect)(() => {
		paint();
	});
	(0, import_react.useEffect)(() => {
		if (present) return;
		function loc(e) {
			const wrap = wrapRef.current;
			if (!wrap) return {
				x: 0,
				y: 0,
				w: 0,
				h: 0
			};
			const r = wrap.getBoundingClientRect();
			return {
				x: e.clientX - r.left,
				y: e.clientY - r.top,
				w: r.width,
				h: r.height
			};
		}
		function onDown(e) {
			if (e.button !== 0) return;
			const s = useDesign.getState();
			if (!s.rulers || !s.doc || s.present) return;
			const sc = loc(e);
			const existing = hitGuide(s.doc, s.viewport, sc.x, sc.y);
			const band = hitRulerBand(sc.x, sc.y);
			if (!existing && !band) return;
			e.preventDefault();
			if (existing) {
				s.selectGuides([existing.id], e.shiftKey);
				drag.current = {
					kind: "move",
					id: existing.id,
					axis: existing.axis,
					pos: existing.pos
				};
			} else if (band === "top") drag.current = {
				kind: "new",
				axis: "y",
				pos: docFromScreen(sc.y, s.viewport.y, s.viewport.zoom)
			};
			else drag.current = {
				kind: "new",
				axis: "x",
				pos: docFromScreen(sc.x, s.viewport.x, s.viewport.zoom)
			};
			paint();
		}
		function onMove(e) {
			const live = drag.current;
			if (!live) return;
			const sc = loc(e);
			const s = useDesign.getState();
			let pos = live.axis === "x" ? docFromScreen(sc.x, s.viewport.x, s.viewport.zoom) : docFromScreen(sc.y, s.viewport.y, s.viewport.zoom);
			if (s.snap && !e.altKey && s.doc) pos = snapGuideToObjects(live.axis, pos, s.doc.nodes, s.doc.artboard).pos;
			live.pos = pos;
			if (s.doc) {
				const others = (s.doc.guides ?? []).filter((g) => g.axis === live.axis && (live.kind === "new" || g.id !== live.id)).map((g) => g.pos);
				s.setGuideProbe(guideProbe(live.axis, pos, s.doc.nodes, s.doc.artboard, others));
			}
			paint();
		}
		function onUp(e) {
			const live = drag.current;
			if (!live) return;
			const s = useDesign.getState();
			const sc = loc(e);
			const kill = dropDeletesGuide(sc.x, sc.y, sc.w, sc.h);
			if (live.kind === "new") {
				if (!kill) s.addGuide(live.axis, Math.round(live.pos));
			} else if (kill) s.removeGuide(live.id);
			else s.moveGuide(live.id, Math.round(live.pos));
			drag.current = null;
			s.setGuideProbe(null);
			paint();
		}
		window.addEventListener("pointerdown", onDown, true);
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
		return () => {
			window.removeEventListener("pointerdown", onDown, true);
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
		};
	}, [present, rulers]);
	if (present || !doc) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "pointer-events-none absolute inset-0 z-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "absolute inset-0"
		})
	});
}
/** Selected unlocked layers, skipping anything nested inside another selection. */
function alignRoots(nodes, ids) {
	const set = new Set(ids);
	const byId = new Map(nodes.map((n) => [n.id, n]));
	const roots = [];
	for (const id of ids) {
		const n = byId.get(id);
		if (!n || n.locked) continue;
		let parent = n.parentId;
		let nested = false;
		while (parent) {
			if (set.has(parent)) {
				nested = true;
				break;
			}
			parent = byId.get(parent)?.parentId;
		}
		if (!nested) roots.push(n);
	}
	return roots;
}
/** Last selected unlocked root is the key. Nested picks fall back to their root. */
function alignKey(nodes, ids) {
	const roots = alignRoots(nodes, ids);
	if (roots.length < 2) return null;
	const rootIds = new Set(roots.map((n) => n.id));
	for (let i = ids.length - 1; i >= 0; i--) {
		const id = ids[i];
		if (!id) continue;
		if (rootIds.has(id)) return roots.find((n) => n.id === id) ?? null;
	}
	return roots[roots.length - 1] ?? null;
}
function edgeOffset(box, key, edge) {
	if (edge === "left") return {
		dx: key.x - box.x,
		dy: 0
	};
	if (edge === "center") return {
		dx: key.x + key.w / 2 - (box.x + box.w / 2),
		dy: 0
	};
	if (edge === "right") return {
		dx: key.x + key.w - (box.x + box.w),
		dy: 0
	};
	if (edge === "top") return {
		dx: 0,
		dy: key.y - box.y
	};
	if (edge === "middle") return {
		dx: 0,
		dy: key.y + key.h / 2 - (box.y + box.h / 2)
	};
	return {
		dx: 0,
		dy: key.y + key.h - (box.y + box.h)
	};
}
function edgeAt(key, edge) {
	if (edge === "left") return key.x;
	if (edge === "center") return key.x + key.w / 2;
	if (edge === "right") return key.x + key.w;
	if (edge === "top") return key.y;
	if (edge === "middle") return key.y + key.h / 2;
	return key.y + key.h;
}
/**
* Align unlocked roots to the key object's edge. The key stays.
* Returns null until two unlocked roots can share that edge.
*/
function planAlign(nodes, ids, edge) {
	const roots = alignRoots(nodes, ids);
	const key = alignKey(nodes, ids);
	if (!key || roots.length < 2) return null;
	const keyBox = geometryBox(key);
	const deltas = [];
	const ghosts = [];
	let from = Infinity;
	let to = -Infinity;
	const vertical = edge === "left" || edge === "center" || edge === "right";
	for (const n of roots) {
		const box = geometryBox(n);
		const stay = n.id === key.id;
		const { dx, dy } = stay ? {
			dx: 0,
			dy: 0
		} : edgeOffset(box, keyBox, edge);
		deltas.push({
			id: n.id,
			dx,
			dy
		});
		const ghost = {
			x: box.x + dx,
			y: box.y + dy,
			w: box.w,
			h: box.h,
			stay
		};
		ghosts.push(ghost);
		if (vertical) {
			from = Math.min(from, ghost.y);
			to = Math.max(to, ghost.y + ghost.h);
		} else {
			from = Math.min(from, ghost.x);
			to = Math.max(to, ghost.x + ghost.w);
		}
	}
	if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
	return {
		edge,
		target: "key",
		keyId: key.id,
		keyName: key.name?.trim() || "key",
		ids: roots.map((n) => n.id),
		deltas,
		ghosts,
		edgeLine: {
			axis: vertical ? "x" : "y",
			at: edgeAt(keyBox, edge),
			from,
			to
		}
	};
}
/**
* Align unlocked roots to an artboard edge. Layers already on that edge stay.
* One unlocked layer is enough. Groups move with their children on commit.
*/
function planAlignBoard(nodes, ids, edge, board) {
	const roots = alignRoots(nodes, ids);
	if (!roots.length || board.width <= 0 || board.height <= 0) return null;
	const frame = {
		x: 0,
		y: 0,
		w: board.width,
		h: board.height
	};
	const deltas = [];
	const ghosts = [];
	const vertical = edge === "left" || edge === "center" || edge === "right";
	for (const n of roots) {
		const box = geometryBox(n);
		const { dx, dy } = edgeOffset(box, frame, edge);
		deltas.push({
			id: n.id,
			dx,
			dy
		});
		ghosts.push({
			x: box.x + dx,
			y: box.y + dy,
			w: box.w,
			h: box.h,
			stay: dx === 0 && dy === 0
		});
	}
	const from = vertical ? 0 : 0;
	const to = vertical ? board.height : board.width;
	return {
		edge,
		target: "board",
		keyId: "artboard",
		keyName: "board",
		ids: roots.map((n) => n.id),
		deltas,
		ghosts,
		edgeLine: {
			axis: vertical ? "x" : "y",
			at: edgeAt(frame, edge),
			from,
			to
		}
	};
}
function applyAlign(nodes, plan) {
	const byId = new Map(nodes.map((n) => [n.id, n]));
	const places = plan.deltas.map((d) => {
		const n = byId.get(d.id);
		if (!n || !d.dx && !d.dy) return null;
		return {
			id: d.id,
			x: n.x + d.dx,
			y: n.y + d.dy
		};
	}).filter((p) => Boolean(p));
	if (!places.length) return nodes;
	const expanded = expandMovePlaces(nodes, places);
	const map = new Map(expanded.map((p) => [p.id, p]));
	return nodes.map((n) => {
		const p = map.get(n.id);
		return p ? {
			...n,
			x: p.x,
			y: p.y
		} : n;
	});
}
function alignMoveCount(plan) {
	return plan.deltas.filter((d) => d.dx || d.dy).length;
}
/** Layers that shift under an armed align preview. Stay rows stay unmarked. */
function alignPreviewMoverIds(plan) {
	return plan.deltas.filter((_, i) => plan.ghosts[i] && !plan.ghosts[i].stay).map((d) => d.id);
}
function alignEdgeChipLabel(plan) {
	const raw = plan.target === "board" ? "board" : plan.keyName.trim() || "key";
	const who = raw.length > 16 ? `${raw.slice(0, 15)}…` : raw;
	return `${plan.edge} · ${who}`;
}
/** Solid-beat lead shared by the status strip, inspector line, and mover rows. */
function alignCommitSolidLead(chipLabel, moveCount) {
	return `${chipLabel} · ${moveCount} move`;
}
/**
* Fade append shared by the status strip, inspector line, and mover rows.
* Keeps the solid lead in front, then names the cropped pill and the same
* move count (left · key · 2 move · fade left · poster title… · 2 move).
*/
function alignCommitFadeAppend(pill, moveCount) {
	return `fade ${pill} · ${moveCount} move`;
}
/**
* Inspector and layers fade line. Keeps the solid lead and appends the cropped
* pill with the same move count the status strip shows
* (left · key · 2 move · fade left · poster title… · 2 move).
*/
function alignCommitLayerFadeLine(chipLabel, pill, moveCount) {
	return `${alignCommitSolidLead(chipLabel, moveCount)} · ${alignCommitFadeAppend(pill, moveCount)}`;
}
var preview = null;
var listeners$1 = /* @__PURE__ */ new Set();
var TARGET_KEY = "voice-design.align-target";
var alignTarget = "key";
var targetListeners = /* @__PURE__ */ new Set();
function readStoredTarget() {
	try {
		return localStorage.getItem(TARGET_KEY) === "board" ? "board" : "key";
	} catch {
		return "key";
	}
}
if (typeof localStorage !== "undefined") alignTarget = readStoredTarget();
/** Key object or artboard. The same edge row reads this chip. */
function getAlignTarget() {
	return alignTarget;
}
function setAlignTarget(next) {
	if (alignTarget === next) return;
	alignTarget = next;
	try {
		localStorage.setItem(TARGET_KEY, next);
	} catch {}
	for (const fn of targetListeners) fn();
}
function subscribeAlignTarget(fn) {
	targetListeners.add(fn);
	return () => targetListeners.delete(fn);
}
function emit() {
	for (const fn of listeners$1) fn();
}
function getAlignPreview() {
	return preview;
}
function subscribeAlignPreview(fn) {
	listeners$1.add(fn);
	return () => listeners$1.delete(fn);
}
function clearAlignPreview(silent = false) {
	if (!preview && silent) return;
	preview = null;
	emit();
	if (!silent) releaseStudioStatus();
}
function armAlignPreview(edge, target = "key") {
	const doc = useDesign.getState().doc;
	const selection = useDesign.getState().selection;
	if (!doc) return null;
	const plan = target === "board" ? planAlignBoard(doc.nodes, selection, edge, doc.artboard) : planAlign(doc.nodes, selection, edge);
	if (!plan) {
		preview = null;
		emit();
		holdStudioStatus(target === "board" ? "Align to board needs an unlocked layer" : "Align needs two unlocked layers");
		return null;
	}
	preview = plan;
	emit();
	clearAlignCommitEcho();
	const stay = plan.ghosts.filter((g) => g.stay).length;
	const where = plan.target === "board" ? "board edge" : `${plan.keyName} stays`;
	const chip = alignEdgeChipLabel(plan);
	holdStudioStatus(`Align preview · ${plan.target} · ${plan.edge} edge · ${where} · ${stay} stay · ${alignMoveCount(plan)} move · strip reads ${chip} · edge caption if chip crops names key or board · Enter commits`);
	return plan;
}
/**
* Short matched-edge tick for the commit beat. Spans the movers only,
* so the rail still shows which edge landed without redrawing the board line.
*/
function placeAlignCommitEdgeTick(boxes, edge) {
	const vertical = edge === "left" || edge === "center" || edge === "right";
	let from = Infinity;
	let to = -Infinity;
	let at = 0;
	for (const box of boxes) {
		if (edge === "left") at = box.x;
		else if (edge === "right") at = box.x + box.w;
		else if (edge === "center") at = box.x + box.w / 2;
		else if (edge === "top") at = box.y;
		else if (edge === "bottom") at = box.y + box.h;
		else at = box.y + box.h / 2;
		if (vertical) {
			from = Math.min(from, box.y);
			to = Math.max(to, box.y + box.h);
		} else {
			from = Math.min(from, box.x);
			to = Math.max(to, box.x + box.w);
		}
	}
	return {
		axis: vertical ? "x" : "y",
		at,
		from,
		to
	};
}
var ALIGN_ECHO_MS = 1200;
var echo = null;
var echoTimer = null;
var echoListeners = /* @__PURE__ */ new Set();
function emitEcho() {
	for (const fn of echoListeners) fn();
}
function getAlignCommitEcho() {
	return echo;
}
function subscribeAlignCommitEcho(fn) {
	echoListeners.add(fn);
	return () => echoListeners.delete(fn);
}
function clearAlignCommitEcho() {
	if (echoTimer) clearTimeout(echoTimer);
	echoTimer = null;
	if (!echo) return;
	const held = echo.status;
	echo = null;
	emitEcho();
	if (held && getStudioStatus() === held) releaseStudioStatus();
}
/** Hold the edge name on boxes that moved so the commit matches the stay stamp. */
function settleAlignCommitEcho() {
	const held = echo?.status;
	echo = null;
	echoTimer = null;
	emitEcho();
	if (held && getStudioStatus() === held) releaseStudioStatus();
}
function holdAlignCommitEcho(plan) {
	const boxes = plan.ghosts.filter((g) => !g.stay).map((g) => ({
		x: g.x,
		y: g.y,
		w: g.w,
		h: g.h
	}));
	if (!boxes.length) {
		clearAlignCommitEcho();
		return;
	}
	const moved = boxes.length;
	const chipLabel = alignEdgeChipLabel(plan);
	const baseStatus = `${alignCommitSolidLead(chipLabel, moved)} · Aligned · strip reads ${chipLabel} · ${plan.edge} stamp holds on ${moved} moved · edge tick fades with it · caption if stamp crops names key or board and fades with the stamp`;
	const born = Date.now();
	const moverIds = alignPreviewMoverIds(plan);
	echo = {
		edge: plan.edge,
		boxes,
		edgeTick: placeAlignCommitEdgeTick(boxes, plan.edge),
		chipLabel,
		moveCount: boxes.length,
		fadePill: null,
		moverIds,
		born,
		until: born + ALIGN_ECHO_MS,
		tick: 0,
		baseStatus,
		status: baseStatus
	};
	emitEcho();
	if (echoTimer) clearTimeout(echoTimer);
	const step = () => {
		if (!echo) return;
		if (Date.now() >= echo.until) {
			settleAlignCommitEcho();
			return;
		}
		echo = {
			...echo,
			tick: echo.tick + 1
		};
		emitEcho();
		echoTimer = setTimeout(step, 50);
	};
	echoTimer = setTimeout(step, 50);
}
function commitAlignPreview() {
	const plan = preview;
	const doc = useDesign.getState().doc;
	if (!plan || !doc) return false;
	const next = applyAlign(doc.nodes, plan);
	useDesign.getState().commit();
	useDesign.setState({
		doc: {
			...doc,
			nodes: next
		},
		dirty: true
	});
	preview = null;
	emit();
	holdAlignCommitEcho(plan);
	const moved = plan.ghosts.filter((g) => !g.stay).length;
	const chip = alignEdgeChipLabel(plan);
	holdStudioStatus(moved ? echo?.status ?? `${alignCommitSolidLead(chip, moved)} · Aligned · strip reads ${chip} · ${plan.edge} stamp holds on ${moved} moved · edge tick fades with it` : `${alignCommitSolidLead(chip, moved)} · Aligned · strip reads ${chip}`);
	return true;
}
var KEY = "voice-design.inspector-rail";
var rail = false;
var listeners = /* @__PURE__ */ new Set();
function readStored() {
	try {
		return localStorage.getItem(KEY) === "1";
	} catch {
		return false;
	}
}
if (typeof localStorage !== "undefined") rail = readStored();
/** Inspector collapsed to a rail. Equal-gap size then lives on the canvas tick. */
function getInspectorRail() {
	return rail;
}
function setInspectorRail(next) {
	if (rail === next) return;
	rail = next;
	try {
		localStorage.setItem(KEY, next ? "1" : "0");
	} catch {}
	for (const fn of listeners) fn();
}
function subscribeInspectorRail(fn) {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}
/**
* Compute the next value for a phosphor fill range from keyboard.
* Home → min, End → max, PageUp/PageDown → ~10% of the range (snapped to step).
* Returns null if the key is not handled.
*/
function nextFromRangeKey(e, value, min, max, step = 1) {
	if (e.key === "Home") {
		e.preventDefault();
		return min;
	}
	if (e.key === "End") {
		e.preventDefault();
		return max;
	}
	if (e.key === "PageUp" || e.key === "PageDown") {
		e.preventDefault();
		let next = value + (e.key === "PageUp" ? 1 : -1) * Math.max(step, (max - min) * .1);
		next = min + Math.round((next - min) / step) * step;
		return Math.min(max, Math.max(min, next));
	}
	return null;
}
function FillEditor({ node }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const fill = node.fill;
	const gradient = isGradient(fill);
	function toggle() {
		if (gradient) updateNodes([node.id], { fill: fill.stops[0]?.color ?? "#d9f5e3" }, true);
		else {
			const c = typeof fill === "string" && fill !== "transparent" ? fill : "#3fc6ff";
			updateNodes([node.id], { fill: {
				type: "linear",
				angle: 180,
				stops: [{
					offset: 0,
					color: c
				}, {
					offset: 1,
					color: "#0a0d0c"
				}]
			} }, true);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[11px] text-ink-dim",
				children: "Fill"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-[10px] text-phosphor",
				onClick: toggle,
				children: gradient ? "Solid" : "Gradient"
			})]
		}),
		!gradient && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "color",
			className: "h-8 w-full rounded-[8px] border border-border",
			value: typeof fill === "string" && fill !== "transparent" ? fill : "#d9f5e3",
			onChange: (e) => updateNodes([node.id], { fill: e.target.value }, true)
		}),
		gradient && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `Angle ${fill.angle}°`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: "range-phosphor w-full",
					min: 0,
					max: 360,
					value: fill.angle,
					onChange: (e) => updateNodes([node.id], { fill: {
						...fill,
						angle: Number(e.target.value)
					} }, false)
				})
			}), fill.stops.map((stop, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "color",
					className: "h-8 w-12 rounded-[8px] border border-border",
					value: stop.color,
					onChange: (e) => {
						const stops = fill.stops.map((s, j) => j === i ? {
							...s,
							color: e.target.value
						} : s);
						updateNodes([node.id], { fill: {
							...fill,
							stops
						} }, true);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: "range-phosphor flex-1",
					min: 0,
					max: 1,
					step: .01,
					value: stop.offset,
					onChange: (e) => {
						const stops = fill.stops.map((s, j) => j === i ? {
							...s,
							offset: Number(e.target.value)
						} : s);
						updateNodes([node.id], { fill: {
							...fill,
							stops
						} }, false);
					}
				})]
			}, i))]
		})
	] });
}
function ShadowEditor({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const mapNodes = useDesign((s) => s.mapNodes);
	const commit = () => useDesign.getState().commit();
	const node = nodes[nodes.length - 1];
	if (!node) return null;
	const ids = nodes.map((n) => n.id);
	const multi = nodes.length > 1;
	const sh = node.shadow;
	const ghost = sh ?? DEFAULT_SHADOW;
	const inset = shadowInset(sh);
	const spread = shadowSpread(sh);
	const mixedOn = multi && new Set(nodes.map((n) => Boolean(n.shadow))).size > 1;
	const mixedColor = multi && new Set(nodes.map((n) => n.shadow?.color ?? DEFAULT_SHADOW.color)).size > 1;
	const mixedBlur = multi && new Set(nodes.map((n) => n.shadow?.blur ?? DEFAULT_SHADOW.blur)).size > 1;
	const mixedOx = multi && new Set(nodes.map((n) => n.shadow?.ox ?? DEFAULT_SHADOW.ox)).size > 1;
	const mixedOy = multi && new Set(nodes.map((n) => n.shadow?.oy ?? DEFAULT_SHADOW.oy)).size > 1;
	const mixedSpread = multi && new Set(nodes.map((n) => shadowSpread(n.shadow))).size > 1;
	const mixedInset = multi && new Set(nodes.map((n) => shadowInset(n.shadow))).size > 1;
	const anyOn = nodes.some((n) => n.shadow);
	function stampAll(map, commitNow = false) {
		mapNodes(ids, (layer) => ({
			...layer,
			shadow: map(layer.shadow)
		}), commitNow);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[11px] text-ink-dim",
			children: mixedOn ? "Shadow · mixed" : sh ? inset ? "Shadow · inset" : "Shadow · drop" : "Shadow off"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [(sh || mixedOn) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": "true",
				title: inset ? "Inset preview" : "Drop preview",
				className: "inline-block size-7 shrink-0 rounded-[6px] border border-border bg-surface-alt",
				"data-shadow-preview": inset ? "inset" : "drop",
				style: { boxShadow: shadowPreviewCss(ghost) }
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-[10px] text-phosphor",
				onClick: () => updateNodes(ids, { shadow: anyOn ? null : { ...DEFAULT_SHADOW } }, true),
				children: anyOn ? "Clear" : "Add"
			})]
		})]
	}), (sh || multi) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 flex flex-col gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedColor ? "Colour · mixed" : "Colour",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "color",
					className: cn("h-8 w-full rounded-[8px] border border-border", mixedColor && "opacity-70"),
					value: ghost.color,
					"aria-label": mixedColor ? "layer shadow colour mixed" : "layer shadow colour",
					onChange: (e) => stampAll((cur) => stampShadowColor(cur, e.target.value)),
					onPointerUp: commit
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedBlur ? "Blur · mixed" : `Blur ${ghost.blur}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: cn("range-phosphor w-full", mixedBlur && "opacity-70"),
					"data-fill-range": "shadow-blur",
					style: { "--fill-percent": String(Math.max(0, Math.min(1, (mixedBlur ? 0 : ghost.blur) / 80))) },
					min: 0,
					max: 80,
					value: mixedBlur ? 0 : ghost.blur,
					"aria-label": mixedBlur ? "layer shadow blur mixed" : "layer shadow blur",
					onChange: (e) => stampAll((cur) => stampShadowBlur(cur, Number(e.target.value))),
					onPointerUp: commit,
					onKeyDown: (e) => {
						const next = nextFromRangeKey(e, mixedBlur ? 0 : ghost.blur, 0, 80, 1);
						if (next != null) {
							stampAll((cur) => stampShadowBlur(cur, next));
							commit();
						}
					}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedOx ? "X · mixed" : `X ${ghost.ox}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: cn("range-phosphor w-full", mixedOx && "opacity-70"),
					min: -40,
					max: 40,
					value: mixedOx ? 0 : ghost.ox,
					"aria-label": mixedOx ? "layer shadow x mixed" : "layer shadow x",
					onChange: (e) => stampAll((cur) => stampShadowOx(cur, Number(e.target.value))),
					onPointerUp: commit
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedOy ? "Y · mixed" : `Y ${ghost.oy}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: cn("range-phosphor w-full", mixedOy && "opacity-70"),
					min: -40,
					max: 40,
					value: mixedOy ? 0 : ghost.oy,
					"aria-label": mixedOy ? "layer shadow y mixed" : "layer shadow y",
					onChange: (e) => stampAll((cur) => stampShadowOy(cur, Number(e.target.value))),
					onPointerUp: commit
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedSpread ? "Spread · mixed" : `Spread ${spread}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: cn("range-phosphor w-full", mixedSpread && "opacity-70"),
					min: 0,
					max: 40,
					value: mixedSpread ? 0 : spread,
					"aria-label": mixedSpread ? "layer shadow spread mixed" : "layer shadow spread",
					onChange: (e) => stampAll((cur) => stampShadowSpread(cur, Number(e.target.value))),
					onPointerUp: commit
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedInset ? "Inset · mixed" : inset ? "Inset" : "Drop",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 text-[11px] text-ink-dim",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: mixedInset ? false : inset,
						"aria-label": mixedInset ? "layer shadow inset mixed" : "layer shadow inset",
						onChange: (e) => stampAll((cur) => stampShadowInset(cur, e.target.checked), true)
					}), "Inset"]
				})
			})
		]
	})] });
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-[11px] text-ink-dim",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block",
			children: label
		}), children]
	});
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border-b border-border py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-2",
			children
		})]
	});
}
function Swatches({ colors, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1.5",
		children: colors.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "size-6 rounded-full border border-border",
			style: { background: c.hex },
			onClick: () => onPick(c.hex),
			"aria-label": c.name,
			title: c.name
		}, c.hex))
	});
}
var FILTERS = [
	{
		key: "brightness",
		label: "Brightness",
		min: 0,
		max: 2,
		step: .01
	},
	{
		key: "contrast",
		label: "Contrast",
		min: 0,
		max: 2,
		step: .01
	},
	{
		key: "saturate",
		label: "Saturate",
		min: 0,
		max: 2,
		step: .01
	},
	{
		key: "blur",
		label: "Blur",
		min: 0,
		max: 24,
		step: .25
	}
];
function patchImage(id, patch, commit = false) {
	const state = useDesign.getState();
	const doc = state.doc;
	if (!doc) return;
	if (commit) state.commit();
	useDesign.setState({
		doc: {
			...doc,
			nodes: doc.nodes.map((n) => n.id === id && (n.kind === "image" || n.kind === "paint") ? {
				...n,
				...patch
			} : n)
		},
		dirty: true
	});
}
function ImageAdjust({ node }) {
	if (node.kind !== "image" && node.kind !== "paint") return null;
	const img = node;
	const filters = normalizeFilters(img.filters);
	const crop = normalizeCrop(img.crop) ?? {
		x: 0,
		y: 0,
		w: 1,
		h: 1
	};
	const css = cssFilterStyle(filters);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-2 border-b border-border px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] uppercase tracking-wide text-ink-faint",
				children: "Photo"
			}),
			FILTERS.map((f) => {
				const value = filters[f.key];
				const shown = f.key === "blur" ? value : Math.round(value * 100);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: `${f.label} ${shown}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor w-full",
						"data-fill-range": "photo",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (value - f.min) / (f.max - f.min || 1)))) },
						min: f.min,
						max: f.max,
						step: f.step,
						"aria-label": f.label,
						value,
						onChange: (e) => patchImage(img.id, { filters: {
							...filters,
							[f.key]: Number(e.target.value)
						} }),
						onPointerUp: () => useDesign.getState().commit(),
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, value, f.min, f.max, f.step);
							if (next != null) patchImage(img.id, { filters: {
								...filters,
								[f.key]: next
							} }, true);
						}
					})
				}, f.key);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] uppercase tracking-wide text-ink-faint",
				children: "Crop"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[9px] text-ink-faint",
				children: "Drag the photo corners on the board to crop the frame. Alt+arrows nudge an edge."
			}),
			[
				["x", crop.x],
				["y", crop.y],
				["w", crop.w],
				["h", crop.h]
			].map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `Crop ${key} ${Math.round(value * 100)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: "range-phosphor w-full",
					"data-fill-range": "crop",
					style: { "--fill-percent": String(Math.max(0, Math.min(1, (value - .01) / .99))) },
					min: .01,
					max: 1,
					step: .01,
					"aria-label": `Crop ${key}`,
					value,
					onChange: (e) => patchImage(img.id, { crop: normalizeCrop({
						...crop,
						[key]: Number(e.target.value)
					}) }),
					onPointerUp: () => useDesign.getState().commit(),
					onKeyDown: (e) => {
						const next = nextFromRangeKey(e, value, .01, 1, .01);
						if (next != null) patchImage(img.id, { crop: normalizeCrop({
							...crop,
							[key]: next
						}) }, true);
					}
				})
			}, key)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
					onClick: () => patchImage(img.id, {
						filters: { ...DEFAULT_FILTERS },
						crop: null
					}, true),
					children: "Reset photo"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
					onClick: () => patchImage(img.id, { crop: null }, true),
					children: "Full frame"
				})]
			}),
			css ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[9px] text-ink-faint",
				children: css
			}) : null
		]
	});
}
function holeIndexFromPointKey(key) {
	const hole = /^hole-(\d+)-\d+$/.exec(key ?? "");
	if (hole) return Number(hole[1]);
	if (/^path-\d+$/.test(key ?? "")) return -1;
	return null;
}
function holeIndexFromHoleControl(el) {
	if (!el || !(el instanceof Element)) return null;
	const select = el.closest("[data-select-hole]")?.getAttribute("data-select-hole");
	if (select != null && select !== "") {
		const n = Number(select);
		return Number.isFinite(n) ? n : null;
	}
	const hole = el.closest("[data-hole]")?.getAttribute("data-hole");
	if (hole != null && hole !== "") {
		const n = Number(hole);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
function pointKey$1(el) {
	if (!el || !(el instanceof Element)) return null;
	return el.closest("[data-point]")?.getAttribute("data-point") ?? null;
}
function inspectorOf$6(el) {
	if (!el || !(el instanceof Element)) return null;
	return el.closest("[data-path-inspector]");
}
function lastOuterToFirstHole(from, shift, axisWanted, targetAxis) {
	if (shift || !from || !(from instanceof Element)) return false;
	const key = pointKey$1(from);
	if (!key || !/^path-\d+$/.test(key)) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "x" && axis !== "y") return false;
	if (axis && axis !== axisWanted) return false;
	const inspector = inspectorOf$6(from);
	if (!inspector) return false;
	const rows = [...inspector.querySelectorAll(`[data-point^="path-"]`)];
	const row = from.closest("[data-point]");
	if (!row || rows.at(-1) !== row) return false;
	const first = inspector.querySelector(`[data-point^="hole-0-"]`);
	if (!first) return false;
	return first.querySelector(`input[data-path-axis="${targetAxis}"]`) != null;
}
function lastOuterYToFirstHole(from, shift, targetAxis) {
	return lastOuterToFirstHole(from, shift, "y", targetAxis);
}
function lastOuterXToFirstHole(from, shift, targetAxis) {
	return lastOuterToFirstHole(from, shift, "x", targetAxis);
}
function lastOuterToFirstHoleHeader(from, shift) {
	if (shift || !from || !(from instanceof Element)) return false;
	const key = pointKey$1(from);
	if (!key || !/^path-\d+$/.test(key)) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "y") return false;
	const inspector = inspectorOf$6(from);
	if (!inspector) return false;
	const rows = [...inspector.querySelectorAll(`[data-point^="path-"]`)];
	const row = from.closest("[data-point]");
	if (!row || rows.at(-1) !== row) return false;
	const firstPoints = inspector.querySelector(`[data-point^="hole-0-"]`);
	if (firstPoints) {
		if (firstPoints.querySelector("input[data-path-axis=\"x\"]") != null || firstPoints.querySelector("input[data-path-axis=\"y\"]") != null) return false;
	}
	return inspector.querySelector(`[data-select-hole="0"]`) != null;
}
function shouldTabFromLastOuterYToFirstHoleX(from, shift) {
	if (shouldTabFromLastOuterYToFirstHoleY(from, shift)) return false;
	return lastOuterYToFirstHole(from, shift, "x");
}
function shouldTabFromLastOuterYToFirstHoleY(from, shift) {
	return lastOuterYToFirstHole(from, shift, "y");
}
function shouldTabFromLastOuterXToFirstHoleY(from, shift) {
	return lastOuterXToFirstHole(from, shift, "y");
}
function shouldTabFromLastOuterXToFirstHoleX(from, shift) {
	if (shouldTabFromLastOuterXToFirstHoleY(from, shift)) return false;
	return lastOuterXToFirstHole(from, shift, "x");
}
function shouldTabFromLastOuterYToFirstHoleHeader(from, shift) {
	if (shouldTabFromLastOuterYToFirstHoleX(from, shift) || shouldTabFromLastOuterYToFirstHoleY(from, shift)) return false;
	return lastOuterToFirstHoleHeader(from, shift);
}
function pickLastOuterLastPointYTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const inspector = inspectorOf$6(from);
	if (!inspector) return null;
	return [...inspector.querySelectorAll(`[data-point^="path-"]`)].at(-1)?.querySelector("input[data-path-axis=\"y\"]") ?? null;
}
function pickLastOuterLastPointXTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const inspector = inspectorOf$6(from);
	if (!inspector) return null;
	return [...inspector.querySelectorAll(`[data-point^="path-"]`)].at(-1)?.querySelector("input[data-path-axis=\"x\"]") ?? null;
}
function pickFirstHoleHeaderTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	return inspectorOf$6(from)?.querySelector(`[data-select-hole="0"]`) ?? null;
}
function firstHoleHeaderHasNoPointFields(inspector) {
	const firstPoints = inspector.querySelector(`[data-point^="hole-0-"]`);
	if (!firstPoints) return true;
	return !(firstPoints.querySelector("input[data-path-axis=\"x\"]") != null || firstPoints.querySelector("input[data-path-axis=\"y\"]") != null);
}
function shouldShiftTabFromFirstHoleHeaderToLastOuterY(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	const header = from.closest("[data-select-hole]");
	if (!header || header.getAttribute("data-select-hole") !== "0") return false;
	const inspector = inspectorOf$6(from);
	if (!inspector) return false;
	if (!firstHoleHeaderHasNoPointFields(inspector)) return false;
	const last = [...inspector.querySelectorAll(`[data-point^="path-"]`)].at(-1);
	if (!last) return false;
	return last.querySelector(`input[data-path-axis="y"]`) != null;
}
function shouldShiftTabFromFirstHoleHeaderToLastOuterX(from, shift) {
	if (shouldShiftTabFromFirstHoleHeaderToLastOuterY(from, shift)) return false;
	if (!shift || !from || !(from instanceof Element)) return false;
	const header = from.closest("[data-select-hole]");
	if (!header || header.getAttribute("data-select-hole") !== "0") return false;
	const inspector = inspectorOf$6(from);
	if (!inspector) return false;
	if (!firstHoleHeaderHasNoPointFields(inspector)) return false;
	const last = [...inspector.querySelectorAll(`[data-point^="path-"]`)].at(-1);
	if (!last) return false;
	return last.querySelector(`input[data-path-axis="x"]`) != null;
}
function inspectorOf$5(el) {
	if (!el || !(el instanceof Element)) return null;
	return el.closest("[data-path-inspector]");
}
function holeHeaderHasNoPointFields$4(inspector, h) {
	const points = inspector.querySelector(`[data-point^="hole-${h}-"]`);
	if (!points) return true;
	return !(points.querySelector("input[data-path-axis=\"x\"]") != null || points.querySelector("input[data-path-axis=\"y\"]") != null);
}
function shouldShiftTabFromNextHoleHeaderToLastHoleX(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	const header = from.closest("[data-select-hole]");
	if (!header) return false;
	const h = holeIndexFromHoleControl(header);
	if (h == null || h < 1) return false;
	const inspector = inspectorOf$5(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$4(inspector, h)) return false;
	const last = [...inspector.querySelectorAll(`[data-point^="hole-${h - 1}-"]`)].at(-1);
	if (!last) return false;
	if (last.querySelector(`input[data-path-axis="y"]`)) return false;
	return last.querySelector(`input[data-path-axis="x"]`) != null;
}
function pickLastHoleLastPointXTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const header = from.closest("[data-select-hole]");
	const pointKey = from.closest("[data-point]")?.getAttribute("data-point");
	const h = header ? holeIndexFromHoleControl(header) : holeIndexFromPointKey(pointKey);
	if (h == null || h < 1) return null;
	const inspector = inspectorOf$5(from);
	if (!inspector) return null;
	return [...inspector.querySelectorAll(`[data-point^="hole-${h - 1}-"]`)].at(-1)?.querySelector("input[data-path-axis=\"x\"]") ?? null;
}
function shouldShiftTabFromNextHoleHeaderToLastHoleY(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	const header = from.closest("[data-select-hole]");
	if (!header) return false;
	const h = holeIndexFromHoleControl(header);
	if (h == null || h < 1) return false;
	const inspector = inspectorOf$5(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$4(inspector, h)) return false;
	const last = [...inspector.querySelectorAll(`[data-point^="hole-${h - 1}-"]`)].at(-1);
	if (!last) return false;
	return last.querySelector(`input[data-path-axis="y"]`) != null;
}
function pickLastHoleLastPointYTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const header = from.closest("[data-select-hole]");
	const pointKey = from.closest("[data-point]")?.getAttribute("data-point");
	const h = header ? holeIndexFromHoleControl(header) : holeIndexFromPointKey(pointKey);
	if (h == null || h < 1) return null;
	const inspector = inspectorOf$5(from);
	if (!inspector) return null;
	return [...inspector.querySelectorAll(`[data-point^="hole-${h - 1}-"]`)].at(-1)?.querySelector("input[data-path-axis=\"y\"]") ?? null;
}
function shouldShiftTabFromNextHoleFirstYToLastHoleY(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	const key = from.closest("[data-point]")?.getAttribute("data-point") ?? null;
	const h = holeIndexFromPointKey(key);
	if (h == null || h < 1) return false;
	const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
	if (!i || Number(i[1]) !== 0) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "y") return false;
	return pickLastHoleLastPointYTabTarget(from) != null;
}
function shouldShiftTabFromNextHoleFirstXToLastHoleY(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	const key = from.closest("[data-point]")?.getAttribute("data-point") ?? null;
	const h = holeIndexFromPointKey(key);
	if (h == null || h < 1) return false;
	const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
	if (!i || Number(i[1]) !== 0) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "x") return false;
	return pickLastHoleLastPointYTabTarget(from) != null;
}
function shouldShiftTabFromNextHoleFirstXToLastHoleX(from, shift) {
	if (shouldShiftTabFromNextHoleFirstXToLastHoleY(from, shift)) return false;
	if (!shift || !from || !(from instanceof Element)) return false;
	const key = from.closest("[data-point]")?.getAttribute("data-point") ?? null;
	const h = holeIndexFromPointKey(key);
	if (h == null || h < 1) return false;
	const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
	if (!i || Number(i[1]) !== 0) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "x") return false;
	return pickLastHoleLastPointXTabTarget(from) != null;
}
function shouldShiftTabFromNextHoleFirstYToLastHoleX(from, shift) {
	if (shouldShiftTabFromNextHoleFirstYToLastHoleY(from, shift)) return false;
	if (!shift || !from || !(from instanceof Element)) return false;
	const key = from.closest("[data-point]")?.getAttribute("data-point") ?? null;
	const h = holeIndexFromPointKey(key);
	if (h == null || h < 1) return false;
	const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
	if (!i || Number(i[1]) !== 0) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "y") return false;
	return pickLastHoleLastPointXTabTarget(from) != null;
}
function pickLastHoleHeaderTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const h = holeIndexFromPointKey(from.closest("[data-point]")?.getAttribute("data-point") ?? null);
	if (h == null || h < 1) return null;
	const inspector = inspectorOf$5(from);
	if (!inspector) return null;
	return inspector.querySelector(`[data-select-hole="${h - 1}"]`);
}
function pickNextHoleHeaderFromFillTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const fill = from.closest("[data-hole-fill]");
	if (!fill) return null;
	const h = holeIndexFromHoleControl(fill);
	if (h == null) return null;
	const inspector = inspectorOf$5(from);
	if (!inspector) return null;
	return inspector.querySelector(`[data-select-hole="${h + 1}"]`);
}
function shouldTabFromHoleFillToNextHeader(from, shift) {
	if (shift || !from || !(from instanceof Element)) return false;
	const fill = from.closest("[data-hole-fill]");
	if (!fill) return false;
	const h = holeIndexFromHoleControl(fill);
	if (h == null) return false;
	const inspector = inspectorOf$5(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$4(inspector, h)) return false;
	if (!holeHeaderHasNoPointFields$4(inspector, h + 1)) return false;
	return pickNextHoleHeaderFromFillTabTarget(from) != null;
}
function shouldShiftTabFromNextHoleFirstXToLastHoleHeader(from, shift) {
	if (shouldShiftTabFromNextHoleFirstXToLastHoleY(from, shift)) return false;
	if (shouldShiftTabFromNextHoleFirstXToLastHoleX(from, shift)) return false;
	if (!shift || !from || !(from instanceof Element)) return false;
	const key = from.closest("[data-point]")?.getAttribute("data-point") ?? null;
	const h = holeIndexFromPointKey(key);
	if (h == null || h < 1) return false;
	const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
	if (!i || Number(i[1]) !== 0) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "x") return false;
	const inspector = inspectorOf$5(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$4(inspector, h - 1)) return false;
	return pickLastHoleHeaderTabTarget(from) != null;
}
function inspectorOf$4(el) {
	if (!el || !(el instanceof Element)) return null;
	return el.closest("[data-path-inspector]");
}
function holeHeaderHasNoPointFields$3(inspector, h) {
	const points = inspector.querySelector(`[data-point^="hole-${h}-"]`);
	if (!points) return true;
	return !(points.querySelector("input[data-path-axis=\"x\"]") != null || points.querySelector("input[data-path-axis=\"y\"]") != null);
}
function pickNextHoleHeaderFromDeleteTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const del = from.closest("[data-delete-hole]");
	if (!del) return null;
	const h = holeIndexFromHoleControl(del);
	if (h == null) return null;
	const inspector = inspectorOf$4(from);
	if (!inspector) return null;
	return inspector.querySelector(`[data-select-hole="${h + 1}"]`);
}
function shouldTabFromHoleDeleteToNextHeader(from, shift) {
	if (shift || !from || !(from instanceof Element)) return false;
	const del = from.closest("[data-delete-hole]");
	if (!del) return false;
	const h = holeIndexFromHoleControl(del);
	if (h == null) return false;
	const inspector = inspectorOf$4(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$3(inspector, h)) return false;
	if (!holeHeaderHasNoPointFields$3(inspector, h + 1)) return false;
	return pickNextHoleHeaderFromDeleteTabTarget(from) != null;
}
function pickNextHoleFillFromDeleteTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const del = from.closest("[data-delete-hole]");
	if (!del) return null;
	const h = holeIndexFromHoleControl(del);
	if (h == null) return null;
	const inspector = inspectorOf$4(from);
	if (!inspector) return null;
	const fills = inspector.querySelectorAll(`[data-hole="${h + 1}"] [data-hole-fill]`);
	return fills.length ? fills[0] : null;
}
function shouldTabFromHoleDeleteToNextFill(from, shift) {
	if (shift || !from || !(from instanceof Element)) return false;
	if (shouldTabFromHoleDeleteToNextHeader(from, false)) return false;
	const del = from.closest("[data-delete-hole]");
	if (!del) return false;
	const h = holeIndexFromHoleControl(del);
	if (h == null) return false;
	const inspector = inspectorOf$4(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$3(inspector, h)) return false;
	return pickNextHoleFillFromDeleteTabTarget(from) != null;
}
function pickLastHoleDeleteFromHeaderTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const header = from.closest("[data-select-hole]");
	if (!header) return null;
	const h = holeIndexFromHoleControl(header);
	if (h == null || h < 1) return null;
	const inspector = inspectorOf$4(from);
	if (!inspector) return null;
	const dels = inspector.querySelectorAll(`[data-hole="${h - 1}"] [data-delete-hole]`);
	return dels.length ? dels[dels.length - 1] : null;
}
function shouldShiftTabFromNextHoleHeaderToLastHoleDelete(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	const header = from.closest("[data-select-hole]");
	if (!header) return false;
	const h = holeIndexFromHoleControl(header);
	if (h == null || h < 1) return false;
	const inspector = inspectorOf$4(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$3(inspector, h)) return false;
	if (!holeHeaderHasNoPointFields$3(inspector, h - 1)) return false;
	return pickLastHoleDeleteFromHeaderTabTarget(from) != null;
}
function inspectorOf$3(el) {
	if (!el || !(el instanceof Element)) return null;
	return el.closest("[data-path-inspector]");
}
function holeHeaderHasNoPointFields$2(inspector, h) {
	const points = inspector.querySelector(`[data-point^="hole-${h}-"]`);
	if (!points) return true;
	return !(points.querySelector("input[data-path-axis=\"x\"]") != null || points.querySelector("input[data-path-axis=\"y\"]") != null);
}
function pickLastHoleFillFromHeaderTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const header = from.closest("[data-select-hole]");
	if (!header) return null;
	const h = holeIndexFromHoleControl(header);
	if (h == null || h < 1) return null;
	const inspector = inspectorOf$3(from);
	if (!inspector) return null;
	const fills = inspector.querySelectorAll(`[data-hole="${h - 1}"] [data-hole-fill]`);
	return fills.length ? fills[fills.length - 1] : null;
}
function shouldShiftTabFromNextHoleHeaderToLastHoleFill(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	if (shouldShiftTabFromNextHoleHeaderToLastHoleY(from, true)) return false;
	if (shouldShiftTabFromNextHoleHeaderToLastHoleX(from, true)) return false;
	if (shouldShiftTabFromNextHoleHeaderToLastHoleDelete(from, true)) return false;
	const header = from.closest("[data-select-hole]");
	if (!header) return false;
	const h = holeIndexFromHoleControl(header);
	if (h == null || h < 1) return false;
	const inspector = inspectorOf$3(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$2(inspector, h)) return false;
	if (!holeHeaderHasNoPointFields$2(inspector, h - 1)) return false;
	return pickLastHoleFillFromHeaderTabTarget(from) != null;
}
function pickLastHoleDeleteFromFillTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const fill = from.closest("[data-hole-fill]");
	if (!fill) return null;
	const h = holeIndexFromHoleControl(fill);
	if (h == null || h < 1) return null;
	const inspector = inspectorOf$3(from);
	if (!inspector) return null;
	const dels = inspector.querySelectorAll(`[data-hole="${h - 1}"] [data-delete-hole]`);
	return dels.length ? dels[dels.length - 1] : null;
}
function shouldShiftTabFromNextHoleFillToLastHoleDelete(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	if (shouldShiftTabFromNextHoleHeaderToLastHoleDelete(from, true)) return false;
	if (shouldShiftTabFromNextHoleHeaderToLastHoleFill(from, true)) return false;
	const fill = from.closest("[data-hole-fill]");
	if (!fill) return false;
	const h = holeIndexFromHoleControl(fill);
	if (h == null || h < 1) return false;
	const inspector = inspectorOf$3(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$2(inspector, h - 1)) return false;
	return pickLastHoleDeleteFromFillTabTarget(from) != null;
}
function inspectorOf$2(el) {
	if (!el || !(el instanceof Element)) return null;
	return el.closest("[data-path-inspector]");
}
function holeHeaderHasNoPointFields$1(inspector, h) {
	const points = inspector.querySelector(`[data-point^="hole-${h}-"]`);
	if (!points) return true;
	return !(points.querySelector("input[data-path-axis=\"x\"]") != null || points.querySelector("input[data-path-axis=\"y\"]") != null);
}
function pickNextHoleFirstPointXFromFillTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const fill = from.closest("[data-hole-fill]");
	if (!fill) return null;
	const h = holeIndexFromHoleControl(fill);
	if (h == null) return null;
	const inspector = inspectorOf$2(from);
	if (!inspector) return null;
	return inspector.querySelector(`[data-point^="hole-${h + 1}-"]`)?.querySelector("input[data-path-axis=\"x\"]") ?? null;
}
function shouldTabFromHoleFillToNextFirstX(from, shift) {
	if (shift || !from || !(from instanceof Element)) return false;
	if (shouldTabFromHoleFillToNextHeader(from, false)) return false;
	const fill = from.closest("[data-hole-fill]");
	if (!fill) return false;
	const h = holeIndexFromHoleControl(fill);
	if (h == null) return false;
	const inspector = inspectorOf$2(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$1(inspector, h)) return false;
	return pickNextHoleFirstPointXFromFillTabTarget(from) != null;
}
function pickLastHoleFillFromFirstXTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const h = holeIndexFromPointKey(from.closest("[data-point]")?.getAttribute("data-point") ?? null);
	if (h == null || h < 1) return null;
	const inspector = inspectorOf$2(from);
	if (!inspector) return null;
	const fills = inspector.querySelectorAll(`[data-hole="${h - 1}"] [data-hole-fill]`);
	return fills.length ? fills[fills.length - 1] : null;
}
function shouldShiftTabFromNextHoleFirstXToLastHoleFill(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	if (shouldShiftTabFromNextHoleFirstXToLastHoleY(from, true)) return false;
	if (shouldShiftTabFromNextHoleFirstXToLastHoleX(from, true)) return false;
	if (shouldShiftTabFromNextHoleFirstXToLastHoleHeader(from, true)) return false;
	if (shouldShiftTabFromNextHoleHeaderToLastHoleFill(from, true)) return false;
	const key = from.closest("[data-point]")?.getAttribute("data-point") ?? null;
	const h = holeIndexFromPointKey(key);
	if (h == null || h < 1) return false;
	const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
	if (!i || Number(i[1]) !== 0) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "x") return false;
	const inspector = inspectorOf$2(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields$1(inspector, h - 1)) return false;
	if (holeHeaderHasNoPointFields$1(inspector, h)) return false;
	if (!inspector.querySelector(`[data-point^="hole-${h}-"]`)?.querySelector("input[data-path-axis=\"x\"]")) return false;
	return pickLastHoleFillFromFirstXTabTarget(from) != null;
}
function inspectorOf$1(el) {
	if (!el || !(el instanceof Element)) return null;
	return el.closest("[data-path-inspector]");
}
function holeHeaderHasNoPointFields(inspector, h) {
	const points = inspector.querySelector(`[data-point^="hole-${h}-"]`);
	if (!points) return true;
	return !(points.querySelector("input[data-path-axis=\"x\"]") != null || points.querySelector("input[data-path-axis=\"y\"]") != null);
}
function pickNextHoleFirstPointYFromFillTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const fill = from.closest("[data-hole-fill]");
	if (!fill) return null;
	const h = holeIndexFromHoleControl(fill);
	if (h == null) return null;
	const inspector = inspectorOf$1(from);
	if (!inspector) return null;
	return inspector.querySelector(`[data-point^="hole-${h + 1}-"]`)?.querySelector("input[data-path-axis=\"y\"]") ?? null;
}
function shouldTabFromHoleFillToNextFirstY(from, shift) {
	if (shift || !from || !(from instanceof Element)) return false;
	if (shouldTabFromHoleFillToNextHeader(from, false)) return false;
	if (shouldTabFromHoleFillToNextFirstX(from, false)) return false;
	const fill = from.closest("[data-hole-fill]");
	if (!fill) return false;
	const h = holeIndexFromHoleControl(fill);
	if (h == null) return false;
	const inspector = inspectorOf$1(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields(inspector, h)) return false;
	if (inspector.querySelector(`[data-point^="hole-${h + 1}-"]`)?.querySelector("input[data-path-axis=\"x\"]")) return false;
	return pickNextHoleFirstPointYFromFillTabTarget(from) != null;
}
function pickLastHoleFillFromFirstYTabTarget(from) {
	if (!from || !(from instanceof Element)) return null;
	const h = holeIndexFromPointKey(from.closest("[data-point]")?.getAttribute("data-point") ?? null);
	if (h == null || h < 1) return null;
	const inspector = inspectorOf$1(from);
	if (!inspector) return null;
	const fills = inspector.querySelectorAll(`[data-hole="${h - 1}"] [data-hole-fill]`);
	return fills.length ? fills[fills.length - 1] : null;
}
function shouldShiftTabFromNextHoleFirstYToLastHoleFill(from, shift) {
	if (!shift || !from || !(from instanceof Element)) return false;
	if (shouldShiftTabFromNextHoleFirstYToLastHoleY(from, true)) return false;
	if (shouldShiftTabFromNextHoleFirstYToLastHoleX(from, true)) return false;
	if (shouldShiftTabFromNextHoleHeaderToLastHoleFill(from, true)) return false;
	const key = from.closest("[data-point]")?.getAttribute("data-point") ?? null;
	const h = holeIndexFromPointKey(key);
	if (h == null || h < 1) return false;
	const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
	if (!i || Number(i[1]) !== 0) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "y") return false;
	const inspector = inspectorOf$1(from);
	if (!inspector) return false;
	if (!holeHeaderHasNoPointFields(inspector, h - 1)) return false;
	if (holeHeaderHasNoPointFields(inspector, h)) return false;
	if (inspector.querySelector(`[data-point^="hole-${h}-"]`)?.querySelector("input[data-path-axis=\"x\"]")) return false;
	return pickLastHoleFillFromFirstYTabTarget(from) != null;
}
function pointKey(el) {
	if (!el || !(el instanceof Element)) return null;
	return el.closest("[data-point]")?.getAttribute("data-point") ?? null;
}
function inspectorOf(el) {
	if (!el || !(el instanceof Element)) return null;
	return el.closest("[data-path-inspector]");
}
function lastOuterXToFirstHoleHeader(from, shift) {
	if (shift || !from || !(from instanceof Element)) return false;
	const key = pointKey(from);
	if (!key || !/^path-\d+$/.test(key)) return false;
	const axis = from.getAttribute?.("data-path-axis");
	if (axis && axis !== "x") return false;
	const inspector = inspectorOf(from);
	if (!inspector) return false;
	const rows = [...inspector.querySelectorAll(`[data-point^="path-"]`)];
	const row = from.closest("[data-point]");
	if (!row || rows.at(-1) !== row) return false;
	if (row.querySelector("input[data-path-axis=\"y\"]") != null) return false;
	const firstPoints = inspector.querySelector(`[data-point^="hole-0-"]`);
	if (firstPoints) {
		if (firstPoints.querySelector("input[data-path-axis=\"x\"]") != null || firstPoints.querySelector("input[data-path-axis=\"y\"]") != null) return false;
	}
	return inspector.querySelector(`[data-select-hole="0"]`) != null;
}
function shouldTabFromLastOuterXToFirstHoleHeader(from, shift) {
	if (shouldTabFromLastOuterXToFirstHoleX(from, shift) || shouldTabFromLastOuterXToFirstHoleY(from, shift)) return false;
	if (shouldTabFromLastOuterYToFirstHoleHeader(from, shift)) return false;
	return lastOuterXToFirstHoleHeader(from, shift);
}
function restoreHoleListScroll(list, saved) {
	const max = Math.max(0, (list.scrollHeight ?? 0) - (list.clientHeight ?? 0));
	list.scrollTop = Math.min(max, Math.max(0, saved));
	return list.scrollTop;
}
function restoreListScroll(list, saved) {
	if (!(list instanceof HTMLElement)) return;
	restoreHoleListScroll(list, saved);
	const apply = () => restoreHoleListScroll(list, saved);
	if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => {
		apply();
		requestAnimationFrame(apply);
	});
}
/** Snapshot Points or Holes from a path inspector hop. */
function snapshotList(from, elOrSel, sel) {
	const selector = typeof elOrSel === "string" ? elOrSel : sel ?? "";
	const el = typeof elOrSel === "string" ? null : elOrSel;
	const root = from.closest("[data-path-inspector]") ?? from;
	const list = selector === "[data-hole-list]" ? el?.closest("[data-hole-list]") ?? from.closest("[data-hole-list]") ?? root.querySelector("[data-hole-list]") : selector === "[data-point-list]" ? el?.closest("[data-point-list]") ?? from.closest("[data-point-list]") ?? root.querySelector("[data-point-list]") : el?.closest(selector) ?? from.closest(selector) ?? root.querySelector(selector);
	return {
		list,
		saved: list instanceof HTMLElement ? list.scrollTop : 0
	};
}
/** Assign saved scroll, restoreListScroll(list, saved), then clampAfterGrowth. */
function holdListScroll(list, saved) {
	if (!(list instanceof HTMLElement)) return;
	list.scrollTop = saved;
	restoreListScroll(list, saved);
	const clampAfterGrowth = () => restoreHoleListScroll(list, saved);
	if (typeof requestAnimationFrame !== "function") {
		clampAfterGrowth();
		return;
	}
	requestAnimationFrame(() => {
		clampAfterGrowth();
		requestAnimationFrame(() => {
			clampAfterGrowth();
			requestAnimationFrame(clampAfterGrowth);
		});
	});
}
/** Snapshot Points + Holes, focus without scroll, then clamp-after-growth. */
function focusHoldEl(el, from) {
	const points = snapshotList(from, el, "[data-point-list]");
	const holes = snapshotList(from, el, "[data-hole-list]");
	el.focus({ preventScroll: true });
	if (el instanceof HTMLInputElement) el.select();
	holdListScroll(points.list, points.saved);
	holdListScroll(holes.list, holes.saved);
}
function isCrossingHoleHeaderTab(from, to) {
	if (!from || !to || !(from instanceof Element) || !(to instanceof Element)) return false;
	const a = from.closest("[data-hole]");
	const b = to.closest("[data-hole]");
	return Boolean(a && b && a !== b);
}
function tagHoleHeaderTabCrossing(from, to, mark = to) {
	if (!isCrossingHoleHeaderTab(from, to) || !mark || !(mark instanceof Element)) return false;
	from?.closest("[data-hole-header-tab]")?.removeAttribute("data-hole-header-tab");
	mark.setAttribute("data-hole-header-tab", "");
	return true;
}
function formatNum$2(n) {
	return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}
function NumField({ value, mixed = false, onCommit, onDraft, onFocus, onKeyDown, min, max, className = "field font-mono", "aria-label": ariaLabel = "numeric", "data-path-axis": dataPathAxis, tabIndex }) {
	const [focused, setFocused] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)(mixed ? "" : formatNum$2(value));
	(0, import_react.useEffect)(() => {
		if (!focused) setDraft(mixed ? "" : formatNum$2(value));
	}, [
		value,
		mixed,
		focused
	]);
	function commit(raw) {
		if (raw.trim() === "") {
			setDraft(mixed ? "" : formatNum$2(value));
			return;
		}
		const n = Number(raw);
		if (!Number.isFinite(n)) {
			setDraft(mixed ? "" : formatNum$2(value));
			return;
		}
		let next = n;
		if (min !== void 0) next = Math.max(min, next);
		if (max !== void 0) next = Math.min(max, next);
		setDraft(formatNum$2(next));
		onCommit(next);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className,
		type: "text",
		inputMode: "decimal",
		value: draft,
		tabIndex,
		"data-path-axis": dataPathAxis,
		placeholder: mixed && !focused ? "—" : void 0,
		"aria-label": mixed ? `${ariaLabel} mixed` : ariaLabel,
		onFocus: (e) => {
			setFocused(true);
			e.currentTarget.select();
			onFocus?.();
		},
		onChange: (e) => {
			const raw = e.target.value;
			setDraft(raw);
			if (onDraft) {
				const t = raw.trim();
				if (t === "" || t === "-" || t === "." || t === "-.") onDraft(null);
				else {
					const n = Number(t);
					onDraft(Number.isFinite(n) ? n : null);
				}
			}
		},
		onBlur: (e) => {
			setFocused(false);
			commit(e.target.value);
			onDraft?.(null);
		},
		onKeyDown: (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				commit(draft);
			}
			if (e.key === "Escape") {
				setDraft(mixed ? "" : formatNum$2(value));
				onDraft?.(null);
				e.currentTarget.blur();
			}
			onKeyDown?.(e);
		}
	});
}
function writeNode(node, next) {
	useDesign.getState().replaceNode(node.id, next, true);
}
function writePoints(node, points, extra = {}) {
	writeNode(node, {
		...node,
		points,
		...extra
	});
}
function ringBounds(points) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const p of points) {
		minX = Math.min(minX, p.x);
		minY = Math.min(minY, p.y);
		maxX = Math.max(maxX, p.x);
		maxY = Math.max(maxY, p.y);
	}
	if (!Number.isFinite(minX)) return {
		cx: 0,
		cy: 0,
		w: 40,
		h: 40
	};
	return {
		cx: (minX + maxX) / 2,
		cy: (minY + maxY) / 2,
		w: Math.max(8, maxX - minX),
		h: Math.max(8, maxY - minY)
	};
}
function PathInspector({ node }) {
	const hit = useDesign((s) => s.pathEditHit);
	const pointSel = useDesign((s) => s.pathPointSelection);
	const outerActive = hit && hit.hole == null ? hit.index : -1;
	const holes = node.holes ?? [];
	const setClosed = (closed) => {
		if (closed && node.points.length < 3) return;
		writePoints(node, node.points, { closed });
	};
	const smoothAll = () => {
		writePoints(node, smoothPathCorners(node.points, node.closed));
	};
	const cornerAll = () => {
		writePoints(node, node.points.map((p) => ({
			...p,
			in: null,
			out: null,
			smooth: false
		})));
	};
	const patchPoint = (index, next) => {
		writePoints(node, node.points.map((p, i) => i === index ? next : p));
	};
	const deletePoint = (index) => {
		if (node.points.length <= 1) {
			useDesign.getState().removeSelected();
			return;
		}
		const points = node.points.filter((_, i) => i !== index);
		writePoints(node, points, { closed: points.length >= 3 ? node.closed : false });
		setPathEditHit(null);
	};
	const toggleSmooth = (index) => {
		const p = node.points[index];
		if (!p) return;
		if (p.smooth !== false && (p.in || p.out)) {
			patchPoint(index, {
				...p,
				in: null,
				out: null,
				smooth: false
			});
			return;
		}
		patchPoint(index, autoSmoothPoint(node.points, index, node.closed));
	};
	const addHole = () => {
		const b = ringBounds(node.points);
		const hw = Math.max(12, b.w * .25);
		const hh = Math.max(12, b.h * .25);
		const cx = b.cx;
		const cy = b.cy;
		const ring = [
			{
				x: cx - hw,
				y: cy - hh,
				smooth: false
			},
			{
				x: cx + hw,
				y: cy - hh,
				smooth: false
			},
			{
				x: cx + hw,
				y: cy + hh,
				smooth: false
			},
			{
				x: cx - hw,
				y: cy + hh,
				smooth: false
			}
		];
		const nextHoles = [...holes, ring];
		const nextRules = [...node.holeFillRules ?? []];
		while (nextRules.length < nextHoles.length) nextRules.push(pathFillRule(node));
		writeNode(node, {
			...node,
			holes: nextHoles,
			holeFillRules: nextRules,
			closed: true
		});
		setPathEditHit({
			index: 0,
			arm: "anchor",
			hole: nextHoles.length - 1
		});
	};
	const removeHole = (index) => {
		writeNode(node, dropHole(node, index));
		setPathEditHit(null);
	};
	const setHoleRule = (index, rule) => {
		writeNode(node, setHoleFillRule(node, index, rule));
	};
	const patchHolePoint = (h, index, next) => {
		const nextHoles = holes.map((ring, i) => i === h ? ring.map((p, j) => j === index ? next : p) : ring);
		writeNode(node, {
			...node,
			holes: nextHoles
		});
	};
	const deleteHolePoint = (h, index) => {
		const ring = holes[h];
		if (!ring) return;
		if (ring.length <= 3) {
			removeHole(h);
			return;
		}
		const nextRing = ring.filter((_, i) => i !== index);
		const nextHoles = holes.map((r, i) => i === h ? nextRing : r);
		writeNode(node, {
			...node,
			holes: nextHoles
		});
		setPathEditHit(null);
	};
	const toggleHoleSmooth = (h, index) => {
		const ring = holes[h];
		const p = ring?.[index];
		if (!ring || !p) return;
		if (p.smooth !== false && (p.in || p.out)) {
			patchHolePoint(h, index, {
				...p,
				in: null,
				out: null,
				smooth: false
			});
			return;
		}
		patchHolePoint(h, index, autoSmoothPoint(ring, index, true));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
		title: "Path",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"data-path-inspector": true,
			className: "space-y-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-[11px] text-ink-dim",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						node.points.length,
						" point",
						node.points.length === 1 ? "" : "s",
						holes.length ? ` · ${holes.length} hole${holes.length === 1 ? "" : "s"}` : ""
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-[10px]",
						children: node.closed ? "closed" : "open"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: node.points.length < 3,
							className: cn("h-8 rounded-[8px] text-[10px]", node.closed ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim", node.points.length < 3 && "opacity-40"),
							onClick: () => setClosed(!node.closed),
							children: node.closed ? "Open" : "Close"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
							onClick: smoothAll,
							children: "Smooth"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
							onClick: cornerAll,
							children: "Corner"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
							onClick: () => useDesign.getState().popLastPathPoint(),
							children: "Drop last"
						})
					]
				}),
				pointSel.length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[10px] text-ink-dim",
							children: [pointSel.length, " points selected · align / distribute"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-1",
							onMouseLeave: () => clearPathPointAlignPreview(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
									onClick: () => {
										clearPathPointAlignPreview();
										alignSelectedPathPoints("left");
									},
									onMouseEnter: () => previewAlignSelectedPathPoints("left"),
									title: "Align selected points left",
									children: "L"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
									onClick: () => {
										clearPathPointAlignPreview();
										alignSelectedPathPoints("center");
									},
									onMouseEnter: () => previewAlignSelectedPathPoints("center"),
									title: "Align selected points center",
									children: "C"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
									onClick: () => {
										clearPathPointAlignPreview();
										alignSelectedPathPoints("right");
									},
									onMouseEnter: () => previewAlignSelectedPathPoints("right"),
									title: "Align selected points right",
									children: "R"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
									onClick: () => {
										clearPathPointAlignPreview();
										alignSelectedPathPoints("top");
									},
									onMouseEnter: () => previewAlignSelectedPathPoints("top"),
									title: "Align selected points top",
									children: "T"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
									onClick: () => {
										clearPathPointAlignPreview();
										alignSelectedPathPoints("middle");
									},
									onMouseEnter: () => previewAlignSelectedPathPoints("middle"),
									title: "Align selected points middle",
									children: "M"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
									onClick: () => {
										clearPathPointAlignPreview();
										alignSelectedPathPoints("bottom");
									},
									onMouseEnter: () => previewAlignSelectedPathPoints("bottom"),
									title: "Align selected points bottom",
									children: "B"
								})
							]
						}),
						pointSel.length >= 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-1",
							onMouseLeave: () => clearPathPointAlignPreview(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
								onClick: () => {
									clearPathPointAlignPreview();
									distributeSelectedPathPoints("h");
								},
								onMouseEnter: () => previewDistributeSelectedPathPoints("h"),
								title: "Distribute selected points horizontally",
								children: "Dist H"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
								onClick: () => {
									clearPathPointAlignPreview();
									distributeSelectedPathPoints("v");
								},
								onMouseEnter: () => previewDistributeSelectedPathPoints("v"),
								title: "Distribute selected points vertically",
								children: "Dist V"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Points",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "max-h-56 space-y-1 overflow-auto scrollbar-thin",
						children: node.points.map((pt, i) => {
							const selected = outerActive === i;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								"data-point": `path-${i}`,
								className: cn("rounded-[8px] border px-2 py-1.5", selected ? "border-phosphor/60 bg-phosphor/10" : "border-border"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "mb-1 flex w-full items-center justify-between text-left text-[10px] text-ink-dim",
										onFocus: () => setPathEditHit({
											index: i,
											arm: "anchor"
										}),
										onClick: () => setPathEditHit({
											index: i,
											arm: "anchor"
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-ink",
											children: String(i + 1).padStart(2, "0")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: pt.smooth !== false ? "smooth" : "corner" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
											className: "field font-mono",
											value: Math.round(pt.x),
											"aria-label": `point ${i + 1} x`,
											"data-path-axis": "x",
											onFocus: () => setPathEditHit({
												index: i,
												arm: "anchor"
											}),
											onCommit: (n) => patchPoint(i, {
												...pt,
												x: n
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
											className: "field font-mono",
											value: Math.round(pt.y),
											"aria-label": `point ${i + 1} y`,
											"data-path-axis": "y",
											onFocus: () => setPathEditHit({
												index: i,
												arm: "anchor"
											}),
											onCommit: (n) => patchPoint(i, {
												...pt,
												y: n
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1 grid grid-cols-2 gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: cn("h-7 rounded-[8px] text-[10px]", pt.smooth !== false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
											onFocus: () => setPathEditHit({
												index: i,
												arm: "anchor"
											}),
											onClick: () => toggleSmooth(i),
											children: pt.smooth !== false ? "Corner" : "Smooth"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
											onFocus: () => setPathEditHit({
												index: i,
												arm: "anchor"
											}),
											onClick: () => deletePoint(i),
											children: "Delete"
										})]
									})
								]
							}, i);
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: "Holes",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] text-ink-dim",
							children: holes.length ? `${holes.length} cutout${holes.length === 1 ? "" : "s"}` : "none"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
							onClick: addHole,
							children: "Add hole"
						})]
					}), holes.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "max-h-64 space-y-2 overflow-auto scrollbar-thin",
						children: holes.map((ring, h) => {
							const rule = holeFillRule(node, h);
							const holeHit = hit && hit.hole === h ? hit.index : -1;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-[8px] border border-border p-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										"data-select-hole": h,
										"data-hole": h,
										className: "mb-1 flex items-center justify-between gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "flex min-w-0 flex-1 items-center justify-between text-left text-[10px] text-ink-dim",
											onFocus: () => setPathEditHit({
												index: 0,
												arm: "anchor",
												hole: h
											}),
											onClick: () => setPathEditHit({
												index: 0,
												arm: "anchor",
												hole: h
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-mono text-ink",
												children: ["Hole ", String(h + 1).padStart(2, "0")]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [ring.length, " pts"] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"data-delete-hole": true,
											className: "h-6 rounded-[6px] border border-border px-1.5 text-[9px] text-ink-dim hover:border-phosphor hover:text-ink",
											onClick: () => removeHole(h),
											children: "Delete"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										"data-hole-fill": true,
										className: "mb-1 grid grid-cols-2 gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: cn("h-6 rounded-[6px] text-[9px]", rule === "evenodd" ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
											onClick: () => setHoleRule(h, "evenodd"),
											children: "Even-odd"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: cn("h-6 rounded-[6px] text-[9px]", rule === "nonzero" ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
											onClick: () => setHoleRule(h, "nonzero"),
											children: "Nonzero"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "space-y-1",
										children: ring.map((pt, i) => {
											const selected = holeHit === i;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
												"data-point": `hole-${h}-${i}`,
												className: cn("rounded-[6px] border px-1.5 py-1", selected ? "border-phosphor/60 bg-phosphor/10" : "border-border/70"),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mb-0.5 flex items-center justify-between text-[9px] text-ink-dim",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-mono",
															children: String(i + 1).padStart(2, "0")
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: pt.smooth !== false ? "smooth" : "corner" })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
															className: "field font-mono text-[10px]",
															value: Math.round(pt.x),
															"aria-label": `hole ${h + 1} point ${i + 1} x`,
															"data-path-axis": "x",
															onFocus: () => setPathEditHit({
																index: i,
																arm: "anchor",
																hole: h
															}),
															onCommit: (n) => patchHolePoint(h, i, {
																...pt,
																x: n
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
															className: "field font-mono text-[10px]",
															value: Math.round(pt.y),
															"aria-label": `hole ${h + 1} point ${i + 1} y`,
															"data-path-axis": "y",
															onFocus: () => setPathEditHit({
																index: i,
																arm: "anchor",
																hole: h
															}),
															onCommit: (n) => patchHolePoint(h, i, {
																...pt,
																y: n
															})
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-0.5 grid grid-cols-2 gap-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															className: cn("h-6 rounded-[6px] text-[9px]", pt.smooth !== false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
															onFocus: () => setPathEditHit({
																index: i,
																arm: "anchor",
																hole: h
															}),
															onClick: () => toggleHoleSmooth(h, i),
															children: pt.smooth !== false ? "Corner" : "Smooth"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															className: "h-6 rounded-[6px] border border-border text-[9px] text-ink-dim hover:border-phosphor hover:text-ink",
															onFocus: () => setPathEditHit({
																index: i,
																arm: "anchor",
																hole: h
															}),
															onClick: () => deleteHolePoint(h, i),
															children: "Delete"
														})]
													})
												]
											}, i);
										})
									})
								]
							}, h);
						})
					})]
				})
			]
		})
	});
}
/** Path point fields. Tab-order chrome lives in inspector-path.tsx. */
function PathFields$1({ node }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PathInspector, { node });
}
function PathFields({ node }) {
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key !== "Tab") return;
			const from = e.target;
			if (!(from instanceof Element)) return;
			if (e.shiftKey) {
				if (shouldShiftTabFromNextHoleFirstXToLastHoleFill(from, true)) {
					const lastFill = pickLastHoleFillFromFirstXTabTarget(from);
					if (!lastFill) return;
					e.preventDefault();
					tagHoleHeaderTabCrossing(from, lastFill, lastFill);
					focusHoldEl(lastFill, from);
					return;
				}
				if (shouldShiftTabFromNextHoleFirstYToLastHoleFill(from, true)) {
					const lastFill = pickLastHoleFillFromFirstYTabTarget(from);
					if (!lastFill) return;
					e.preventDefault();
					tagHoleHeaderTabCrossing(from, lastFill, lastFill);
					focusHoldEl(lastFill, from);
					return;
				}
				if (shouldShiftTabFromNextHoleFillToLastHoleDelete(from, true)) {
					const lastDelete = pickLastHoleDeleteFromFillTabTarget(from);
					if (!lastDelete) return;
					e.preventDefault();
					tagHoleHeaderTabCrossing(from, lastDelete, lastDelete);
					focusHoldEl(lastDelete, from);
					return;
				}
				if (shouldShiftTabFromNextHoleHeaderToLastHoleDelete(from, true)) {
					const lastDelete = pickLastHoleDeleteFromHeaderTabTarget(from);
					if (!lastDelete) return;
					e.preventDefault();
					tagHoleHeaderTabCrossing(from, lastDelete, lastDelete);
					focusHoldEl(lastDelete, from);
					return;
				}
				if (shouldShiftTabFromFirstHoleHeaderToLastOuterY(from, true)) {
					const lastY = pickLastOuterLastPointYTabTarget(from);
					if (!lastY) return;
					e.preventDefault();
					tagHoleHeaderTabCrossing(from, lastY, lastY);
					focusHoldEl(lastY, from);
					return;
				}
				if (shouldShiftTabFromFirstHoleHeaderToLastOuterX(from, true)) {
					const lastX = pickLastOuterLastPointXTabTarget(from);
					if (!lastX) return;
					e.preventDefault();
					tagHoleHeaderTabCrossing(from, lastX, lastX);
					focusHoldEl(lastX, from);
					return;
				}
				if (!shouldShiftTabFromNextHoleHeaderToLastHoleFill(from, true)) return;
				const lastFill = pickLastHoleFillFromHeaderTabTarget(from);
				if (!lastFill) return;
				e.preventDefault();
				tagHoleHeaderTabCrossing(from, lastFill, lastFill);
				focusHoldEl(lastFill, from);
				return;
			}
			if (shouldTabFromLastOuterYToFirstHoleHeader(from, false) || shouldTabFromLastOuterXToFirstHoleHeader(from, false)) {
				const header = pickFirstHoleHeaderTabTarget(from);
				if (!header) return;
				e.preventDefault();
				tagHoleHeaderTabCrossing(from, header, header);
				focusHoldEl(header, from);
				return;
			}
			if (shouldTabFromHoleFillToNextFirstX(from, false)) {
				const nextX = pickNextHoleFirstPointXFromFillTabTarget(from);
				if (!nextX) return;
				e.preventDefault();
				tagHoleHeaderTabCrossing(from, nextX, nextX);
				focusHoldEl(nextX, from);
				return;
			}
			if (shouldTabFromHoleFillToNextFirstY(from, false)) {
				const nextY = pickNextHoleFirstPointYFromFillTabTarget(from);
				if (!nextY) return;
				e.preventDefault();
				tagHoleHeaderTabCrossing(from, nextY, nextY);
				focusHoldEl(nextY, from);
				return;
			}
			if (shouldTabFromHoleFillToNextHeader(from, false)) {
				const nextHeader = pickNextHoleHeaderFromFillTabTarget(from);
				if (!nextHeader) return;
				e.preventDefault();
				tagHoleHeaderTabCrossing(from, nextHeader, nextHeader);
				focusHoldEl(nextHeader, from);
				return;
			}
			if (shouldTabFromHoleDeleteToNextFill(from, false)) {
				const nextFill = pickNextHoleFillFromDeleteTabTarget(from);
				if (!nextFill) return;
				e.preventDefault();
				tagHoleHeaderTabCrossing(from, nextFill, nextFill);
				focusHoldEl(nextFill, from);
				return;
			}
			if (!shouldTabFromHoleDeleteToNextHeader(from, false)) return;
			const nextHeader = pickNextHoleHeaderFromDeleteTabTarget(from);
			if (!nextHeader) return;
			e.preventDefault();
			tagHoleHeaderTabCrossing(from, nextHeader, nextHeader);
			focusHoldEl(nextHeader, from);
		};
		document.addEventListener("keydown", onKey, true);
		return () => document.removeEventListener("keydown", onKey, true);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PathFields$1, { node });
}
/** WCAG 2.x contrast helpers for inspector. */
function hexToRgb(hex) {
	const h = hex.trim().replace(/^#/, "");
	if (h.length === 3) {
		const r = Number.parseInt(h[0] + h[0], 16);
		const g = Number.parseInt(h[1] + h[1], 16);
		const b = Number.parseInt(h[2] + h[2], 16);
		if ([
			r,
			g,
			b
		].some((n) => Number.isNaN(n))) return null;
		return [
			r,
			g,
			b
		];
	}
	if (h.length !== 6) return null;
	const r = Number.parseInt(h.slice(0, 2), 16);
	const g = Number.parseInt(h.slice(2, 4), 16);
	const b = Number.parseInt(h.slice(4, 6), 16);
	if ([
		r,
		g,
		b
	].some((n) => Number.isNaN(n))) return null;
	return [
		r,
		g,
		b
	];
}
function channel(c) {
	const s = c / 255;
	return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
}
function luminance(hex) {
	const rgb = hexToRgb(hex);
	if (!rgb) return null;
	return .2126 * channel(rgb[0]) + .7152 * channel(rgb[1]) + .0722 * channel(rgb[2]);
}
function contrastRatio(fg, bg) {
	const a = luminance(fg);
	const b = luminance(bg);
	if (a == null || b == null) return null;
	const hi = Math.max(a, b);
	const lo = Math.min(a, b);
	return (hi + .05) / (lo + .05);
}
function wcagLevel(ratio, large) {
	const aa = large ? 3 : 4.5;
	if (ratio >= (large ? 4.5 : 7)) return "AAA";
	if (ratio >= aa) return "AA";
	return "fail";
}
function bestInk(bg, candidates) {
	const pool = [
		...candidates,
		"#d9f5e3",
		"#0a0d0c",
		"#ffffff",
		"#000000"
	];
	let best = pool[0] ?? "#d9f5e3";
	let bestR = 0;
	for (const c of pool) {
		const r = contrastRatio(c, bg);
		if (r != null && r > bestR) {
			best = c;
			bestR = r;
		}
	}
	return best;
}
function solidHex(fill, fallback = "#0a0d0c") {
	if (typeof fill === "string" && fill !== "transparent" && fill.startsWith("#")) return fill;
	if (fill && typeof fill === "object" && "stops" in fill) {
		const c = fill.stops?.[0]?.color;
		if (typeof c === "string" && c.startsWith("#")) return c;
	}
	return fallback;
}
function applyTypeGhost(n, ghost) {
	if (!ghost) return n;
	return {
		...n,
		fontSize: ghost.fontSize ?? n.fontSize,
		letterSpacing: ghost.letterSpacing ?? n.letterSpacing,
		lineHeight: ghost.lineHeight ?? n.lineHeight,
		fontWeight: ghost.fontWeight ?? n.fontWeight
	};
}
function TextFields({ node, hideType = false }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const brand = useDesign((s) => s.brand);
	const display = brand.displayFont || "Chakra Petch";
	const body = brand.bodyFont || "Outfit";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		label: "Copy",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			className: "field min-h-20",
			value: node.text,
			onChange: (e) => updateNodes([node.id], { text: e.target.value }),
			onBlur: () => useDesign.getState().commit(),
			"aria-label": "type copy"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyMeter, { text: node.text })]
	}), hideType ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
				onClick: () => updateNodes([node.id], {
					fontFamily: display,
					fontWeight: 600,
					fontSize: Math.max(node.fontSize, 40)
				}, true),
				children: "Display"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
				onClick: () => updateNodes([node.id], {
					fontFamily: body,
					fontWeight: 400,
					fontSize: Math.min(node.fontSize, 28)
				}, true),
				children: "Body"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContrastMeter, { node }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Font",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				className: "field",
				value: node.fontFamily,
				onChange: (e) => updateNodes([node.id], { fontFamily: e.target.value }, true),
				children: CANVAS_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: f.family,
					children: f.family
				}, f.id))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: `Size ${Math.round(node.fontSize)}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: "range-phosphor min-w-0 flex-1",
					"data-fill-range": "type-size",
					style: { "--fill-percent": String(Math.max(0, Math.min(1, (node.fontSize - 6) / 394))) },
					min: 6,
					max: 400,
					step: 1,
					"aria-label": "type size",
					value: node.fontSize,
					onChange: (e) => {
						const next = Number(e.target.value);
						useDesign.getState().setTypeGhost({ fontSize: next });
						updateNodes([node.id], { fontSize: next });
					},
					onPointerUp: () => {
						useDesign.getState().setTypeGhost(null);
						useDesign.getState().commit();
					},
					onKeyUp: () => {
						if (useDesign.getState().typeGhost) {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						}
					},
					onBlur: () => {
						if (useDesign.getState().typeGhost) {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						}
					},
					onKeyDown: (e) => {
						const next = nextFromRangeKey(e, node.fontSize, 6, 400, 1);
						if (next != null) {
							useDesign.getState().setTypeGhost({ fontSize: next });
							updateNodes([node.id], { fontSize: next });
						}
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
					className: "field w-16 font-mono",
					value: node.fontSize,
					min: 6,
					max: 400,
					"aria-label": "type size",
					onCommit: (n) => updateNodes([node.id], { fontSize: n }, true)
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: `Weight ${node.fontWeight}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: "range-phosphor min-w-0 flex-1",
					"data-fill-range": "type-weight",
					style: { "--fill-percent": String(Math.max(0, Math.min(1, (node.fontWeight - 100) / 800))) },
					min: 100,
					max: 900,
					step: 100,
					"aria-label": "type weight",
					value: node.fontWeight,
					onChange: (e) => {
						const next = Math.min(900, Math.max(100, Math.round(Number(e.target.value) / 100) * 100));
						useDesign.getState().setTypeGhost({ fontWeight: next });
						updateNodes([node.id], { fontWeight: next });
					},
					onPointerUp: () => {
						useDesign.getState().setTypeGhost(null);
						useDesign.getState().commit();
					},
					onKeyUp: () => {
						if (useDesign.getState().typeGhost) {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						}
					},
					onBlur: () => {
						if (useDesign.getState().typeGhost) {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						}
					},
					onKeyDown: (e) => {
						const next = nextFromRangeKey(e, node.fontWeight, 100, 900, 100);
						if (next != null) {
							const w = Math.min(900, Math.max(100, Math.round(next / 100) * 100));
							useDesign.getState().setTypeGhost({ fontWeight: w });
							updateNodes([node.id], { fontWeight: w });
						}
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
					className: "field w-16 font-mono",
					value: node.fontWeight,
					min: 100,
					max: 900,
					"aria-label": "type weight",
					onCommit: (n) => updateNodes([node.id], { fontWeight: Math.min(900, Math.max(100, Math.round(n / 100) * 100)) }, true)
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: `Tracking ${node.letterSpacing}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: "range-phosphor min-w-0 flex-1",
					"data-fill-range": "type-tracking",
					style: { "--fill-percent": String(Math.max(0, Math.min(1, (node.letterSpacing - -8) / 48))) },
					min: -8,
					max: 40,
					step: .25,
					"aria-label": "type tracking",
					value: node.letterSpacing,
					onChange: (e) => {
						const next = Number(e.target.value);
						useDesign.getState().setTypeGhost({ letterSpacing: next });
						updateNodes([node.id], { letterSpacing: next });
					},
					onPointerUp: () => {
						useDesign.getState().setTypeGhost(null);
						useDesign.getState().commit();
					},
					onKeyUp: () => {
						if (useDesign.getState().typeGhost) {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						}
					},
					onBlur: () => {
						if (useDesign.getState().typeGhost) {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						}
					},
					onKeyDown: (e) => {
						const next = nextFromRangeKey(e, node.letterSpacing, -8, 40, .25);
						if (next != null) {
							useDesign.getState().setTypeGhost({ letterSpacing: next });
							updateNodes([node.id], { letterSpacing: next });
						}
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
					className: "field w-16 font-mono",
					value: node.letterSpacing,
					min: -8,
					max: 40,
					"aria-label": "type tracking",
					onCommit: (n) => updateNodes([node.id], { letterSpacing: n }, true)
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: `Leading ${node.lineHeight.toFixed(2)}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: "range-phosphor min-w-0 flex-1",
					"data-fill-range": "type-leading",
					style: { "--fill-percent": String(Math.max(0, Math.min(1, (node.lineHeight - .7) / 1.3))) },
					min: .7,
					max: 2,
					step: .02,
					"aria-label": "type leading",
					value: node.lineHeight,
					onChange: (e) => {
						const next = Number(e.target.value);
						useDesign.getState().setTypeGhost({ lineHeight: next });
						updateNodes([node.id], { lineHeight: next });
					},
					onPointerUp: () => {
						useDesign.getState().setTypeGhost(null);
						useDesign.getState().commit();
					},
					onKeyUp: () => {
						if (useDesign.getState().typeGhost) {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						}
					},
					onBlur: () => {
						if (useDesign.getState().typeGhost) {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						}
					},
					onKeyDown: (e) => {
						const next = nextFromRangeKey(e, node.lineHeight, .7, 2, .02);
						if (next != null) {
							useDesign.getState().setTypeGhost({ lineHeight: next });
							updateNodes([node.id], { lineHeight: next });
						}
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
					className: "field w-16 font-mono",
					value: node.lineHeight,
					min: .7,
					max: 2,
					"aria-label": "type leading",
					onCommit: (n) => updateNodes([node.id], { lineHeight: n }, true)
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeRhythmPreview, { node }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Align",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1",
				children: [
					"left",
					"center",
					"right"
				].map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `h-8 flex-1 rounded-[8px] border text-xs capitalize ${node.align === a ? "border-phosphor text-phosphor" : "border-border text-ink-dim"}`,
					onClick: () => updateNodes([node.id], { align: a }, true),
					children: a
				}, a))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "flex items-center gap-2 text-xs text-ink-dim",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "checkbox",
				checked: node.uppercase,
				onChange: (e) => updateNodes([node.id], { uppercase: e.target.checked }, true)
			}), "Uppercase"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeAxes, { node })
	] })] });
}
function CopyMeter({ text }) {
	const chars = [...text].length;
	const words = text.trim() ? text.trim().split(/\s+/).length : 0;
	const lines = text.length ? text.split("\n").length : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-1 flex justify-between text-[10px] text-ink-dim",
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			chars,
			" ",
			chars === 1 ? "character" : "characters"
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			words,
			" ",
			words === 1 ? "word" : "words",
			" · ",
			lines,
			" ",
			lines === 1 ? "line" : "lines"
		] })]
	});
}
function DensityFactorThumb({ factor, onHoverStart, onHoverEnd, onDoubleClick }) {
	const f = Math.max(.4, Math.min(2.5, factor || 1));
	const step = Math.max(2.4, 7 / f);
	const ticks = [];
	let x = 3;
	while (x < 46 && ticks.length < 12) {
		ticks.push(x);
		x += step;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "48",
		height: "16",
		viewBox: "0 0 48 16",
		className: "shrink-0 rounded-[3px] border border-border/40 bg-ground/40 cursor-help",
		"aria-hidden": true,
		onMouseEnter: onHoverStart,
		onMouseLeave: onHoverEnd,
		onDoubleClick,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: `Density preview ×${f.toFixed(2)}. Hover to preview on canvas. Double-click to reset factor to 1.` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "1",
				y1: "8",
				x2: "47",
				y2: "8",
				stroke: "rgba(63,198,255,0.25)",
				strokeWidth: "0.6"
			}),
			ticks.map((tx, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: tx,
				y1: "4.5",
				x2: tx,
				y2: "11.5",
				stroke: "rgba(63,198,255,0.85)",
				strokeWidth: "1"
			}, i))
		]
	});
}
function TypeRhythmPreview({ node }) {
	const canvasRef = (0, import_react.useRef)(null);
	const typeGhost = useDesign((s) => s.typeGhost);
	const showPerGlyphTicks = useDesign((s) => s.showPerGlyphTicks);
	const setShowPerGlyphTicks = useDesign((s) => s.setShowPerGlyphTicks);
	const showWeightTickThickness = useDesign((s) => s.showWeightTickThickness);
	const setShowWeightTickThickness = useDesign((s) => s.setShowWeightTickThickness);
	const showGlyphDensityScale = useDesign((s) => s.showGlyphDensityScale);
	const setShowGlyphDensityScale = useDesign((s) => s.setShowGlyphDensityScale);
	const glyphDensityScaleFactor = useDesign((s) => s.glyphDensityScaleFactor);
	const setGlyphDensityScaleFactor = useDesign((s) => s.setGlyphDensityScaleFactor);
	const reverseTypeLeading = useDesign((s) => s.reverseTypeLeading);
	const setReverseTypeLeading = useDesign((s) => s.setReverseTypeLeading);
	const typeBaseline = useDesign((s) => s.typeBaseline);
	const setTypeBaseline = useDesign((s) => s.setTypeBaseline);
	const ghosted = applyTypeGhost(node, typeGhost);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const dpr = window.devicePixelRatio || 1;
		const cssW = 220;
		const cssH = 36;
		canvas.width = Math.round(cssW * dpr);
		canvas.height = Math.round(cssH * dpr);
		canvas.style.width = `${cssW}px`;
		canvas.style.height = `${cssH}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, cssW, cssH);
		const phosphor = "rgba(63,198,255,0.85)";
		const phosphorSoft = "rgba(63,198,255,0.35)";
		const y = cssH * .62;
		const left = 6;
		const right = 214;
		ctx.strokeStyle = phosphor;
		ctx.lineWidth = typeGhost?.fontWeight != null ? 1.8 : 1.15;
		ctx.beginPath();
		ctx.moveTo(left, y);
		ctx.lineTo(right, y);
		ctx.stroke();
		const tickH = 7;
		const up = reverseTypeLeading ? tickH * .35 : tickH;
		const down = reverseTypeLeading ? tickH : tickH * .35;
		ctx.beginPath();
		ctx.moveTo(left, y - up);
		ctx.lineTo(left, y + down);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(right, y - up);
		ctx.lineTo(right, y + down);
		ctx.stroke();
		const midX = 110;
		const midTick = 9;
		ctx.lineWidth = 1.2;
		ctx.beginPath();
		ctx.moveTo(midX, y - midTick / 2);
		ctx.lineTo(midX, 26.82);
		ctx.stroke();
		const size = ghosted.fontSize;
		const lineH = ghosted.lineHeight * size;
		const autoDensity = showGlyphDensityScale ? Math.max(.55, Math.min(2.4, Math.sqrt(Math.max(6, size) / 16))) : 1;
		const densityFactor = Math.max(.35, Math.min(4, autoDensity * (Number.isFinite(glyphDensityScaleFactor) ? glyphDensityScaleFactor : 1)));
		const densityStep = typeGhost?.lineHeight != null ? Math.max(lineH * .42 / densityFactor, 11) : Math.max(size * .55 / densityFactor, 9);
		if (densityStep > 5 && densityStep < 87.36) {
			ctx.strokeStyle = phosphorSoft;
			ctx.lineWidth = .75;
			for (let x = left + densityStep; x < right - densityStep * .35; x += densityStep) {
				if (Math.abs(x - midX) < densityStep * .32) continue;
				ctx.beginPath();
				ctx.moveTo(x, 19.52);
				ctx.lineTo(x, 25.12);
				ctx.stroke();
			}
		}
		if (typeGhost?.letterSpacing != null || typeGhost?.fontWeight != null) {
			ctx.save();
			ctx.font = `${ghosted.fontWeight} ${Math.min(size, 28)}px ${ghosted.fontFamily}`;
			ctx.letterSpacing = "0px";
			const sample = (node.text || "Type").slice(0, 24) || "A";
			const tracking = ghosted.letterSpacing || 0;
			const usePerGlyph = showPerGlyphTicks ? sample.length <= 24 : sample.length <= 8;
			ctx.strokeStyle = phosphorSoft;
			let wFactor = 1;
			if (showWeightTickThickness && typeGhost?.fontWeight != null) wFactor = Math.max(.6, Math.min(2.6, (ghosted.fontWeight || 400) / 400));
			ctx.lineWidth = .7 * wFactor;
			const tickH = 4.2 * Math.pow(wFactor, .5);
			const tUp = reverseTypeLeading ? tickH * .28 : tickH;
			const tDown = reverseTypeLeading ? tickH : tickH * .28;
			if (usePerGlyph) {
				let cum = 0;
				for (let g = 0; g < sample.length; g++) {
					const chW = ctx.measureText(sample[g]).width;
					const tickX = 10 + cum + chW * .5;
					if (tickX > left && tickX < right) {
						ctx.beginPath();
						ctx.moveTo(tickX, y - tUp);
						ctx.lineTo(tickX, y + tDown);
						ctx.stroke();
					}
					cum += chW + (g < sample.length - 1 ? tracking * .85 : 0);
				}
			} else {
				const glyphW = ctx.measureText(sample).width;
				const advance = Math.max(6, (glyphW / Math.max(1, sample.length) + tracking * .85) / densityFactor);
				for (let x = left + advance * .35; x < 211; x += advance) {
					ctx.beginPath();
					ctx.moveTo(x, y - tUp);
					ctx.lineTo(x, y + tDown);
					ctx.stroke();
				}
			}
			ctx.restore();
		}
	}, [
		node,
		typeGhost,
		ghosted.fontSize,
		ghosted.lineHeight,
		ghosted.letterSpacing,
		ghosted.fontWeight,
		showPerGlyphTicks,
		showWeightTickThickness,
		showGlyphDensityScale,
		glyphDensityScaleFactor,
		reverseTypeLeading
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] text-ink-dim",
				children: "Rhythm"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("h-5 rounded-[4px] px-1.5 text-[9px] tabular-nums", showWeightTickThickness ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
						"aria-pressed": showWeightTickThickness,
						title: "Scale rhythm tick thickness and height with font weight while scrubbing weight",
						onClick: () => setShowWeightTickThickness(!showWeightTickThickness),
						children: "Wt"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("h-5 rounded-[4px] px-1.5 text-[9px] tabular-nums", showGlyphDensityScale ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
						"aria-pressed": showGlyphDensityScale,
						title: "Scale rhythm density marks with font size (denser for larger type) on canvas and strip. Factor slider multiplies the densification (Arrow keys while focused; Shift for larger nudge). Exact number and density preview thumbnail beside the slider. Scrub the factor to preview density ghosts live on the canvas. Hover the thumbnail to preview density ghosts on the canvas. Double-click the slider or thumbnail to reset the factor to 1.",
						onClick: () => setShowGlyphDensityScale(!showGlyphDensityScale),
						children: "Den"
					}),
					showGlyphDensityScale && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: .4,
							max: 2.5,
							step: .05,
							value: glyphDensityScaleFactor,
							onChange: (e) => {
								const next = Number(e.target.value);
								setGlyphDensityScaleFactor(next);
								if (!useDesign.getState().typeGhost) useDesign.getState().setTypeGhost({ fontSize: node.fontSize });
							},
							onPointerUp: () => {
								const g = useDesign.getState().typeGhost;
								if (g && g.fontSize === node.fontSize && g.letterSpacing == null && g.lineHeight == null && g.fontWeight == null) useDesign.getState().setTypeGhost(null);
							},
							onBlur: () => {
								const g = useDesign.getState().typeGhost;
								if (g && g.fontSize === node.fontSize && g.letterSpacing == null && g.lineHeight == null && g.fontWeight == null) useDesign.getState().setTypeGhost(null);
							},
							onDoubleClick: () => {
								setGlyphDensityScaleFactor(1);
								const g = useDesign.getState().typeGhost;
								if (g && g.fontSize === node.fontSize && g.letterSpacing == null && g.lineHeight == null && g.fontWeight == null) useDesign.getState().setTypeGhost(null);
							},
							onKeyDown: (e) => {
								const special = nextFromRangeKey(e, glyphDensityScaleFactor, .4, 2.5, .05);
								if (special != null) {
									setGlyphDensityScaleFactor(special);
									if (!useDesign.getState().typeGhost) useDesign.getState().setTypeGhost({ fontSize: node.fontSize });
									return;
								}
								const dir = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : 0;
								if (dir === 0) return;
								e.preventDefault();
								const step = e.shiftKey ? .25 : .05;
								const next = Math.min(2.5, Math.max(.4, glyphDensityScaleFactor + dir * step));
								setGlyphDensityScaleFactor(next);
								if (!useDesign.getState().typeGhost) useDesign.getState().setTypeGhost({ fontSize: node.fontSize });
							},
							className: "h-1 w-12 cursor-pointer accent-phosphor",
							title: `Density factor ×${glyphDensityScaleFactor.toFixed(2)} (higher = denser). Arrow keys nudge (Shift for larger). Exact number beside. Scrub to preview density ghosts live on the canvas. Double-click to reset to 1.`,
							"aria-label": "Density scale factor"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
							value: glyphDensityScaleFactor,
							min: .4,
							max: 2.5,
							"aria-label": "Density scale factor exact",
							className: "h-5 w-10 shrink-0 rounded-[4px] border border-border/70 bg-surface/40 px-0.5 text-center font-mono text-[9px] tabular-nums text-phosphor",
							onCommit: (n) => setGlyphDensityScaleFactor(n)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DensityFactorThumb, {
							factor: glyphDensityScaleFactor,
							onHoverStart: () => {
								if (useDesign.getState().typeGhost) return;
								useDesign.getState().setTypeGhost({ fontSize: node.fontSize });
							},
							onHoverEnd: () => {
								const g = useDesign.getState().typeGhost;
								if (g && g.fontSize === node.fontSize && g.letterSpacing == null && g.lineHeight == null && g.fontWeight == null) useDesign.getState().setTypeGhost(null);
							},
							onDoubleClick: () => {
								setGlyphDensityScaleFactor(1);
								const g = useDesign.getState().typeGhost;
								if (g && g.fontSize === node.fontSize && g.letterSpacing == null && g.lineHeight == null && g.fontWeight == null) useDesign.getState().setTypeGhost(null);
							}
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("h-5 rounded-[4px] px-1.5 text-[9px] tabular-nums", showPerGlyphTicks ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
						"aria-pressed": showPerGlyphTicks,
						title: "Show per-glyph ticks on the canvas and rhythm strip (independent of line length)",
						onClick: () => setShowPerGlyphTicks(!showPerGlyphTicks),
						children: "Glyph"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("h-5 rounded-[4px] px-1.5 text-[9px] tabular-nums", reverseTypeLeading ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
						"aria-pressed": reverseTypeLeading,
						title: "Reverse leading direction: stack rhythm baselines from the bottom of the text box (first line at bottom). Ticks in the strip flip to match.",
						onClick: () => setReverseTypeLeading(!reverseTypeLeading),
						children: "Rev"
					}),
					[
						"hanging",
						"alphabetic",
						"middle"
					].map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("h-5 rounded-[4px] px-1.5 text-[9px] tabular-nums", typeBaseline === b ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
						"aria-pressed": typeBaseline === b,
						title: `Baseline alignment: ${b}. Changes how type sits relative to the line y (hanging ≈ top, alphabetic, middle). Rhythm ticks follow the chosen baseline.`,
						onClick: () => setTypeBaseline(b),
						children: b === "hanging" ? "Hng" : b === "alphabetic" ? "Alp" : "Mid"
					}, b))
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "w-full max-w-[220px] rounded-[6px] border border-border/50 bg-ground/30",
			"aria-hidden": true
		})]
	});
}
var OPSZ_FALLBACK = {
	tag: "opsz",
	min: 6,
	max: 144,
	fallback: 14
};
function TypeAxes({ node }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const opsz = faceAxis(node.fontFamily, "opsz") ?? OPSZ_FALLBACK;
	const wdth = faceAxis(node.fontFamily, "wdth");
	const opszValue = clampAxis(opsz, node.opticalSize, node.fontSize);
	const wdthValue = wdth ? clampAxis(wdth, node.fontWidth) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
		label: `Optical ${Math.round(opszValue)}${node.opticalSize == null ? " · auto" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "range",
				className: "range-phosphor min-w-0 flex-1",
				min: opsz.min,
				max: opsz.max,
				step: 1,
				"aria-label": "type optical size",
				value: opszValue,
				onChange: (e) => updateNodes([node.id], { opticalSize: Number(e.target.value) }),
				onPointerUp: () => useDesign.getState().commit()
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
				className: "field w-16 font-mono",
				value: opszValue,
				min: opsz.min,
				max: opsz.max,
				"aria-label": "type optical size",
				onCommit: (n) => updateNodes([node.id], { opticalSize: n }, true)
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-1 h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
			onClick: () => {
				useDesign.getState().commit();
				const doc = useDesign.getState().doc;
				if (!doc) return;
				useDesign.setState({
					doc: {
						...doc,
						nodes: doc.nodes.map((n) => {
							if (n.id !== node.id || n.kind !== "text") return n;
							const next = { ...n };
							delete next.opticalSize;
							return next;
						})
					},
					dirty: true
				});
			},
			children: "Auto from size"
		})]
	}), wdth && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
		label: `Width ${Math.round(wdthValue)}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "range",
				className: "range-phosphor min-w-0 flex-1",
				min: wdth.min,
				max: wdth.max,
				step: 1,
				"aria-label": "type width",
				value: wdthValue,
				onChange: (e) => updateNodes([node.id], { fontWidth: Number(e.target.value) }),
				onPointerUp: () => useDesign.getState().commit()
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
				className: "field w-16 font-mono",
				value: wdthValue,
				min: wdth.min,
				max: wdth.max,
				"aria-label": "type width",
				onCommit: (n) => updateNodes([node.id], { fontWidth: n }, true)
			})]
		})
	})] });
}
function ContrastMeter({ node }) {
	const doc = useDesign((s) => s.doc);
	const brand = useDesign((s) => s.brand);
	if (!doc) return null;
	const ink = solidHex(node.fill, "#d9f5e3");
	const ground = solidHex(doc.artboard.background, "#0a0d0c");
	const ratio = contrastRatio(ink, ground);
	const large = node.fontSize >= 24 || node.fontSize >= 18 && node.fontWeight >= 700;
	const level = ratio == null ? "fail" : wcagLevel(ratio, large);
	const suggested = bestInk(ground, brand.colors.map((c) => c.hex));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-2 text-[10px] text-ink-dim",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			"Contrast ",
			ratio == null ? "—" : ratio.toFixed(1),
			" \\u00b7 ",
			level.toUpperCase()
		] }), level === "fail" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "text-phosphor",
			onClick: () => useDesign.getState().updateNodes([node.id], { fill: suggested }, true),
			children: "Fix ink"
		})]
	});
}
var DEFAULT_TYPE = {
	fontFamily: "Chakra Petch",
	fontWeight: 600,
	fontSize: 48,
	letterSpacing: 0,
	lineHeight: 1.1,
	align: "left",
	uppercase: false
};
function normalizeType(node) {
	return {
		fontFamily: node.fontFamily || DEFAULT_TYPE.fontFamily,
		fontWeight: node.fontWeight ?? DEFAULT_TYPE.fontWeight,
		fontSize: node.fontSize ?? DEFAULT_TYPE.fontSize,
		letterSpacing: node.letterSpacing ?? DEFAULT_TYPE.letterSpacing,
		lineHeight: node.lineHeight ?? DEFAULT_TYPE.lineHeight,
		align: node.align ?? DEFAULT_TYPE.align,
		uppercase: Boolean(node.uppercase),
		opticalSize: node.opticalSize,
		fontWidth: node.fontWidth,
		fontSlant: node.fontSlant,
		fontItalic: node.fontItalic,
		fontGrade: node.fontGrade,
		fontSoft: node.fontSoft
	};
}
function cloneType(node) {
	return { ...normalizeType(node) };
}
function typeKey(node) {
	const t = normalizeType(node);
	return [
		t.fontFamily,
		t.fontWeight,
		Math.round(t.fontSize * 100) / 100,
		Math.round(t.letterSpacing * 100) / 100,
		Math.round(t.lineHeight * 100) / 100,
		t.align,
		t.uppercase ? "1" : "0",
		t.opticalSize == null ? "auto" : String(Math.round(t.opticalSize * 10) / 10),
		t.fontWidth == null ? "auto" : String(Math.round(t.fontWidth * 10) / 10),
		t.fontSlant == null ? "auto" : String(Math.round(t.fontSlant * 10) / 10),
		t.fontItalic == null ? "auto" : String(Math.round(t.fontItalic * 100) / 100),
		t.fontGrade == null ? "auto" : String(Math.round(t.fontGrade * 10) / 10),
		t.fontSoft == null ? "auto" : String(Math.round(t.fontSoft * 10) / 10)
	].join(":");
}
function formatChipNum(n) {
	return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}
function axisToken(node, tag) {
	const axis = faceAxis(node.fontFamily, tag);
	if (!axis) return null;
	if (tag === "opsz") {
		if (node.opticalSize == null) return "auto";
		return formatChipNum(clampAxis(axis, node.opticalSize, node.fontSize));
	}
	if (tag === "wdth") {
		if (node.fontWidth == null) return "auto";
		return formatChipNum(clampAxis(axis, node.fontWidth));
	}
	if (tag === "slnt") {
		if (node.fontSlant == null) return "auto";
		return formatChipNum(clampAxis(axis, node.fontSlant));
	}
	if (tag === "ital") {
		if (node.fontItalic == null) return "auto";
		return formatChipNum(clampAxis(axis, node.fontItalic));
	}
	if (tag === "GRAD") {
		if (node.fontGrade == null) return "auto";
		return formatChipNum(clampAxis(axis, node.fontGrade));
	}
	if (node.fontSoft == null) return "auto";
	return formatChipNum(clampAxis(axis, node.fontSoft));
}
function typeAxesDiffer(nodes, tag) {
	const tokens = /* @__PURE__ */ new Set();
	for (const raw of nodes) {
		const token = axisToken(normalizeType(raw), tag);
		if (token != null) tokens.add(token);
	}
	return tokens.size > 1;
}
function typeChipLabel(node, peers) {
	const t = normalizeType(node);
	const family = t.fontFamily.split(" ").pop() || t.fontFamily;
	const size = formatChipNum(t.fontSize);
	const group = peers && peers.length ? peers : [node];
	const parts = [`${family} ${size}`];
	if (typeAxesDiffer(group, "opsz")) {
		const token = axisToken(t, "opsz");
		if (token) parts.push(token === "auto" ? "opsz auto" : `opsz ${token}`);
	}
	if (typeAxesDiffer(group, "wdth")) {
		const token = axisToken(t, "wdth");
		if (token) parts.push(token === "auto" ? "wdth auto" : `wdth ${token}`);
	}
	if (typeAxesDiffer(group, "slnt")) {
		const token = axisToken(t, "slnt");
		if (token) parts.push(token === "auto" ? "slnt auto" : `slnt ${token}`);
	}
	if (typeAxesDiffer(group, "ital")) {
		const token = axisToken(t, "ital");
		if (token) parts.push(token === "auto" ? "ital auto" : `ital ${token}`);
	}
	if (typeAxesDiffer(group, "GRAD")) {
		const token = axisToken(t, "GRAD");
		if (token) parts.push(token === "auto" ? "GRAD auto" : `GRAD ${token}`);
	}
	if (typeAxesDiffer(group, "SOFT")) {
		const token = axisToken(t, "SOFT");
		if (token) parts.push(token === "auto" ? "SOFT auto" : `SOFT ${token}`);
	}
	return parts.join(" · ");
}
function clampTypeSize(n) {
	if (!Number.isFinite(n)) return DEFAULT_TYPE.fontSize;
	return Math.min(400, Math.max(6, n));
}
function scaledTypeSizes(nodes, keyId, nextKeySize) {
	const key = nodes.find((n) => n.id === keyId) ?? nodes[nodes.length - 1];
	const from = key?.fontSize && key.fontSize > 0 ? key.fontSize : DEFAULT_TYPE.fontSize;
	const to = clampTypeSize(nextKeySize);
	const ratio = to / from;
	const out = /* @__PURE__ */ new Map();
	for (const n of nodes) {
		const next = n.id === key?.id ? to : clampTypeSize(n.fontSize * ratio);
		out.set(n.id, next);
	}
	return out;
}
function unique$1(values) {
	return [...new Set(values)];
}
function formatNum$1(n) {
	return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}
function nodeAxisValue(n, tag) {
	if (tag === "opsz") return n.opticalSize;
	if (tag === "wdth") return n.fontWidth;
	if (tag === "slnt") return n.fontSlant;
	if (tag === "ital") return n.fontItalic;
	if (tag === "GRAD") return n.fontGrade;
	if (tag === "SOFT") return n.fontSoft;
	return n.fontWonk;
}
function axisValues(nodes, tag) {
	const out = [];
	for (const n of nodes) {
		const axis = faceAxis(n.fontFamily, tag);
		if (!axis) continue;
		out.push(tag === "opsz" ? clampAxis(axis, n.opticalSize, n.fontSize) : clampAxis(axis, nodeAxisValue(n, tag)));
	}
	return out;
}
function unionAxis(nodes, tag) {
	const axes = nodes.map((n) => faceAxis(n.fontFamily, tag)).filter((a) => Boolean(a));
	if (!axes.length) return null;
	return {
		tag,
		min: Math.min(...axes.map((a) => a.min)),
		max: Math.max(...axes.map((a) => a.max)),
		fallback: axes[axes.length - 1].fallback
	};
}
function axisField(tag) {
	if (tag === "opsz") return "opticalSize";
	if (tag === "wdth") return "fontWidth";
	if (tag === "slnt") return "fontSlant";
	if (tag === "ital") return "fontItalic";
	if (tag === "GRAD") return "fontGrade";
	if (tag === "SOFT") return "fontSoft";
	return "fontWonk";
}
function patchFor(tag, value) {
	return { [axisField(tag)]: value };
}
var AXIS_TAGS = [
	"opsz",
	"wdth",
	"slnt",
	"ital",
	"GRAD",
	"SOFT",
	"WONK"
];
var AXIS_UI = {
	opsz: {
		label: "Optical",
		aria: "type optical size",
		step: 1,
		auto: "Auto from size"
	},
	wdth: {
		label: "Width",
		aria: "type width",
		step: 1
	},
	slnt: {
		label: "Slant",
		aria: "type slant",
		step: .1,
		auto: "Upright"
	},
	ital: {
		label: "Italic",
		aria: "type italic",
		step: .01,
		auto: "Roman"
	},
	GRAD: {
		label: "Grade",
		aria: "type grade",
		step: 1,
		auto: "Default grade"
	},
	SOFT: {
		label: "Softness",
		aria: "type softness",
		step: 1,
		auto: "Sharp"
	},
	WONK: {
		label: "Wonk",
		aria: "type wonk",
		step: .01,
		auto: "Unwonk"
	}
};
function MixedAxisSliders({ nodes, patch }) {
	const families = nodes.map((n) => n.fontFamily);
	const keyNode = nodes[nodes.length - 1];
	const present = AXIS_TAGS.filter((tag) => anyFaceHasAxis(families, tag) && unionAxis(nodes, tag));
	if (!present.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: present.map((tag) => {
		const axis = unionAxis(nodes, tag);
		const ui = AXIS_UI[tag];
		const vals = axisValues(nodes, tag);
		const mixed = unique$1(vals.map((n) => Math.round(n * 100) / 100)).length > 1;
		const keyAxis = faceAxis(keyNode.fontFamily, tag);
		const value = keyAxis ? tag === "opsz" ? clampAxis(keyAxis, keyNode.opticalSize, keyNode.fontSize) : clampAxis(keyAxis, nodeAxisValue(keyNode, tag)) : vals[vals.length - 1] ?? axis.fallback;
		const allAuto = nodes.filter((n) => faceAxis(n.fontFamily, tag)).every((n) => nodeAxisValue(n, tag) == null);
		const autoSuffix = tag === "opsz" && allAuto ? " · auto" : allAuto && tag !== "wdth" ? " · auto" : "";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "mt-2 block text-[11px] text-ink-dim",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block",
					children: mixed ? `${ui.label} \u00b7 mixed` : `${ui.label} ${formatNum$1(value)}${autoSuffix}`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor min-w-0 flex-1",
						min: axis.min,
						max: axis.max,
						step: ui.step,
						"aria-label": mixed ? `${ui.aria} mixed` : ui.aria,
						value,
						onChange: (e) => patch(patchFor(tag, Number(e.target.value)), false),
						onPointerUp: () => useDesign.getState().commit()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value,
						mixed,
						min: axis.min,
						max: axis.max,
						"aria-label": ui.aria,
						onCommit: (n) => patch(patchFor(tag, n))
					})]
				}),
				ui.auto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-1 h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
					onClick: () => patch(patchFor(tag, void 0)),
					children: ui.auto
				})
			]
		}, tag);
	}) });
}
var ALIGNS = [
	"left",
	"center",
	"right"
];
var ALIGN_LABEL = {
	left: "Left",
	center: "Center",
	right: "Right"
};
function alignLegendEntries(nodes) {
	const map = /* @__PURE__ */ new Map();
	for (const n of nodes) {
		const id = n.align;
		map.set(id, (map.get(id) ?? 0) + 1);
	}
	return ALIGNS.filter((id) => map.has(id)).map((id) => ({
		id,
		label: ALIGN_LABEL[id],
		count: map.get(id) ?? 0
	}));
}
function AlignIcon({ align }) {
	const common = "stroke-phosphor fill-none";
	if (align === "left") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "14",
		height: "10",
		viewBox: "0 0 14 10",
		className: common,
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "1",
				y1: "2",
				x2: "9",
				y2: "2",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "1",
				y1: "5",
				x2: "7",
				y2: "5",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "1",
				y1: "8",
				x2: "10",
				y2: "8",
				strokeWidth: "1.5"
			})
		]
	});
	if (align === "center") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "14",
		height: "10",
		viewBox: "0 0 14 10",
		className: common,
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "3",
				y1: "2",
				x2: "11",
				y2: "2",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "4",
				y1: "5",
				x2: "10",
				y2: "5",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "2",
				y1: "8",
				x2: "12",
				y2: "8",
				strokeWidth: "1.5"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "14",
		height: "10",
		viewBox: "0 0 14 10",
		className: common,
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "5",
				y1: "2",
				x2: "13",
				y2: "2",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "7",
				y1: "5",
				x2: "13",
				y2: "5",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "4",
				y1: "8",
				x2: "13",
				y2: "8",
				strokeWidth: "1.5"
			})
		]
	});
}
function MixedAlignLegend({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = nodes.map((n) => n.id);
	const entries = alignLegendEntries(nodes);
	if (entries.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		"aria-label": "mixed align legend",
		children: entries.map(({ id, label, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex h-7 items-center gap-1.5 rounded-full border border-phosphor/40 bg-surface-alt px-2 font-mono text-[8px] text-phosphor hover:bg-phosphor/10",
			title: `Unify align to ${label} · ${count} layer${count === 1 ? "" : "s"}`,
			"aria-label": `Set align to ${label}`,
			onClick: () => updateNodes(ids, { align: id }, true),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlignIcon, { align: id }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-phosphor/20 px-1 text-phosphor/90",
					children: count
				})
			]
		}, id))
	});
}
function unique(values) {
	return [...new Set(values)];
}
function formatNum(n) {
	return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}
function faceSupports(family, tag) {
	return Boolean(faceAxis(family, tag));
}
function MixedType({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const brand = useDesign((s) => s.brand);
	const ids = nodes.map((n) => n.id);
	const sizes = unique(nodes.map((n) => Math.round(n.fontSize)));
	const weights = unique(nodes.map((n) => n.fontWeight));
	const families = unique(nodes.map((n) => n.fontFamily));
	const trackings = unique(nodes.map((n) => Math.round(n.letterSpacing * 100) / 100));
	const leadings = unique(nodes.map((n) => Math.round(n.lineHeight * 100) / 100));
	const aligns = unique(nodes.map((n) => n.align));
	const mixedSize = sizes.length > 1;
	const mixedWeight = weights.length > 1;
	const mixedFamily = families.length > 1;
	const mixedTracking = trackings.length > 1;
	const mixedLeading = leadings.length > 1;
	const mixedAlign = aligns.length > 1;
	const mixedCase = unique(nodes.map((n) => Boolean(n.uppercase))).length > 1;
	const mixedStack = new Set(nodes.map((n) => typeKey(n))).size > 1;
	const mixedCopy = unique(nodes.map((n) => n.text)).length > 1;
	const joinedCopy = nodes.map((n) => n.text).join("\n");
	const keyNode = nodes[nodes.length - 1];
	const display = brand.displayFont || "Chakra Petch";
	const body = brand.bodyFont || "Outfit";
	function patch(partial, commit = true) {
		updateNodes(ids, partial, commit);
	}
	function stampType(style, commit = true) {
		patch(cloneType(style), commit);
	}
	function writeAxis(tag, value, commit = true) {
		const idsForAxis = new Set(nodes.filter((n) => faceSupports(n.fontFamily, tag)).map((n) => n.id));
		if (!idsForAxis.size) return;
		if (value != null) {
			const partial = tag === "opsz" ? { opticalSize: value } : { fontWidth: value };
			updateNodes([...idsForAxis], partial, commit);
			return;
		}
		if (commit) useDesign.getState().commit();
		const doc = useDesign.getState().doc;
		if (!doc) return;
		useDesign.setState({
			doc: {
				...doc,
				nodes: doc.nodes.map((n) => {
					if (!idsForAxis.has(n.id) || n.kind !== "text") return n;
					const next = { ...n };
					if (tag === "opsz") delete next.opticalSize;
					else delete next.fontWidth;
					return next;
				})
			},
			dirty: true
		});
	}
	function writeSize(nextKeySize, commit, flatten) {
		const size = clampTypeSize(nextKeySize);
		if (flatten || !mixedSize) {
			patch({ fontSize: size }, commit);
			return;
		}
		const scaled = scaledTypeSizes(nodes, keyNode.id, size);
		if (commit) useDesign.getState().commit();
		const doc = useDesign.getState().doc;
		if (!doc) return;
		useDesign.setState({
			doc: {
				...doc,
				nodes: doc.nodes.map((n) => {
					const next = scaled.get(n.id);
					return next == null ? n : {
						...n,
						fontSize: next
					};
				})
			},
			dirty: true
		});
	}
	function patchAxes(partial, commit = true) {
		if ("opticalSize" in partial) {
			writeAxis("opsz", partial.opticalSize, commit);
			return;
		}
		if ("fontWidth" in partial) {
			writeAxis("wdth", partial.fontWidth, commit);
			return;
		}
		patch(partial, commit);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border-b border-border py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: [
					"Type · ",
					nodes.length,
					" layers"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[10px] text-ink-dim",
				children: "Family, weight, tracking, leading and align write onto every selected text layer. A mixed size slider scales from the key so the stack keeps its steps; type a size to flatten."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyMeter, { text: joinedCopy }),
			mixedCopy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-1 space-y-0.5",
				"aria-label": "per-layer copy counts",
				children: nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between gap-2 font-mono text-[10px] text-ink-faint",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate",
						children: n.name || "text"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						[...n.text].length,
						"c · ",
						n.text.trim() ? n.text.trim().split(/\s+/).length : 0,
						"w"
					] })]
				}, n.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
					onClick: () => patch({
						fontFamily: display,
						fontWeight: 600,
						fontSize: Math.max(...nodes.map((n) => n.fontSize), 40)
					}),
					children: "Display"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
					onClick: () => patch({
						fontFamily: body,
						fontWeight: 400,
						fontSize: Math.min(...nodes.map((n) => n.fontSize), 28)
					}),
					children: "Body"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mb-2 block text-[11px] text-ink-dim",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block",
					children: mixedFamily ? "Family · mixed" : "Family"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: "field",
					"aria-label": mixedFamily ? "type family mixed" : "type family",
					value: mixedFamily ? "" : keyNode.fontFamily,
					onChange: (e) => {
						const family = e.target.value;
						if (!family) return;
						patch({ fontFamily: family });
					},
					children: [mixedFamily && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						disabled: true,
						children: "Mixed"
					}), CANVAS_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: f.family,
						children: f.family
					}, f.id))]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-[11px] text-ink-dim",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block",
					children: mixedSize ? "Size · mixed · scale from key" : `Size ${formatNum(keyNode.fontSize)}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor min-w-0 flex-1",
						"data-fill-range": "type-size",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (keyNode.fontSize - 6) / 394))) },
						min: 6,
						max: 400,
						step: 1,
						"aria-label": mixedSize ? "type size mixed" : "type size",
						value: keyNode.fontSize,
						onChange: (e) => {
							const next = Number(e.target.value);
							useDesign.getState().setTypeGhost({ fontSize: next });
							writeSize(next, false, false);
						},
						onPointerUp: () => {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						},
						onKeyUp: () => {
							if (useDesign.getState().typeGhost) {
								useDesign.getState().setTypeGhost(null);
								useDesign.getState().commit();
							}
						},
						onBlur: () => {
							if (useDesign.getState().typeGhost) {
								useDesign.getState().setTypeGhost(null);
								useDesign.getState().commit();
							}
						},
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, keyNode.fontSize, 6, 400, 1);
							if (next != null) {
								useDesign.getState().setTypeGhost({ fontSize: next });
								writeSize(next, false, false);
							}
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: keyNode.fontSize,
						mixed: mixedSize,
						min: 6,
						max: 400,
						"aria-label": "type size",
						onCommit: (n) => writeSize(n, true, true)
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-2 block text-[11px] text-ink-dim",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block",
					children: mixedWeight ? "Weight · mixed" : `Weight ${formatNum(keyNode.fontWeight)}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor min-w-0 flex-1",
						"data-fill-range": "type-weight",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (keyNode.fontWeight - 100) / 800))) },
						min: 100,
						max: 900,
						step: 100,
						"aria-label": mixedWeight ? "type weight mixed" : "type weight",
						value: keyNode.fontWeight,
						onChange: (e) => {
							const next = Math.min(900, Math.max(100, Math.round(Number(e.target.value) / 100) * 100));
							useDesign.getState().setTypeGhost({ fontWeight: next });
							patch({ fontWeight: next }, false);
						},
						onPointerUp: () => {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						},
						onKeyUp: () => {
							if (useDesign.getState().typeGhost) {
								useDesign.getState().setTypeGhost(null);
								useDesign.getState().commit();
							}
						},
						onBlur: () => {
							if (useDesign.getState().typeGhost) {
								useDesign.getState().setTypeGhost(null);
								useDesign.getState().commit();
							}
						},
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, keyNode.fontWeight, 100, 900, 100);
							if (next != null) {
								const w = Math.min(900, Math.max(100, Math.round(next / 100) * 100));
								useDesign.getState().setTypeGhost({ fontWeight: w });
								patch({ fontWeight: w }, false);
							}
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: keyNode.fontWeight,
						mixed: mixedWeight,
						min: 100,
						max: 900,
						"aria-label": "type weight",
						onCommit: (n) => patch({ fontWeight: Math.min(900, Math.max(100, Math.round(n / 100) * 100)) })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-2 block text-[11px] text-ink-dim",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block",
					children: mixedTracking ? "Tracking · mixed" : `Tracking ${formatNum(keyNode.letterSpacing)}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor min-w-0 flex-1",
						"data-fill-range": "type-tracking",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (keyNode.letterSpacing - -8) / 48))) },
						min: -8,
						max: 40,
						step: .25,
						"aria-label": mixedTracking ? "type tracking mixed" : "type tracking",
						value: keyNode.letterSpacing,
						onChange: (e) => {
							const next = Number(e.target.value);
							useDesign.getState().setTypeGhost({ letterSpacing: next });
							patch({ letterSpacing: next }, false);
						},
						onPointerUp: () => {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						},
						onKeyUp: () => {
							if (useDesign.getState().typeGhost) {
								useDesign.getState().setTypeGhost(null);
								useDesign.getState().commit();
							}
						},
						onBlur: () => {
							if (useDesign.getState().typeGhost) {
								useDesign.getState().setTypeGhost(null);
								useDesign.getState().commit();
							}
						},
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, keyNode.letterSpacing, -8, 40, .25);
							if (next != null) {
								useDesign.getState().setTypeGhost({ letterSpacing: next });
								patch({ letterSpacing: next }, false);
							}
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: keyNode.letterSpacing,
						mixed: mixedTracking,
						min: -8,
						max: 40,
						"aria-label": "type tracking",
						onCommit: (n) => patch({ letterSpacing: n })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-2 block text-[11px] text-ink-dim",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block",
					children: mixedLeading ? "Leading · mixed" : `Leading ${formatNum(keyNode.lineHeight)}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor min-w-0 flex-1",
						"data-fill-range": "type-leading",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (keyNode.lineHeight - .7) / 1.3))) },
						min: .7,
						max: 2,
						step: .02,
						"aria-label": mixedLeading ? "type leading mixed" : "type leading",
						value: keyNode.lineHeight,
						onChange: (e) => {
							const next = Number(e.target.value);
							useDesign.getState().setTypeGhost({ lineHeight: next });
							patch({ lineHeight: next }, false);
						},
						onPointerUp: () => {
							useDesign.getState().setTypeGhost(null);
							useDesign.getState().commit();
						},
						onKeyUp: () => {
							if (useDesign.getState().typeGhost) {
								useDesign.getState().setTypeGhost(null);
								useDesign.getState().commit();
							}
						},
						onBlur: () => {
							if (useDesign.getState().typeGhost) {
								useDesign.getState().setTypeGhost(null);
								useDesign.getState().commit();
							}
						},
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, keyNode.lineHeight, .7, 2, .02);
							if (next != null) {
								useDesign.getState().setTypeGhost({ lineHeight: next });
								patch({ lineHeight: next }, false);
							}
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: keyNode.lineHeight,
						mixed: mixedLeading,
						min: .7,
						max: 2,
						"aria-label": "type leading",
						onCommit: (n) => patch({ lineHeight: n })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeRhythmPreview, { node: keyNode }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedAxisSliders, {
				nodes,
				patch: patchAxes
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-1 text-[11px] text-ink-dim",
						children: mixedAlign ? "Align · mixed" : "Align"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1",
						role: "group",
						"aria-label": mixedAlign ? "type align mixed" : "type align",
						children: ALIGNS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `h-8 flex-1 rounded-[8px] border text-xs capitalize ${!mixedAlign && keyNode.align === a ? "border-phosphor text-phosphor" : "border-border text-ink-dim"}`,
							onClick: () => patch({ align: a }),
							children: a
						}, a))
					}),
					mixedAlign && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedAlignLegend, { nodes })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-2 flex items-center gap-2 text-xs text-ink-dim",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					"aria-label": mixedCase ? "type uppercase mixed" : "type uppercase",
					checked: !mixedCase && keyNode.uppercase,
					onChange: (e) => patch({ uppercase: e.target.checked })
				}), mixedCase ? "Uppercase · mixed" : "Uppercase"]
			}),
			mixedStack && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1.5 flex flex-wrap gap-1",
				children: nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
					title: `Unify full type with ${n.name || "text"}: ${typeChipLabel(n, nodes)}`,
					"aria-label": `Unify full type with ${n.name || "text"}: ${typeChipLabel(n, nodes)}`,
					onClick: () => stampType(n),
					children: typeChipLabel(n, nodes)
				}, n.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 grid grid-cols-2 gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-8 rounded-[8px] border border-phosphor/40 text-[10px] text-phosphor hover:bg-phosphor/10",
					onClick: () => stampType(keyNode),
					children: "Match key"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
					onClick: () => patch({
						fontFamily: "Chakra Petch",
						fontWeight: 600,
						fontSize: 48,
						letterSpacing: 0,
						lineHeight: 1.1,
						align: "left",
						uppercase: false,
						opticalSize: void 0,
						fontWidth: void 0
					}),
					children: "Reset type"
				})]
			})
		]
	});
}
function fillKey(fill) {
	if (typeof fill === "string") return fill;
	return `g:${fill.angle}:${fill.stops.map((s) => `${s.offset}:${s.color}`).join("|")}`;
}
function solidOf(fill, fallback) {
	if (typeof fill === "string" && fill !== "transparent") return fill;
	if (fill && typeof fill !== "string") return fill.stops[0]?.color ?? fallback;
	return fallback;
}
function fillChipLabel(fill) {
	if (fill === "transparent") return "none";
	if (typeof fill === "string") return fill;
	if (isGradient(fill)) {
		const a = fill.stops[0]?.color ?? "grad";
		const b = fill.stops[fill.stops.length - 1]?.color ?? a;
		return `grad ${fill.angle}° · ${a}→${b}`;
	}
	return "fill";
}
function strokeChipLabel(stroke, width) {
	if (stroke === "transparent" || width <= 0) return "none";
	return `${stroke} · ${width}`;
}
function cloneFill(fill) {
	if (typeof fill === "string") return fill;
	return {
		type: "linear",
		angle: fill.angle,
		stops: fill.stops.map((s) => ({
			offset: s.offset,
			color: s.color
		}))
	};
}
function MixedTypeColour({ nodes, brandColors, ink }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	if (nodes.length < 1) return null;
	const ids = nodes.map((n) => n.id);
	const key = nodes[nodes.length - 1];
	const hex = solidOf(key.fill, ink);
	const mixed = new Set(nodes.map((n) => fillKey(n.fill))).size > 1;
	function writeFill(fill) {
		updateNodes(ids, { fill: cloneFill(fill) }, true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border-b border-border py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: ["Type colour · ", nodes.length]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[10px] text-ink-dim",
				children: "Writes onto type only — shapes in the same selection keep their own fill."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
				label: mixed ? "Type colour · mixed" : "Type colour",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "color",
							className: cn("h-8 w-12 shrink-0 rounded-[8px] border border-border", mixed && "opacity-60"),
							value: hex === "transparent" ? "#3fc6ff" : hex,
							"aria-label": mixed ? "type colour mixed" : "type colour",
							onChange: (e) => writeFill(e.target.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field font-mono flex-1",
							value: mixed ? "" : hex,
							placeholder: mixed ? "—" : void 0,
							"aria-label": mixed ? "type colour hex mixed" : "type colour hex",
							onChange: (e) => {
								const raw = e.target.value.trim();
								if (/^#([0-9a-fA-F]{6})$/.test(raw)) writeFill(raw);
							},
							onBlur: (e) => {
								const raw = e.target.value.trim();
								if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) writeFill(raw.length === 4 ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}` : raw);
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swatches, {
						colors: brandColors,
						onPick: (picked) => writeFill(picked)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-1 text-[10px] text-phosphor",
						onClick: () => writeFill(key.fill),
						children: "Apply key type colour to all type"
					}),
					mixed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1.5 flex flex-wrap gap-1",
						children: nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
							title: `Unify type colour with ${n.name || "text"}: ${fillChipLabel(n.fill)}`,
							"aria-label": `Unify type colour with ${n.name || "text"}: ${fillChipLabel(n.fill)}`,
							onClick: () => writeFill(n.fill),
							children: fillChipLabel(n.fill)
						}, `type-fill-${n.id}`))
					})
				]
			})
		]
	});
}
var SLIDERS = [
	{
		key: "brightness",
		label: "Brightness",
		min: 0,
		max: 2,
		step: .01
	},
	{
		key: "contrast",
		label: "Contrast",
		min: 0,
		max: 2,
		step: .01
	},
	{
		key: "saturate",
		label: "Saturate",
		min: 0,
		max: 2,
		step: .01
	},
	{
		key: "blur",
		label: "Blur",
		min: 0,
		max: 24,
		step: .25
	}
];
function patchImageFilters(ids, patch, commit = false) {
	const state = useDesign.getState();
	const doc = state.doc;
	if (!doc) return;
	if (commit) state.commit();
	const idset = new Set(ids);
	useDesign.setState({
		doc: {
			...doc,
			nodes: doc.nodes.map((n) => {
				if (!idset.has(n.id) || n.kind !== "image" && n.kind !== "paint") return n;
				return {
					...n,
					filters: {
						...normalizeFilters(n.filters),
						...patch
					}
				};
			})
		},
		dirty: true
	});
}
function MixedFilters({ nodes }) {
	const photos = nodes.filter(isBitmap);
	if (photos.length < 2) return null;
	const ids = photos.map((n) => n.id);
	const first = normalizeFilters(photos[0].filters);
	const mixedAll = new Set(photos.map((n) => filterKey(n.filters))).size > 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border-b border-border py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: ["Photos · ", photos.length]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[10px] text-ink-dim",
				children: "Mixed filters write brightness, contrast, saturate, and blur onto every selected photo. A chip stamps that layer’s full stack."
			}),
			SLIDERS.map((f) => {
				const mixed = new Set(photos.map((n) => normalizeFilters(n.filters)[f.key])).size > 1;
				const value = first[f.key];
				const shown = f.key === "blur" ? value : Math.round(value * 100);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: mixed ? `${f.label} · mixed` : `${f.label} ${shown}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: cn("range-phosphor w-full", mixed && "opacity-70"),
						"data-fill-range": "photo-mixed",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (value - f.min) / (f.max - f.min || 1)))) },
						min: f.min,
						max: f.max,
						step: f.step,
						"aria-label": mixed ? `selection ${f.label.toLowerCase()} mixed` : `selection ${f.label.toLowerCase()}`,
						value,
						onChange: (e) => patchImageFilters(ids, { [f.key]: Number(e.target.value) }),
						onPointerUp: () => useDesign.getState().commit(),
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, value, f.min, f.max, f.step);
							if (next != null) {
								patchImageFilters(ids, { [f.key]: next });
								useDesign.getState().commit();
							}
						}
					})
				}, f.key);
			}),
			mixedAll && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: photos.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
					title: `Unify full filters with ${n.name || "photo"}: ${filterChipLabel(n.filters)}`,
					"aria-label": `Unify full filters with ${n.name || "photo"}: ${filterChipLabel(n.filters)}`,
					onClick: () => patchImageFilters(ids, cloneFilters(n.filters), true),
					children: filterChipLabel(n.filters)
				}, n.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 grid grid-cols-2 gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-8 rounded-[8px] border border-phosphor/40 text-[10px] text-phosphor hover:bg-phosphor/10",
					onClick: () => patchImageFilters(ids, cloneFilters(photos[photos.length - 1].filters), true),
					children: "Match key"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
					onClick: () => patchImageFilters(ids, { ...DEFAULT_FILTERS }, true),
					children: "Reset all"
				})]
			})
		]
	});
}
function rotationChipLabel(rotation) {
	return `${Math.round(rotation)}°`;
}
function radiusChipLabel(radius) {
	return `r ${Math.round(radius)}`;
}
function rotationKey(rotation) {
	return String(Math.round(rotation * 10) / 10);
}
function radiusKey(radius) {
	return String(Math.round(radius * 10) / 10);
}
function sidesChipLabel(sides, kind) {
	const n = Math.max(3, Math.round(sides));
	return kind === "star" ? `${n}★` : `${n}gon`;
}
function headScaleChipLabel(scale) {
	return `head ${Math.round(scale * 100)}%`;
}
function dashOffsetChipLabel(offset) {
	return `off ${Math.round(offset)}`;
}
function miterChipLabel(miter) {
	return `mit ${Math.round(miter * 10) / 10}`;
}
function dashChipLabel(dash) {
	const d = Math.round((dash ?? 0) * 10) / 10;
	return d === 0 ? "solid" : `dash ${d}`;
}
function capChipLabel(cap) {
	return cap;
}
function joinChipLabel(join) {
	return join;
}
/** One-line preview of dash / cap / join for a mixed-kind unify chip. */
function strokeRhythmChipLabel(dash, cap, join) {
	return `${dashChipLabel(dash)} · ${cap} · ${join}`;
}
function fillRuleChipLabel(rule) {
	return rule === "evenodd" ? "even-odd" : "nonzero";
}
function ghostFillRule(rule) {
	useDesign.getState().setStrokeGhost(rule == null ? null : { fillRule: rule });
}
function holedPaths(nodes) {
	return nodes.filter((n) => isPath(n) && (n.holes?.length ?? 0) > 0);
}
var FILL_RULE_ORDER = ["evenodd", "nonzero"];
function fillRuleLegendEntries(paths) {
	const map = /* @__PURE__ */ new Map();
	for (const n of paths) {
		const id = pathFillRule(n);
		map.set(id, (map.get(id) ?? 0) + 1);
	}
	return FILL_RULE_ORDER.filter((id) => map.has(id)).map((id) => ({
		id,
		label: fillRuleChipLabel(id),
		count: map.get(id) ?? 0
	}));
}
/** Compact unique-rule legend. Click unifies the selection to that rule. */
function MixedFillRuleLegend({ paths }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = paths.map((n) => n.id);
	const entries = fillRuleLegendEntries(paths);
	if (entries.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		"aria-label": "mixed fill rule legend",
		children: entries.map(({ id, label, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex h-6 items-center gap-1 rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor",
			title: `Unify fill rule to ${label} · ${count} layer${count === 1 ? "" : "s"}`,
			"aria-label": `Set fill rule to ${label}`,
			onMouseEnter: () => ghostFillRule(id),
			onFocus: () => ghostFillRule(id),
			onMouseLeave: () => ghostFillRule(null),
			onBlur: () => ghostFillRule(null),
			onClick: () => updateNodes(ids, { fillRule: id }, true),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-phosphor/70",
				children: count
			})]
		}, id))
	});
}
function MixedFillRule({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const paths = holedPaths(nodes);
	if (paths.length < 2) return null;
	const ids = paths.map((n) => n.id);
	const mixed = new Set(paths.map((n) => pathFillRule(n))).size > 1;
	const first = paths[paths.length - 1];
	const value = pathFillRule(first);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border-b border-border py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: ["Fill rule · ", paths.length]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[10px] text-ink-dim",
				children: "Even-odd punches holes. Nonzero keeps overlapping rings as islands. Hover a chip to ghost the rule on the artboard."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixed ? "Rule · mixed" : `Rule ${fillRuleChipLabel(value)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: "field",
					value: mixed ? "" : value,
					"aria-label": mixed ? "path fill rule mixed" : "path fill rule",
					onChange: (e) => {
						const rule = e.target.value;
						if (rule !== "evenodd" && rule !== "nonzero") return;
						updateNodes(ids, { fillRule: rule }, true);
					},
					children: [
						mixed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							disabled: true,
							children: "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "evenodd",
							children: "even-odd"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "nonzero",
							children: "nonzero"
						})
					]
				})
			}),
			mixed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedFillRuleLegend, { paths }),
			mixed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: paths.map((n) => {
					const rule = pathFillRule(n);
					const label = fillRuleChipLabel(rule);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
						title: `Unify fill rule with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify fill rule with ${n.name || n.kind}: ${label}`,
						onMouseEnter: () => ghostFillRule(rule),
						onFocus: () => ghostFillRule(rule),
						onMouseLeave: () => ghostFillRule(null),
						onBlur: () => ghostFillRule(null),
						onClick: () => updateNodes(ids, { fillRule: rule }, true),
						children: label
					}, `fill-rule-${n.id}`);
				})
			})
		]
	});
}
var CAPS = [
	"butt",
	"round",
	"square"
];
var JOINS = [
	"miter",
	"round",
	"bevel"
];
var OUTLINE_KINDS = /* @__PURE__ */ new Set([
	"path",
	"rect",
	"ellipse",
	"line",
	"polygon",
	"star",
	"arrow"
]);
function dashKey(n) {
	return Math.round((n.strokeDash ?? 0) * 100) / 100;
}
function widthKey(n) {
	return Math.round((n.strokeWidth ?? 0) * 100) / 100;
}
function offsetKey(n) {
	return Math.round((n.strokeDashOffset ?? 0) * 100) / 100;
}
function miterKey(n) {
	return Math.round((n.miterLimit ?? 4) * 100) / 100;
}
function chipClass() {
	return "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate";
}
function ghostStroke(patch) {
	useDesign.getState().setStrokeGhost(patch);
}
function CapIcon({ cap }) {
	const common = "stroke-phosphor fill-none";
	if (cap === "round") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: "16",
		height: "8",
		viewBox: "0 0 16 8",
		className: common,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
			x1: "2",
			y1: "4",
			x2: "14",
			y2: "4",
			strokeWidth: "3",
			strokeLinecap: "round"
		})
	});
	if (cap === "square") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: "16",
		height: "8",
		viewBox: "0 0 16 8",
		className: common,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
			x1: "2",
			y1: "4",
			x2: "14",
			y2: "4",
			strokeWidth: "3",
			strokeLinecap: "square"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: "16",
		height: "8",
		viewBox: "0 0 16 8",
		className: common,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
			x1: "3",
			y1: "4",
			x2: "13",
			y2: "4",
			strokeWidth: "3",
			strokeLinecap: "butt"
		})
	});
}
function JoinIcon({ join }) {
	const common = "stroke-phosphor fill-none";
	if (join === "round") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 14 14",
		className: common,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M2 12 L7 2 L12 12",
			strokeWidth: "2.5",
			strokeLinejoin: "round"
		})
	});
	if (join === "bevel") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 14 14",
		className: common,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M2 12 L7 2 L12 12",
			strokeWidth: "2.5",
			strokeLinejoin: "bevel"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 14 14",
		className: common,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M2 12 L7 2 L12 12",
			strokeWidth: "2.5",
			strokeLinejoin: "miter"
		})
	});
}
function capLegendEntries(outlines) {
	const map = /* @__PURE__ */ new Map();
	for (const n of outlines) {
		const id = n.lineCap ?? "round";
		map.set(id, (map.get(id) ?? 0) + 1);
	}
	return CAPS.filter((id) => map.has(id)).map((id) => ({
		id,
		label: capChipLabel(id),
		count: map.get(id) ?? 0
	}));
}
function joinLegendEntries(outlines) {
	const map = /* @__PURE__ */ new Map();
	for (const n of outlines) {
		const id = n.lineJoin ?? "round";
		map.set(id, (map.get(id) ?? 0) + 1);
	}
	return JOINS.filter((id) => map.has(id)).map((id) => ({
		id,
		label: joinChipLabel(id),
		count: map.get(id) ?? 0
	}));
}
/** Compact unique-cap legend. Click unifies the selection to that cap. */
function MixedCapLegend({ outlines }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = outlines.map((n) => n.id);
	const entries = capLegendEntries(outlines);
	if (entries.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		"aria-label": "mixed line cap legend",
		children: entries.map(({ id, label, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex h-7 items-center gap-1.5 rounded-full border border-phosphor/40 bg-surface-alt px-2 font-mono text-[8px] text-phosphor hover:bg-phosphor/10",
			title: `Unify line cap to ${label} · ${count} layer${count === 1 ? "" : "s"}`,
			"aria-label": `Set line cap to ${label}`,
			onMouseEnter: () => ghostStroke({ lineCap: id }),
			onFocus: () => ghostStroke({ lineCap: id }),
			onMouseLeave: () => ghostStroke(null),
			onBlur: () => ghostStroke(null),
			onClick: () => updateNodes(ids, { lineCap: id }, true),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CapIcon, { cap: id }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-phosphor/20 px-1 text-phosphor/90",
					children: count
				})
			]
		}, id))
	});
}
/** Compact unique-join legend. Click unifies the selection to that join. */
function MixedJoinLegend({ outlines }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = outlines.map((n) => n.id);
	const entries = joinLegendEntries(outlines);
	if (entries.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		"aria-label": "mixed line join legend",
		children: entries.map(({ id, label, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex h-7 items-center gap-1.5 rounded-full border border-phosphor/40 bg-surface-alt px-2 font-mono text-[8px] text-phosphor hover:bg-phosphor/10",
			title: `Unify line join to ${label} · ${count} layer${count === 1 ? "" : "s"}`,
			"aria-label": `Set line join to ${label}`,
			onMouseEnter: () => ghostStroke({ lineJoin: id }),
			onFocus: () => ghostStroke({ lineJoin: id }),
			onMouseLeave: () => ghostStroke(null),
			onBlur: () => ghostStroke(null),
			onClick: () => updateNodes(ids, { lineJoin: id }, true),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JoinIcon, { join: id }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-phosphor/20 px-1 text-phosphor/90",
					children: count
				})
			]
		}, id))
	});
}
function MixedPathDash({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const outlines = nodes.filter((n) => OUTLINE_KINDS.has(n.kind));
	if (outlines.length < 1) return null;
	const ids = outlines.map((n) => n.id);
	const mixed = new Set(outlines.map(dashKey)).size > 1;
	const mixedWidth = new Set(outlines.map(widthKey)).size > 1;
	const mixedOffset = new Set(outlines.map(offsetKey)).size > 1;
	const mixedCap = new Set(outlines.map((n) => n.lineCap ?? "round")).size > 1;
	const mixedJoin = new Set(outlines.map((n) => n.lineJoin ?? "round")).size > 1;
	const mixedMiter = new Set(outlines.map(miterKey)).size > 1;
	const mixedRhythm = mixed || mixedCap || mixedJoin;
	const first = outlines[outlines.length - 1];
	const value = first.strokeDash ?? 0;
	const width = first.strokeWidth ?? 1;
	const offset = first.strokeDashOffset ?? 0;
	const cap = first.lineCap ?? "round";
	const join = first.lineJoin ?? "round";
	const miter = first.miterLimit ?? 4;
	const polygons = outlines.filter((n) => n.kind === "polygon" || n.kind === "star");
	const arrows = outlines.filter((n) => n.kind === "arrow");
	const polyIds = polygons.map((n) => n.id);
	const arrowIds = arrows.map((n) => n.id);
	const mixedSides = polygons.length > 1 && new Set(polygons.map((n) => Math.max(3, Math.round(("sides" in n ? n.sides : void 0) ?? 5)))).size > 1;
	const mixedHead = arrows.length > 1 && new Set(arrows.map((n) => Math.round((("headScale" in n ? n.headScale : void 0) ?? 1) * 100) / 100)).size > 1;
	const sidesValue = Math.max(3, Math.round(("sides" in first ? first.sides : void 0) ?? 5));
	const headValue = ("headScale" in first ? first.headScale : void 0) ?? 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border-b border-border py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: ["Stroke · ", outlines.length]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[10px] text-ink-dim",
				children: "Width, dash, cap, join, miter, sides, and arrow head write onto selected outlines — paths, rectangles, ellipses, lines, polygons, stars, and arrows. Scrub any of those for a live phosphor overlay. Zero dash is a solid stroke. A chip stamps that outline’s values onto the rest of the pick."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedWidth ? "Width · mixed" : `Width ${Math.round(width)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: cn("range-phosphor min-w-0 flex-1", mixedWidth && "opacity-70"),
						min: 0,
						max: 48,
						step: 1,
						"aria-label": mixedWidth ? "path stroke width mixed" : "path stroke width",
						value: mixedWidth ? 0 : width,
						onChange: (e) => {
							const v = Number(e.target.value);
							updateNodes(ids, { strokeWidth: v });
							ghostStroke({ strokeWidth: v });
						},
						onPointerUp: () => {
							useDesign.getState().commit();
							ghostStroke(null);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: width,
						mixed: mixedWidth,
						min: 0,
						max: 96,
						"aria-label": "path stroke width",
						onCommit: (n) => updateNodes(ids, { strokeWidth: n }, true)
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixed ? "Dash · mixed" : `Dash ${Math.round(value)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: cn("range-phosphor min-w-0 flex-1", mixed && "opacity-70"),
						min: 0,
						max: 48,
						step: 1,
						"aria-label": mixed ? "path stroke dash mixed" : "path stroke dash",
						value: mixed ? 0 : value,
						onChange: (e) => {
							const v = Number(e.target.value);
							updateNodes(ids, { strokeDash: v });
							ghostStroke({ strokeDash: v });
						},
						onPointerUp: () => {
							useDesign.getState().commit();
							ghostStroke(null);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value,
						mixed,
						min: 0,
						max: 96,
						"aria-label": "path stroke dash",
						onCommit: (n) => updateNodes(ids, { strokeDash: n }, true)
					})]
				})
			}),
			mixed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: outlines.map((n) => {
					const d = n.strokeDash ?? 0;
					const label = dashChipLabel(d);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: chipClass(),
						title: `Unify dash with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify dash with ${n.name || n.kind}: ${label}`,
						onClick: () => updateNodes(ids, { strokeDash: d }, true),
						children: label
					}, `dash-${n.id}`);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedOffset ? "Offset · mixed" : `Offset ${Math.round(offset)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: cn("range-phosphor min-w-0 flex-1", mixedOffset && "opacity-70"),
						min: -48,
						max: 48,
						step: 1,
						"aria-label": mixedOffset ? "path dash offset mixed" : "path dash offset",
						value: mixedOffset ? 0 : offset,
						onChange: (e) => {
							const v = Number(e.target.value);
							updateNodes(ids, { strokeDashOffset: v });
							ghostStroke({ strokeDashOffset: v });
						},
						onPointerUp: () => {
							useDesign.getState().commit();
							ghostStroke(null);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: offset,
						mixed: mixedOffset,
						min: -96,
						max: 96,
						"aria-label": "path dash offset",
						onCommit: (n) => updateNodes(ids, { strokeDashOffset: n }, true)
					})]
				})
			}),
			mixedOffset && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: outlines.map((n) => {
					const off = n.strokeDashOffset ?? 0;
					const label = dashOffsetChipLabel(off);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: chipClass(),
						title: `Unify dash offset with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify dash offset with ${n.name || n.kind}: ${label}`,
						onClick: () => updateNodes(ids, { strokeDashOffset: off }, true),
						children: label
					}, `off-${n.id}`);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedCap ? "Cap · mixed" : "Cap",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: "field",
					value: mixedCap ? "" : cap,
					"aria-label": mixedCap ? "path line cap mixed" : "path line cap",
					onMouseEnter: () => ghostStroke({ lineCap: mixedCap ? "round" : cap }),
					onFocus: () => ghostStroke({ lineCap: mixedCap ? "round" : cap }),
					onMouseLeave: () => ghostStroke(null),
					onBlur: () => ghostStroke(null),
					onChange: (e) => {
						const v = e.target.value;
						updateNodes(ids, { lineCap: v }, true);
						ghostStroke({ lineCap: v });
					},
					children: [mixedCap && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						disabled: true,
						children: "—"
					}), CAPS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: c,
						children: c
					}, c))]
				})
			}),
			mixedCap && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedCapLegend, { outlines }),
			mixedCap && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: outlines.map((n) => {
					const c = n.lineCap ?? "round";
					const label = capChipLabel(c);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: chipClass(),
						title: `Unify cap with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify cap with ${n.name || n.kind}: ${label}`,
						onClick: () => updateNodes(ids, { lineCap: c }, true),
						children: label
					}, `cap-${n.id}`);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedJoin ? "Join · mixed" : "Join",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: "field",
					value: mixedJoin ? "" : join,
					"aria-label": mixedJoin ? "path line join mixed" : "path line join",
					onMouseEnter: () => ghostStroke({ lineJoin: mixedJoin ? "round" : join }),
					onFocus: () => ghostStroke({ lineJoin: mixedJoin ? "round" : join }),
					onMouseLeave: () => ghostStroke(null),
					onBlur: () => ghostStroke(null),
					onChange: (e) => {
						const v = e.target.value;
						updateNodes(ids, { lineJoin: v }, true);
						ghostStroke({ lineJoin: v });
					},
					children: [mixedJoin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						disabled: true,
						children: "—"
					}), JOINS.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: j,
						children: j
					}, j))]
				})
			}),
			mixedJoin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedJoinLegend, { outlines }),
			mixedJoin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: outlines.map((n) => {
					const j = n.lineJoin ?? "round";
					const label = joinChipLabel(j);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: chipClass(),
						title: `Unify join with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify join with ${n.name || n.kind}: ${label}`,
						onClick: () => updateNodes(ids, { lineJoin: j }, true),
						children: label
					}, `join-${n.id}`);
				})
			}),
			mixedRhythm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: outlines.map((n) => {
					const d = n.strokeDash ?? 0;
					const c = n.lineCap ?? "round";
					const j = n.lineJoin ?? "round";
					const label = strokeRhythmChipLabel(d, c, j);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: chipClass(),
						title: `Unify dash / cap / join with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify dash / cap / join with ${n.name || n.kind}: ${label}`,
						onClick: () => updateNodes(ids, {
							strokeDash: d,
							lineCap: c,
							lineJoin: j
						}, true),
						children: label
					}, `rhythm-${n.id}`);
				})
			}),
			(mixedJoin || join === "miter") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedMiter ? "Miter · mixed" : `Miter ${Math.round(miter)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: cn("range-phosphor min-w-0 flex-1", mixedMiter && "opacity-70"),
						min: 1,
						max: 20,
						step: .5,
						"aria-label": mixedMiter ? "path miter limit mixed" : "path miter limit",
						value: mixedMiter ? 4 : miter,
						onChange: (e) => {
							const v = Number(e.target.value);
							updateNodes(ids, { miterLimit: v });
							ghostStroke({ miterLimit: v });
						},
						onPointerUp: () => {
							useDesign.getState().commit();
							ghostStroke(null);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: miter,
						mixed: mixedMiter,
						min: 1,
						max: 40,
						"aria-label": "path miter limit",
						onCommit: (n) => updateNodes(ids, { miterLimit: n }, true)
					})]
				})
			}),
			mixedMiter && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: outlines.map((n) => {
					const m = n.miterLimit ?? 4;
					const label = miterChipLabel(m);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: chipClass(),
						title: `Unify miter with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify miter with ${n.name || n.kind}: ${label}`,
						onClick: () => updateNodes(ids, { miterLimit: m }, true),
						children: label
					}, `mit-${n.id}`);
				})
			}),
			polygons.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedSides ? "Sides · mixed" : `Sides ${sidesValue}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: cn("range-phosphor min-w-0 flex-1", mixedSides && "opacity-70"),
						min: 3,
						max: 16,
						step: 1,
						"aria-label": mixedSides ? "polygon sides mixed" : "polygon sides",
						value: mixedSides ? 5 : sidesValue,
						onChange: (e) => {
							const v = Number(e.target.value);
							updateNodes(polyIds, { sides: v });
							ghostStroke({ sides: v });
						},
						onPointerUp: () => {
							useDesign.getState().commit();
							ghostStroke(null);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: sidesValue,
						mixed: mixedSides,
						min: 3,
						max: 24,
						"aria-label": "polygon sides",
						onCommit: (n) => updateNodes(polyIds, { sides: n }, true)
					})]
				})
			}),
			mixedSides && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: polygons.map((n) => {
					const s = Math.max(3, Math.round(("sides" in n ? n.sides : void 0) ?? 5));
					const label = sidesChipLabel(s, n.kind);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: chipClass(),
						title: `Unify sides with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify sides with ${n.name || n.kind}: ${label}`,
						onClick: () => updateNodes(polyIds, { sides: s }, true),
						children: label
					}, `sides-${n.id}`);
				})
			}),
			arrows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedHead ? "Head · mixed" : `Head ${Math.round(headValue * 100)}%`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: cn("range-phosphor min-w-0 flex-1", mixedHead && "opacity-70"),
						min: .4,
						max: 2.4,
						step: .05,
						"aria-label": mixedHead ? "arrow head scale mixed" : "arrow head scale",
						value: mixedHead ? 1 : headValue,
						onChange: (e) => {
							const v = Number(e.target.value);
							updateNodes(arrowIds, { headScale: v });
							ghostStroke({ headScale: v });
						},
						onPointerUp: () => {
							useDesign.getState().commit();
							ghostStroke(null);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: Math.round(headValue * 100),
						mixed: mixedHead,
						min: 20,
						max: 300,
						"aria-label": "arrow head scale",
						onCommit: (n) => updateNodes(arrowIds, { headScale: n / 100 }, true)
					})]
				})
			}),
			mixedHead && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: arrows.map((n) => {
					const h = ("headScale" in n ? n.headScale : void 0) ?? 1;
					const label = headScaleChipLabel(h);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: chipClass(),
						title: `Unify arrowhead with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify arrowhead with ${n.name || n.kind}: ${label}`,
						onClick: () => updateNodes(arrowIds, { headScale: h }, true),
						children: label
					}, `head-${n.id}`);
				})
			})
		]
	});
}
function ghostRadius(radius) {
	useDesign.getState().setStrokeGhost(radius == null ? null : { radius });
}
function MixedGeometry({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	if (nodes.length < 2) return null;
	const ids = nodes.map((n) => n.id);
	const mixedRotation = new Set(nodes.map((n) => rotationKey(n.rotation))).size > 1;
	const mixedRadius = new Set(nodes.map((n) => radiusKey(n.radius))).size > 1;
	const first = nodes[0];
	const maxRadius = Math.max(0, ...nodes.map((n) => Math.min(n.w, n.h) / 2));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border-b border-border py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: ["Geometry · ", nodes.length]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[10px] text-ink-dim",
				children: "Mixed rotation and radius write onto every selected layer. A chip stamps that layer’s angle or corner."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedRotation ? "Rotate · mixed" : `Rotate ${Math.round(first.rotation)}°`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: cn("range-phosphor min-w-0 flex-1", mixedRotation && "opacity-70"),
						min: -180,
						max: 180,
						"aria-label": mixedRotation ? "selection rotate mixed" : "selection rotate",
						value: first.rotation,
						onChange: (e) => updateNodes(ids, { rotation: Number(e.target.value) }),
						onPointerUp: () => useDesign.getState().commit()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: first.rotation,
						min: -180,
						max: 180,
						"aria-label": "selection rotate",
						onCommit: (n) => updateNodes(ids, { rotation: n }, true)
					})]
				})
			}),
			mixedRotation && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: nodes.map((n) => {
					const label = rotationChipLabel(n.rotation);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
						title: `Unify rotation with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify rotation with ${n.name || n.kind}: ${label}`,
						onClick: () => updateNodes(ids, { rotation: n.rotation }, true),
						children: label
					}, `rot-${n.id}`);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: mixedRadius ? "Radius · mixed" : `Radius ${Math.round(first.radius)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: cn("range-phosphor min-w-0 flex-1", mixedRadius && "opacity-70"),
						min: 0,
						max: Math.max(1, maxRadius),
						"aria-label": mixedRadius ? "selection radius mixed" : "selection radius",
						value: first.radius,
						onChange: (e) => {
							const r = Number(e.target.value);
							ghostRadius(r);
							updateNodes(ids, { radius: r });
						},
						onPointerDown: () => ghostRadius(first.radius),
						onPointerUp: () => {
							ghostRadius(null);
							useDesign.getState().commit();
						},
						onPointerLeave: () => ghostRadius(null),
						onBlur: () => ghostRadius(null)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						className: "field w-16 font-mono",
						value: first.radius,
						min: 0,
						max: Math.max(1, maxRadius),
						"aria-label": "selection radius",
						onCommit: (n) => updateNodes(ids, { radius: n }, true)
					})]
				})
			}),
			mixedRadius && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 flex flex-wrap gap-1",
				children: nodes.map((n) => {
					const label = radiusChipLabel(n.radius);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
						title: `Unify radius with ${n.name || n.kind}: ${label}`,
						"aria-label": `Unify radius with ${n.name || n.kind}: ${label}`,
						onMouseEnter: () => ghostRadius(n.radius),
						onFocus: () => ghostRadius(n.radius),
						onMouseLeave: () => ghostRadius(null),
						onBlur: () => ghostRadius(null),
						onClick: () => updateNodes(ids, { radius: n.radius }, true),
						children: label
					}, `rad-${n.id}`);
				})
			})
		]
	});
}
function setBooleanPreview(op) {
	useDesign.setState({ booleanPreview: op });
}
function applyBoolean(op) {
	const { doc, selection, commit } = useDesign.getState();
	if (!doc || selection.length < 2) return;
	const order = selection.map((id) => doc.nodes.find((n) => n.id === id)).filter((n) => Boolean(n));
	const parts = computeBooleanParts(order, op);
	if (!parts.length) return;
	const islands = parts.flatMap((part) => splitCompoundIslands(part));
	if (!islands.length) return;
	commit("Boolean");
	const keepId = order[0].id;
	const drop = new Set(order.map((n) => n.id));
	drop.delete(keepId);
	const stamped = islands.map((island, i) => i === 0 ? {
		...island,
		id: keepId,
		name: island.name
	} : island);
	const extras = stamped.slice(1);
	const live = useDesign.getState().doc;
	if (!live) return;
	const replaced = live.nodes.map((n) => n.id === keepId ? stamped[0] : n).filter((n) => !drop.has(n.id));
	const keepIdx = replaced.findIndex((n) => n.id === keepId);
	const nextNodes = [...replaced];
	if (keepIdx >= 0) nextNodes.splice(keepIdx + 1, 0, ...extras);
	else nextNodes.push(...extras);
	useDesign.setState({
		doc: {
			...live,
			nodes: nextNodes
		},
		selection: stamped.map((n) => n.id),
		booleanPreview: null,
		dirty: true
	});
}
function requestFitSelection() {
	useDesign.setState({ viewIntent: { type: "fit-sel" } });
}
function smoothSelectedPath() {
	const { doc, selection, commit, replaceNode } = useDesign.getState();
	if (!doc || !selection.length) return;
	const n = doc.nodes.find((x) => x.id === selection[0]);
	if (!n || !isPath(n) || n.points.length < 2) return;
	commit("Smooth path");
	replaceNode(n.id, {
		...n,
		points: smoothPathCorners(n.points, n.closed),
		holes: n.holes?.map((h) => smoothPathCorners(h, true))
	}, false);
}
var OPS = [
	{
		op: "union",
		label: "Union"
	},
	{
		op: "subtract",
		label: "Subtract"
	},
	{
		op: "intersect",
		label: "Intersect"
	},
	{
		op: "exclude",
		label: "Exclude"
	}
];
function BooleanButtons() {
	const doc = useDesign((s) => s.doc);
	const selection = useDesign((s) => s.selection);
	const booleanPreview = useDesign((s) => s.booleanPreview ?? null);
	if (!doc) return null;
	const count = selection.filter((id) => {
		const n = doc.nodes.find((x) => x.id === id);
		return n ? canBoolean(n) : false;
	}).length;
	if (count < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 px-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 text-[10px] uppercase tracking-wide text-ink-dim",
			children: ["Boolean", count > 2 ? ` · ${count}` : ""]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-2 gap-1",
			children: OPS.map(({ op, label }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: cn("h-8 rounded-[8px] border text-[10px]", booleanPreview === op ? "border-phosphor bg-phosphor/15 text-phosphor" : "border-border text-ink-dim hover:border-phosphor hover:text-ink"),
				onMouseEnter: () => setBooleanPreview(op),
				onMouseLeave: () => setBooleanPreview(null),
				onFocus: () => setBooleanPreview(op),
				onBlur: () => setBooleanPreview(null),
				onClick: () => applyBoolean(op),
				children: label
			}, op))
		})]
	});
}
var PRINT_RAIL_KEY = "the-voice-design-print-rail";
function loadPrintRail() {
	try {
		return window.localStorage.getItem(PRINT_RAIL_KEY) === "1";
	} catch {
		return false;
	}
}
function savePrintRail(rail) {
	try {
		window.localStorage.setItem(PRINT_RAIL_KEY, rail ? "1" : "0");
	} catch {}
}
var EDGE_CHIPS = [
	["top", "T"],
	["right", "R"],
	["bottom", "B"],
	["left", "L"]
];
function InspectorPrint() {
	const doc = useDesign((s) => s.doc);
	const printMarks = useDesign((s) => s.printMarks);
	const togglePrintMarks = useDesign((s) => s.togglePrintMarks);
	const setBleed = useDesign((s) => s.setBleed);
	const setBleedEdges = useDesign((s) => s.setBleedEdges);
	const [rail, setRail] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setRail(loadPrintRail());
	}, []);
	function setRailMode(next) {
		setRail(next);
		savePrintRail(next);
	}
	const addGuide = useDesign((s) => s.addGuide);
	const moveGuide = useDesign((s) => s.moveGuide);
	const removeGuide = useDesign((s) => s.removeGuide);
	const clearGuides = useDesign((s) => s.clearGuides);
	const guideSelection = useDesign((s) => s.guideSelection);
	const selectGuides = useDesign((s) => s.selectGuides);
	const distributeSelectedGuides = useDesign((s) => s.distributeSelectedGuides);
	const probe = useDesign((s) => s.guideProbe);
	if (!doc) return null;
	const edges = resolveBleed(doc);
	const uniform = uniformBleed(edges);
	const guides = doc.guides ?? [];
	const bleedChips = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1",
		"data-testid": "bleed-edge-chips",
		children: EDGE_CHIPS.map(([edge, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: cn("inline-flex h-7 min-w-0 items-center gap-1 rounded-[8px] border px-1.5 font-mono text-[10px]", edges[edge] > 0 ? "border-phosphor/40 bg-phosphor/10 text-phosphor" : "border-border text-ink-dim"),
			"aria-label": `bleed ${edge} ${edges[edge]}`,
			title: `${label} bleed ${edges[edge]} px — click to cycle 0 / 3 mm / 6 mm`,
			onClick: () => {
				const cur = edges[edge];
				const steps = BLEED_PRESETS.map((p) => p.px);
				const next = steps[(steps.findIndex((px) => px === cur) + 1) % steps.length] ?? 0;
				setBleedEdges({ [edge]: next });
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: edges[edge] })]
		}, edge))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border-b border-border py-3",
		"data-print-rail": rail ? "1" : "0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: "Print"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-6 rounded-[6px] border border-border px-1.5 font-mono text-[9px] tracking-wide text-ink-dim hover:border-phosphor hover:text-ink",
				"aria-pressed": rail,
				"aria-label": rail ? "expand print panel" : "collapse print panel to rail",
				onClick: () => setRailMode(!rail),
				children: rail ? "Open" : "Rail"
			})]
		}), rail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("h-7 shrink-0 rounded-[8px] border px-2 text-[10px]", printMarks ? "border-phosphor/40 bg-phosphor/10 text-phosphor" : "border-border text-ink-dim"),
					"aria-pressed": Boolean(printMarks),
					onClick: togglePrintMarks,
					children: "Marks"
				}), bleedChips]
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 text-[11px] text-ink-dim",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: Boolean(printMarks),
						onChange: togglePrintMarks
					}), "Print marks"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Bleed",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-1",
						children: BLEED_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: cn("h-7 rounded-[8px] text-[10px]", uniform === p.px ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim"),
							onClick: () => setBleed(p.px),
							children: p.label
						}, p.id))
					})
				}),
				bleedChips,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2",
					children: EDGE_CHIPS.map(([edge, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
							value: edges[edge],
							min: 0,
							"aria-label": `bleed ${edge}`,
							onCommit: (n) => setBleedEdges({ [edge]: n })
						})
					}, edge))
				})
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
		title: "Guides",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 grid grid-cols-4 gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
						onClick: () => addGuide("x", Math.round(doc.artboard.width / 2)),
						children: "Add V"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
						onClick: () => addGuide("y", Math.round(doc.artboard.height / 2)),
						children: "Add H"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !guides.length,
						className: cn("h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink", !guides.length && "opacity-40"),
						onClick: () => clearGuides(),
						children: "Clear"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !canDistributeGuides(guides, guideSelection ?? []),
						className: cn("h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink", !canDistributeGuides(guides, guideSelection ?? []) && "opacity-40"),
						title: "Space selected guides of the same axis evenly between the first and last",
						onClick: () => distributeSelectedGuides(),
						children: "Even"
					})
				]
			}),
			probe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-1 font-mono text-[10px] text-phosphor",
				children: formatGuideProbe(probe)
			}) : null,
			guidePairs(guides).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-1 font-mono text-[10px] text-ink-dim",
				children: guidePairs(guides).map(formatGuidePair).join("  ·  ")
			}) : null,
			guides.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] text-ink-dim",
				children: "Drag a ruler onto the board, or add a guide here."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: guides.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: cn("flex items-center gap-1 rounded-[6px] px-0.5", (guideSelection ?? []).includes(g.id) && "bg-phosphor/10"),
					onClick: (e) => selectGuides?.([g.id], e.shiftKey),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuideDragHandle, { guide: g }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
							className: "field min-w-0 flex-1 font-mono",
							value: g.pos,
							"aria-label": `${g.axis === "x" ? "vertical" : "horizontal"} guide`,
							onCommit: (n) => {
								const s = useDesign.getState();
								if (!s.doc) return;
								const next = s.snap ? snapGuideToObjects(g.axis, n, s.doc.nodes, s.doc.artboard).pos : n;
								moveGuide(g.id, next);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-7 shrink-0 rounded-[8px] border border-border px-1.5 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
							"aria-label": "remove guide",
							onClick: () => removeGuide(g.id),
							children: "Del"
						})
					]
				}, g.id))
			})
		]
	})] });
}
function GuideDragHandle({ guide }) {
	const drag = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "w-5 shrink-0 cursor-grab rounded-[6px] text-[10px] text-phosphor active:cursor-grabbing",
		"aria-label": `drag ${guide.axis === "x" ? "vertical" : "horizontal"} guide`,
		title: "Drag to move — snaps to objects",
		onPointerDown: (e) => {
			e.currentTarget.setPointerCapture(e.pointerId);
			drag.current = {
				start: guide.axis === "x" ? e.clientX : e.clientY,
				origin: guide.pos
			};
		},
		onPointerMove: (e) => {
			const live = drag.current;
			if (!live) return;
			const s = useDesign.getState();
			if (!s.doc) return;
			const zoom = s.viewport.zoom || 1;
			const raw = live.origin + ((guide.axis === "x" ? e.clientX : e.clientY) - live.start) / zoom;
			const next = s.snap && !e.altKey ? snapGuideToObjects(guide.axis, raw, s.doc.nodes, s.doc.artboard).pos : raw;
			s.moveGuide(guide.id, Math.round(next * 10) / 10);
			const others = (s.doc.guides ?? []).filter((g) => g.axis === guide.axis && g.id !== guide.id).map((g) => g.pos);
			s.setGuideProbe(guideProbe(guide.axis, next, s.doc.nodes, s.doc.artboard, others));
		},
		onPointerUp: () => {
			drag.current = null;
			useDesign.getState().setGuideProbe(null);
		},
		onPointerCancel: () => {
			drag.current = null;
			useDesign.getState().setGuideProbe(null);
		},
		children: guide.axis === "x" ? "V" : "H"
	});
}
var EDGES = [
	"left",
	"center",
	"right",
	"top",
	"middle",
	"bottom"
];
var EDGE_LABEL = {
	left: "Left",
	center: "Center",
	right: "Right",
	top: "Top",
	middle: "Middle",
	bottom: "Bottom"
};
function useAlign() {
	return {
		live: (0, import_react.useSyncExternalStore)(subscribeAlignPreview, getAlignPreview, getAlignPreview),
		echo: (0, import_react.useSyncExternalStore)(subscribeAlignCommitEcho, getAlignCommitEcho, getAlignCommitEcho),
		target: (0, import_react.useSyncExternalStore)(subscribeAlignTarget, getAlignTarget, getAlignTarget)
	};
}
function useDistribute() {
	return (0, import_react.useSyncExternalStore)(subscribeDistributePreview, getDistributePreview, getDistributePreview);
}
function Inspector() {
	const doc = useDesign((s) => s.doc);
	const selection = useDesign((s) => s.selection);
	const updateNodes = useDesign((s) => s.updateNodes);
	const rail = (0, import_react.useSyncExternalStore)(subscribeInspectorRail, getInspectorRail, getInspectorRail);
	const { live, echo, target } = useAlign();
	const distribute = useDistribute();
	if (!doc) return null;
	const selectedNodes = doc.nodes.filter((n) => selection.includes(n.id));
	const node = selectedNodes.length === 1 ? selectedNodes[0] : null;
	const texts = selectedNodes.filter((n) => isText(n));
	const paths = selectedNodes.filter((n) => isPath(n));
	const outlines = selectedNodes.filter((n) => [
		"path",
		"rect",
		"ellipse",
		"line",
		"polygon",
		"star",
		"arrow"
	].includes(n.kind));
	const rects = selectedNodes.filter((n) => n.kind === "rect");
	const multi = selectedNodes.length > 1;
	const ids = selectedNodes.map((n) => n.id);
	const mixedOpacity = multi && new Set(selectedNodes.map((n) => n.opacity)).size > 1;
	const mixedBlend = multi && new Set(selectedNodes.map((n) => n.blend)).size > 1;
	const mixedKinds = texts.length < selectedNodes.length;
	const mixedKindsGeom = outlines.length > 0 && outlines.length < selectedNodes.length;
	const mixedDash = outlines.length > 1 && new Set(outlines.map((n) => n.strokeDash)).size > 1;
	function setOpacity(v) {
		updateNodes(multi ? ids : [node.id], { opacity: v });
	}
	function setBlend(v) {
		updateNodes(multi ? ids : [node.id], { blend: v });
	}
	const commitLine = echo ? alignCommitLayerFadeLine(echo.chipLabel, echo.fadePill ?? "", echo.moveCount) : null;
	const solidLead = echo ? alignCommitSolidLead(echo.chipLabel, echo.moveCount) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col text-sm", rail && "opacity-90"),
		"data-inspector-rail": rail ? "1" : "0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-b border-border px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: selectedNodes.length === 0 ? "Artboard" : selectedNodes.length === 1 ? node.kind : `${selectedNodes.length} layers`
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-6 rounded-[6px] border border-border px-1.5 font-mono text-[9px] tracking-wide text-ink-dim hover:border-phosphor hover:text-ink",
				"aria-label": rail ? "expand inspector" : "collapse inspector to rail",
				"aria-pressed": rail,
				onClick: () => setInspectorRail(!rail),
				children: rail ? "Open" : "Rail"
			})]
		}), rail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-3 py-2 text-[11px] text-ink-dim",
			children: "Inspector collapsed. Equal-gap size lives on the canvas tick."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-1 px-3 pb-4",
			children: [
				selectedNodes.length >= 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Align",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-1",
							"data-align-target": target,
							"data-align-target-chip": target,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: cn("h-7 flex-1 rounded-[8px] border text-[11px]", target === "key" ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-border text-ink-dim"),
								onClick: () => setAlignTarget("key"),
								children: "Align to key"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: cn("h-7 flex-1 rounded-[8px] border text-[11px]", target === "board" ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-border text-ink-dim"),
								onClick: () => setAlignTarget("board"),
								children: "Align to board"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-1",
							children: EDGES.map((edge) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"data-align": edge,
								"data-align-edge": edge,
								"data-align-board": target === "board" ? edge : void 0,
								className: cn("h-7 rounded-[8px] border text-[10px]", live?.edge === edge && live.target === target ? "border-phosphor bg-phosphor/15 text-phosphor" : "border-border text-ink-dim hover:text-ink"),
								onClick: () => armAlignPreview(edge, target),
								onDoubleClick: () => commitAlignPreview(),
								children: EDGE_LABEL[edge]
							}, edge))
						}),
						target === "key" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sr-only",
							children: "Key"
						}),
						live && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1 text-[10px] text-ink-dim",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									"data-align-key-name": live.keyName,
									children: live.keyName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									"data-align-preview-chip": alignEdgeChipLabel(live),
									"data-align-preview-line": true,
									"data-align-stay": live.ghosts.filter((g) => g.stay).length,
									"data-align-move": live.deltas.length,
									children: alignEdgeChipLabel(live)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-7 rounded-[8px] bg-phosphor text-phosphor-ink",
									onClick: () => commitAlignPreview(),
									children: "Commit left"
								})
							]
						}),
						echo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"data-align-commit-line": true,
							"data-align-commit-pill": echo.fadePill ?? "",
							"data-align-commit-chip": echo.chipLabel,
							className: "text-[10px] text-ink-dim",
							children: [solidLead, echo.fadePill ? ` · ${commitLine}` : ""]
						})
					]
				}),
				selectedNodes.length >= 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Distribute",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1",
						children: ["h", "v"].map((axis) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-distribute": axis,
							className: cn("h-7 flex-1 rounded-[8px] border text-[11px]", distribute?.axis === axis ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-border text-ink-dim"),
							onClick: () => armDistributePreview(axis),
							children: axis === "h" ? "+ H" : "+ V"
						}, axis))
					}), distribute && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1 text-[10px] text-ink-dim",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								"data-distribute-gap": distribute.gap,
								children: [Math.round(distribute.gap), " gap"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "data-distribute-stay": distribute.ghosts.filter((g) => g.stay).length }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "data-distribute-move": distribute.deltas.length }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-7 rounded-[8px] bg-phosphor text-phosphor-ink",
								onClick: () => commitDistributePreview(),
								children: "Commit across"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-equal-gap-hold": true,
					className: "sr-only",
					children: "Matched spacing while a drag or arrow holds the snap"
				}),
				selectedNodes.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Artboard",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							value: doc.name,
							onChange: (e) => useDesign.setState({
								doc: {
									...doc,
									name: e.target.value
								},
								dirty: true
							}),
							onBlur: () => useDesign.getState().commit()
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Size",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-ink",
							children: [
								doc.artboard.w,
								" × ",
								doc.artboard.h
							]
						})
					})]
				}),
				node && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Transform",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "X",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
										value: node.x,
										onCommit: (v) => updateNodes([node.id], { x: v }),
										"aria-label": "x"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Y",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
										value: node.y,
										onCommit: (v) => updateNodes([node.id], { y: v }),
										"aria-label": "y"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "W",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
										value: node.w,
										onCommit: (v) => updateNodes([node.id], { w: Math.max(1, v) }),
										"aria-label": "w"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "H",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
										value: node.h,
										onCommit: (v) => updateNodes([node.id], { h: Math.max(1, v) }),
										"aria-label": "h"
									})
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: `Rotate ${Math.round(node.rotation)}°`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								className: "range-phosphor w-full",
								min: -180,
								max: 180,
								value: node.rotation,
								onChange: (e) => updateNodes([node.id], { rotation: Number(e.target.value) }),
								onPointerUp: () => useDesign.getState().commit()
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Appearance",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Opacity",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									className: "range-phosphor w-full",
									min: 0,
									max: 1,
									step: .01,
									value: node.opacity,
									onChange: (e) => setOpacity(Number(e.target.value)),
									onPointerUp: () => useDesign.getState().commit()
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Blend",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									className: "field",
									value: node.blend,
									onChange: (e) => setBlend(e.target.value),
									children: [
										"source-over",
										"multiply",
										"screen",
										"overlay",
										"darken",
										"lighten"
									].map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: b,
										children: b
									}, b))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillEditor, { node })
						]
					}),
					isText(node) && texts.length === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Type",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextFields, {
							node,
							hideType: false
						})
					}),
					isPath(node) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Path",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PathFields, { node })
					}),
					(node.kind === "image" || node.kind === "paint") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Image",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageAdjust, { node })
					}),
					isGroup(node) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Group",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] text-ink-dim",
							children: "Rotation rides the group on the board, PNG, and SVG. The nest turns as one unit against the artboard. Children still wrap that nest. Each layer still keeps its own opacity. Isolates this group. Do not paint a box."
						})
					}),
					(node.kind === "ellipse" || node.kind === "line" || node.kind === "rect") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Shape",
						children: [
							node.kind === "ellipse" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-ink-dim",
								children: "Ellipse"
							}),
							node.kind === "line" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-ink-dim",
								children: "Line"
							}),
							node.kind === "rect" && node.radius > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: `Radius ${node.radius}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									className: "range-phosphor w-full",
									min: 0,
									max: Math.min(node.w, node.h) / 2,
									value: node.radius,
									onChange: (e) => updateNodes([node.id], { radius: Number(e.target.value) }),
									onPointerUp: () => useDesign.getState().commit()
								})
							})
						]
					})
				] }),
				multi && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Shared",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: mixedOpacity ? "Opacity · mixed" : `Opacity ${Math.round((selectedNodes[0]?.opacity ?? 1) * 100)}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								className: cn("range-phosphor w-full", mixedOpacity && "opacity-70"),
								min: 0,
								max: 1,
								step: .01,
								value: mixedOpacity ? 1 : selectedNodes[0]?.opacity ?? 1,
								"aria-label": mixedOpacity ? "opacity mixed" : "opacity",
								onChange: (e) => setOpacity(Number(e.target.value)),
								onPointerUp: () => useDesign.getState().commit()
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: mixedBlend ? "Blend · mixed" : "Blend",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "field",
								value: mixedBlend ? "source-over" : selectedNodes[0]?.blend ?? "source-over",
								"aria-label": mixedBlend ? "blend mixed" : "blend",
								onChange: (e) => setBlend(e.target.value),
								children: [
									"source-over",
									"multiply",
									"screen",
									"overlay",
									"darken",
									"lighten"
								].map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: b,
									children: b
								}, b))
							})
						})]
					}),
					texts.length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedType, { nodes: texts }),
					texts.length >= 1 && mixedKinds && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedTypeColour, {
						nodes: texts,
						brandColors: useDesign.getState().brand.colors,
						ink: useDesign.getState().color
					}),
					outlines.length >= 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedPathDash, { nodes: outlines }),
					paths.length >= 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedFillRule, { nodes: paths }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedFilters, { nodes: selectedNodes }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedGeometry, { nodes: selectedNodes }),
					mixedDash && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: "path stroke dash mixed"
					}),
					mixedKindsGeom && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: "Unify radius with geometry"
					}),
					paths.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: paths.map((p) => p.id).join(",")
					}),
					rects.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: rects.map((r) => r.id).join(",")
					})
				] }),
				selectedNodes.length >= 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShadowEditor, { nodes: selectedNodes }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BooleanButtons, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectorPrint, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BleedFields, {})
			]
		})]
	});
}
/** Bleed preset chips mirrored for the artboard rail. */
function BleedFields() {
	const doc = useDesign((s) => s.doc);
	const setBleed = useDesign((s) => s.setBleed);
	const togglePrintMarks = useDesign((s) => s.togglePrintMarks);
	const printMarks = useDesign((s) => s.printMarks);
	const addGuide = useDesign((s) => s.addGuide);
	if (!doc) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
		title: "Print marks",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: cn("h-7 rounded-[8px] border px-2 text-[11px]", printMarks ? "border-phosphor text-phosphor" : "border-border text-ink-dim"),
				onClick: () => togglePrintMarks(),
				children: ["Print marks ", printMarks ? "on" : "off"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim",
						onClick: () => setBleed(0),
						children: "None"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim",
						onClick: () => setBleed(11.34),
						children: "3 mm"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim",
						onClick: () => setBleed(22.68),
						children: "6 mm"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim",
					onClick: () => addGuide?.("x", doc.artboard.w / 2),
					children: "+ V"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim",
					onClick: () => addGuide?.("y", doc.artboard.h / 2),
					children: "+ H"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-7 rounded-[8px] border border-border text-[11px] text-ink-dim",
				onClick: () => addGuide?.("y", 40),
				children: "Add vertical"
			}),
			[
				"top",
				"right",
				"bottom",
				"left"
			].map((edge) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "sr-only",
				"aria-label": `bleed ${edge}`,
				children: ["bleed $", edge]
			}, edge)),
			(doc.guides ?? []).map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "sr-only",
				onPointerDown: () => useDesign.getState().moveGuide(g.id, g.pos),
				children: ["drag $", g.axis]
			}, g.id))
		]
	});
}
function LayersPanel() {
	const doc = useDesign((s) => s.doc);
	const selection = useDesign((s) => s.selection);
	const alignEcho = (0, import_react.useSyncExternalStore)(subscribeAlignCommitEcho, getAlignCommitEcho, getAlignCommitEcho);
	const alignPill = alignEcho?.fadePill ?? null;
	const alignSolid = alignEcho ? alignCommitSolidLead(alignEcho.chipLabel, alignEcho.moveCount) : null;
	const alignFade = alignEcho && alignPill ? alignCommitLayerFadeLine(alignEcho.chipLabel, alignPill, alignEcho.moveCount) : null;
	const alignPreview = (0, import_react.useSyncExternalStore)(subscribeAlignPreview, getAlignPreview, getAlignPreview);
	const previewChip = alignPreview ? alignEdgeChipLabel(alignPreview) : null;
	const previewMovers = alignPreview ? alignPreviewMoverIds(alignPreview) : [];
	const select = useDesign((s) => s.select);
	const updateNodes = useDesign((s) => s.updateNodes);
	const toggleIsolate = useDesign((s) => s.toggleIsolate);
	const isolateSnapshot = useDesign((s) => s.isolateSnapshot);
	const reorder = useDesign((s) => s.reorder);
	const dropLayers = useDesign((s) => s.dropLayers);
	const groupSelection = useDesign((s) => s.groupSelection);
	const ungroupSelection = useDesign((s) => s.ungroupSelection);
	const listRef = (0, import_react.useRef)(null);
	const dragIdsRef = (0, import_react.useRef)(null);
	const dwellRef = (0, import_react.useRef)(null);
	const [dragIds, setDragIds] = (0, import_react.useState)(null);
	const [dropHint, setDropHint] = (0, import_react.useState)(null);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [draftName, setDraftName] = (0, import_react.useState)("");
	const [editingOpacityId, setEditingOpacityId] = (0, import_react.useState)(null);
	const [opacityDraft, setOpacityDraft] = (0, import_react.useState)("");
	const [editingSizeId, setEditingSizeId] = (0, import_react.useState)(null);
	const [sizeDraft, setSizeDraft] = (0, import_react.useState)("");
	const [editingTrackId, setEditingTrackId] = (0, import_react.useState)(null);
	const [trackDraft, setTrackDraft] = (0, import_react.useState)("");
	const [editingLeadId, setEditingLeadId] = (0, import_react.useState)(null);
	const [leadDraft, setLeadDraft] = (0, import_react.useState)("");
	const [editingWeightId, setEditingWeightId] = (0, import_react.useState)(null);
	const [weightDraft, setWeightDraft] = (0, import_react.useState)("");
	const [editingFamilyId, setEditingFamilyId] = (0, import_react.useState)(null);
	const [query, setQuery] = (0, import_react.useState)("");
	if (!doc) return null;
	const needle = query.trim().toLowerCase();
	const filtering = needle.length > 0;
	const tree = flattenLayers(doc.nodes);
	const layers = filtering ? [...doc.nodes].reverse().filter((n) => {
		const name = (n.name || "").toLowerCase();
		const kind = (n.kind || "").toLowerCase();
		return name.includes(needle) || kind.includes(needle);
	}).map((node) => ({
		node,
		depth: 0
	})) : tree;
	const draggingSet = dragIds ? new Set(dragIds) : null;
	const canGroup = selection.length >= 2;
	const hintFromY = (clientY) => {
		const items = listRef.current?.querySelectorAll("[data-layer-id]");
		if (!items?.length) return null;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (!item) continue;
			const r = item.getBoundingClientRect();
			const id = item.dataset.layerId;
			if (!id) continue;
			if (clientY < r.top) return {
				mode: "before",
				anchorId: id
			};
			if (clientY <= r.bottom) {
				const y = (clientY - r.top) / Math.max(1, r.height);
				if (item.dataset.layerKind === "group" && y > .28 && y < .72) return {
					mode: "into",
					groupId: id
				};
				return y < .5 ? {
					mode: "before",
					anchorId: id
				} : {
					mode: "after",
					anchorId: id
				};
			}
		}
		const id = items[items.length - 1]?.dataset.layerId;
		return id ? {
			mode: "after",
			anchorId: id
		} : null;
	};
	const autoScroll = (clientY) => {
		const list = listRef.current;
		if (!list || list.scrollHeight <= list.clientHeight + 1) return;
		const r = list.getBoundingClientRect();
		if (clientY < r.top || clientY > r.bottom) return;
		const edge = 16;
		if (clientY < r.top + edge) list.scrollTop -= 8;
		else if (clientY > r.bottom - edge) list.scrollTop += 8;
	};
	const clearDwell = () => {
		if (dwellRef.current != null) {
			window.clearTimeout(dwellRef.current);
			dwellRef.current = null;
		}
	};
	const armDwell = (hint) => {
		clearDwell();
		if (hint?.mode !== "into") return;
		const group = doc.nodes.find((n) => n.id === hint.groupId);
		if (!group || !isGroup(group) || !group.collapsed) return;
		const id = group.id;
		dwellRef.current = window.setTimeout(() => {
			dwellRef.current = null;
			updateNodes([id], { collapsed: false }, true);
		}, 420);
	};
	const finish = (clientY) => {
		const ids = dragIdsRef.current;
		const hint = hintFromY(clientY);
		const live = useDesign.getState().doc;
		if (ids?.length && hint && live && layerDropLegal(live.nodes, ids, hint)) dropLayers(ids, hint);
		clearDwell();
		dragIdsRef.current = null;
		setDragIds(null);
		setDropHint(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-layers-panel": true,
		className: "flex min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
					children: "Layers"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "font-mono text-[10px] tracking-wide text-ink-faint",
					children: [doc.nodes.length, selection.length > 0 ? ` · ${selection.length} selected` : ""]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-2 pb-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "relative flex h-8 items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-2 size-3.5 text-ink-faint" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "search",
								value: query,
								onChange: (e) => setQuery(e.target.value),
								placeholder: "Filter layers",
								"aria-label": "Filter layers",
								className: "field h-8 w-full pl-7 pr-7 text-xs"
							}),
							query && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "absolute right-1 grid size-6 place-items-center rounded-[6px] text-ink-faint hover:text-ink",
								"aria-label": "Clear filter",
								onClick: () => setQuery(""),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-7 flex-1 rounded-[6px] border border-border font-mono text-[10px] tracking-[0.14em] text-ink-dim uppercase hover:border-phosphor hover:text-ink disabled:opacity-30",
								disabled: !canGroup,
								onClick: () => groupSelection(),
								children: "Group"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-7 flex-1 rounded-[6px] border border-border font-mono text-[10px] tracking-[0.14em] text-ink-dim uppercase hover:border-phosphor hover:text-ink",
								onClick: () => ungroupSelection(),
								children: "Ungroup"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-7 flex-1 rounded-[6px] border border-border font-mono text-[10px] tracking-[0.14em] text-ink-dim uppercase hover:border-phosphor hover:text-ink disabled:opacity-30",
								disabled: !selection.length,
								onClick: () => useDesign.getState().duplicateSelected(),
								title: "Duplicate selection (Cmd+D)",
								children: "Duplicate"
							}),
							selection.length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-7 flex-1 rounded-[6px] border border-border font-mono text-[10px] tracking-[0.14em] text-ink-dim uppercase hover:border-phosphor hover:text-ink",
								onClick: () => useDesign.getState().reverseStacking(),
								title: "Reverse stacking order of selected layers (within each parent)",
								children: "Rev"
							})
						]
					}),
					isolateSnapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-1.5 h-7 w-full rounded-[6px] bg-phosphor/10 px-2 font-mono text-[10px] tracking-[0.16em] text-phosphor uppercase hover:bg-phosphor/20",
						onClick: () => toggleIsolate(selection.length ? selection : doc.nodes.map((n) => n.id)),
						children: "Show all"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpacityQuickStrip, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeQuickStrip, {}),
					filtering && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 px-1 font-mono text-[10px] tracking-wide text-ink-faint",
						children: [
							layers.length,
							" match",
							layers.length === 1 ? "" : "es"
						]
					}),
					dragIds && !filtering && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 px-1 font-mono text-[10px] tracking-wide text-ink-faint",
						children: "Centre nests. Edge keeps that row's parent."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				ref: listRef,
				className: "min-h-0 flex-1 overflow-auto px-2 pb-2 scrollbar-thin",
				children: [layers.map(({ node: n, depth }) => {
					const active = selection.includes(n.id);
					const isKey = selection.length >= 2 && selection[selection.length - 1] === n.id;
					const dragging = draggingSet?.has(n.id) ?? false;
					const into = dropHint?.mode === "into" && dropHint.groupId === n.id;
					const before = dropHint?.mode === "before" && dropHint.anchorId === n.id;
					const after = dropHint?.mode === "after" && dropHint.anchorId === n.id;
					const group = isGroup(n);
					const blocked = !!dropHint && !!dragIds && (into || before || after) && !layerDropLegal(doc.nodes, dragIds, dropHint);
					const barLeft = 8 + depth * 12;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						"data-layer-id": n.id,
						"data-layer-kind": n.kind,
						className: "relative",
						children: [
							before && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("pointer-events-none absolute -top-px z-10 h-0.5 rounded-full", blocked ? "bg-ink-faint" : "bg-phosphor"),
								style: {
									left: barLeft,
									right: 8
								}
							}),
							after && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("pointer-events-none absolute -bottom-px z-10 h-0.5 rounded-full", blocked ? "bg-ink-faint" : "bg-phosphor"),
								style: {
									left: barLeft,
									right: 8
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("group flex h-9 items-center gap-0.5 rounded-[8px] px-0.5 text-xs", active ? "bg-phosphor/10 text-ink" : "text-ink-dim hover:bg-surface-alt", dragging && "opacity-40", into && !blocked && "ring-1 ring-phosphor", into && blocked && "ring-1 ring-ink-faint"),
								style: { paddingLeft: depth * 12 },
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("grid size-7 shrink-0 place-items-center text-ink-faint touch-none select-none", filtering ? "cursor-default opacity-40" : "cursor-grab active:cursor-grabbing"),
										"aria-label": "Reorder layer",
										onPointerDown: (e) => {
											if (e.button !== 0 || filtering) return;
											e.currentTarget.setPointerCapture(e.pointerId);
											const sel = useDesign.getState().selection;
											const groupIds = sel.includes(n.id) && sel.length > 1 ? sel : [n.id];
											dragIdsRef.current = groupIds;
											setDragIds(groupIds);
											setDropHint({
												mode: "before",
												anchorId: n.id
											});
											if (!sel.includes(n.id)) select([n.id]);
										},
										onPointerMove: (e) => {
											if (!dragIdsRef.current) return;
											autoScroll(e.clientY);
											const hint = hintFromY(e.clientY);
											setDropHint(hint);
											armDwell(hint);
										},
										onPointerUp: (e) => {
											if (!dragIdsRef.current) return;
											finish(e.clientY);
										},
										onPointerCancel: () => {
											clearDwell();
											dragIdsRef.current = null;
											setDragIds(null);
											setDropHint(null);
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { className: "size-3.5" })
									}),
									group ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "grid size-6 shrink-0 place-items-center rounded-[6px] text-ink-faint hover:text-ink",
										"aria-label": n.collapsed ? "Expand group" : "Collapse group",
										onClick: () => updateNodes([n.id], { collapsed: !n.collapsed }, true),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: cn("size-3.5 transition-transform", !n.collapsed && "rotate-90") })
									}) : null,
									editingId === n.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "field mx-1 h-7 min-w-0 flex-1 px-1.5 font-sans text-xs",
										value: draftName,
										autoFocus: true,
										"aria-label": "Layer name",
										onChange: (e) => setDraftName(e.target.value),
										onBlur: () => {
											const next = draftName.trim();
											if (next && next !== n.name) updateNodes([n.id], { name: next }, true);
											setEditingId(null);
										},
										onKeyDown: (e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												e.currentTarget.blur();
											}
											if (e.key === "Escape") {
												e.preventDefault();
												setDraftName(n.name);
												setEditingId(null);
											}
										}
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "min-w-0 flex-1 truncate px-1 text-left",
										onClick: (e) => select([n.id], e.shiftKey),
										onDoubleClick: (e) => {
											e.preventDefault();
											e.stopPropagation();
											select([n.id]);
											setDraftName(n.name || n.kind);
											setEditingId(n.id);
										},
										children: [
											n.linkId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "mr-1 inline size-3 text-phosphor" }),
											n.name || n.kind,
											n.opacity < .999 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: cn("ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"),
												title: "Edit opacity · Alt+0–9 tenths · Alt+Arrow 1% · Alt+Shift+0 full",
												onClick: (e) => {
													e.preventDefault();
													e.stopPropagation();
													if (!selection.includes(n.id)) select([n.id]);
													requestAnimationFrame(() => {
														(document.querySelector("[data-opacity-range='inspector']") || document.querySelector("[data-opacity-range]"))?.focus();
													});
												},
												children: [Math.round(n.opacity * 100), "%"]
											}),
											isText(n) && editingSizeId !== n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: cn("ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"),
												title: "Click to edit type size",
												onClick: (e) => {
													e.preventDefault();
													e.stopPropagation();
													if (!selection.includes(n.id)) select([n.id]);
													setSizeDraft(String(Math.round(n.fontSize)));
													setEditingSizeId(n.id);
												},
												children: Math.round(n.fontSize)
											}),
											isText(n) && editingSizeId === n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "number",
												min: 6,
												max: 400,
												step: 1,
												value: sizeDraft,
												autoFocus: true,
												"aria-label": `${n.name || n.kind} type size`,
												className: "ml-1.5 inline-block h-5 w-10 rounded-[4px] border border-phosphor bg-surface px-1 font-mono text-[9px] text-ink",
												onClick: (e) => e.stopPropagation(),
												onChange: (e) => setSizeDraft(e.target.value),
												onBlur: () => {
													const next = Math.max(6, Math.min(400, Number(sizeDraft) || n.fontSize));
													updateNodes([n.id], { fontSize: next }, true);
													setEditingSizeId(null);
												},
												onKeyDown: (e) => {
													if (e.key === "Enter") {
														const next = Math.max(6, Math.min(400, Number(sizeDraft) || n.fontSize));
														updateNodes([n.id], { fontSize: next }, true);
														setEditingSizeId(null);
													} else if (e.key === "Escape") setEditingSizeId(null);
												}
											}),
											isText(n) && editingTrackId !== n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: cn("ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"),
												title: "Click to edit tracking",
												onClick: (e) => {
													e.preventDefault();
													e.stopPropagation();
													if (!selection.includes(n.id)) select([n.id]);
													setTrackDraft(String(n.letterSpacing));
													setEditingTrackId(n.id);
												},
												children: Number.isInteger(n.letterSpacing) ? n.letterSpacing : Number(n.letterSpacing.toFixed(2))
											}),
											isText(n) && editingTrackId === n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "number",
												min: -8,
												max: 40,
												step: .25,
												value: trackDraft,
												autoFocus: true,
												"aria-label": `${n.name || n.kind} tracking`,
												className: "ml-1.5 inline-block h-5 w-12 rounded-[4px] border border-phosphor bg-surface px-1 font-mono text-[9px] text-ink",
												onClick: (e) => e.stopPropagation(),
												onChange: (e) => setTrackDraft(e.target.value),
												onBlur: () => {
													const next = Math.max(-8, Math.min(40, Number(trackDraft) || n.letterSpacing));
													updateNodes([n.id], { letterSpacing: next }, true);
													setEditingTrackId(null);
												},
												onKeyDown: (e) => {
													if (e.key === "Enter") {
														const next = Math.max(-8, Math.min(40, Number(trackDraft) || n.letterSpacing));
														updateNodes([n.id], { letterSpacing: next }, true);
														setEditingTrackId(null);
													} else if (e.key === "Escape") setEditingTrackId(null);
												}
											}),
											isText(n) && editingLeadId !== n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: cn("ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"),
												title: "Click to edit leading",
												onClick: (e) => {
													e.preventDefault();
													e.stopPropagation();
													if (!selection.includes(n.id)) select([n.id]);
													setLeadDraft(n.lineHeight.toFixed(2));
													setEditingLeadId(n.id);
												},
												children: n.lineHeight.toFixed(2)
											}),
											isText(n) && editingLeadId === n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "number",
												min: .7,
												max: 2,
												step: .02,
												value: leadDraft,
												autoFocus: true,
												"aria-label": `${n.name || n.kind} leading`,
												className: "ml-1.5 inline-block h-5 w-12 rounded-[4px] border border-phosphor bg-surface px-1 font-mono text-[9px] text-ink",
												onClick: (e) => e.stopPropagation(),
												onChange: (e) => setLeadDraft(e.target.value),
												onBlur: () => {
													const next = Math.max(.7, Math.min(2, Number(leadDraft) || n.lineHeight));
													updateNodes([n.id], { lineHeight: next }, true);
													setEditingLeadId(null);
												},
												onKeyDown: (e) => {
													if (e.key === "Enter") {
														const next = Math.max(.7, Math.min(2, Number(leadDraft) || n.lineHeight));
														updateNodes([n.id], { lineHeight: next }, true);
														setEditingLeadId(null);
													} else if (e.key === "Escape") setEditingLeadId(null);
												}
											}),
											isText(n) && editingWeightId !== n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: cn("ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"),
												title: "Click to edit weight",
												onClick: (e) => {
													e.preventDefault();
													e.stopPropagation();
													if (!selection.includes(n.id)) select([n.id]);
													setWeightDraft(String(Math.round(n.fontWeight)));
													setEditingWeightId(n.id);
												},
												children: Math.round(n.fontWeight)
											}),
											isText(n) && editingWeightId === n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "number",
												min: 100,
												max: 900,
												step: 100,
												value: weightDraft,
												autoFocus: true,
												"aria-label": `${n.name || n.kind} weight`,
												className: "ml-1.5 inline-block h-5 w-10 rounded-[4px] border border-phosphor bg-surface px-1 font-mono text-[9px] text-ink",
												onClick: (e) => e.stopPropagation(),
												onChange: (e) => setWeightDraft(e.target.value),
												onBlur: () => {
													const next = Math.max(100, Math.min(900, Math.round(Number(weightDraft) || n.fontWeight)));
													updateNodes([n.id], { fontWeight: next }, true);
													setEditingWeightId(null);
												},
												onKeyDown: (e) => {
													if (e.key === "Enter") {
														const next = Math.max(100, Math.min(900, Math.round(Number(weightDraft) || n.fontWeight)));
														updateNodes([n.id], { fontWeight: next }, true);
														setEditingWeightId(null);
													} else if (e.key === "Escape") setEditingWeightId(null);
												}
											}),
											isText(n) && editingFamilyId !== n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: cn("ml-1.5 inline-block max-w-[5.5rem] truncate rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"),
												title: `Click to change font family · ${n.fontFamily}`,
												onClick: (e) => {
													e.preventDefault();
													e.stopPropagation();
													if (!selection.includes(n.id)) select([n.id]);
													setEditingFamilyId(n.id);
												},
												children: n.fontFamily.split(" ")[0] || n.fontFamily
											}),
											isText(n) && editingFamilyId === n.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												className: "ml-1.5 inline-block h-5 max-w-[7rem] rounded-[4px] border border-phosphor bg-surface px-0.5 font-mono text-[9px] text-ink",
												value: n.fontFamily,
												autoFocus: true,
												"aria-label": `${n.name || n.kind} font family`,
												onClick: (e) => e.stopPropagation(),
												onChange: (e) => {
													updateNodes([n.id], { fontFamily: e.target.value }, true);
													setEditingFamilyId(null);
												},
												onBlur: () => setEditingFamilyId(null),
												onKeyDown: (e) => {
													if (e.key === "Escape") setEditingFamilyId(null);
												},
												children: CANVAS_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: f.family,
													children: f.family
												}, f.id))
											}),
											isKey && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-1.5 inline-block rounded-[4px] bg-phosphor/20 px-1 py-px font-mono text-[9px] tracking-[0.14em] text-phosphor uppercase",
												children: "Key"
											}),
											previewChip && previewMovers.includes(n.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-1.5 inline-block rounded-[4px] bg-phosphor/15 px-1 py-px font-mono text-[9px] tracking-[0.04em] text-phosphor",
												"data-layer-align-preview": previewChip,
												"data-layer-align-preview-mover": "",
												title: "Edge chip while align preview is armed",
												children: previewChip
											}),
											alignSolid && !alignFade && alignEcho?.moverIds.includes(n.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-1.5 inline-block rounded-[4px] bg-phosphor/15 px-1 py-px font-mono text-[9px] tracking-[0.04em] text-phosphor",
												"data-layer-align-solid": alignSolid,
												"data-layer-align-mover": "",
												title: "Same truncated chip and move count as the inspector solid beat",
												children: alignSolid
											}),
											alignFade && alignEcho?.moverIds.includes(n.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-1.5 inline-block max-w-[16rem] truncate rounded-[4px] bg-phosphor/15 px-1 py-px align-bottom font-mono text-[9px] tracking-[0.04em] text-phosphor",
												"data-layer-align-fade": alignFade,
												"data-layer-align-solid": alignSolid ?? "",
												"data-layer-align-pill": alignPill ?? "",
												"data-layer-align-mover": "",
												title: alignFade,
												children: alignFade
											}),
											into && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("ml-1.5 font-mono text-[9px] tracking-[0.14em] uppercase", blocked ? "text-ink-faint" : "text-phosphor"),
												children: blocked ? "No" : "Into"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: cn("flex items-center gap-1 px-1 -mx-1 transition-opacity duration-150", active ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"),
										children: [editingOpacityId === n.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											min: 0,
											max: 100,
											step: 1,
											value: opacityDraft,
											autoFocus: true,
											"aria-label": `${n.name || n.kind} opacity percent`,
											className: "field h-6 w-12 px-1 font-mono text-[10px]",
											onChange: (e) => setOpacityDraft(e.target.value),
											onBlur: () => {
												const pct = Math.max(0, Math.min(100, Number(opacityDraft) || 0));
												updateNodes([n.id], { opacity: pct / 100 }, true);
												setEditingOpacityId(null);
											},
											onKeyDown: (e) => {
												if (e.key === "Enter") {
													const pct = Math.max(0, Math.min(100, Number(opacityDraft) || 0));
													updateNodes([n.id], { opacity: pct / 100 }, true);
													setEditingOpacityId(null);
												} else if (e.key === "Escape") setEditingOpacityId(null);
											},
											onPointerDown: (e) => e.stopPropagation()
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "min-w-[2.5rem] rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor",
											title: "Click to type opacity percent · Alt+0–9 tenths · Alt+Arrow 1% · Alt+Shift+0 full",
											onClick: (e) => {
												e.preventDefault();
												e.stopPropagation();
												if (!selection.includes(n.id)) select([n.id]);
												setOpacityDraft(String(Math.round(n.opacity * 100)));
												setEditingOpacityId(n.id);
											},
											children: [Math.round(n.opacity * 100), "%"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "range",
											className: "range-phosphor h-5 w-16 shrink-0",
											min: 0,
											max: 1,
											step: .01,
											value: n.opacity,
											"aria-label": `${n.name || n.kind} opacity`,
											"data-opacity-range": "row",
											style: { "--fill-opacity": String(n.opacity) },
											onChange: (e) => {
												const next = Number(e.target.value);
												updateNodes([n.id], { opacity: next });
											},
											onPointerUp: () => useDesign.getState().commit(),
											onPointerDown: (e) => e.stopPropagation(),
											title: "Scrub layer opacity"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "size-7 rounded-[6px] hover:bg-ground",
										title: "Alt-click isolates this layer",
										onClick: (e) => {
											if (e.altKey) {
												const sel = useDesign.getState().selection;
												const keep = sel.includes(n.id) && sel.length > 1 ? sel : [n.id];
												toggleIsolate(keep);
												return;
											}
											updateNodes([n.id], { visible: !n.visible }, true);
										},
										"aria-label": n.visible ? "Hide" : "Show",
										children: n.visible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "mx-auto size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "mx-auto size-3.5" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "size-7 rounded-[6px] hover:bg-ground",
										onClick: () => updateNodes([n.id], { locked: !n.locked }, true),
										"aria-label": n.locked ? "Unlock" : "Lock",
										children: n.locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "mx-auto size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockOpen, { className: "mx-auto size-3.5" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "grid size-7 place-items-center rounded-[6px] text-ink-faint hover:text-ink",
										onClick: () => reorder(n.id, "up"),
										"aria-label": "Bring forward",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-3.5" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "grid size-7 place-items-center rounded-[6px] text-ink-faint hover:text-ink",
										onClick: () => reorder(n.id, "down"),
										"aria-label": "Send back",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3.5" })
									})
								]
							})
						]
					}, n.id);
				}), layers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-2 py-6 text-center text-xs text-ink-faint",
					children: filtering ? `No layers match “${needle}”` : "Empty artboard — pick a tool and draw"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryList, {})
		]
	});
}
var TYPE_LAST_USED_KEY = "voice-design-type-last-used";
function loadTypeLastUsed() {
	const empty = {
		size: null,
		weight: null,
		track: null,
		lead: null,
		family: null
	};
	try {
		const raw = localStorage.getItem(TYPE_LAST_USED_KEY);
		if (!raw) return empty;
		const parsed = JSON.parse(raw);
		return {
			size: typeof parsed.size === "number" ? parsed.size : null,
			weight: typeof parsed.weight === "number" ? parsed.weight : null,
			track: typeof parsed.track === "number" ? parsed.track : null,
			lead: typeof parsed.lead === "number" ? parsed.lead : null,
			family: typeof parsed.family === "string" ? parsed.family : null
		};
	} catch {
		return empty;
	}
}
function saveTypeLastUsed(next) {
	try {
		localStorage.setItem(TYPE_LAST_USED_KEY, JSON.stringify(next));
	} catch {}
}
var TYPE_STRIP_COLLAPSED_KEY = "voice-design-type-strip-collapsed";
function loadTypeStripCollapsed() {
	try {
		return localStorage.getItem(TYPE_STRIP_COLLAPSED_KEY) === "1";
	} catch {
		return false;
	}
}
function saveTypeStripCollapsed(collapsed) {
	try {
		localStorage.setItem(TYPE_STRIP_COLLAPSED_KEY, collapsed ? "1" : "0");
	} catch {}
}
function TypeQuickStrip() {
	const selection = useDesign((s) => s.selection);
	const doc = useDesign((s) => s.doc);
	const updateNodes = useDesign((s) => s.updateNodes);
	const [editingWeight, setEditingWeight] = (0, import_react.useState)(false);
	const [weightDraft, setWeightDraft] = (0, import_react.useState)("");
	const [editingFamily, setEditingFamily] = (0, import_react.useState)(false);
	const [editingSize, setEditingSize] = (0, import_react.useState)(false);
	const [sizeDraft, setSizeDraft] = (0, import_react.useState)("");
	const [editingTrack, setEditingTrack] = (0, import_react.useState)(false);
	const [trackDraft, setTrackDraft] = (0, import_react.useState)("");
	const [editingLead, setEditingLead] = (0, import_react.useState)(false);
	const [leadDraft, setLeadDraft] = (0, import_react.useState)("");
	const [lastUsed, setLastUsed] = (0, import_react.useState)(loadTypeLastUsed);
	const [flashProp, setFlashProp] = (0, import_react.useState)(null);
	const [collapsed, setCollapsed] = (0, import_react.useState)(loadTypeStripCollapsed);
	const toggleCollapsed = (0, import_react.useCallback)(() => {
		setCollapsed((prev) => {
			const next = !prev;
			saveTypeStripCollapsed(next);
			return next;
		});
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (!(e.shiftKey && e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !e.altKey)) return;
			const t = e.target;
			if (!t || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
			if (!t.closest("[data-layers-panel]")) return;
			e.preventDefault();
			toggleCollapsed();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [toggleCollapsed]);
	const cycleFocusRef = (0, import_react.useRef)(() => {});
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (!(e.altKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "t")) return;
			const t = e.target;
			if (!t || !t.closest("[data-layers-panel]")) return;
			if ((t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) && !t.closest("[data-type-strip]")) return;
			e.preventDefault();
			cycleFocusRef.current(e.shiftKey);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);
	const triggerFlash = (prop) => {
		setFlashProp(prop);
		window.setTimeout(() => setFlashProp(null), 700);
	};
	const remember = (prop, val) => {
		setLastUsed((prev) => {
			const next = {
				...prev,
				[prop]: val
			};
			saveTypeLastUsed(next);
			return next;
		});
	};
	cycleFocusRef.current = () => {};
	if (!doc || selection.length === 0) return null;
	const textNodes = selection.map((id) => doc.nodes.find((n) => n.id === id)).filter((n) => Boolean(n) && isText(n));
	if (textNodes.length === 0) return null;
	const sizeMixed = new Set(textNodes.map((n) => Math.round(n.fontSize))).size > 1;
	const trackMixed = new Set(textNodes.map((n) => Math.round(n.letterSpacing * 4) / 4)).size > 1;
	const leadMixed = new Set(textNodes.map((n) => Math.round(n.lineHeight * 50) / 50)).size > 1;
	const weightMixed = new Set(textNodes.map((n) => Math.round(n.fontWeight))).size > 1;
	const familyMixed = new Set(textNodes.map((n) => n.fontFamily)).size > 1;
	const size = sizeMixed ? textNodes[textNodes.length - 1].fontSize : textNodes[0].fontSize;
	const tracking = trackMixed ? textNodes[textNodes.length - 1].letterSpacing : textNodes[0].letterSpacing;
	const leading = leadMixed ? textNodes[textNodes.length - 1].lineHeight : textNodes[0].lineHeight;
	const weight = weightMixed ? textNodes[textNodes.length - 1].fontWeight : textNodes[0].fontWeight;
	const family = familyMixed ? textNodes[textNodes.length - 1].fontFamily : textNodes[0].fontFamily;
	const ids = textNodes.map((n) => n.id);
	const clearGhost = () => {
		const s = useDesign.getState();
		if (s.typeGhost) {
			s.setTypeGhost(null);
			s.commit();
		}
	};
	cycleFocusRef.current = (reverse = false) => {
		const order = [
			"size",
			"weight",
			"track",
			"lead",
			"family"
		];
		let current = -1;
		if (editingSize) current = 0;
		else if (editingWeight) current = 1;
		else if (editingTrack) current = 2;
		else if (editingLead) current = 3;
		else if (editingFamily) current = 4;
		const next = order[(current + (reverse ? -1 : 1) + order.length) % order.length];
		if (editingSize) {
			const n = Math.max(8, Math.min(160, Math.round(Number(sizeDraft) || size)));
			updateNodes(ids, { fontSize: n }, true);
			remember("size", n);
		} else if (editingWeight) {
			const n = Math.max(100, Math.min(900, Math.round(Number(weightDraft) || weight)));
			updateNodes(ids, { fontWeight: n }, true);
			remember("weight", n);
		} else if (editingTrack) {
			const n = Math.max(-8, Math.min(40, Number(trackDraft) || tracking));
			updateNodes(ids, { letterSpacing: n }, true);
			remember("track", n);
		} else if (editingLead) {
			const n = Math.max(.7, Math.min(2, Number(leadDraft) || leading));
			updateNodes(ids, { lineHeight: n }, true);
			remember("lead", n);
		}
		setEditingSize(false);
		setEditingWeight(false);
		setEditingTrack(false);
		setEditingLead(false);
		setEditingFamily(false);
		if (next === "size") {
			const start = lastUsed.size ?? Math.round(size);
			setSizeDraft(String(start));
			setEditingSize(true);
			if (lastUsed.size != null) triggerFlash("size");
		} else if (next === "weight") {
			const start = lastUsed.weight ?? Math.round(weight);
			setWeightDraft(String(start));
			setEditingWeight(true);
			if (lastUsed.weight != null) triggerFlash("weight");
		} else if (next === "track") {
			const start = lastUsed.track ?? Math.round(tracking * 4) / 4;
			setTrackDraft(String(start));
			setEditingTrack(true);
			if (lastUsed.track != null) triggerFlash("track");
		} else if (next === "lead") {
			const start = lastUsed.lead ?? Math.round(leading * 50) / 50;
			setLeadDraft(String(start));
			setEditingLead(true);
			if (lastUsed.lead != null) triggerFlash("lead");
		} else if (next === "family") {
			setEditingFamily(true);
			if (familyMixed && lastUsed.family) triggerFlash("family");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-type-strip": true,
		className: cn("group/strip mt-2 rounded-[8px] border border-border bg-surface px-2 transition-colors", collapsed ? "py-1" : "py-1.5"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase", !collapsed && "mb-1"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex items-center gap-1 hover:text-phosphor",
				"aria-label": collapsed ? "Expand type strip" : "Collapse type strip",
				"aria-expanded": !collapsed,
				title: "Shift+T collapse · Alt+T cycle focus (size → weight → tracking → leading → family) · Shift+Alt+T reverse",
				onClick: toggleCollapsed,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: cn("size-3 transition-transform", !collapsed && "rotate-90") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Type" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("flex items-center gap-0.5 text-[9px] transition-opacity", collapsed ? "opacity-0 pointer-events-none group-hover/strip:opacity-100 group-hover/strip:pointer-events-auto group-focus-within/strip:opacity-100 group-focus-within/strip:pointer-events-auto" : "opacity-100"),
				children: [
					!editingSize ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `rounded-[3px] bg-surface-alt px-1 py-px tracking-wide hover:bg-phosphor/15 hover:text-phosphor ${sizeMixed ? "text-phosphor" : "text-ink-faint"} ${flashProp === "size" ? "animate-phosphor-flash" : ""}`,
						title: sizeMixed ? "Mixed size — click to set all" : "Click to edit size",
						onClick: () => {
							const start = lastUsed.size ?? Math.round(size);
							setSizeDraft(String(start));
							setEditingSize(true);
							if (lastUsed.size != null) triggerFlash("size");
						},
						children: sizeMixed ? "Mixed" : Math.round(size)
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						min: 8,
						max: 160,
						step: 1,
						value: sizeDraft,
						autoFocus: true,
						"aria-label": "Type size",
						className: "h-4 w-9 rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink",
						onChange: (e) => setSizeDraft(e.target.value),
						onBlur: () => {
							const next = Math.max(8, Math.min(160, Math.round(Number(sizeDraft) || size)));
							updateNodes(ids, { fontSize: next }, true);
							remember("size", next);
							setEditingSize(false);
						},
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								const next = Math.max(8, Math.min(160, Math.round(Number(sizeDraft) || size)));
								updateNodes(ids, { fontSize: next }, true);
								remember("size", next);
								setEditingSize(false);
							} else if (e.key === "Escape") setEditingSize(false);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-ink-faint",
						children: "/"
					}),
					!editingWeight ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `rounded-[3px] bg-surface-alt px-1 py-px tracking-wide hover:bg-phosphor/15 hover:text-phosphor ${weightMixed ? "text-phosphor" : "text-ink-faint"} ${flashProp === "weight" ? "animate-phosphor-flash" : ""}`,
						title: weightMixed ? "Mixed weight — click to set all" : "Click to edit weight",
						onClick: () => {
							const start = lastUsed.weight ?? Math.round(weight);
							setWeightDraft(String(start));
							setEditingWeight(true);
							if (lastUsed.weight != null) triggerFlash("weight");
						},
						children: weightMixed ? "Mixed" : Math.round(weight)
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						min: 100,
						max: 900,
						step: 100,
						value: weightDraft,
						autoFocus: true,
						"aria-label": "Type weight",
						className: "h-4 w-9 rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink",
						onChange: (e) => setWeightDraft(e.target.value),
						onBlur: () => {
							const next = Math.max(100, Math.min(900, Math.round(Number(weightDraft) || weight)));
							updateNodes(ids, { fontWeight: next }, true);
							remember("weight", next);
							setEditingWeight(false);
						},
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								const next = Math.max(100, Math.min(900, Math.round(Number(weightDraft) || weight)));
								updateNodes(ids, { fontWeight: next }, true);
								remember("weight", next);
								setEditingWeight(false);
							} else if (e.key === "Escape") setEditingWeight(false);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-ink-faint",
						children: "/"
					}),
					!editingTrack ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `rounded-[3px] bg-surface-alt px-1 py-px tracking-wide hover:bg-phosphor/15 hover:text-phosphor ${trackMixed ? "text-phosphor" : "text-ink-faint"} ${flashProp === "track" ? "animate-phosphor-flash" : ""}`,
						title: trackMixed ? "Mixed tracking — click to set all" : "Click to edit tracking",
						onClick: () => {
							const start = lastUsed.track ?? tracking;
							setTrackDraft(String(start));
							setEditingTrack(true);
							if (lastUsed.track != null) triggerFlash("track");
						},
						children: trackMixed ? "Mixed" : tracking
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						min: -8,
						max: 40,
						step: .25,
						value: trackDraft,
						autoFocus: true,
						"aria-label": "Type tracking",
						className: "h-4 w-9 rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink",
						onChange: (e) => setTrackDraft(e.target.value),
						onBlur: () => {
							const next = Math.max(-8, Math.min(40, Number(trackDraft) || tracking));
							updateNodes(ids, { letterSpacing: next }, true);
							remember("track", next);
							setEditingTrack(false);
						},
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								const next = Math.max(-8, Math.min(40, Number(trackDraft) || tracking));
								updateNodes(ids, { letterSpacing: next }, true);
								remember("track", next);
								setEditingTrack(false);
							} else if (e.key === "Escape") setEditingTrack(false);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-ink-faint",
						children: "/"
					}),
					!editingLead ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `rounded-[3px] bg-surface-alt px-1 py-px tracking-wide hover:bg-phosphor/15 hover:text-phosphor ${leadMixed ? "text-phosphor" : "text-ink-faint"} ${flashProp === "lead" ? "animate-phosphor-flash" : ""}`,
						title: leadMixed ? "Mixed leading — click to set all" : "Click to edit leading",
						onClick: () => {
							const start = lastUsed.lead ?? leading;
							setLeadDraft(start.toFixed(2));
							setEditingLead(true);
							if (lastUsed.lead != null) triggerFlash("lead");
						},
						children: leadMixed ? "Mixed" : leading.toFixed(2)
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						min: .7,
						max: 2,
						step: .02,
						value: leadDraft,
						autoFocus: true,
						"aria-label": "Type leading",
						className: "h-4 w-9 rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink",
						onChange: (e) => setLeadDraft(e.target.value),
						onBlur: () => {
							const next = Math.max(.7, Math.min(2, Number(leadDraft) || leading));
							updateNodes(ids, { lineHeight: next }, true);
							remember("lead", next);
							setEditingLead(false);
						},
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								const next = Math.max(.7, Math.min(2, Number(leadDraft) || leading));
								updateNodes(ids, { lineHeight: next }, true);
								remember("lead", next);
								setEditingLead(false);
							} else if (e.key === "Escape") setEditingLead(false);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mx-0.5 text-ink-faint",
						children: "·"
					}),
					!editingFamily ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `max-w-[3.8rem] truncate rounded-[3px] bg-surface-alt px-1 py-px tracking-wide hover:bg-phosphor/15 hover:text-phosphor ${familyMixed ? "text-phosphor" : "text-ink-faint"} ${flashProp === "family" ? "animate-phosphor-flash" : ""}`,
						title: familyMixed ? `Mixed family — click to set all · ${family}` : `Click to change font family · ${family}`,
						onClick: () => {
							setEditingFamily(true);
							if (familyMixed && lastUsed.family) triggerFlash("family");
						},
						children: familyMixed ? "Mixed" : family.split(" ")[0] || family
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-4 max-w-[5.5rem] rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink",
						value: familyMixed && lastUsed.family ? lastUsed.family : family,
						autoFocus: true,
						"aria-label": "Type family",
						onChange: (e) => {
							const next = e.target.value;
							updateNodes(ids, { fontFamily: next }, true);
							remember("family", next);
							setEditingFamily(false);
						},
						onBlur: () => setEditingFamily(false),
						onKeyDown: (e) => {
							if (e.key === "Escape") setEditingFamily(false);
						},
						children: [familyMixed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: family,
							children: "Mixed"
						}), CANVAS_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: f.family,
							children: f.family
						}, f.id))]
					})
				]
			})]
		}), !collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1.5 flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-10 shrink-0 font-mono text-[9px] text-ink-faint",
						children: "Size"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor min-w-0 flex-1",
						min: 8,
						max: 160,
						step: 1,
						value: size,
						"aria-label": "Type size",
						"data-type-range": "size",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (size - 8) / 152))) },
						onChange: (e) => {
							const next = Number(e.target.value);
							useDesign.getState().setTypeGhost({ fontSize: next });
							updateNodes(ids, { fontSize: next });
						},
						onPointerUp: clearGhost,
						onKeyUp: clearGhost,
						onBlur: clearGhost,
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, size, 8, 160, 1);
							if (next != null) {
								useDesign.getState().setTypeGhost({ fontSize: next });
								updateNodes(ids, { fontSize: next });
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						"aria-label": "Type size",
						mixed: sizeMixed,
						value: Math.round(size),
						min: 8,
						max: 160,
						className: "h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink",
						onCommit: (n) => {
							updateNodes(ids, { fontSize: n });
							remember("size", n);
							useDesign.getState().commit();
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-10 shrink-0 font-mono text-[9px] text-ink-faint",
						children: "Track"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor min-w-0 flex-1",
						min: -8,
						max: 40,
						step: .25,
						value: tracking,
						"aria-label": "Type tracking",
						"data-type-range": "tracking",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (tracking - -8) / 48))) },
						onChange: (e) => {
							const next = Number(e.target.value);
							useDesign.getState().setTypeGhost({ letterSpacing: next });
							updateNodes(ids, { letterSpacing: next });
						},
						onPointerUp: clearGhost,
						onKeyUp: clearGhost,
						onBlur: clearGhost,
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, tracking, -8, 40, .25);
							if (next != null) {
								useDesign.getState().setTypeGhost({ letterSpacing: next });
								updateNodes(ids, { letterSpacing: next });
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						"aria-label": "Type tracking",
						mixed: trackMixed,
						value: tracking,
						min: -8,
						max: 40,
						className: "h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink",
						onCommit: (n) => {
							updateNodes(ids, { letterSpacing: n });
							remember("track", n);
							useDesign.getState().commit();
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1.5 flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-10 shrink-0 font-mono text-[9px] text-ink-faint",
						children: "Lead"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor min-w-0 flex-1",
						min: .7,
						max: 2,
						step: .02,
						value: leading,
						"aria-label": "Type leading",
						"data-type-range": "leading",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (leading - .7) / 1.3))) },
						onChange: (e) => {
							const next = Number(e.target.value);
							useDesign.getState().setTypeGhost({ lineHeight: next });
							updateNodes(ids, { lineHeight: next });
						},
						onPointerUp: clearGhost,
						onKeyUp: clearGhost,
						onBlur: clearGhost,
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, leading, .7, 2, .02);
							if (next != null) {
								useDesign.getState().setTypeGhost({ lineHeight: next });
								updateNodes(ids, { lineHeight: next });
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						"aria-label": "Type leading",
						mixed: leadMixed,
						value: Number(leading.toFixed(2)),
						min: .7,
						max: 2,
						className: "h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink",
						onCommit: (n) => {
							updateNodes(ids, { lineHeight: n });
							remember("lead", n);
							useDesign.getState().commit();
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1.5 flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-10 shrink-0 font-mono text-[9px] text-ink-faint",
						children: "Weight"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor min-w-0 flex-1",
						min: 100,
						max: 900,
						step: 100,
						value: weight,
						"aria-label": "Type weight",
						"data-type-range": "weight",
						style: { "--fill-percent": String(Math.max(0, Math.min(1, (weight - 100) / 800))) },
						onChange: (e) => {
							const next = Number(e.target.value);
							useDesign.getState().setTypeGhost({ fontWeight: next });
							updateNodes(ids, { fontWeight: next });
						},
						onPointerUp: clearGhost,
						onKeyUp: clearGhost,
						onBlur: clearGhost,
						onKeyDown: (e) => {
							const next = nextFromRangeKey(e, weight, 100, 900, 100);
							if (next != null) {
								useDesign.getState().setTypeGhost({ fontWeight: next });
								updateNodes(ids, { fontWeight: next });
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
						"aria-label": "Type weight",
						mixed: weightMixed,
						value: Math.round(weight),
						min: 100,
						max: 900,
						className: "h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink",
						onCommit: (n) => {
							updateNodes(ids, { fontWeight: n });
							remember("weight", n);
							useDesign.getState().commit();
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1.5 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-10 shrink-0 font-mono text-[9px] text-ink-faint",
					children: "Family"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: "h-6 min-w-0 flex-1 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-ink",
					value: family,
					"aria-label": "Type family",
					onChange: (e) => {
						const next = e.target.value;
						updateNodes(ids, { fontFamily: next }, true);
						remember("family", next);
					},
					children: [familyMixed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: family,
						children: "Mixed"
					}), CANVAS_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: f.family,
						children: f.family
					}, f.id))]
				})]
			})
		] })]
	});
}
function OpacityQuickStrip() {
	const selection = useDesign((s) => s.selection);
	const doc = useDesign((s) => s.doc);
	const updateNodes = useDesign((s) => s.updateNodes);
	if (!doc || selection.length === 0) return null;
	const nodes = selection.map((id) => doc.nodes.find((n) => n.id === id)).filter((n) => Boolean(n));
	if (nodes.length === 0) return null;
	const mixed = new Set(nodes.map((n) => Math.round(n.opacity * 100))).size > 1;
	const value = mixed ? nodes[nodes.length - 1].opacity : nodes[0].opacity;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 rounded-[8px] border border-border bg-surface px-2 py-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Opacity" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: mixed ? "text-phosphor" : "text-ink-dim",
				children: mixed ? "Mixed" : `${Math.round(value * 100)}%`
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: "range-phosphor min-w-0 flex-1",
					min: 0,
					max: 1,
					step: .01,
					value,
					"aria-label": "Layer opacity",
					"data-opacity-range": "layers",
					style: { "--fill-opacity": String(value) },
					onChange: (e) => {
						const next = Number(e.target.value);
						updateNodes(selection, { opacity: next });
					},
					onPointerUp: () => useDesign.getState().commit()
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
					"aria-label": "Layer opacity percent",
					mixed,
					value: Math.round(value * 100),
					min: 0,
					max: 100,
					className: "h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink",
					onCommit: (pct) => {
						const opacity = Math.max(0, Math.min(1, pct / 100));
						updateNodes(selection, { opacity });
						useDesign.getState().commit();
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shrink-0 font-mono text-[9px] text-ink-faint",
					children: "%"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-6 shrink-0 rounded-[6px] border border-border px-1.5 font-mono text-[9px] tracking-wide text-ink-dim hover:border-phosphor hover:text-ink",
					title: "Set opacity to 100% · Alt+Shift+0 · Alt+Arrow 1% steps",
					onClick: () => {
						updateNodes(selection, { opacity: 1 });
						useDesign.getState().commit();
					},
					children: "100%"
				})
			]
		})]
	});
}
function HistoryList() {
	const past = useDesign((s) => s.past);
	const future = useDesign((s) => s.future);
	const restoreHistory = useDesign((s) => s.restoreHistory);
	const undo = useDesign((s) => s.undo);
	const redo = useDesign((s) => s.redo);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shrink-0 border-t border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: "History"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "max-h-36 overflow-auto px-2 pb-2 scrollbar-thin",
				children: [
					future.map((_, i) => i).reverse().map((idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex h-8 w-full items-center rounded-[8px] px-2 text-left text-[11px] text-ink-faint hover:bg-surface-alt hover:text-ink",
						onClick: () => restoreHistory("future", idx),
						children: ["Redo ", idx + 1]
					}) }, `f${idx}`)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex h-8 items-center rounded-[8px] bg-phosphor/10 px-2 text-[11px] text-phosphor",
						children: "Now"
					}) }),
					past.map((_, i) => i).reverse().map((idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex h-8 w-full items-center rounded-[8px] px-2 text-left text-[11px] text-ink-dim hover:bg-surface-alt hover:text-ink",
						onClick: () => restoreHistory("past", idx),
						children: ["Step ", idx + 1]
					}) }, `p${idx}`)),
					past.length === 0 && future.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-2 py-3 text-center text-[11px] text-ink-faint",
						children: "Undo stack is empty"
					})
				]
			}),
			(past.length > 0 || future.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1 px-2 pb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-7 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink disabled:opacity-30",
					disabled: !past.length,
					onClick: undo,
					children: "Undo"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-7 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink disabled:opacity-30",
					disabled: !future.length,
					onClick: redo,
					children: "Redo"
				})]
			})
		]
	});
}
function MixedFillChips({ nodes, ink }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const hex = solidOf(n.fill, ink);
			const label = fillChipLabel(n.fill);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-6 items-center gap-1 rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify fill with ${n.name || n.kind}: ${label}`,
				"aria-label": `Unify fill with ${n.name || n.kind}: ${label}`,
				onClick: () => updateNodes(ids, { fill: cloneFill(n.fill) }, true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-3 shrink-0 rounded-full border border-phosphor/30",
					style: { background: n.fill === "transparent" ? "transparent" : hex }
				}), label]
			}, n.id);
		})
	});
}
function MixedStrokeChips({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const label = strokeChipLabel(n.stroke, n.strokeWidth);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-6 items-center gap-1 rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify stroke with ${n.name || n.kind}: ${label}`,
				"aria-label": `Unify stroke with ${n.name || n.kind}: ${label}`,
				onClick: () => updateNodes(ids, {
					stroke: n.stroke,
					strokeWidth: n.strokeWidth
				}, true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-3 shrink-0 rounded-full border border-phosphor/30",
					style: { background: n.stroke === "transparent" ? "transparent" : n.stroke }
				}), label]
			}, `stroke-${n.id}`);
		})
	});
}
function MixedOpacityChips({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const label = `${Math.round(n.opacity * 100)}%`;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify opacity with ${n.name || n.kind}: ${label}`,
				"aria-label": `Unify opacity with ${n.name || n.kind}: ${label}`,
				onClick: () => updateNodes(ids, { opacity: n.opacity }, true),
				children: label
			}, `op-${n.id}`);
		})
	});
}
var BLEND_ORDER = [
	"source-over",
	"multiply",
	"screen",
	"overlay",
	"darken",
	"lighten",
	"soft-light",
	"hard-light",
	"color-dodge",
	"color-burn"
];
var BLEND_LABEL = {
	"source-over": "Normal",
	multiply: "Multiply",
	screen: "Screen",
	overlay: "Overlay",
	darken: "Darken",
	lighten: "Lighten",
	"soft-light": "Soft light",
	"hard-light": "Hard light",
	"color-dodge": "Color dodge",
	"color-burn": "Color burn"
};
function blendLegendEntries(nodes) {
	const map = /* @__PURE__ */ new Map();
	for (const n of nodes) {
		const id = n.blend || "source-over";
		map.set(id, (map.get(id) ?? 0) + 1);
	}
	return BLEND_ORDER.filter((id) => map.has(id)).map((id) => ({
		id,
		label: BLEND_LABEL[id],
		count: map.get(id) ?? 0
	}));
}
function MixedBlendChips({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
			title: `Unify blend with ${n.name || n.kind}: ${n.blend}`,
			"aria-label": `Unify blend with ${n.name || n.kind}: ${n.blend}`,
			onClick: () => updateNodes(ids, { blend: n.blend }, true),
			children: n.blend
		}, `blend-${n.id}`))
	});
}
/** Compact unique-mode legend. Click unifies the selection to that mode. */
function MixedBlendLegend({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = nodes.map((n) => n.id);
	const entries = blendLegendEntries(nodes);
	if (entries.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		"aria-label": "mixed blend legend",
		children: entries.map(({ id, label, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex h-6 items-center gap-1 rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor",
			title: `Unify blend to ${label} · ${count} layer${count === 1 ? "" : "s"}`,
			"aria-label": `Set blend to ${label}`,
			onClick: () => updateNodes(ids, { blend: id }, true),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-phosphor/70",
				children: count
			})]
		}, id))
	});
}
function visibilityChipLabel(visible) {
	return visible ? "shown" : "hidden";
}
function lockChipLabel(locked) {
	return locked ? "locked" : "open";
}
function MixedVisibilityChips({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const label = visibilityChipLabel(n.visible);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify visibility with ${n.name || n.kind}: ${label}`,
				"aria-label": `Unify visibility with ${n.name || n.kind}: ${label}`,
				onClick: () => updateNodes(ids, { visible: n.visible }, true),
				children: label
			}, `vis-${n.id}`);
		})
	});
}
function MixedLockChips({ nodes }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const label = lockChipLabel(n.locked);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify lock with ${n.name || n.kind}: ${label}`,
				"aria-label": `Unify lock with ${n.name || n.kind}: ${label}`,
				onClick: () => updateNodes(ids, { locked: n.locked }, true),
				children: label
			}, `lock-${n.id}`);
		})
	});
}
function ghostShadow(patch) {
	useDesign.getState().setStrokeGhost(patch);
}
function MixedShadowColorChips({ nodes }) {
	const mapNodes = useDesign((s) => s.mapNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const color = n.shadow?.color ?? DEFAULT_SHADOW.color;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-6 items-center gap-1 rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify shadow color with ${n.name || n.kind}: ${color}`,
				"aria-label": `Unify shadow color with ${n.name || n.kind}: ${color}`,
				onMouseEnter: () => ghostShadow({ shadowColor: color }),
				onFocus: () => ghostShadow({ shadowColor: color }),
				onMouseLeave: () => ghostShadow(null),
				onBlur: () => ghostShadow(null),
				onClick: () => {
					mapNodes(ids, (layer) => ({
						...layer,
						shadow: stampShadowColor(layer.shadow, color)
					}), true);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-3 shrink-0 rounded-full border border-phosphor/30",
					style: { background: color }
				}), color]
			}, `sh-color-${n.id}`);
		})
	});
}
function MixedShadowBlurChips({ nodes }) {
	const mapNodes = useDesign((s) => s.mapNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const blur = n.shadow?.blur ?? DEFAULT_SHADOW.blur;
			const label = `b${blur}`;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify shadow blur with ${n.name || n.kind}: ${label}`,
				"aria-label": `Unify shadow blur with ${n.name || n.kind}: ${label}`,
				onMouseEnter: () => ghostShadow({ shadowBlur: blur }),
				onFocus: () => ghostShadow({ shadowBlur: blur }),
				onMouseLeave: () => ghostShadow(null),
				onBlur: () => ghostShadow(null),
				onClick: () => {
					mapNodes(ids, (layer) => ({
						...layer,
						shadow: stampShadowBlur(layer.shadow, blur)
					}), true);
				},
				children: label
			}, `sh-blur-${n.id}`);
		})
	});
}
function MixedShadowOffsetChips({ nodes, axis }) {
	const mapNodes = useDesign((s) => s.mapNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const label = shadowOffsetChipLabel(axis, n.shadow);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify shadow ${axis} with ${n.name || n.kind}: ${label}`,
				"aria-label": `Unify shadow ${axis} with ${n.name || n.kind}: ${label}`,
				onMouseEnter: () => {
					const value = n.shadow ? n.shadow[axis] : DEFAULT_SHADOW[axis];
					ghostShadow(axis === "ox" ? { shadowOx: value } : { shadowOy: value });
				},
				onFocus: () => {
					const value = n.shadow ? n.shadow[axis] : DEFAULT_SHADOW[axis];
					ghostShadow(axis === "ox" ? { shadowOx: value } : { shadowOy: value });
				},
				onMouseLeave: () => ghostShadow(null),
				onBlur: () => ghostShadow(null),
				onClick: () => {
					const value = n.shadow ? n.shadow[axis] : DEFAULT_SHADOW[axis];
					mapNodes(ids, (layer) => ({
						...layer,
						shadow: stampShadowOffset(layer.shadow, axis, value)
					}), true);
				},
				children: label
			}, `${axis}-${n.id}`);
		})
	});
}
function MixedShadowSpreadChips({ nodes }) {
	const mapNodes = useDesign((s) => s.mapNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const spread = n.shadow?.spread ?? DEFAULT_SHADOW.spread ?? 0;
			const label = shadowSpreadLabel(spread);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify shadow spread with ${n.name || n.kind}: ${label}`,
				"aria-label": `Unify shadow spread with ${n.name || n.kind}: ${label}`,
				onMouseEnter: () => ghostShadow({ shadowSpread: spread }),
				onFocus: () => ghostShadow({ shadowSpread: spread }),
				onMouseLeave: () => ghostShadow(null),
				onBlur: () => ghostShadow(null),
				onClick: () => {
					mapNodes(ids, (layer) => ({
						...layer,
						shadow: stampShadowSpread(layer.shadow, spread)
					}), true);
				},
				children: label
			}, `sh-spread-${n.id}`);
		})
	});
}
function MixedShadowInsetChips({ nodes }) {
	const mapNodes = useDesign((s) => s.mapNodes);
	const ids = nodes.map((n) => n.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: nodes.map((n) => {
			const inset = Boolean(n.shadow?.inset);
			const label = shadowInsetLabel(inset);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
				title: `Unify shadow inset with ${n.name || n.kind}: ${label}`,
				"aria-label": `Unify shadow inset with ${n.name || n.kind}: ${label}`,
				onMouseEnter: () => ghostShadow({ shadowInset: inset }),
				onFocus: () => ghostShadow({ shadowInset: inset }),
				onMouseLeave: () => ghostShadow(null),
				onBlur: () => ghostShadow(null),
				onClick: () => {
					mapNodes(ids, (layer) => ({
						...layer,
						shadow: stampShadowInset(layer.shadow, inset)
					}), true);
				},
				children: label
			}, `sh-inset-${n.id}`);
		})
	});
}
function mapShadows(map, commit = false) {
	const state = useDesign.getState();
	state.mapNodes(state.selection, (layer) => ({
		...layer,
		shadow: map(layer.shadow)
	}), commit);
}
function MixedHexField({ value, mixed, ariaLabel, onCommit }) {
	const hex = value.startsWith("#") ? value : "#000000";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "color",
			className: cn("h-8 w-12 shrink-0 rounded-[8px] border border-border", mixed && "opacity-60"),
			value: hex === "transparent" ? "#3fc6ff" : hex,
			"aria-label": mixed ? `${ariaLabel} mixed` : ariaLabel,
			onChange: (e) => onCommit(e.target.value)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "field font-mono flex-1",
			value: mixed ? "" : hex,
			placeholder: mixed ? "—" : void 0,
			"aria-label": mixed ? `${ariaLabel} hex mixed` : `${ariaLabel} hex`,
			onChange: (e) => {
				const raw = e.target.value.trim();
				if (/^#([0-9a-fA-F]{6})$/.test(raw)) onCommit(raw);
			},
			onBlur: (e) => {
				const raw = e.target.value.trim();
				if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) onCommit(raw.length === 4 ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}` : raw);
			}
		})]
	});
}
function MixedInk({ nodes, brandColors, ink }) {
	const updateNodes = useDesign((s) => s.updateNodes);
	if (nodes.length < 2) return null;
	const ids = nodes.map((n) => n.id);
	const first = nodes[0];
	const ghost = first.shadow ?? DEFAULT_SHADOW;
	const fillHex = solidOf(first.fill, ink);
	const mixedFill = new Set(nodes.map((n) => JSON.stringify(n.fill))).size > 1;
	const mixedStrokeColor = new Set(nodes.map((n) => n.stroke)).size > 1;
	const mixedStrokeWidth = new Set(nodes.map((n) => n.strokeWidth)).size > 1;
	const mixedStroke = mixedStrokeColor || mixedStrokeWidth;
	const mixedOpacity = new Set(nodes.map((n) => n.opacity)).size > 1;
	const mixedBlend = new Set(nodes.map((n) => n.blend)).size > 1;
	const mixedVis = new Set(nodes.map((n) => n.visible)).size > 1;
	const mixedLock = new Set(nodes.map((n) => n.locked)).size > 1;
	const mixedShadow = new Set(nodes.map((n) => shadowKey(n.shadow))).size > 1;
	const mixedColor = new Set(nodes.map((n) => n.shadow?.color ?? DEFAULT_SHADOW.color)).size > 1;
	const mixedBlur = new Set(nodes.map((n) => n.shadow?.blur ?? DEFAULT_SHADOW.blur)).size > 1;
	const mixedOx = new Set(nodes.map((n) => n.shadow?.ox ?? DEFAULT_SHADOW.ox)).size > 1;
	const mixedOy = new Set(nodes.map((n) => n.shadow?.oy ?? DEFAULT_SHADOW.oy)).size > 1;
	const mixedSpread = new Set(nodes.map((n) => shadowSpread(n.shadow))).size > 1;
	const mixedInset = new Set(nodes.map((n) => shadowInset(n.shadow))).size > 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border-b border-border py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase",
				children: ["Ink · ", nodes.length]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[10px] text-ink-dim",
				children: "Mixed sliders stay live — they ghost the first drop and write only the field you drag."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
				label: mixedFill ? "Fill · mixed" : "Fill",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedHexField, {
						value: fillHex,
						mixed: mixedFill,
						ariaLabel: "selection fill",
						onCommit: (hex) => updateNodes(ids, { fill: hex }, true)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swatches, {
						colors: brandColors,
						onPick: (hex) => updateNodes(ids, { fill: hex }, true)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-1 text-[10px] text-phosphor",
						onClick: () => updateNodes(ids, { fill: cloneFill(first.fill) }, true),
						children: "Apply key fill to all"
					}),
					mixedFill && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedFillChips, {
						nodes,
						ink
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
				label: mixedStroke ? "Stroke · mixed" : "Stroke",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedHexField, {
						value: first.stroke === "transparent" ? "#3fc6ff" : first.stroke,
						mixed: mixedStrokeColor,
						ariaLabel: "selection stroke",
						onCommit: (hex) => updateNodes(ids, {
							stroke: hex,
							strokeWidth: Math.max(first.strokeWidth, 1)
						}, true)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] text-ink-dim",
							children: mixedStrokeWidth ? "Width · mixed" : "Width"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumField, {
							className: "field w-16 font-mono",
							value: first.strokeWidth,
							mixed: mixedStrokeWidth,
							min: 0,
							"aria-label": "selection stroke width",
							onCommit: (n) => updateNodes(ids, { strokeWidth: n }, true)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-1 text-[10px] text-phosphor",
						onClick: () => updateNodes(ids, {
							stroke: first.stroke,
							strokeWidth: first.strokeWidth
						}, true),
						children: "Apply key stroke to all"
					}),
					mixedStroke && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedStrokeChips, { nodes })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
				label: mixedOpacity ? "Opacity · mixed" : `Opacity ${Math.round(first.opacity * 100)}%`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					className: cn("range-phosphor w-full", mixedOpacity && "opacity-70"),
					min: 0,
					max: 1,
					step: .01,
					value: first.opacity,
					"data-opacity-range": "mixed",
					style: { "--fill-opacity": String(first.opacity) },
					onChange: (e) => updateNodes(ids, { opacity: Number(e.target.value) }),
					onPointerUp: () => useDesign.getState().commit()
				}), mixedOpacity && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedOpacityChips, { nodes })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
				label: mixedBlend ? "Blend · mixed" : "Blend",
				children: [mixedBlend && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedBlendLegend, { nodes }), mixedBlend && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedBlendChips, { nodes })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
				label: mixedVis ? "Visibility · mixed" : "Visibility",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim",
						onClick: () => updateNodes(ids, { visible: true }, true),
						children: "Show all"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim",
						onClick: () => updateNodes(ids, { visible: false }, true),
						children: "Hide all"
					})]
				}), mixedVis && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedVisibilityChips, { nodes })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
				label: mixedLock ? "Lock · mixed" : "Lock",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim",
						onClick: () => updateNodes(ids, { locked: true }, true),
						children: "Lock all"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim",
						onClick: () => updateNodes(ids, { locked: false }, true),
						children: "Unlock all"
					})]
				}), mixedLock && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedLockChips, { nodes })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] text-ink-dim",
							children: mixedShadow ? "Shadow · mixed" : first.shadow ? "Shadow" : "Shadow off"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-[10px] text-phosphor",
							onClick: () => mapShadows((sh) => sh ? null : { ...DEFAULT_SHADOW }, true),
							children: nodes.every((n) => n.shadow) ? "Clear" : "Add"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] text-ink-faint",
						children: "selection shadow x / y stay independent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1.5 flex flex-wrap gap-1",
						children: nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate",
							title: `Unify full shadow with ${n.name || n.kind}: ${shadowChipLabel(n.shadow)}`,
							"aria-label": `Unify full shadow with ${n.name || n.kind}: ${shadowChipLabel(n.shadow)}`,
							onClick: () => mapShadows(() => cloneShadow(n.shadow), true),
							children: shadowChipLabel(n.shadow)
						}, `full-sh-${n.id}`))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: mixedColor ? "Colour · mixed" : "Colour",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "color",
							className: cn("h-8 w-full rounded-[8px] border border-border", mixedColor && "ghost"),
							value: ghost.color,
							title: "Unify shadow ox",
							"aria-label": mixedColor ? "selection shadow colour mixed ghost" : "selection shadow colour",
							onChange: (e) => {
								const color = e.target.value;
								mapShadows((sh) => stampShadowColor(sh, color));
							},
							onPointerUp: () => useDesign.getState().commit()
						}), mixedColor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedShadowColorChips, { nodes })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: mixedBlur ? "Blur · mixed" : `Blur ${ghost.blur}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							className: cn("range-phosphor w-full", mixedBlur && "ghost opacity-70"),
							min: 0,
							max: 80,
							value: ghost.blur,
							"aria-label": mixedBlur ? "selection shadow blur mixed ghost" : "selection shadow blur",
							onChange: (e) => {
								const blur = Number(e.target.value);
								mapShadows((sh) => stampShadowBlur(sh, blur));
							},
							onPointerUp: () => useDesign.getState().commit()
						}), mixedBlur && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedShadowBlurChips, { nodes })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: mixedOx ? "X · mixed" : `X ${ghost.ox}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							className: cn("range-phosphor w-full", mixedOx && "ghost opacity-70"),
							min: -40,
							max: 40,
							value: ghost.ox,
							title: "Unify shadow ox",
							"aria-label": mixedOx ? "selection shadow x mixed ghost" : "selection shadow x",
							onChange: (e) => {
								const ox = Number(e.target.value);
								mapShadows((sh) => stampShadowOx(sh, ox));
							},
							onPointerUp: () => useDesign.getState().commit()
						}), mixedOx && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedShadowOffsetChips, {
							nodes,
							axis: "ox"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: mixedOy ? "Y · mixed" : `Y ${ghost.oy}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							className: cn("range-phosphor w-full", mixedOy && "ghost opacity-70"),
							min: -40,
							max: 40,
							value: ghost.oy,
							title: "Unify shadow oy",
							"aria-label": mixedOy ? "selection shadow y mixed ghost" : "selection shadow y",
							onChange: (e) => {
								const oy = Number(e.target.value);
								mapShadows((sh) => stampShadowOy(sh, oy));
							},
							onPointerUp: () => useDesign.getState().commit()
						}), mixedOy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedShadowOffsetChips, {
							nodes,
							axis: "oy"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: mixedSpread ? "Spread · mixed" : `Spread ${shadowSpread(ghost)}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							className: cn("range-phosphor w-full", mixedSpread && "ghost opacity-70"),
							min: 0,
							max: 40,
							value: shadowSpread(ghost),
							"aria-label": mixedSpread ? "selection shadow spread mixed ghost" : "selection shadow spread",
							onChange: (e) => {
								const spread = Number(e.target.value);
								mapShadows((sh) => stampShadowSpread(sh, spread));
							},
							onPointerUp: () => useDesign.getState().commit()
						}), mixedSpread && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedShadowSpreadChips, { nodes })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: mixedInset ? "Inset · mixed" : shadowInset(ghost) ? "Inset" : "Drop",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 text-[11px] text-ink-dim",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: cn(mixedInset && "ghost"),
								checked: shadowInset(ghost),
								"aria-label": mixedInset ? "selection shadow inset mixed ghost" : "selection shadow inset",
								onChange: (e) => {
									const inset = e.target.checked;
									mapShadows((sh) => stampShadowInset(sh, inset), true);
								}
							}), "Inset"]
						}), mixedInset && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedShadowInsetChips, { nodes })]
					})
				]
			})
		]
	});
}
function BrushPreview({ brush }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const w = canvas.width;
		const h = canvas.height;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = "rgba(10, 13, 12, 0.35)";
		ctx.fillRect(0, 0, w, h);
		const base = brushById(brush.id);
		const def = {
			...base,
			hardness: brush.hardness ?? base.hardness,
			spacing: brush.spacing ?? base.spacing,
			scatter: brush.scatter ?? base.scatter,
			grain: brush.grain ?? base.grain
		};
		const size = Math.max(4, Math.min(brush.size, h * .7));
		const y = h / 2;
		strokeSegment(ctx, 12, y, w - 12, y, size, brush.color || "#0a0d0c", def, brush.opacity);
		strokeSegment(ctx, 18, y - 6, w - 18, y + 6, size * .55, brush.color || "#0a0d0c", def, brush.opacity * .8);
	}, [
		brush.id,
		brush.size,
		brush.opacity,
		brush.color,
		brush.hardness,
		brush.spacing,
		brush.scatter,
		brush.grain
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		width: 160,
		height: 36,
		className: "h-9 w-40 rounded-[8px] border border-border bg-surface-alt",
		"aria-label": "Brush stroke preview"
	});
}
function PaintDock() {
	const tool = useDesign((s) => s.tool);
	const brush = useDesign((s) => s.brush);
	const setBrush = useDesign((s) => s.setBrush);
	const color = useDesign((s) => s.color);
	if (tool !== "brush" && tool !== "eraser") return null;
	const liveColor = brush.color || color || "#0a0d0c";
	const hardnessPct = Math.round((brush.hardness ?? .5) * 100);
	const spacingPct = Math.round((brush.spacing ?? .12) * 100);
	const baseScatter = BRUSHES.find((b) => b.id === brush.id)?.scatter ?? 0;
	const liveScatter = brush.scatter ?? baseScatter;
	const scatterLabel = liveScatter < .05 ? "Off" : liveScatter.toFixed(1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-3 border-t border-border bg-surface px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrushPreview, { brush: {
				...brush,
				color: liveColor
			} }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1 overflow-x-auto",
				children: BRUSHES.filter((b) => tool === "eraser" ? b.id === "eraser" : b.id !== "eraser").map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setBrush({ id: b.id }),
					className: cn("h-8 rounded-[8px] px-3 text-xs", brush.id === b.id ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink"),
					children: b.name
				}, b.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-[11px] text-ink-dim",
				children: [
					"Size ",
					brush.size,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor w-24",
						min: 2,
						max: 120,
						value: brush.size,
						onChange: (e) => setBrush({ size: Number(e.target.value) })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-[11px] text-ink-dim",
				children: [
					"Flow ",
					Math.round(brush.opacity * 100),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor w-20",
						min: .05,
						max: 1,
						step: .05,
						value: brush.opacity,
						onChange: (e) => setBrush({ opacity: Number(e.target.value) })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-[11px] text-ink-dim",
				children: [
					"Hard ",
					hardnessPct,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor w-20",
						min: .05,
						max: 1,
						step: .05,
						value: brush.hardness ?? .5,
						"aria-label": "Brush hardness",
						onChange: (e) => setBrush({ hardness: Number(e.target.value) })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-[11px] text-ink-dim",
				children: [
					"Space ",
					spacingPct,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor w-16",
						min: .04,
						max: 1,
						step: .02,
						value: brush.spacing ?? .12,
						"aria-label": "Brush spacing",
						onChange: (e) => setBrush({ spacing: Number(e.target.value) })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-[11px] text-ink-dim",
				children: [
					"Scatter ",
					scatterLabel,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						className: "range-phosphor w-20",
						min: 0,
						max: 3,
						step: .1,
						value: liveScatter,
						"aria-label": "Brush scatter strength",
						onChange: (e) => setBrush({ scatter: Number(e.target.value) })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-[11px] text-ink-dim",
				children: ["Color", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "color",
					className: "h-7 w-8 cursor-pointer rounded-[6px] border border-border bg-transparent",
					value: liveColor,
					"aria-label": "Brush colour",
					onChange: (e) => setBrush({ color: e.target.value })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-[11px] text-ink-dim",
				children: ["Mirror", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: "h-8 rounded-[8px] border border-border bg-surface-alt px-2 text-xs text-ink",
					value: brush.symmetry,
					onChange: (e) => setBrush({ symmetry: e.target.value }),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "none",
							children: "Off"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "x",
							children: "Vertical"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "y",
							children: "Horizontal"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "xy",
							children: "Quad"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "radial",
							children: "Radial"
						})
					]
				})]
			})
		]
	});
}
var TOOLS = [
	{
		id: "select",
		label: "Select",
		icon: MousePointer2,
		k: "V"
	},
	{
		id: "hand",
		label: "Pan",
		icon: Hand,
		k: "H"
	},
	{
		id: "frame",
		label: "Frame",
		icon: Frame,
		k: "F"
	},
	{
		id: "rect",
		label: "Rectangle",
		icon: Square,
		k: "R"
	},
	{
		id: "ellipse",
		label: "Ellipse",
		icon: Circle,
		k: "O"
	},
	{
		id: "line",
		label: "Line",
		icon: Minus,
		k: "L"
	},
	{
		id: "polygon",
		label: "Polygon",
		icon: Hexagon,
		k: "G"
	},
	{
		id: "star",
		label: "Star",
		icon: Star,
		k: "S"
	},
	{
		id: "arrow",
		label: "Arrow",
		icon: ArrowUpRight,
		k: "A"
	},
	{
		id: "text",
		label: "Text",
		icon: Type,
		k: "T"
	},
	{
		id: "pen",
		label: "Pen",
		icon: PenTool,
		k: "P"
	},
	{
		id: "knife",
		label: "Knife",
		icon: Scissors,
		k: "K"
	},
	{
		id: "brush",
		label: "Brush",
		icon: Paintbrush,
		k: "B"
	},
	{
		id: "eraser",
		label: "Eraser",
		icon: Eraser,
		k: "E"
	},
	{
		id: "image",
		label: "Image",
		icon: ImagePlus,
		k: "M"
	},
	{
		id: "eyedropper",
		label: "Eyedropper",
		icon: Droplet,
		k: "I"
	}
];
var PRIMARY = [
	"select",
	"text",
	"brush",
	"rect",
	"pen",
	"image"
];
function ToolButton({ t, active, onPick }) {
	const Icon = t.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		title: `${t.label}${t.k ? ` (${t.k})` : ""}`,
		"aria-label": t.label,
		"aria-pressed": active,
		onClick: () => onPick(t.id),
		className: cn("flex size-10 shrink-0 items-center justify-center rounded-[12px] transition-colors", active ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-4",
			strokeWidth: 1.75
		})
	});
}
function ToolRail() {
	const tool = useDesign((s) => s.tool);
	const setTool = useDesign((s) => s.setTool);
	const [more, setMore] = (0, import_react.useState)(false);
	const primary = TOOLS.filter((t) => PRIMARY.includes(t.id));
	const overflow = TOOLS.filter((t) => !PRIMARY.includes(t.id));
	const overflowActive = overflow.some((t) => t.id === tool);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex gap-1 overflow-x-auto p-2 md:w-14 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-r md:border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden flex-col gap-1 md:flex",
				children: TOOLS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
					t,
					active: tool === t.id,
					onPick: setTool
				}, t.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1 md:hidden",
				children: [primary.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
					t,
					active: tool === t.id,
					onPick: setTool
				}, t.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "More tools",
					"aria-expanded": more,
					onClick: () => setMore((v) => !v),
					className: cn("flex size-10 shrink-0 items-center justify-center rounded-[12px]", more || overflowActive ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-4" })
				})]
			}),
			more && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-14 left-2 z-30 grid grid-cols-4 gap-1 rounded-[16px] border border-border bg-surface p-2 shadow-lg md:hidden",
				children: overflow.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
					t,
					active: tool === t.id,
					onPick: (id) => {
						setTool(id);
						setMore(false);
					}
				}, t.id))
			})
		]
	});
}
/** Keep only the named nodes; same artboard. Empty or missing ids → null. */
function selectionDocument(doc, ids) {
	if (!ids.length) return null;
	const keep = new Set(ids);
	const nodes = doc.nodes.filter((n) => keep.has(n.id));
	if (!nodes.length) return null;
	return {
		...doc,
		nodes,
		name: `${doc.name} selection`
	};
}
/** Visible layers only — used when isolate is on. Same artboard. */
function isolateDocument(doc) {
	const slice = selectionDocument(doc, doc.nodes.filter((n) => n.visible).map((n) => n.id));
	if (!slice) return null;
	return {
		...slice,
		name: `${doc.name} isolate`
	};
}
var CROP_PAD = 2;
function shiftNode(n, dx, dy) {
	return {
		...n,
		x: n.x + dx,
		y: n.y + dy
	};
}
/** Selection on a tight artboard around the AABB of those nodes. */
function cropSelectionDocument(doc, ids) {
	const slice = selectionDocument(doc, ids);
	if (!slice) return null;
	const box = aabb(slice.nodes);
	if (box.w <= 0 || box.h <= 0) return slice;
	const halo = shadowCropExtents(slice.nodes);
	const padL = CROP_PAD + halo.left;
	const padT = CROP_PAD + halo.top;
	const padR = CROP_PAD + halo.right;
	const padB = CROP_PAD + halo.bottom;
	const ox = box.x - padL;
	const oy = box.y - padT;
	const width = Math.max(1, Math.ceil(box.w + padL + padR));
	const height = Math.max(1, Math.ceil(box.h + padT + padB));
	return {
		...slice,
		name: `${doc.name} crop`,
		artboard: {
			...slice.artboard,
			width,
			height,
			name: "Crop"
		},
		nodes: slice.nodes.map((n) => shiftNode(n, -ox, -oy)),
		guides: void 0
	};
}
/** Isolate set on a tight artboard. */
function cropIsolateDocument(doc) {
	const cropped = cropSelectionDocument(doc, doc.nodes.filter((n) => n.visible).map((n) => n.id));
	if (!cropped) return null;
	return {
		...cropped,
		name: `${doc.name} isolate crop`
	};
}
function svgGroupExportNote(nodes) {
	const groups = nodes.filter((n) => n.kind === "group");
	if (!groups.length) return "";
	const rides = groups.some((n) => n.opacity !== 1);
	const isolated = groups.some((n) => n.blend && n.blend !== "source-over");
	const turned = groups.some((n) => n.rotation);
	const hoisted = groups.some((n) => !n.visible && (n.opacity !== 1 || n.blend && n.blend !== "source-over" || Boolean(n.rotation)));
	return ` · ${groups.length} group${groups.length === 1 ? "" : "s"} wrapped${rides ? " · opacity rides the group" : ""}${isolated ? " · blend isolated" : ""}${turned ? " · rotation rides the group" : ""}${hoisted ? " · hidden nest keeps opacity on PNG" : ""}`;
}
function TopBar() {
	const navigate = useNavigate();
	const doc = useDesign((s) => s.doc);
	const index = useDesign((s) => s.index);
	const dirty = useDesign((s) => s.dirty);
	const save = useDesign((s) => s.save);
	const undo = useDesign((s) => s.undo);
	const redo = useDesign((s) => s.redo);
	const rename = useDesign((s) => s.rename);
	const resizeArtboard = useDesign((s) => s.resizeArtboard);
	const toggleGrid = useDesign((s) => s.toggleGrid);
	const grid = useDesign((s) => s.grid);
	const toggleRulers = useDesign((s) => s.toggleRulers);
	const rulers = useDesign((s) => s.rulers);
	const toggleSafeArea = useDesign((s) => s.toggleSafeArea);
	const safeArea = useDesign((s) => s.safeArea);
	const togglePrintMarks = useDesign((s) => s.togglePrintMarks);
	const printMarks = useDesign((s) => s.printMarks);
	const zoom = useDesign((s) => s.viewport.zoom);
	const togglePresent = useDesign((s) => s.togglePresent);
	const setPaletteOpen = useDesign((s) => s.setPaletteOpen);
	const selection = useDesign((s) => s.selection);
	const isolateSnapshot = useDesign((s) => s.isolateSnapshot);
	const [scale, setScale] = (0, import_react.useState)(2);
	const [exportOpen, setExportOpen] = (0, import_react.useState)(false);
	if (!doc) return null;
	function exportFile(kind) {
		if (!doc) return;
		save();
		const campaign = campaignDocsFromIndex(index, doc);
		if (kind === "sel-png" || kind === "sel-svg" || kind === "crop-png" || kind === "crop-svg" || kind === "iso-png" || kind === "iso-svg" || kind === "iso-crop-png" || kind === "iso-crop-svg") {
			const slice = kind === "iso-crop-png" || kind === "iso-crop-svg" ? cropIsolateDocument(doc) : kind === "iso-png" || kind === "iso-svg" ? isolateDocument(doc) : kind === "crop-png" || kind === "crop-svg" ? cropSelectionDocument(doc, selection) : selectionDocument(doc, selection);
			if (!slice) {
				toast.error(kind.startsWith("iso") ? "Isolate a layer first" : "Select a layer first");
				return;
			}
			if (kind.endsWith("svg")) downloadSvg(slice);
			else downloadDataUrl(exportPng(slice, scale), `${slug(slice.name)}.png`);
			const label = kind.startsWith("iso-crop") ? "isolate crop" : kind.startsWith("iso") ? "isolate" : kind.startsWith("crop") ? "crop" : "selection";
			toast.success(kind.endsWith("svg") ? `Exported ${label} SVG · ${slice.nodes.length} layer${slice.nodes.length === 1 ? "" : "s"}${svgGroupExportNote(slice.nodes)}` : `Exported ${label} PNG @${scale}× · ${slice.artboard.width}×${slice.artboard.height}`);
			setExportOpen(false);
			return;
		}
		if (kind === "svg") downloadSvg(doc);
		else if (kind === "jpg") downloadDataUrl(exportJpeg(doc, scale), `${slug(doc.name)}.jpg`);
		else if (kind === "print") downloadDataUrl(exportPrintPng(doc), `${slug(doc.name)}-print.png`);
		else if (kind === "pdf") downloadPrintPdf(doc);
		else if (kind === "campaign-svg") downloadCampaignSvg(campaign, doc.name);
		else if (kind === "campaign-pdf") downloadCampaignPdf(campaign, doc.name, scale);
		else downloadDataUrl(exportPng(doc, scale), `${slug(doc.name)}.png`);
		toast.success(kind === "campaign-pdf" ? `Exported campaign PDF · ${campaignReadoutFromSizes(campaign.map((d) => d.artboard)).label}` : kind === "campaign-svg" ? `Exported campaign SVG · ${campaignReadoutFromSizes(campaign.map((d) => d.artboard)).label}` : kind === "pdf" ? "Exported print PDF" : kind === "print" ? "Exported print PNG @4×" : kind === "svg" ? `Exported SVG${svgGroupExportNote(doc.nodes)}` : `Exported ${kind.toUpperCase()} @${scale}×`);
		setExportOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex h-14 shrink-0 items-center gap-1 border-b border-border px-2 md:gap-2 md:px-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				onClick: () => {
					markStayOnHub();
					navigate({ to: "/" });
				},
				"aria-label": "Back",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: doc.name,
				onChange: (e) => rename(e.target.value),
				className: "min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none md:max-w-xs"
			}),
			dirty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden font-mono text-[10px] text-ink-faint uppercase md:inline",
				children: "Unsaved"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				className: "hidden h-8 max-w-[140px] rounded-[8px] border border-border bg-surface-alt px-2 text-xs text-ink md:block",
				value: doc.artboard.formatId,
				onChange: (e) => resizeArtboard(e.target.value, true),
				"aria-label": "Magic resize",
				children: FORMATS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: f.id,
					children: f.label
				}, f.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "hidden font-mono text-[11px] text-ink-faint tabular-nums md:inline",
				children: [Math.round(zoom * 100), "%"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				onClick: () => setPaletteOpen(true),
				"aria-label": "Command palette",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hidden items-center gap-1 md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: toggleGrid,
						"aria-label": "Toggle grid",
						"aria-pressed": grid,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid3x3, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: toggleRulers,
						"aria-label": "Toggle rulers",
						"aria-pressed": rulers,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ruler, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: toggleSafeArea,
						"aria-label": "Toggle safe area",
						"aria-pressed": safeArea,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scan, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: togglePrintMarks,
						"aria-label": "Toggle print marks",
						"aria-pressed": printMarks,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crop, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: togglePresent,
						"aria-label": "Present",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: undo,
						"aria-label": "Undo",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: redo,
						"aria-label": "Redo",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: () => save(),
						"aria-label": "Save",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => setExportOpen((v) => !v),
					"aria-expanded": exportOpen,
					"aria-label": "Export",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: "Export"
					})]
				}), exportOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute top-11 right-0 z-40 w-44 rounded-[12px] border border-border bg-surface p-2 shadow-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "mb-2 h-8 w-full rounded-[8px] border border-border bg-surface-alt px-1 font-mono text-[11px] text-ink",
							value: scale,
							onChange: (e) => setScale(Number(e.target.value)),
							"aria-label": "Export scale",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: 1,
									children: "1×"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: 2,
									children: "2×"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: 3,
									children: "3×"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							onClick: () => exportFile("png"),
							children: "PNG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							onClick: () => exportFile("jpg"),
							children: "JPG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							onClick: () => exportFile("svg"),
							children: "SVG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							disabled: selection.length === 0,
							onClick: () => exportFile("sel-png"),
							children: "Selection PNG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							disabled: selection.length === 0,
							onClick: () => exportFile("sel-svg"),
							children: "Selection SVG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							disabled: selection.length === 0,
							onClick: () => exportFile("crop-png"),
							children: "Crop PNG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							disabled: selection.length === 0,
							onClick: () => exportFile("crop-svg"),
							children: "Crop SVG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							disabled: !isolateSnapshot,
							onClick: () => exportFile("iso-png"),
							children: "Isolate PNG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							disabled: !isolateSnapshot,
							onClick: () => exportFile("iso-svg"),
							children: "Isolate SVG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							disabled: !isolateSnapshot,
							onClick: () => exportFile("iso-crop-png"),
							children: "Isolate crop PNG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							disabled: !isolateSnapshot,
							onClick: () => exportFile("iso-crop-svg"),
							children: "Isolate crop SVG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "mb-1 w-full",
							variant: "primary",
							onClick: () => exportFile("print"),
							children: "Print PNG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "w-full",
							variant: "primary",
							onClick: () => exportFile("pdf"),
							children: "Print PDF"
						}),
						doc.campaignId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignExportReadout, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								className: "mt-1 w-full",
								onClick: () => exportFile("campaign-svg"),
								children: "Campaign SVG"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								className: "mt-1 w-full",
								variant: "primary",
								onClick: () => exportFile("campaign-pdf"),
								children: "Campaign PDF"
							})
						] })
					]
				})]
			})
		]
	});
}
function CampaignExportReadout() {
	const doc = useDesign((s) => s.doc);
	const index = useDesign((s) => s.index);
	if (!doc?.campaignId) return null;
	const pages = campaignPages(index, doc.campaignId);
	const sizes = pages.length ? pages.map((p) => ({
		width: p.id === doc.id ? doc.artboard.width : p.width,
		height: p.id === doc.id ? doc.artboard.height : p.height
	})) : [{
		width: doc.artboard.width,
		height: doc.artboard.height
	}];
	const readout = campaignReadoutFromSizes(sizes);
	const format = FORMATS.find((f) => f.id === doc.artboard.formatId)?.label ?? doc.artboard.formatId;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 rounded-[8px] border border-phosphor/40 bg-surface-alt px-2 py-1.5 font-mono text-[10px] leading-snug tracking-wide text-phosphor",
		"data-campaign-readout": true,
		"aria-label": "Campaign readout",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: readout.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-ink-faint",
			children: [
				"This board ",
				doc.artboard.width,
				"×",
				doc.artboard.height,
				" · ",
				format
			]
		})]
	});
}
var KEYS = {
	v: "select",
	h: "hand",
	r: "rect",
	o: "ellipse",
	l: "line",
	g: "polygon",
	s: "star",
	a: "arrow",
	t: "text",
	p: "pen",
	k: "knife",
	b: "brush",
	e: "eraser",
	m: "image",
	i: "eyedropper",
	f: "frame"
};
function useShortcuts(_opts) {
	(0, import_react.useEffect)(() => {
		const arrows = /* @__PURE__ */ new Set();
		const onKey = (e) => {
			const t = e.target;
			const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
			const s = useDesign.getState();
			const meta = e.metaKey || e.ctrlKey;
			if (meta && e.key.toLowerCase() === "k") {
				e.preventDefault();
				s.setPaletteOpen(!s.paletteOpen);
				return;
			}
			if (typing) return;
			if (e.key === "?" || e.shiftKey && e.key === "/") {
				e.preventDefault();
				s.setPaletteOpen(true);
				return;
			}
			if (e.key === "Escape") {
				if (getAlignPreview()) {
					e.preventDefault();
					clearAlignPreview();
					return;
				}
				if (getAlignCommitEcho()) {
					e.preventDefault();
					clearAlignCommitEcho();
					return;
				}
				if (getDistributePreview()) {
					e.preventDefault();
					clearDistributePreview();
					return;
				}
				if (s.paletteOpen) {
					s.setPaletteOpen(false);
					return;
				}
				if (s.present) {
					s.setPresent(false);
					return;
				}
				if (s.tool === "pen") {
					e.preventDefault();
					s.finishPen();
					return;
				}
				s.select([]);
				s.setTool("select");
				return;
			}
			if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") && s.doc?.campaignId) {
				e.preventDefault();
				s.nudgeCampaignPage(s.doc.id, e.key === "ArrowLeft" ? -1 : 1);
				return;
			}
			if (s.present) return;
			if (e.altKey && !meta && s.selection.length > 0 && /^[0-9]$/.test(e.key)) {
				e.preventDefault();
				if (e.shiftKey && e.key === "0") s.updateNodes(s.selection, { opacity: 1 });
				else if (!e.shiftKey) {
					const tenths = Number(e.key);
					s.updateNodes(s.selection, { opacity: tenths / 10 });
				} else return;
				s.commit();
				return;
			}
			if (e.altKey && !meta && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
				const panel = document.querySelector("[data-layers-panel]");
				if (panel && panel.contains(t)) {
					e.preventDefault();
					const delta = e.key === "ArrowUp" ? .01 : -.01;
					const live = useDesign.getState();
					if (live.selection.length > 0) live.mapNodes(live.selection, (n) => ({
						...n,
						opacity: Math.max(0, Math.min(1, (n.opacity ?? 1) + delta))
					}), true);
					return;
				}
			}
			if (meta && e.key.toLowerCase() === "z") {
				e.preventDefault();
				if (e.shiftKey) s.redo();
				else s.undo();
				return;
			}
			if (meta && e.key.toLowerCase() === "s") {
				e.preventDefault();
				s.save();
				return;
			}
			if (meta && e.key.toLowerCase() === "d") {
				e.preventDefault();
				if (e.shiftKey) s.duplicateLinked();
				else s.duplicateSelected();
				return;
			}
			if (meta && e.key.toLowerCase() === "a") {
				e.preventDefault();
				s.selectAll();
				return;
			}
			if (meta && e.key.toLowerCase() === "u") {
				e.preventDefault();
				applyBoolean(e.shiftKey ? "subtract" : "union");
				return;
			}
			if (meta && e.key.toLowerCase() === "i") {
				e.preventDefault();
				applyBoolean(e.shiftKey ? "exclude" : "intersect");
				return;
			}
			if (meta && e.key.toLowerCase() === "g") {
				e.preventDefault();
				if (e.shiftKey) s.ungroupSelection();
				else s.groupSelection();
				return;
			}
			if (meta && e.key.toLowerCase() === "c") {
				e.preventDefault();
				if (e.shiftKey) s.copyOpacity();
				else s.copySelected();
				return;
			}
			if (meta && e.key.toLowerCase() === "x") {
				e.preventDefault();
				s.cutSelected();
				return;
			}
			if (meta && e.key.toLowerCase() === "v") {
				e.preventDefault();
				if (e.shiftKey) s.pasteOpacity();
				else s.pasteClipboard();
				return;
			}
			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				if (s.tool === "pen") {
					if ((s.doc?.nodes.find((x) => x.id === s.selection[0]))?.kind === "path") {
						s.popLastPathPoint();
						return;
					}
				}
				s.removeSelected();
				return;
			}
			if (e.key === "Enter" && getAlignPreview()) {
				e.preventDefault();
				commitAlignPreview();
				return;
			}
			if (e.key === "Enter" && getDistributePreview()) {
				e.preventDefault();
				commitDistributePreview();
				return;
			}
			if (e.key === "Enter" && s.tool === "pen") {
				e.preventDefault();
				s.closeSelectedPath();
				return;
			}
			if ((e.key === "Alt" || e.code === "AltLeft" || e.code === "AltRight") && s.tool === "pen" && !meta) {
				if (cornerLastPenPoint()) e.preventDefault();
				return;
			}
			if (e.shiftKey && e.key.toLowerCase() === "s" && !meta) {
				e.preventDefault();
				smoothSelectedPath();
				return;
			}
			if (e.shiftKey && e.code === "KeyP" && !meta) {
				e.preventDefault();
				s.togglePresent();
				return;
			}
			if (e.code === "Digit0" || e.key === "0" || e.key === ")") {
				e.preventDefault();
				if (e.shiftKey) requestFitSelection();
				else s.requestFit();
				return;
			}
			if (e.key === "1" && !meta) {
				e.preventDefault();
				s.requestZoom(1);
				return;
			}
			if (e.key === "2" && !meta) {
				e.preventDefault();
				s.requestZoom(2);
				return;
			}
			if (e.key === "=" || e.key === "+") {
				e.preventDefault();
				s.requestZoom(s.viewport.zoom * 1.15);
				return;
			}
			if (e.key === "-" || e.key === "_") {
				e.preventDefault();
				s.requestZoom(s.viewport.zoom / 1.15);
				return;
			}
			if (e.key === "[") {
				s.setBrush({ size: Math.max(2, s.brush.size - 4) });
				return;
			}
			if (e.key === "]") {
				s.setBrush({ size: Math.min(120, s.brush.size + 4) });
				return;
			}
			if (!meta && s.pathEditHit?.hole != null && (e.key === "Home" || e.key === "End")) {
				const toEnd = e.key === "End";
				if (e.shiftKey) {
					jumpPathHolePoint(toEnd);
					e.preventDefault();
					return;
				}
				if (jumpPathHole(toEnd)) {
					e.preventDefault();
					return;
				}
			}
			const nudge = e.altKey ? .5 : e.shiftKey ? 10 : 1;
			if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
				if (!meta && (e.key === "ArrowUp" || e.key === "ArrowDown") && s.pathEditHit?.hole != null && stepPathHole(e.key === "ArrowDown" ? 1 : -1)) {
					e.preventDefault();
					return;
				}
				if (!meta && (e.key === "ArrowLeft" || e.key === "ArrowRight") && s.pathEditHit?.hole != null && stepPathHolePoint(e.key === "ArrowRight" ? 1 : -1)) {
					e.preventDefault();
					return;
				}
				e.preventDefault();
				arrows.add(e.key);
				const dx = e.key === "ArrowLeft" ? -nudge : e.key === "ArrowRight" ? nudge : 0;
				const dy = e.key === "ArrowUp" ? -nudge : e.key === "ArrowDown" ? nudge : 0;
				if (s.selection.length === 1 && (s.pathPointSelection?.length || s.pathEditHit) && nudgeSelectedPathPoints(dx, dy)) return;
				useDesign.getState().translateSelected(dx, dy, { snap: s.snap && !e.altKey });
			}
			if (meta) return;
			const tool = KEYS[e.key.toLowerCase()];
			if (tool) s.setTool(tool);
		};
		const onPaste = (e) => {
			const t = e.target;
			if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
			const item = [...e.clipboardData?.items ?? []].find((i) => i.type.startsWith("image/"));
			if (!item) return;
			const file = item.getAsFile();
			if (!file) return;
			e.preventDefault();
			const reader = new FileReader();
			reader.onload = () => {
				const src = String(reader.result);
				const img = new Image();
				img.onload = () => {
					if (!useDesign.getState().doc) return;
					const scale = Math.min(1, 720 / Math.max(img.width, img.height));
					useDesign.getState().addNode(imageNode({
						x: 80,
						y: 80,
						w: img.width * scale,
						h: img.height * scale,
						src
					}));
				};
				img.src = src;
			};
			reader.readAsDataURL(file);
		};
		const onUp = (e) => {
			if (!arrows.has(e.key)) return;
			arrows.delete(e.key);
			if (arrows.size === 0) useDesign.getState().releaseNudgeGuides();
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("keyup", onUp);
		window.addEventListener("paste", onPaste);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("keyup", onUp);
			window.removeEventListener("paste", onPaste);
		};
	}, []);
}
function CampaignStrip() {
	const navigate = useNavigate();
	const doc = useDesign((s) => s.doc);
	const index = useDesign((s) => s.index);
	const makeCampaign = useDesign((s) => s.makeCampaign);
	const addCampaignPage = useDesign((s) => s.addCampaignPage);
	const duplicateCampaignPage = useDesign((s) => s.duplicateCampaignPage);
	const unlinkCampaignPage = useDesign((s) => s.unlinkCampaignPage);
	const removeCampaignPage = useDesign((s) => s.removeCampaignPage);
	const renameCampaignPage = useDesign((s) => s.renameCampaignPage);
	const reorderCampaignPages = useDesign((s) => s.reorderCampaignPages);
	const nudgeCampaignPage = useDesign((s) => s.nudgeCampaignPage);
	const save = useDesign((s) => s.save);
	const [menuId, setMenuId] = (0, import_react.useState)(null);
	const [renaming, setRenaming] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [dragging, setDragging] = (0, import_react.useState)(null);
	if (!doc) return null;
	const pages = campaignPages(index, doc.campaignId);
	const used = new Set(pages.map((p) => p.formatId));
	function go(id) {
		save();
		navigate({
			to: "/studio/$id",
			params: { id }
		});
	}
	function confirmDeleteLast() {
		return window.confirm("Delete the last page in this set? The board will be removed.");
	}
	function moveChip(fromId, toId) {
		if (!fromId || !toId || fromId === toId) return;
		const ids = pages.map((p) => p.id);
		const from = ids.indexOf(fromId);
		const to = ids.indexOf(toId);
		if (from < 0 || to < 0) return;
		ids.splice(from, 1);
		ids.splice(to, 0, fromId);
		reorderCampaignPages(ids);
	}
	if (!doc.campaignId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-9 shrink-0 items-center gap-2 border-b border-border px-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase hover:text-phosphor",
			onClick: () => makeCampaign(),
			children: "Campaign · story + square + banner"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2",
		children: [
			pages.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative shrink-0",
				children: [renaming === p.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					autoFocus: true,
					className: "h-7 w-28 rounded-[8px] border border-phosphor bg-surface px-2 font-mono text-[10px] text-ink",
					value: draft,
					"aria-label": "Rename campaign page",
					onChange: (e) => setDraft(e.target.value),
					onBlur: () => {
						renameCampaignPage(p.id, draft);
						setRenaming(null);
					},
					onKeyDown: (e) => {
						if (e.key === "Enter") {
							renameCampaignPage(p.id, draft);
							setRenaming(null);
						}
						if (e.key === "Escape") setRenaming(null);
					}
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					draggable: true,
					onDragStart: (e) => {
						setDragging(p.id);
						e.dataTransfer.effectAllowed = "move";
						e.dataTransfer.setData("text/plain", p.id);
						setMenuId(null);
					},
					onDragOver: (e) => {
						e.preventDefault();
						e.dataTransfer.dropEffect = "move";
					},
					onDrop: (e) => {
						e.preventDefault();
						const fromId = e.dataTransfer.getData("text/plain") || dragging;
						if (fromId) moveChip(fromId, p.id);
						setDragging(null);
					},
					onDragEnd: () => setDragging(null),
					onClick: () => go(p.id),
					onDoubleClick: (e) => {
						e.preventDefault();
						setRenaming(p.id);
						setDraft(p.name ?? shortFormat$1(p.formatId));
						setMenuId(null);
					},
					onContextMenu: (e) => {
						e.preventDefault();
						setMenuId(menuId === p.id ? null : p.id);
					},
					onKeyDown: (e) => {
						if (!e.altKey) return;
						if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
						e.preventDefault();
						e.stopPropagation();
						nudgeCampaignPage(p.id, e.key === "ArrowLeft" ? -1 : 1);
					},
					title: "Alt+Left / Alt+Right to reorder",
					className: cn("h-7 shrink-0 cursor-grab rounded-[8px] px-2 font-mono text-[10px] uppercase tracking-wide active:cursor-grabbing", p.id === doc.id ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:text-ink", dragging === p.id && "opacity-50"),
					"aria-haspopup": "menu",
					"aria-expanded": menuId === p.id,
					children: shortFormat$1(p.formatId)
				}), menuId === p.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "menu",
					className: "absolute left-0 top-8 z-30 min-w-36 border border-border bg-surface py-1 shadow-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "menuitem",
							className: "block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor",
							onClick: () => {
								setRenaming(p.id);
								setDraft(p.name ?? shortFormat$1(p.formatId));
								setMenuId(null);
							},
							children: "Rename"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "menuitem",
							className: "block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor",
							onClick: () => {
								const pageId = duplicateCampaignPage();
								setMenuId(null);
								if (pageId) go(pageId);
							},
							children: "Duplicate"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "menuitem",
							className: "block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor",
							onClick: () => {
								unlinkCampaignPage(p.id);
								setMenuId(null);
							},
							children: "Unlink"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "menuitem",
							className: "block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor",
							onClick: () => {
								if (pages.length <= 1 && !confirmDeleteLast()) {
									setMenuId(null);
									return;
								}
								const next = removeCampaignPage(p.id);
								setMenuId(null);
								if (next) go(next);
								else navigate({ to: "/" });
							},
							children: "Delete page"
						})
					]
				})]
			}, p.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-7 shrink-0 rounded-[8px] px-2 font-mono text-[10px] uppercase tracking-wide text-ink-faint hover:text-phosphor",
				onClick: () => {
					const pageId = duplicateCampaignPage();
					if (pageId) go(pageId);
				},
				"aria-label": "Duplicate campaign page",
				children: "Duplicate"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: "h-7 rounded-[8px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-ink-dim",
				value: "",
				"aria-label": "Add campaign page",
				onChange: (e) => {
					const id = e.target.value;
					if (!id) return;
					const pageId = addCampaignPage(id);
					if (pageId) go(pageId);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "",
					children: "+ page"
				}), FORMATS.filter((f) => !used.has(f.id)).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: f.id,
					children: f.label
				}, f.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignStripReadout, {})
		]
	});
}
function shortFormat$1(id) {
	if (!id) return "Page";
	if (id === "ig-story" || id === "tiktok") return "Story";
	if (id === "ig-post" || id === "square" || id === "album") return "Square";
	if (id === "x-post" || id === "linkedin" || id === "wide") return "Banner";
	return FORMATS.find((f) => f.id === id)?.label ?? id;
}
function CampaignStripReadout() {
	const doc = useDesign((s) => s.doc);
	const index = useDesign((s) => s.index);
	if (!doc?.campaignId) return null;
	const pages = campaignPages(index, doc.campaignId);
	const sizes = pages.length ? pages.map((p) => ({
		width: p.id === doc.id ? doc.artboard.width : p.width,
		height: p.id === doc.id ? doc.artboard.height : p.height
	})) : [{
		width: doc.artboard.width,
		height: doc.artboard.height
	}];
	const readout = campaignReadoutFromSizes(sizes);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "ml-auto shrink-0 font-mono text-[10px] tracking-wide text-phosphor",
		title: `Campaign stack ${readout.stackWidth}×${readout.stackHeight} with 48px gaps`,
		"aria-label": "Campaign readout",
		"data-campaign-readout": true,
		children: readout.label
	});
}
function StudioStatusStrip() {
	const status = (0, import_react.useSyncExternalStore)(subscribeStudioStatus, getStudioStatus, getStudioStatus);
	const held = (0, import_react.useSyncExternalStore)(subscribeStudioStatus, isHeldStudioStatus, isHeldStudioStatus);
	if (!status) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "shrink-0 border-t border-border bg-surface px-3 py-1.5 font-mono text-[10px] tracking-[0.08em] text-phosphor",
		"aria-live": "polite",
		"data-studio-status": held ? "held" : "live",
		children: status
	});
}
/** Present-mode fullscreen stays on the present root so the campaign rail remains in view. */
function presentRootIsFullscreen(root, doc = document) {
	if (!root) return false;
	return doc.fullscreenElement === root;
}
async function enterPresentFullscreen(root) {
	if (!root || typeof root.requestFullscreen !== "function") return false;
	if (presentRootIsFullscreen(root)) return true;
	try {
		await root.requestFullscreen();
		return true;
	} catch {
		return false;
	}
}
async function exitPresentFullscreen(doc = document) {
	if (!doc.fullscreenElement || typeof doc.exitFullscreen !== "function") return;
	try {
		await doc.exitFullscreen();
	} catch {}
}
async function togglePresentFullscreen(root, doc = document) {
	if (presentRootIsFullscreen(root, doc)) {
		await exitPresentFullscreen(doc);
		return false;
	}
	return enterPresentFullscreen(root);
}
/** Hide present chrome after idle; any activity or F reveals the campaign rail. */
var PRESENT_IDLE_MS = 2800;
function shouldHidePresentChrome(opts) {
	if (opts.notesOpen || opts.menuOpen) return false;
	return opts.idle;
}
function shouldShowPresentPeek(opts) {
	return opts.hideChrome && opts.pageCount > 0;
}
function isQuietPresentNavKey(key) {
	return key === "ArrowRight" || key === "ArrowLeft" || key === " " || key === "PageDown" || key === "PageUp" || key === "Home" || key === "End" || key === "Shift";
}
function isQuietPresentPeekTarget(target) {
	return target instanceof Element && Boolean(target.closest("[data-present-peek]"));
}
function peekTickFadeShouldRestart(prevTickId, nextTickId) {
	if (!nextTickId) return false;
	return prevTickId !== nextTickId;
}
function peekTickFadeShouldRestartAfterLostCapture(prevTickId, nextTickId) {
	return peekTickFadeShouldRestart(prevTickId, nextTickId);
}
function peekAfterLostCapture(opts = {}) {
	return {
		muted: Boolean(opts.muted),
		namedId: opts.namedId ?? null,
		tickId: opts.tickId ?? null,
		landedId: opts.landedId ?? null
	};
}
function peekCaptionNameId(opts = null) {
	if (typeof opts === "string" || opts == null) return opts ?? null;
	return opts.namedId ?? opts.fallbackId ?? null;
}
function caption(opts = {}) {
	return {
		muted: Boolean(opts.muted),
		namedId: opts.namedId ?? null,
		showCaption: Boolean(opts.showCaption),
		mutedPointerUpKeep: Boolean(opts.mutedPointerUpKeep),
		stayInPresent: opts.stayInPresent !== false
	};
}
function peekCaptionAfterQuietHomeEnd(opts = {}) {
	return caption(opts);
}
function peekCaptionAfterShiftRelease(opts = {}) {
	return caption(opts);
}
function peekCaptionAfterQuietEscape(opts = {}) {
	return caption({
		...opts,
		muted: false,
		namedId: null
	});
}
function peekTickAfterQuietHomeEnd(opts = {}) {
	return opts.tickId ?? null;
}
function shortFormat(id) {
	if (id === "ig-story" || id === "tiktok") return "Story";
	if (id === "ig-post" || id === "square" || id === "album") return "Square";
	if (id === "x-post" || id === "linkedin" || id === "wide") return "Banner";
	return FORMATS.find((f) => f.id === id)?.label ?? id;
}
function PresentChipRail({ pages, liveId, onGo, onMenuOpenChange }) {
	const navigate = useNavigate();
	const save = useDesign((s) => s.save);
	const setPresent = useDesign((s) => s.setPresent);
	const unlinkCampaignPage = useDesign((s) => s.unlinkCampaignPage);
	const removeCampaignPage = useDesign((s) => s.removeCampaignPage);
	const duplicateCampaignPage = useDesign((s) => s.duplicateCampaignPage);
	const renameCampaignPage = useDesign((s) => s.renameCampaignPage);
	const reorderCampaignPages = useDesign((s) => s.reorderCampaignPages);
	const nudgeCampaignPage = useDesign((s) => s.nudgeCampaignPage);
	const [menuId, setMenuId] = (0, import_react.useState)(null);
	const [renaming, setRenaming] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [dragging, setDragging] = (0, import_react.useState)(null);
	const [overId, setOverId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		onMenuOpenChange?.(Boolean(menuId || renaming));
	}, [
		menuId,
		renaming,
		onMenuOpenChange
	]);
	function moveChip(fromId, toId) {
		if (!fromId || !toId || fromId === toId) return;
		const ids = pages.map((p) => p.id);
		const from = ids.indexOf(fromId);
		const to = ids.indexOf(toId);
		if (from < 0 || to < 0) return;
		ids.splice(from, 1);
		ids.splice(to, 0, fromId);
		reorderCampaignPages(ids);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-1 flex items-center gap-1",
		role: "tablist",
		"aria-label": "Campaign pages",
		children: pages.map((p, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [renaming === p.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				autoFocus: true,
				className: "h-6 w-24 rounded-[6px] border border-phosphor bg-surface px-1.5 font-mono text-[10px] text-ink",
				value: draft,
				"aria-label": "Rename campaign page",
				onChange: (e) => setDraft(e.target.value),
				onBlur: () => {
					renameCampaignPage(p.id, draft);
					setRenaming(null);
				},
				onKeyDown: (e) => {
					e.stopPropagation();
					if (e.key === "Enter") {
						renameCampaignPage(p.id, draft);
						setRenaming(null);
					}
					if (e.key === "Escape") setRenaming(null);
				}
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				role: "tab",
				"aria-selected": p.id === liveId,
				"aria-haspopup": "menu",
				"aria-expanded": menuId === p.id,
				"aria-label": `${p.name ?? shortFormat(p.formatId)} (${n + 1} of ${pages.length})`,
				title: `${p.name ?? shortFormat(p.formatId)} — drag or Alt+Left / Alt+Right to reorder`,
				tabIndex: 0,
				draggable: true,
				className: cn("h-2.5 w-2.5 cursor-grab rounded-full border transition-colors active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-1 focus-visible:ring-offset-ground", p.id === liveId ? "border-phosphor bg-phosphor ring-2 ring-phosphor ring-offset-2 ring-offset-ground shadow-[0_0_10px_rgba(63,198,255,0.55)]" : "border-ink-faint bg-transparent hover:border-phosphor hover:bg-phosphor/40", dragging === p.id && "opacity-40", overId === p.id && dragging && dragging !== p.id && "ring-2 ring-phosphor ring-offset-1 ring-offset-ground"),
				onClick: () => {
					setMenuId(null);
					onGo(p.id);
				},
				onKeyDown: (e) => {
					if (!e.altKey) return;
					if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
					e.preventDefault();
					e.stopPropagation();
					nudgeCampaignPage(p.id, e.key === "ArrowLeft" ? -1 : 1);
				},
				onDragStart: (e) => {
					setDragging(p.id);
					setMenuId(null);
					e.dataTransfer.effectAllowed = "move";
					e.dataTransfer.setData("text/plain", p.id);
				},
				onDragOver: (e) => {
					e.preventDefault();
					e.dataTransfer.dropEffect = "move";
					setOverId(p.id);
				},
				onDragLeave: () => {
					setOverId((cur) => cur === p.id ? null : cur);
				},
				onDrop: (e) => {
					e.preventDefault();
					const fromId = e.dataTransfer.getData("text/plain") || dragging;
					if (fromId) moveChip(fromId, p.id);
					setDragging(null);
					setOverId(null);
				},
				onDragEnd: () => {
					setDragging(null);
					setOverId(null);
				},
				onContextMenu: (e) => {
					e.preventDefault();
					e.stopPropagation();
					setMenuId(menuId === p.id ? null : p.id);
				}
			}), menuId === p.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "menu",
				className: "absolute left-0 top-5 z-40 min-w-36 border border-border bg-surface py-1 shadow-lg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						role: "menuitem",
						className: "block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor",
						onClick: () => {
							setRenaming(p.id);
							setDraft(p.name ?? shortFormat(p.formatId));
							setMenuId(null);
						},
						children: "Rename"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						role: "menuitem",
						className: "block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor",
						onClick: () => {
							save();
							const pageId = duplicateCampaignPage();
							setMenuId(null);
							if (pageId) onGo(pageId);
						},
						children: "Duplicate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						role: "menuitem",
						className: "block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor",
						onClick: () => {
							unlinkCampaignPage(p.id);
							setMenuId(null);
						},
						children: "Unlink"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						role: "menuitem",
						className: "block w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:bg-surface-alt hover:text-phosphor",
						onClick: () => {
							if (pages.length <= 1 && !window.confirm("Delete the last page in this set? The board will be removed.")) {
								setMenuId(null);
								return;
							}
							const next = removeCampaignPage(p.id);
							setMenuId(null);
							if (next) onGo(next);
							else {
								setPresent(false);
								navigate({ to: "/" });
							}
						},
						children: "Delete page"
					})
				]
			})]
		}, p.id))
	});
}
/** Window blur mid-scrub after keep-clear shares this helper so the current-dot name stays live. */
function applyWindowBlur(opts) {
	return {
		endScrub: opts.scrubbing,
		nameCurrentDot: true
	};
}
/** Quiet Escape after window-blur keep-clear must not revive mutedPointerUpKeep. */
function peekCaptionAfterQuietEscapeAfterKeepClear(opts) {
	return {
		...peekCaptionAfterQuietEscape({
			key: opts.key,
			shiftHeld: opts.shiftHeld,
			muted: opts.muted,
			namedId: opts.namedId
		}),
		mutedPointerUpKeep: Boolean(opts.mutedPointerUpKeep)
	};
}
/** Quiet Escape after keep-clear while Shift is held stays in present; keep stays dead. */
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld(opts) {
	const quiet = peekCaptionAfterQuietEscapeAfterKeepClear({
		key: opts.key,
		shiftHeld: true,
		muted: opts.muted,
		namedId: opts.namedId,
		mutedPointerUpKeep: false
	});
	return {
		...quiet,
		stayInPresent: opts.key === "Escape" ? true : quiet.stayInPresent,
		mutedPointerUpKeep: false
	};
}
/** Shift-release after that quiet Escape stays muted until an off-current tick is named. */
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease(opts) {
	const off = opts.offCurrentNamedId ?? null;
	if (off) return {
		muted: false,
		namedId: off,
		showCaption: true,
		captionId: off,
		mutedPointerUpKeep: false
	};
	return {
		muted: true,
		namedId: null,
		showCaption: false,
		captionId: peekCaptionNameId({
			muted: true,
			namedId: null,
			fallbackId: opts.fallbackId
		}),
		mutedPointerUpKeep: false
	};
}
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur(opts) {
	return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease(opts);
}
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel(opts) {
	return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur(opts);
}
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture(opts) {
	return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel(opts);
}
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp(opts) {
	return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture(opts);
}
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave(opts) {
	return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp(opts);
}
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut(opts) {
	return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave(opts);
}
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter(opts) {
	return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut(opts);
}
/** Document pointer-over after the muted keep-clear Shift-held path stays muted. */
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver(opts) {
	return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter(opts);
}
/** Document pointer-move after the muted keep-clear Shift-held path stays muted. */
function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerMove(opts) {
	return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver(opts);
}
var NOTES_PREF = "voice-design-present-notes";
function readNotesPref() {
	try {
		const raw = localStorage.getItem(NOTES_PREF);
		if (raw === "0") return false;
		if (raw === "1") return true;
	} catch {}
	return false;
}
function writeNotesPref(open) {
	try {
		localStorage.setItem(NOTES_PREF, open ? "1" : "0");
	} catch {}
}
function PresentView() {
	const navigate = useNavigate();
	const doc = useDesign((s) => s.doc);
	const index = useDesign((s) => s.index);
	const save = useDesign((s) => s.save);
	const setPresent = useDesign((s) => s.setPresent);
	useDesign((s) => s.setNotes);
	const [hot, setHot] = (0, import_react.useState)(null);
	const [notesOpen, setNotesOpen] = (0, import_react.useState)(readNotesPref);
	const notesRef = (0, import_react.useRef)(null);
	const rootRef = (0, import_react.useRef)(null);
	const [full, setFull] = (0, import_react.useState)(false);
	const [idle, setIdle] = (0, import_react.useState)(false);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [peekIndexHover, setPeekIndexHover] = (0, import_react.useState)(false);
	const [shiftHeld, setShiftHeld] = (0, import_react.useState)(false);
	const [peekNamedId, setPeekNamedId] = (0, import_react.useState)(null);
	const [peekMuted, setPeekMuted] = (0, import_react.useState)(false);
	const [peekTickId, setPeekTickId] = (0, import_react.useState)(null);
	(0, import_react.useRef)(null);
	const peekScrubbing = (0, import_react.useRef)(false);
	const mutedPointerUpKeep = (0, import_react.useRef)(false);
	const quietKeepClearShiftHeld = (0, import_react.useRef)(false);
	const idleTimer = (0, import_react.useRef)(null);
	useDesign((s) => s.viewport);
	const bumpIdle = (0, import_react.useCallback)(() => {
		setIdle(false);
		if (idleTimer.current) clearTimeout(idleTimer.current);
		idleTimer.current = setTimeout(() => setIdle(true), PRESENT_IDLE_MS);
	}, []);
	(0, import_react.useEffect)(() => {
		bumpIdle();
		const onActivity = (e) => {
			if (isQuietPresentPeekTarget(e.target)) return;
			bumpIdle();
		};
		const onKeyActivity = (e) => {
			if (isQuietPresentNavKey(e.key)) return;
			bumpIdle();
		};
		window.addEventListener("pointermove", onActivity);
		window.addEventListener("pointerdown", onActivity);
		window.addEventListener("keydown", onKeyActivity);
		window.addEventListener("wheel", onActivity, { passive: true });
		return () => {
			if (idleTimer.current) clearTimeout(idleTimer.current);
			window.removeEventListener("pointermove", onActivity);
			window.removeEventListener("pointerdown", onActivity);
			window.removeEventListener("keydown", onKeyActivity);
			window.removeEventListener("wheel", onActivity);
		};
	}, [bumpIdle]);
	if (!doc) return null;
	const live = doc;
	const pages = (live.campaignId ? campaignPages(index, live.campaignId) : [{
		id: live.id,
		name: live.name,
		formatId: live.artboard.formatId
	}]).map((p) => ({
		id: p.id,
		name: p.name ?? live.name,
		formatId: p.formatId ?? live.artboard.formatId
	}));
	const i = Math.max(0, pages.findIndex((p) => p.id === live.id));
	const hideChrome = shouldHidePresentChrome({
		idle,
		notesOpen,
		menuOpen
	});
	shouldShowPresentPeek({
		hideChrome,
		pageCount: pages.length
	});
	function goTo(id) {
		if (!id || id === live.id) return;
		save();
		navigate({
			to: "/studio/$id",
			params: { id }
		});
	}
	function go(delta) {
		const next = pages[i + delta];
		if (!next) return;
		save();
		navigate({
			to: "/studio/$id",
			params: { id: next.id }
		});
	}
	function toggleNotes() {
		setNotesOpen((open) => {
			const next = !open;
			writeNotesPref(next);
			if (next) requestAnimationFrame(() => notesRef.current?.focus());
			else notesRef.current?.blur();
			return next;
		});
	}
	function applyLostCapture() {
		if (!peekScrubbing.current) return;
		peekScrubbing.current = false;
		const prevTick = peekTickId;
		const lost = peekAfterLostCapture({
			muted: peekMuted,
			namedId: peekNamedId,
			tickId: peekTickId,
			landedId: live.id
		});
		setPeekMuted(lost.muted);
		setPeekNamedId(lost.namedId);
		setPeekTickId(lost.tickId);
		peekTickFadeShouldRestartAfterLostCapture(prevTick, lost.tickId);
		applyWindowBlur({ scrubbing: true });
	}
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const typing = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
			if (e.key === "Escape") {
				e.preventDefault();
				if (notesOpen) {
					toggleNotes();
					return;
				}
				const quiet = shiftHeld ? peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld({
					key: e.key,
					muted: peekMuted,
					namedId: peekNamedId,
					mutedPointerUpKeep: mutedPointerUpKeep.current
				}) : peekCaptionAfterQuietEscapeAfterKeepClear({
					key: e.key,
					shiftHeld,
					muted: peekMuted,
					namedId: peekNamedId,
					mutedPointerUpKeep: mutedPointerUpKeep.current
				});
				quietKeepClearShiftHeld.current = shiftHeld && e.key === "Escape";
				mutedPointerUpKeep.current = quiet.mutedPointerUpKeep;
				setPeekNamedId(quiet.namedId);
				setPeekMuted(quiet.muted);
				if (quiet.stayInPresent) return;
				exitPresentFullscreen();
				setPresent(false);
				return;
			}
			if (e.key === "Shift") {
				setShiftHeld(true);
				return;
			}
			if (typing) return;
			if (e.key === "Home") {
				e.preventDefault();
				const cap = peekCaptionAfterQuietHomeEnd({
					namedId: peekNamedId,
					key: "Home",
					shiftHeld,
					muted: peekMuted
				});
				setPeekNamedId(cap.namedId);
				setPeekMuted(cap.muted);
				setPeekTickId(peekTickAfterQuietHomeEnd({
					tickId: peekTickId,
					key: "Home",
					muted: peekMuted || cap.muted
				}));
				if (pages[0]) goTo(pages[0].id);
				return;
			}
			if (e.key === "End") {
				e.preventDefault();
				const cap = peekCaptionAfterQuietHomeEnd({
					namedId: peekNamedId,
					key: "End",
					shiftHeld,
					muted: peekMuted
				});
				setPeekNamedId(cap.namedId);
				setPeekMuted(cap.muted);
				setPeekTickId(peekTickAfterQuietHomeEnd({
					tickId: peekTickId,
					key: "End",
					muted: peekMuted || cap.muted
				}));
				const last = pages[pages.length - 1];
				if (last) goTo(last.id);
				return;
			}
			if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
				e.preventDefault();
				bumpIdle();
				togglePresentFullscreen(rootRef.current).then(() => setFull(presentRootIsFullscreen(rootRef.current)));
				return;
			}
			if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
				e.preventDefault();
				go(1);
			}
			if (e.key === "ArrowLeft" || e.key === "PageUp") {
				e.preventDefault();
				go(-1);
			}
			if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
				e.preventDefault();
				toggleNotes();
			}
		};
		const applyMutedKeepClearRelease = (helper) => {
			const next = helper({
				muted: peekMuted,
				namedId: peekNamedId,
				fallbackId: pages[i + 1]?.id ?? null
			});
			mutedPointerUpKeep.current = next.mutedPointerUpKeep;
			setPeekNamedId(next.namedId);
			setPeekMuted(next.muted);
		};
		const applyShiftRelease = () => {
			applyLostCapture();
			setShiftHeld(false);
			if (quietKeepClearShiftHeld.current) {
				applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease);
				return;
			}
			const next = peekCaptionAfterShiftRelease({
				shiftHeld: false,
				scrubbing: peekScrubbing.current,
				namedId: peekNamedId,
				muted: peekMuted
			});
			setPeekNamedId(next.namedId);
			setPeekMuted(next.muted);
		};
		const applyQuietKeepClearWindowBlur = () => {
			applyLostCapture();
			setShiftHeld(false);
			if (quietKeepClearShiftHeld.current) {
				applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur);
				return;
			}
			applyShiftRelease();
		};
		const applyQuietKeepClearPointerCancel = () => {
			applyLostCapture();
			if (quietKeepClearShiftHeld.current) applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel);
		};
		const applyQuietKeepClearLostPointerCapture = () => {
			applyQuietKeepClearPointerCancel();
			if (quietKeepClearShiftHeld.current) applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture);
		};
		const applyQuietKeepClearPointerUp = () => {
			applyQuietKeepClearLostPointerCapture();
			if (quietKeepClearShiftHeld.current) applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp);
		};
		const applyQuietKeepClearPointerLeave = () => {
			applyQuietKeepClearPointerUp();
			if (quietKeepClearShiftHeld.current) applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave);
		};
		const applyQuietKeepClearPointerOut = () => {
			applyQuietKeepClearPointerLeave();
			if (quietKeepClearShiftHeld.current) applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut);
		};
		const applyQuietKeepClearPointerEnter = () => {
			applyQuietKeepClearPointerOut();
			if (quietKeepClearShiftHeld.current) applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter);
		};
		const applyQuietKeepClearPointerOver = () => {
			applyQuietKeepClearPointerEnter();
			if (quietKeepClearShiftHeld.current) applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver);
		};
		const applyQuietKeepClearPointerMove = () => {
			applyQuietKeepClearPointerOver();
			if (quietKeepClearShiftHeld.current) applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerMove);
		};
		const onPointerUp = () => {
			applyQuietKeepClearPointerUp();
		};
		const onPointerCancel = () => {
			applyQuietKeepClearPointerCancel();
		};
		const onPointerLeave = () => {
			applyQuietKeepClearPointerLeave();
		};
		const onPointerOut = () => {
			applyQuietKeepClearPointerOut();
		};
		const onPointerEnter = () => {
			applyQuietKeepClearPointerEnter();
		};
		const onPointerOver = () => {
			applyQuietKeepClearPointerOver();
		};
		const onPointerMove = () => {
			applyQuietKeepClearPointerMove();
		};
		const onKeyUp = (e) => {
			if (e.key === "Shift") applyShiftRelease();
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("blur", applyQuietKeepClearWindowBlur);
		window.addEventListener("pointerup", onPointerUp);
		window.addEventListener("pointercancel", onPointerCancel);
		window.addEventListener("lostpointercapture", applyQuietKeepClearLostPointerCapture);
		document.addEventListener("pointerleave", onPointerLeave);
		document.addEventListener("pointerout", onPointerOut);
		document.addEventListener("pointerenter", onPointerEnter);
		document.addEventListener("pointerover", onPointerOver);
		document.addEventListener("pointermove", onPointerMove);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("blur", applyQuietKeepClearWindowBlur);
			window.removeEventListener("pointerup", onPointerUp);
			window.removeEventListener("pointercancel", onPointerCancel);
			window.removeEventListener("lostpointercapture", applyQuietKeepClearLostPointerCapture);
			document.removeEventListener("pointerleave", onPointerLeave);
			document.removeEventListener("pointerout", onPointerOut);
			document.removeEventListener("pointerenter", onPointerEnter);
			document.removeEventListener("pointerover", onPointerOver);
			document.removeEventListener("pointermove", onPointerMove);
		};
	});
	(0, import_react.useEffect)(() => {
		const sync = () => setFull(presentRootIsFullscreen(rootRef.current));
		document.addEventListener("fullscreenchange", sync);
		return () => document.removeEventListener("fullscreenchange", sync);
	}, []);
	(0, import_react.useEffect)(() => () => void exitPresentFullscreen(), []);
	peekCaptionNameId({
		muted: peekMuted,
		namedId: peekNamedId,
		fallbackId: pages[i + 1]?.id ?? null
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: "relative flex min-h-0 flex-1 flex-col bg-ground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("flex h-12 shrink-0 items-center gap-3 border-b border-border px-3 transition-opacity duration-500", hideChrome ? "pointer-events-none opacity-0" : "opacity-100"),
			"aria-hidden": hideChrome,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					onClick: () => {
						exitPresentFullscreen();
						setPresent(false);
					},
					children: "Exit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate text-sm text-ink",
					children: doc.name
				}),
				pages.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-[10px] text-ink-faint",
					children: [
						i + 1,
						" / ",
						pages.length
					]
				}),
				live.campaignId && pages.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[10px] tracking-wide text-phosphor",
					"data-campaign-readout": true,
					"aria-label": "Campaign readout",
					children: campaignReadoutFromSizes(pages.map((page) => {
						const meta = index.find((p) => p.id === page.id);
						return {
							width: page.id === live.id ? live.artboard.width : meta?.width ?? live.artboard.width,
							height: page.id === live.id ? live.artboard.height : meta?.height ?? live.artboard.height
						};
					})).label
				}),
				pages.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-2 flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							disabled: i <= 0,
							onClick: () => go(-1),
							children: "Prev"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PresentChipRail, {
							pages,
							liveId: live.id,
							onGo: goTo,
							onMenuOpenChange: setMenuOpen
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							disabled: i >= pages.length - 1,
							onClick: () => go(1),
							children: "Next"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: cn("ml-auto font-mono text-[10px] uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-ground", full ? "text-phosphor" : "text-ink-faint hover:text-ink"),
					onClick: () => {
						togglePresentFullscreen(rootRef.current).then(() => setFull(presentRootIsFullscreen(rootRef.current)));
					},
					"aria-pressed": full,
					"aria-label": full ? "Exit fullscreen" : "Enter fullscreen",
					title: "Fullscreen present (F) — campaign rail stays",
					children: [
						"Full ",
						full ? "on" : "off",
						" · F"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: cn("font-mono text-[10px] uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-ground", notesOpen ? "text-phosphor" : "text-ink-faint hover:text-ink-dim"),
					onClick: toggleNotes,
					"aria-pressed": notesOpen,
					"aria-label": notesOpen ? "Hide speaker notes" : "Show speaker notes",
					title: "Toggle speaker notes (N)",
					children: [
						"Notes ",
						notesOpen ? "on" : "off",
						" · N"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("font-mono text-[10px] uppercase", hot ? "text-phosphor" : "text-ink-faint"),
					children: hot ? hot.label : "Click or →"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative min-h-0 flex-1",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CanvasStage, {})
		})]
	});
}
function StudioApp({ id }) {
	const navigate = useNavigate();
	const open = useDesign((s) => s.open);
	const doc = useDesign((s) => s.doc);
	const selection = useDesign((s) => s.selection);
	const brand = useDesign((s) => s.brand);
	const color = useDesign((s) => s.color);
	const save = useDesign((s) => s.save);
	const present = useDesign((s) => s.present);
	const paletteOpen = useDesign((s) => s.paletteOpen);
	const setPaletteOpen = useDesign((s) => s.setPaletteOpen);
	const [sheet, setSheet] = (0, import_react.useState)(null);
	useShortcuts();
	(0, import_react.useEffect)(() => {
		watchFontsForWrapCache();
	}, []);
	(0, import_react.useEffect)(() => {
		open(id);
		if (!useDesign.getState().doc) navigate({ to: "/" });
	}, [
		id,
		open,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		const t = window.setInterval(() => {
			if (useDesign.getState().dirty) useDesign.getState().save();
		}, 8e3);
		return () => window.clearTimeout(t);
	}, []);
	(0, import_react.useEffect)(() => {
		const onLeave = () => {
			if (useDesign.getState().dirty) save();
		};
		window.addEventListener("beforeunload", onLeave);
		return () => window.removeEventListener("beforeunload", onLeave);
	}, [save]);
	const commands = (0, import_react.useMemo)(() => {
		const s = () => useDesign.getState();
		return [
			{
				id: "save",
				label: "Save",
				group: "File",
				hint: "Cmd+S",
				run: () => s().save()
			},
			{
				id: "undo",
				label: "Undo",
				group: "Edit",
				hint: "Cmd+Z",
				run: () => s().undo()
			},
			{
				id: "duplicate",
				label: "Duplicate selection",
				group: "Edit",
				hint: "Cmd+D",
				run: () => s().duplicateSelected()
			},
			{
				id: "copy",
				label: "Copy selection",
				group: "Edit",
				hint: "Cmd+C",
				run: () => s().copySelected()
			},
			{
				id: "cut",
				label: "Cut selection",
				group: "Edit",
				hint: "Cmd+X",
				run: () => s().cutSelected()
			},
			{
				id: "paste",
				label: "Paste",
				group: "Edit",
				hint: "Cmd+V",
				run: () => s().pasteClipboard()
			},
			{
				id: "copy-opacity",
				label: "Copy opacity",
				group: "Edit",
				hint: "Cmd+Shift+C",
				run: () => s().copyOpacity()
			},
			{
				id: "paste-opacity",
				label: "Paste opacity",
				group: "Edit",
				hint: "Cmd+Shift+V",
				run: () => s().pasteOpacity()
			},
			{
				id: "fit",
				label: "Fit artboard",
				group: "View",
				hint: "0",
				run: () => s().requestFit()
			},
			{
				id: "present",
				label: "Present artboard",
				group: "View",
				hint: "Shift+P",
				run: () => s().togglePresent()
			},
			{
				id: "present-full",
				label: "Fullscreen present (keep campaign rail)",
				group: "View",
				hint: "F in present",
				run: () => {
					s().setPresent(true);
				}
			},
			{
				id: "safe-area",
				label: "Show / hide safe area",
				group: "View",
				run: () => s().toggleSafeArea()
			},
			{
				id: "print-marks",
				label: "Show / hide print marks",
				group: "Print",
				run: () => s().togglePrintMarks()
			},
			{
				id: "select",
				label: "Select tool",
				group: "Tools",
				hint: "V",
				run: () => s().setTool("select")
			},
			{
				id: "pen",
				label: "Pen",
				group: "Tools",
				hint: "P",
				run: () => s().setTool("pen")
			},
			{
				id: "knife",
				label: "Knife — cut a path segment",
				group: "Tools",
				hint: "K",
				run: () => s().setTool("knife")
			},
			{
				id: "polygon",
				label: "Polygon",
				group: "Tools",
				hint: "G",
				run: () => s().setTool("polygon")
			},
			{
				id: "star",
				label: "Star",
				group: "Tools",
				hint: "S",
				run: () => s().setTool("star")
			},
			{
				id: "arrow",
				label: "Arrow",
				group: "Tools",
				hint: "A",
				run: () => s().setTool("arrow")
			},
			{
				id: "image",
				label: "Image",
				group: "Tools",
				hint: "M",
				run: () => s().setTool("image")
			},
			{
				id: "type-to-path",
				label: "Convert type to path",
				group: "Path",
				run: () => convertSelectedTextToPath()
			},
			{
				id: "shape-to-path",
				label: "Convert shape to path",
				group: "Path",
				run: () => convertSelectedShapeToPath()
			},
			{
				id: "outline",
				label: "Outline stroke",
				group: "Path",
				run: () => outlineSelectedStroke()
			},
			{
				id: "offset-out",
				label: "Offset path out",
				group: "Path",
				run: () => offsetSelectedPath("out")
			},
			{
				id: "offset-in",
				label: "Offset path in",
				group: "Path",
				run: () => offsetSelectedPath("in")
			},
			{
				id: "round-corners",
				label: "Round path corners",
				group: "Path",
				run: () => roundSelectedPathCorners()
			},
			{
				id: "simplify",
				label: "Simplify path",
				group: "Path",
				run: () => simplifySelectedPath()
			},
			{
				id: "home",
				label: "Back to templates",
				group: "File",
				run: () => void navigate({ to: "/" })
			},
			{
				id: "bleed-none",
				label: "Bleed none",
				group: "Print",
				run: () => s().setBleed(0)
			},
			{
				id: "bleed-3mm",
				label: "Bleed 3 mm",
				group: "Print",
				run: () => s().setBleed(bleedMmToPx(3))
			},
			{
				id: "bleed-6mm",
				label: "Bleed 6 mm",
				group: "Print",
				run: () => s().setBleed(bleedMmToPx(6))
			},
			{
				id: "reset-guide-colors",
				label: "Reset guide colors",
				group: "Print",
				run: () => s().resetGuideColors?.()
			},
			{
				id: "reset-guide-dashes",
				label: "Reset guide dashes",
				group: "Print",
				run: () => s().resetGuideDashes?.()
			},
			{
				id: "clear-guide-names",
				label: "Clear guide names",
				group: "Print",
				run: () => s().clearGuideLabels?.()
			}
		];
	}, [navigate]);
	const selectedNodes = (doc?.nodes ?? []).filter((n) => selection.includes(n.id));
	const selectedText = selectedNodes.filter((n) => n.kind === "text");
	if (!doc) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-1 items-center justify-center text-ink-dim",
		children: "Loading artboard"
	});
	if (present) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PresentView, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col bg-ground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignStrip, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col md:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolRail, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-h-0 min-w-0 flex-1 flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative min-h-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CanvasStage, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RulerLayer, {})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaintDock, {})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "hidden w-[280px] shrink-0 flex-col border-l border-border bg-surface md:flex",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "min-h-0 flex-1 overflow-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayersPanel, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-h-0 flex-1 overflow-auto",
								children: [selectedNodes.length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedInk, {
										nodes: selectedNodes,
										brandColors: brand.colors,
										ink: color
									}), selectedText.length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedType, { nodes: selectedText })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AiPanel, {})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioStatusStrip, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex shrink-0 border-t border-border md:hidden",
				children: [
					"layers",
					"inspect",
					"ai"
				].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setSheet(sheet === tab ? null : tab),
					className: cn("h-12 flex-1 text-xs font-medium capitalize", sheet === tab ? "text-phosphor" : "text-ink-dim"),
					children: tab === "ai" ? "Director" : tab === "inspect" ? "Inspect" : "Layers"
				}, tab))
			}),
			sheet && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-40 md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute inset-0 bg-ground/70",
					"aria-label": "Close sheet",
					onClick: () => setSheet(null)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 bottom-0 flex max-h-[75vh] flex-col rounded-t-[20px] border-t border-border bg-surface",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-12 shrink-0 items-center justify-between border-b border-border px-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-[10px] tracking-[0.2em] text-phosphor uppercase",
							children: sheet === "ai" ? "Director" : sheet === "inspect" ? "Inspect" : "Layers"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-xs text-ink-dim",
							onClick: () => setSheet(null),
							children: "Close"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-h-0 flex-1 overflow-auto",
						children: [
							sheet === "layers" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayersPanel, {}),
							sheet === "inspect" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [selectedNodes.length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedInk, {
									nodes: selectedNodes,
									brandColors: brand.colors,
									ink: color
								}), selectedText.length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixedType, { nodes: selectedText })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {})] }),
							sheet === "ai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AiPanel, {})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandPalette, {
				open: paletteOpen,
				onClose: () => setPaletteOpen(false),
				commands
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, { theme: "dark" })
		]
	});
}
function StudioPage() {
	const { id } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioApp, { id }) });
}
//#endregion
export { StudioPage as component };
