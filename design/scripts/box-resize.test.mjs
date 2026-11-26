import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const resize = readFileSync(new URL("../src/lib/design/box-resize.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");

test("box-resize exposes hit and map helpers", () => {
  assert.match(resize, /export function hitResizeHandle/);
  assert.match(resize, /export function resizeBox/);
  assert.match(resize, /export function mapNodeToBox/);
  assert.match(resize, /lockAspect/);
  assert.match(resize, /kind === "path"/);
});

test("canvas select tool hits resize handles before move", () => {
  assert.match(stage, /hitResizeHandle/);
  assert.match(stage, /mapNodeToBox/);
  assert.match(stage, /kind: "resize"/);
  assert.match(stage, /mapNodes\(/);
});

test("store mapNodes still bakes paint on size change", () => {
  assert.match(store, /paintNeedsBake\(n, next\.w, next\.h\)/);
  assert.match(store, /bakePaintNode\(next, next\.w, next\.h\)/);
});
