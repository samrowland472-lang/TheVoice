import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const top = readFileSync(new URL("../src/components/studio/top-bar.tsx", import.meta.url), "utf8");

test("SVG export wraps groups in g tags and keeps children inside", () => {
  assert.match(exp, /export function svgGroupOpen/);
  assert.match(exp, /data-kind="group"/);
  assert.match(exp, /data-name=/);
  assert.match(exp, /if \(isGroup\(n\)\)/);
  assert.match(exp, /\$\{svgGroupOpen\(n, prefix\)\}\$\{inner\}<\/g>/);
  assert.match(exp, /n\.parentId && ids\.has\(n\.parentId\)/);
  assert.doesNotMatch(exp, /isGroup\(n\)[\s\S]{0,80}<rect/);
});

test("hidden groups hoist visible children instead of painting a box", () => {
  assert.match(exp, /if \(!n\.visible\) return inner/);
});

test("export toast names wrapped groups", () => {
  assert.match(top, /group\$\{groups.length === 1 \? "" : "s"\} wrapped/);
  assert.match(top, /kind === "group"/);
});

test("group opacity and blend ride the wrapping g", () => {
  assert.match(exp, /export function svgOpacityAttr/);
  assert.match(exp, /\$\{svgOpacityAttr\(n\)\}\$\{blendAttr\(n\)\}/);
  assert.match(exp, /Opacity and blend sit on this <g>/);
  assert.match(top, /opacity rides the group/);
  assert.match(top, /svgGroupExportNote/);
});

test("text and path layers keep their own opacity outside a group wrap", () => {
  assert.match(exp, /\$\{svgOpacityAttr\(t\)\}/);
  assert.match(exp, /\$\{svgOpacityAttr\(n\)\}/);
  const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
  assert.match(inspector, /Each layer still keeps its own opacity/);
});
