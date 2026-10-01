import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const groups = readFileSync(new URL("../src/lib/design/groups.ts", import.meta.url), "utf8");
const panel = readFileSync(new URL("../src/components/studio/layers-panel.tsx", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");

test("layer drop keeps parentId when nesting or aligning to a sibling", () => {
  assert.match(groups, /export function applyLayerDrop/);
  assert.match(groups, /mode: "into"/);
  assert.match(groups, /parentId = drop\.groupId/);
  assert.match(groups, /parentId = anchor\?\.parentId/);
  assert.match(groups, /ancestorIds\(nodes, group\.id\)/);
  assert.match(groups, /export function layerDropLegal/);
  assert.match(groups, /if \(!layerDropLegal\(nodes, ids, drop\)\) return null/);
});

test("layers panel drops into a group and lists the tree", () => {
  assert.match(panel, /flattenLayers/);
  assert.match(panel, /mode: "into"/);
  assert.match(panel, /dropLayers\(ids, hint\)/);
  assert.match(panel, /data-layer-kind/);
  assert.match(panel, /layerDropLegal/);
  assert.match(panel, /blocked \? "No" : "Into"/);
  assert.match(panel, /collapsed: false/);
  assert.match(panel, /Centre nests/);
  assert.match(store, /dropLayers:/);
  assert.match(store, /groupSelection:/);
});
