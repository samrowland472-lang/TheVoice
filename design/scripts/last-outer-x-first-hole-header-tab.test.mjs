import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-x.ts", import.meta.url), "utf8");
const y = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from last outer-path x hops to first hole header when last y is missing and hole 0 has no point fields", () => {
  assert.match(a, /function shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(a, /function lastOuterXToFirstHoleHeader/);
  assert.match(a, /axis !== "x"/);
  assert.match(a, /data-path-axis="y"/);
  assert.match(a, /data-point\^="path-"/);
  assert.match(a, /data-select-hole="0"/);
  assert.match(y, /function pickFirstHoleHeaderTabTarget/);
  assert.match(barrel, /shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(barrel, /pickFirstHoleHeaderTabTarget/);
  assert.match(view, /shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(view, /pickFirstHoleHeaderTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(e\.currentTarget, header, header\)/);
  const xBlock = view.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(ui, /shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(ui, /pickFirstHoleHeaderTabTarget/);
});

test("last outer x to first hole header holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toHeader\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(view, /shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  const xBlock = ui.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /focusFirstHoleHeader/);
});
