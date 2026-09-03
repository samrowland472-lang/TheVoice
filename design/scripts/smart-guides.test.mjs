import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const snap = readFileSync(new URL("../src/lib/design/snap.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("smartSnap exposes live edge/center guides and spacing ticks", () => {
  assert.match(snap, /export function smartSnap/);
  assert.match(snap, /export function drawSmartGuides/);
  assert.match(snap, /export function spacingTicks/);
  assert.match(snap, /artboard\.width \/ 2/);
});

test("select drag wires smartSnap and draws phosphor guides", () => {
  assert.match(stage, /kind: "move"/);
  assert.match(stage, /smartSnap\(/);
  assert.match(stage, /drawSmartGuides\(/);
  assert.match(stage, /s\.snap && !e\.altKey|Boolean\(s\.snap\) && !e\.altKey/);
});
