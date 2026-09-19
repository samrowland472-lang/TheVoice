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

const SLOT_RANK: Record<CampaignSlot, number> = {
  story: 0,
  square: 1,
  banner: 2,
  other: 3,
};

/** Strip / present order: story → square → banner → other, then id. */
export function campaignPages<T extends { id: string; campaignId?: string; formatId: string }>(
  index: T[],
  campaignId: string | undefined,
): T[] {
  if (!campaignId) return [];
  return index
    .filter((p) => p.campaignId === campaignId)
    .sort((a, b) => {
      const slot = SLOT_RANK[campaignSlot(a.formatId)] - SLOT_RANK[campaignSlot(b.formatId)];
      if (slot !== 0) return slot;
      return a.id.localeCompare(b.id);
    });
}
