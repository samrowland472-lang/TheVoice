import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const impl = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from first hole header hops to last outer-path y when hole 0 has no point fields", () => {
  assert.match(a, /function shouldShiftTabFromFirstHoleHeaderToLastOuterY/);
  assert.match(a, /data-select-hole/);
  assert.match(a, /data-point\^="path-"/);
  assert.match(a, /data-path-axis="y"/);
  assert.match(a, /function pickLastOuterLastPointYTabTarget/);
  assert.match(barrel, /shouldShiftTabFromFirstHoleHeaderToLastOuterY/);
  assert.match(barrel, /pickLastOuterLastPointYTabTarget/);
  assert.match(impl, /shouldShiftTabFromFirstHoleHeaderToLastOuterY/);
  assert.match(impl, /pickLastOuterLastPointYTabTarget/);
  assert.match(impl, /tagHolePointTabCrossing\(from, lastY, lastY\)/);
});

test("first hole header Shift+Tab to last outer y holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromHeader && toPoint\) holdPointAndHoleLists|fromPoint && toHeader\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(impl, /shouldShiftTabFromFirstHoleHeaderToLastOuterY/);
  assert.match(impl, /focusHold\(lastY, "\[data-point-list\]", from\)/);
});
