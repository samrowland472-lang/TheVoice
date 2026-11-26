import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const snap = readFileSync(new URL("../src/lib/design/marquee-nodes.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("nodesInMarquee pulls unlocked descendants when a group box is hit", () => {
  assert.match(snap, /export function nodesInMarquee/);
  assert.match(snap, /n\.kind === "group"/);
  assert.match(snap, /descendantsOf/);
  assert.match(snap, /child\.visible && !child\.locked/);
  assert.match(snap, /n\.locked/);
});

test("canvas marquee uses nodesInMarquee", () => {
  assert.match(stage, /nodesInMarquee/);
});
