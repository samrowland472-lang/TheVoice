import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Shift+Tab from first hole-path x hops to that hole header", () => {
  assert.match(a, /function shouldShiftTabToSameHoleHeader/);
  assert.match(a, /i !== 0/);
  assert.match(a, /axis !== "x"/);
  assert.match(a, /data-select-hole="\$\{h\}"/);
  assert.match(ui, /shouldShiftTabToSameHoleHeader/);
  assert.match(ui, /pickSameHoleHeaderTabTarget/);
});

test("first hole x hop tags crossings and holds both list scrolls", () => {
  assert.match(b, /data-select-hole/);
  const xBlock = ui.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /shouldShiftTabToSameHoleHeader/);
  assert.match(xBlock, /tagHolePointTabCrossing\(e\.currentTarget, header, header\)/);
  assert.match(xBlock, /tagHoleHeaderTabCrossing/);
  assert.match(xBlock, /data-hole-list/);
  assert.match(xBlock, /savedHoles/);
  assert.match(xBlock, /savedPoints/);
});
