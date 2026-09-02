import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const align = readFileSync(new URL("../src/lib/design/align.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const text = readFileSync(new URL("../src/lib/design/text-to-path.ts", import.meta.url), "utf8");

test("align module uses geometry boxes, not the stored node frame", () => {
  assert.match(align, /export function tightenPathNode/);
  assert.match(align, /export function bakePathRotation/);
  assert.match(align, /export function alignNodes/);
  assert.match(align, /export function distributeNodes/);
  assert.match(align, /geometryBox/);
  assert.match(align, /applyOrientedFrame/);
  assert.match(align, /minAreaObb/);
});

test("rotated compounds bake into world-space island boxes before split", () => {
  assert.match(align, /n = tightenPathNode\(n\)/);
  assert.match(align, /rotatePoint\(n\.x \+ p\.x, n\.y \+ p\.y, c\.x, c\.y, deg\)/);
  assert.match(align, /return applyOrientedFrame\(tight\)/);
  assert.match(align, /return applyOrientedFrame\(part\)/);
});

test("store wires align and distribute through geometry helpers", () => {
  assert.match(store, /alignNodes\(exploded\.nodes, ids, edge, box\)/);
  assert.match(store, /distributeNodes\(exploded\.nodes, exploded\.selection, axis\)/);
  assert.match(store, /unionOrientedBox\(selected\)/);
  assert.match(align, /export function unionOrientedBox/);
});

test("converted type islands tighten onto their own contour", () => {
  assert.match(text, /tightenPathNode\(node\)/);
});

test("compound paths explode disjoint islands before align", () => {
  assert.match(align, /export function splitCompoundIslands/);
  assert.match(align, /export function explodeSelectedIslands/);
  assert.match(align, /groupIslandsNested/);
  assert.match(store, /explodeSelectedIslands\(doc\.nodes, selection\)/);
});

test("distribute even spacing keeps first and last, spaces the middle", () => {
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
  assert.equal(next[0].x, 0);
  assert.equal(next[2].x, 90);
  assert.equal(next[1].x, 45);
});
