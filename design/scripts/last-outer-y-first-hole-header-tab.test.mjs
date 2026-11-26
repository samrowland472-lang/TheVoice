import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from last outer-path y hops to first hole header when hole 0 has no point fields", () => {
  assert.match(a, /function shouldTabFromLastOuterYToFirstHoleHeader/);
  assert.match(a, /function lastOuterToFirstHoleHeader/);
  assert.match(a, /axis !== "y"/);
  assert.match(a, /data-point\^="path-"/);
  assert.match(a, /data-select-hole="0"/);
  assert.match(a, /function pickFirstHoleHeaderTabTarget/);
  assert.match(barrel, /shouldTabFromLastOuterYToFirstHoleHeader/);
  assert.match(barrel, /pickFirstHoleHeaderTabTarget/);
  assert.match(view, /shouldTabFromLastOuterYToFirstHoleHeader/);
  assert.match(view, /pickFirstHoleHeaderTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(e\.currentTarget, header, header\)/);
  assert.match(view, /shouldTabFromLastOuterYToFirstHoleHeader\(from, false\)/);
  assert.match(ui, /shouldTabFromLastOuterYToFirstHoleHeader/);
  assert.match(ui, /pickFirstHoleHeaderTabTarget/);
});

test("last outer y to first hole header holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toHeader\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(view, /shouldTabFromLastOuterYToFirstHoleHeader/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /focusFirstHoleHeader/);
});

test("document-level Tab from last outer Y hops to first hole header when wrap is off", () => {
  assert.match(inspector, /shouldTabFromLastOuterYToFirstHoleHeader/);
  assert.match(inspector, /pickFirstHoleHeaderTabTarget/);
  assert.match(inspector, /tagHoleHeaderTabCrossing\(from, header, header\)/);
  assert.match(inspector, /closest\("\[data-path-inspector\]"\)\?\.querySelector\("\[data-hole-list\]"\)/);
  assert.match(inspector, /list\.scrollTop = saved/);
  assert.match(inspector, /focus\(\{ preventScroll: true \}\)/);
});
