import { useEffect } from "react";
import {
  pickFirstHoleHeaderTabTarget,
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
  shouldTabFromHoleDeleteToNextFill,
  shouldTabFromHoleDeleteToNextHeader,
  shouldTabFromHoleFillToNextFirstX,
  shouldTabFromHoleFillToNextFirstY,
  shouldTabFromHoleFillToNextHeader,
  shouldTabFromLastOuterYToFirstHoleHeader,
  tagHoleHeaderTabCrossing,
} from "@/lib/design/path-point-tab";
import { PathFields as PathFieldsImpl } from "./inspector-path-impl";
import type { PathNode } from "@/lib/design/types";

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
          const list = from.closest("[data-hole-list]");
          const saved = list instanceof HTMLElement ? list.scrollTop : 0;
          lastFill.focus();
          if (list instanceof HTMLElement) {
            list.scrollTop = saved;
            requestAnimationFrame(() => {
              list.scrollTop = saved;
            });
          }
          return;
        }
        if (shouldShiftTabFromNextHoleFirstYToLastHoleFill(from, true)) {
          const lastFill = pickLastHoleFillFromFirstYTabTarget(from);
          if (!lastFill) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, lastFill, lastFill);
          const list = from.closest("[data-hole-list]");
          const saved = list instanceof HTMLElement ? list.scrollTop : 0;
          lastFill.focus();
          if (list instanceof HTMLElement) {
            list.scrollTop = saved;
            requestAnimationFrame(() => {
              list.scrollTop = saved;
            });
          }
          return;
        }
        if (shouldShiftTabFromNextHoleFillToLastHoleDelete(from, true)) {
          const lastDelete = pickLastHoleDeleteFromFillTabTarget(from);
          if (!lastDelete) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, lastDelete, lastDelete);
          const list = from.closest("[data-hole-list]");
          const saved = list instanceof HTMLElement ? list.scrollTop : 0;
          lastDelete.focus();
          if (list instanceof HTMLElement) {
            list.scrollTop = saved;
            requestAnimationFrame(() => {
              list.scrollTop = saved;
            });
          }
          return;
        }
        if (shouldShiftTabFromNextHoleHeaderToLastHoleDelete(from, true)) {
          const lastDelete = pickLastHoleDeleteFromHeaderTabTarget(from);
          if (!lastDelete) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, lastDelete, lastDelete);
          const list = from.closest("[data-hole-list]");
          const saved = list instanceof HTMLElement ? list.scrollTop : 0;
          lastDelete.focus();
          if (list instanceof HTMLElement) {
            list.scrollTop = saved;
            requestAnimationFrame(() => {
              list.scrollTop = saved;
            });
          }
          return;
        }
        if (!shouldShiftTabFromNextHoleHeaderToLastHoleFill(from, true)) return;
        const lastFill = pickLastHoleFillFromHeaderTabTarget(from);
        if (!lastFill) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, lastFill, lastFill);
        const list = from.closest("[data-hole-list]");
        const saved = list instanceof HTMLElement ? list.scrollTop : 0;
        lastFill.focus();
        if (list instanceof HTMLElement) {
          list.scrollTop = saved;
          requestAnimationFrame(() => {
            list.scrollTop = saved;
          });
        }
        return;
      }
      if (shouldTabFromLastOuterYToFirstHoleHeader(from, false)) {
        const header = pickFirstHoleHeaderTabTarget(from);
        if (!header) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, header, header);
        const list = from.closest("[data-path-inspector]")?.querySelector("[data-hole-list]")
          ?? from.closest("[data-hole-list]");
        const saved = list instanceof HTMLElement ? list.scrollTop : 0;
        header.focus({ preventScroll: true });
        if (list instanceof HTMLElement) {
          list.scrollTop = saved;
          requestAnimationFrame(() => {
            list.scrollTop = saved;
          });
        }
        return;
      }
      if (shouldTabFromHoleFillToNextFirstX(from, false)) {
        const nextX = pickNextHoleFirstPointXFromFillTabTarget(from);
        if (!nextX) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, nextX, nextX);
        const list = from.closest("[data-hole-list]");
        const saved = list instanceof HTMLElement ? list.scrollTop : 0;
        nextX.focus();
        if (list instanceof HTMLElement) {
          list.scrollTop = saved;
          requestAnimationFrame(() => {
            list.scrollTop = saved;
          });
        }
        return;
      }
      if (shouldTabFromHoleFillToNextFirstY(from, false)) {
        const nextY = pickNextHoleFirstPointYFromFillTabTarget(from);
        if (!nextY) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, nextY, nextY);
        const list = from.closest("[data-hole-list]");
        const saved = list instanceof HTMLElement ? list.scrollTop : 0;
        nextY.focus();
        if (list instanceof HTMLElement) {
          list.scrollTop = saved;
          requestAnimationFrame(() => {
            list.scrollTop = saved;
          });
        }
        return;
      }
      if (shouldTabFromHoleFillToNextHeader(from, false)) {
        const nextHeader = pickNextHoleHeaderFromFillTabTarget(from);
        if (!nextHeader) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, nextHeader, nextHeader);
        const list = from.closest("[data-hole-list]");
        const saved = list instanceof HTMLElement ? list.scrollTop : 0;
        nextHeader.focus();
        if (list instanceof HTMLElement) {
          list.scrollTop = saved;
          requestAnimationFrame(() => {
            list.scrollTop = saved;
          });
        }
        return;
      }
      if (shouldTabFromHoleDeleteToNextFill(from, false)) {
        const nextFill = pickNextHoleFillFromDeleteTabTarget(from);
        if (!nextFill) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, nextFill, nextFill);
        const list = from.closest("[data-hole-list]");
        const saved = list instanceof HTMLElement ? list.scrollTop : 0;
        nextFill.focus();
        if (list instanceof HTMLElement) {
          list.scrollTop = saved;
          requestAnimationFrame(() => {
            list.scrollTop = saved;
          });
        }
        return;
      }
      if (!shouldTabFromHoleDeleteToNextHeader(from, false)) return;
      const nextHeader = pickNextHoleHeaderFromDeleteTabTarget(from);
      if (!nextHeader) return;
      e.preventDefault();
      tagHoleHeaderTabCrossing(from, nextHeader, nextHeader);
      const list = from.closest("[data-hole-list]");
      const saved = list instanceof HTMLElement ? list.scrollTop : 0;
      nextHeader.focus();
      if (list instanceof HTMLElement) {
        list.scrollTop = saved;
        requestAnimationFrame(() => {
          list.scrollTop = saved;
        });
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);
  return <PathFieldsImpl node={node} />;
}
