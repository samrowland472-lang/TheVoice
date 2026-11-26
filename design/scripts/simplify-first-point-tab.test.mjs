import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const tab = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");

test("Tab from Simplify targets the first outer-path point", () => {
  assert.match(a, /shouldTabFromSimplifyToFirstOuterPoint/);
  assert.match(a, /data-path-exit"\) !== "Simplify"/);
  assert.match(a, /pickFirstOuterPointTabTarget/);
  assert.match(a, /data-point\^="path-"/);
  assert.match(tab, /shouldTabFromSimplifyToFirstOuterPoint/);
  assert.match(tab, /pickFirstOuterPointTabTarget/);
  assert.match(ui, /shouldTabFromSimplifyToFirstOuterPoint/);
  assert.match(ui, /pickFirstOuterPointTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, first, first\)/);
  assert.match(ui, /pointListRef\.current/);
});

test("exit-to-point Tab is a hole-point crossing so the list keeps scroll", () => {
  assert.match(b, /fromExit && toPoint/);
  assert.match(b, /data-path-exit/);
});
