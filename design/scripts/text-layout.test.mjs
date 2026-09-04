import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const layout = readFileSync(new URL("../src/lib/design/text-layout.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-type.tsx", import.meta.url), "utf8");
const fields = readFileSync(new URL("../src/components/studio/inspector-type.tsx", import.meta.url), "utf8");

test("layout helpers wrap and valign", () => {
  assert.match(layout, /export function wrapParagraph/);
  assert.match(layout, /export function layoutTextLines/);
  assert.match(layout, /normalizeWrap/);
  assert.match(layout, /normalizeValign/);
});

test("types carry wrap and valign", () => {
  assert.match(types, /export type Valign/);
  assert.match(types, /wrap\?: boolean/);
  assert.match(types, /valign\?: Valign/);
});

test("renderer lays out then clips to the frame", () => {
  assert.match(render, /layoutTextLines/);
  assert.match(render, /ctx.clip\(\)/);
});

test("inspector and mixed type write wrap valign", () => {
  assert.match(fields, /type wrap/);
  assert.match(fields, /type valign/);
  assert.match(mixed, /type wrap mixed/);
  assert.match(mixed, /type valign mixed/);
});
