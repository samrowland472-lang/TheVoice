import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-next-header-x.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next hole first-point y hops to last hole header when last hole has no point fields", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleFirstYToLastHoleHeader/);
  assert.match(a, /shouldShiftTabFromNextHoleFirstYToLastHoleY/);
  assert.match(a, /shouldShiftTabFromNextHoleFirstYToLastHoleX/);
  assert.match(a, /function pickLastHoleHeaderTabTarget/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h - 1\)/);
  assert.match(a, /data-select-hole="\$\{h - 1\}"/);
  assert.match(a, /axis !== "y"/);
  assert.match(barrel, /shouldShiftTabFromNextHoleFirstYToLastHoleHeader/);
  assert.match(barrel, /pickLastHoleHeaderTabTarget/);
  assert.match(view, /function focusPrevHoleLastHeader/);
  assert.match(view, /shouldShiftTabFromNextHoleFirstYToLastHoleHeader/);
  assert.match(view, /pickLastHoleHeaderTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(from, header, header\)/);
  assert.match(view, /focusPrevHoleLastHeader/);
  assert.match(ui, /shouldShiftTabFromNextHoleFirstYToLastHoleHeader/);
  assert.match(ui, /pickLastHoleHeaderTabTarget/);
  assert.match(ui, /function focusPrevHoleLastHeader/);
});

test("next hole first y to last hole header holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toHeader\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(view, /function focusPrevHoleLastHeader/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  assert.match(view, /focusPrevHoleLastHeader\(from\)/);
  assert.match(view, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
  assert.match(ui, /function focusPrevHoleLastHeader/);
  assert.match(ui, /focusHoldEl\(header, from\)/);
});
