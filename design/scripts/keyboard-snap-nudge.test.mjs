import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const src = readFileSync(new URL("../src/lib/design/group-transform.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const keys = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");
const snap = readFileSync(new URL("../src/lib/design/snap.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("keyboard nest nudge snaps with the drag guide set", () => {
  assert.match(src, /export function keyboardSnapNudge/);
  assert.match(src, /export function releaseSnapAxis/);
  assert.match(src, /smartSnap/);
  assert.match(src, /already on the line/);
  assert.match(src, /snapped to guide/);
  assert.match(store, /keyboardSnapNudge/);
  assert.match(store, /releaseNudgeGuides/);
  assert.match(store, /opts\?\: \{ snap\?: boolean \}/);
  assert.match(keys, /snap: s\.snap && !e\.altKey/);
  assert.match(keys, /releaseNudgeGuides/);
  assert.match(stage, /cueGuides/);
  assert.match(stage, /drawSmartGuides/);
  assert.match(stage, /nudgeHold/);
  assert.match(stage, /nest · guide/);
  assert.match(src, /snapped to equal gap/);
  assert.match(src, /equalGaps/);
  assert.match(store, /guides\.equalGaps/);
  assert.match(stage, /equal gap/);
  assert.match(snap, /equalGaps/);
  assert.match(snap, /gap\?: number/);
  assert.match(src, /export function getEqualGapHold/);
  assert.match(src, /export function formatEqualGapHold/);
  assert.match(src, /publishEqualGapHold/);
  assert.match(inspector, /data-equal-gap-hold/);
  assert.match(inspector, /Matched spacing while a drag or arrow holds the snap/);
  assert.match(stage, /setEqualGapHold/);
  assert.match(src, /export function setEqualGapHold/);

});
