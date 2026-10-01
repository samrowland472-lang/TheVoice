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
  assert.match(top, /group\$\{groups === 1 \? "" : "s"\} wrapped/);
  assert.match(top, /kind === "group"/);
});
