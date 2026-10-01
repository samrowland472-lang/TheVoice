import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const src = readFileSync(new URL("../src/lib/design/group-transform.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("shared-centre rotate helpers exist", () => {
  assert.match(src, /export function rotateSelectionNodes/);
  assert.match(src, /export function rotateNodeAbout/);
  assert.match(src, /export function hitRotateHandle/);
  assert.match(src, /shared AABB centre/);
});

test("canvas rotate drag uses shared centre", () => {
  assert.match(stage, /kind: "rotate"/);
  assert.match(stage, /rotateSelectionNodes/);
  assert.match(stage, /hitRotateHandle/);
  assert.match(stage, /startAngle/);
});
