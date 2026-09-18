import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const snapSrc = readFileSync(new URL("../src/lib/design/snap-guide.ts", import.meta.url), "utf8");
const rulers = readFileSync(new URL("../src/lib/design/rulers.ts", import.meta.url), "utf8");
const layer = readFileSync(new URL("../src/components/studio/ruler-layer.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");

test("guideProbe measures nearest sides", () => {
  assert.match(snapSrc, /export function guideProbe/);
  assert.match(snapSrc, /export function formatGuideProbe/);
  assert.match(snapSrc, /nearestSide/);
});

test("canvas draws probe label while a guide is live", () => {
  assert.match(rulers, /formatGuideProbe/);
  assert.match(rulers, /probe\?/);
  assert.match(layer, /setGuideProbe\(guideProbe/);
  assert.match(layer, /setGuideProbe\(null\)/);
});

test("inspector shows live guide distance", () => {
  assert.match(inspector, /formatGuideProbe\(probe\)/);
  assert.match(inspector, /setGuideProbe\(guideProbe/);
});
