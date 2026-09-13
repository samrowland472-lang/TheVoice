import { useEffect } from "react";
import {
  pickFirstHoleHeaderTabTarget,
  pickLastOuterLastPointXTabTarget,
  pickLastHoleDeleteFromFillTabTarget,
  pickLastHoleDeleteFromHeaderTabTarget,
  pickLastHoleFillFromFirstXTabTarget,
  pickLastHoleFillFromFirstYTabTarget,
  pickLastHoleFillFromHeaderTabTarget,
  pickNextHoleFillFromDeleteTabTarget,
  pickNextHoleHeaderFromDeleteTabTarget,
  pickNextHoleFirstPointXFromFillTabTarget,
  pickNextHoleFirstPointYFromFillTabTarget,
  pickNextHoleHeaderFromFillTabTarget,
  shouldShiftTabFromNextHoleFillToLastHoleDelete,
  shouldShiftTabFromNextHoleFirstXToLastHoleFill,
  shouldShiftTabFromNextHoleFirstYToLastHoleFill,
  shouldShiftTabFromNextHoleHeaderToLastHoleDelete,
  shouldShiftTabFromNextHoleHeaderToLastHoleFill,
  shouldShiftTabFromFirstHoleHeaderToLastOuterX,
  shouldShiftTabFromFirstHoleHeaderToLastOuterY,
  pickLastOuterLastPointYTabTarget,
  shouldTabFromHoleDeleteToNextFill,
  shouldTabFromHoleDeleteToNextHeader,
  shouldTabFromHoleFillToNextFirstX,
  shouldTabFromHoleFillToNextFirstY,
  shouldTabFromHoleFillToNextHeader,
  shouldTabFromLastOuterXToFirstHoleHeader,
  shouldTabFromLastOuterYToFirstHoleHeader,
  restoreHoleListScroll,
  restoreListScroll,
  tagHoleHeaderTabCrossing,
} from "@/lib/design/path-point-tab";
import { PathFields as PathFieldsImpl } from "./inspector-path-impl";
import type { PathNode } from "@/lib/design/types";

function holdListScroll(list: Element | null | undefined, saved: number) {
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

function snapshotList(from: Element, sel: string) {
  const root = from.closest("[data-path-inspector]") ?? from;
  const list = (from.closest(sel) ?? root.querySelector(sel)) as HTMLElement | null;
  return { list, saved: list instanceof HTMLElement ? list.scrollTop : 0 };
}

/** Same clamp-after-growth helper as focusHold / focusHoldEl. */
function holdHoleListAcrossHop(from: Element, target: HTMLElement) {
  const holes = snapshotList(from, "[data-hole-list]");
  const points = snapshotList(from, "[data-point-list]");
  target.focus({ preventScroll: true });
  holdListScroll(holes.list, holes.saved);
  holdListScroll(points.list, points.saved);
}

function holdHoleListAcrossOuterHop(from: Element, target: HTMLElement) {
  holdHoleListAcrossHop(from, target);
}

export function PathFields({ node }: { node: PathNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const from = e.target;
      if (!(from instanceof Element)) return;
      if (e.shiftKey) {
        if (shouldShiftTabFromNextHoleFirstXToLastHoleFill(from, true)) {
          const lastFill = pickLastHoleFillFromFirstXTabTarget(from);
          if (!lastFill) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, lastFill, lastFill);
          holdHoleListAcrossHop(from, lastFill);
          return;
        }
        if (shouldShiftTabFromNextHoleFirstYToLastHoleFill(from, true)) {
          const lastFill = pickLastHoleFillFromFirstYTabTarget(from);
          if (!lastFill) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, lastFill, lastFill);
          holdHoleListAcrossHop(from, lastFill);
          return;
        }
        if (shouldShiftTabFromNextHoleFillToLastHoleDelete(from, true)) {
          const lastDelete = pickLastHoleDeleteFromFillTabTarget(from);
          if (!lastDelete) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, lastDelete, lastDelete);
          holdHoleListAcrossHop(from, lastDelete);
          return;
        }
        if (shouldShiftTabFromNextHoleHeaderToLastHoleDelete(from, true)) {
          const lastDelete = pickLastHoleDeleteFromHeaderTabTarget(from);
          if (!lastDelete) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, lastDelete, lastDelete);
          holdHoleListAcrossHop(from, lastDelete);
          return;
        }
        if (shouldShiftTabFromFirstHoleHeaderToLastOuterY(from, true)) {
          const lastY = pickLastOuterLastPointYTabTarget(from);
          if (!lastY) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, lastY, lastY);
          holdHoleListAcrossOuterHop(from, lastY);
          return;
        }
        if (shouldShiftTabFromFirstHoleHeaderToLastOuterX(from, true)) {
          const lastX = pickLastOuterLastPointXTabTarget(from);
          if (!lastX) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, lastX, lastX);
          holdHoleListAcrossOuterHop(from, lastX);
          return;
        }
        if (!shouldShiftTabFromNextHoleHeaderToLastHoleFill(from, true)) return;
        const lastFill = pickLastHoleFillFromHeaderTabTarget(from);
        if (!lastFill) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, lastFill, lastFill);
        holdHoleListAcrossHop(from, lastFill);
        return;
      }
      if (
        shouldTabFromLastOuterYToFirstHoleHeader(from, false) ||
        shouldTabFromLastOuterXToFirstHoleHeader(from, false)
      ) {
        const header = pickFirstHoleHeaderTabTarget(from);
        if (!header) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, header, header);
        holdHoleListAcrossOuterHop(from, header);
        return;
      }
      if (shouldTabFromHoleFillToNextFirstX(from, false)) {
        const nextX = pickNextHoleFirstPointXFromFillTabTarget(from);
        if (!nextX) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, nextX, nextX);
        holdHoleListAcrossHop(from, nextX);
        return;
      }
      if (shouldTabFromHoleFillToNextFirstY(from, false)) {
        const nextY = pickNextHoleFirstPointYFromFillTabTarget(from);
        if (!nextY) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, nextY, nextY);
        holdHoleListAcrossHop(from, nextY);
        return;
      }
      if (shouldTabFromHoleFillToNextHeader(from, false)) {
        const nextHeader = pickNextHoleHeaderFromFillTabTarget(from);
        if (!nextHeader) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, nextHeader, nextHeader);
        holdHoleListAcrossHop(from, nextHeader);
        return;
      }
      if (shouldTabFromHoleDeleteToNextFill(from, false)) {
        const nextFill = pickNextHoleFillFromDeleteTabTarget(from);
        if (!nextFill) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, nextFill, nextFill);
        holdHoleListAcrossHop(from, nextFill);
        return;
      }
      if (!shouldTabFromHoleDeleteToNextHeader(from, false)) return;
      const nextHeader = pickNextHoleHeaderFromDeleteTabTarget(from);
      if (!nextHeader) return;
      e.preventDefault();
      tagHoleHeaderTabCrossing(from, nextHeader, nextHeader);
      holdHoleListAcrossHop(from, nextHeader);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);
  return <PathFieldsImpl node={node} />;
}
