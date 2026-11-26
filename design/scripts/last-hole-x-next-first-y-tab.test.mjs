import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");

test("Tab from last hole-path x hops to next hole first-point y", () => {
  assert.match(a, /function shouldTabFromLastHoleXToNextFirstY/);
  assert.match(a, /if \(shouldTabFromLastHoleXToNextFirstY\(from, false\)\) return false/);
  assert.match(a, /data-point\^="hole-\$\{h \+ 1\}-"/);
  assert.match(a, /function pickNextHoleFirstPointYTabTarget/);
  assert.match(a, /data-path-axis="y"/);
  assert.match(view, /function focusNextHoleFirstY/);
  assert.match(view, /shouldTabFromLastHoleXToNextFirstY/);
  assert.match(view, /pickNextHoleFirstPointYTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(from, nextY, nextY\)/);
  assert.match(view, /focusNextHoleFirstY/);
  assert.match(ui, /shouldTabFromLastHoleXToNextFirstY/);
});

test("last-hole x to next first y holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toPoint && fromPoint !== toPoint\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(view, /function focusNextHoleFirstY/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  assert.match(view, /focusNextHoleFirstY\(from\)/);
  assert.match(view, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
  assert.match(ui, /function focusNextHoleFirstY/);
});
