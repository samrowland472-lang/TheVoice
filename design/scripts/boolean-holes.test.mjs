import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const clip = readFileSync(new URL("../src/lib/design/polygon-clip.ts", import.meta.url), "utf8");
const islands = readFileSync(new URL("../src/lib/design/island-group.ts", import.meta.url), "utf8");
const ops = readFileSync(new URL("../src/lib/design/boolean-ops.ts", import.meta.url), "utf8");

test("groupIslands keeps nested island rings on the parent compound", () => {
  assert.match(clip, /export function groupIslands/);
  assert.match(clip, /island that sits inside a punched hole/);
  assert.match(clip, /holes.push\(cleaned\[c\]!\)/);
  assert.match(islands, /function smallestParent/);
  assert.match(islands, /export function ringDepth/);
});

test("boolean apply traces evenodd compounds from grouped islands", () => {
  assert.match(ops, /fillRule: "evenodd"/);
  assert.match(ops, /groupIslands\(clipped\)/);
  assert.match(ops, /export function computeBooleanParts/);
});

const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("boolean preview ghosts every island from three-plus picks", () => {
  assert.match(stage, /computeBooleanParts\(picked, booleanPreview\)/);
  assert.match(stage, /for \(const ghost of ghosts\)/);
  assert.doesNotMatch(stage, /computeBoolean\(picked/);
});
