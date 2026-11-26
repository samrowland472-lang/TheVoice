import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const rules = readFileSync(new URL("../src/lib/design/fill-rule.ts", import.meta.url), "utf8");
const pathUi = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/lib/design/path-actions.ts", import.meta.url), "utf8");

test("PathNode stores per-hole fill rules", () => {
  assert.match(types, /holeFillRules\?: \("evenodd" \| "nonzero"\)\[\]/);
});

test("partition treats nonzero holes as islands and evenodd as punches", () => {
  assert.match(rules, /export function partitionPathHoles/);
  assert.match(rules, /holeFillRule\(n, i\) === "nonzero"/);
  assert.match(rules, /islands.push\(ring\)/);
});

test("path inspector exposes per-hole even-odd vs nonzero", () => {
  assert.match(pathUi, /Holes · /);
  assert.match(pathUi, /setHoleFillRule\(node.id, h, rule\)/);
  assert.match(pathUi, /hole \$\{h \+ 1\} fill rule/);
});

test("canvas and SVG honor partitioned holes", () => {
  assert.match(render, /fillPathCompound/);
  assert.match(render, /partitionPathHoles/);
  assert.match(exp, /partitionPathHoles/);
  assert.match(exp, /fill-rule="nonzero"/);
});

test("deleting a hole drops its fill rule", () => {
  assert.match(actions, /dropHole\(n, hole\)/);
});
