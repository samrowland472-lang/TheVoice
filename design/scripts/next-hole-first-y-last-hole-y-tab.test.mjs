import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-next-header-x.ts", import.meta.url), "utf8");
const lastY = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next hole first-point y hops to last hole-path y", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleFirstYToLastHoleY/);
  assert.match(a, /function pickLastHoleLastPointYTabTarget/);
  assert.match(a, /holeIndexFromPointKey/);
  assert.match(a, /data-path-axis="y"/);
  assert.match(lastY, /function shouldShiftTabFromFirstHoleYToPrevLastY/);
  assert.match(barrel, /shouldShiftTabFromNextHoleFirstYToLastHoleY/);
  assert.match(barrel, /pickLastHoleLastPointYTabTarget/);
  assert.match(view, /function focusPrevHoleLastY/);
  assert.match(view, /shouldShiftTabFromNextHoleFirstYToLastHoleY/);
  assert.match(view, /pickLastHoleLastPointYTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(from, lastY, lastY\)/);
  assert.match(view, /focusPrevHoleLastY/);
  assert.match(ui, /shouldShiftTabFromNextHoleFirstYToLastHoleY/);
  assert.match(ui, /pickLastHoleLastPointYTabTarget/);
});

test("next hole first y to last hole y holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toPoint && fromPoint !== toPoint\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(view, /function focusPrevHoleLastY/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  assert.match(view, /focusPrevHoleLastY\(from\)/);
  assert.match(view, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
  assert.match(ui, /function focusPrevHoleLastY/);
});
