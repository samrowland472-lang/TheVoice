import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from last outer-path x hops to first hole-path y when first hole x is missing", () => {
  assert.match(a, /function shouldTabFromLastOuterXToFirstHoleY/);
  assert.match(a, /function lastOuterXToFirstHole/);
  assert.match(a, /axis !== "x"/);
  assert.match(a, /data-point\^="path-"/);
  assert.match(a, /data-point\^="hole-0-"/);
  assert.match(a, /data-path-axis="y"/);
  assert.match(a, /function pickFirstHoleFirstPointYTabTarget/);
  assert.match(barrel, /shouldTabFromLastOuterXToFirstHoleY/);
  assert.match(barrel, /pickFirstHoleFirstPointYTabTarget/);
  assert.match(view, /function focusFirstHoleFirstY/);
  assert.match(view, /shouldTabFromLastOuterXToFirstHoleY/);
  assert.match(view, /pickFirstHoleFirstPointYTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(from, firstY, firstY\)/);
  const xBlock = view.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /focusFirstHoleFirstY/);
  assert.match(ui, /function focusFirstHoleFirstY/);
  assert.match(ui, /shouldTabFromLastOuterXToFirstHoleY/);
});

test("last outer x to first hole y holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toPoint && fromPoint !== toPoint\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(view, /function focusFirstHoleFirstY/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  assert.match(view, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
  const xBlock = ui.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /focusFirstHoleFirstY/);
});
