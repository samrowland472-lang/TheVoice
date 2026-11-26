import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const x = readFileSync(new URL("../src/lib/design/path-point-tab-last-x.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from last outer-path x hops to first hole header when last Y is missing", () => {
  assert.match(x, /function lastOuterXToFirstHoleHeader/);
  assert.match(x, /function shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(x, /axis !== "x"/);
  assert.match(x, /data-path-axis="y"/);
  assert.match(x, /data-point\^="path-"/);
  assert.match(x, /data-select-hole="0"/);
  assert.match(x, /shouldTabFromLastOuterYToFirstHoleHeader/);
  assert.match(x, /shouldTabFromLastOuterXToFirstHoleX/);
  assert.match(x, /shouldTabFromLastOuterXToFirstHoleY/);
  assert.match(barrel, /shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(view, /shouldTabFromLastOuterXToFirstHoleHeader\(from, false\)/);
  assert.match(ui, /shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(ui, /pickFirstHoleHeaderTabTarget/);
});

test("last outer X yields to last outer Y and first-hole point hops", () => {
  assert.match(x, /if \(row\.querySelector\('input\[data-path-axis="y"\]'\) != null\) return false/);
  assert.match(
    x,
    /if \(shouldTabFromLastOuterXToFirstHoleX\(from, shift\) \|\| shouldTabFromLastOuterXToFirstHoleY\(from, shift\)\) return false/,
  );
  assert.match(x, /if \(shouldTabFromLastOuterYToFirstHoleHeader\(from, shift\)\) return false/);
});

test("document-level Tab from last outer X hops to first hole header when wrap is off", () => {
  assert.match(inspector, /shouldTabFromLastOuterXToFirstHoleHeader/);
  assert.match(inspector, /shouldTabFromLastOuterYToFirstHoleHeader\(from, false\)/);
  assert.match(inspector, /shouldTabFromLastOuterXToFirstHoleHeader\(from, false\)/);
  assert.match(inspector, /pickFirstHoleHeaderTabTarget/);
  assert.match(inspector, /tagHoleHeaderTabCrossing\(from, header, header\)/);
  assert.match(inspector, /closest\("\[data-path-inspector\]"\)\?\.querySelector\("\[data-hole-list\]"\)/);
  assert.match(inspector, /list\.scrollTop = saved/);
  assert.match(inspector, /focus\(\{ preventScroll: true \}\)/);
});
