import assert from "node:assert/strict";
import { describe, it } from "node:test";

function nextPathAxis(axis, shift) {
  if (!shift && axis === "x") return { neighbor: 0, axis: "y" };
  if (!shift && axis === "y") return { neighbor: 1, axis: "x" };
  if (shift && axis === "y") return { neighbor: 0, axis: "x" };
  return { neighbor: -1, axis: "y" };
}

function pathTabLeavesList(index, count, axis, shift) {
  if (count <= 0 || index < 0 || index >= count) return true;
  const step = nextPathAxis(axis, shift);
  const next = index + step.neighbor;
  return next < 0 || next >= count;
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
  it("shift-tab from the first point x leaves the list", () => {
    assert.equal(pathTabLeavesList(0, 4, "x", true), true);
  });
  it("tab from the last point y leaves the list", () => {
    assert.equal(pathTabLeavesList(3, 4, "y", false), true);
  });
  it("tab from the only point y leaves the list", () => {
    assert.equal(pathTabLeavesList(0, 1, "y", false), true);
  });
  it("does not leave when walking inside the list", () => {
    assert.equal(pathTabLeavesList(0, 4, "x", false), false);
    assert.equal(pathTabLeavesList(0, 4, "y", false), false);
    assert.equal(pathTabLeavesList(1, 4, "x", true), false);
    assert.equal(pathTabLeavesList(3, 4, "x", false), false);
    assert.equal(pathTabLeavesList(3, 4, "y", true), false);
  });
});

function pathTabExitsAtEdge(index, count, axis, shift) {
  if (count <= 0) return true;
  if (!shift && axis === "y" && index === count - 1) return true;
  if (shift && axis === "x" && index === 0) return true;
  return pathTabLeavesList(index, count, axis, shift);
}

function pickPathInspectorExitTarget(inspector, listMembers, from, shift) {
  const outside = inspector.filter((el) => !listMembers.has(el));
  if (outside.length === 0) return null;
  const fromIdx = inspector.indexOf(from);
  if (fromIdx < 0) return shift ? (outside.at(-1) ?? null) : (outside[0] ?? null);
  if (!shift) {
    for (let i = fromIdx + 1; i < inspector.length; i++) {
      if (!listMembers.has(inspector[i])) return inspector[i];
    }
    return outside[0] ?? null;
  }
  for (let i = fromIdx - 1; i >= 0; i--) {
    if (!listMembers.has(inspector[i])) return inspector[i];
  }
  return outside.at(-1) ?? null;
}

describe("path inspector exit lands on Closed / Offset", () => {
  const inspector = ["closed", "offset", "px0", "py0", "px1", "py1"];
  const list = new Set(["px0", "py0", "px1", "py1"]);

  it("Tab from last y wraps to Closed", () => {
    assert.equal(pickPathInspectorExitTarget(inspector, list, "py1", false), "closed");
  });
  it("Shift+Tab from first x lands on Offset", () => {
    assert.equal(pickPathInspectorExitTarget(inspector, list, "px0", true), "offset");
  });
  it("does not jump past the inspector when list is last", () => {
    assert.equal(pickPathInspectorExitTarget(inspector, list, "py1", false), "closed");
  });
});

describe("path tab exits at list edge", () => {
  it("exits on last y with Tab", () => {
    assert.equal(pathTabExitsAtEdge(3, 4, "y", false), true);
  });
  it("exits on first x with Shift+Tab", () => {
    assert.equal(pathTabExitsAtEdge(0, 4, "x", true), true);
  });
  it("does not treat last x Tab as an exit", () => {
    assert.equal(pathTabExitsAtEdge(3, 4, "x", false), false);
  });
});
