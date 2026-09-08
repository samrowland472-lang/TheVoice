import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const tab = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const row = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Tab from Offset targets the first outer-path point", () => {
  assert.match(a, /shouldTabFromOffsetToFirstOuterPoint/);
  assert.match(a, /pickFirstOuterPointTabTarget/);
  assert.match(a, /data-path-exit/);
  assert.match(a, /data-point\^="path-"/);
  assert.match(tab, /shouldTabFromOffsetToFirstOuterPoint/);
  assert.match(tab, /pickFirstOuterPointTabTarget/);
  assert.match(ui, /shouldTabFromOffsetToFirstOuterPoint/);
  assert.match(ui, /pickFirstOuterPointTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, first, first\)/);
  assert.match(ui, /pointListRef\.current/);
});

test("exit-to-point Tab is a hole-point crossing so the list keeps scroll", () => {
  assert.match(b, /fromExit/);
  assert.match(b, /fromExit && toPoint/);
  assert.match(b, /data-path-exit/);
});

test("Shift+Tab from first outer-path x targets Offset", () => {
  assert.match(a, /shouldShiftTabFromFirstOuterToOffset/);
  assert.match(a, /pickOffsetTabTarget/);
  assert.match(a, /path-0/);
  assert.match(a, /data-path-exit="Offset"/);
  assert.match(tab, /shouldShiftTabFromFirstOuterToOffset/);
  assert.match(tab, /pickOffsetTabTarget/);
  assert.match(row, /shouldShiftTabFromFirstOuterToOffset/);
  assert.match(row, /pickOffsetTabTarget/);
  assert.match(row, /tagHolePointTabCrossing\(e\.currentTarget, offset, offset\)/);
  assert.match(row, /scrollTop = saved/);
});

test("point-to-exit Shift+Tab is a hole-point crossing so the list keeps scroll", () => {
  assert.match(b, /fromPoint && toExit/);
});
