import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const parts = readFileSync(new URL("../src/components/studio/inspector-parts.tsx", import.meta.url), "utf8");

test("key shadow editor accepts the full mixed-kind selection", () => {
  assert.match(inspector, /<ShadowEditor nodes=\{selectedNodes\} \/>/);
  assert.doesNotMatch(inspector, /\{!multi && <ShadowEditor/);
  assert.match(parts, /export function ShadowEditor\(\{ nodes \}: \{ nodes: DesignNode\[\] \}\)/);
});

test("mixed shadow fields write onto every selected id", () => {
  assert.match(parts, /Shadow · mixed/);
  assert.match(parts, /Colour · mixed/);
  assert.match(parts, /Blur · mixed/);
  assert.match(parts, /Spread · mixed/);
  assert.match(parts, /Inset · mixed/);
  assert.match(parts, /layer shadow colour mixed/);
  assert.match(parts, /stampAll/);
  assert.match(parts, /updateNodes\(ids, \{ shadow: anyOn \? null : \{ \.\.\.DEFAULT_SHADOW \} \}/);
});
