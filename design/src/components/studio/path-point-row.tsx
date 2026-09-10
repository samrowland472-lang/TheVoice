import { useRef } from "react";
import {
  tagHolePointTabCrossing,
  labelPathInspectorControl,
  nextPathAxis,
  pathInspectorExitStatus,
  pathTabExitsAtEdge,
  pickPathInspectorExitTarget,
  pickNextHoleFirstPointXTabTarget,
  pickNextHoleHeaderTabTarget,
  pickPrevHoleHeaderTabTarget,
  pickPrevHoleLastPointXTabTarget,
  pickSameHoleHeaderTabTarget,
  pickClosedTabTarget,
  pickOffsetTabTarget,
  pickOutlineTabTarget,
  pickRoundTabTarget,
  pickSimplifyTabTarget,
  shouldShiftTabFromFirstOuterToClosed,
  shouldShiftTabFromFirstOuterToOffset,
  shouldShiftTabFromFirstOuterToOutline,
  shouldShiftTabFromFirstOuterToRound,
  shouldShiftTabFromFirstOuterToSimplify,
  shouldShiftTabFromFirstHoleXToPrevLastX,
  shouldShiftTabToPrevHoleHeader,
  shouldShiftTabToSameHoleHeader,
  shouldTabFromLastHoleXToNextFirstX,
  shouldTabFromLastHoleYToNextFirstX,
  shouldTabToNextHoleHeader,
} from "@/lib/design/path-point-tab";
import { holdStudioStatus, releaseStudioStatus } from "@/lib/design/studio-status";
import {
  deletePathPoint,
  selectPathPoint,
  setPathPointPosition,
  setPathPointSmooth,
} from "@/lib/design/path-actions";
import type { PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";

function ringLabel(hole?: number) {
  return hole == null ? "Path" : `Hole ${hole + 1}`;
}

function pathListRows(from: HTMLElement) {
  const row = from.closest("[data-point]");
  const list = row?.parentElement;
  if (!(row instanceof HTMLElement) || !list) return null;
  const rows = [...list.querySelectorAll<HTMLElement>(":scope > [data-point]")];
  const i = rows.indexOf(row);
  if (i < 0) return null;
  return { row, list, rows, index: i };
}

const FOCUSABLE =
  'input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

function isShown(el: HTMLElement) {
  return el.offsetParent !== null || el === document.activeElement;
}

function focusOutsidePathList(from: HTMLElement, shift: boolean) {
  const ctx = pathListRows(from);
  if (!ctx) return false;
  const panel = from.closest("[data-path-inspector]");
  const scope = panel instanceof HTMLElement ? panel : document.body;
  const inspector = [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isShown);
  const listMembers = new Set(
    inspector.filter((el) => ctx.list.contains(el)),
  );
  const target = pickPathInspectorExitTarget(inspector, listMembers, from, shift);
  if (!target || ctx.list.contains(target)) {
    from.blur();
    return true;
  }
  target.focus();
  if (target instanceof HTMLInputElement) target.select();
  const label = labelPathInspectorControl(target);
  holdStudioStatus(pathInspectorExitStatus(label));
  return true;
}

function focusPathCoord(from: HTMLElement, neighbor: -1 | 0 | 1, axis: "x" | "y") {
  const ctx = pathListRows(from);
  if (!ctx) return false;
  const nextIndex = ctx.index + neighbor;
  if (neighbor !== 0 && (nextIndex < 0 || nextIndex >= ctx.rows.length)) return false;
  const target = neighbor === 0 ? ctx.row : ctx.rows[nextIndex];
  const input = target?.querySelector(`input[data-path-axis="${axis}"]`);
  if (input instanceof HTMLInputElement) {
    const list = from.closest("[data-point-list]");
    const saved = list instanceof HTMLElement ? list.scrollTop : 0;
    const crossing = tagHolePointTabCrossing(from, target, input);
    input.focus();
    input.select();
    if (crossing && list instanceof HTMLElement) {
      list.scrollTop = saved;
      requestAnimationFrame(() => {
        list.scrollTop = saved;
      });
    }
    return true;
  }
  return false;
}

function focusPrevHoleLastX(from: HTMLElement) {
  if (!shouldShiftTabFromFirstHoleXToPrevLastX(from, true)) return false;
  const lastX = pickPrevHoleLastPointXTabTarget(from);
  if (!lastX) return false;
  const list = from.closest("[data-point-list]");
  const saved = list instanceof HTMLElement ? list.scrollTop : 0;
  tagHolePointTabCrossing(from, lastX, lastX);
  lastX.focus({ preventScroll: true });
  if (lastX instanceof HTMLInputElement) lastX.select();
  if (list instanceof HTMLElement) {
    list.scrollTop = saved;
    requestAnimationFrame(() => {
      list.scrollTop = saved;
      requestAnimationFrame(() => {
        list.scrollTop = saved;
      });
    });
  }
  return true;
}

function focusNextHoleFirstX(from: HTMLElement) {
  if (
    !shouldTabFromLastHoleYToNextFirstX(from, false) &&
    !shouldTabFromLastHoleXToNextFirstX(from, false)
  )
    return false;
  const nextX = pickNextHoleFirstPointXTabTarget(from);
  if (!nextX) return false;
  const list = from.closest("[data-point-list]");
  const saved = list instanceof HTMLElement ? list.scrollTop : 0;
  tagHolePointTabCrossing(from, nextX, nextX);
  nextX.focus({ preventScroll: true });
  if (nextX instanceof HTMLInputElement) nextX.select();
  if (list instanceof HTMLElement) {
    list.scrollTop = saved;
    requestAnimationFrame(() => {
      list.scrollTop = saved;
      requestAnimationFrame(() => {
        list.scrollTop = saved;
      });
    });
  }
  return true;
}
