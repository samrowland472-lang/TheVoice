export function campaignPageName(base: string, formatLabel: string) {
  const stem = base.replace(/\s+·\s+.+$/, "").trim() || base;
  return `${stem} · ${formatLabel}`;
}

export function campaignPages<
  T extends { id: string; campaignId?: string; formatId?: string; campaignOrder?: number },
>(index: T[], campaignId: string | undefined): T[] {
  if (!campaignId) return [];
  return index
    .filter((p) => p.campaignId === campaignId)
    .sort((a, b) => (a.campaignOrder ?? 1e9) - (b.campaignOrder ?? 1e9) || a.id.localeCompare(b.id));
}
