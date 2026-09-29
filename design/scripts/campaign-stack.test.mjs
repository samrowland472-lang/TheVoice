import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const campaign = readFileSync(new URL("../src/lib/design/campaign.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
const exportCamp = readFileSync(new URL("../src/lib/design/export-campaign.ts", import.meta.url), "utf8");

function campaignPages(index, campaignId) {
  if (!campaignId) return [];
  return index
    .filter((p) => p.campaignId === campaignId)
    .sort((a, b) => (a.campaignOrder ?? 1e9) - (b.campaignOrder ?? 1e9) || a.id.localeCompare(b.id));
}

function campaignStackIndex(pages, liveId) {
  const i = pages.findIndex((p) => p.id === liveId);
  return i < 0 ? 0 : i;
}

function campaignStackNeighbor(pages, liveId, delta) {
  if (pages.length === 0) return null;
  const i = campaignStackIndex(pages, liveId);
  const next = pages[(i + delta + pages.length * 8) % pages.length];
  return next && next.id !== liveId ? next.id : null;
}

test("present stack order matches campaign PDF page order", () => {
  const index = [
    { id: "c", campaignId: "camp", campaignOrder: 3 },
    { id: "a", campaignId: "camp", campaignOrder: 1 },
    { id: "b", campaignId: "camp", campaignOrder: 2 },
    { id: "x", campaignId: "other", campaignOrder: 0 },
  ];
  const pages = campaignPages(index, "camp");
  assert.deepEqual(pages.map((p) => p.id), ["a", "b", "c"]);
  assert.match(exportCamp, /campaignPages\(index, current\.campaignId\)/);
  assert.match(chrome, /campaignPages\(/);
  assert.match(chrome, /campaignStackNeighbor/);
  assert.match(chrome, /ArrowDown/);
  assert.match(chrome, /ArrowUp/);
});

test("present wrap flips last board to first like a looping stack", () => {
  const pages = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.equal(campaignStackNeighbor(pages, "c", 1), "a");
  assert.equal(campaignStackNeighbor(pages, "a", -1), "c");
  assert.equal(campaignStackNeighbor(pages, "b", 1), "c");
  assert.equal(campaignStackNeighbor([{ id: "solo" }], "solo", 1), null);
});
