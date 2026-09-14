import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const mixed = readFileSync(new URL("../src/components/studio/mixed-type-colour.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("mixed type colour writes fill onto type ids only", () => {
  assert.match(mixed, /export function MixedTypeColour/);
  assert.match(mixed, /Type colour · mixed/);
  assert.match(mixed, /Writes onto type only/);
  assert.match(mixed, /Apply key type colour to all type/);
  assert.match(mixed, /aria-label=\{mixed \? "type colour mixed"/);
  assert.match(mixed, /Unify type colour with/);
  assert.match(mixed, /updateNodes\(ids, \{ fill: cloneFill\(fill\) \}/);
});

test("inspector shows type colour when the selection mixes type and shapes", () => {
  assert.match(inspector, /MixedTypeColour/);
  assert.match(inspector, /mixedKinds/);
  assert.match(inspector, /texts\.length < selectedNodes\.length/);
});
