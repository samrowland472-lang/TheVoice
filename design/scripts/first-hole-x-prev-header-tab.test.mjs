import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Shift+Tab from first hole-path x of hole N+1 hops to hole N header", () => {
  assert.match(a, /function shouldShiftTabToPrevHoleHeader/);
  assert.match(a, /h < 1/);
  assert.match(a, /i !== 0/);
  assert.match(a, /axis !== "x"/);
  assert.match(a, /data-select-hole="\$\{h - 1\}"/);
  const xBlock = ui.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /shouldShiftTabToPrevHoleHeader/);
  assert.match(xBlock, /pickPrevHoleHeaderTabTarget/);
  assert.match(xBlock, /tagHolePointTabCrossing\(e\.currentTarget, header, header\)/);
});

test("first-hole x hop to prev header holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toHeader\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  const xBlock = ui.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /shouldShiftTabToPrevHoleHeader/);
  assert.match(xBlock, /focus\(\{ preventScroll: true \}\)/);
  assert.match(xBlock, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
});
