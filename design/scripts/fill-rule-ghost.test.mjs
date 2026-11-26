import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const mixed = readFileSync(new URL("../src/components/studio/mixed-fill-rule.tsx", import.meta.url), "utf8");
const ghost = readFileSync(new URL("../src/lib/design/stroke-ghost.ts", import.meta.url), "utf8");
const canvas = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("stroke ghost carries fillRule and skips paths without holes", () => {
  assert.match(ghost, /fillRule\?: "evenodd" \| "nonzero"/);
  assert.match(ghost, /ghost\.fillRule != null && \(raw\.kind !== "path"/);
  assert.match(ghost, /ctx\.fill\(ghost\.fillRule === "evenodd" \? "evenodd" : "nonzero"\)/);
});

test("mixed fill-rule chips paint a canvas ghost", () => {
  assert.match(mixed, /setStrokeGhost\(rule == null \? null : \{ fillRule: rule \}\)/);
  assert.match(mixed, /onMouseEnter=\{\(\) => ghostFillRule\(rule\)\}/);
  assert.match(inspector, /MixedFillRule/);
  assert.match(canvas, /drawStrokeGhosts/);
  assert.match(canvas, /strokeGhost/);
});
