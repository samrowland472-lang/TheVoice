import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const bake = readFileSync(new URL("../src/lib/design/paint-bake.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");

test("paint bake helpers exist", () => {
  assert.match(bake, /export function paintBakeSize/);
  assert.match(bake, /export function paintNeedsBake/);
  assert.match(bake, /export function bakePaintNode/);
});

test("store bakes paint when width or height changes", () => {
  assert.match(store, /bakePaintIfSized/);
  assert.match(store, /bakePaintNode/);
  assert.match(store, /updateNodes/);
});

test("canvas draws cropped paint and photos", () => {
  assert.match(render, /drawBitmapNode/);
  assert.match(render, /cropSourceRect/);
});
