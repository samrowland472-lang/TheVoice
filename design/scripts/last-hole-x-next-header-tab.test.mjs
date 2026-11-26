import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Tab from last hole-path x hops to the next hole header", () => {
  assert.match(a, /function shouldTabFromLastHoleXToNextHeader/);
  assert.match(a, /axis !== "x"/);
  assert.match(a, /data-select-hole="\$\{h \+ 1\}"/);
  const xBlock = ui.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /shouldTabFromLastHoleXToNextHeader/);
  assert.match(xBlock, /pickNextHoleHeaderTabTarget/);
  assert.match(xBlock, /tagHolePointTabCrossing\(e\.currentTarget, header, header\)/);
});

test("last-hole x hop holds Points and Holes list scroll when both are mid-scroll", () => {
  assert.match(b, /fromPoint && toHeader/);
  assert.match(b, /data-select-hole/);
  const xBlock = ui.split('data-path-axis="x"')[1] ?? "";
  assert.match(xBlock, /shouldTabFromLastHoleXToNextHeader/);
  assert.match(xBlock, /tagHolePointTabCrossing\(e\.currentTarget, header, header\)/);
  assert.match(b, /fromPoint && toHeader\) holdPointAndHoleLists/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-point-list\]"\)/);
  assert.match(b, /snapshotScroll\(from, to, "\[data-hole-list\]"\)/);
});
