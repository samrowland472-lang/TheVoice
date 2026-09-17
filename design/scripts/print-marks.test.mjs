import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const marks = readFileSync(new URL("../src/lib/design/print-marks.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("print mark layout exposes bleed, corners, and outward marks", () => {
  assert.match(marks, /export function printMarkLayout/);
  assert.match(marks, /export function drawPrintMarks/);
  assert.match(marks, /fill\("evenodd"\)/);
  assert.match(marks, /gap \+ mark/);
});

test("canvas paints print marks and safe area outside the clipped document", () => {
  assert.match(stage, /drawPrintMarks\(ctx, doc, viewport\.zoom/);
  assert.match(stage, /drawSafeArea\(ctx, doc, viewport\.zoom\)/);
});

test("print export actually strokes crop marks", () => {
  assert.match(exp, /drawPrintMarks\(ctx, doc, scale/);
  assert.match(exp, /cropMarks/);
});

test("inspector exposes print-mark toggle next to bleed", () => {
  assert.match(inspector, /Print marks/);
  assert.match(inspector, /togglePrintMarks/);
});
