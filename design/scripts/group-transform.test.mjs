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
  assert.match(src, /export function expandMovePlaces/);
  assert.match(src, /mapNodeToBox/);
  assert.match(src, /descendantIds/);
});

test("canvas draws one handle box for a selected group", () => {
  assert.match(stage, /selectionTransformBox/);
  assert.match(stage, /hitResizeHandle/);
  assert.match(stage, /scaleGroupNodes/);
  assert.match(stage, /kind: "resize"/);
  assert.match(stage, /drawTransformHandles/);
});

test("moving a group placeNodes expands descendants", () => {
  assert.match(store, /expandMovePlaces/);
  assert.match(layers, /applyGroupPatch/);
});
