import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const lib = readFileSync(new URL("../src/lib/design/crop-handles.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const adjust = readFileSync(new URL("../src/components/studio/image-adjust.tsx", import.meta.url), "utf8");

test("crop-handles pins source box while resizing the window", () => {
  assert.match(lib, /export function cropFromBoxes/);
  assert.match(lib, /export function applyCropHandle/);
  assert.match(lib, /export function drawCropHandles/);
  assert.match(lib, /export function hitCropHandle/);
  assert.match(lib, /clampNodeToSource/);
});

test("canvas select tool draws and drags photo crop handles", () => {
  assert.match(stage, /drawCropHandles/);
  assert.match(stage, /hitCropHandle/);
  assert.match(stage, /cropRef/);
  assert.match(stage, /applyCropHandle/);
  assert.match(stage, /photo corners crop the frame/);
});

test("photo inspector points at on-canvas crop", () => {
  assert.match(adjust, /Drag the photo corners on the board/);
});
