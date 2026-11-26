import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Shift+Tab from first hole-path y hops to prev hole last-point x", () => {
  assert.match(a, /function shouldShiftTabFromFirstHoleYToPrevLastX/);
  assert.match(a, /axis !== "y"/);
  assert.match(a, /data-point\^="hole-\$\{h - 1\}-"/);
  assert.match(a, /function pickPrevHoleLastPointXTabTarget/);
  assert.match(a, /data-path-axis="x"/);
  assert.match(ui, /function focusPrevHoleLastX/);
  assert.match(ui, /shouldShiftTabFromFirstHoleYToPrevLastX/);
  assert.match(ui, /pickPrevHoleLastPointXTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, lastX, lastX\)/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /focusPrevHoleLastX/);
});

test("first-hole y to prev last x holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toPoint && fromPoint !== toPoint\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(ui, /function focusPrevHoleLastX/);
  assert.match(ui, /focus\(\{ preventScroll: true \}\)/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /focusPrevHoleLastX/);
  assert.match(ui, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
});
