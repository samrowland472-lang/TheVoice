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

test("edge handles pin the opposite edge in world space", () => {
  assert.match(src, /export function edgePinDelta/);
  assert.match(src, /export function oppositeEdgePoint/);
  assert.match(src, /export function translateNest/);
  assert.match(src, /opposite edge/);
  assert.match(stage, /edgePinDelta/);
  assert.match(stage, /opposite edge pinned/);
  assert.match(stage, /edges pin the opposite side/);
  const from = { x: 0, y: 0, w: 100, h: 100 };
  const to = { x: 0, y: 0, w: 160, h: 100 };
  const rot = 90 * Math.PI / 180;
  const spin = (box, x, y) => {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const dx = x - cx;
    const dy = y - cy;
    return { x: cx + dx * Math.cos(rot) - dy * Math.sin(rot), y: cy + dx * Math.sin(rot) + dy * Math.cos(rot) };
  };
  const before = spin(from, 0, 50);
  const after = spin(to, 0, 50);
  const dx = before.x - after.x;
  const dy = before.y - after.y;
  assert.ok(Math.abs(dx) > 1 || Math.abs(dy) > 1, "a spun east drag must translate to keep the west edge");
  const pinned = spin({ ...to, x: to.x + dx, y: to.y + dy }, 0 + dx, 50 + dy);
  assert.ok(Math.abs(pinned.x - before.x) < 1e-6);
  assert.ok(Math.abs(pinned.y - before.y) < 1e-6);
});
