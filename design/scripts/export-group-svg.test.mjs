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
  assert.match(exp, /if \(!n\.visible\) return svgHiddenGroupHoist\(n, inner\)/);
  assert.match(exp, /export function svgHiddenGroupHoist/);
  assert.match(exp, /data-hoist="1"/);
  assert.match(exp, /do not paint a group box/);
  assert.doesNotMatch(exp, /data-hoist="1"[\s\S]{0,80}data-kind="group"/);
});

test("hidden group opacity and blend still wrap the hoisted nest", () => {
  assert.match(exp, /svgHiddenGroupHoist[\s\S]{0,280}svgOpacityAttr\(n\)/);
  assert.match(exp, /svgHiddenGroupHoist[\s\S]{0,320}svgGroupBlendStyle\(n\)/);
  assert.match(exp, /if \(!opacity && !blend && !rot\) return inner/);
  assert.match(top, /hidden nest keeps opacity/);
  const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
  assert.match(inspector, /do not paint a box/);
  assert.match(inspector, /still wrap that nest/);
});

test("export toast names wrapped groups", () => {
  assert.match(top, /group\$\{groups.length === 1 \? "" : "s"\} wrapped/);
  assert.match(top, /kind === "group"/);
});

test("group opacity and blend ride the wrapping g", () => {
  assert.match(exp, /export function svgOpacityAttr/);
  assert.match(exp, /\$\{svgOpacityAttr\(n\)\}\$\{blendAttr\(n\)\}/);
  assert.match(exp, /Opacity sits on this <g>/);
  assert.match(top, /opacity rides the group/);
  assert.match(top, /svgGroupExportNote/);
});

test("text and path layers keep their own opacity outside a group wrap", () => {
  assert.match(exp, /\$\{svgOpacityAttr\(t\)\}/);
  assert.match(exp, /\$\{svgOpacityAttr\(n\)\}/);
  const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
  assert.match(inspector, /Each layer still keeps its own opacity/);
});

test("group blend isolates the nest before compositing against the artboard", () => {
  assert.match(exp, /export function svgGroupBlendStyle/);
  assert.match(exp, /isolation:isolate;mix-blend-mode:/);
  assert.match(exp, /data-isolate="1"/);
  assert.match(exp, /\$\{svgOpacityAttr\(n\)\}\$\{svgGroupBlendStyle\(n\)\}/);
  assert.doesNotMatch(exp, /svgGroupOpen[\s\S]{0,220}\$\{blendAttr\(n\)\}/);
  assert.match(top, /blend isolated/);
  const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
  assert.match(inspector, /isolates this group/);
  assert.match(inspector, /one unit against the artboard/);
});

test("group rotation rides the SVG group transform", () => {
  assert.match(exp, /export function svgGroupRotateTransform/);
  assert.match(exp, /data-rotate="1"/);
  assert.match(exp, /\$\{svgGroupRotateTransform\(n\)\}\$\{svgOpacityAttr\(n\)\}/);
  assert.match(exp, /turns the nest about the group centre/);
  assert.match(exp, /const rot = svgGroupRotateTransform\(n\)/);
  assert.match(top, /rotation rides the group/);
  const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
  assert.match(inspector, /Rotation rides the group on the board, PNG, and SVG/);
  assert.match(inspector, /nest turns as one unit/);
});
