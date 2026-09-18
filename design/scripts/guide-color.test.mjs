import assert from "node:assert/strict";

function sanitizeGuideColor(raw) {
  if (typeof raw !== "string") return undefined;
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : undefined;
}

function resolveGuideStroke(guide, looks) {
  const axis = guide.axis === "x" ? looks.x : looks.y;
  const override = sanitizeGuideColor(guide.color);
  return override ? { ...axis, color: override } : axis;
}

function clearGuideColors(guides) {
  return guides.map((g) => {
    if (!g.color) return g;
    const { color: _drop, ...rest } = g;
    return rest;
  });
}

const looks = {
  x: { color: "#3fc6ff", dash: "dash" },
  y: { color: "#9ee7ff", dash: "tight" },
};

assert.equal(resolveGuideStroke({ axis: "x" }, looks).color, "#3fc6ff");
assert.equal(resolveGuideStroke({ axis: "y", color: "#c4ff4d" }, looks).color, "#c4ff4d");
assert.equal(resolveGuideStroke({ axis: "x", color: "nope" }, looks).color, "#3fc6ff");
assert.deepEqual(
  clearGuideColors([{ id: "a", color: "#c4ff4d" }, { id: "b" }]).map((g) => g.color),
  [undefined, undefined],
);

console.log("guide-color ok");
