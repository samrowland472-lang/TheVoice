import { useEffect } from "react";
import {
  pickLastHoleDeleteFromFillTabTarget,
  pickLastHoleDeleteFromHeaderTabTarget,
  pickLastHoleFillFromHeaderTabTarget,
  pickNextHoleFillFromDeleteTabTarget,
  pickNextHoleHeaderFromDeleteTabTarget,
  pickNextHoleHeaderFromFillTabTarget,
  shouldShiftTabFromNextHoleFillToLastHoleDelete,
  shouldShiftTabFromNextHoleHeaderToLastHoleDelete,
  shouldShiftTabFromNextHoleHeaderToLastHoleFill,
  shouldTabFromHoleDeleteToNextFill,
  shouldTabFromHoleDeleteToNextHeader,
  shouldTabFromHoleFillToNextHeader,
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
