import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const prev = readFileSync(new URL("../src/lib/design/path-prev-hole-tab.ts", import.meta.url), "utf8");
const tab = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");

test("Shift+Tab from hole 0 header targets last outer-path point", () => {
  assert.match(prev, /h === 0/);
  assert.match(prev, /data-point\^="path-"/);
  assert.match(tab, /\^path-\\d\+\$/);
  assert.match(ui, /shouldShiftTabToPrevHoleLastPoint/);
  assert.match(ui, /pickPrevHoleLastPointTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, last, last\)/);
});
