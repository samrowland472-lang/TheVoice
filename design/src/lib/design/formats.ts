export interface Format {
  id: string;
  label: string;
  group: string;
  width: number;
  height: number;
}

export const FORMATS: Format[] = [
  { id: "ig-post", label: "Instagram Post", group: "Social", width: 1080, height: 1080 },
  { id: "ig-portrait", label: "Instagram Portrait", group: "Social", width: 1080, height: 1350 },
  { id: "ig-story", label: "Instagram Story", group: "Social", width: 1080, height: 1920 },
  { id: "x-post", label: "X Post", group: "Social", width: 1600, height: 900 },
  { id: "yt-thumb", label: "YouTube Thumb", group: "Social", width: 1280, height: 720 },
  { id: "linkedin", label: "LinkedIn Banner", group: "Social", width: 1584, height: 396 },
  { id: "tiktok", label: "TikTok / Reel", group: "Social", width: 1080, height: 1920 },
  { id: "album", label: "Album Cover", group: "Music", width: 1400, height: 1400 },
  { id: "podcast", label: "Podcast Cover", group: "Music", width: 1400, height: 1400 },
  { id: "poster", label: "Concert Poster", group: "Print", width: 1275, height: 1875 },
  { id: "flyer", label: "Flyer", group: "Print", width: 1275, height: 1650 },
  { id: "card", label: "Business Card", group: "Print", width: 1050, height: 600 },
  { id: "logo", label: "Logo Mark", group: "Brand", width: 1080, height: 1080 },
  { id: "wide", label: "Presentation 16:9", group: "Brand", width: 1920, height: 1080 },
  { id: "a4", label: "A4 Page", group: "Print", width: 1240, height: 1754 },
  { id: "square", label: "Square 1:1", group: "Custom", width: 1080, height: 1080 },
];

export function formatById(id: string): Format {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0]!;
}

export const FORMAT_GROUPS = [...new Set(FORMATS.map((f) => f.group))];
