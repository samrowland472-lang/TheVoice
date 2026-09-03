import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const snap = readFileSync(new URL("../src/lib/design/snap.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("snap exports marquee intersection helpers", () => {
  assert.match(snap, /export function nodesInMarquee/);
  assert.match(snap, /export function marqueeHitsNode/);
  assert.match(snap, /export function marqueeContainsNode/);
  assert.match(snap, /export function rectsIntersect/);
  assert.match(snap, /mode === "contain"/);
});

test("select tool starts a pasteboard marquee and commits intersecting ids", () => {
  assert.match(stage, /marqueeRef/);
  assert.match(stage, /nodesInMarquee\(/);
  assert.match(stage, /kind: "move"/);
  assert.match(stage, /smartSnap\(/);
  assert.match(stage, /drawSmartGuides\(/);
  assert.match(stage, /s\.snap && !e\.altKey/);
});

test("alt during marquee switches contain mode and draws corner ticks", () => {
  assert.match(stage, /contain: e\.altKey/);
  assert.match(stage, /mq\.contain = e\.altKey/);
  assert.match(stage, /mq\.contain \? "contain" : "intersect"/);
  assert.match(stage, /nodeWorldAabb/);
  assert.match(stage, /Alt contain/);
});
