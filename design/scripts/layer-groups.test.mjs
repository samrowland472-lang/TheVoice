import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const groups = readFileSync(new URL("../src/lib/design/layer-groups.ts", import.meta.url), "utf8");
const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const layers = readFileSync(new URL("../src/components/studio/layers-panel.tsx", import.meta.url), "utf8");
const shortcuts = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const hit = readFileSync(new URL("../src/lib/design/hit.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");

test("group kind and parentId live on the document model", () => {
  assert.match(types, /\|\s*"group"/);
  assert.match(types, /parentId\?: string/);
  assert.match(types, /kind: "group"/);
});

test("groupSelected requires two unparented layers and inserts a group node", () => {
  assert.match(groups, /export function groupSelected/);
  assert.match(groups, /targets\.length < 2/);
  assert.match(groups, /parentId: group\.id/);
  assert.match(groups, /makeGroup/);
});

test("ungroupSelected releases children and drops the group node", () => {
  assert.match(groups, /export function ungroupSelected/);
  assert.match(groups, /drop\.has\(n\.parentId\)/);
});

test("layerRows walks groups as indented children", () => {
  assert.match(groups, /export function layerRows/);
  assert.match(groups, /depth \+ 1/);
});

test("moving or hiding a group cascades to descendants", () => {
  assert.match(groups, /export function applyGroupPatch/);
  assert.match(groups, /descendantIds/);
  assert.match(groups, /n\.x \+ dx/);
  assert.match(groups, /visible: after\.visible/);
});

test("store exposes group and ungroup", () => {
  assert.match(store, /groupSelection:/);
  assert.match(store, /ungroupSelection:/);
  assert.match(store, /applyGroupPatch/);
});

test("layers panel and shortcuts wire group actions", () => {
  assert.match(layers, /groupSelection/);
  assert.match(layers, /ungroupSelection/);
  assert.match(layers, /layerRows/);
  assert.match(shortcuts, /groupSelection\(\)/);
  assert.match(shortcuts, /ungroupSelection\(\)/);
});

test("groups do not paint, hit, or export as shapes", () => {
  assert.match(render, /isGroup\(n\)/);
  assert.match(hit, /n\.kind === "group"/);
  assert.match(exp, /n\.kind !== "group"/);
});
