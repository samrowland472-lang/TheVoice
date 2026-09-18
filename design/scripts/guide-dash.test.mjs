import assert from "node:assert/strict";

const GUIDE_DASHES = ["dash", "tight", "solid"];

function sanitizeGuideDash(raw) {
  return GUIDE_DASHES.includes(raw) ? raw : undefined;
}

function resolveGuideStroke(guide, looks) {
  const axis = guide.axis === "x" ? looks.x : looks.y;
  const dash = sanitizeGuideDash(guide.dash) ?? axis.dash;
  return { ...axis, dash };
}

function clearGuideDashes(guides) {
  return guides.map((g) => {
    if (!g.dash) return g;
    const { dash: _drop, ...rest } = g;
    return rest;
  });
}

const looks = {
  x: { color: "#3fc6ff", dash: "dash" },
  y: { color: "#9ee7ff", dash: "tight" },
};

assert.equal(resolveGuideStroke({ axis: "x" }, looks).dash, "dash");
assert.equal(resolveGuideStroke({ axis: "x", dash: "solid" }, looks).dash, "solid");
assert.equal(resolveGuideStroke({ axis: "y", dash: "nope" }, looks).dash, "tight");
assert.deepEqual(
  clearGuideDashes([{ id: "a", dash: "solid" }, { id: "b" }]).map((g) => g.dash),
  [undefined, undefined],
);

console.log("guide-dash ok");
