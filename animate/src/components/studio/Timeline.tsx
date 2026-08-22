import { useEffect, useRef } from "react";
import { collectCycles, evalTrack, resolveHandles } from "@/lib/studio/eval";
import { channelShort, formatDuration, formatTimecode } from "@/lib/studio/format";
import { useStudio } from "@/lib/studio/store";
import type { KeyRef, Track } from "@/lib/studio/types";

const ROW = 22;
const LABEL_W = 148;
const RULER = 28;
const OVERVIEW = 18;

function timeToX(t: number, start: number, end: number, w: number) {
  return LABEL_W + ((t - start) / Math.max(end - start, 1e-6)) * (w - LABEL_W);
}

function xToTime(x: number, start: number, end: number, w: number) {
  const u = (x - LABEL_W) / Math.max(w - LABEL_W, 1);
  return start + u * (end - start);
}

function niceTicks(start: number, end: number): { step: number; major: number } {
  const span = Math.max(end - start, 0.001);
  const raw = span / 10;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const step = n < 1.5 ? pow : n < 3.5 ? 2 * pow : n < 7.5 ? 5 * pow : 10 * pow;
  return { step, major: step * 5 };
}

type CurveCache = {
  min: number;
  max: number;
  y0: number;
  areaH: number;
  viewStart: number;
  viewEnd: number;
  w: number;
  keys: { trackId: string; index: number; x: number; y: number }[];
  handles: { trackId: string; index: number; side: "in" | "out"; x: number; y: number }[];
};

let curveCache: CurveCache | null = null;

export function Timeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const vScroll = useRef(0);
  const drag = useRef<
    | { kind: "playhead" }
    | { kind: "pan"; x: number; start: number; end: number }
    | { kind: "key"; trackId: string; index: number }
    | {
        kind: "keys";
        origins: { trackId: string; index: number; t: number; v: number }[];
        x0: number;
        y0: number;
        curve: boolean;
      }
    | { kind: "curve-key"; trackId: string; index: number }
    | { kind: "tangent"; trackId: string; index: number; side: "in" | "out" }
    | { kind: "range"; edge: "in" | "out" }
    | { kind: "box"; x0: number; y0: number; x1: number; y1: number; additive: boolean }
    | null
  >(null);
  const boxPaint = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let running = true;

    const paint = () => {
      if (!running) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const s = useStudio.getState();
      const { viewStart, viewEnd, currentTime, tracks, nodes, selectedId, selectedIds, selectedTrackId, selectedKeyIndex, selectedKeys, playbackStart, playbackEnd, duration, bottomTab } = s;

      ctx.fillStyle = "#12141a";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#0b0c0e";
      ctx.fillRect(0, 0, w, OVERVIEW);
      const overviewEnd = duration > 120 ? Math.max(playbackEnd * 4, 60) : duration;
      const ox = (t: number) => (t / Math.max(overviewEnd, 1e-6)) * w;
      ctx.fillStyle = "rgba(138,164,184,0.14)";
      ctx.fillRect(ox(playbackStart), 2, Math.max(2, ox(playbackEnd) - ox(playbackStart)), OVERVIEW - 4);
      ctx.fillStyle = "rgba(236,236,232,0.18)";
      ctx.fillRect(ox(viewStart), 4, Math.max(2, ox(viewEnd) - ox(viewStart)), OVERVIEW - 8);
      ctx.fillStyle = "#d98a74";
      ctx.fillRect(ox(currentTime) - 0.5, 0, 1.5, OVERVIEW);

      const sheetY = OVERVIEW;
      const sheetH = h - OVERVIEW;

      const xIn = timeToX(playbackStart, viewStart, viewEnd, w);
      const xOut = timeToX(playbackEnd, viewStart, viewEnd, w);
      ctx.fillStyle = "rgba(138,164,184,0.05)";
      ctx.fillRect(Math.min(xIn, LABEL_W), sheetY, Math.max(0, xOut - Math.min(xIn, LABEL_W)), sheetH);

      ctx.fillStyle = "#16181d";
      ctx.fillRect(0, sheetY, w, RULER);
      ctx.strokeStyle = "rgba(236,236,232,0.08)";
      ctx.beginPath();
      ctx.moveTo(0, sheetY + RULER);
      ctx.lineTo(w, sheetY + RULER);
      ctx.stroke();

      const { step } = niceTicks(viewStart, viewEnd);
      ctx.font = "500 10px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.fillStyle = "#8b909a";
      const first = Math.floor(viewStart / step) * step;
      for (let t = first; t <= viewEnd + step; t += step) {
        const x = timeToX(t, viewStart, viewEnd, w);
        if (x < LABEL_W) continue;
        ctx.strokeStyle = "rgba(236,236,232,0.08)";
        ctx.beginPath();
        ctx.moveTo(x + 0.5, sheetY + 16);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
        ctx.fillStyle = "#8b909a";
        ctx.fillText(formatTimecode(t, viewEnd > 90), x + 4, sheetY + 14);
      }

      ctx.fillStyle = "#0b0c0e";
      ctx.fillRect(0, sheetY, LABEL_W, sheetH);
      ctx.strokeStyle = "rgba(236,236,232,0.08)";
      ctx.beginPath();
      ctx.moveTo(LABEL_W + 0.5, sheetY);
      ctx.lineTo(LABEL_W + 0.5, h);
      ctx.stroke();

      if (bottomTab === "cycles") {
        drawCycles(ctx, w, h, sheetY + RULER, tracks, currentTime);
      } else if (bottomTab === "curves") {
        drawCurves(
          ctx,
          w,
          h,
          sheetY + RULER,
          tracks,
          selectedId,
          selectedIds,
          viewStart,
          viewEnd,
          currentTime,
          selectedTrackId,
          selectedKeyIndex,
          selectedKeys,
        );
      } else {
        drawDope(
          ctx,
          w,
          h,
          sheetY + RULER,
          tracks,
          nodes,
          selectedId,
          selectedIds,
          selectedTrackId,
          selectedKeyIndex,
          selectedKeys,
          viewStart,
          viewEnd,
          vScroll.current,
        );
      }

      const box = boxPaint.current;
      if (box) {
        const left = Math.min(box.x0, box.x1);
        const top = Math.min(box.y0, box.y1);
        const bw = Math.abs(box.x1 - box.x0);
        const bh = Math.abs(box.y1 - box.y0);
        ctx.fillStyle = "rgba(138,164,184,0.12)";
        ctx.fillRect(left, top, bw, bh);
        ctx.strokeStyle = "rgba(138,164,184,0.85)";
        ctx.strokeRect(left + 0.5, top + 0.5, bw, bh);
      }

      const px = timeToX(currentTime, viewStart, viewEnd, w);
      if (px >= LABEL_W && px <= w) {
        ctx.strokeStyle = "#d98a74";
        ctx.beginPath();
        ctx.moveTo(px + 0.5, sheetY);
        ctx.lineTo(px + 0.5, h);
        ctx.stroke();
        ctx.fillStyle = "#d98a74";
        ctx.beginPath();
        ctx.moveTo(px - 5, sheetY);
        ctx.lineTo(px + 5, sheetY);
        ctx.lineTo(px, sheetY + 8);
        ctx.closePath();
        ctx.fill();
      }

      raf = requestAnimationFrame(paint);
    };

    raf = requestAnimationFrame(paint);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    };

    const onDown = (e: PointerEvent) => {
      const { x, y, w } = pos(e);
      const s = useStudio.getState();
      canvas.setPointerCapture(e.pointerId);

      if (y < OVERVIEW) {
        const overviewEnd = s.duration > 120 ? Math.max(s.playbackEnd * 4, 60) : s.duration;
        const t = (x / w) * overviewEnd;
        const ox = (v: number) => (v / Math.max(overviewEnd, 1e-6)) * w;
        const inX = ox(s.playbackStart);
        const outX = ox(s.playbackEnd);
        if (Math.abs(x - inX) < 6) {
          drag.current = { kind: "range", edge: "in" };
          return;
        }
        if (Math.abs(x - outX) < 6) {
          drag.current = { kind: "range", edge: "out" };
          return;
        }
        s.setTime(t);
        drag.current = { kind: "playhead" };
        return;
      }
      if (y < OVERVIEW + RULER) {
        if (x < LABEL_W) return;
        if (e.altKey || e.button === 1) {
          drag.current = { kind: "pan", x, start: s.viewStart, end: s.viewEnd };
        } else {
          s.setTime(xToTime(x, s.viewStart, s.viewEnd, w));
          drag.current = { kind: "playhead" };
        }
        return;
      }
      if (s.bottomTab === "curves" && x >= LABEL_W && curveCache) {
        let handleHit = -1;
        let handleD = 9;
        curveCache.handles.forEach((h, i) => {
          const d = Math.hypot(h.x - x, h.y - y);
          if (d < handleD) {
            handleD = d;
            handleHit = i;
          }
        });
        if (handleHit >= 0) {
          const hit = curveCache.handles[handleHit]!;
          s.selectKey(hit.trackId, hit.index);
          const tr = s.tracks.find((t) => t.id === hit.trackId);
          if (tr) s.setSelected(tr.objectId);
          s.pushHistory();
          drag.current = { kind: "tangent", trackId: hit.trackId, index: hit.index, side: hit.side };
          return;
        }
        let best = -1;
        let bestD = 10;
        curveCache.keys.forEach((k, i) => {
          const d = Math.hypot(k.x - x, k.y - y);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        if (best >= 0) {
          const hit = curveCache.keys[best]!;
          const additive = e.shiftKey || e.metaKey || e.ctrlKey;
          s.selectKey(hit.trackId, hit.index, { additive });
          const tr = s.tracks.find((t) => t.id === hit.trackId);
          if (tr) s.setSelected(tr.objectId, { additive });
          const state = useStudio.getState();
          const refs = state.selectedKeys.length
            ? state.selectedKeys
            : [{ trackId: hit.trackId, index: hit.index }];
          const origins = refs.map((ref) => {
            const track = state.tracks.find((t) => t.id === ref.trackId);
            const key = track?.keys[ref.index];
            return { trackId: ref.trackId, index: ref.index, t: key?.t ?? 0, v: key?.v ?? 0 };
          });
          drag.current = { kind: "keys", origins, x0: x, y0: y, curve: true };
          return;
        }
        const t = tSafe(x, s, w);
        const v = vFromCache(y, curveCache);
        const target = pickCurveTrack(s, t, y, curveCache);
        if ((e.detail === 2 || e.ctrlKey || e.metaKey) && target && !target.expr) {
          s.insertCurveKey(target.id, t, v);
          return;
        }
        if (target && distToCurve(target, t, y, curveCache) < 10) {
          s.setSelected(target.objectId);
          s.selectKey(target.id, null);
          return;
        }
        drag.current = {
          kind: "box",
          x0: x,
          y0: y,
          x1: x,
          y1: y,
          additive: e.shiftKey || e.metaKey || e.ctrlKey,
        };
        boxPaint.current = { x0: x, y0: y, x1: x, y1: y };
        return;
      }
      if (x < LABEL_W) {
        const row = Math.floor((y - OVERVIEW - RULER + vScroll.current) / ROW);
        const rows = visibleRows(s.tracks, s.nodes, s.selectedId, s.bottomTab);
        const hit = rows[row];
        if (hit) {
          s.setSelected(hit.objectId);
          s.selectKey(hit.trackId, null);
        }
        return;
      }
      if (s.bottomTab === "dope") {
        const row = Math.floor((y - OVERVIEW - RULER + vScroll.current) / ROW);
        const rows = visibleRows(s.tracks, s.nodes, s.selectedId, s.bottomTab);
        const hit = rows[row];
        if (hit) {
          const t = xToTime(x, s.viewStart, s.viewEnd, w);
          const tr = s.tracks.find((k) => k.id === hit.trackId);
          if (tr) {
            let best = -1;
            let bestD = 10;
            tr.keys.forEach((k, i) => {
              const kx = timeToX(k.t, s.viewStart, s.viewEnd, w);
              const d = Math.abs(kx - x);
              if (d < bestD) {
                bestD = d;
                best = i;
              }
            });
            if (best >= 0 && bestD < 8) {
              const additive = e.shiftKey || e.metaKey || e.ctrlKey;
              s.selectKey(tr.id, best, { additive });
              s.setSelected(tr.objectId, { additive });
              const state = useStudio.getState();
              const refs = state.selectedKeys.length
                ? state.selectedKeys
                : [{ trackId: tr.id, index: best }];
              const origins = refs.map((ref) => {
                const track = state.tracks.find((t) => t.id === ref.trackId);
                const key = track?.keys[ref.index];
                return { trackId: ref.trackId, index: ref.index, t: key?.t ?? 0, v: key?.v ?? 0 };
              });
              drag.current = { kind: "keys", origins, x0: x, y0: y, curve: false };
              return;
            }
            if (e.detail === 2 && !tr.expr) {
              s.insertKey(tr.objectId, tr.channel, t);
              return;
            }
          }
        }
        drag.current = {
          kind: "box",
          x0: x,
          y0: y,
          x1: x,
          y1: y,
          additive: e.shiftKey || e.metaKey || e.ctrlKey,
        };
        boxPaint.current = { x0: x, y0: y, x1: x, y1: y };
      } else {
        s.setTime(tSafe(x, s, w));
        drag.current = { kind: "playhead" };
      }
    };

    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const { x, y, w } = pos(e);
      const s = useStudio.getState();
      if (d.kind === "playhead") {
        if (e.buttons && yOverview(e, canvas) < OVERVIEW) {
          const overviewEnd = s.duration > 120 ? Math.max(s.playbackEnd * 4, 60) : s.duration;
          s.setTime((x / w) * overviewEnd);
        } else s.setTime(tSafe(x, s, w));
      } else if (d.kind === "pan") {
        const dt = xToTime(d.x, d.start, d.end, w) - xToTime(x, d.start, d.end, w);
        s.setViewRange(d.start + dt, d.end + dt);
      } else if (d.kind === "key") {
        s.moveKey(d.trackId, d.index, tSafe(x, s, w));
      } else if (d.kind === "keys") {
        const dt = tSafe(x, s, w) - tSafe(d.x0, s, w);
        if (d.curve && curveCache) {
          const dv = vFromCache(y, curveCache) - vFromCache(d.y0, curveCache);
          s.dragKeys(d.origins, dt, dv);
        } else {
          s.dragKeys(d.origins, dt);
        }
      } else if (d.kind === "box") {
        d.x1 = x;
        d.y1 = y;
        boxPaint.current = { x0: d.x0, y0: d.y0, x1: x, y1: y };
      } else if (d.kind === "curve-key" && curveCache) {
        s.moveKey(d.trackId, d.index, tSafe(x, s, w));
        const v = vFromCache(y, curveCache);
        s.setKeyValue(d.trackId, d.index, v);
      } else if (d.kind === "tangent" && curveCache) {
        const tr = s.tracks.find((t) => t.id === d.trackId);
        const key = tr?.keys[d.index];
        if (key) {
          const t = tSafe(x, s, w);
          const v = vFromCache(y, curveCache);
          if (d.side === "out") {
            s.setKeyTangent(d.trackId, d.index, "out", t - key.t, v - key.v, {
              broken: e.altKey || key.broken,
            });
          } else {
            s.setKeyTangent(d.trackId, d.index, "in", key.t - t, v - key.v, {
              broken: e.altKey || key.broken,
            });
          }
        }
      } else if (d.kind === "range") {
        const overviewEnd = s.duration > 120 ? Math.max(s.playbackEnd * 4, 60) : s.duration;
        const t = Math.max(0, (x / w) * overviewEnd);
        if (d.edge === "in") s.setPlaybackRange(t, s.playbackEnd);
        else s.setPlaybackRange(s.playbackStart, t);
      }
    };

    const onUp = () => {
      const d = drag.current;
      const s = useStudio.getState();
      if (d?.kind === "keys") {
        s.sortTrackKeys([...new Set(d.origins.map((o) => o.trackId))]);
      }
      if (d?.kind === "box") {
        const left = Math.min(d.x0, d.x1);
        const right = Math.max(d.x0, d.x1);
        const top = Math.min(d.y0, d.y1);
        const bottom = Math.max(d.y0, d.y1);
        const tiny = right - left < 5 && bottom - top < 5;
        if (tiny) {
          const canvas = canvasRef.current;
          if (canvas) {
            const w = canvas.getBoundingClientRect().width;
            s.setTime(tSafe(d.x1, s, w));
          }
          if (!d.additive) s.selectKey(null, null);
        } else {
          const hits = collectKeysInBox(
            s,
            left,
            top,
            right,
            bottom,
            vScroll.current,
            canvasRef.current?.getBoundingClientRect().width ?? 800,
          );
          s.selectKeys(hits, { additive: d.additive });
        }
      }
      drag.current = null;
      boxPaint.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = useStudio.getState();
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const w = r.width;
      if (x < LABEL_W && s.bottomTab === "dope") {
        vScroll.current = Math.max(0, vScroll.current + e.deltaY);
        return;
      }
      const t = xToTime(x, s.viewStart, s.viewEnd, w);
      const scale = e.deltaY > 0 ? 1.12 : 0.88;
      const span = s.viewEnd - s.viewStart;
      const next = Math.min(Math.max(span * scale, 0.25), Math.max(s.duration, 24));
      const u = (t - s.viewStart) / span;
      s.setViewRange(t - next * u, t + next * (1 - u));
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  const tab = useStudio((s) => s.bottomTab);
  const duration = useStudio((s) => s.duration);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-8 items-center gap-1 border-b border-border px-2">
        {(
          [
            ["dope", "Dope sheet"],
            ["curves", "Curves"],
            ["cycles", "Cycle clock"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => useStudio.getState().setBottomTab(id)}
            className={`h-6 rounded-sm px-2 text-xs font-medium ${
              tab === id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto font-mono text-2xs text-muted">
          Project {formatDuration(duration)}
        </span>
      </div>
      <div ref={wrapRef} className="min-h-0 flex-1">
        <canvas ref={canvasRef} className="block h-full w-full cursor-default" />
      </div>
    </div>
  );
}

function tSafe(x: number, s: { viewStart: number; viewEnd: number }, w: number) {
  return xToTime(Math.max(LABEL_W, x), s.viewStart, s.viewEnd, w);
}

function vFromCache(y: number, c: CurveCache) {
  const u = 1 - (y - c.y0 - 8) / Math.max(c.areaH - 16, 1);
  return c.min + u * (c.max - c.min);
}

function yAtCache(v: number, c: CurveCache) {
  return c.y0 + 8 + (1 - (v - c.min) / Math.max(c.max - c.min, 1e-6)) * (c.areaH - 16);
}

function pickCurveTrack(
  s: { tracks: Track[]; selectedId: string | null; selectedTrackId: string | null },
  t: number,
  y: number,
  cache: CurveCache,
): Track | null {
  const listed = s.tracks.filter((tr) => (s.selectedId ? tr.objectId === s.selectedId : true) && !tr.expr);
  if (s.selectedTrackId) {
    const sel = listed.find((tr) => tr.id === s.selectedTrackId);
    if (sel) return sel;
  }
  let best: Track | null = listed[0] ?? null;
  let bestD = Infinity;
  for (const tr of listed.slice(0, 6)) {
    const d = Math.abs(yAtCache(evalTrack(tr, t) ?? 0, cache) - y);
    if (d < bestD) {
      bestD = d;
      best = tr;
    }
  }
  return best;
}

function distToCurve(tr: Track, t: number, y: number, cache: CurveCache) {
  return Math.abs(yAtCache(evalTrack(tr, t) ?? 0, cache) - y);
}

function yOverview(e: PointerEvent, canvas: HTMLCanvasElement) {
  return e.clientY - canvas.getBoundingClientRect().top;
}

function visibleRows(
  tracks: Track[],
  nodes: Record<string, { name: string }>,
  selectedId: string | null,
  tab: string,
) {
  const list = tracks.filter((t) => (tab === "dope" ? true : selectedId ? t.objectId === selectedId : true));
  const ordered = selectedId
    ? [...list.filter((t) => t.objectId === selectedId), ...list.filter((t) => t.objectId !== selectedId)]
    : list;
  return ordered.map((t) => ({
    trackId: t.id,
    objectId: t.objectId,
    label: `${nodes[t.objectId]?.name ?? "?"}  ${channelShort(t.channel)}`,
    expr: Boolean(t.expr),
    cycle: t.cycle,
  }));
}

function isKeySel(keys: KeyRef[], trackId: string, index: number, selectedTrackId: string | null, selectedKeyIndex: number | null) {
  if (keys.some((k) => k.trackId === trackId && k.index === index)) return true;
  return selectedTrackId === trackId && selectedKeyIndex === index;
}

function collectKeysInBox(
  s: {
    tracks: Track[];
    nodes: Record<string, { name: string }>;
    selectedId: string | null;
    bottomTab: string;
    viewStart: number;
    viewEnd: number;
  },
  left: number,
  top: number,
  right: number,
  bottom: number,
  scroll: number,
  w: number,
): KeyRef[] {
  const hits: KeyRef[] = [];
  if (s.bottomTab === "curves" && curveCache) {
    for (const k of curveCache.keys) {
      if (k.x >= left && k.x <= right && k.y >= top && k.y <= bottom) {
        hits.push({ trackId: k.trackId, index: k.index });
      }
    }
    return hits;
  }
  const rows = visibleRows(s.tracks, s.nodes, s.selectedId, s.bottomTab);
  rows.forEach((row, i) => {
    const y = OVERVIEW + RULER + i * ROW - scroll + ROW / 2;
    if (y < top || y > bottom) return;
    const tr = s.tracks.find((t) => t.id === row.trackId);
    if (!tr) return;
    tr.keys.forEach((key, index) => {
      const x = timeToX(key.t, s.viewStart, s.viewEnd, w);
      if (x >= left && x <= right) hits.push({ trackId: tr.id, index });
    });
  });
  return hits;
}

function drawDope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  y0: number,
  tracks: Track[],
  nodes: Record<string, { name: string }>,
  selectedId: string | null,
  selectedIds: string[],
  selectedTrackId: string | null,
  selectedKeyIndex: number | null,
  selectedKeys: KeyRef[],
  viewStart: number,
  viewEnd: number,
  scroll: number,
) {
  const rows = visibleRows(tracks, nodes, selectedId, "dope");
  ctx.font = "500 10px Outfit, sans-serif";
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y0, w, h - y0);
  ctx.clip();
  rows.forEach((row, i) => {
    const y = y0 + i * ROW - scroll;
    if (y + ROW < y0 || y > h) return;
    const objOn = selectedIds.includes(row.objectId) || row.objectId === selectedId;
    if (objOn) {
      ctx.fillStyle = "rgba(138,164,184,0.08)";
      ctx.fillRect(0, y, w, ROW);
    }
    ctx.fillStyle = objOn ? "#ecece8" : "#8b909a";
    ctx.fillText(row.label, 8, y + 15);
    if (row.expr) {
      ctx.fillStyle = "#8aa4b8";
      ctx.fillRect(LABEL_W + 8, y + 9, w - LABEL_W - 16, 4);
      ctx.font = "500 9px 'IBM Plex Mono', monospace";
      ctx.fillText("expr · cycle", LABEL_W + 12, y + 8);
      ctx.font = "500 10px Outfit, sans-serif";
    }
    const tr = tracks.find((t) => t.id === row.trackId);
    if (!tr) return;
    for (let k = 0; k < tr.keys.length; k++) {
      const key = tr.keys[k]!;
      const x = timeToX(key.t, viewStart, viewEnd, w);
      if (x < LABEL_W - 6 || x > w + 6) continue;
      const sel = isKeySel(selectedKeys, tr.id, k, selectedTrackId, selectedKeyIndex);
      ctx.save();
      ctx.translate(x, y + ROW / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = sel ? "#ecece8" : "#d98a74";
      const sz = sel ? 6 : 4.5;
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
  });
  ctx.restore();
}

function drawCurves(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  y0: number,
  tracks: Track[],
  selectedId: string | null,
  selectedIds: string[],
  viewStart: number,
  viewEnd: number,
  currentTime: number,
  selectedTrackId: string | null,
  selectedKeyIndex: number | null,
  selectedKeys: KeyRef[],
) {
  const focus = selectedIds[selectedIds.length - 1] ?? selectedId;
  const list = tracks.filter((t) => (focus ? t.objectId === focus : true));
  const areaH = h - y0 - 8;
  const colors = ["#8aa4b8", "#d98a74", "#7a9e7e", "#c5cdd6", "#b9a48a"];
  if (list.length === 0) {
    ctx.fillStyle = "#8b909a";
    ctx.font = "500 12px Outfit, sans-serif";
    ctx.fillText("Select an object with animation to edit curves.", LABEL_W + 16, y0 + 28);
    curveCache = null;
    return;
  }

  let min = Infinity;
  let max = -Infinity;
  const samples = 180;
  const plotted = list.slice(0, 6).map((tr) => {
    const pts: number[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = viewStart + ((viewEnd - viewStart) * i) / samples;
      const v = evalTrack(tr, t) ?? 0;
      pts.push(v);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    return { tr, pts };
  });
  if (!Number.isFinite(min)) {
    min = -1;
    max = 1;
  }
  if (max - min < 1e-4) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.12;
  min -= pad;
  max += pad;
  const yAt = (v: number) => y0 + 8 + (1 - (v - min) / (max - min)) * (areaH - 16);

  ctx.strokeStyle = "rgba(236,236,232,0.06)";
  ctx.beginPath();
  ctx.moveTo(LABEL_W, yAt(0));
  ctx.lineTo(w, yAt(0));
  ctx.stroke();

  const keyHits: CurveCache["keys"] = [];
  const handleHits: CurveCache["handles"] = [];

  plotted.forEach(({ tr, pts }, idx) => {
    const active = !selectedTrackId || selectedTrackId === tr.id;
    ctx.strokeStyle = colors[idx % colors.length]!;
    ctx.globalAlpha = active ? 1 : 0.25;
    ctx.lineWidth = active ? 1.6 : 1;
    ctx.beginPath();
    pts.forEach((v, i) => {
      const t = viewStart + ((viewEnd - viewStart) * i) / samples;
      const x = timeToX(t, viewStart, viewEnd, w);
      const y = yAt(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
    tr.keys.forEach((k, ki) => {
      const x = timeToX(k.t, viewStart, viewEnd, w);
      const y = yAt(k.v);
      const sel = isKeySel(selectedKeys, tr.id, ki, selectedTrackId, selectedKeyIndex);
      ctx.fillStyle = sel ? "#ecece8" : colors[idx % colors.length]!;
      ctx.beginPath();
      ctx.arc(x, y, sel ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();
      keyHits.push({ trackId: tr.id, index: ki, x, y });

      if (sel && k.interp !== "step") {
        const prev = tr.keys[ki - 1];
        const next = tr.keys[ki + 1];
        ctx.strokeStyle = "rgba(236,236,232,0.45)";
        ctx.fillStyle = "#ecece8";
        ctx.lineWidth = 1;
        if (next) {
          const h = resolveHandles(k, next);
          const hx = timeToX(h.x1, viewStart, viewEnd, w);
          const hy = yAt(h.y1);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(hx, hy);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(hx, hy, 4, 0, Math.PI * 2);
          ctx.fill();
          handleHits.push({ trackId: tr.id, index: ki, side: "out", x: hx, y: hy });
        }
        if (prev) {
          const h = resolveHandles(prev, k);
          const hx = timeToX(h.x2, viewStart, viewEnd, w);
          const hy = yAt(h.y2);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(hx, hy);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(hx, hy, 4, 0, Math.PI * 2);
          ctx.fill();
          handleHits.push({ trackId: tr.id, index: ki, side: "in", x: hx, y: hy });
        }
      }
    });
    ctx.fillStyle = colors[idx % colors.length]!;
    ctx.font = "500 10px Outfit, sans-serif";
    ctx.fillText(channelShort(tr.channel), 8, y0 + 16 + idx * 14);
  });

  ctx.fillStyle = "#8b909a";
  ctx.font = "500 10px Outfit, sans-serif";
  ctx.fillText("Double-click or ⌘-click empty to insert. Drag handles · Alt breaks.", LABEL_W + 12, h - 10);

  curveCache = { min, max, y0, areaH, viewStart, viewEnd, w, keys: keyHits, handles: handleHits };

  const px = timeToX(currentTime, viewStart, viewEnd, w);
  ctx.strokeStyle = "rgba(217,138,116,0.5)";
  ctx.beginPath();
  ctx.moveTo(px, y0);
  ctx.lineTo(px, h);
  ctx.stroke();
}

function drawCycles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  y0: number,
  tracks: Track[],
  currentTime: number,
) {
  const cycles = collectCycles(tracks);
  const cx = LABEL_W + (w - LABEL_W) / 2;
  const cy = y0 + (h - y0) / 2;
  const maxR = Math.min(w - LABEL_W, h - y0) * 0.38;
  ctx.fillStyle = "#8b909a";
  ctx.font = "500 11px Outfit, sans-serif";
  ctx.fillText("Nested loops — coprime periods. Full repeat > 2000h.", 12, y0 + 18);
  if (cycles.length === 0) {
    ctx.fillText("No cycling tracks in this scene.", 12, y0 + 38);
    return;
  }
  cycles.forEach((c, i) => {
    const r = maxR * ((i + 1) / (cycles.length + 0.2));
    ctx.strokeStyle = "rgba(236,236,232,0.10)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    const u = (currentTime / c.period) % 1;
    const a = u * Math.PI * 2 - Math.PI / 2;
    ctx.fillStyle = i % 2 === 0 ? "#8aa4b8" : "#d98a74";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#ecece8";
  ctx.font = "600 13px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(formatTimecode(currentTime, true), cx, cy + 4);
  ctx.font = "500 10px 'IBM Plex Mono', monospace";
  ctx.fillStyle = "#8b909a";
  ctx.fillText(`${cycles.length} cycles`, cx, cy + 20);
  ctx.textAlign = "left";
  ctx.font = "500 10px Outfit, sans-serif";
  cycles.forEach((c, i) => {
    ctx.fillStyle = i % 2 === 0 ? "#8aa4b8" : "#d98a74";
    ctx.fillText(`${formatDuration(c.period)}  ${c.label}`, 12, y0 + 40 + i * 14);
  });
}
