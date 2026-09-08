import { useEffect, useRef } from "react";
import { smoothSelectedPath } from "@/lib/design/boolean-actions";
import { holeFillRule } from "@/lib/design/fill-rule";
import {
  offsetSelectedPath,
  outlineSelectedStroke,
  roundSelectedPathCorners,
  simplifySelectedPath,
} from "@/lib/design/offset-actions";
import { deletePathHole, selectPathHole, setHoleFillRule, setPathClosed } from "@/lib/design/path-actions";
import {
  pickNextHolePointTabTarget,
  pickNextHoleTabTarget,
  pickPreviousHoleTabTarget,
  pickSameHoleFirstPointTabTarget,
  restoreHoleListScroll,
  restorePointListScroll,
  shouldHoldHoleListScroll,
  shouldHoldPointListScroll,
  tagHoleHeaderTabCrossing,
  tagHolePointTabCrossing,
} from "@/lib/design/path-point-tab";
import {
  pickPrevHoleLastPointTabTarget,
  shouldShiftTabToPrevHoleLastPoint,
} from "@/lib/design/path-prev-hole-tab";
import { useDesign } from "@/lib/design/store";
import { releaseStudioStatus } from "@/lib/design/studio-status";
import type { PathNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";
import { PointRow } from "./path-point-row";
