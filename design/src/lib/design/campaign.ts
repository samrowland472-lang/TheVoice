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
  return campaignStackAdvance(pages, liveId, delta).id;
}

/** Wrap is last→first or first→last. A later non-wrap step should drop wrap-pending. */
export function campaignStackAdvance(
  pages: { id: string }[],
  liveId: string,
  delta: number,
): { id: string | null; wrapped: boolean } {
  if (pages.length === 0) return { id: null, wrapped: false };
  const i = campaignStackIndex(pages, liveId);
  const step = Number.isFinite(delta) ? Math.trunc(delta) : 0;
  if (step === 0) return { id: null, wrapped: false };
  const raw = i + step;
  const wrapped = raw < 0 || raw >= pages.length;
  const next = pages[(raw + pages.length * 8) % pages.length];
  if (!next || next.id === liveId) return { id: null, wrapped: false };
  return { id: next.id, wrapped };
}

export function peekWrapPendingAfterAdvance(prevPending: boolean, wrapped: boolean): boolean {
  if (wrapped) return true;
  return false;
}
