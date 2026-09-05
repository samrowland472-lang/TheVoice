import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const chips = readFileSync(new URL("../src/lib/design/geometry-chips.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-geometry.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("geometry chips name degrees and radius", () => {
  assert.match(chips, /export function rotationChipLabel/);
  assert.match(chips, /export function radiusChipLabel/);
  assert.match(chips, /\$\{r\}°/);
  assert.match(chips, /r \$\{Math\.round\(radius\)\}/);
});

test("mixed geometry stamps rotation and radius onto the whole pick", () => {
  assert.match(mixed, /Unify rotation/);
  assert.match(mixed, /Unify radius/);
  assert.match(mixed, /updateNodes\(ids, \{ rotation: n\.rotation \}, true\)/);
  assert.match(mixed, /updateNodes\(ids, \{ radius: n\.radius \}, true\)/);
  assert.match(mixed, /selection rotate mixed/);
  assert.match(mixed, /selection radius mixed/);
});

test("inspector mounts mixed geometry on a multi pick", () => {
  assert.match(inspector, /MixedGeometry/);
});
