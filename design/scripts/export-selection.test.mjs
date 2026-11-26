import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/selection-document.ts", import.meta.url), "utf8");
const bar = readFileSync(new URL("../src/components/studio/top-bar.tsx", import.meta.url), "utf8");

test("selectionDocument keeps named nodes on the same artboard", () => {
  assert.match(exp, /export function selectionDocument/);
  assert.match(exp, /name: `\$\{doc\.name\} selection`/);
  assert.match(exp, /doc\.nodes\.filter\(\(n\) => keep\.has\(n\.id\)\)/);
});

test("export menu offers selection PNG and SVG", () => {
  assert.match(bar, /selectionDocument/);
  assert.match(bar, /sel-png/);
  assert.match(bar, /sel-svg/);
  assert.match(bar, /Selection PNG/);
  assert.match(bar, /Selection SVG/);
});

test("crop selection uses AABB and crop menu items", () => {
  assert.match(exp, /export function cropSelectionDocument/);
  assert.match(exp, /aabb\(slice\.nodes\)/);
  assert.match(bar, /cropSelectionDocument/);
  assert.match(bar, /crop-png/);
  assert.match(bar, /Crop PNG/);
  assert.match(bar, /Crop SVG/);
});

test("isolate export keeps visible nodes and menu items", () => {
  assert.match(exp, /export function isolateDocument/);
  assert.match(exp, /n\.visible/);
  assert.match(exp, /name: `\$\{doc\.name\} isolate`/);
  assert.match(exp, /export function cropIsolateDocument/);
  assert.match(bar, /isolateDocument/);
  assert.match(bar, /cropIsolateDocument/);
  assert.match(bar, /iso-png/);
  assert.match(bar, /Isolate PNG/);
  assert.match(bar, /Isolate SVG/);
  assert.match(bar, /Isolate crop PNG/);
  assert.match(bar, /disabled=\{\!isolateSnapshot\}/);
});
