import assert from "node:assert/strict";
import { describe, it } from "node:test";

function nextPathAxis(axis, shift) {
  if (!shift && axis === "x") return { neighbor: 0, axis: "y" };
  if (!shift && axis === "y") return { neighbor: 1, axis: "x" };
  if (shift && axis === "y") return { neighbor: 0, axis: "x" };
  return { neighbor: -1, axis: "y" };
}

describe("path point tab order", () => {
  it("tabs from x to that point's y", () => {
    assert.deepEqual(nextPathAxis("x", false), { neighbor: 0, axis: "y" });
  });
  it("tabs from y to the next point's x", () => {
    assert.deepEqual(nextPathAxis("y", false), { neighbor: 1, axis: "x" });
  });
  it("shift-tabs from y back to x", () => {
    assert.deepEqual(nextPathAxis("y", true), { neighbor: 0, axis: "x" });
  });
  it("shift-tabs from x to the previous point's y", () => {
    assert.deepEqual(nextPathAxis("x", true), { neighbor: -1, axis: "y" });
  });
});
