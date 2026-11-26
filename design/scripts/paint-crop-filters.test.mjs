import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const factory = readFileSync(new URL("../src/lib/design/node-factory.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const adjust = readFileSync(new URL("../src/components/studio/image-adjust.tsx", import.meta.url), "utf8");
const shortcuts = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");

test("paint layers carry crop and filters", () => {
  assert.match(types, /kind: "paint"/);
  assert.match(types, /export function isBitmap/);
  assert.match(factory, /crop: null/);
  assert.match(factory, /brightness: 1/);
});

test("canvas and export honor paint crop and filters", () => {
  assert.match(render, /drawBitmapNode/);
  assert.match(render, /cropSourceRect/);
  assert.match(render, /cssFilterStyle/);
  assert.match(exp, /n.kind === "image" \|\| n.kind === "paint"/);
  assert.match(exp, /clipPath id=/);
  assert.match(exp, /svgImageFilterStyle/);
});

test("inspector and alt-arrows crop paint as well as photos", () => {
  assert.match(adjust, /kind !== "image" && node.kind !== "paint"/);
  assert.match(adjust, /n.kind === "image" \|\| n.kind === "paint"/);
  assert.match(shortcuts, /nudgeCropHandle/);
  assert.match(shortcuts, /cropHandleForArrow/);
});
