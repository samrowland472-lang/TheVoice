import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const helpers = readFileSync(new URL("../src/lib/design/image-filters.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-filters.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("filter helpers clone the full stack", () => {
  assert.match(helpers, /export function cloneFilters/);
  assert.match(helpers, /export function filterChipLabel/);
  assert.match(helpers, /export function normalizeFilters/);
  assert.match(helpers, /brightness:/);
  assert.match(helpers, /contrast:/);
  assert.match(helpers, /saturate:/);
  assert.match(helpers, /blur:/);
});

test("store merges one filter key onto each photo", () => {
  assert.match(mixed, /function patchImageFilters/);
  assert.match(mixed, /normalizeFilters\(n\.filters\)/);
  assert.match(mixed, /n\.kind !== "image"/);
});

test("mixed photo panel writes through and chips stamp the stack", () => {
  assert.match(mixed, /patchImageFilters\(ids, \{ \[f\.key\]/);
  assert.match(mixed, /Unify full filters/);
  assert.match(mixed, /cloneFilters\(n\.filters\)/);
  assert.match(mixed, /Reset all/);
  assert.match(inspector, /MixedFilters/);
  assert.match(inspector, /hideFilters=/);
});
