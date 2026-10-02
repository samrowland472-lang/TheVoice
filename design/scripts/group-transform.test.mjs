import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const src = readFileSync(new URL("../src/lib/design/group-transform.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const layers = readFileSync(new URL("../src/lib/design/layer-groups.ts", import.meta.url), "utf8");

test("group-transform scales nest from one box", () => {
  assert.match(src, /export function groupBox/);
  assert.match(src, /export function scaleGroupNodes/);
  assert.match(src, /export function frameScaleAxes/);
  assert.match(src, /export function scaleNodeInFrame/);
  assert.match(src, /no skew/);
  assert.match(src, /export function expandMovePlaces/);
  assert.match(src, /export function rotateGroupNodes/);
  assert.match(src, /export function hitRotateHandle/);
  assert.match(src, /descendantIds/);
});

test("canvas draws one handle box for a selected group", () => {
  assert.match(stage, /selectionTransformBox/);
  assert.match(stage, /hitResizeHandle/);
  assert.match(stage, /scaleGroupNodes/);
  assert.match(stage, /kind: "resize"/);
  assert.match(stage, /drawTransformHandles/);
  assert.match(stage, /rotateGroupNodes/);
  assert.match(stage, /kind: "rotate"/);
  assert.match(stage, /Nest scale/);
  assert.match(stage, /corners scale the spun nest/);
});

test("moving a group placeNodes expands descendants", () => {
  assert.match(store, /expandMovePlaces/);
  assert.match(layers, /applyGroupPatch/);
});

test("frame scale keeps a rotated rect rectangular", () => {
  const rotationDeg = 45;
  const sx = 2;
  const sy = 1;
  const r = (rotationDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const ux = sx * c;
  const uy = sy * s;
  const wScale = Math.hypot(ux, uy);
  const hScale = Math.hypot(-sx * s, sy * c);
  const rotation = (Math.atan2(uy, ux) * 180) / Math.PI;
  assert.ok(Math.abs(wScale - Math.hypot(Math.SQRT2, Math.SQRT1_2)) < 1e-9);
  assert.ok(Math.abs(hScale - Math.hypot(Math.SQRT2, Math.SQRT1_2)) < 1e-9);
  assert.ok(Math.abs(rotation - 26.56505117707799) < 1e-6);
  assert.match(src, /frameScaleAxes\(n\.rotation \|\| 0, sx, sy\)/);
});
