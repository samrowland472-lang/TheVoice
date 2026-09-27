import { partitionPathHoles, pathFillRule } from "./fill-rule";
import { variationSettings } from "./fonts";
import { bakeRotatedPoints, pathD } from "./path-curve";
import { isConvertibleShape, shapeContour } from "./shape-to-path";
import { drawPrintMarks, resolveBleed } from "./print-marks";
import { drawDocument } from "./render";
import { canvasShadowParams } from "./shadow";
import { layoutTextLines, measureTracked } from "./text-layout";
import type { DesignDocument, DesignNode, PathNode, PathPoint, Shadow, ShapeNode, TextNode } from "./types";

export { canvasShadowParams } from "./shadow";

function svgFilterId(id: string) {
  return `sh-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
