import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const mixed = readFileSync(new URL("../src/components/studio/mixed-type.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const fields = readFileSync(new URL("../src/components/studio/inspector-type.tsx", import.meta.url), "utf8");

test("mixed type writes family size tracking onto every pick", () => {
  assert.match(mixed, /function patch\(partial: Partial<TextNode>/);
  assert.match(mixed, /updateNodes\(ids, partial/);
  assert.match(mixed, /fontFamily/);
  assert.match(mixed, /fontSize/);
  assert.match(mixed, /letterSpacing/);
  assert.match(mixed, /type family mixed/);
  assert.match(mixed, /type size mixed/);
  assert.match(mixed, /type tracking mixed/);
});

test("chips stamp a layer full type and match key", () => {
  assert.match(mixed, /Unify full type with/);
  assert.match(mixed, /cloneType/);
  assert.match(mixed, /Match key/);
  assert.match(mixed, /Reset type/);
});

test("inspector hosts mixed type and hides key sliders", () => {
  assert.match(inspector, /MixedType/);
  assert.match(inspector, /hideType=/);
  assert.match(fields, /hideType/);
});
