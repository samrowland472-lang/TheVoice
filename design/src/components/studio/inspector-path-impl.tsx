import { useEffect, useRef } from "react";
import { holeFillRule } from "@/lib/design/fill-rule";
import {
  deletePathHole,
  selectPathHole,
  setHoleFillRule,
  setPathClosed,
} from "@/lib/design/path-actions";
import {
  offsetSelectedPath,
  outlineSelectedStroke,
  roundSelectedPathCorners,
  simplifySelectedPath,
} from "@/lib/design/offset-actions";
import {
  pickFirstOuterPointTabTarget,
  pickOffsetTabTarget,
  pickOutlineTabTarget,
  pickRoundTabTarget,
  pickSimplifyTabTarget,
  pickNextHolePointTabTarget,
  pickSameHoleFirstPointTabTarget,
  pickSameHoleLastPointTabTarget,
  shouldHoldHoleListScroll,
  shouldHoldPointListScroll,
  shouldTabFromClosedToOffset,
  shouldTabFromOffsetToFirstOuterPoint,
  shouldTabFromOffsetToOutline,
  shouldTabFromOutlineToRound,
  shouldTabFromRoundToSimplify,
  shouldTabFromSimplifyToFirstOuterPoint,
  shouldTabToSameHoleFirstPoint,
  tagHoleHeaderTabCrossing,
  tagHolePointTabCrossing,
  pickNextHoleTabTarget,
  pickPreviousHoleTabTarget,
  shouldShiftTabFromNextHoleHeaderToLastHoleX,
  pickLastHoleLastPointXTabTarget,
  shouldShiftTabFromNextHoleHeaderToLastHoleY,
  pickLastHoleLastPointYTabTarget,
  shouldTabFromLastHoleHeaderToNextFirstX,
  pickNextHoleFirstPointXFromHeaderTabTarget,
  shouldTabFromLastHoleHeaderToNextFirstY,
  pickNextHoleFirstPointYFromHeaderTabTarget,
  shouldTabFromLastHoleHeaderToNextHeader,
  pickNextHoleHeaderFromHeaderTabTarget,
  shouldShiftTabFromNextHoleHeaderToLastHoleHeader,
  pickLastHoleHeaderFromHeaderTabTarget,
  restoreHoleListScroll,
  restoreListScroll,
} from "@/lib/design/path-point-tab";
import {
  pickPrevHoleLastPointTabTarget,
  shouldShiftTabToPrevHoleLastPoint,
} from "@/lib/design/path-prev-hole-tab";
import { useDesign } from "@/lib/design/store";
import type { PathNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Section } from "./inspector-parts";
import { PointRow } from "./path-point-row";

function holdListScroll(list: Element | null, saved: number) {
  if (!(list instanceof HTMLElement)) return;
  list.scrollTop = saved;
  restoreListScroll(list, saved);
  const clampAfterGrowth = () => restoreHoleListScroll(list, saved);
  requestAnimationFrame(() => {
    clampAfterGrowth();
    requestAnimationFrame(() => {
      clampAfterGrowth();
      requestAnimationFrame(clampAfterGrowth);
    });
  });
}
