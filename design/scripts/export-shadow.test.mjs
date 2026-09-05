import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const shadow = readFileSync(new URL("../src/lib/design/shadow.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");

test("canvas shadow params fatten blur by spread and flip inset offsets", () => {
  assert.match(shadow, /export function canvasShadowParams/);
  assert.match(shadow, /blur: shadow.blur \+ spread/);
  assert.match(shadow, /ox: shadow.ox \* flip/);
  assert.match(shadow, /oy: shadow.oy \* flip/);
  assert.match(shadow, /shadowInset\(shadow\) \? -1 : 1/);
});

test("artboard and PNG path apply canvasShadowParams", () => {
  assert.match(render, /canvasShadowParams\(n\.shadow\)/);
  assert.match(render, /ctx.shadowBlur = drop.blur/);
  assert.match(exp, /drawDocument\(ctx, doc/);
});

test("SVG export emits inset and spread filters matching the artboard", () => {
  assert.match(exp, /export function svgShadowFilter/);
  assert.match(exp, /canvasShadowParams\(shadow\)/);
  assert.match(exp, /operator="dilate"/);
  assert.match(exp, /operator="out"/);
  assert.match(exp, /svgShadowDefs/);
  assert.match(exp, /shadowAttr\(n\)/);
});
