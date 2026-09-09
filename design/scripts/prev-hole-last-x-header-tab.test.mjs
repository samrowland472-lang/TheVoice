import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const prev = readFileSync(new URL("../src/lib/design/path-prev-hole-tab.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");

test("Shift+Tab from hole header N+1 hops to last hole-path x of hole N", () => {
  assert.match(prev, /function shouldShiftTabToPrevHoleLastPoint/);
  assert.match(prev, /function pickPrevHoleLastPointTabTarget/);
  assert.match(prev, /data-point\^="hole-\$\{h - 1\}-"/);
  assert.match(prev, /data-path-axis="x"/);
  const axisBlock = prev.slice(prev.indexOf("function lastAxisInput"));
  const xPos = axisBlock.indexOf('data-path-axis="x"');
  const yPos = axisBlock.indexOf('data-path-axis="y"');
  assert.ok(xPos >= 0 && (yPos < 0 || xPos < yPos), "x is preferred over y");
  assert.match(ui, /shouldShiftTabToPrevHoleLastPoint/);
  assert.match(ui, /pickPrevHoleLastPointTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, last, last\)/);
});

test("header → last hole-path x holds Points and Holes list scroll when both are mid-scroll", () => {
  assert.match(b, /fromHeader && toPoint\) holdPointAndHoleLists/);
  assert.match(b, /fromPoint && toHeader\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  assert.match(ui, /focusHold\(last, "\[data-point-list\]", from\)/);
});
