import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { c as string, i as boolean, n as _enum, o as number, r as array, s as object, t as number$1 } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/design-DKO_35ww.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
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
var layoutNodeSchema = object({
	kind: _enum([
		"rect",
		"ellipse",
		"text",
		"star",
		"polygon",
		"line",
		"arrow"
	]),
	name: string().max(80).optional(),
	x: number$1(),
	y: number$1(),
	w: number$1().positive().max(8e3),
	h: number$1().positive().max(8e3),
	rotation: number$1().optional(),
	fill: string().optional(),
	stroke: string().optional(),
	strokeWidth: number$1().optional(),
	text: string().max(400).optional(),
	fontFamily: string().optional(),
	fontWeight: number$1().optional(),
	fontSize: number$1().optional(),
	align: _enum([
		"left",
		"center",
		"right"
	]).optional(),
	uppercase: boolean().optional(),
	letterSpacing: number$1().optional(),
	lineHeight: number$1().optional(),
	opacity: number$1().min(0).max(1).optional(),
	radius: number$1().optional()
});
var layoutNodesSchema = array(layoutNodeSchema).min(1).max(16);
function toMagic(n) {
	return {
		kind: n.kind,
		x: n.x,
		y: n.y,
		w: n.w,
		h: n.h,
		name: n.name,
		fill: n.fill,
		stroke: n.stroke,
		strokeWidth: n.strokeWidth,
		text: n.text,
		fontFamily: n.fontFamily,
		fontWeight: n.fontWeight,
		fontSize: n.fontSize,
		align: n.align,
		uppercase: n.uppercase,
		letterSpacing: n.letterSpacing,
		lineHeight: n.lineHeight,
		opacity: n.opacity,
		radius: n.radius,
		rotation: n.rotation
	};
}
var magicLayout_createServerFn_handler = createServerRpc({
	id: "45a6ea9767f4ef6ceebe05cab50395b5d12e42954555957f4bd81e77a4326654",
	name: "magicLayout",
	filename: "src/lib/ai/design.ts"
}, (opts) => magicLayout.__executeServer(opts));
var magicLayout = createServerFn({ method: "POST" }).validator((input) => layoutSchema.parse(input)).handler(magicLayout_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available in this environment"
	};
	const colors = (data.brandColors ?? [
		"#0a0d0c",
		"#d9f5e3",
		"#3fc6ff"
	]).join(", ");
	const display = data.displayFont ?? "Chakra Petch";
	const body = data.bodyFont ?? "Outfit";
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 1200,
			messages: [{
				role: "system",
				content: `You are an art director. Return ONLY a JSON array of 6-12 design nodes. Schema per node: {kind: rect|ellipse|text|star|polygon|line|arrow, name, x, y, w, h, rotation, fill (hex), stroke, strokeWidth, text?, fontFamily (${display}|${body}|Syne|Fraunces|Bebas Neue|Share Tech Mono), fontWeight, fontSize, align (left|center|right), uppercase?, letterSpacing?, lineHeight?, opacity?, radius?}. Coordinates fit the given artboard. Prefer ${display} for headlines and ${body} for supporting copy. No markdown.`
			}, {
				role: "user",
				content: `Artboard ${data.width}×${data.height}. Brand colors: ${colors}. Design: ${data.prompt}`
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI API error ${res.status}`
	};
	const raw = (await res.json()).choices[0]?.message.content ?? "[]";
	const jsonStart = raw.indexOf("[");
	const jsonEnd = raw.lastIndexOf("]");
	if (jsonStart < 0 || jsonEnd < 0) return {
		ok: false,
		error: "Could not parse layout"
	};
	try {
		const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
		return {
			ok: true,
			nodes: layoutNodesSchema.parse(parsed).map(toMagic)
		};
	} catch {
		return {
			ok: false,
			error: "Layout did not match schema"
		};
	}
});
var rewriteCopy_createServerFn_handler = createServerRpc({
	id: "ddbfcc430d4343e9a8e4d2bfb9e25397852f38157b77428bbd6b4a36ed2a0fcf",
	name: "rewriteCopy",
	filename: "src/lib/ai/design.ts"
}, (opts) => rewriteCopy.__executeServer(opts));
var rewriteCopy = createServerFn({ method: "POST" }).validator((input) => object({
	text: string().max(500),
	tone: string().max(40)
}).parse(input)).handler(rewriteCopy_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available"
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 200,
			messages: [{
				role: "system",
				content: "Rewrite the copy for a graphic design. Keep it short. Return only the rewritten text, no quotes."
			}, {
				role: "user",
				content: `Tone: ${data.tone}. Copy:\n${data.text}`
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI API error ${res.status}`
	};
	return {
		ok: true,
		text: ((await res.json()).choices[0]?.message.content ?? "").trim()
	};
});
var generateFill_createServerFn_handler = createServerRpc({
	id: "7f7bb9aeda8dcf652f0e72d5daddb75ef12fa13df6fff1f12f550cc0434f60eb",
	name: "generateFill",
	filename: "src/lib/ai/design.ts"
}, (opts) => generateFill.__executeServer(opts));
var generateFill = createServerFn({ method: "POST" }).validator((input) => object({ prompt: string().min(3).max(300) }).parse(input)).handler(generateFill_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available"
	};
	const res = await fetch("https://api.x.ai/v1/images/generations", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-imagine-image",
			prompt: data.prompt,
			n: 1,
			resolution: "1k",
			response_format: "url"
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI API error ${res.status}`
	};
	const url = (await res.json()).data?.[0]?.url;
	if (!url) return {
		ok: false,
		error: "No image returned"
	};
	return {
		ok: true,
		url
	};
});
//#endregion
export { generateFill_createServerFn_handler, magicLayout_createServerFn_handler, rewriteCopy_createServerFn_handler };
