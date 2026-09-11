import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const impl = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from first hole header hops to last outer-path y when hole 0 has no point fields", () => {
  assert.match(a, /function shouldShiftTabFromFirstHoleHeaderToLastOuterY/);
  assert.match(a, /function firstHoleHeaderToLastOuterY/);
  assert.match(a, /data-select-hole"\) !== "0"/);
  assert.match(a, /data-path-axis="y"/);
  assert.match(barrel, /shouldShiftTabFromFirstHoleHeaderToLastOuterY/);
  assert.match(impl, /shouldShiftTabFromFirstHoleHeaderToLastOuterY/);
  assert.match(impl, /pickLastOuterLastPointYTabTarget/);
  assert.match(ui, /shouldShiftTabFromFirstHoleHeaderToLastOuterY/);
});

test("first hole header to last outer y holds Points and Holes list scroll after growth", () => {
  assert.match(impl, /focusHold\(lastY, "\[data-point-list\]", from\)/);
  assert.match(impl, /tagHolePointTabCrossing\(from, lastY, lastY\)/);
});
