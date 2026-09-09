import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const closed = readFileSync(new URL("../src/lib/design/path-point-tab-closed.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("first-outer Shift+Tab hops accept the y axis when x already leaves", () => {
  assert.match(a, /axis !== "x" && axis !== "y"/);
  assert.match(closed, /axis !== "x" && axis !== "y"/);
  assert.match(ui, /data-path-axis="y"/);
  assert.match(ui, /shouldShiftTabFromFirstOuterToOutline/);
  assert.match(ui, /shouldShiftTabFromFirstOuterToOffset/);
  assert.match(ui, /shouldShiftTabFromFirstOuterToClosed/);
  assert.match(ui, /shouldShiftTabFromFirstOuterToRound/);
  assert.match(ui, /shouldShiftTabFromFirstOuterToSimplify/);
});

test("y Shift+Tab to previous control tags the crossing and holds Points scroll", () => {
  assert.match(b, /fromPoint && toExit/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /shouldShiftTabFromFirstOuterToOutline/);
  assert.match(yBlock, /tagHolePointTabCrossing\(e\.currentTarget, outline, outline\)/);
  assert.match(yBlock, /scrollTop = saved/);
});
