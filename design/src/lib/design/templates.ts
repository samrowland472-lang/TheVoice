import { formatById } from "./formats";
import { uid } from "./id";
import { shape, text } from "./node-factory";
import type { DesignDocument, DesignNode, Fill } from "./types";

export interface Template {
  id: string;
  name: string;
  category: string;
  formatId: string;
  description: string;
  build: () => DesignNode[];
  background: Fill;
}

function docFrom(t: Template): DesignDocument {
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
      formatId: t.formatId,
    },
    nodes: t.build(),
    createdAt: now,
    updatedAt: now,
  };
}

const ink = "#d9f5e3";
const dim = "#7d9689";
const ground = "#0a0d0c";
const cyan = "#3fc6ff";
const surface = "#121613";
const amber = "#ffb238";

export const TEMPLATES: Template[] = [
  {
    id: "signal-album",
    name: "Signal Album",
    category: "Music",
    formatId: "album",
    description: "Phosphor field with registration marks",
    background: ground,
    build: () => [
      shape("rect", { x: 80, y: 80, w: 1240, h: 1240, fill: "transparent", stroke: cyan, strokeWidth: 2, name: "frame" }),
      shape("rect", { x: 80, y: 80, w: 28, h: 28, fill: cyan, name: "reg-tl" }),
      shape("rect", { x: 1292, y: 80, w: 28, h: 28, fill: cyan, name: "reg-tr" }),
      shape("rect", { x: 80, y: 1292, w: 28, h: 28, fill: cyan, name: "reg-bl" }),
      shape("rect", { x: 1292, y: 1292, w: 28, h: 28, fill: cyan, name: "reg-br" }),
      shape("ellipse", { x: 390, y: 340, w: 620, h: 620, fill: "transparent", stroke: cyan, strokeWidth: 18, name: "orb" }),
      shape("ellipse", { x: 560, y: 510, w: 280, h: 280, fill: cyan, name: "core", opacity: 0.9 }),
      text({ x: 120, y: 1040, w: 1160, h: 90, text: "THE VOICE", fontFamily: "Chakra Petch", fontWeight: 700, fontSize: 86, letterSpacing: 18, uppercase: true, align: "center", fill: ink }),
      text({ x: 120, y: 1140, w: 1160, h: 48, text: "SIGNAL 01  ·  LIVE TAKE", fontFamily: "Share Tech Mono", fontSize: 22, letterSpacing: 8, align: "center", fill: dim, uppercase: true }),
    ],
  },
  {
    id: "night-set",
    name: "Night Set Poster",
    category: "Print",
    formatId: "poster",
    description: "Stacked type concert bill",
    background: "#070908",
    build: () => [
      shape("rect", { x: 0, y: 0, w: 1275, h: 18, fill: cyan, name: "bar" }),
      text({ x: 72, y: 80, w: 1130, h: 40, text: "SAT 22 AUG  ·  DOORS 20:00", fontFamily: "Share Tech Mono", fontSize: 22, fill: cyan, letterSpacing: 6, uppercase: true }),
      text({ x: 64, y: 160, w: 1150, h: 220, text: "THE\nVOICE", fontFamily: "Syne", fontWeight: 800, fontSize: 210, lineHeight: 0.86, fill: ink, uppercase: true, letterSpacing: -6 }),
      text({ x: 72, y: 620, w: 1130, h: 70, text: "LIVE TRANSMISSION", fontFamily: "Bebas Neue", fontSize: 72, fill: cyan, letterSpacing: 10, uppercase: true }),
      shape("rect", { x: 72, y: 720, w: 1130, h: 2, fill: "#263029", name: "rule" }),
      text({ x: 72, y: 760, w: 700, h: 180, text: "Voice, drum machine,\nand a room that listens\nback.", fontFamily: "Outfit", fontWeight: 400, fontSize: 36, lineHeight: 1.25, fill: dim }),
      text({ x: 72, y: 1680, w: 700, h: 80, text: "WAREHOUSE 4\nEAST DOCK", fontFamily: "Chakra Petch", fontWeight: 600, fontSize: 32, lineHeight: 1.2, fill: ink, uppercase: true }),
      text({ x: 800, y: 1680, w: 400, h: 80, text: "TICKETS AT\nTHE DOOR", fontFamily: "Share Tech Mono", fontSize: 22, lineHeight: 1.4, fill: cyan, align: "right", uppercase: true }),
    ],
  },
  {
    id: "yt-drop",
    name: "Drop Thumbnail",
    category: "Social",
    formatId: "yt-thumb",
    description: "High-contrast YouTube still",
    background: ground,
    build: () => [
      shape("rect", { x: 0, y: 0, w: 520, h: 720, fill: cyan, name: "panel" }),
      text({ x: 40, y: 80, w: 440, h: 80, text: "EP 12", fontFamily: "Share Tech Mono", fontSize: 28, fill: ground, letterSpacing: 8, uppercase: true }),
      text({ x: 36, y: 180, w: 460, h: 360, text: "HOW\nTO\nHOLD\nA NOTE", fontFamily: "Syne", fontWeight: 800, fontSize: 78, lineHeight: 0.92, fill: ground, uppercase: true }),
      text({ x: 580, y: 220, w: 640, h: 280, text: "Studio\nnotes.", fontFamily: "Fraunces", fontWeight: 600, fontSize: 96, lineHeight: 0.95, fill: ink }),
      text({ x: 580, y: 560, w: 640, h: 80, text: "A 12-minute voice lesson — no filler.", fontFamily: "Outfit", fontSize: 28, fill: dim }),
    ],
  },
  {
    id: "story-now",
    name: "Now Playing Story",
    category: "Social",
    formatId: "ig-story",
    description: "Vertical now-playing card",
    background: surface,
    build: () => [
      shape("ellipse", { x: 190, y: 280, w: 700, h: 700, fill: "transparent", stroke: cyan, strokeWidth: 3, name: "ring" }),
      shape("ellipse", { x: 310, y: 400, w: 460, h: 460, fill: cyan, opacity: 0.16, name: "glow" }),
      shape("ellipse", { x: 470, y: 560, w: 140, h: 140, fill: cyan, name: "dot" }),
      text({ x: 80, y: 1100, w: 920, h: 50, text: "NOW PLAYING", fontFamily: "Share Tech Mono", fontSize: 22, letterSpacing: 10, align: "center", fill: cyan, uppercase: true }),
      text({ x: 80, y: 1180, w: 920, h: 140, text: "Low Signal", fontFamily: "Chakra Petch", fontWeight: 700, fontSize: 88, align: "center", fill: ink }),
      text({ x: 80, y: 1340, w: 920, h: 50, text: "THE VOICE  ·  TAKE 03", fontFamily: "Outfit", fontSize: 24, align: "center", fill: dim, letterSpacing: 4, uppercase: true }),
      shape("rect", { x: 180, y: 1680, w: 720, h: 8, fill: "#263029", radius: 4, name: "track" }),
      shape("rect", { x: 180, y: 1680, w: 280, h: 8, fill: cyan, radius: 4, name: "progress" }),
    ],
  },
  {
    id: "ig-quote",
    name: "Lyric Square",
    category: "Social",
    formatId: "ig-post",
    description: "Editorial lyric lockup",
    background: "#0e1210",
    build: () => [
      shape("rect", { x: 64, y: 64, w: 952, h: 952, fill: "transparent", stroke: "#263029", strokeWidth: 1, name: "inset" }),
      text({ x: 110, y: 160, w: 860, h: 40, text: "LYRIC  ·  01", fontFamily: "Share Tech Mono", fontSize: 18, fill: cyan, letterSpacing: 6, uppercase: true }),
      text({ x: 110, y: 280, w: 860, h: 420, text: "Keep the\nroom quiet\nso the voice\ncan arrive.", fontFamily: "Fraunces", fontWeight: 600, fontSize: 72, lineHeight: 1.08, fill: ink }),
      shape("rect", { x: 110, y: 820, w: 80, h: 4, fill: cyan, name: "tick" }),
      text({ x: 110, y: 860, w: 860, h: 60, text: "THE VOICE", fontFamily: "Chakra Petch", fontWeight: 600, fontSize: 28, fill: dim, letterSpacing: 8, uppercase: true }),
    ],
  },
  {
    id: "podcast",
    name: "Podcast Cover",
    category: "Music",
    formatId: "podcast",
    description: "Numbered episode plate",
    background: ground,
    build: () => [
      shape("rect", { x: 0, y: 0, w: 1400, h: 1400, fill: { type: "linear", angle: 160, stops: [{ offset: 0, color: "#0a0d0c" }, { offset: 1, color: "#15201a" }] }, name: "wash" }),
      text({ x: 80, y: 70, w: 1240, h: 80, text: "048", fontFamily: "Bebas Neue", fontSize: 96, fill: cyan, letterSpacing: 4 }),
      text({ x: 80, y: 480, w: 1240, h: 420, text: "IN THE\nBOOTH", fontFamily: "Syne", fontWeight: 800, fontSize: 168, lineHeight: 0.88, fill: ink, uppercase: true }),
      text({ x: 80, y: 1180, w: 900, h: 80, text: "Conversations on making sound that lasts.", fontFamily: "Outfit", fontSize: 32, fill: dim }),
      shape("rect", { x: 80, y: 1288, w: 180, h: 8, fill: cyan, name: "bar" }),
    ],
  },
  {
    id: "card-press",
    name: "Press Card",
    category: "Print",
    formatId: "card",
    description: "Quiet business card",
    background: "#0c100e",
    build: () => [
      shape("rect", { x: 0, y: 0, w: 8, h: 600, fill: cyan, name: "spine" }),
      text({ x: 56, y: 70, w: 600, h: 50, text: "THE VOICE", fontFamily: "Chakra Petch", fontWeight: 700, fontSize: 36, letterSpacing: 8, fill: ink, uppercase: true }),
      text({ x: 56, y: 130, w: 600, h: 30, text: "DESIGN  ·  SOUND  ·  STAGE", fontFamily: "Share Tech Mono", fontSize: 14, fill: dim, letterSpacing: 4, uppercase: true }),
      text({ x: 56, y: 420, w: 500, h: 90, text: "Sam Rowland\nStudio lead", fontFamily: "Outfit", fontSize: 22, lineHeight: 1.3, fill: ink }),
      text({ x: 620, y: 430, w: 380, h: 90, text: "hello@thevoice.studio\n+44 20 0000 0000", fontFamily: "IBM Plex Mono", fontSize: 16, lineHeight: 1.5, fill: dim, align: "right" }),
    ],
  },
  {
    id: "logo-mark",
    name: "Registration Mark",
    category: "Brand",
    formatId: "logo",
    description: "Geometric wordmark",
    background: ground,
    build: () => [
      shape("rect", { x: 330, y: 250, w: 420, h: 420, fill: "transparent", stroke: cyan, strokeWidth: 10, name: "plate" }),
      shape("ellipse", { x: 470, y: 390, w: 140, h: 140, fill: cyan, name: "dot" }),
      text({ x: 90, y: 740, w: 900, h: 90, text: "THE VOICE", fontFamily: "Chakra Petch", fontWeight: 700, fontSize: 72, align: "center", letterSpacing: 14, fill: ink, uppercase: true }),
      text({ x: 90, y: 840, w: 900, h: 40, text: "EST. SIGNAL", fontFamily: "Share Tech Mono", fontSize: 18, align: "center", letterSpacing: 10, fill: dim, uppercase: true }),
    ],
  },
  {
    id: "x-banner",
    name: "Transmission Banner",
    category: "Social",
    formatId: "x-post",
    description: "Wide announcement",
    background: ground,
    build: () => [
      shape("rect", { x: 0, y: 0, w: 12, h: 900, fill: cyan, name: "edge" }),
      text({ x: 80, y: 120, w: 900, h: 40, text: "NEW DROP", fontFamily: "Share Tech Mono", fontSize: 22, fill: cyan, letterSpacing: 8, uppercase: true }),
      text({ x: 72, y: 200, w: 1100, h: 260, text: "Design that\ncarries a voice.", fontFamily: "Syne", fontWeight: 800, fontSize: 92, lineHeight: 0.95, fill: ink }),
      text({ x: 80, y: 720, w: 800, h: 50, text: "Open the artboard. Make the poster. Press send.", fontFamily: "Outfit", fontSize: 26, fill: dim }),
      shape("ellipse", { x: 1180, y: 220, w: 280, h: 280, fill: "transparent", stroke: cyan, strokeWidth: 10, name: "orb" }),
    ],
  },
  {
    id: "flyer-session",
    name: "Session Flyer",
    category: "Print",
    formatId: "flyer",
    description: "Workshop handbill",
    background: "#0b0f0d",
    build: () => [
      text({ x: 70, y: 70, w: 1130, h: 40, text: "OPEN STUDIO  ·  FREE", fontFamily: "Share Tech Mono", fontSize: 20, fill: amber, letterSpacing: 6, uppercase: true }),
      text({ x: 64, y: 140, w: 1140, h: 200, text: "LEARN THE\nARTBOARD", fontFamily: "Chakra Petch", fontWeight: 700, fontSize: 96, lineHeight: 0.92, fill: ink, uppercase: true }),
      shape("rect", { x: 70, y: 380, w: 1130, h: 1, fill: "#263029", name: "rule" }),
      text({ x: 70, y: 430, w: 1130, h: 220, text: "A three-hour session on type, paint, and layouts that hold a room. Bring a laptop. Leave with a poster.", fontFamily: "Outfit", fontSize: 32, lineHeight: 1.4, fill: dim }),
      shape("rect", { x: 70, y: 1380, w: 1130, h: 180, fill: cyan, name: "cta" }),
      text({ x: 70, y: 1430, w: 1130, h: 80, text: "SATURDAY  ·  14:00  ·  STUDIO B", fontFamily: "Chakra Petch", fontWeight: 600, fontSize: 32, align: "center", fill: ground, uppercase: true, letterSpacing: 4 }),
    ],
  },
  {
    id: "slide-key",
    name: "Keynote Slide",
    category: "Brand",
    formatId: "wide",
    description: "Talk title card",
    background: ground,
    build: () => [
      shape("rect", { x: 0, y: 0, w: 1920, h: 8, fill: cyan, name: "top" }),
      text({ x: 120, y: 160, w: 1680, h: 40, text: "THE VOICE  /  KEYNOTE", fontFamily: "Share Tech Mono", fontSize: 22, fill: cyan, letterSpacing: 8, uppercase: true }),
      text({ x: 110, y: 280, w: 1600, h: 280, text: "Sound is a\nlayout problem.", fontFamily: "Fraunces", fontWeight: 600, fontSize: 108, lineHeight: 1.02, fill: ink }),
      text({ x: 120, y: 880, w: 1000, h: 50, text: "How a poster, a mix, and a voice share the same grid.", fontFamily: "Outfit", fontSize: 28, fill: dim }),
    ],
  },
  {
    id: "portrait-issue",
    name: "Issue Cover",
    category: "Social",
    formatId: "ig-portrait",
    description: "Magazine-style cover",
    background: "#101612",
    build: () => [
      text({ x: 60, y: 50, w: 960, h: 40, text: "THE VOICE  ·  VOL. 02", fontFamily: "Share Tech Mono", fontSize: 18, fill: cyan, letterSpacing: 6, uppercase: true }),
      text({ x: 50, y: 160, w: 980, h: 180, text: "PRESS", fontFamily: "Bebas Neue", fontSize: 180, fill: ink, letterSpacing: 8, uppercase: true }),
      shape("rect", { x: 60, y: 380, w: 960, h: 640, fill: cyan, opacity: 0.12, name: "field" }),
      shape("ellipse", { x: 280, y: 500, w: 520, h: 400, fill: "transparent", stroke: cyan, strokeWidth: 6, name: "oval" }),
      text({ x: 60, y: 1080, w: 960, h: 160, text: "The craft issue.\nType, paint, and the cut.", fontFamily: "Fraunces", fontWeight: 600, fontSize: 42, lineHeight: 1.2, fill: ink }),
    ],
  },
  {
    id: "100-hour",
    name: "100 Hour Loop",
    category: "Print",
    formatId: "poster",
    description: "Stay-in-the-work bill",
    background: ground,
    build: () => [
      shape("rect", { x: 64, y: 64, w: 28, h: 28, fill: cyan, name: "reg-tl" }),
      shape("rect", { x: 1183, y: 64, w: 28, h: 28, fill: cyan, name: "reg-tr" }),
      shape("rect", { x: 64, y: 1783, w: 28, h: 28, fill: cyan, name: "reg-bl" }),
      shape("rect", { x: 1183, y: 1783, w: 28, h: 28, fill: cyan, name: "reg-br" }),
      shape("rect", { x: 64, y: 64, w: 1147, h: 1747, fill: "transparent", stroke: cyan, strokeWidth: 1, name: "plate" }),
      text({ x: 110, y: 140, w: 1050, h: 36, text: "THE VOICE  ·  STUDIO SIGNAL", fontFamily: "Share Tech Mono", fontSize: 18, fill: cyan, letterSpacing: 8, uppercase: true }),
      text({ x: 100, y: 240, w: 1070, h: 80, text: "HOUR 047", fontFamily: "Bebas Neue", fontSize: 92, fill: cyan, letterSpacing: 6, uppercase: true }),
      text({ x: 96, y: 340, w: 1080, h: 420, text: "THE LOOP\nDOES NOT\nEND.", fontFamily: "Syne", fontWeight: 800, fontSize: 128, lineHeight: 0.88, fill: ink, uppercase: true, letterSpacing: -4 }),
      shape("rect", { x: 110, y: 820, w: 180, h: 6, fill: cyan, name: "tick" }),
      text({ x: 110, y: 870, w: 1000, h: 180, text: "Keep the artboard open. Nudge the type. Paint until the room is quiet. One hundred hours is a posture, not a timer.", fontFamily: "Outfit", fontSize: 32, lineHeight: 1.4, fill: dim }),
      text({ x: 110, y: 1600, w: 700, h: 80, text: "047 / 100\nSTILL PRESSING", fontFamily: "Chakra Petch", fontWeight: 600, fontSize: 28, lineHeight: 1.3, fill: ink, uppercase: true, letterSpacing: 4 }),
      text({ x: 820, y: 1620, w: 340, h: 60, text: "DO NOT LEAVE\nTHE GRID", fontFamily: "Share Tech Mono", fontSize: 16, lineHeight: 1.5, fill: cyan, align: "right", uppercase: true, letterSpacing: 3 }),
    ],
  },
  {
    id: "linkedin-strip",
    name: "Field Banner",
    category: "Social",
    formatId: "linkedin",
    description: "Quiet professional strip",
    background: ground,
    build: () => [
      shape("rect", { x: 0, y: 0, w: 12, h: 396, fill: cyan, name: "edge" }),
      text({ x: 64, y: 80, w: 900, h: 40, text: "THE VOICE  /  STUDIO", fontFamily: "Share Tech Mono", fontSize: 18, fill: cyan, letterSpacing: 6, uppercase: true }),
      text({ x: 56, y: 140, w: 1100, h: 140, text: "Design that carries a voice.", fontFamily: "Fraunces", fontWeight: 600, fontSize: 56, fill: ink }),
      text({ x: 64, y: 310, w: 700, h: 40, text: "Posters · covers · stories · marks", fontFamily: "Outfit", fontSize: 22, fill: dim }),
      shape("ellipse", { x: 1320, y: 78, w: 180, h: 180, fill: "transparent", stroke: cyan, strokeWidth: 8, name: "orb" }),
    ],
  },
  {
    id: "a4-manifesto",
    name: "Studio Manifesto",
    category: "Print",
    formatId: "a4",
    description: "A4 editorial page",
    background: "#f4f1ea",
    build: () => [
      text({ x: 90, y: 80, w: 1060, h: 30, text: "THE VOICE  ·  WORKING NOTES", fontFamily: "Share Tech Mono", fontSize: 16, fill: "#3a4a42", letterSpacing: 6, uppercase: true }),
      text({ x: 80, y: 140, w: 1080, h: 200, text: "A poster is a\nmix, compressed.", fontFamily: "Fraunces", fontWeight: 600, fontSize: 64, lineHeight: 1.05, fill: "#121613" }),
      shape("rect", { x: 90, y: 380, w: 80, h: 4, fill: "#3fc6ff", name: "tick" }),
      text({ x: 90, y: 430, w: 1060, h: 420, text: "Type is the vocal. Colour is the room. Crop marks are the honesty of a press that still cares. We do not decorate. We hold a signal until it is loud enough to leave the studio.", fontFamily: "Outfit", fontSize: 28, lineHeight: 1.5, fill: "#3a4a42" }),
      text({ x: 90, y: 1560, w: 500, h: 80, text: "01  Grid\n02  Voice\n03  Cut", fontFamily: "Chakra Petch", fontWeight: 600, fontSize: 22, lineHeight: 1.4, fill: "#121613", uppercase: true, letterSpacing: 2 }),
      text({ x: 700, y: 1580, w: 450, h: 60, text: "Printed in the loop.\nNot a draft.", fontFamily: "IBM Plex Mono", fontSize: 16, lineHeight: 1.5, fill: "#3a4a42", align: "right" }),
    ],
  },
  {
    id: "reel-hook",
    name: "Reel Hook",
    category: "Social",
    formatId: "tiktok",
    description: "Vertical cold open",
    background: ground,
    build: () => [
      text({ x: 80, y: 120, w: 920, h: 40, text: "WATCH TO THE CUT", fontFamily: "Share Tech Mono", fontSize: 20, fill: cyan, letterSpacing: 8, align: "center", uppercase: true }),
      text({ x: 60, y: 620, w: 960, h: 520, text: "STOP\nSCROLLING.\nSTART\nPRESSING.", fontFamily: "Syne", fontWeight: 800, fontSize: 96, lineHeight: 0.9, fill: ink, align: "center", uppercase: true }),
      shape("rect", { x: 340, y: 1640, w: 400, h: 64, fill: cyan, radius: 8, name: "cta" }),
      text({ x: 340, y: 1654, w: 400, h: 40, text: "OPEN THE BOARD", fontFamily: "Chakra Petch", fontWeight: 600, fontSize: 22, align: "center", fill: ground, uppercase: true, letterSpacing: 2 }),
    ],
  },
  {
    id: "blank-square",
    name: "Blank Square",
    category: "Custom",
    formatId: "square",
    description: "Empty artboard",
    background: "#ffffff",
    build: () => [],
  },
  {
    id: "blank-story",
    name: "Blank Story",
    category: "Custom",
    formatId: "ig-story",
    description: "Empty 9:16",
    background: "#ffffff",
    build: () => [],
  },
  {
    id: "blank-poster",
    name: "Blank Poster",
    category: "Custom",
    formatId: "poster",
    description: "Empty print",
    background: "#ffffff",
    build: () => [],
  },
];

export const TEMPLATE_CATEGORIES = ["All", ...[...new Set(TEMPLATES.map((t) => t.category))]];

export function templateById(id: string) {
  return TEMPLATES.find((t) => t.id === id);
}

export function instantiateTemplate(id: string): DesignDocument {
  const t = templateById(id) ?? TEMPLATES[0]!;
  return docFrom(t);
}

export function blankDocument(formatId: string, name = "Untitled"): DesignDocument {
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
      formatId: fmt.id,
    },
    nodes: [],
    createdAt: now,
    updatedAt: now,
  };
}
