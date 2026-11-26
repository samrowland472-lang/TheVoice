import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const snapSrc = readFileSync(new URL("../src/lib/design/snap-guide.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");
const rulers = readFileSync(new URL("../src/components/studio/ruler-layer.tsx", import.meta.url), "utf8");

test("snapGuideToObjects is exported and keys off object edges", () => {
  assert.match(snapSrc, /export function snapGuideToObjects/);
  assert.match(snapSrc, /nodeWorldAabb/);
  assert.match(snapSrc, /artboard\.width \/ 2/);
});

test("ruler drag snaps guides to objects when snap is on", () => {
  assert.match(rulers, /snapGuideToObjects/);
  assert.match(rulers, /s\.snap && !e\.altKey/);
});

test("inspector guide list drag snaps to objects", () => {
  assert.match(inspector, /GuideDragHandle/);
  assert.match(inspector, /snapGuideToObjects/);
  assert.match(inspector, /drag \$\{guide\.axis/);
});
