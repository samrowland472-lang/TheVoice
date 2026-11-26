import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");

test("Tab from hole header hops to first hole-path x", () => {
  assert.match(a, /function shouldTabToSameHoleFirstPoint/);
  assert.match(a, /data-path-axis="x"/);
  assert.match(a, /data-point\^="hole-\$\{h\}-"/);
  assert.match(ui, /shouldTabToSameHoleFirstPoint/);
  assert.match(ui, /pickSameHoleFirstPointTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, first, first\)/);
});

test("header → first x holds Points and Holes list scroll when both are mid-scroll", () => {
  assert.match(ui, /snapshotList\(from, el, "\[data-hole-list\]"\)/);
  assert.match(ui, /snapshotList\(from, el, "\[data-point-list\]"\)/);
  assert.match(b, /data-select-hole/);
  assert.match(b, /fromHeader && toPoint/);
});
