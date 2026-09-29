export function campaignPageName(base: string, formatLabel: string) {
  const stem = base.replace(/\s+·\s+.+$/, "").trim() || base;
  return `${stem} · ${formatLabel}`;
}

export function campaignPages<
  T extends { id: string; name?: string; campaignId?: string; formatId?: string; campaignOrder?: number },
>(index: T[], campaignId: string | undefined): T[] {
  if (!campaignId) return [];
  return index
    .filter((p) => p.campaignId === campaignId)
    .sort((a, b) => (a.campaignOrder ?? 1e9) - (b.campaignOrder ?? 1e9) || a.id.localeCompare(b.id));
}

/** Present and Campaign PDF walk this order: wrap so the last board flips to the first. */
export function campaignStackIndex(pages: { id: string }[], liveId: string): number {
  const i = pages.findIndex((p) => p.id === liveId);
  return i < 0 ? 0 : i;
}

export function campaignStackNeighbor(
  pages: { id: string }[],
  liveId: string,
  delta: number,
): string | null {
  if (pages.length === 0) return null;
  const i = campaignStackIndex(pages, liveId);
  const next = pages[(i + delta + pages.length * 8) % pages.length];
  return next && next.id !== liveId ? next.id : null;
}
