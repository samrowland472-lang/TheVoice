import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Tab from last hole-path y hops to next hole first-point x", () => {
  assert.match(a, /function shouldTabFromLastHoleYToNextFirstX/);
  assert.match(a, /axis !== "y"/);
  assert.match(a, /data-point\^="hole-\$\{h \+ 1\}-"/);
  assert.match(a, /function pickNextHoleFirstPointXTabTarget/);
  assert.match(a, /data-path-axis="x"/);
  assert.match(ui, /function focusNextHoleFirstX/);
  assert.match(ui, /shouldTabFromLastHoleYToNextFirstX/);
  assert.match(ui, /pickNextHoleFirstPointXTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, nextX, nextX\)/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /focusNextHoleFirstX/);
});

test("last-hole y to next first x holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toPoint && fromPoint !== toPoint\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(ui, /function focusNextHoleFirstX/);
  assert.match(ui, /focus\(\{ preventScroll: true \}\)/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /focusNextHoleFirstX/);
  assert.match(ui, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
});
