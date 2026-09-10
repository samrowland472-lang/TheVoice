import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from first hole-path x hops to last outer-path x when last y is missing", () => {
  assert.match(a, /function shouldShiftTabFromFirstHoleXToLastOuterX/);
  assert.match(a, /function firstHoleXToLastOuterX/);
  assert.match(a, /axisWanted: "x" \| "y"/);
  assert.match(a, /shouldShiftTabFromFirstHoleXToLastOuterY\(from, true\)\) return false/);
  assert.match(a, /data-point\^="hole-0-"/);
  assert.match(a, /data-point\^="path-"/);
  assert.match(a, /function pickLastOuterLastPointXTabTarget/);
  assert.match(a, /data-path-axis="x"/);
  assert.match(barrel, /shouldShiftTabFromFirstHoleXToLastOuterX/);
  assert.match(barrel, /pickLastOuterLastPointXTabTarget/);
  assert.match(view, /function focusLastOuterLastX/);
  assert.match(view, /shouldShiftTabFromFirstHoleXToLastOuterX/);
  assert.match(view, /pickLastOuterLastPointXTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(from, lastX, lastX\)/);
  const xBlock = view.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /focusLastOuterLastX/);
  assert.match(ui, /function focusLastOuterLastX/);
  assert.match(ui, /shouldShiftTabFromFirstHoleXToLastOuterX/);
});

test("first hole x to last outer x holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toPoint && fromPoint !== toPoint\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(view, /function focusLastOuterLastX/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  assert.match(view, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
  const xBlock = ui.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /focusLastOuterLastX/);
});
