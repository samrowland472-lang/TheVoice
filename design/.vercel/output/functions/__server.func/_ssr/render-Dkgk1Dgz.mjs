import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/render-Dkgk1Dgz.js
function campaignPageName(base, formatLabel) {
	return `${base.replace(/\s+·\s+.+$/, "").trim() || base} · ${formatLabel}`;
}
function campaignPages(index, campaignId) {
	if (!campaignId) return [];
	return index.filter((p) => p.campaignId === campaignId).sort((a, b) => (a.campaignOrder ?? 1e9) - (b.campaignOrder ?? 1e9) || a.id.localeCompare(b.id));
}
var DOCS_KEY = "voice-design:docs:v1";
var BRAND_KEY = "voice-design:brand:v1";
var INDEX_KEY = "voice-design:index:v1";
var LAST_OPENED_KEY = "voice-design:last-opened:v1";
var STAY_HUB_KEY = "voice-design:stay-hub";
function readJson(key, fallback) {
	if (typeof localStorage === "undefined") return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
function sortIndex(index) {
	return [...index].sort((a, b) => {
		const ap = a.pinned ? 1 : 0;
		const bp = b.pinned ? 1 : 0;
		if (ap !== bp) return bp - ap;
		return b.updatedAt - a.updatedAt;
	});
}
function loadIndex() {
	return sortIndex(readJson(INDEX_KEY, []));
}
function saveIndex(index) {
	localStorage.setItem(INDEX_KEY, JSON.stringify(sortIndex(index)));
}
function loadDoc(id) {
	return readJson(DOCS_KEY, {})[id] ?? null;
}
function saveDoc(doc) {
	const all = readJson(DOCS_KEY, {});
	all[doc.id] = doc;
	try {
		localStorage.setItem(DOCS_KEY, JSON.stringify(all));
	} catch {
		if (Object.keys(all).length > 8) {
			const keep = Object.values(all).sort((a, b) => a.updatedAt - b.updatedAt).slice(-8);
			const next = {};
			for (const d of keep) next[d.id] = d;
			next[doc.id] = doc;
			localStorage.setItem(DOCS_KEY, JSON.stringify(next));
		}
	}
	const prev = loadIndex().find((p) => p.id === doc.id);
	const index = loadIndex().filter((p) => p.id !== doc.id);
	index.unshift({
		id: doc.id,
		name: doc.name,
		formatId: doc.artboard.formatId,
		width: doc.artboard.width,
		height: doc.artboard.height,
		updatedAt: doc.updatedAt,
		thumbnail: doc.thumbnail,
		pinned: prev?.pinned,
		folder: prev?.folder,
		tags: prev?.tags,
		campaignId: doc.campaignId,
		campaignOrder: prev?.campaignOrder
	});
	saveIndex(index.slice(0, 40));
}
/** Persist explicit strip positions for every remaining page in a set. */
function writeCampaignOrder(campaignId, ids) {
	saveIndex(loadIndex().map((p) => {
		if (p.campaignId !== campaignId) return p;
		const i = ids.indexOf(p.id);
		if (i < 0) return {
			...p,
			campaignId: void 0,
			campaignOrder: void 0
		};
		return {
			...p,
			campaignOrder: i
		};
	}));
	return loadIndex();
}
function deleteDoc(id) {
	const all = readJson(DOCS_KEY, {});
	delete all[id];
	localStorage.setItem(DOCS_KEY, JSON.stringify(all));
	saveIndex(loadIndex().filter((p) => p.id !== id));
	if (loadLastOpenedId() === id) clearLastOpenedId();
}
function loadLastOpenedId() {
	if (typeof localStorage === "undefined") return null;
	try {
		const raw = localStorage.getItem(LAST_OPENED_KEY);
		return raw && raw.length > 0 ? raw : null;
	} catch {
		return null;
	}
}
function clearLastOpenedId() {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.removeItem(LAST_OPENED_KEY);
	} catch {}
}
/** Explicit hub visit this tab — do not bounce back to the last artboard. */
function markStayOnHub() {
	if (typeof sessionStorage === "undefined") return;
	try {
		sessionStorage.setItem(STAY_HUB_KEY, "1");
	} catch {}
}
var DEFAULT_BRAND = {
	name: "The Voice",
	colors: [
		{
			name: "Ground",
			hex: "#0a0d0c"
		},
		{
			name: "Ink",
			hex: "#d9f5e3"
		},
		{
			name: "Phosphor",
			hex: "#3fc6ff"
		},
		{
			name: "Moss",
			hex: "#7d9689"
		},
		{
			name: "Amber",
			hex: "#ffb238"
		},
		{
			name: "Surface",
			hex: "#121613"
		}
	],
	displayFont: "Chakra Petch",
	bodyFont: "Outfit",
	fonts: [
		"Chakra Petch",
		"Syne",
		"Share Tech Mono",
		"Outfit"
	]
};
function normalizeBrand(raw) {
	if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_BRAND);
	const r = raw;
	const name = typeof r.name === "string" ? r.name : DEFAULT_BRAND.name;
	let colors = DEFAULT_BRAND.colors;
	if (Array.isArray(r.colors) && r.colors.length) colors = r.colors.map((c, i) => {
		if (typeof c === "string") return {
			name: DEFAULT_BRAND.colors.find((d) => d.hex.toLowerCase() === c.toLowerCase())?.name ?? `Colour ${i + 1}`,
			hex: c
		};
		if (c && typeof c === "object" && typeof c.hex === "string") {
			const o = c;
			return {
				name: typeof o.name === "string" && o.name ? o.name : `Colour ${i + 1}`,
				hex: o.hex
			};
		}
		return {
			name: `Colour ${i + 1}`,
			hex: "#d9f5e3"
		};
	});
	const fonts = Array.isArray(r.fonts) ? r.fonts.filter((f) => typeof f === "string") : DEFAULT_BRAND.fonts;
	const displayFont = typeof r.displayFont === "string" && r.displayFont ? r.displayFont : fonts[0] ?? DEFAULT_BRAND.displayFont;
	const bodyFont = typeof r.bodyFont === "string" && r.bodyFont ? r.bodyFont : fonts.find((f) => f !== displayFont) ?? DEFAULT_BRAND.bodyFont;
	return {
		name,
		colors,
		displayFont,
		bodyFont,
		fonts: fonts.length ? fonts : DEFAULT_BRAND.fonts
	};
}
function loadBrand() {
	try {
		const raw = localStorage.getItem(BRAND_KEY);
		if (!raw) return structuredClone(DEFAULT_BRAND);
		return normalizeBrand(JSON.parse(raw));
	} catch {
		return structuredClone(DEFAULT_BRAND);
	}
}
var FORMATS = [
	{
		id: "ig-post",
		label: "Instagram Post",
		group: "Social",
		width: 1080,
		height: 1080
	},
	{
		id: "ig-portrait",
		label: "Instagram Portrait",
		group: "Social",
		width: 1080,
		height: 1350
	},
	{
		id: "ig-story",
		label: "Instagram Story",
		group: "Social",
		width: 1080,
		height: 1920
	},
	{
		id: "x-post",
		label: "X Post",
		group: "Social",
		width: 1600,
		height: 900
	},
	{
		id: "yt-thumb",
		label: "YouTube Thumb",
		group: "Social",
		width: 1280,
		height: 720
	},
	{
		id: "linkedin",
		label: "LinkedIn Banner",
		group: "Social",
		width: 1584,
		height: 396
	},
	{
		id: "tiktok",
		label: "TikTok / Reel",
		group: "Social",
		width: 1080,
		height: 1920
	},
	{
		id: "album",
		label: "Album Cover",
		group: "Music",
		width: 1400,
		height: 1400
	},
	{
		id: "podcast",
		label: "Podcast Cover",
		group: "Music",
		width: 1400,
		height: 1400
	},
	{
		id: "poster",
		label: "Concert Poster",
		group: "Print",
		width: 1275,
		height: 1875
	},
	{
		id: "flyer",
		label: "Flyer",
		group: "Print",
		width: 1275,
		height: 1650
	},
	{
		id: "card",
		label: "Business Card",
		group: "Print",
		width: 1050,
		height: 600
	},
	{
		id: "logo",
		label: "Logo Mark",
		group: "Brand",
		width: 1080,
		height: 1080
	},
	{
		id: "wide",
		label: "Presentation 16:9",
		group: "Brand",
		width: 1920,
		height: 1080
	},
	{
		id: "a4",
		label: "A4 Page",
		group: "Print",
		width: 1240,
		height: 1754
	},
	{
		id: "square",
		label: "Square 1:1",
		group: "Custom",
		width: 1080,
		height: 1080
	}
];
function formatById(id) {
	return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}
[...new Set(FORMATS.map((f) => f.group))];
function uid(prefix = "n") {
	return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
var BASE = {
	rotation: 0,
	opacity: 1,
	visible: true,
	locked: false,
	blend: "source-over",
	fill: "#d9f5e3",
	stroke: "transparent",
	strokeWidth: 0,
	strokeDash: 0,
	strokeDashOffset: 0,
	lineCap: "round",
	lineJoin: "round",
	miterLimit: 4,
	radius: 0,
	shadow: null
};
function shape(kind, patch) {
	return {
		...BASE,
		id: uid("sh"),
		name: kind,
		kind,
		sides: kind === "polygon" ? 6 : kind === "star" ? 5 : void 0,
		headScale: kind === "arrow" ? 1 : void 0,
		...patch
	};
}
function text(patch) {
	return {
		...BASE,
		id: uid("tx"),
		name: "Text",
		kind: "text",
		fontFamily: "Chakra Petch",
		fontWeight: 600,
		fontSize: 48,
		letterSpacing: 0,
		lineHeight: 1.1,
		align: "left",
		uppercase: false,
		wrap: true,
		valign: "top",
		fill: "#d9f5e3",
		...patch
	};
}
function imageNode(patch) {
	return {
		...BASE,
		id: uid("im"),
		name: "Image",
		kind: "image",
		crop: null,
		filters: {
			brightness: 1,
			contrast: 1,
			saturate: 1,
			blur: 0
		},
		fill: "transparent",
		...patch
	};
}
function pathNode(patch) {
	return {
		...BASE,
		id: uid("pt"),
		name: "Path",
		kind: "path",
		closed: false,
		fill: "transparent",
		stroke: "#3fc6ff",
		strokeWidth: 3,
		...patch
	};
}
function docFrom(t) {
	const fmt = formatById(t.formatId);
	const now = Date.now();
	return {
		id: uid("doc"),
		name: t.name,
		artboard: {
			width: fmt.width,
			height: fmt.height,
			background: t.background,
			name: fmt.label,
			formatId: t.formatId
		},
		nodes: t.build(),
		guides: [],
		createdAt: now,
		updatedAt: now
	};
}
var ink = "#d9f5e3";
var dim = "#7d9689";
var ground = "#0a0d0c";
var cyan = "#3fc6ff";
var surface = "#121613";
var amber = "#ffb238";
var TEMPLATES = [
	{
		id: "signal-album",
		name: "Signal Album",
		category: "Music",
		formatId: "album",
		description: "Phosphor field with registration marks",
		background: ground,
		build: () => [
			shape("rect", {
				x: 80,
				y: 80,
				w: 1240,
				h: 1240,
				fill: "transparent",
				stroke: cyan,
				strokeWidth: 2,
				name: "frame"
			}),
			shape("rect", {
				x: 80,
				y: 80,
				w: 28,
				h: 28,
				fill: cyan,
				name: "reg-tl"
			}),
			shape("rect", {
				x: 1292,
				y: 80,
				w: 28,
				h: 28,
				fill: cyan,
				name: "reg-tr"
			}),
			shape("rect", {
				x: 80,
				y: 1292,
				w: 28,
				h: 28,
				fill: cyan,
				name: "reg-bl"
			}),
			shape("rect", {
				x: 1292,
				y: 1292,
				w: 28,
				h: 28,
				fill: cyan,
				name: "reg-br"
			}),
			shape("ellipse", {
				x: 390,
				y: 340,
				w: 620,
				h: 620,
				fill: "transparent",
				stroke: cyan,
				strokeWidth: 18,
				name: "orb"
			}),
			shape("ellipse", {
				x: 560,
				y: 510,
				w: 280,
				h: 280,
				fill: cyan,
				name: "core",
				opacity: .9
			}),
			text({
				x: 120,
				y: 1040,
				w: 1160,
				h: 90,
				text: "THE VOICE",
				fontFamily: "Chakra Petch",
				fontWeight: 700,
				fontSize: 86,
				letterSpacing: 18,
				uppercase: true,
				align: "center",
				fill: ink
			}),
			text({
				x: 120,
				y: 1140,
				w: 1160,
				h: 48,
				text: "SIGNAL 01  ·  LIVE TAKE",
				fontFamily: "Share Tech Mono",
				fontSize: 22,
				letterSpacing: 8,
				align: "center",
				fill: dim,
				uppercase: true
			})
		]
	},
	{
		id: "night-set",
		name: "Night Set Poster",
		category: "Print",
		formatId: "poster",
		description: "Stacked type concert bill",
		background: "#070908",
		build: () => [
			shape("rect", {
				x: 0,
				y: 0,
				w: 1275,
				h: 18,
				fill: cyan,
				name: "bar"
			}),
			text({
				x: 72,
				y: 80,
				w: 1130,
				h: 40,
				text: "SAT 22 AUG  ·  DOORS 20:00",
				fontFamily: "Share Tech Mono",
				fontSize: 22,
				fill: cyan,
				letterSpacing: 6,
				uppercase: true
			}),
			text({
				x: 64,
				y: 160,
				w: 1150,
				h: 220,
				text: "THE\nVOICE",
				fontFamily: "Syne",
				fontWeight: 800,
				fontSize: 210,
				lineHeight: .86,
				fill: ink,
				uppercase: true,
				letterSpacing: -6
			}),
			text({
				x: 72,
				y: 620,
				w: 1130,
				h: 70,
				text: "LIVE TRANSMISSION",
				fontFamily: "Bebas Neue",
				fontSize: 72,
				fill: cyan,
				letterSpacing: 10,
				uppercase: true
			}),
			shape("rect", {
				x: 72,
				y: 720,
				w: 1130,
				h: 2,
				fill: "#263029",
				name: "rule"
			}),
			text({
				x: 72,
				y: 760,
				w: 700,
				h: 180,
				text: "Voice, drum machine,\nand a room that listens\nback.",
				fontFamily: "Outfit",
				fontWeight: 400,
				fontSize: 36,
				lineHeight: 1.25,
				fill: dim
			}),
			text({
				x: 72,
				y: 1680,
				w: 700,
				h: 80,
				text: "WAREHOUSE 4\nEAST DOCK",
				fontFamily: "Chakra Petch",
				fontWeight: 600,
				fontSize: 32,
				lineHeight: 1.2,
				fill: ink,
				uppercase: true
			}),
			text({
				x: 800,
				y: 1680,
				w: 400,
				h: 80,
				text: "TICKETS AT\nTHE DOOR",
				fontFamily: "Share Tech Mono",
				fontSize: 22,
				lineHeight: 1.4,
				fill: cyan,
				align: "right",
				uppercase: true
			})
		]
	},
	{
		id: "yt-drop",
		name: "Drop Thumbnail",
		category: "Social",
		formatId: "yt-thumb",
		description: "High-contrast YouTube still",
		background: ground,
		build: () => [
			shape("rect", {
				x: 0,
				y: 0,
				w: 520,
				h: 720,
				fill: cyan,
				name: "panel"
			}),
			text({
				x: 40,
				y: 80,
				w: 440,
				h: 80,
				text: "EP 12",
				fontFamily: "Share Tech Mono",
				fontSize: 28,
				fill: ground,
				letterSpacing: 8,
				uppercase: true
			}),
			text({
				x: 36,
				y: 180,
				w: 460,
				h: 360,
				text: "HOW\nTO\nHOLD\nA NOTE",
				fontFamily: "Syne",
				fontWeight: 800,
				fontSize: 78,
				lineHeight: .92,
				fill: ground,
				uppercase: true
			}),
			text({
				x: 580,
				y: 220,
				w: 640,
				h: 280,
				text: "Studio\nnotes.",
				fontFamily: "Fraunces",
				fontWeight: 600,
				fontSize: 96,
				lineHeight: .95,
				fill: ink
			}),
			text({
				x: 580,
				y: 560,
				w: 640,
				h: 80,
				text: "A 12-minute voice lesson — no filler.",
				fontFamily: "Outfit",
				fontSize: 28,
				fill: dim
			})
		]
	},
	{
		id: "story-now",
		name: "Now Playing Story",
		category: "Social",
		formatId: "ig-story",
		description: "Vertical now-playing card",
		background: surface,
		build: () => [
			shape("ellipse", {
				x: 190,
				y: 280,
				w: 700,
				h: 700,
				fill: "transparent",
				stroke: cyan,
				strokeWidth: 3,
				name: "ring"
			}),
			shape("ellipse", {
				x: 310,
				y: 400,
				w: 460,
				h: 460,
				fill: cyan,
				opacity: .16,
				name: "glow"
			}),
			shape("ellipse", {
				x: 470,
				y: 560,
				w: 140,
				h: 140,
				fill: cyan,
				name: "dot"
			}),
			text({
				x: 80,
				y: 1100,
				w: 920,
				h: 50,
				text: "NOW PLAYING",
				fontFamily: "Share Tech Mono",
				fontSize: 22,
				letterSpacing: 10,
				align: "center",
				fill: cyan,
				uppercase: true
			}),
			text({
				x: 80,
				y: 1180,
				w: 920,
				h: 140,
				text: "Low Signal",
				fontFamily: "Chakra Petch",
				fontWeight: 700,
				fontSize: 88,
				align: "center",
				fill: ink
			}),
			text({
				x: 80,
				y: 1340,
				w: 920,
				h: 50,
				text: "THE VOICE  ·  TAKE 03",
				fontFamily: "Outfit",
				fontSize: 24,
				align: "center",
				fill: dim,
				letterSpacing: 4,
				uppercase: true
			}),
			shape("rect", {
				x: 180,
				y: 1680,
				w: 720,
				h: 8,
				fill: "#263029",
				radius: 4,
				name: "track"
			}),
			shape("rect", {
				x: 180,
				y: 1680,
				w: 280,
				h: 8,
				fill: cyan,
				radius: 4,
				name: "progress"
			})
		]
	},
	{
		id: "ig-quote",
		name: "Lyric Square",
		category: "Social",
		formatId: "ig-post",
		description: "Editorial lyric lockup",
		background: "#0e1210",
		build: () => [
			shape("rect", {
				x: 64,
				y: 64,
				w: 952,
				h: 952,
				fill: "transparent",
				stroke: "#263029",
				strokeWidth: 1,
				name: "inset"
			}),
			text({
				x: 110,
				y: 160,
				w: 860,
				h: 40,
				text: "LYRIC  ·  01",
				fontFamily: "Share Tech Mono",
				fontSize: 18,
				fill: cyan,
				letterSpacing: 6,
				uppercase: true
			}),
			text({
				x: 110,
				y: 280,
				w: 860,
				h: 420,
				text: "Keep the\nroom quiet\nso the voice\ncan arrive.",
				fontFamily: "Fraunces",
				fontWeight: 600,
				fontSize: 72,
				lineHeight: 1.08,
				fill: ink
			}),
			shape("rect", {
				x: 110,
				y: 820,
				w: 80,
				h: 4,
				fill: cyan,
				name: "tick"
			}),
			text({
				x: 110,
				y: 860,
				w: 860,
				h: 60,
				text: "THE VOICE",
				fontFamily: "Chakra Petch",
				fontWeight: 600,
				fontSize: 28,
				fill: dim,
				letterSpacing: 8,
				uppercase: true
			})
		]
	},
	{
		id: "podcast",
		name: "Podcast Cover",
		category: "Music",
		formatId: "podcast",
		description: "Numbered episode plate",
		background: ground,
		build: () => [
			shape("rect", {
				x: 0,
				y: 0,
				w: 1400,
				h: 1400,
				fill: {
					type: "linear",
					angle: 160,
					stops: [{
						offset: 0,
						color: "#0a0d0c"
					}, {
						offset: 1,
						color: "#15201a"
					}]
				},
				name: "wash"
			}),
			text({
				x: 80,
				y: 70,
				w: 1240,
				h: 80,
				text: "048",
				fontFamily: "Bebas Neue",
				fontSize: 96,
				fill: cyan,
				letterSpacing: 4
			}),
			text({
				x: 80,
				y: 480,
				w: 1240,
				h: 420,
				text: "IN THE\nBOOTH",
				fontFamily: "Syne",
				fontWeight: 800,
				fontSize: 168,
				lineHeight: .88,
				fill: ink,
				uppercase: true
			}),
			text({
				x: 80,
				y: 1180,
				w: 900,
				h: 80,
				text: "Conversations on making sound that lasts.",
				fontFamily: "Outfit",
				fontSize: 32,
				fill: dim
			}),
			shape("rect", {
				x: 80,
				y: 1288,
				w: 180,
				h: 8,
				fill: cyan,
				name: "bar"
			})
		]
	},
	{
		id: "card-press",
		name: "Press Card",
		category: "Print",
		formatId: "card",
		description: "Quiet business card",
		background: "#0c100e",
		build: () => [
			shape("rect", {
				x: 0,
				y: 0,
				w: 8,
				h: 600,
				fill: cyan,
				name: "spine"
			}),
			text({
				x: 56,
				y: 70,
				w: 600,
				h: 50,
				text: "THE VOICE",
				fontFamily: "Chakra Petch",
				fontWeight: 700,
				fontSize: 36,
				letterSpacing: 8,
				fill: ink,
				uppercase: true
			}),
			text({
				x: 56,
				y: 130,
				w: 600,
				h: 30,
				text: "DESIGN  ·  SOUND  ·  STAGE",
				fontFamily: "Share Tech Mono",
				fontSize: 14,
				fill: dim,
				letterSpacing: 4,
				uppercase: true
			}),
			text({
				x: 56,
				y: 420,
				w: 500,
				h: 90,
				text: "Sam Rowland\nStudio lead",
				fontFamily: "Outfit",
				fontSize: 22,
				lineHeight: 1.3,
				fill: ink
			}),
			text({
				x: 620,
				y: 430,
				w: 380,
				h: 90,
				text: "hello@thevoice.studio\n+44 20 0000 0000",
				fontFamily: "IBM Plex Mono",
				fontSize: 16,
				lineHeight: 1.5,
				fill: dim,
				align: "right"
			})
		]
	},
	{
		id: "logo-mark",
		name: "Registration Mark",
		category: "Brand",
		formatId: "logo",
		description: "Geometric wordmark",
		background: ground,
		build: () => [
			shape("rect", {
				x: 330,
				y: 250,
				w: 420,
				h: 420,
				fill: "transparent",
				stroke: cyan,
				strokeWidth: 10,
				name: "plate"
			}),
			shape("ellipse", {
				x: 470,
				y: 390,
				w: 140,
				h: 140,
				fill: cyan,
				name: "dot"
			}),
			text({
				x: 90,
				y: 740,
				w: 900,
				h: 90,
				text: "THE VOICE",
				fontFamily: "Chakra Petch",
				fontWeight: 700,
				fontSize: 72,
				align: "center",
				letterSpacing: 14,
				fill: ink,
				uppercase: true
			}),
			text({
				x: 90,
				y: 840,
				w: 900,
				h: 40,
				text: "EST. SIGNAL",
				fontFamily: "Share Tech Mono",
				fontSize: 18,
				align: "center",
				letterSpacing: 10,
				fill: dim,
				uppercase: true
			})
		]
	},
	{
		id: "x-banner",
		name: "Transmission Banner",
		category: "Social",
		formatId: "x-post",
		description: "Wide announcement",
		background: ground,
		build: () => [
			shape("rect", {
				x: 0,
				y: 0,
				w: 12,
				h: 900,
				fill: cyan,
				name: "edge"
			}),
			text({
				x: 80,
				y: 120,
				w: 900,
				h: 40,
				text: "NEW DROP",
				fontFamily: "Share Tech Mono",
				fontSize: 22,
				fill: cyan,
				letterSpacing: 8,
				uppercase: true
			}),
			text({
				x: 72,
				y: 200,
				w: 1100,
				h: 260,
				text: "Design that\ncarries a voice.",
				fontFamily: "Syne",
				fontWeight: 800,
				fontSize: 92,
				lineHeight: .95,
				fill: ink
			}),
			text({
				x: 80,
				y: 720,
				w: 800,
				h: 50,
				text: "Open the artboard. Make the poster. Press send.",
				fontFamily: "Outfit",
				fontSize: 26,
				fill: dim
			}),
			shape("ellipse", {
				x: 1180,
				y: 220,
				w: 280,
				h: 280,
				fill: "transparent",
				stroke: cyan,
				strokeWidth: 10,
				name: "orb"
			})
		]
	},
	{
		id: "flyer-session",
		name: "Session Flyer",
		category: "Print",
		formatId: "flyer",
		description: "Workshop handbill",
		background: "#0b0f0d",
		build: () => [
			text({
				x: 70,
				y: 70,
				w: 1130,
				h: 40,
				text: "OPEN STUDIO  ·  FREE",
				fontFamily: "Share Tech Mono",
				fontSize: 20,
				fill: amber,
				letterSpacing: 6,
				uppercase: true
			}),
			text({
				x: 64,
				y: 140,
				w: 1140,
				h: 200,
				text: "LEARN THE\nARTBOARD",
				fontFamily: "Chakra Petch",
				fontWeight: 700,
				fontSize: 96,
				lineHeight: .92,
				fill: ink,
				uppercase: true
			}),
			shape("rect", {
				x: 70,
				y: 380,
				w: 1130,
				h: 1,
				fill: "#263029",
				name: "rule"
			}),
			text({
				x: 70,
				y: 430,
				w: 1130,
				h: 220,
				text: "A three-hour session on type, paint, and layouts that hold a room. Bring a laptop. Leave with a poster.",
				fontFamily: "Outfit",
				fontSize: 32,
				lineHeight: 1.4,
				fill: dim
			}),
			shape("rect", {
				x: 70,
				y: 1380,
				w: 1130,
				h: 180,
				fill: cyan,
				name: "cta"
			}),
			text({
				x: 70,
				y: 1430,
				w: 1130,
				h: 80,
				text: "SATURDAY  ·  14:00  ·  STUDIO B",
				fontFamily: "Chakra Petch",
				fontWeight: 600,
				fontSize: 32,
				align: "center",
				fill: ground,
				uppercase: true,
				letterSpacing: 4
			})
		]
	},
	{
		id: "slide-key",
		name: "Keynote Slide",
		category: "Brand",
		formatId: "wide",
		description: "Talk title card",
		background: ground,
		build: () => [
			shape("rect", {
				x: 0,
				y: 0,
				w: 1920,
				h: 8,
				fill: cyan,
				name: "top"
			}),
			text({
				x: 120,
				y: 160,
				w: 1680,
				h: 40,
				text: "THE VOICE  /  KEYNOTE",
				fontFamily: "Share Tech Mono",
				fontSize: 22,
				fill: cyan,
				letterSpacing: 8,
				uppercase: true
			}),
			text({
				x: 110,
				y: 280,
				w: 1600,
				h: 280,
				text: "Sound is a\nlayout problem.",
				fontFamily: "Fraunces",
				fontWeight: 600,
				fontSize: 108,
				lineHeight: 1.02,
				fill: ink
			}),
			text({
				x: 120,
				y: 880,
				w: 1e3,
				h: 50,
				text: "How a poster, a mix, and a voice share the same grid.",
				fontFamily: "Outfit",
				fontSize: 28,
				fill: dim
			})
		]
	},
	{
		id: "portrait-issue",
		name: "Issue Cover",
		category: "Social",
		formatId: "ig-portrait",
		description: "Magazine-style cover",
		background: "#101612",
		build: () => [
			text({
				x: 60,
				y: 50,
				w: 960,
				h: 40,
				text: "THE VOICE  ·  VOL. 02",
				fontFamily: "Share Tech Mono",
				fontSize: 18,
				fill: cyan,
				letterSpacing: 6,
				uppercase: true
			}),
			text({
				x: 50,
				y: 160,
				w: 980,
				h: 180,
				text: "PRESS",
				fontFamily: "Bebas Neue",
				fontSize: 180,
				fill: ink,
				letterSpacing: 8,
				uppercase: true
			}),
			shape("rect", {
				x: 60,
				y: 380,
				w: 960,
				h: 640,
				fill: cyan,
				opacity: .12,
				name: "field"
			}),
			shape("ellipse", {
				x: 280,
				y: 500,
				w: 520,
				h: 400,
				fill: "transparent",
				stroke: cyan,
				strokeWidth: 6,
				name: "oval"
			}),
			text({
				x: 60,
				y: 1080,
				w: 960,
				h: 160,
				text: "The craft issue.\nType, paint, and the cut.",
				fontFamily: "Fraunces",
				fontWeight: 600,
				fontSize: 42,
				lineHeight: 1.2,
				fill: ink
			})
		]
	},
	{
		id: "100-hour",
		name: "100 Hour Loop",
		category: "Print",
		formatId: "poster",
		description: "Stay-in-the-work bill",
		background: ground,
		build: () => [
			shape("rect", {
				x: 64,
				y: 64,
				w: 28,
				h: 28,
				fill: cyan,
				name: "reg-tl"
			}),
			shape("rect", {
				x: 1183,
				y: 64,
				w: 28,
				h: 28,
				fill: cyan,
				name: "reg-tr"
			}),
			shape("rect", {
				x: 64,
				y: 1783,
				w: 28,
				h: 28,
				fill: cyan,
				name: "reg-bl"
			}),
			shape("rect", {
				x: 1183,
				y: 1783,
				w: 28,
				h: 28,
				fill: cyan,
				name: "reg-br"
			}),
			shape("rect", {
				x: 64,
				y: 64,
				w: 1147,
				h: 1747,
				fill: "transparent",
				stroke: cyan,
				strokeWidth: 1,
				name: "plate"
			}),
			text({
				x: 110,
				y: 140,
				w: 1050,
				h: 36,
				text: "THE VOICE  ·  STUDIO SIGNAL",
				fontFamily: "Share Tech Mono",
				fontSize: 18,
				fill: cyan,
				letterSpacing: 8,
				uppercase: true
			}),
			text({
				x: 100,
				y: 240,
				w: 1070,
				h: 80,
				text: "HOUR 047",
				fontFamily: "Bebas Neue",
				fontSize: 92,
				fill: cyan,
				letterSpacing: 6,
				uppercase: true
			}),
			text({
				x: 96,
				y: 340,
				w: 1080,
				h: 420,
				text: "THE LOOP\nDOES NOT\nEND.",
				fontFamily: "Syne",
				fontWeight: 800,
				fontSize: 128,
				lineHeight: .88,
				fill: ink,
				uppercase: true,
				letterSpacing: -4
			}),
			shape("rect", {
				x: 110,
				y: 820,
				w: 180,
				h: 6,
				fill: cyan,
				name: "tick"
			}),
			text({
				x: 110,
				y: 870,
				w: 1e3,
				h: 180,
				text: "Keep the artboard open. Nudge the type. Paint until the room is quiet. One hundred hours is a posture, not a timer.",
				fontFamily: "Outfit",
				fontSize: 32,
				lineHeight: 1.4,
				fill: dim
			}),
			text({
				x: 110,
				y: 1600,
				w: 700,
				h: 80,
				text: "047 / 100\nSTILL PRESSING",
				fontFamily: "Chakra Petch",
				fontWeight: 600,
				fontSize: 28,
				lineHeight: 1.3,
				fill: ink,
				uppercase: true,
				letterSpacing: 4
			}),
			text({
				x: 820,
				y: 1620,
				w: 340,
				h: 60,
				text: "DO NOT LEAVE\nTHE GRID",
				fontFamily: "Share Tech Mono",
				fontSize: 16,
				lineHeight: 1.5,
				fill: cyan,
				align: "right",
				uppercase: true,
				letterSpacing: 3
			})
		]
	},
	{
		id: "linkedin-strip",
		name: "Field Banner",
		category: "Social",
		formatId: "linkedin",
		description: "Quiet professional strip",
		background: ground,
		build: () => [
			shape("rect", {
				x: 0,
				y: 0,
				w: 12,
				h: 396,
				fill: cyan,
				name: "edge"
			}),
			text({
				x: 64,
				y: 80,
				w: 900,
				h: 40,
				text: "THE VOICE  /  STUDIO",
				fontFamily: "Share Tech Mono",
				fontSize: 18,
				fill: cyan,
				letterSpacing: 6,
				uppercase: true
			}),
			text({
				x: 56,
				y: 140,
				w: 1100,
				h: 140,
				text: "Design that carries a voice.",
				fontFamily: "Fraunces",
				fontWeight: 600,
				fontSize: 56,
				fill: ink
			}),
			text({
				x: 64,
				y: 310,
				w: 700,
				h: 40,
				text: "Posters · covers · stories · marks",
				fontFamily: "Outfit",
				fontSize: 22,
				fill: dim
			}),
			shape("ellipse", {
				x: 1320,
				y: 78,
				w: 180,
				h: 180,
				fill: "transparent",
				stroke: cyan,
				strokeWidth: 8,
				name: "orb"
			})
		]
	},
	{
		id: "a4-manifesto",
		name: "Studio Manifesto",
		category: "Print",
		formatId: "a4",
		description: "A4 editorial page",
		background: "#f4f1ea",
		build: () => [
			text({
				x: 90,
				y: 80,
				w: 1060,
				h: 30,
				text: "THE VOICE  ·  WORKING NOTES",
				fontFamily: "Share Tech Mono",
				fontSize: 16,
				fill: "#3a4a42",
				letterSpacing: 6,
				uppercase: true
			}),
			text({
				x: 80,
				y: 140,
				w: 1080,
				h: 200,
				text: "A poster is a\nmix, compressed.",
				fontFamily: "Fraunces",
				fontWeight: 600,
				fontSize: 64,
				lineHeight: 1.05,
				fill: "#121613"
			}),
			shape("rect", {
				x: 90,
				y: 380,
				w: 80,
				h: 4,
				fill: "#3fc6ff",
				name: "tick"
			}),
			text({
				x: 90,
				y: 430,
				w: 1060,
				h: 420,
				text: "Type is the vocal. Colour is the room. Crop marks are the honesty of a press that still cares. We do not decorate. We hold a signal until it is loud enough to leave the studio.",
				fontFamily: "Outfit",
				fontSize: 28,
				lineHeight: 1.5,
				fill: "#3a4a42"
			}),
			text({
				x: 90,
				y: 1560,
				w: 500,
				h: 80,
				text: "01  Grid\n02  Voice\n03  Cut",
				fontFamily: "Chakra Petch",
				fontWeight: 600,
				fontSize: 22,
				lineHeight: 1.4,
				fill: "#121613",
				uppercase: true,
				letterSpacing: 2
			}),
			text({
				x: 700,
				y: 1580,
				w: 450,
				h: 60,
				text: "Printed in the loop.\nNot a draft.",
				fontFamily: "IBM Plex Mono",
				fontSize: 16,
				lineHeight: 1.5,
				fill: "#3a4a42",
				align: "right"
			})
		]
	},
	{
		id: "reel-hook",
		name: "Reel Hook",
		category: "Social",
		formatId: "tiktok",
		description: "Vertical cold open",
		background: ground,
		build: () => [
			text({
				x: 80,
				y: 120,
				w: 920,
				h: 40,
				text: "WATCH TO THE CUT",
				fontFamily: "Share Tech Mono",
				fontSize: 20,
				fill: cyan,
				letterSpacing: 8,
				align: "center",
				uppercase: true
			}),
			text({
				x: 60,
				y: 620,
				w: 960,
				h: 520,
				text: "STOP\nSCROLLING.\nSTART\nPRESSING.",
				fontFamily: "Syne",
				fontWeight: 800,
				fontSize: 96,
				lineHeight: .9,
				fill: ink,
				align: "center",
				uppercase: true
			}),
			shape("rect", {
				x: 340,
				y: 1640,
				w: 400,
				h: 64,
				fill: cyan,
				radius: 8,
				name: "cta"
			}),
			text({
				x: 340,
				y: 1654,
				w: 400,
				h: 40,
				text: "OPEN THE BOARD",
				fontFamily: "Chakra Petch",
				fontWeight: 600,
				fontSize: 22,
				align: "center",
				fill: ground,
				uppercase: true,
				letterSpacing: 2
			})
		]
	},
	{
		id: "blank-square",
		name: "Blank Square",
		category: "Custom",
		formatId: "square",
		description: "Empty artboard",
		background: "#ffffff",
		build: () => []
	},
	{
		id: "blank-story",
		name: "Blank Story",
		category: "Custom",
		formatId: "ig-story",
		description: "Empty 9:16",
		background: "#ffffff",
		build: () => []
	},
	{
		id: "blank-poster",
		name: "Blank Poster",
		category: "Custom",
		formatId: "poster",
		description: "Empty print",
		background: "#ffffff",
		build: () => []
	}
];
var TEMPLATE_CATEGORIES = ["All", ...[...new Set(TEMPLATES.map((t) => t.category))]];
function templateById(id) {
	return TEMPLATES.find((t) => t.id === id);
}
function instantiateTemplate(id) {
	return docFrom(templateById(id) ?? TEMPLATES[0]);
}
function blankDocument(formatId, name = "Untitled") {
	const fmt = formatById(formatId);
	const now = Date.now();
	return {
		id: uid("doc"),
		name,
		artboard: {
			width: fmt.width,
			height: fmt.height,
			background: "#ffffff",
			name: fmt.label,
			formatId: fmt.id
		},
		nodes: [],
		guides: [],
		createdAt: now,
		updatedAt: now
	};
}
var CANVAS_FONTS = [
	{
		id: "chakra",
		family: "Chakra Petch",
		fallback: "system-ui",
		weights: [
			400,
			500,
			600,
			700
		],
		role: "display"
	},
	{
		id: "syne",
		family: "Syne",
		fallback: "system-ui",
		weights: [
			400,
			600,
			700,
			800
		],
		role: "display"
	},
	{
		id: "bebas",
		family: "Bebas Neue",
		fallback: "Impact, system-ui",
		weights: [400],
		role: "display"
	},
	{
		id: "fraunces",
		family: "Fraunces",
		fallback: "Georgia, serif",
		weights: [
			400,
			600,
			700
		],
		role: "display",
		opsz: {
			tag: "opsz",
			min: 9,
			max: 144,
			fallback: 144
		},
		SOFT: {
			tag: "SOFT",
			min: 0,
			max: 100,
			fallback: 0
		},
		WONK: {
			tag: "WONK",
			min: 0,
			max: 1,
			fallback: 0
		}
	},
	{
		id: "outfit",
		family: "Outfit",
		fallback: "system-ui",
		weights: [
			300,
			400,
			500,
			600,
			700
		],
		role: "body"
	},
	{
		id: "instrument",
		family: "Instrument Sans",
		fallback: "system-ui",
		weights: [
			400,
			500,
			600,
			700
		],
		role: "body",
		wdth: {
			tag: "wdth",
			min: 75,
			max: 100,
			fallback: 100
		}
	},
	{
		id: "inter",
		family: "Inter",
		fallback: "system-ui",
		weights: [
			400,
			500,
			600,
			700
		],
		role: "body",
		slnt: {
			tag: "slnt",
			min: -10,
			max: 0,
			fallback: 0
		}
	},
	{
		id: "roboto-flex",
		family: "Roboto Flex",
		fallback: "system-ui",
		weights: [
			400,
			500,
			600,
			700
		],
		role: "body",
		GRAD: {
			tag: "GRAD",
			min: -200,
			max: 150,
			fallback: 0
		}
	},
	{
		id: "newsreader",
		family: "Newsreader",
		fallback: "Georgia, serif",
		weights: [
			400,
			600,
			700
		],
		role: "display",
		opsz: {
			tag: "opsz",
			min: 6,
			max: 72,
			fallback: 72
		},
		ital: {
			tag: "ital",
			min: 0,
			max: 1,
			fallback: 0
		}
	},
	{
		id: "share",
		family: "Share Tech Mono",
		fallback: "ui-monospace, monospace",
		weights: [400],
		role: "mono"
	},
	{
		id: "ibm",
		family: "IBM Plex Mono",
		fallback: "ui-monospace, monospace",
		weights: [
			400,
			500,
			600
		],
		role: "mono"
	}
];
function fontStack(family) {
	const f = CANVAS_FONTS.find((c) => c.family === family);
	return f ? "\"" + f.family + "\", " + f.fallback : "\"" + family + "\", system-ui, sans-serif";
}
var FONT_LINK = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Chakra+Petch:wght@400;500;600;700&family=Fraunces:opsz,SOFT,WONK,wght@9..144,0..100,0..1,400;9..144,0..100,0..1,600;9..144,0..100,0..1,700&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wdth,wght@75..100,400;75..100,500;75..100,600;75..100,700&family=Inter:slnt,wght@-10..0,400;-10..0,500;-10..0,600;-10..0,700&family=Newsreader:ital,opsz,wght@0..1,6..72,400;0..1,6..72,600;0..1,6..72,700&family=Outfit:wght@300;400;500;600;700&family=Roboto+Flex:GRAD,wght@-200..150,400;-200..150,500;-200..150,600;-200..150,700&family=Share+Tech+Mono&family=Syne:wght@400;600;700;800&display=swap";
function canvasFont(family) {
	return CANVAS_FONTS.find((c) => c.family === family);
}
function faceAxis(family, tag) {
	return canvasFont(family)?.[tag];
}
function anyFaceHasAxis(families, tag) {
	return families.some((family) => Boolean(faceAxis(family, tag)));
}
function clampAxis(axis, value, auto) {
	const raw = value ?? auto ?? axis.fallback;
	if (!Number.isFinite(raw)) return axis.fallback;
	return Math.min(axis.max, Math.max(axis.min, raw));
}
function variationSettings(node) {
	const face = canvasFont(node.fontFamily);
	const parts = [];
	if (face?.opsz) parts.push("\"opsz\" " + clampAxis(face.opsz, node.opticalSize, node.fontSize));
	if (face?.wdth) parts.push("\"wdth\" " + clampAxis(face.wdth, node.fontWidth));
	if (face?.slnt) parts.push("\"slnt\" " + clampAxis(face.slnt, node.fontSlant));
	if (face?.ital) parts.push("\"ital\" " + clampAxis(face.ital, node.fontItalic));
	if (face?.GRAD) parts.push("\"GRAD\" " + clampAxis(face.GRAD, node.fontGrade));
	if (face?.SOFT) parts.push("\"SOFT\" " + clampAxis(face.SOFT, node.fontSoft));
	if (face?.WONK) parts.push("\"WONK\" " + clampAxis(face.WONK, node.fontWonk));
	return parts.join(", ");
}
function applyFontFace(ctx, node) {
	ctx.font = node.fontWeight + " " + node.fontSize + "px " + fontStack(node.fontFamily);
	const settings = variationSettings(node);
	const varied = ctx;
	if ("fontVariationSettings" in varied) varied.fontVariationSettings = settings || "normal";
	if ("letterSpacing" in varied) varied.letterSpacing = node.letterSpacing + "px";
}
function hasHandle(h) {
	return Boolean(h && (Math.abs(h.x) > .2 || Math.abs(h.y) > .2));
}
function nearPenClose(probeX, probeY, firstX, firstY, zoom, px = 9) {
	return Math.hypot(probeX - firstX, probeY - firstY) <= px / zoom;
}
function tracePath(ctx, ox, oy, pts, closed) {
	if (!pts.length) return;
	ctx.moveTo(ox + pts[0].x, oy + pts[0].y);
	const n = pts.length;
	const last = closed ? n : n - 1;
	for (let i = 0; i < last; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % n];
		const out = a.out;
		const inn = b.in;
		if (hasHandle(out) || hasHandle(inn)) {
			const c1x = ox + a.x + (out?.x ?? 0);
			const c1y = oy + a.y + (out?.y ?? 0);
			const c2x = ox + b.x + (inn?.x ?? 0);
			const c2y = oy + b.y + (inn?.y ?? 0);
			ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ox + b.x, oy + b.y);
		} else ctx.lineTo(ox + b.x, oy + b.y);
	}
	if (closed) ctx.closePath();
}
/** Rotate a relative cubic handle (offset from its anchor) by degrees. */
function rotateHandle(h, deg) {
	if (!h) return null;
	const r = deg * Math.PI / 180;
	const c = Math.cos(r);
	const s = Math.sin(r);
	return {
		x: h.x * c - h.y * s,
		y: h.x * s + h.y * c
	};
}
/**
* Flatten a rotate-group into world-space points: anchors around (cx, cy)
* and cubic handles as rotated relative offsets so path d needs no transform.
*/
function bakeRotatedPoints(ox, oy, pts, rotation, cx, cy) {
	const rot = rotation || 0;
	return pts.map((p) => {
		const ax = ox + p.x;
		const ay = oy + p.y;
		if (!rot) return {
			...p,
			x: ax,
			y: ay
		};
		const r = rot * Math.PI / 180;
		const dx = ax - cx;
		const dy = ay - cy;
		return {
			...p,
			x: cx + dx * Math.cos(r) - dy * Math.sin(r),
			y: cy + dx * Math.sin(r) + dy * Math.cos(r),
			in: rotateHandle(p.in, rot),
			out: rotateHandle(p.out, rot)
		};
	});
}
function pathD(ox, oy, pts, closed) {
	if (!pts.length) return "";
	const parts = [`M ${ox + pts[0].x} ${oy + pts[0].y}`];
	const n = pts.length;
	const last = closed ? n : n - 1;
	for (let i = 0; i < last; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % n];
		const out = a.out;
		const inn = b.in;
		if (hasHandle(out) || hasHandle(inn)) {
			const c1x = ox + a.x + (out?.x ?? 0);
			const c1y = oy + a.y + (out?.y ?? 0);
			const c2x = ox + b.x + (inn?.x ?? 0);
			const c2y = oy + b.y + (inn?.y ?? 0);
			parts.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${ox + b.x} ${oy + b.y}`);
		} else parts.push(`L ${ox + b.x} ${oy + b.y}`);
	}
	if (closed) parts.push("Z");
	return parts.join(" ");
}
function mirrorHandle(h) {
	return {
		x: -h.x,
		y: -h.y
	};
}
function unit(x, y) {
	const len = Math.hypot(x, y);
	if (len < 1e-6) return {
		x: 0,
		y: 0,
		len: 0
	};
	return {
		x: x / len,
		y: y / len,
		len
	};
}
/** Average incoming/outgoing tangents and write mirrored cubic handles. */
function autoSmoothPoint(pts, index, closed) {
	const n = pts.length;
	const cur = pts[index];
	if (n < 2) return {
		...cur,
		smooth: true
	};
	const prev = index > 0 ? pts[index - 1] : closed ? pts[n - 1] : null;
	const next = index < n - 1 ? pts[index + 1] : closed ? pts[0] : null;
	const inDir = prev ? unit(cur.x - prev.x, cur.y - prev.y) : null;
	const outDir = next ? unit(next.x - cur.x, next.y - cur.y) : null;
	let tx = 0;
	let ty = 0;
	if (inDir && outDir) {
		tx = inDir.x + outDir.x;
		ty = inDir.y + outDir.y;
	} else if (outDir) {
		tx = outDir.x;
		ty = outDir.y;
	} else if (inDir) {
		tx = inDir.x;
		ty = inDir.y;
	}
	const t = unit(tx, ty);
	if (t.len < 1e-6) return {
		...cur,
		in: null,
		out: null,
		smooth: true
	};
	const inLen = prev ? Math.hypot(cur.x - prev.x, cur.y - prev.y) / 3 : 0;
	const outLen = next ? Math.hypot(next.x - cur.x, next.y - cur.y) / 3 : 0;
	return {
		...cur,
		in: inLen > .2 ? {
			x: -t.x * inLen,
			y: -t.y * inLen
		} : null,
		out: outLen > .2 ? {
			x: t.x * outLen,
			y: t.y * outLen
		} : null,
		smooth: true
	};
}
function smoothPathCorners(pts, closed) {
	return pts.map((_, i) => autoSmoothPoint(pts, i, closed));
}
function unitHandle(from, toward, scale = 1 / 3) {
	const dx = toward.x - from.x;
	const dy = toward.y - from.y;
	if (Math.hypot(dx, dy) < .2) return null;
	return {
		x: dx * scale,
		y: dy * scale
	};
}
/** Close an open contour and guarantee the last→first segment is cubic. */
function closePathWithCubic(n) {
	if (n.closed || n.points.length < 3) return n;
	const pts = n.points.map((p) => ({
		...p,
		in: p.in ? { ...p.in } : null,
		out: p.out ? { ...p.out } : null
	}));
	const first = pts[0];
	const last = pts[pts.length - 1];
	if (!hasHandle(last.out)) last.out = hasHandle(last.in) && last.in ? mirrorHandle(last.in) : unitHandle(last, first);
	if (!hasHandle(first.in)) first.in = hasHandle(first.out) && first.out ? mirrorHandle(first.out) : unitHandle(first, last);
	first.smooth = Boolean(hasHandle(first.in) && hasHandle(first.out));
	last.smooth = Boolean(hasHandle(last.in) && hasHandle(last.out));
	return {
		...n,
		points: pts,
		closed: true
	};
}
/** Hit a path anchor or cubic handle in document space. */
function hitPathEdit(ox, oy, pts, wx, wy, zoom) {
	const handlePx = 8 / zoom;
	const anchorPx = 7 / zoom;
	for (let i = pts.length - 1; i >= 0; i--) {
		const p = pts[i];
		if (hasHandle(p.out)) {
			const hx = ox + p.x + p.out.x;
			const hy = oy + p.y + p.out.y;
			if (Math.hypot(wx - hx, wy - hy) <= handlePx) return {
				index: i,
				arm: "out"
			};
		}
		if (hasHandle(p.in)) {
			const hx = ox + p.x + p.in.x;
			const hy = oy + p.y + p.in.y;
			if (Math.hypot(wx - hx, wy - hy) <= handlePx) return {
				index: i,
				arm: "in"
			};
		}
	}
	for (let i = pts.length - 1; i >= 0; i--) {
		const p = pts[i];
		if (Math.hypot(wx - (ox + p.x), wy - (oy + p.y)) <= anchorPx) return {
			index: i,
			arm: "anchor"
		};
	}
	return null;
}
/** Drag an in/out handle. Smooth points keep opposite handles mirrored; Alt breaks that. */
function dragPathHandle(pt, arm, hx, hy, keepSmooth) {
	const handle = {
		x: hx - pt.x,
		y: hy - pt.y
	};
	if (!keepSmooth) return arm === "out" ? {
		...pt,
		out: handle,
		smooth: false
	} : {
		...pt,
		in: handle,
		smooth: false
	};
	const opposite = mirrorHandle(handle);
	if (arm === "out") return {
		...pt,
		out: handle,
		in: opposite,
		smooth: true
	};
	return {
		...pt,
		in: handle,
		out: opposite,
		smooth: true
	};
}
/** Overlay: phosphor arms + diamonds for in/out, squares for anchors. */
function drawPathTangents(ctx, ox, oy, pts, zoom, active, tone = "phosphor", showLengths = false) {
	if (!pts.length) return;
	const armW = 1.25 / zoom;
	const diamond = 5 / zoom;
	const anchor = 6 / zoom;
	ctx.save();
	ctx.lineJoin = "round";
	ctx.lineCap = "round";
	for (let i = 0; i < pts.length; i++) {
		const p = pts[i];
		const ax = ox + p.x;
		const ay = oy + p.y;
		const arms = [];
		if (hasHandle(p.in) && p.in) arms.push({
			arm: "in",
			h: p.in
		});
		if (hasHandle(p.out) && p.out) arms.push({
			arm: "out",
			h: p.out
		});
		for (const { arm, h } of arms) {
			const hx = ax + h.x;
			const hy = ay + h.y;
			const hot = active?.index === i && active.arm === arm;
			ctx.beginPath();
			ctx.moveTo(ax, ay);
			ctx.lineTo(hx, hy);
			ctx.strokeStyle = hot ? "#7ee0ff" : "rgba(63,198,255,0.85)";
			ctx.lineWidth = hot ? armW * 2.4 : armW;
			ctx.stroke();
			if (hot) {
				const len = Math.hypot(h.x, h.y) || 1;
				const ux = h.x / len;
				const uy = h.y / len;
				const ext = 28 / zoom;
				ctx.save();
				ctx.setLineDash([3 / zoom, 3 / zoom]);
				ctx.beginPath();
				ctx.moveTo(hx, hy);
				ctx.lineTo(hx + ux * ext, hy + uy * ext);
				ctx.strokeStyle = "rgba(126,224,255,0.55)";
				ctx.lineWidth = armW;
				ctx.stroke();
				ctx.restore();
			}
			const isAnchorActive = active?.index === i && active.arm === "anchor";
			if (showLengths && (hot || isAnchorActive)) {
				const length = Math.round(Math.hypot(h.x, h.y));
				const len = Math.hypot(h.x, h.y) || 1;
				const ux = h.x / len;
				const uy = h.y / len;
				const off = 14 / zoom;
				const lx = hx + ux * off;
				const ly = hy + uy * off;
				const label = String(length);
				ctx.save();
				ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				const pad = 5 / zoom;
				const bw = ctx.measureText(label).width + pad * 2;
				const bh = 14 / zoom;
				ctx.fillStyle = hot ? "rgba(6, 23, 15, 0.95)" : "rgba(6, 23, 15, 0.88)";
				ctx.strokeStyle = hot ? "#7ee0ff" : "#3fc6ff";
				ctx.lineWidth = (hot ? 1.5 : 1) / zoom;
				ctx.beginPath();
				ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 3 / zoom);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = "#3fc6ff";
				ctx.beginPath();
				ctx.arc(lx, ly, 1.2 / zoom, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = "#7ee0ff";
				ctx.fillText(label, lx, ly);
				ctx.restore();
			}
			ctx.beginPath();
			ctx.moveTo(hx, hy - diamond);
			ctx.lineTo(hx + diamond, hy);
			ctx.lineTo(hx, hy + diamond);
			ctx.lineTo(hx - diamond, hy);
			ctx.closePath();
			ctx.fillStyle = hot ? "#7ee0ff" : "#0a0d0c";
			ctx.fill();
			ctx.strokeStyle = "#3fc6ff";
			ctx.lineWidth = 1.2 / zoom;
			ctx.stroke();
		}
		ctx.fillStyle = active?.index === i && active.arm === "anchor" ? "#3fc6ff" : "#0a0d0c";
		ctx.strokeStyle = "#3fc6ff";
		ctx.lineWidth = 1.2 / zoom;
		ctx.fillRect(ax - anchor / 2, ay - anchor / 2, anchor, anchor);
		ctx.strokeRect(ax - anchor / 2, ay - anchor / 2, anchor, anchor);
	}
	ctx.restore();
}
function isGradient(fill) {
	return typeof fill === "object" && fill !== null && fill.type === "linear";
}
function isText(n) {
	return n.kind === "text";
}
function isImage(n) {
	return n.kind === "image";
}
function isPath(n) {
	return n.kind === "path";
}
function isPaint(n) {
	return n.kind === "paint";
}
function isGroup(n) {
	return n.kind === "group";
}
function isBitmap(n) {
	return n.kind === "image" || n.kind === "paint";
}
function pt(x, y, inn, out, smooth = false) {
	return {
		x,
		y,
		in: inn ?? null,
		out: out ?? null,
		smooth
	};
}
function roundedRectPoints(w, h, radius) {
	const r = Math.max(0, Math.min(radius, w / 2, h / 2));
	if (r < .5) return [
		pt(0, 0),
		pt(w, 0),
		pt(w, h),
		pt(0, h)
	];
	const k = .5522847498 * r;
	return [
		pt(r, 0, null, {
			x: Math.min(k, (w - 2 * r) / 3),
			y: 0
		}, true),
		pt(w - r, 0, {
			x: -k,
			y: 0
		}, {
			x: k,
			y: 0
		}, true),
		pt(w, r, {
			x: 0,
			y: -k
		}, {
			x: 0,
			y: k
		}, true),
		pt(w, h - r, {
			x: 0,
			y: -k
		}, {
			x: 0,
			y: k
		}, true),
		pt(w - r, h, {
			x: k,
			y: 0
		}, {
			x: -k,
			y: 0
		}, true),
		pt(r, h, {
			x: k,
			y: 0
		}, {
			x: -k,
			y: 0
		}, true),
		pt(0, h - r, {
			x: 0,
			y: k
		}, {
			x: 0,
			y: -k
		}, true),
		pt(0, r, {
			x: 0,
			y: k
		}, {
			x: 0,
			y: -k
		}, true)
	];
}
function ellipsePoints(w, h) {
	const rx = w / 2;
	const ry = h / 2;
	const kx = .5522847498 * rx;
	const ky = .5522847498 * ry;
	return [
		pt(rx, 0, {
			x: -kx,
			y: 0
		}, {
			x: kx,
			y: 0
		}, true),
		pt(w, ry, {
			x: 0,
			y: -ky
		}, {
			x: 0,
			y: ky
		}, true),
		pt(rx, h, {
			x: kx,
			y: 0
		}, {
			x: -kx,
			y: 0
		}, true),
		pt(0, ry, {
			x: 0,
			y: ky
		}, {
			x: 0,
			y: -ky
		}, true)
	];
}
function polyPoints(w, h, sides, inner = 1) {
	const cx = w / 2;
	const cy = h / 2;
	const rx = w / 2;
	const ry = h / 2;
	const count = Math.max(3, sides);
	const pts = [];
	for (let i = 0; i < count; i++) {
		const a = i / count * Math.PI * 2 - Math.PI / 2;
		const r = inner;
		pts.push(pt(cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)));
	}
	return pts;
}
function starPoints(w, h, points) {
	const cx = w / 2;
	const cy = h / 2;
	const rx = w / 2;
	const ry = h / 2;
	const n = Math.max(3, points);
	const pts = [];
	for (let i = 0; i < n * 2; i++) {
		const a = i * Math.PI / n - Math.PI / 2;
		const r = i % 2 === 0 ? 1 : .4;
		pts.push(pt(cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)));
	}
	return pts;
}
function arrowPoints(w, h, headScale = 1) {
	const scale = Math.max(.35, Math.min(2.2, Number.isFinite(headScale) ? headScale : 1));
	const shaft = Math.max(2, h * .36);
	const mid = h / 2;
	const head = Math.max(8, Math.min(w * .38 * scale, w * .88, h * scale));
	const tip = w;
	const base = Math.max(0, w - head);
	return [
		pt(0, mid - shaft / 2),
		pt(base, mid - shaft / 2),
		pt(base, 0),
		pt(tip, mid),
		pt(base, h),
		pt(base, mid + shaft / 2),
		pt(0, mid + shaft / 2)
	];
}
function isConvertibleShape(n) {
	return n.kind === "rect" || n.kind === "ellipse" || n.kind === "line" || n.kind === "polygon" || n.kind === "star" || n.kind === "arrow";
}
function shapeContour(n) {
	switch (n.kind) {
		case "ellipse": return {
			points: ellipsePoints(n.w, n.h),
			closed: true
		};
		case "line": return {
			points: [pt(0, n.h / 2), pt(n.w, n.h / 2)],
			closed: false
		};
		case "polygon": return {
			points: polyPoints(n.w, n.h, n.sides ?? 6),
			closed: true
		};
		case "star": return {
			points: starPoints(n.w, n.h, n.sides ?? 5),
			closed: true
		};
		case "arrow": return {
			points: arrowPoints(n.w, n.h, n.headScale ?? 1),
			closed: true
		};
		default: return {
			points: roundedRectPoints(n.w, n.h, n.radius ?? 0),
			closed: true
		};
	}
}
function shapeToPathNode(n) {
	const { points, closed } = shapeContour(n);
	const node = pathNode({
		x: n.x,
		y: n.y,
		w: n.w,
		h: n.h,
		rotation: n.rotation,
		points,
		closed,
		fill: n.fill,
		stroke: n.stroke,
		strokeWidth: n.strokeWidth,
		opacity: n.opacity,
		blend: n.blend,
		name: n.name,
		visible: n.visible,
		locked: n.locked,
		shadow: n.shadow
	});
	node.id = n.id;
	node.linkId = n.linkId;
	node.href = n.href;
	return node;
}
function asEditablePath(n) {
	if (isPath(n)) return n;
	if (isConvertibleShape(n)) return shapeToPathNode(n);
	return null;
}
function degToRad(d) {
	return d * Math.PI / 180;
}
function rotatePoint(x, y, cx, cy, deg) {
	const r = degToRad(deg);
	const dx = x - cx;
	const dy = y - cy;
	return {
		x: cx + dx * Math.cos(r) - dy * Math.sin(r),
		y: cy + dx * Math.sin(r) + dy * Math.cos(r)
	};
}
function nodeCenter(n) {
	return {
		x: n.x + n.w / 2,
		y: n.y + n.h / 2
	};
}
function nodeCorners(n) {
	const c = nodeCenter(n);
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
	if (!n.rotation) return pts;
	return pts.map((p) => rotatePoint(p.x, p.y, c.x, c.y, n.rotation));
}
function pushLocalPathPts(out, ring) {
	for (const p of ring) {
		out.push({
			x: p.x,
			y: p.y
		});
		if (hasHandle(p.in)) out.push({
			x: p.x + p.in.x,
			y: p.y + p.in.y
		});
		if (hasHandle(p.out)) out.push({
			x: p.x + p.out.x,
			y: p.y + p.out.y
		});
	}
}
/** World-space samples used for crop bounds: box corners, or path/hole cubics. */
function nodeWorldSamples(n) {
	const c = nodeCenter(n);
	const locals = [];
	if (n.kind === "path") {
		pushLocalPathPts(locals, n.points);
		for (const hole of n.holes ?? []) pushLocalPathPts(locals, hole);
	}
	if (!locals.length) return nodeCorners(n);
	return locals.map((p) => {
		const wx = n.x + p.x;
		const wy = n.y + p.y;
		return n.rotation ? rotatePoint(wx, wy, c.x, c.y, n.rotation) : {
			x: wx,
			y: wy
		};
	});
}
function aabb(nodes) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const n of nodes) {
		const pad = Math.max(0, n.strokeWidth) / 2;
		for (const p of nodeWorldSamples(n)) {
			minX = Math.min(minX, p.x - pad);
			minY = Math.min(minY, p.y - pad);
			maxX = Math.max(maxX, p.x + pad);
			maxY = Math.max(maxY, p.y + pad);
		}
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
var DEFAULT_SHADOW = {
	color: "#000000",
	blur: 28,
	ox: 0,
	oy: 18,
	spread: 0,
	inset: false
};
function shadowSpread(shadow) {
	return shadow?.spread ?? DEFAULT_SHADOW.spread ?? 0;
}
function shadowInset(shadow) {
	return Boolean(shadow?.inset);
}
function cloneShadow(shadow) {
	if (!shadow) return null;
	return {
		color: shadow.color,
		blur: shadow.blur,
		ox: shadow.ox,
		oy: shadow.oy,
		spread: shadowSpread(shadow),
		inset: shadowInset(shadow)
	};
}
function shadowChipLabel(shadow) {
	if (!shadow) return "off";
	const spread = shadowSpread(shadow);
	const inset = shadowInset(shadow) ? " · in" : "";
	return `${shadow.color} · b${shadow.blur} · ${shadow.ox},${shadow.oy} · s${spread}${inset}`;
}
function shadowKey(shadow) {
	if (!shadow) return "off";
	return `on:${shadow.color}:${shadow.blur}:${shadow.ox}:${shadow.oy}:${shadowSpread(shadow)}:${shadowInset(shadow) ? "in" : "out"}`;
}
function shadowOxLabel(ox) {
	return `ox ${ox}`;
}
function shadowOyLabel(oy) {
	return `oy ${oy}`;
}
function stampShadowOx(shadow, ox) {
	return {
		...shadow ? cloneShadow(shadow) : { ...DEFAULT_SHADOW },
		ox
	};
}
function stampShadowOy(shadow, oy) {
	return {
		...shadow ? cloneShadow(shadow) : { ...DEFAULT_SHADOW },
		oy
	};
}
function stampShadowColor(shadow, color) {
	return {
		...shadow ? cloneShadow(shadow) : { ...DEFAULT_SHADOW },
		color
	};
}
function stampShadowBlur(shadow, blur) {
	return {
		...shadow ? cloneShadow(shadow) : { ...DEFAULT_SHADOW },
		blur
	};
}
function shadowOffsetChipLabel(axis, shadow) {
	const value = shadow ? shadow[axis] : DEFAULT_SHADOW[axis];
	return axis === "ox" ? shadowOxLabel(value) : shadowOyLabel(value);
}
function stampShadowOffset(shadow, axis, value) {
	return axis === "ox" ? stampShadowOx(shadow, value) : stampShadowOy(shadow, value);
}
function shadowSpreadLabel(spread) {
	return `s${spread ?? 0}`;
}
function shadowInsetLabel(inset) {
	return inset ? "inset" : "drop";
}
function stampShadowSpread(shadow, spread) {
	return {
		...shadow ? cloneShadow(shadow) : { ...DEFAULT_SHADOW },
		spread
	};
}
function stampShadowInset(shadow, inset) {
	return {
		...shadow ? cloneShadow(shadow) : { ...DEFAULT_SHADOW },
		inset
	};
}
/**
* Shared mapping for the artboard, PNG, and SVG.
* Spread fattens blur. Inset keeps the authored offset — the renderer
* clips with destination-in instead of flipping the drop.
*/
function canvasShadowParams(shadow) {
	const spread = Math.max(0, shadowSpread(shadow));
	return {
		color: shadow.color,
		blur: shadow.blur + spread,
		ox: shadow.ox,
		oy: shadow.oy,
		spread,
		inset: shadowInset(shadow)
	};
}
/** Extra crop pad (left/top/right/bottom) so drop shadows stay on the artboard. Inset is ignored. */
function shadowCropExtents(nodes) {
	let left = 0;
	let top = 0;
	let right = 0;
	let bottom = 0;
	for (const n of nodes) {
		if (!n.shadow || shadowInset(n.shadow)) continue;
		const p = canvasShadowParams(n.shadow);
		const halo = Math.max(0, p.blur);
		left = Math.max(left, halo + Math.max(0, -p.ox));
		right = Math.max(right, halo + Math.max(0, p.ox));
		top = Math.max(top, halo + Math.max(0, -p.oy));
		bottom = Math.max(bottom, halo + Math.max(0, p.oy));
	}
	return {
		left,
		top,
		right,
		bottom
	};
}
/** CSS box-shadow string that mirrors drop vs inset on the inspector chip. */
function shadowPreviewCss(shadow) {
	if (!shadow) return "none";
	const spread = shadowSpread(shadow);
	return `${shadowInset(shadow) ? "inset " : ""}${shadow.ox}px ${shadow.oy}px ${shadow.blur}px ${spread}px ${shadow.color}`;
}
/**
* Width of `text` with tracking applied between glyphs.
* `glyphWidth` must measure with letter-spacing off so we do not double-count
* when the canvas context also sets `ctx.letterSpacing`.
*/
function measureTracked(text, glyphWidth, letterSpacing = 0) {
	if (!text) return 0;
	const base = glyphWidth(text);
	if (text.length < 2 || !letterSpacing) return base;
	return base + letterSpacing * (text.length - 1);
}
function normalizeWrap(node) {
	return node.wrap !== false;
}
function normalizeValign(node) {
	return node.valign === "middle" || node.valign === "bottom" ? node.valign : "top";
}
/** Split a paragraph into lines that fit `maxWidth`. Empty input yields one empty line. */
function wrapParagraph(text, maxWidth, measure) {
	const width = Math.max(1, maxWidth);
	const raw = text.replace(/\r/g, "");
	if (raw === "") return [""];
	const tokens = raw.split(/(\s+)/);
	const lines = [];
	let current = "";
	const flush = () => {
		lines.push(current);
		current = "";
	};
	const pushChunk = (chunk) => {
		if (!chunk) return;
		const trial = current + chunk;
		if (!current || measure(trial) <= width) {
			current = trial;
			return;
		}
		flush();
		if (measure(chunk) <= width) {
			current = chunk;
			return;
		}
		let piece = "";
		for (const ch of chunk) {
			const next = piece + ch;
			if (piece && measure(next) > width) {
				lines.push(piece);
				piece = ch;
			} else piece = next;
		}
		current = piece;
	};
	for (const token of tokens) {
		if (token === "") continue;
		if (/^\s+$/.test(token)) {
			if (!current) continue;
			const trial = current + token;
			if (measure(trial) <= width) current = trial;
			else flush();
			continue;
		}
		pushChunk(token);
	}
	if (current || lines.length === 0) flush();
	return lines.map((l) => l.replace(/\s+$/, ""));
}
function layoutTextLines(node, measure) {
	const paragraphs = (node.uppercase ? node.text.toUpperCase() : node.text).split("\n");
	const lines = normalizeWrap(node) ? paragraphs.flatMap((p) => wrapParagraph(p, node.w, measure)) : paragraphs;
	const lineHeight = node.fontSize * (node.lineHeight || 1);
	const block = lines.length * lineHeight;
	const valign = normalizeValign(node);
	let startY = 0;
	if (valign === "middle") startY = (node.h - block) / 2;
	if (valign === "bottom") startY = node.h - block;
	return {
		lines,
		lineHeight,
		startY
	};
}
var BRUSHES = [
	{
		id: "ink",
		name: "Ink",
		hardness: .95,
		opacity: 1,
		spacing: .12,
		scatter: 0,
		grain: false,
		mix: "source-over"
	},
	{
		id: "pencil",
		name: "Pencil",
		hardness: .35,
		opacity: .35,
		spacing: .08,
		scatter: .6,
		grain: true,
		mix: "source-over"
	},
	{
		id: "marker",
		name: "Marker",
		hardness: .7,
		opacity: .55,
		spacing: .1,
		scatter: 0,
		grain: false,
		mix: "multiply"
	},
	{
		id: "airbrush",
		name: "Airbrush",
		hardness: .05,
		opacity: .18,
		spacing: .08,
		scatter: .2,
		grain: false,
		mix: "source-over"
	},
	{
		id: "watercolor",
		name: "Water",
		hardness: .12,
		opacity: .22,
		spacing: .14,
		scatter: .8,
		grain: true,
		mix: "multiply"
	},
	{
		id: "charcoal",
		name: "Charcoal",
		hardness: .25,
		opacity: .45,
		spacing: .1,
		scatter: 1.2,
		grain: true,
		mix: "source-over"
	},
	{
		id: "spray",
		name: "Spray",
		hardness: .2,
		opacity: .28,
		spacing: .16,
		scatter: 2.4,
		grain: true,
		mix: "source-over"
	},
	{
		id: "pixel",
		name: "Pixel",
		hardness: 1,
		opacity: 1,
		spacing: 1,
		scatter: 0,
		grain: false,
		mix: "source-over"
	},
	{
		id: "eraser",
		name: "Eraser",
		hardness: .85,
		opacity: 1,
		spacing: .12,
		scatter: 0,
		grain: false,
		mix: "destination-out"
	}
];
function brushById(id) {
	return BRUSHES.find((b) => b.id === id) ?? BRUSHES[0];
}
function dab(ctx, x, y, size, hardness, color, grain, tiltX = 0, tiltY = 0) {
	const r = size / 2;
	const tiltMag = Math.min(90, Math.hypot(tiltX, tiltY));
	const aspect = Math.max(.32, 1 - tiltMag / 90 * .62);
	const angle = Math.atan2(tiltY, tiltX);
	ctx.save();
	ctx.translate(x, y);
	if (tiltMag > 2) {
		ctx.rotate(angle);
		ctx.scale(1, aspect);
	}
	if (hardness >= .92) {
		ctx.beginPath();
		ctx.fillStyle = color;
		ctx.arc(0, 0, r, 0, Math.PI * 2);
		ctx.fill();
	} else {
		const g = ctx.createRadialGradient(0, 0, r * hardness, 0, 0, r);
		g.addColorStop(0, color);
		g.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.PI * 2);
		ctx.fill();
	}
	if (grain && r > 3) {
		ctx.globalAlpha *= .18;
		for (let i = 0; i < 6; i++) {
			const ox = (Math.random() - .5) * r;
			const oy = (Math.random() - .5) * r;
			ctx.fillStyle = color;
			ctx.fillRect(ox, oy, 1.2, 1.2);
		}
	}
	ctx.restore();
}
function strokeSegment(ctx, x0, y0, x1, y1, size, color, brush, opacity, tiltX = 0, tiltY = 0) {
	const dist = Math.hypot(x1 - x0, y1 - y0);
	const step = Math.max(1, size * brush.spacing);
	const n = Math.max(1, Math.ceil(dist / step));
	const tiltMag = Math.min(90, Math.hypot(tiltX, tiltY));
	const tiltAngle = Math.atan2(tiltY, tiltX);
	const dirX = Math.cos(tiltAngle);
	const dirY = Math.sin(tiltAngle);
	const perpX = -dirY;
	const perpY = dirX;
	const alongScale = .55 + tiltMag / 90 * 1.15;
	const acrossScale = Math.max(.12, 1 - tiltMag / 90 * .75);
	ctx.save();
	ctx.globalCompositeOperation = brush.mix;
	ctx.globalAlpha = opacity * brush.opacity;
	for (let i = 0; i <= n; i++) {
		const t = i / n;
		const scatterAmp = brush.scatter * (size * .15);
		let sx;
		let sy;
		if (tiltMag > 2 && brush.scatter > 0) {
			const along = (Math.random() - .5) * scatterAmp * alongScale;
			const across = (Math.random() - .5) * scatterAmp * acrossScale;
			sx = dirX * along + perpX * across;
			sy = dirY * along + perpY * across;
		} else {
			sx = (Math.random() - .5) * scatterAmp;
			sy = (Math.random() - .5) * scatterAmp;
		}
		const x = x0 + (x1 - x0) * t + sx;
		const y = y0 + (y1 - y0) * t + sy;
		if (brush.id === "pixel") {
			const p = Math.max(2, Math.round(size / 4) * 4);
			ctx.fillStyle = color;
			ctx.fillRect(Math.round(x / p) * p, Math.round(y / p) * p, p, p);
		} else dab(ctx, x, y, size, brush.hardness, color, brush.grain, tiltX, tiltY);
	}
	ctx.restore();
}
var DEFAULT_FILTERS = {
	brightness: 1,
	contrast: 1,
	saturate: 1,
	blur: 0
};
function normalizeFilters(filters) {
	return {
		brightness: filters?.brightness ?? DEFAULT_FILTERS.brightness,
		contrast: filters?.contrast ?? DEFAULT_FILTERS.contrast,
		saturate: filters?.saturate ?? DEFAULT_FILTERS.saturate,
		blur: filters?.blur ?? DEFAULT_FILTERS.blur
	};
}
function cloneFilters(filters) {
	return { ...normalizeFilters(filters) };
}
function filterKey(filters) {
	const f = normalizeFilters(filters);
	return `${f.brightness}:${f.contrast}:${f.saturate}:${f.blur}`;
}
function filterChipLabel(filters) {
	const f = normalizeFilters(filters);
	if (f.brightness === 1 && f.contrast === 1 && f.saturate === 1 && f.blur === 0) return "flat";
	const parts = [
		`B${Math.round(f.brightness * 100)}`,
		`C${Math.round(f.contrast * 100)}`,
		`S${Math.round(f.saturate * 100)}`
	];
	if (f.blur) parts.push(`R${f.blur}`);
	return parts.join(" ");
}
function clampUnit(n, fallback) {
	if (!Number.isFinite(n)) return fallback;
	return Math.min(2, Math.max(0, n));
}
/** CSS / canvas `filter` matching SVG export (brightness/contrast/saturate/blur). */
function cssFilterStyle(filters) {
	const f = normalizeFilters(filters);
	const b = clampUnit(f.brightness, 1);
	const c = clampUnit(f.contrast, 1);
	const s = clampUnit(f.saturate, 1);
	const blur = Number.isFinite(f.blur) ? Math.max(0, f.blur) : 0;
	if (b === 1 && c === 1 && s === 1 && blur === 0) return "";
	return `brightness(${b}) contrast(${c}) saturate(${s}) blur(${blur}px)`;
}
function normalizeCrop(crop) {
	if (!crop) return null;
	const w = Number.isFinite(crop.w) ? crop.w : 1;
	const h = Number.isFinite(crop.h) ? crop.h : 1;
	if (w <= 0 || h <= 0) return null;
	const x = Number.isFinite(crop.x) ? crop.x : 0;
	const y = Number.isFinite(crop.y) ? crop.y : 0;
	const nx = Math.min(.99, Math.max(0, x));
	const ny = Math.min(.99, Math.max(0, y));
	const nw = Math.min(1 - nx, Math.max(.01, w));
	const nh = Math.min(1 - ny, Math.max(.01, h));
	if (nx <= 1e-4 && ny <= 1e-4 && nw >= .999 && nh >= .999) return null;
	return {
		x: nx,
		y: ny,
		w: nw,
		h: nh
	};
}
function cropSourceRect(img, crop) {
	const nw = img.naturalWidth;
	const nh = img.naturalHeight;
	const c = normalizeCrop(crop);
	if (!c) return {
		sx: 0,
		sy: 0,
		sw: nw,
		sh: nh
	};
	return {
		sx: c.x * nw,
		sy: c.y * nh,
		sw: Math.max(1, c.w * nw),
		sh: Math.max(1, c.h * nh)
	};
}
function paintBakeSize(w, h) {
	return {
		w: Math.max(1, Math.round(Number.isFinite(w) ? w : 1)),
		h: Math.max(1, Math.round(Number.isFinite(h) ? h : 1))
	};
}
function paintNeedsBake(n, nextW, nextH) {
	if (n.kind !== "paint") return false;
	const size = paintBakeSize(nextW, nextH);
	const cur = paintBakeSize(n.w, n.h);
	if (normalizeCrop(n.crop)) return true;
	if (!n.bitmap) return false;
	return size.w !== cur.w || size.h !== cur.h;
}
function makeCanvas(w, h) {
	if (typeof OffscreenCanvas === "function") try {
		return new OffscreenCanvas(w, h);
	} catch {}
	if (typeof document !== "undefined" && document.createElement) {
		const c = document.createElement("canvas");
		c.width = w;
		c.height = h;
		return c;
	}
	return null;
}
function drawBaked(canvas, img, crop, tw, th) {
	const ctx = canvas.getContext("2d");
	if (!ctx) return false;
	const nw = Number(img.naturalWidth ?? img.width ?? 0);
	const nh = Number(img.naturalHeight ?? img.height ?? 0);
	if (nw < 1 || nh < 1) return false;
	const src = cropSourceRect({
		naturalWidth: nw,
		naturalHeight: nh
	}, crop);
	ctx.clearRect(0, 0, tw, th);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, tw, th);
	return true;
}
function canvasToDataUrl(canvas) {
	if ("toDataURL" in canvas && typeof canvas.toDataURL === "function") try {
		return canvas.toDataURL("image/png");
	} catch {
		return null;
	}
	return null;
}
/** Resample a paint bitmap into the node box. Crop is flattened into pixels. */
function bakePaintNode(n, nextW = n.w, nextH = n.h) {
	const size = paintBakeSize(nextW, nextH);
	const crop = normalizeCrop(n.crop);
	if (!n.bitmap) return {
		...n,
		w: nextW,
		h: nextH,
		crop: null
	};
	const canvas = makeCanvas(size.w, size.h);
	if (!canvas || typeof Image === "undefined") return {
		...n,
		w: nextW,
		h: nextH
	};
	const img = new Image();
	img.src = n.bitmap;
	if (img.complete && (img.naturalWidth || img.width)) {
		if (!drawBaked(canvas, img, crop, size.w, size.h)) return {
			...n,
			w: nextW,
			h: nextH
		};
		const url = canvasToDataUrl(canvas);
		if (!url) return {
			...n,
			w: nextW,
			h: nextH
		};
		return {
			...n,
			w: nextW,
			h: nextH,
			bitmap: url,
			crop: null
		};
	}
	return {
		...n,
		w: nextW,
		h: nextH
	};
}
function bakePaintIfSized(n, patch) {
	const w = patch.w ?? n.w;
	const h = patch.h ?? n.h;
	const merged = {
		...n,
		...patch
	};
	if (paintNeedsBake(n, w, h) || n.crop && (patch.w != null || patch.h != null)) return bakePaintNode(merged, w, h);
	return merged;
}
function childrenOf(nodes, parentId) {
	return nodes.filter((n) => n.parentId === parentId);
}
function descendantIds(nodes, rootId) {
	const out = [];
	const walk = (id) => {
		for (const child of childrenOf(nodes, id)) {
			out.push(child.id);
			walk(child.id);
		}
	};
	walk(rootId);
	return out;
}
function unionBounds(nodes) {
	if (!nodes.length) return null;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const n of nodes) {
		minX = Math.min(minX, n.x);
		minY = Math.min(minY, n.y);
		maxX = Math.max(maxX, n.x + n.w);
		maxY = Math.max(maxY, n.y + n.h);
	}
	return {
		x: minX,
		y: minY,
		w: maxX - minX,
		h: maxY - minY
	};
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
function uniq(xs, eps = .5) {
	const out = [];
	for (const x of [...xs].sort((a, b) => a - b)) if (!out.length || Math.abs(out[out.length - 1] - x) > eps) out.push(x);
	return out;
}
function overlap1d(a0, a1, b0, b1) {
	return Math.min(a1, b1) - Math.max(a0, b0);
}
/** Axis-aligned world bounds of a node, rotation-aware via corner transform. */
function nodeWorldAabb(n) {
	return aabb([n]);
}
/**
* After a snap delta is applied, measure gaps from the moving box to siblings
* and artboard edges that share an overlap and sit on a live guide.
*/
function spacingTicks(moving, siblings, artboard, guides) {
	const ticks = [];
	const gx = new Set((guides.x ?? []).map((n) => Math.round(n * 10) / 10));
	const gy = new Set((guides.y ?? []).map((n) => Math.round(n * 10) / 10));
	const onX = (v) => gx.size === 0 || gx.has(Math.round(v * 10) / 10) || [...gx].some((g) => Math.abs(g - v) < .6);
	const onY = (v) => gy.size === 0 || gy.has(Math.round(v * 10) / 10) || [...gy].some((g) => Math.abs(g - v) < .6);
	const frames = [
		{
			x: 0,
			y: 0,
			w: 0,
			h: artboard.height
		},
		{
			x: artboard.width,
			y: 0,
			w: 0,
			h: artboard.height
		},
		...siblings
	];
	for (const s of frames) {
		const ovY = overlap1d(moving.y, moving.y + moving.h, s.y, s.y + s.h);
		if (ovY <= 1) continue;
		const mid = Math.max(moving.y, s.y) + ovY / 2;
		if (s.x + s.w <= moving.x + .5) {
			const a = s.x + s.w;
			const b = moving.x;
			if (b - a > .5 && (onX(a) || onX(b))) ticks.push({
				axis: "x",
				a,
				b,
				mid,
				size: b - a
			});
		} else if (moving.x + moving.w <= s.x + .5) {
			const a = moving.x + moving.w;
			const b = s.x;
			if (b - a > .5 && (onX(a) || onX(b))) ticks.push({
				axis: "x",
				a,
				b,
				mid,
				size: b - a
			});
		}
	}
	const stacks = [
		{
			x: 0,
			y: 0,
			w: artboard.width,
			h: 0
		},
		{
			x: 0,
			y: artboard.height,
			w: artboard.width,
			h: 0
		},
		...siblings
	];
	for (const s of stacks) {
		const ovX = overlap1d(moving.x, moving.x + moving.w, s.x, s.x + s.w);
		if (ovX <= 1) continue;
		const mid = Math.max(moving.x, s.x) + ovX / 2;
		if (s.y + s.h <= moving.y + .5) {
			const a = s.y + s.h;
			const b = moving.y;
			if (b - a > .5 && (onY(a) || onY(b))) ticks.push({
				axis: "y",
				a,
				b,
				mid,
				size: b - a
			});
		} else if (moving.y + moving.h <= s.y + .5) {
			const a = moving.y + moving.h;
			const b = s.y;
			if (b - a > .5 && (onY(a) || onY(b))) ticks.push({
				axis: "y",
				a,
				b,
				mid,
				size: b - a
			});
		}
	}
	ticks.sort((p, q) => p.size - q.size);
	const kept = [];
	for (const t of ticks) {
		if (!kept.some((k) => k.axis === t.axis && Math.abs(k.a - t.a) < 1 && Math.abs(k.b - t.b) < 1)) kept.push(t);
		if (kept.length >= 6) break;
	}
	return kept;
}
/**
* Snap a moving selection to the artboard and unselected siblings.
* Aligns left/center/right and top/middle/bottom, plus equal-gap spacing
* against neighboring sibling boxes.
*/
function smartSnap(moving, others, artboard, threshold = 8, extra) {
	if (!moving.length) return {
		dx: 0,
		dy: 0,
		guides: {
			x: [],
			y: [],
			spaces: []
		}
	};
	const box = aabb(moving);
	const m = edges(box);
	const siblingBoxes = others.filter((n) => n.visible).map(nodeWorldAabb);
	const xs = [
		0,
		artboard.width / 2,
		artboard.width,
		...extra?.x ?? []
	];
	const ys = [
		0,
		artboard.height / 2,
		artboard.height,
		...extra?.y ?? []
	];
	for (const b of siblingBoxes) {
		const e = edges(b);
		xs.push(e.l, e.c, e.r);
		ys.push(e.t, e.m, e.b);
	}
	const xCands = [];
	const yCands = [];
	for (const tx of xs) for (const my of [
		m.l,
		m.c,
		m.r
	]) xCands.push({
		delta: tx - my,
		dist: Math.abs(tx - my),
		line: tx
	});
	for (const ty of ys) for (const my of [
		m.t,
		m.m,
		m.b
	]) yCands.push({
		delta: ty - my,
		dist: Math.abs(ty - my),
		line: ty
	});
	const sortedX = [...siblingBoxes].sort((a, b) => a.x - b.x);
	const sortedY = [...siblingBoxes].sort((a, b) => a.y - b.y);
	for (let i = 0; i < sortedX.length; i++) {
		const a = sortedX[i];
		const ar = a.x + a.w;
		for (let j = i + 1; j < sortedX.length; j++) {
			const b = sortedX[j];
			const gap = b.x - ar;
			if (gap <= 0) continue;
			xCands.push({
				delta: a.x - gap - box.w - box.x,
				dist: Math.abs(a.x - gap - box.w - box.x),
				line: a.x,
				gap
			});
			xCands.push({
				delta: ar + gap - box.x,
				dist: Math.abs(ar + gap - box.x),
				line: ar + gap,
				gap
			});
			xCands.push({
				delta: b.x + b.w + gap - box.x,
				dist: Math.abs(b.x + b.w + gap - box.x),
				line: b.x + b.w,
				gap
			});
		}
		xCands.push({
			delta: a.x - box.w - box.x,
			dist: Math.abs(a.x - box.w - box.x),
			line: a.x
		});
		xCands.push({
			delta: ar - box.x,
			dist: Math.abs(ar - box.x),
			line: ar
		});
	}
	for (let i = 0; i < sortedY.length; i++) {
		const a = sortedY[i];
		const ab = a.y + a.h;
		for (let j = i + 1; j < sortedY.length; j++) {
			const b = sortedY[j];
			const gap = b.y - ab;
			if (gap <= 0) continue;
			yCands.push({
				delta: a.y - gap - box.h - box.y,
				dist: Math.abs(a.y - gap - box.h - box.y),
				line: a.y,
				gap
			});
			yCands.push({
				delta: ab + gap - box.y,
				dist: Math.abs(ab + gap - box.y),
				line: ab + gap,
				gap
			});
			yCands.push({
				delta: b.y + b.h + gap - box.y,
				dist: Math.abs(b.y + b.h + gap - box.y),
				line: b.y + b.h,
				gap
			});
		}
		yCands.push({
			delta: a.y - box.h - box.y,
			dist: Math.abs(a.y - box.h - box.y),
			line: a.y
		});
		yCands.push({
			delta: ab - box.y,
			dist: Math.abs(ab - box.y),
			line: ab
		});
	}
	let bestX = threshold + 1;
	let dx = 0;
	let gapX = null;
	const gx = [];
	for (const c of xCands) if (c.dist < bestX - .01) {
		bestX = c.dist;
		dx = c.delta;
		gx.length = 0;
		gx.push(c.line);
		gapX = c.gap ?? null;
	} else if (Math.abs(c.dist - bestX) <= .01 && c.dist <= threshold) {
		gx.push(c.line);
		if (gapX == null && c.gap != null) gapX = c.gap;
	}
	let bestY = threshold + 1;
	let dy = 0;
	let gapY = null;
	const gy = [];
	for (const c of yCands) if (c.dist < bestY - .01) {
		bestY = c.dist;
		dy = c.delta;
		gy.length = 0;
		gy.push(c.line);
		gapY = c.gap ?? null;
	} else if (Math.abs(c.dist - bestY) <= .01 && c.dist <= threshold) {
		gy.push(c.line);
		if (gapY == null && c.gap != null) gapY = c.gap;
	}
	const guides = {
		x: bestX <= threshold ? uniq(gx) : [],
		y: bestY <= threshold ? uniq(gy) : []
	};
	guides.spaces = spacingTicks({
		x: box.x + (bestX <= threshold ? dx : 0),
		y: box.y + (bestY <= threshold ? dy : 0),
		w: box.w,
		h: box.h
	}, siblingBoxes, artboard, guides);
	const equalGaps = [];
	if (bestX <= threshold && gapX != null) equalGaps.push({
		axis: "x",
		size: gapX
	});
	if (bestY <= threshold && gapY != null) equalGaps.push({
		axis: "y",
		size: gapY
	});
	if (equalGaps.length) {
		guides.equalGaps = equalGaps;
		guides.spaces = (guides.spaces ?? []).filter((t) => equalGaps.some((g) => g.axis === t.axis && Math.abs(g.size - t.size) < .75));
	}
	return {
		dx: bestX <= threshold ? dx : 0,
		dy: bestY <= threshold ? dy : 0,
		guides
	};
}
function groupBox(nodes, groupId) {
	const g = nodes.find((n) => n.id === groupId);
	if (!g || !isGroup(g)) return null;
	const kids = [];
	for (const id of descendantIds(nodes, groupId)) {
		const n = nodes.find((node) => node.id === id);
		if (n && !isGroup(n)) kids.push(n);
	}
	const union = kids.length ? unionBounds(kids) : {
		x: g.x,
		y: g.y,
		w: g.w,
		h: g.h
	};
	if (!union) return {
		x: g.x,
		y: g.y,
		w: Math.max(1, g.w),
		h: Math.max(1, g.h)
	};
	return union;
}
function groupTransformIds(nodes, groupId) {
	return [groupId, ...descendantIds(nodes, groupId)];
}
function translateNest(nodes, groupId, dx, dy) {
	if (!dx && !dy) return nodes;
	const ids = new Set(groupTransformIds(nodes, groupId));
	return nodes.map((n) => ids.has(n.id) ? {
		...n,
		x: n.x + dx,
		y: n.y + dy
	} : n);
}
function formatStep(n) {
	const rounded = Math.round(n * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}
/** Arrow-key copy: one group moves the nest; mixed selections expand like a drag. */
function nudgeSelection(nodes, selectedIds, dx, dy) {
	if (!dx && !dy || !selectedIds.length) return nodes;
	const byId = new Map(nodes.map((n) => [n.id, n]));
	const selected = selectedIds.map((id) => byId.get(id)).filter((n) => n != null && !n.locked);
	if (!selected.length) return nodes;
	if (selected.length === 1 && isGroup(selected[0])) return translateNest(nodes, selected[0].id, dx, dy);
	const expanded = expandMovePlaces(nodes, selected.map((n) => ({
		id: n.id,
		x: n.x + dx,
		y: n.y + dy
	})));
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
function nudgeStatus(dx, dy, group, snapped = false, equalGaps = []) {
	const parts = [];
	if (dx) parts.push(`${formatStep(Math.abs(dx))} px ${dx < 0 ? "left" : "right"}`);
	if (dy) parts.push(`${formatStep(Math.abs(dy))} px ${dy < 0 ? "up" : "down"}`);
	const motion = parts.join(" · ");
	const gaps = equalGaps.map((g) => `${formatStep(g.size)} px ${g.axis === "x" ? "across" : "down"}`).join(" · ");
	const snap = gaps ? ` · snapped to equal gap ${gaps}` : snapped ? " · snapped to guide" : "";
	return group ? `Nest nudged ${motion} · group moved as one${snap}` : `Nudged ${motion}${snap}`;
}
var emptyGuides = () => ({
	x: [],
	y: [],
	spaces: []
});
/**
* A drag snaps when the box is within threshold. Keyboard steps are smaller than
* that window, so a guide would trap the nest. If the snap cancels the step,
* the nest was already on the line — leave it so the next arrow can depart.
*/
function releaseSnapAxis(step, snapDelta) {
	if (Math.abs(snapDelta) < .05) return {
		delta: step,
		held: false
	};
	const next = step + snapDelta;
	if (Math.abs(step) > .01 && Math.abs(next) < .05) return {
		delta: step,
		held: false
	};
	return {
		delta: next,
		held: true
	};
}
/** Same artboard, sibling, and ruler-guide snap as a drag. Alt skips this. */
function keyboardSnapNudge(nodes, selectedIds, dx, dy, artboard, extra, threshold = 6) {
	const byId = new Map(nodes.map((n) => [n.id, n]));
	const selected = selectedIds.map((id) => byId.get(id)).filter((n) => n != null && !n.locked);
	if (!selected.length || !dx && !dy) return {
		dx,
		dy,
		guides: emptyGuides(),
		snapped: false
	};
	const exclude = /* @__PURE__ */ new Set();
	let moving;
	if (selected.length === 1 && isGroup(selected[0])) {
		const box = groupBox(nodes, selected[0].id);
		for (const id of groupTransformIds(nodes, selected[0].id)) exclude.add(id);
		moving = box ? [{
			...selected[0],
			x: box.x,
			y: box.y,
			w: box.w,
			h: box.h,
			rotation: 0
		}] : [selected[0]];
	} else {
		for (const n of selected) {
			exclude.add(n.id);
			if (isGroup(n)) for (const id of descendantIds(nodes, n.id)) exclude.add(id);
		}
		moving = selected;
	}
	const others = nodes.filter((n) => n.visible && !exclude.has(n.id) && !isGroup(n));
	const hit = smartSnap(moving.map((n) => ({
		...n,
		x: n.x + dx,
		y: n.y + dy
	})), others, artboard, threshold, extra);
	const x = releaseSnapAxis(dx, hit.dx);
	const y = releaseSnapAxis(dy, hit.dy);
	const equalGaps = (hit.guides.equalGaps ?? []).filter((g) => g.axis === "x" && x.held || g.axis === "y" && y.held);
	const spaces = (hit.guides.spaces ?? []).filter((t) => {
		if (t.axis === "x" && !x.held) return false;
		if (t.axis === "y" && !y.held) return false;
		if (!equalGaps.length) return true;
		return equalGaps.some((g) => g.axis === t.axis && Math.abs(g.size - t.size) < .75);
	});
	const guides = {
		x: x.held ? hit.guides.x : [],
		y: y.held ? hit.guides.y : [],
		spaces,
		equalGaps
	};
	return {
		dx: x.delta,
		dy: y.delta,
		guides,
		snapped: x.held || y.held
	};
}
var nudgeCue = null;
var equalGapHold = [];
var equalGapListeners = /* @__PURE__ */ new Set();
function publishEqualGapHold(next) {
	if (next.length === equalGapHold.length && next.every((g, i) => g.axis === equalGapHold[i]?.axis && g.size === equalGapHold[i]?.size)) return;
	equalGapHold = next;
	for (const fn of equalGapListeners) fn();
}
function setNudgeCue(next) {
	nudgeCue = next;
	const gaps = next?.guides?.equalGaps ?? [];
	publishEqualGapHold(gaps.length ? gaps.map((g) => ({
		axis: g.axis,
		size: g.size
	})) : []);
}
function getNudgeCue() {
	return nudgeCue;
}
function expandMovePlaces(nodes, orig) {
	const byId = new Map(nodes.map((n) => [n.id, n]));
	const extra = [];
	const seen = new Set(orig.map((o) => o.id));
	for (const o of orig) {
		const n = byId.get(o.id);
		if (!n || !isGroup(n)) continue;
		const dx = o.x - n.x;
		const dy = o.y - n.y;
		for (const id of descendantIds(nodes, n.id)) {
			if (seen.has(id)) continue;
			const child = byId.get(id);
			if (!child) continue;
			seen.add(id);
			extra.push({
				id,
				x: child.x + dx,
				y: child.y + dy
			});
		}
	}
	return [...orig, ...extra];
}
/** Canvas / inspector status strip (path inspector Tab exit, etc). */
var status = null;
var held = false;
var listeners = /* @__PURE__ */ new Set();
function emit() {
	for (const fn of listeners) fn();
}
function getStudioStatus() {
	return status;
}
function isHeldStudioStatus() {
	return held && status != null;
}
function setStudioStatus(next, opts) {
	if (next == null && held) return;
	status = next;
	held = Boolean(next && opts?.hold);
	emit();
}
/** Keep until the next inspector action — tool-hint refresh must not wipe it. */
function holdStudioStatus(next) {
	setStudioStatus(next, { hold: true });
}
function releaseStudioStatus() {
	if (!held && status == null) return;
	status = null;
	held = false;
	emit();
}
function subscribeStudioStatus(fn) {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}
function descendantsOf(nodes, parentId) {
	const out = [];
	const walk = (id) => {
		for (const n of nodes) if (n.parentId === id) {
			out.push(n);
			walk(n.id);
		}
	};
	walk(parentId);
	return out;
}
function withDescendants(nodes, ids) {
	const set = new Set(ids);
	for (const id of [...set]) for (const d of descendantsOf(nodes, id)) set.add(d.id);
	return set;
}
function flattenLayers(nodes) {
	const byParent = /* @__PURE__ */ new Map();
	for (const n of nodes) {
		const key = n.parentId;
		const list = byParent.get(key) ?? [];
		list.push(n);
		byParent.set(key, list);
	}
	const rows = [];
	const walk = (parentId, depth) => {
		const kids = byParent.get(parentId);
		if (!kids) return;
		for (const n of [...kids].reverse()) {
			rows.push({
				node: n,
				depth
			});
			if (isGroup(n) && n.collapsed) continue;
			walk(n.id, depth + 1);
		}
	};
	walk(void 0, 0);
	return rows;
}
function makeGroup(nodes, memberIds) {
	const unique = [...new Set(memberIds)];
	if (unique.length < 2) return null;
	const members = nodes.filter((n) => unique.includes(n.id));
	if (members.length < 2) return null;
	if (new Set(members.map((n) => n.parentId)).size > 1) return null;
	const parentId = members[0]?.parentId;
	const leaves = members.filter((n) => !isGroup(n));
	const box = aabb(leaves.length ? leaves : members);
	const group = {
		id: uid("gp"),
		name: "Group",
		kind: "group",
		x: box.x,
		y: box.y,
		w: box.w,
		h: box.h,
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
		lineCap: "round",
		lineJoin: "round",
		miterLimit: 4,
		radius: 0,
		shadow: null,
		parentId,
		collapsed: false
	};
	const memberSet = new Set(unique);
	const next = nodes.map((n) => memberSet.has(n.id) ? {
		...n,
		parentId: group.id
	} : n);
	const firstIdx = next.findIndex((n) => memberSet.has(n.id));
	const insertAt = firstIdx < 0 ? next.length : firstIdx;
	next.splice(insertAt, 0, group);
	return {
		nodes: next,
		groupId: group.id
	};
}
function ungroup(nodes, groupIds) {
	const drop = new Set(groupIds.filter((id) => nodes.some((n) => n.id === id && isGroup(n))));
	if (!drop.size) return nodes;
	return nodes.filter((n) => !drop.has(n.id)).map((n) => {
		if (n.parentId && drop.has(n.parentId)) {
			const g = nodes.find((x) => x.id === n.parentId);
			return {
				...n,
				parentId: g?.parentId
			};
		}
		return n;
	});
}
function ancestorIds(nodes, id) {
	const byId = new Map(nodes.map((n) => [n.id, n]));
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	let cur = byId.get(id);
	while (cur?.parentId && !seen.has(cur.parentId)) {
		seen.add(cur.parentId);
		out.push(cur.parentId);
		cur = byId.get(cur.parentId);
	}
	return out;
}
function movingRoots(nodes, ids) {
	const idset = new Set(ids);
	return nodes.filter((n) => idset.has(n.id) && !ancestorIds(nodes, n.id).some((a) => idset.has(a)));
}
function subtreeEnd(nodes, id) {
	const desc = new Set(descendantsOf(nodes, id).map((n) => n.id));
	let end = nodes.findIndex((n) => n.id === id);
	nodes.forEach((n, i) => {
		if (desc.has(n.id) && i > end) end = i;
	});
	return end;
}
/** A group cannot land inside itself or a descendant. Sibling drops need a real anchor. */
function layerDropLegal(nodes, ids, drop) {
	const moving = movingRoots(nodes, ids);
	if (!moving.length) return false;
	const movingIds = new Set(moving.map((n) => n.id));
	if (drop.mode === "into") {
		if (movingIds.has(drop.groupId)) return false;
		const group = nodes.find((n) => n.id === drop.groupId);
		if (!group || !isGroup(group)) return false;
		if (moving.some((m) => ancestorIds(nodes, group.id).includes(m.id))) return false;
		return true;
	}
	if (movingIds.has(drop.anchorId)) return false;
	const anchor = nodes.find((n) => n.id === drop.anchorId);
	if (!anchor) return false;
	if (moving.some((m) => ancestorIds(nodes, anchor.id).includes(m.id))) return false;
	return true;
}
/** Move layer roots in the list. Into a group sets parentId. Sibling drops keep the anchor parent. */
function applyLayerDrop(nodes, ids, drop) {
	if (!layerDropLegal(nodes, ids, drop)) return null;
	const moving = movingRoots(nodes, ids);
	const movingIds = new Set(moving.map((n) => n.id));
	let parentId;
	if (drop.mode === "into") parentId = drop.groupId;
	else parentId = nodes.find((n) => n.id === drop.anchorId)?.parentId;
	const rest = nodes.filter((n) => !movingIds.has(n.id));
	const patched = moving.map((n) => ({
		...n,
		parentId
	}));
	let index = rest.length;
	if (drop.mode === "into") index = subtreeEnd(rest, drop.groupId) + 1;
	else {
		const anchorAt = rest.findIndex((n) => n.id === drop.anchorId);
		if (anchorAt < 0) return null;
		index = drop.mode === "before" ? subtreeEnd(rest, drop.anchorId) + 1 : anchorAt;
	}
	if (index < 0) index = 0;
	if (index > rest.length) index = rest.length;
	const next = rest.slice();
	next.splice(index, 0, ...patched);
	return next;
}
/** Visual up is in front (later in the node array) among siblings. */
function nudgeLayer(nodes, id, dir) {
	const node = nodes.find((n) => n.id === id);
	if (!node) return null;
	const siblings = nodes.filter((n) => n.parentId === node.parentId);
	const idx = siblings.findIndex((n) => n.id === id);
	const other = dir === "up" ? siblings[idx + 1] : siblings[idx - 1];
	if (!other) return null;
	const a = nodes.findIndex((n) => n.id === id);
	const b = nodes.findIndex((n) => n.id === other.id);
	if (a < 0 || b < 0) return null;
	const next = nodes.slice();
	const tmp = next[a];
	next[a] = next[b];
	next[b] = tmp;
	return next;
}
/** Reverse relative stacking order of selected layers that share a parent.
* Unselected siblings stay put. Selected among themselves reverse (later becomes earlier).
* Returns null if nothing changed.
*/
function reverseSelectedStacking(nodes, ids) {
	if (!ids || ids.length < 2) return null;
	const selected = new Set(ids);
	const byParent = /* @__PURE__ */ new Map();
	for (const n of nodes) if (selected.has(n.id)) {
		const key = n.parentId;
		const list = byParent.get(key) ?? [];
		list.push(n);
		byParent.set(key, list);
	}
	let changed = false;
	const next = nodes.slice();
	for (const group of byParent.values()) {
		if (group.length < 2) continue;
		const positions = [];
		for (const n of group) {
			const p = next.findIndex((x) => x.id === n.id);
			if (p < 0) continue;
			positions.push(p);
		}
		if (positions.length < 2) continue;
		positions.sort((a, b) => a - b);
		const reversed = [...group].reverse();
		for (let i = 0; i < positions.length; i++) next[positions[i]] = reversed[i];
		changed = true;
	}
	return changed ? next : null;
}
function sameSet(a, b) {
	const other = new Set(b);
	if (a.length !== other.size) return false;
	return a.every((id) => other.has(id));
}
function visibleIds(nodes) {
	return nodes.filter((n) => n.visible).map((n) => n.id);
}
function restoreFromSnapshot(nodes, snapshot) {
	return nodes.map((n) => ({
		...n,
		visible: snapshot[n.id] ?? n.visible
	}));
}
/**
* Isolate `keepIds` (hide everything else).
* Empty `keepIds` restores the snapshot (Show all).
* A second call with the same keep set also restores.
* A different keep set while isolated restores first, then isolates the new set
* so hidden layers from the first pass do not stay hidden.
*/
function applyIsolate(nodes, keepIds, snapshot) {
	const allIds = new Set(nodes.map((n) => n.id));
	if (keepIds.length === 0 || snapshot != null && keepIds.length === allIds.size && keepIds.every((id) => allIds.has(id))) {
		if (!snapshot) return {
			nodes,
			isolateSnapshot: null
		};
		return {
			isolateSnapshot: null,
			nodes: restoreFromSnapshot(nodes, snapshot)
		};
	}
	if (snapshot && sameSet(keepIds, visibleIds(nodes))) return {
		isolateSnapshot: null,
		nodes: restoreFromSnapshot(nodes, snapshot)
	};
	const base = snapshot ? restoreFromSnapshot(nodes, snapshot) : nodes;
	const snap = snapshot ? { ...snapshot } : {};
	if (!snapshot) for (const n of base) snap[n.id] = n.visible;
	else for (const n of base) if (!(n.id in snap)) snap[n.id] = n.visible;
	const keep = new Set(keepIds);
	return {
		isolateSnapshot: snap,
		nodes: base.map((n) => ({
			...n,
			visible: keep.has(n.id)
		}))
	};
}
var useDesign = create((set, get) => ({
	index: [],
	doc: null,
	selection: [],
	tool: "select",
	viewport: {
		x: 0,
		y: 0,
		zoom: .4
	},
	past: [],
	future: [],
	grid: true,
	snap: true,
	nudgeHold: 0,
	rulers: true,
	safeArea: false,
	brand: loadBrand(),
	brush: {
		id: "ink",
		size: 16,
		opacity: 1,
		hardness: .95,
		spacing: .12,
		scatter: 0,
		color: "#0a0d0c",
		symmetry: "none"
	},
	color: "#0a0d0c",
	editingText: null,
	dirty: false,
	clipboard: [],
	opacityClipboard: null,
	pasteCount: 1,
	present: false,
	viewIntent: null,
	paletteOpen: false,
	printMarks: false,
	pathEditHit: null,
	pathPointSelection: [],
	showTangentLengths: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-tangent-lengths") !== "0",
	showPerGlyphTicks: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-per-glyph-ticks") !== "0",
	showWeightTickThickness: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-weight-tick-thickness") !== "0",
	showGlyphDensityScale: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-glyph-density-scale") !== "0",
	reverseTypeLeading: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-reverse-type-leading") === "1",
	typeBaseline: (() => {
		if (typeof localStorage === "undefined") return "hanging";
		const raw = localStorage.getItem("voice-design-type-baseline");
		return raw === "alphabetic" || raw === "middle" ? raw : "hanging";
	})(),
	glyphDensityScaleFactor: (() => {
		if (typeof localStorage === "undefined") return 1;
		const raw = localStorage.getItem("voice-design-glyph-density-factor");
		const n = raw == null ? 1 : Number(raw);
		return Number.isFinite(n) ? Math.max(.4, Math.min(2.5, n)) : 1;
	})(),
	mirrorPoints: (() => {
		if (typeof localStorage === "undefined") return {};
		try {
			const raw = localStorage.getItem("voice-design-mirror-points");
			return raw ? JSON.parse(raw) : {};
		} catch {
			return {};
		}
	})(),
	booleanPreview: null,
	guideSelection: [],
	guideLooks: {
		x: {},
		y: {}
	},
	isolateSnapshot: null,
	alignTarget: "selection",
	strokeGhost: null,
	typeGhost: null,
	pathOrderGhost: null,
	pathPointAlignPreview: null,
	pathPointNumericPreview: null,
	pathPointHandleNumericPreview: null,
	hydrate: () => set({
		index: loadIndex(),
		brand: loadBrand()
	}),
	open: (id) => {
		const doc = loadDoc(id);
		if (doc) set({
			doc,
			selection: [],
			dirty: false,
			present: get().present,
			isolateSnapshot: null
		});
	},
	fromTemplate: (templateId) => {
		const doc = instantiateTemplate(templateId);
		saveDoc(doc);
		set({
			doc,
			dirty: false,
			index: loadIndex(),
			isolateSnapshot: null
		});
		return doc.id;
	},
	fromBlank: (formatId) => {
		const doc = blankDocument(formatId, `Untitled ${formatById(formatId).label}`);
		saveDoc(doc);
		set({
			doc,
			dirty: false,
			index: loadIndex(),
			isolateSnapshot: null
		});
		return doc.id;
	},
	save: () => {
		const { doc } = get();
		if (!doc) return;
		const next = {
			...doc,
			updatedAt: Date.now()
		};
		saveDoc(next);
		set({
			doc: next,
			dirty: false,
			index: loadIndex()
		});
	},
	setNotes: (notes) => {
		const { doc } = get();
		if (!doc) return;
		const next = {
			...doc,
			notes,
			updatedAt: Date.now()
		};
		saveDoc(next);
		set({
			doc: next,
			dirty: false,
			index: loadIndex()
		});
	},
	setPresent: (present) => set({ present }),
	setShowTangentLengths: (v) => {
		if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-tangent-lengths", v ? "1" : "0");
		set({ showTangentLengths: v });
	},
	setShowPerGlyphTicks: (v) => {
		if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-per-glyph-ticks", v ? "1" : "0");
		set({ showPerGlyphTicks: v });
	},
	setShowWeightTickThickness: (v) => {
		if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-weight-tick-thickness", v ? "1" : "0");
		set({ showWeightTickThickness: v });
	},
	setShowGlyphDensityScale: (v) => {
		if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-glyph-density-scale", v ? "1" : "0");
		set({ showGlyphDensityScale: v });
	},
	setReverseTypeLeading: (v) => {
		if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-reverse-type-leading", v ? "1" : "0");
		set({ reverseTypeLeading: v });
	},
	setTypeBaseline: (v) => {
		if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-type-baseline", v);
		set({ typeBaseline: v });
	},
	setGlyphDensityScaleFactor: (v) => {
		const next = Math.max(.4, Math.min(2.5, Number.isFinite(v) ? v : 1));
		if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-glyph-density-factor", String(next));
		set({ glyphDensityScaleFactor: next });
	},
	setMirrorPoint: (key, v) => {
		const next = {
			...get().mirrorPoints || {},
			[key]: v
		};
		if (typeof localStorage !== "undefined") try {
			localStorage.setItem("voice-design-mirror-points", JSON.stringify(next));
		} catch {}
		set({ mirrorPoints: next });
	},
	togglePresent: () => set({
		present: !get().present,
		paletteOpen: false
	}),
	makeCampaign: () => {
		const { doc } = get();
		if (!doc) return [];
		get().save();
		const live = get().doc;
		const cid = live.campaignId ?? uid("camp");
		const named = {
			...live,
			campaignId: cid,
			updatedAt: Date.now()
		};
		saveDoc(named);
		set({
			doc: named,
			dirty: false,
			index: loadIndex()
		});
		return [named.id];
	},
	addCampaignPage: (formatId) => {
		const { doc } = get();
		if (!doc) return "";
		get().save();
		const live = get().doc;
		const cid = live.campaignId ?? uid("camp");
		if (!live.campaignId) {
			const named = {
				...live,
				campaignId: cid,
				updatedAt: Date.now()
			};
			saveDoc(named);
			set({ doc: named });
		}
		const fmt = formatById(formatId);
		const page = blankDocument(formatId, campaignPageName(live.name, fmt.label));
		page.campaignId = cid;
		saveDoc(page);
		const after = campaignPages(loadIndex(), cid).map((p) => p.id);
		if (!after.includes(page.id)) after.push(page.id);
		set({ index: writeCampaignOrder(cid, after) });
		return page.id;
	},
	duplicateCampaignPage: () => {
		const { doc } = get();
		if (!doc) return "";
		get().save();
		const live = get().doc;
		const cid = live.campaignId ?? uid("camp");
		const copy = structuredClone(live);
		copy.id = uid("doc");
		copy.campaignId = cid;
		copy.name = `${live.name} copy`;
		copy.createdAt = Date.now();
		copy.updatedAt = Date.now();
		saveDoc(copy);
		const after = campaignPages(loadIndex(), cid).map((p) => p.id);
		if (!after.includes(copy.id)) {
			const at = after.indexOf(live.id);
			after.splice(at >= 0 ? at + 1 : after.length, 0, copy.id);
		}
		set({ index: writeCampaignOrder(cid, after) });
		return copy.id;
	},
	reorderCampaignPages: (ids) => {
		const { doc } = get();
		if (!doc?.campaignId) return;
		set({ index: writeCampaignOrder(doc.campaignId, ids) });
	},
	nudgeCampaignPage: (id, dir) => {
		const { doc } = get();
		const cid = doc?.campaignId;
		if (!cid) return;
		const ids = campaignPages(get().index, cid).map((p) => p.id);
		const from = ids.indexOf(id);
		if (from < 0) return;
		const to = from + (dir < 0 ? -1 : 1);
		if (to < 0 || to >= ids.length) return;
		ids.splice(from, 1);
		ids.splice(to, 0, id);
		set({ index: writeCampaignOrder(cid, ids) });
	},
	renameCampaignPage: (id, name) => {
		const trimmed = String(name || "").trim();
		if (!trimmed) return;
		const { doc } = get();
		if (doc?.id === id) {
			const next = {
				...doc,
				name: trimmed,
				updatedAt: Date.now()
			};
			saveDoc(next);
			set({
				doc: next,
				dirty: false,
				index: loadIndex()
			});
			return;
		}
		const other = loadDoc(id);
		if (!other) return;
		saveDoc({
			...other,
			name: trimmed,
			updatedAt: Date.now()
		});
		set({ index: loadIndex() });
	},
	unlinkCampaignPage: (id) => {
		const { doc } = get();
		const target = loadDoc(id);
		if (!target) return;
		const camp = target.campaignId ?? doc?.campaignId;
		saveDoc({
			...target,
			campaignId: void 0,
			updatedAt: Date.now()
		});
		if (doc?.id === id) set({
			doc: {
				...doc,
				campaignId: void 0
			},
			dirty: false
		});
		if (camp) set({ index: writeCampaignOrder(camp, campaignPages(loadIndex(), camp).map((p) => p.id).filter((pid) => pid !== id)) });
		else set({ index: loadIndex() });
	},
	removeCampaignPage: (id) => {
		const camp = loadDoc(id)?.campaignId;
		const rest = camp ? campaignPages(loadIndex(), camp).map((p) => p.id).filter((pid) => pid !== id) : [];
		deleteDoc(id);
		if (camp) writeCampaignOrder(camp, rest);
		const { doc } = get();
		set({
			index: loadIndex(),
			doc: doc?.id === id ? null : doc
		});
		return rest[0] ?? null;
	},
	remove: (id) => {
		deleteDoc(id);
		const { doc } = get();
		set({
			index: loadIndex(),
			doc: doc?.id === id ? null : doc
		});
	},
	setTool: (tool) => set({
		tool,
		editingText: null
	}),
	setBrush: (patch) => {
		const cur = get().brush;
		const next = {
			...cur,
			...patch
		};
		if (patch.id && patch.id !== cur.id) {
			const def = brushById(patch.id);
			next.hardness = def.hardness;
			next.spacing = def.spacing;
			next.scatter = def.scatter;
			delete next.grain;
		}
		if (patch.color == null && patch.id) next.color = get().color || cur.color;
		set({ brush: next });
	},
	setViewport: (v) => set({ viewport: {
		...get().viewport,
		...v
	} }),
	setStrokeGhost: (ghost) => set({ strokeGhost: ghost }),
	setPathPointAlignPreview: (preview) => set({ pathPointAlignPreview: preview }),
	setPathPointNumericPreview: (preview) => set({ pathPointNumericPreview: preview }),
	setPathPointHandleNumericPreview: (preview) => set({ pathPointHandleNumericPreview: preview }),
	setTypeGhost: (ghost) => set({ typeGhost: ghost }),
	setPathOrderGhost: (ghost) => set({ pathOrderGhost: ghost }),
	requestFit: () => set({ viewIntent: { type: "fit" } }),
	requestZoom: (zoom) => set({ viewIntent: {
		type: "zoom",
		zoom
	} }),
	select: (ids, additive) => {
		if (additive) {
			const cur = new Set(get().selection);
			for (const id of ids) if (cur.has(id)) cur.delete(id);
			else cur.add(id);
			set({ selection: [...cur] });
		} else set({
			selection: ids,
			pathEditHit: null,
			pathPointSelection: []
		});
	},
	commit: () => {
		const { doc, past } = get();
		if (!doc) return;
		set({
			past: [...past.slice(-60), structuredClone(doc)],
			future: []
		});
	},
	undo: () => {
		const { doc, past, future } = get();
		const prev = past[past.length - 1];
		if (!prev || !doc) return;
		set({
			doc: prev,
			past: past.slice(0, -1),
			future: [structuredClone(doc), ...future],
			dirty: true
		});
	},
	redo: () => {
		const { doc, past, future } = get();
		const next = future[0];
		if (!next || !doc) return;
		set({
			doc: next,
			future: future.slice(1),
			past: [...past, structuredClone(doc)],
			dirty: true
		});
	},
	restoreHistory: (slot, index) => {
		const { past, future, doc } = get();
		if (!doc) return;
		const chosen = (slot === "past" ? past : future)[index];
		if (!chosen) return;
		get().commit();
		set({
			doc: structuredClone(chosen),
			dirty: true
		});
	},
	toggleIsolate: (keepIds) => {
		const { doc, isolateSnapshot } = get();
		if (!doc) return;
		const next = applyIsolate(doc.nodes, keepIds, isolateSnapshot);
		get().commit();
		set({
			doc: {
				...doc,
				nodes: next.nodes
			},
			isolateSnapshot: next.isolateSnapshot,
			dirty: true
		});
	},
	groupSelection: () => {
		const { doc, selection } = get();
		if (!doc) return;
		const made = makeGroup(doc.nodes, selection);
		if (!made) return;
		get().commit();
		set({
			doc: {
				...doc,
				nodes: made.nodes
			},
			selection: [made.groupId],
			dirty: true
		});
	},
	ungroupSelection: () => {
		const { doc, selection } = get();
		if (!doc) return;
		const groups = selection.filter((id) => doc.nodes.some((n) => n.id === id && n.kind === "group"));
		if (!groups.length) return;
		const kids = doc.nodes.filter((n) => n.parentId && groups.includes(n.parentId)).map((n) => n.id);
		const next = ungroup(doc.nodes, groups);
		get().commit();
		set({
			doc: {
				...doc,
				nodes: next
			},
			selection: kids.length ? kids : selection.filter((id) => !groups.includes(id)),
			dirty: true
		});
	},
	dropLayers: (ids, drop) => {
		const { doc } = get();
		if (!doc || !ids.length) return;
		const next = applyLayerDrop(doc.nodes, ids, drop);
		if (!next) return;
		get().commit();
		set({
			doc: {
				...doc,
				nodes: next
			},
			dirty: true
		});
	},
	reorder: (id, dir) => {
		const { doc } = get();
		if (!doc) return;
		const next = nudgeLayer(doc.nodes, id, dir);
		if (!next) return;
		get().commit();
		set({
			doc: {
				...doc,
				nodes: next
			},
			dirty: true
		});
	},
	reverseStacking: () => {
		const { doc, selection } = get();
		if (!doc || selection.length < 2) return;
		const next = reverseSelectedStacking(doc.nodes, selection);
		if (!next) return;
		get().commit();
		set({
			doc: {
				...doc,
				nodes: next
			},
			dirty: true
		});
	},
	updateNodes: (ids, patch, commit = false) => {
		const { doc } = get();
		if (!doc) return;
		if (commit) get().commit();
		const idset = new Set(ids);
		set({
			doc: {
				...doc,
				nodes: doc.nodes.map((n) => {
					if (!idset.has(n.id)) return n;
					if (n.kind === "paint") return bakePaintIfSized(n, patch);
					return {
						...n,
						...patch
					};
				})
			},
			dirty: true
		});
	},
	mapNodes: (ids, map, commit = false) => {
		const { doc } = get();
		if (!doc) return;
		if (commit) get().commit();
		const idset = new Set(ids);
		set({
			doc: {
				...doc,
				nodes: doc.nodes.map((n) => {
					if (!idset.has(n.id)) return n;
					const next = map(n);
					if (n.kind === "paint" && next.kind === "paint" && paintNeedsBake(n, next.w, next.h)) return bakePaintNode(next, next.w, next.h);
					return next;
				})
			},
			dirty: true
		});
	},
	replaceNode: (id, node, commit = false) => {
		const { doc } = get();
		if (!doc) return;
		if (commit) get().commit();
		set({
			doc: {
				...doc,
				nodes: doc.nodes.map((n) => {
					if (n.id !== id) return n;
					if (n.kind === "paint" && node.kind === "paint" && paintNeedsBake(n, node.w, node.h)) return bakePaintNode(node, node.w, node.h);
					return node;
				})
			},
			dirty: true
		});
	},
	addNode: (node, commit = true) => {
		const { doc } = get();
		if (!doc) return;
		if (commit) get().commit();
		set({
			doc: {
				...doc,
				nodes: [...doc.nodes, node]
			},
			selection: [node.id],
			dirty: true
		});
	},
	resizeArtboard: (formatId, magic) => {
		const { doc } = get();
		if (!doc) return;
		get().commit();
		const fmt = formatById(formatId);
		const sx = fmt.width / doc.artboard.width;
		const sy = fmt.height / doc.artboard.height;
		const nodes = magic ? doc.nodes.map((n) => {
			const next = {
				...n,
				x: n.x * sx,
				y: n.y * sy,
				w: n.w * sx,
				h: n.kind === "text" ? n.h : n.h * sy
			};
			if (n.kind === "paint") return bakePaintNode(next, next.w, next.h);
			return next;
		}) : doc.nodes;
		set({
			doc: {
				...doc,
				artboard: {
					...doc.artboard,
					width: fmt.width,
					height: fmt.height,
					formatId: fmt.id,
					name: fmt.label
				},
				nodes
			},
			dirty: true
		});
	},
	translateSelected: (dx, dy, opts) => {
		const { doc, selection } = get();
		if (!doc || !selection.length || !dx && !dy) return;
		let appliedX = dx;
		let appliedY = dy;
		let guides = {
			x: [],
			y: [],
			spaces: [],
			equalGaps: []
		};
		let snapped = false;
		if (opts?.snap) {
			const extra = {
				x: (doc.guides ?? []).filter((g) => g.axis === "x").map((g) => g.pos),
				y: (doc.guides ?? []).filter((g) => g.axis === "y").map((g) => g.pos)
			};
			const hit = keyboardSnapNudge(doc.nodes, selection, dx, dy, doc.artboard, extra);
			appliedX = hit.dx;
			appliedY = hit.dy;
			guides = hit.guides;
			snapped = hit.snapped;
		}
		if (!appliedX && !appliedY) return;
		const next = nudgeSelection(doc.nodes, selection, appliedX, appliedY);
		if (next === doc.nodes) return;
		get().commit();
		const only = selection.length === 1 ? doc.nodes.find((n) => n.id === selection[0]) : null;
		const group = Boolean(only && isGroup(only) && !only.locked);
		setNudgeCue({
			dx: appliedX,
			dy: appliedY,
			group,
			guides,
			snapped
		});
		setStudioStatus(nudgeStatus(appliedX, appliedY, group, snapped, guides.equalGaps ?? []));
		set({
			doc: {
				...doc,
				nodes: next
			},
			dirty: true,
			nudgeHold: Date.now()
		});
	},
	releaseNudgeGuides: () => {
		const cue = getNudgeCue();
		if (cue?.guides && (cue.guides.x.length || cue.guides.y.length || (cue.guides.spaces?.length ?? 0) > 0)) setNudgeCue({
			...cue,
			guides: {
				x: [],
				y: [],
				spaces: [],
				equalGaps: []
			},
			snapped: false
		});
		set({ nudgeHold: Date.now() });
	},
	placeNodes: (places) => {
		const { doc } = get();
		if (!doc) return;
		const expanded = expandMovePlaces(doc.nodes, places);
		const map = new Map(expanded.map((p) => [p.id, p]));
		set({
			doc: {
				...doc,
				nodes: doc.nodes.map((n) => {
					const p = map.get(n.id);
					return p ? {
						...n,
						x: p.x,
						y: p.y
					} : n;
				})
			},
			dirty: true
		});
	},
	copySelected: () => {
		const { doc, selection } = get();
		if (!doc || !selection.length) return;
		const ids = withDescendants(doc.nodes, selection);
		set({
			clipboard: doc.nodes.filter((n) => ids.has(n.id)).map((n) => structuredClone(n)),
			pasteCount: 1
		});
		setStudioStatus(`Copied ${selection.length} layer${selection.length === 1 ? "" : "s"}`);
	},
	duplicateSelected: () => {
		const { doc, selection } = get();
		if (!doc || !selection.length) return;
		get().commit();
		const ids = withDescendants(doc.nodes, selection);
		const idMap = /* @__PURE__ */ new Map();
		const clones = [];
		for (const n of doc.nodes) {
			if (!ids.has(n.id)) continue;
			const newId = uid(n.kind.slice(0, 2));
			idMap.set(n.id, newId);
			const c = structuredClone(n);
			c.id = newId;
			c.x += 16;
			c.y += 16;
			clones.push(c);
		}
		const remapped = clones.map((n) => n.parentId && idMap.has(n.parentId) ? {
			...n,
			parentId: idMap.get(n.parentId)
		} : n);
		const newSel = selection.map((id) => idMap.get(id)).filter((id) => Boolean(id));
		set({
			doc: {
				...doc,
				nodes: [...doc.nodes, ...remapped]
			},
			selection: newSel.length ? newSel : remapped.map((n) => n.id),
			dirty: true
		});
		setStudioStatus(`Duplicated ${selection.length} layer${selection.length === 1 ? "" : "s"}`);
	},
	cutSelected: () => {
		get().copySelected();
		get().removeSelected();
		setStudioStatus("Cut selection");
	},
	pasteClipboard: () => {
		const { doc, clipboard, pasteCount } = get();
		if (!doc || !clipboard.length) return;
		get().commit();
		const offset = 16 * (pasteCount || 1);
		const idMap = /* @__PURE__ */ new Map();
		const remapped = clipboard.map((n) => {
			const newId = uid(n.kind.slice(0, 2));
			idMap.set(n.id, newId);
			const c = structuredClone(n);
			c.id = newId;
			c.x += offset;
			c.y += offset;
			return c;
		}).map((n) => n.parentId && idMap.has(n.parentId) ? {
			...n,
			parentId: idMap.get(n.parentId)
		} : n);
		const copiedIds = new Set(clipboard.map((n) => n.id));
		const topIds = clipboard.filter((n) => !n.parentId || !copiedIds.has(n.parentId)).map((n) => idMap.get(n.id));
		const newSel = topIds.length ? topIds : remapped.map((n) => n.id);
		set({
			doc: {
				...doc,
				nodes: [...doc.nodes, ...remapped]
			},
			selection: newSel.length ? newSel : remapped.map((n) => n.id),
			pasteCount: (pasteCount || 1) + 1,
			dirty: true
		});
		setStudioStatus(`Pasted ${newSel.length || remapped.length} layer${(newSel.length || remapped.length) === 1 ? "" : "s"}`);
	},
	removeSelected: () => {
		const { doc, selection } = get();
		if (!doc || !selection.length) return;
		get().commit();
		const ids = withDescendants(doc.nodes, selection);
		set({
			doc: {
				...doc,
				nodes: doc.nodes.filter((n) => !ids.has(n.id))
			},
			selection: [],
			dirty: true
		});
		setStudioStatus(`Removed ${selection.length} layer${selection.length === 1 ? "" : "s"}`);
	},
	selectAll: () => {
		const { doc } = get();
		if (!doc) return;
		set({ selection: doc.nodes.filter((n) => !n.locked).map((n) => n.id) });
	},
	copyOpacity: () => {
		const { doc, selection } = get();
		if (!doc || !selection.length) return;
		const nodes = doc.nodes.filter((n) => selection.includes(n.id));
		if (!nodes.length) return;
		const value = nodes[0].opacity;
		const mixed = new Set(nodes.map((n) => n.opacity)).size > 1;
		set({ opacityClipboard: value });
		setStudioStatus(`Copied opacity ${Math.round(value * 100)}%${mixed ? " (mixed — first layer)" : ""}`);
	},
	pasteOpacity: () => {
		const { selection, opacityClipboard } = get();
		if (!selection.length || opacityClipboard == null) return;
		get().updateNodes(selection, { opacity: opacityClipboard }, true);
		setStudioStatus(`Pasted opacity ${Math.round(opacityClipboard * 100)}%`);
	},
	setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
	togglePrintMarks: () => set({ printMarks: !get().printMarks }),
	setBleed: (px) => {
		const { doc } = get();
		if (!doc) return;
		get().commit();
		set({
			doc: {
				...doc,
				artboard: {
					...doc.artboard,
					bleed: px
				}
			},
			dirty: true
		});
	},
	setBleedEdges: (patch) => {
		const { doc } = get();
		if (!doc) return;
		get().commit();
		const prev = doc.artboard.bleedEdges ?? {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		};
		set({
			doc: {
				...doc,
				artboard: {
					...doc.artboard,
					bleedEdges: {
						...prev,
						...patch
					}
				}
			},
			dirty: true
		});
	},
	rename: (name) => {
		const { doc } = get();
		if (!doc) return;
		get().commit();
		set({
			doc: {
				...doc,
				name
			},
			dirty: true
		});
	}
}));
function makeShape(kind, x, y, w, h, color) {
	return shape(kind, {
		x,
		y,
		w,
		h,
		fill: kind === "line" ? "transparent" : color,
		stroke: kind === "line" ? color : "transparent",
		strokeWidth: kind === "line" ? 4 : 0
	});
}
function makeText(x, y, color) {
	return text({
		x,
		y,
		w: 420,
		h: 80,
		text: "Type here",
		fill: color,
		fontFamily: "Chakra Petch",
		fontSize: 56,
		fontWeight: 600
	});
}
var imageCache = /* @__PURE__ */ new Map();
function getCachedImage(src) {
	const hit = imageCache.get(src);
	if (hit) return hit;
	if (typeof Image === "undefined") return null;
	const img = new Image();
	img.crossOrigin = "anonymous";
	img.src = src;
	imageCache.set(src, img);
	return img;
}
function applyFill(ctx, fill, x, y, w, h) {
	if (isGradient(fill)) {
		const ang = fill.angle * Math.PI / 180;
		const cx = x + w / 2;
		const cy = y + h / 2;
		const len = Math.max(w, h);
		const g = ctx.createLinearGradient(cx - Math.cos(ang) * len, cy - Math.sin(ang) * len, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
		for (const s of fill.stops) g.addColorStop(s.offset, s.color);
		ctx.fillStyle = g;
	} else ctx.fillStyle = fill;
}
function roundRect(ctx, x, y, w, h, r) {
	const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
	ctx.beginPath();
	ctx.moveTo(x + rr, y);
	ctx.arcTo(x + w, y, x + w, y + h, rr);
	ctx.arcTo(x + w, y + h, x, y + h, rr);
	ctx.arcTo(x, y + h, x, y, rr);
	ctx.arcTo(x, y, x + w, y, rr);
	ctx.closePath();
}
function polygonPath(ctx, x, y, w, h, sides = 6) {
	const cx = x + w / 2;
	const cy = y + h / 2;
	const rx = w / 2;
	const ry = h / 2;
	ctx.beginPath();
	for (let i = 0; i < sides; i++) {
		const a = i / sides * Math.PI * 2 - Math.PI / 2;
		const px = cx + rx * Math.cos(a);
		const py = cy + ry * Math.sin(a);
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
}
function arrowPath(ctx, x, y, w, h, headScale = 1) {
	const pts = arrowPoints(w, h, headScale);
	ctx.beginPath();
	for (let i = 0; i < pts.length; i++) {
		const p = pts[i];
		if (i === 0) ctx.moveTo(x + p.x, y + p.y);
		else ctx.lineTo(x + p.x, y + p.y);
	}
	ctx.closePath();
}
function starPath(ctx, x, y, w, h, points = 5) {
	const cx = x + w / 2;
	const cy = y + h / 2;
	const rx = w / 2;
	const ry = h / 2;
	ctx.beginPath();
	for (let i = 0; i < points * 2; i++) {
		const a = i * Math.PI / points - Math.PI / 2;
		const r = i % 2 === 0 ? 1 : .4;
		const px = cx + rx * r * Math.cos(a);
		const py = cy + ry * r * Math.sin(a);
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
}
function applyStrokeStyle(ctx, n) {
	const dash = n.strokeDash ?? 0;
	if (dash > 0) {
		ctx.setLineDash([dash, dash]);
		ctx.lineDashOffset = n.strokeDashOffset ?? 0;
	} else {
		ctx.setLineDash([]);
		ctx.lineDashOffset = 0;
	}
	ctx.lineCap = n.lineCap ?? "butt";
	ctx.lineJoin = n.lineJoin ?? "miter";
	ctx.miterLimit = n.miterLimit ?? 10;
}
function fillSilhouette(ctx, n) {
	ctx.fillStyle = "#000";
	if (isText(n)) {
		applyFontFace(ctx, n);
		ctx.textAlign = n.align === "center" ? "center" : n.align === "right" ? "right" : "left";
		ctx.textBaseline = useDesign.getState().typeBaseline ?? "hanging";
		const measure = (s) => ctx.measureText(s).width;
		const { lines, lineHeight, startY } = layoutTextLines(n, measure);
		ctx.beginPath();
		ctx.rect(n.x, n.y, n.w, n.h);
		ctx.clip();
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			let ax = n.x;
			if (n.align === "center") ax = n.x + n.w / 2;
			if (n.align === "right") ax = n.x + n.w;
			const maxW = n.wrap === false ? n.w : void 0;
			ctx.fillText(line, ax, n.y + startY + i * lineHeight, maxW);
		}
		return;
	}
	if (isImage(n) || isPaint(n)) {
		ctx.fillRect(n.x, n.y, n.w, n.h);
		return;
	}
	if (isPath(n) && n.points.length) {
		ctx.beginPath();
		tracePath(ctx, n.x, n.y, n.points, n.closed);
		const holes = n.holes ?? [];
		for (const hole of holes) {
			if (hole.length < 3) continue;
			tracePath(ctx, n.x, n.y, hole, true);
		}
		ctx.fill(n.fillRule ?? (holes.length ? "evenodd" : "nonzero"));
		return;
	}
	switch (n.kind) {
		case "rect":
			roundRect(ctx, n.x, n.y, n.w, n.h, "radius" in n ? n.radius : 0);
			break;
		case "ellipse":
			ctx.beginPath();
			ctx.ellipse(n.x + n.w / 2, n.y + n.h / 2, Math.abs(n.w / 2), Math.abs(n.h / 2), 0, 0, Math.PI * 2);
			break;
		case "polygon":
			polygonPath(ctx, n.x, n.y, n.w, n.h, "sides" in n ? n.sides ?? 6 : 6);
			break;
		case "star":
			starPath(ctx, n.x, n.y, n.w, n.h, "sides" in n ? n.sides ?? 5 : 5);
			break;
		case "arrow":
			arrowPath(ctx, n.x, n.y, n.w, n.h, "headScale" in n ? n.headScale ?? 1 : 1);
			break;
		default: roundRect(ctx, n.x, n.y, n.w, n.h, 0);
	}
	ctx.fill();
}
function paintInsetShadow(ctx, n, shadow) {
	if (typeof document === "undefined") return;
	const p = canvasShadowParams(shadow);
	const pad = Math.ceil(p.blur * 2 + Math.abs(p.ox) + Math.abs(p.oy) + p.spread + 8);
	const w = Math.max(2, Math.ceil(Math.abs(n.w) + pad * 2));
	const h = Math.max(2, Math.ceil(Math.abs(n.h) + pad * 2));
	const mask = document.createElement("canvas");
	mask.width = w;
	mask.height = h;
	const m = mask.getContext("2d");
	if (!m) return;
	m.translate(pad - n.x, pad - n.y);
	fillSilhouette(m, n);
	const layer = document.createElement("canvas");
	layer.width = w;
	layer.height = h;
	const s = layer.getContext("2d");
	if (!s) return;
	s.fillStyle = p.color;
	s.fillRect(0, 0, w, h);
	s.globalCompositeOperation = "destination-out";
	s.shadowColor = "#000000";
	s.shadowBlur = p.blur;
	s.shadowOffsetX = p.ox;
	s.shadowOffsetY = p.oy;
	s.drawImage(mask, 0, 0);
	s.globalCompositeOperation = "destination-in";
	s.shadowColor = "transparent";
	s.shadowBlur = 0;
	s.shadowOffsetX = 0;
	s.shadowOffsetY = 0;
	s.drawImage(mask, 0, 0);
	ctx.save();
	ctx.shadowColor = "transparent";
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.drawImage(layer, n.x - pad, n.y - pad);
	ctx.restore();
}
function fitViewport(artW, artH, viewW, viewH, pad = 24) {
	const zoom = Math.max(.05, Math.min((viewW - pad * 2) / artW, (viewH - pad * 2) / artH));
	return {
		zoom,
		x: (viewW - artW * zoom) / 2,
		y: (viewH - artH * zoom) / 2
	};
}
function screenToDoc(sx, sy, viewport) {
	return {
		x: (sx - viewport.x) / viewport.zoom,
		y: (sy - viewport.y) / viewport.zoom
	};
}
function outlineNode(ctx, n) {
	if (isText(n) || isImage(n) || isPaint(n)) {
		ctx.beginPath();
		ctx.rect(n.x, n.y, n.w, n.h);
		return;
	}
	if (isPath(n) && n.points.length) {
		ctx.beginPath();
		tracePath(ctx, n.x, n.y, n.points, n.closed);
		const holes = n.holes ?? [];
		for (const hole of holes) {
			if (hole.length < 3) continue;
			tracePath(ctx, n.x, n.y, hole, true);
		}
		return;
	}
	switch (n.kind) {
		case "ellipse":
			ctx.beginPath();
			ctx.ellipse(n.x + n.w / 2, n.y + n.h / 2, Math.abs(n.w / 2), Math.abs(n.h / 2), 0, 0, Math.PI * 2);
			break;
		case "polygon":
			polygonPath(ctx, n.x, n.y, n.w, n.h, "sides" in n ? n.sides ?? 6 : 6);
			break;
		case "star":
			starPath(ctx, n.x, n.y, n.w, n.h, "sides" in n ? n.sides ?? 5 : 5);
			break;
		case "arrow":
			arrowPath(ctx, n.x, n.y, n.w, n.h, "headScale" in n ? n.headScale ?? 1 : 1);
			break;
		case "line":
			ctx.beginPath();
			ctx.moveTo(n.x, n.y + n.h / 2);
			ctx.lineTo(n.x + n.w, n.y + n.h / 2);
			break;
		default: roundRect(ctx, n.x, n.y, n.w, n.h, "radius" in n ? n.radius : 0);
	}
}
function drawNode(ctx, n) {
	if (!n.visible) return;
	ctx.save();
	ctx.globalAlpha *= n.opacity;
	ctx.globalCompositeOperation = n.blend;
	const c = nodeCenter(n);
	if (n.rotation) {
		ctx.translate(c.x, c.y);
		ctx.rotate(degToRad(n.rotation));
		ctx.translate(-c.x, -c.y);
	}
	if (n.shadow && n.shadow.inset) paintInsetShadow(ctx, n, n.shadow);
	if (n.shadow && !n.shadow.inset) {
		const p = canvasShadowParams(n.shadow);
		ctx.shadowColor = p.color;
		ctx.shadowBlur = p.blur;
		ctx.shadowOffsetX = p.ox;
		ctx.shadowOffsetY = p.oy;
	}
	if (isImage(n)) {
		const img = getCachedImage(n.src);
		if (img && img.complete && img.naturalWidth) ctx.drawImage(img, n.x, n.y, n.w, n.h);
		else {
			applyFill(ctx, n.fill, n.x, n.y, n.w, n.h);
			ctx.fillRect(n.x, n.y, n.w, n.h);
		}
	} else if (isPaint(n)) {
		const img = getCachedImage(n.bitmap);
		if (img && img.complete && img.naturalWidth) ctx.drawImage(img, n.x, n.y, n.w, n.h);
		else {
			applyFill(ctx, n.fill, n.x, n.y, n.w, n.h);
			ctx.fillRect(n.x, n.y, n.w, n.h);
		}
	} else {
		applyFill(ctx, n.fill, n.x, n.y, n.w, n.h);
		fillSilhouette(ctx, n);
	}
	if (n.strokeWidth > 0 && n.stroke && n.stroke !== "transparent") {
		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		outlineNode(ctx, n);
		ctx.strokeStyle = n.stroke;
		ctx.lineWidth = n.strokeWidth;
		applyStrokeStyle(ctx, n);
		ctx.stroke();
	}
	ctx.restore();
}
/** Group rotation, opacity, and a non-normal blend ride the nest on the canvas, matching SVG.
*  Rotation turns the nest about the group box centre before opacity and blend.
*  A non-normal blend isolates the nest (offscreen) so it composites as one unit.
*  Opacity under 1 multiplies the nest. A fully opaque, unrotated, normal blend paints straight through.
*/
function paintGroupRotation(ctx, n, paint) {
	const rot = n.rotation || 0;
	if (!rot) {
		paint(ctx);
		return;
	}
	const cx = n.x + n.w / 2;
	const cy = n.y + n.h / 2;
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(degToRad(rot));
	ctx.translate(-cx, -cy);
	paint(ctx);
	ctx.restore();
}
function paintGroupNest(ctx, n, paint) {
	const fade = n.opacity !== 1 && !Number.isNaN(n.opacity);
	const isolate = Boolean(n.blend && n.blend !== "source-over");
	const spin = Boolean(n.rotation);
	const paintSpun = (target) => paintGroupRotation(target, n, paint);
	if (!fade && !isolate && !spin) {
		paint(ctx);
		return;
	}
	if (!isolate) {
		ctx.save();
		if (fade) ctx.globalAlpha *= n.opacity;
		paintSpun(ctx);
		ctx.restore();
		return;
	}
	const src = ctx.canvas;
	const off = document.createElement("canvas");
	off.width = Math.max(1, src.width);
	off.height = Math.max(1, src.height);
	const octx = off.getContext("2d");
	if (!octx) {
		ctx.save();
		ctx.globalAlpha *= n.opacity;
		ctx.globalCompositeOperation = n.blend;
		paintSpun(ctx);
		ctx.restore();
		return;
	}
	octx.setTransform(ctx.getTransform());
	paintSpun(octx);
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.globalAlpha *= n.opacity;
	ctx.globalCompositeOperation = n.blend;
	ctx.drawImage(off, 0, 0);
	ctx.restore();
}
/** Hidden groups hoist: no group box. Opacity, blend, and rotation still wrap visible children.
*  A fully opaque, unrotated, normal blend is a bare hoist.
*/
function paintHiddenGroupHoist(ctx, n, paint) {
	paintGroupNest(ctx, n, paint);
}
function paintForest(ctx, nodes) {
	const ids = new Set(nodes.map((n) => n.id));
	const byParent = /* @__PURE__ */ new Map();
	for (const n of nodes) {
		const key = n.parentId && ids.has(n.parentId) ? n.parentId : void 0;
		const list = byParent.get(key) ?? [];
		list.push(n);
		byParent.set(key, list);
	}
	const paintList = (parentId, target) => {
		const kids = byParent.get(parentId) ?? [];
		for (const n of kids) {
			if (isGroup(n)) {
				const paintKids = (childCtx) => paintList(n.id, childCtx);
				if (!n.visible) {
					paintHiddenGroupHoist(target, n, paintKids);
					continue;
				}
				paintGroupNest(target, n, paintKids);
				continue;
			}
			if (!n.visible) continue;
			drawNode(target, n);
		}
	};
	paintList(void 0, ctx);
}
function drawDocument(ctx, doc, opts = {}) {
	const dpr = opts.dpr ?? 1;
	const vp = opts.viewport ?? {
		zoom: 1,
		x: opts.ox ?? 0,
		y: opts.oy ?? 0
	};
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	if (!opts.skipChrome) {
		ctx.fillStyle = "#0b0f0c";
		ctx.fillRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr);
	}
	ctx.translate(vp.x, vp.y);
	ctx.scale(vp.zoom, vp.zoom);
	applyFill(ctx, doc.artboard.background, 0, 0, doc.artboard.width, doc.artboard.height);
	ctx.fillRect(0, 0, doc.artboard.width, doc.artboard.height);
	paintForest(ctx, doc.nodes);
}
//#endregion
export { makeShape as $, drawPathTangents as A, stampShadowOffset as At, holdStudioStatus as B, cloneShadow as C, shadowSpreadLabel as Ct, descendantsOf as D, stampShadowBlur as Dt, degToRad as E, smoothPathCorners as Et, fitViewport as F, subscribeStudioStatus as Ft, isGradient as G, instantiateTemplate as H, flattenLayers as I, uid as It, isPath as J, isGroup as K, getStudioStatus as L, useDesign as Lt, faceAxis as M, stampShadowOy as Mt, filterChipLabel as N, stampShadowSpread as Nt, dragPathHandle as O, stampShadowColor as Ot, filterKey as P, strokeSegment as Pt, loadDoc as Q, hasHandle as R, variationSettings as Rt, cloneFilters as S, shadowSpread as St, cssFilterStyle as T, shapeToPathNode as Tt, isBitmap as U, imageNode as V, isConvertibleShape as W, layerDropLegal as X, isText as Y, layoutTextLines as Z, brushById as _, shadowInset as _t, FONT_LINK as a, nodeCenter as at, canvasShadowParams as b, shadowOffsetChipLabel as bt, TEMPLATE_CATEGORIES as c, normalizeFilters as ct, applyFontFace as d, releaseStudioStatus as dt, makeText as et, arrowPoints as f, rotatePoint as ft, blankDocument as g, shadowCropExtents as gt, bakeRotatedPoints as h, shadowChipLabel as ht, DEFAULT_SHADOW as i, nearPenClose as it, expandMovePlaces as j, stampShadowOx as jt, drawDocument as k, stampShadowInset as kt, aabb as l, pathD as lt, autoSmoothPoint as m, setStudioStatus as mt, CANVAS_FONTS as n, measureTracked as nt, FORMATS as o, nodeWorldAabb as ot, asEditablePath as p, screenToDoc as pt, isHeldStudioStatus as q, DEFAULT_FILTERS as r, mirrorHandle as rt, TEMPLATES as s, normalizeCrop as st, BRUSHES as t, markStayOnHub as tt, anyFaceHasAxis as u, pathNode as ut, campaignPages as v, shadowInsetLabel as vt, closePathWithCubic as w, shapeContour as wt, clampAxis as x, shadowPreviewCss as xt, canvasFont as y, shadowKey as yt, hitPathEdit as z };
