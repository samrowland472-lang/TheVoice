import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dash = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const ghost = readFileSync(new URL("../src/lib/design/stroke-ghost.ts", import.meta.url), "utf8");
const canvas = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("stroke ghost carries cap and join without requiring dash", () => {
  assert.match(ghost, /lineCap\?: CanvasLineCap/);
  assert.match(ghost, /lineJoin\?: CanvasLineJoin/);
});

test("mixed cap chips hover a cap-only ghost", () => {
  assert.match(dash, /ghostStroke\(\{ lineCap: c \}\)/);
  assert.doesNotMatch(
    dash.slice(dash.indexOf("Unify cap"), dash.indexOf("Unify join")),
    /strokeDash/,
  );
});

test("mixed join chips hover a join-only ghost", () => {
  assert.match(dash, /ghostStroke\(\{ lineJoin: j \}\)/);
  assert.match(canvas, /drawStrokeGhosts/);
  assert.match(canvas, /strokeGhost/);
});
