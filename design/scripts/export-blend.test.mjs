import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const typeFields = readFileSync(new URL("../src/components/studio/inspector-type.tsx", import.meta.url), "utf8");

test("PNG rasterize draws through drawDocument so blend is baked", () => {
  assert.match(exp, /export function rasterize/);
  assert.match(exp, /drawDocument\(ctx, doc/);
  assert.match(render, /ctx.globalCompositeOperation = n.blend/);
});

test("SVG export writes mix-blend-mode for non-normal layers", () => {
  assert.match(exp, /function blendAttr/);
  assert.match(exp, /mix-blend-mode/);
  assert.match(exp, /hard-light/);
  assert.match(exp, /\$\{blendAttr\(n\)\}/);
});

test("single text inspector always shows tracking leading and optical sliders", () => {
  assert.match(inspector, /texts.length === 1/);
  assert.match(inspector, /TextFields/);
  assert.match(typeFields, /aria-label="type tracking"/);
  assert.match(typeFields, /aria-label="type leading"/);
  assert.match(typeFields, /aria-label="type optical size"/);
  assert.match(typeFields, /FALLBACK_OPSZ/);
});
