/** Story / square / banner slots for a campaign set. */
export const CAMPAIGN_STARTERS = ["ig-story", "ig-post", "x-post"] as const;

export type CampaignSlot = "story" | "square" | "banner" | "other";

export function campaignSlot(formatId: string): CampaignSlot {
  if (formatId === "ig-story" || formatId === "tiktok") return "story";
  if (
    formatId === "ig-post" ||
    formatId === "square" ||
    formatId === "album" ||
    formatId === "logo" ||
    formatId === "podcast"
  ) {
    return "square";
  }
  if (formatId === "x-post" || formatId === "linkedin" || formatId === "wide" || formatId === "yt-thumb") {
    return "banner";
  }
  return "other";
}

/** Formats still needed so a set has story + square + banner. */
export function missingStarterFormats(existingFormatIds: string[]): string[] {
  const slots = new Set(existingFormatIds.map(campaignSlot));
  const missing: string[] = [];
  if (!slots.has("story")) missing.push("ig-story");
  if (!slots.has("square")) missing.push("ig-post");
  if (!slots.has("banner")) missing.push("x-post");
  return missing;
}

export function campaignPageName(base: string, formatLabel: string): string {
  const stem = base.replace(/\s+(Story|Square|Banner|Untitled)$/i, "").trim() || base;
  return `${stem} · ${formatLabel}`;
}
