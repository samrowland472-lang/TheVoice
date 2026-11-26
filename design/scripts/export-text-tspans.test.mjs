import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");

test("SVG text emits tspans per line instead of a baseline hack", () => {
  assert.match(exp, /svgTextMarkup/);
  assert.match(exp, /layoutTextLines/);
  assert.match(exp, /<tspan x=/);
  assert.match(exp, /dominant-baseline="hanging"/);
  assert.doesNotMatch(exp, /n\.y \+ n\.h \* 0\.8/);
});

test("SVG wrap measure uses shared tracking helper", () => {
  assert.match(exp, /measureTracked/);
  assert.match(exp, /estimateGlyphWidth/);
});

test("SVG text respects align via text-anchor and hanging startY", () => {
  assert.match(exp, /text-anchor="\$\{anchor\}"/);
  assert.match(exp, /t\.align === "center"/);
  assert.match(exp, /startY \+ i \* lineHeight/);
});

test("SVG paths emit fill-rule and cut hole rings", () => {
  assert.match(exp, /partitionPathHoles/);
  assert.match(exp, /pathFillRule/);
  assert.match(exp, /fill-rule="\$\{rule\}"/);
});
