import type { KeyboardEvent } from "react";
import { setPathEditHit, setPathPointPosition } from "@/lib/design/path-actions";
import {
  pickNextHoleFirstPointXTabTarget,
  pickNextHoleHeaderTabTarget,
  pickOffsetTabTarget,
  pickOutlineTabTarget,
  pickPrevHoleHeaderTabTarget,
  pickPrevHoleLastPointXTabTarget,
  pickPrevHoleLastPointYTabTarget,
  pickLastHoleLastPointYTabTarget,
  pickLastHoleLastPointXTabTarget,
  pickLastHoleHeaderTabTarget,
  shouldShiftTabFromNextHoleFirstYToLastHoleY,
  shouldShiftTabFromNextHoleFirstXToLastHoleY,
  shouldShiftTabFromNextHoleFirstXToLastHoleX,
  shouldShiftTabFromNextHoleFirstYToLastHoleX,
  shouldShiftTabFromNextHoleFirstYToLastHoleHeader,
  shouldShiftTabFromNextHoleFirstXToLastHoleHeader,
  pickRoundTabTarget,
  pickSameHoleHeaderTabTarget,
  pickSimplifyTabTarget,
  shouldShiftTabFromFirstHoleXToPrevLastX,
  shouldShiftTabFromFirstHoleXToPrevLastY,
  shouldShiftTabFromFirstHoleYToPrevLastX,
  shouldShiftTabFromFirstHoleYToPrevLastY,
  shouldShiftTabFromFirstOuterToClosed,
  shouldShiftTabFromFirstOuterToOffset,
  shouldShiftTabFromFirstOuterToOutline,
  shouldShiftTabFromFirstOuterToRound,
  shouldShiftTabFromFirstOuterToSimplify,
  shouldShiftTabToPrevHoleHeader,
  shouldShiftTabToSameHoleHeader,
  pickNextHoleFirstPointYTabTarget,
  shouldTabFromLastHoleXToNextFirstX,
  shouldTabFromLastHoleXToNextFirstY,
  shouldTabFromLastHoleXToNextHeader,
  shouldTabFromLastHoleYToNextFirstX,
  shouldTabFromLastHoleYToNextFirstY,
  shouldTabFromLastOuterYToFirstHoleX,
  shouldTabFromLastOuterYToFirstHoleY,
  shouldTabFromLastOuterYToFirstHoleHeader,
  shouldTabFromLastOuterXToFirstHoleHeader,
  shouldTabFromLastOuterXToFirstHoleY,
  shouldTabFromLastOuterXToFirstHoleX,
  shouldShiftTabFromFirstHoleXToLastOuterY,
  shouldShiftTabFromFirstHoleXToLastOuterX,
  shouldShiftTabFromFirstHoleYToLastOuterX,
  shouldShiftTabFromFirstHoleYToLastOuterY,
  pickLastOuterLastPointYTabTarget,
  pickLastOuterLastPointXTabTarget,
  pickFirstHoleFirstPointXTabTarget,
  pickFirstHoleFirstPointYTabTarget,
  pickFirstHoleHeaderTabTarget,
  shouldTabToNextHoleHeader,
  tagHolePointTabCrossing,
} from "@/lib/design/path-point-tab";
import { pickClosedTabTarget } from "@/lib/design/path-point-tab-closed";
import type { PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";

function restoreListScroll(list: Element | null | undefined, saved: number) {
  if (!(list instanceof HTMLElement)) return;
  const clampAfterGrowth = () => {
    list.scrollTop = saved;
  };
  clampAfterGrowth();
  requestAnimationFrame(() => {
    clampAfterGrowth();
    requestAnimationFrame(() => {
      clampAfterGrowth();
      requestAnimationFrame(clampAfterGrowth);
    });
  });
}

function snapshotLists(from: Element) {
  const inspector = from.closest("[data-path-inspector]");
  const points = from.closest("[data-point-list]") ?? inspector?.querySelector("[data-point-list]");
  const holes = inspector?.querySelector("[data-hole-list]");
  return {
    points,
    holes,
    ps: points instanceof HTMLElement ? points.scrollTop : 0,
    hs: holes instanceof HTMLElement ? holes.scrollTop : 0,
  };
}

function focusHoldEl(el: HTMLElement, from: Element) {
  const snap = snapshotLists(from);
  el.focus({ preventScroll: true });
  if (el instanceof HTMLInputElement) el.select();
  restoreListScroll(snap.points, snap.ps);
  restoreListScroll(snap.holes, snap.hs);
}
