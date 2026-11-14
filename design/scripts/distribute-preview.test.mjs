import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const preview = readFileSync(new URL("../src/lib/design/distribute-preview.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const keys = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");

test("distribute preview exposes arm, live, commit and phosphor draw", () => {
  assert.match(preview, /export function armDistributePreview/);
  assert.match(preview, /export function setLiveDistributePreview/);
  assert.match(preview, /export function commitDistributePreview/);
  assert.match(preview, /export function drawDistributePreview/);
  assert.match(preview, /export function formatDistributeGap/);
  assert.match(preview, /PHOSPHOR = "#3fc6ff"/);
  assert.match(stage, /drawDistributePreview\(ctx, distPlan/);
  assert.match(keys, /commitDistributePreview\(\)/);
  assert.match(keys, /clearDistributePreview\(\)/);
});

test("flush bloom includes layered orbital sparks and fading gap labels", () => {
  assert.match(preview, /Second slower harmonic spark/);
  assert.match(preview, /Gap-tick labels that fade into the flush diamond/);
  assert.match(preview, /labelFade/);
  assert.match(preview, /formatDistributeGap\(gap\)/);
});

test("even spacing keeps the first and last boxes and names one gap", () => {
  const boxes = [
    { id: "a", x: 0, w: 10 },
    { id: "b", x: 20, w: 10 },
    { id: "c", x: 90, w: 10 },
  ];
  const first = boxes[0];
  const last = boxes[boxes.length - 1];
  const span = last.x + last.w - first.x;
  const total = boxes.reduce((s, b) => s + b.w, 0);
  const gap = (span - total) / (boxes.length - 1);
  let cursor = first.x;
  const next = boxes.map((b) => {
    const x = cursor;
    cursor += b.w + gap;
    return { ...b, x };
  });
  assert.equal(gap, 35);
  assert.equal(next[0].x, 0);
  assert.equal(next[1].x, 45);
  assert.equal(next[2].x, 90);
});
