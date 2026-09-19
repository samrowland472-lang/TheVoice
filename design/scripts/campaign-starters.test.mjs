import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("campaign helpers assign story square banner slots", () => {
  const src = readFileSync(new URL("../src/lib/design/campaign.ts", import.meta.url), "utf8");
  assert.match(src, /CAMPAIGN_STARTERS/);
  assert.match(src, /ig-story/);
  assert.match(src, /ig-post/);
  assert.match(src, /x-post/);
  assert.match(src, /function campaignSlot/);
  assert.match(src, /function missingStarterFormats/);
  assert.match(src, /function campaignPages/);
});

test("present dots use campaignPages order not hub recency", () => {
  const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
  assert.match(chrome, /campaignPages\(index, live.campaignId\)/);
  assert.match(chrome, /campaignPages\(index, doc.campaignId\)/);
  assert.match(chrome, /role="tablist"/);
  assert.match(chrome, /aria-label="Campaign pages"/);
});

test("store binds a campaign id and fills missing starter pages", () => {
  const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
  assert.match(store, /makeCampaign/);
  assert.match(store, /uid\("camp"\)/);
  assert.match(store, /missingStarterFormats/);
  assert.match(store, /campaignId/);
  assert.match(store, /addCampaignPage/);
  assert.match(store, /duplicateCampaignPage/);
  assert.match(store, /saveLastOpenedId/);
});

test("strip can duplicate the open page into the same set", () => {
  const strip = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
  assert.match(strip, /duplicateCampaignPage/);
  assert.match(strip, /Duplicate campaign page/);
});

test("strip jumps siblings and hub resumes last board unless stay-hub", () => {
  const strip = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
  assert.match(strip, /navigate\(\{ to: "\/studio\/\$id"/);
  const hub = readFileSync(new URL("../src/components/hub-view.tsx", import.meta.url), "utf8");
  assert.match(hub, /lastOpenedToResume/);
  const bar = readFileSync(new URL("../src/components/studio/top-bar.tsx", import.meta.url), "utf8");
  assert.match(bar, /markStayOnHub/);
});
