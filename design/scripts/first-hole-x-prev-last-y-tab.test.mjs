import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");

test("Shift+Tab from first hole-path x hops to prev hole last-point y", () => {
  assert.match(a, /function shouldShiftTabFromFirstHoleXToPrevLastY/);
  assert.match(a, /axisWanted: "x" \| "y", targetAxis: "x" \| "y"/);
  assert.match(a, /firstHoleToPrevLastAxis\(from, "x", "y"\)/);
  assert.match(a, /data-point\^="hole-\$\{h - 1\}-"/);
  assert.match(a, /function pickPrevHoleLastPointYTabTarget/);
  assert.match(a, /data-path-axis="y"/);
  assert.match(a, /if \(shouldShiftTabFromFirstHoleXToPrevLastY\(from, true\)\) return false/);
  assert.match(view, /function focusPrevHoleLastY/);
  assert.match(view, /shouldShiftTabFromFirstHoleXToPrevLastY/);
  assert.match(view, /pickPrevHoleLastPointYTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(from, lastY, lastY\)/);
  const xBlock = view.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /focusPrevHoleLastY/);
});

test("first-hole x to prev last y holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toPoint && fromPoint !== toPoint\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\\[data-point-list\\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\\[data-hole-list\\]"\)/);
  assert.match(view, /function focusPrevHoleLastY/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  assert.match(view, /focusPrevHoleLastY\(from\)/);
  assert.match(view, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
  assert.match(ui, /function focusPrevHoleLastY/);
  assert.match(ui, /shouldShiftTabFromFirstHoleXToPrevLastY/);
  const xBlock = ui.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /focusPrevHoleLastY/);
});
