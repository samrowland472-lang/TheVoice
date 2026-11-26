import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Shift+Tab from first hole-path y hops to that hole header", () => {
  assert.match(a, /function shouldShiftTabToSameHoleHeader/);
  assert.match(a, /i !== 0/);
  assert.match(a, /axis !== "x" && axis !== "y"/);
  assert.match(a, /data-select-hole="\$\{h\}"/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /shouldShiftTabToSameHoleHeader/);
  assert.match(yBlock, /pickSameHoleHeaderTabTarget/);
  assert.match(yBlock, /tagHolePointTabCrossing\(e\.currentTarget, header, header\)/);
});

test("y hop to hole header holds Points and Holes list scroll", () => {
  assert.match(b, /data-select-hole/);
  assert.match(b, /data-hole-header-tab/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /scrollTop = saved/);
});
