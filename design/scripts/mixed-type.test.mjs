import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const mixed = readFileSync(new URL("../src/components/studio/mixed-type.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const fields = readFileSync(new URL("../src/components/studio/inspector-type.tsx", import.meta.url), "utf8");
const helpers = readFileSync(new URL("../src/lib/design/text-style.ts", import.meta.url), "utf8");

test("type helpers clone the full stack", () => {
  assert.match(helpers, /export function cloneType/);
  assert.match(helpers, /export function typeChipLabel/);
  assert.match(helpers, /export function normalizeType/);
  assert.match(helpers, /fontFamily/);
  assert.match(helpers, /fontSize/);
  assert.match(helpers, /letterSpacing/);
});

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
  assert.match(mixed, /typeChipLabel\(n, nodes\)/);
  assert.match(helpers, /export function typeAxesDiffer/);
  assert.match(helpers, /opsz auto/);
  assert.match(helpers, /wdth /);
});

test("inspector hosts mixed type and hides key sliders", () => {
  assert.match(inspector, /MixedType/);
  assert.match(inspector, /hideType=/);
  assert.match(fields, /hideType/);
});

test("mixed type writes optical size and width onto faces that support them", () => {
  assert.match(mixed, /type optical size mixed/);
  assert.match(mixed, /type width mixed/);
  assert.match(mixed, /writeAxis/);
  assert.match(mixed, /faceSupports/);
  assert.match(mixed, /opticalSize/);
  assert.match(mixed, /fontWidth/);
  assert.match(fields, /TypeAxes/);
  assert.match(fields, /type optical size/);
  assert.match(fields, /type width/);
});
