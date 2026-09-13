import { useRef } from "react";
import {
  tagHolePointTabCrossing,
  pickPrevHoleLastPointXTabTarget,
  restoreHoleListScroll,
  restoreListScroll,
  shouldShiftTabFromFirstHoleXToPrevLastX,
} from "@/lib/design/path-point-tab";
import { releaseStudioStatus } from "@/lib/design/studio-status";
import {
  deletePathPoint,
  selectPathPoint,
  setPathPointPosition,
  setPathPointSmooth,
} from "@/lib/design/path-actions";
import type { PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";

function focusPrevHoleLastX(from: HTMLElement) {
  if (!shouldShiftTabFromFirstHoleXToPrevLastX(from, true)) return false;
  const lastX = pickPrevHoleLastPointXTabTarget(from);
  if (!lastX) return false;
  const inspector = from.closest("[data-path-inspector]");
  const points = from.closest("[data-point-list]") ?? inspector?.querySelector("[data-point-list]");
  const holes = inspector?.querySelector("[data-hole-list]");
  const ps = points instanceof HTMLElement ? points.scrollTop : 0;
  const hs = holes instanceof HTMLElement ? holes.scrollTop : 0;
  tagHolePointTabCrossing(from, lastX, lastX);
  lastX.focus({ preventScroll: true });
  if (lastX instanceof HTMLInputElement) lastX.select();
  restoreListScroll(points, ps);
  restoreListScroll(holes, hs);
  const clampAfterGrowth = (list: Element | null | undefined, saved: number) => {
    if (list instanceof HTMLElement) restoreHoleListScroll(list, saved);
  };
  requestAnimationFrame(() => {
    clampAfterGrowth(points, ps);
    clampAfterGrowth(holes, hs);
    requestAnimationFrame(() => {
      clampAfterGrowth(points, ps);
      clampAfterGrowth(holes, hs);
      requestAnimationFrame(() => {
        clampAfterGrowth(points, ps);
        clampAfterGrowth(holes, hs);
      });
    });
  });
  return true;
}
