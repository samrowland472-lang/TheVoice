import { describe, it } from "node:test";
import assert from "node:assert/strict";

const RULER_SIZE = 20;

function hitRulerBand(sx, sy) {
  const r = RULER_SIZE;
  if (sx < r && sy < r) return "corner";
  if (sy < r) return "y";
  if (sx < r) return "x";
  return null;
}

function hitPersistentGuide(guides, docX, docY, zoom) {
  const slop = 5 / Math.max(zoom, 0.05);
  let best = null;
  for (const g of guides) {
    const d = g.axis === "x" ? Math.abs(docX - g.pos) : Math.abs(docY - g.pos);
    if (d <= slop && (!best || d < best.d)) best = { id: g.id, axis: g.axis, d };
  }
  return best ? { id: best.id, axis: best.axis } : null;
}

describe("ruler bands", () => {
  it("maps top strip to y-guides and left strip to x-guides", () => {
    assert.equal(hitRulerBand(80, 8), "y");
    assert.equal(hitRulerBand(6, 90), "x");
    assert.equal(hitRulerBand(4, 4), "corner");
    assert.equal(hitRulerBand(80, 80), null);
  });
});

describe("persistent guide hit", () => {
  it("picks the nearest guide within slop", () => {
    const guides = [
      { id: "a", axis: "x", pos: 100 },
      { id: "b", axis: "y", pos: 40 },
    ];
    assert.deepEqual(hitPersistentGuide(guides, 101, 10, 1), { id: "a", axis: "x" });
    assert.deepEqual(hitPersistentGuide(guides, 10, 42, 1), { id: "b", axis: "y" });
    assert.equal(hitPersistentGuide(guides, 20, 20, 1), null);
  });
});
