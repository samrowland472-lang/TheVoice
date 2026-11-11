import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as useNavigate, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as fitViewport, H as instantiateTemplate, Lt as useDesign, V as imageNode, c as TEMPLATE_CATEGORIES, k as drawDocument, n as CANVAS_FONTS, o as FORMATS, s as TEMPLATES } from "./render-Dkgk1Dgz.mjs";
import { B as Copy, M as FolderPlus, a as Trash2, g as Pin, h as Plus, l as Search } from "../_libs/lucide-react.mjs";
import { i as cn, n as Button, r as CommandPalette, t as AppShell } from "./command-palette-B9n8NFIu.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Cf6A3Xxi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Sample a bitmap and return the strongest distinct hex colours. */
function toHex(r, g, b) {
	return `#${[
		r,
		g,
		b
	].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
function dist(a, b) {
	const dr = a[0] - b[0];
	const dg = a[1] - b[1];
	const db = a[2] - b[2];
	return Math.sqrt(dr * dr + dg * dg + db * db);
}
function paletteName(hex, i) {
	const h = hex.replace("#", "");
	const r = Number.parseInt(h.slice(0, 2), 16) / 255;
	const g = Number.parseInt(h.slice(2, 4), 16) / 255;
	const b = Number.parseInt(h.slice(4, 6), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if ((max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))) < .12) return l < .2 ? "Ink" : l > .8 ? "Paper" : "Stone";
	let hue = 0;
	const d = max - min;
	if (max === r) hue = (g - b) / d % 6;
	else if (max === g) hue = (b - r) / d + 2;
	else hue = (r - g) / d + 4;
	hue = (hue * 60 + 360) % 360;
	const label = [
		[15, "Red"],
		[45, "Amber"],
		[75, "Gold"],
		[150, "Moss"],
		[190, "Teal"],
		[230, "Cyan"],
		[270, "Blue"],
		[310, "Violet"],
		[345, "Magenta"],
		[360, "Red"]
	].find(([deg]) => hue <= deg)?.[1] ?? `Swatch ${i + 1}`;
	return l < .35 ? `Deep ${label}` : l > .7 ? `Pale ${label}` : label;
}
function paletteFromImageData(data, count = 6) {
	const buckets = /* @__PURE__ */ new Map();
	for (let i = 0; i < data.length; i += 16) {
		if ((data[i + 3] ?? 0) < 80) continue;
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
		} else buckets.set(key, {
			n: 1,
			r,
			g,
			b
		});
	}
	const ranked = [...buckets.values()].map((c) => ({
		n: c.n,
		rgb: [
			Math.round(c.r / c.n),
			Math.round(c.g / c.n),
			Math.round(c.b / c.n)
		]
	})).sort((a, b) => b.n - a.n);
	const picked = [];
	for (const c of ranked) {
		if (picked.some((p) => dist(p, c.rgb) < 42)) continue;
		picked.push(c.rgb);
		if (picked.length >= count) break;
	}
	return picked.map(([r, g, b]) => toHex(r, g, b));
}
function paletteFromSrc(src, count = 6) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			const w = 64;
			const h = Math.max(1, Math.round(img.height / img.width * w));
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
		img.onerror = () => reject(/* @__PURE__ */ new Error("Could not read image"));
		img.src = src;
	});
}
function TemplateThumb({ template, className }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const doc = instantiateTemplate(template.id);
		const parent = canvas.parentElement;
		const w = parent?.clientWidth || 240;
		const h = parent?.clientHeight || 240;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const vp = fitViewport(doc.artboard.width, doc.artboard.height, w, h, 8);
		drawDocument(ctx, doc, {
			dpr,
			skipChrome: true,
			viewport: vp
		});
	}, [template.id]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		className,
		"aria-hidden": true
	});
}
var PRESET_TAGS = [
	"Campaign",
	"Draft",
	"Press"
];
function HubView() {
	const navigate = useNavigate();
	const hydrate = useDesign((s) => s.hydrate);
	const index = useDesign((s) => s.index);
	const fromTemplate = useDesign((s) => s.fromTemplate);
	const fromBlank = useDesign((s) => s.fromBlank);
	const remove = useDesign((s) => s.remove);
	const brand = useDesign((s) => s.brand);
	const setBrand = useDesign((s) => s.setBrand);
	const duplicateProject = useDesign((s) => s.duplicateProject);
	const togglePin = useDesign((s) => s.togglePin);
	const setProjectFolder = useDesign((s) => s.setProjectFolder);
	const toggleProjectTag = useDesign((s) => s.toggleProjectTag);
	const paletteOpen = useDesign((s) => s.paletteOpen);
	const setPaletteOpen = useDesign((s) => s.setPaletteOpen);
	const [cat, setCat] = (0, import_react.useState)("All");
	const [formatId, setFormatId] = (0, import_react.useState)("ig-post");
	const [newColor, setNewColor] = (0, import_react.useState)("#3fc6ff");
	const [q, setQ] = (0, import_react.useState)("");
	const [folder, setFolder] = (0, import_react.useState)("all");
	const [tag, setTag] = (0, import_react.useState)("all");
	const [campaignFilter, setCampaignFilter] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setPaletteOpen(!useDesign.getState().paletteOpen);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [setPaletteOpen]);
	const templates = (0, import_react.useMemo)(() => {
		const s = q.trim().toLowerCase();
		return TEMPLATES.filter((t) => (cat === "All" || t.category === cat) && (!s || `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(s)));
	}, [cat, q]);
	const campaignCounts = (0, import_react.useMemo)(() => {
		const m = /* @__PURE__ */ new Map();
		for (const p of index) {
			if (!p.campaignId) continue;
			m.set(p.campaignId, (m.get(p.campaignId) ?? 0) + 1);
		}
		return m;
	}, [index]);
	function openTemplate(id) {
		const docId = fromTemplate(id);
		navigate({
			to: "/studio/$id",
			params: { id: docId }
		});
	}
	function openBlank() {
		const docId = fromBlank(formatId);
		navigate({
			to: "/studio/$id",
			params: { id: docId }
		});
	}
	function openProject(id) {
		navigate({
			to: "/studio/$id",
			params: { id }
		});
	}
	const commands = (0, import_react.useMemo)(() => {
		return [
			{
				id: "blank",
				label: `New ${FORMATS.find((f) => f.id === formatId)?.label ?? "artboard"}`,
				group: "Create",
				hint: "N",
				run: openBlank
			},
			...TEMPLATES.map((t) => ({
				id: `t-${t.id}`,
				label: t.name,
				group: t.category,
				hint: t.formatId,
				run: () => openTemplate(t.id)
			})),
			...index.slice(0, 12).map((p) => ({
				id: `p-${p.id}`,
				label: p.name,
				group: "Recent",
				run: () => openProject(p.id)
			}))
		];
	}, [formatId, index]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-0 flex-1 overflow-auto scrollbar-thin",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-border px-5 py-6 md:px-10 md:py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] tracking-[0.28em] text-phosphor uppercase",
						children: "The Voice · Design"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink md:text-6xl",
						children: "Artboard. Paint. Press."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-xl text-base leading-relaxed text-ink-dim",
						children: "Layouts with type, layers, and a real brush engine — posters, covers, stories, and marks that hold a room. Stay in the loop: ⌘K for anything, drop an image, export at 3×."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-wrap items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: formatId,
								onChange: (e) => setFormatId(e.target.value),
								className: "h-10 rounded-[12px] border border-border bg-surface-alt px-3 text-sm text-ink",
								"aria-label": "Artboard size",
								children: FORMATS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: f.id,
									children: [
										f.label,
										" · ",
										f.width,
										"×",
										f.height
									]
								}, f.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "primary",
								onClick: openBlank,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "New artboard"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => setPaletteOpen(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4" }), "Command"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "relative mt-6 block max-w-md",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: q,
							onChange: (e) => setQ(e.target.value),
							placeholder: "Search templates",
							className: "h-11 w-full rounded-[12px] border border-border bg-surface-alt pr-3 pl-10 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-phosphor"
						})]
					})
				]
			}),
			index.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "border-b border-border px-5 py-8 md:px-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium tracking-[0.16em] text-ink-dim uppercase",
							children: "Recent"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-1",
							children: [[
								"all",
								"unfiled",
								...[...new Set(index.map((p) => p.folder).filter(Boolean))]
							].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setFolder(id),
								className: cn("h-8 rounded-[999px] px-3 text-[11px] font-medium capitalize", folder === id ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink"),
								children: id === "all" ? "All" : id === "unfiled" ? "Unfiled" : id
							}, id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex h-8 items-center gap-1 rounded-[999px] px-3 text-[11px] text-ink-dim hover:bg-surface-alt hover:text-ink",
								onClick: () => {
									const name = window.prompt("Folder name");
									if (name?.trim()) setFolder(name.trim());
								},
								"aria-label": "New folder",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "size-3.5" }), "Folder"]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-1",
						children: [["all", ...PRESET_TAGS].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTag(id),
							className: cn("h-7 rounded-[8px] px-2 font-mono text-[10px] uppercase tracking-wide", tag === id ? "border border-phosphor text-phosphor" : "text-ink-faint hover:text-ink"),
							children: id === "all" ? "Any tag" : id
						}, id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setCampaignFilter((c) => c ? null : "__any__"),
							className: cn("h-7 rounded-[8px] px-2 font-mono text-[10px] uppercase tracking-wide", campaignFilter ? "border border-phosphor text-phosphor" : "text-ink-faint hover:text-ink"),
							children: "Sets"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5",
						children: index.filter((p) => {
							if (folder === "unfiled") return !p.folder;
							if (folder !== "all") return p.folder === folder;
							return true;
						}).filter((p) => tag === "all" || (p.tags ?? []).includes(tag)).filter((p) => {
							if (!campaignFilter) return true;
							if (campaignFilter === "__any__") return Boolean(p.campaignId);
							return p.campaignId === campaignFilter;
						}).slice(0, 12).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "group relative",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => openProject(p.id),
									className: cn("block w-full overflow-hidden rounded-[16px] border bg-surface text-left transition-colors hover:border-phosphor", p.pinned ? "border-phosphor/50" : "border-border"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "aspect-[4/5] bg-surface-alt",
										children: p.thumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: p.thumbnail,
											alt: "",
											className: "size-full object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex size-full items-center justify-center font-mono text-xs text-ink-faint",
											children: [
												p.width,
												"×",
												p.height
											]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "px-3 py-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1",
												children: [p.pinned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "size-3 shrink-0 fill-phosphor text-phosphor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "truncate text-sm text-ink",
													children: p.name
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "font-mono text-[10px] text-ink-faint uppercase",
												children: [p.folder ? `${p.folder} · ` : "", p.formatId]
											}),
											(p.tags ?? []).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-1 flex flex-wrap gap-1",
												children: p.tags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-[9px] tracking-wide text-phosphor uppercase",
													children: t
												}, t))
											})
										]
									})]
								}),
								p.campaignId && (campaignCounts.get(p.campaignId) ?? 0) > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "absolute top-2 left-2 rounded-[6px] border border-phosphor/40 bg-ground/85 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-phosphor uppercase",
									onClick: () => setCampaignFilter(p.campaignId ?? null),
									"aria-label": `Show ${campaignCounts.get(p.campaignId)}-board set`,
									children: ["Set · ", campaignCounts.get(p.campaignId)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute top-2 right-2 hidden gap-1 group-hover:flex",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: cn("flex size-8 items-center justify-center rounded-[8px] border border-border bg-ground/80", p.pinned ? "text-phosphor" : "text-ink-dim hover:text-ink"),
											onClick: () => togglePin(p.id),
											"aria-label": p.pinned ? `Unpin ${p.name}` : `Pin ${p.name}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: cn("size-3.5", p.pinned && "fill-phosphor") })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "flex size-8 items-center justify-center rounded-[8px] border border-border bg-ground/80 text-ink-dim hover:text-ink",
											onClick: () => duplicateProject(p.id),
											"aria-label": `Duplicate ${p.name}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "flex size-8 items-center justify-center rounded-[8px] border border-border bg-ground/80 text-ink-dim hover:text-alert",
											onClick: () => remove(p.id),
											"aria-label": `Delete ${p.name}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute bottom-12 left-2 right-2 hidden group-hover:block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "h-7 w-full rounded-[8px] border border-border bg-ground/90 px-2 text-[10px] text-ink",
										value: p.folder ?? "",
										"aria-label": `Folder for ${p.name}`,
										onClick: (e) => e.stopPropagation(),
										onChange: (e) => {
											const v = e.target.value;
											if (v === "__new") {
												const name = window.prompt("Folder name");
												if (name?.trim()) setProjectFolder(p.id, name.trim());
											} else setProjectFolder(p.id, v);
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "Unfiled"
											}),
											[...new Set(index.map((x) => x.folder).filter(Boolean))].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: f,
												children: f
											}, f)),
											folder !== "all" && folder !== "unfiled" && !index.some((x) => x.folder === folder) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: folder,
												children: folder
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "__new",
												children: "New folder…"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 flex flex-wrap gap-1",
										children: PRESET_TAGS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: cn("h-6 rounded-[6px] px-1.5 font-mono text-[9px] uppercase", (p.tags ?? []).includes(t) ? "bg-phosphor/15 text-phosphor" : "bg-ground/80 text-ink-faint"),
											onClick: () => toggleProjectTag(p.id, t),
											children: t
										}, t))
									})]
								})
							]
						}, p.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "brand",
				className: "border-b border-border px-5 py-8 md:px-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium tracking-[0.16em] text-ink-dim uppercase",
						children: "Brand kit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-ink-dim",
						children: "Named colours and a display/body pairing. New type uses the display face; inspector can switch to body."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap items-end gap-3",
						children: [
							brand.colors.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex w-16 flex-col items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "size-10 rounded-full border border-border",
									style: { background: c.hex },
									"aria-label": `Remove ${c.name}`,
									onClick: () => setBrand({
										...brand,
										colors: brand.colors.filter((x) => x.hex !== c.hex)
									}),
									title: "Remove"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "w-full bg-transparent text-center font-mono text-[9px] text-ink-dim outline-none",
									value: c.name,
									placeholder: "name",
									"aria-label": `Name for ${c.hex}`,
									onChange: (e) => setBrand({
										...brand,
										colors: brand.colors.map((x) => x.hex === c.hex ? {
											...x,
											name: e.target.value
										} : x)
									})
								})]
							}, c.hex)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "color",
								value: newColor,
								onChange: (e) => setNewColor(e.target.value),
								className: "size-10 rounded-full border border-border bg-surface-alt",
								"aria-label": "New brand colour"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: () => {
									if (!brand.colors.some((x) => x.hex === newColor)) setBrand({
										...brand,
										colors: [...brand.colors, {
											name: "Swatch",
											hex: newColor
										}]
									});
								},
								children: "Add colour"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "inline-flex h-9 cursor-pointer items-center rounded-[10px] border border-border px-3 text-xs text-ink-dim hover:border-phosphor hover:text-ink",
								children: ["From image", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: "image/*",
									className: "sr-only",
									onChange: (e) => {
										const file = e.target.files?.[0];
										e.target.value = "";
										if (!file) return;
										const reader = new FileReader();
										reader.onload = () => {
											paletteFromSrc(String(reader.result), 6).then((hexes) => {
												const cur = useDesign.getState().brand;
												const extra = hexes.filter((hex) => !cur.colors.some((c) => c.hex.toLowerCase() === hex)).map((hex, i) => ({
													name: paletteName(hex, i),
													hex
												}));
												if (extra.length) setBrand({
													...cur,
													colors: [...cur.colors, ...extra].slice(0, 12)
												});
											});
										};
										reader.readAsDataURL(file);
									}
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid max-w-xl grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-[11px] text-ink-dim",
							children: ["Display", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "mt-1 h-10 w-full rounded-[12px] border border-border bg-surface-alt px-3 text-sm text-ink",
								value: brand.displayFont,
								onChange: (e) => setBrand({
									...brand,
									displayFont: e.target.value
								}),
								children: CANVAS_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: f.family,
									children: f.family
								}, f.id))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-[11px] text-ink-dim",
							children: ["Body", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "mt-1 h-10 w-full rounded-[12px] border border-border bg-surface-alt px-3 text-sm text-ink",
								value: brand.bodyFont,
								onChange: (e) => setBrand({
									...brand,
									bodyFont: e.target.value
								}),
								children: CANVAS_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: f.family,
									children: f.family
								}, f.id))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-2xl font-semibold tracking-[-0.03em]",
							style: { fontFamily: brand.displayFont },
							children: "The Voice"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-3 text-sm text-ink-dim",
							style: { fontFamily: brand.bodyFont },
							children: "A mix that holds a room."
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "px-5 py-8 md:px-10 md:py-12",
				onDragOver: (e) => e.preventDefault(),
				onDrop: (e) => {
					e.preventDefault();
					const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
					if (!file) return;
					const reader = new FileReader();
					reader.onload = () => {
						const src = String(reader.result);
						const docId = fromBlank(formatId);
						const img = new Image();
						img.onload = () => {
							useDesign.getState().open(docId);
							const doc = useDesign.getState().doc;
							if (!doc) return;
							const scale = Math.min(doc.artboard.width / img.width, doc.artboard.height / img.height);
							useDesign.getState().addNode(imageNode({
								x: (doc.artboard.width - img.width * scale) / 2,
								y: (doc.artboard.height - img.height * scale) / 2,
								w: img.width * scale,
								h: img.height * scale,
								src
							}));
							useDesign.getState().save();
							navigate({
								to: "/studio/$id",
								params: { id: docId }
							});
						};
						img.src = src;
					};
					reader.readAsDataURL(file);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium tracking-[0.16em] text-ink-dim uppercase",
							children: "Templates"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1",
							children: TEMPLATE_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setCat(c),
								className: cn("h-9 rounded-[999px] px-3 text-xs font-medium", cat === c ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink"),
								children: c
							}, c))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4",
						children: templates.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => openTemplate(t.id),
							className: "group overflow-hidden rounded-[24px] border border-border bg-surface p-2 text-left transition-colors hover:border-phosphor",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "aspect-[4/5] overflow-hidden rounded-[16px] bg-ground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TemplateThumb, {
									template: t,
									className: "size-full"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-2 pt-3 pb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium text-ink",
									children: t.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 text-xs text-ink-dim",
									children: t.description
								})]
							})]
						}, t.id))
					}),
					templates.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-16 text-center text-sm text-ink-faint",
						children: "No templates match that search."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandPalette, {
				open: paletteOpen,
				onClose: () => setPaletteOpen(false),
				commands,
				placeholder: "Open a template or recent…"
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HubView, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		theme: "dark",
		toastOptions: { style: {
			background: "#121613",
			border: "1px solid #263029",
			color: "#d9f5e3"
		} }
	})] });
}
//#endregion
export { Home as component };
