import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from first hole-path y hops to last outer-path y", () => {
  assert.match(a, /function shouldShiftTabFromFirstHoleYToLastOuterY/);
  assert.match(a, /function firstHoleYToLastOuterY/);
  assert.match(a, /axisWanted: "x" \| "y"/);
  assert.match(a, /data-point\^="hole-0-"/);
  assert.match(a, /data-point\^="path-"/);
  assert.match(a, /function pickLastOuterLastPointYTabTarget/);
  assert.match(a, /data-path-axis="y"/);
  assert.match(barrel, /shouldShiftTabFromFirstHoleYToLastOuterY/);
  assert.match(barrel, /pickLastOuterLastPointYTabTarget/);
  assert.match(view, /function focusLastOuterLastY/);
  assert.match(view, /shouldShiftTabFromFirstHoleYToLastOuterY/);
  assert.match(view, /pickLastOuterLastPointYTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(from, lastY, lastY\)/);
  const yBlock = view.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /focusLastOuterLastY/);
  assert.match(ui, /function focusLastOuterLastY/);
  assert.match(ui, /shouldShiftTabFromFirstHoleYToLastOuterY/);
});

test("first hole y to last outer y holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toPoint && fromPoint !== toPoint\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(view, /function focusLastOuterLastY/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  assert.match(view, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /focusLastOuterLastY/);
});
