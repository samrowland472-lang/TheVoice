import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Shift+Tab from first hole-path y of hole N+1 hops to hole N header", () => {
  assert.match(a, /function shouldShiftTabToPrevHoleHeader/);
  assert.match(a, /h < 1/);
  assert.match(a, /i !== 0/);
  assert.match(a, /axis !== "x" && axis !== "y"/);
  assert.match(a, /data-select-hole="\$\{h - 1\}"/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /shouldShiftTabToPrevHoleHeader/);
  assert.match(yBlock, /pickPrevHoleHeaderTabTarget/);
  assert.match(yBlock, /tagHolePointTabCrossing\(e\.currentTarget, header, header\)/);
});

test("first-hole y hop to prev header holds Points and Holes list scroll after growth", () => {
  assert.match(b, /fromPoint && toHeader\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /shouldShiftTabToPrevHoleHeader/);
  assert.match(yBlock, /focus\(\{ preventScroll: true \}\)/);
  assert.match(yBlock, /requestAnimationFrame\(\(\) => \{\s*list\.scrollTop = saved;\s*requestAnimationFrame/);
});
