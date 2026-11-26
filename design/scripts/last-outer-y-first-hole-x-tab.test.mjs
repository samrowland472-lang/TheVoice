import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from last outer-path y hops to first hole-path x", () => {
  assert.match(a, /function shouldTabFromLastOuterYToFirstHoleX/);
  assert.match(a, /axis !== "y"/);
  assert.match(a, /data-point\^="path-"/);
  assert.match(a, /data-point\^="hole-0-"/);
  assert.match(a, /function pickFirstHoleFirstPointXTabTarget/);
  assert.match(a, /data-path-axis="x"/);
  assert.match(barrel, /shouldTabFromLastOuterYToFirstHoleX/);
  assert.match(barrel, /pickFirstHoleFirstPointXTabTarget/);
  assert.match(view, /function focusFirstHoleFirstX/);
  assert.match(view, /shouldTabFromLastOuterYToFirstHoleX/);
  assert.match(view, /pickFirstHoleFirstPointXTabTarget/);
  assert.match(view, /tagHolePointTabCrossing\(from, firstX, firstX\)/);
  const yBlock = view.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /focusFirstHoleFirstX/);
  assert.match(ui, /function focusFirstHoleFirstX/);
  assert.match(ui, /shouldTabFromLastOuterYToFirstHoleX/);
});

test("last outer y to first hole x holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toPoint && fromPoint !== toPoint\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(view, /function focusFirstHoleFirstX/);
  assert.match(view, /focus\(\{ preventScroll: true \}\)/);
  assert.match(view, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /focusFirstHoleFirstX/);
});
