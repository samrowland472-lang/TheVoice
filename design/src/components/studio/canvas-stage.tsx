import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDesign } from "@/lib/design/store";
import { rememberColor } from "@/lib/design/persist";
import { faceAxis, clampAxis, type FontAxisTag } from "@/lib/design/fonts";
import { isText, type TextNode, type ImageNode, type PaintNode } from "@/lib/design/types";
import { nodeAxisValue } from "./mixed-type-axes";

import type { PathPointAlignPreview, PathPointNumericPreview, PathPointHandleNumericPreview } from "@/lib/design/store-impl";
import {
  drawDocument,
  fitViewport,
  screenToDoc,
} from "@/lib/design/render";
import { drawStrokeGhosts } from "@/lib/design/stroke-ghost";
import { fillChipLabel, strokeChipLabel } from "@/lib/design/ink";
import { applyHandle, hitHandle, hitTop, type Handle } from "@/lib/design/hit";
import { applyCropHandle, drawCropHandles, hitCropHandle, sourceBoxFor, type CropHandle } from "@/lib/design/crop-handles";
import { isBitmap } from "@/lib/design/types";
import { nodeCenter, degToRad, rotatePoint } from "@/lib/design/geometry";
import { makeShape, makeText } from "@/lib/design/store";
import { setStudioStatus, holdStudioStatus } from "@/lib/design/studio-status";
import {
  alignSelectedPathPoints,
  appendPenPoint,
  clearPathPointAlignPreview,
  distributeSelectedPathPoints,
  flipSelectedPathPoints,
  previewFlipSelectedPathPoints,
  editPathHit,
  joinSelectedPathToNearest,
  knifeCutStroke,
  lastPathScale,
  previewAlignSelectedPathPoints,
  previewDistributeSelectedPathPoints,
  previewDistributeWithGap,
  applyDistributeWithGap,
  rotateSelectedPathPoints,
  scaleSelectedPathPoints,
  setPathEditHit,
  setPathPointSelection,
  togglePathPointSelection,
  type AlignEdge,
} from "@/lib/design/path-actions";
import { asEditablePath } from "@/lib/design/shape-to-path";
import { knifeStrokePreview, knifePreviewPoint, knifeSplitPieces, knifePointSplitPieces } from "@/lib/design/path-cut";
import { collectKnifeResidual, drawKnifeResidual, type KnifeResidual } from "@/lib/design/knife-residual";
import { hitResizeHandle, handlePoint, type ResizeHandle } from "@/lib/design/box-resize";
import {
  drawPathNodeTangents,
  hitPathNode,
  hitPathLengthLabel,
  pathWorldToLocal,
} from "@/lib/design/path-edit";
import { closePathWithCubic, nearPenClose, mirrorHandle } from "@/lib/design/path-curve";
import { isPath, type DesignNode, type DesignDocument, type PathPoint, type Tool, type Viewport } from "@/lib/design/types";
import type { PathEditHit } from "@/lib/design/path-edit";
import { nodesInMarquee } from "@/lib/design/marquee-nodes";
import {
  drawDistHandle,
  drawEqualGapTicks,
  drawDistTargetSpine,
  drawGapBadges,
} from "@/lib/design/path-point-dist-indicators";
import { formatDistributeGap, getDistributePreview, drawDistributePreview, setLiveDistributePreview, commitDistributePreview, subscribeDistributePreview } from "@/lib/design/distribute-preview";

type DragKind =
  | { type: "move"; id: string; startX: number; startY: number; ox: number; oy: number }
  | { type: "resize"; id: string; handle: Handle; startX: number; startY: number; orig: DesignNode }
  | { type: "crop"; id: string; handle: CropHandle; startX: number; startY: number; orig: DesignNode; source: { x: number; y: number; w: number; h: number } }
  | { type: "rotate"; id: string; startAngle: number; origRot: number; cx: number; cy: number }
  | { type: "gradient-angle"; id: string; cx: number; cy: number; origAngle: number; origLlen: number }
  | { type: "gradient-linear-offset"; id: string }
  | { type: "gradient-stop"; id: string; stopIndex: number; origOffset: number }
  | { type: "gradient-radial"; id: string }
  | { type: "gradient-radial-focal"; id: string }
  | { type: "gradient-radial-r0"; id: string }
  | { type: "pan"; startX: number; startY: number; vx: number; vy: number }
  | { type: "create"; tool: Tool; startX: number; startY: number; id: string | null }
  | {
      type: "path-point";
      id: string;
      hit: PathEditHit;
      keepSmooth: boolean;
      started: boolean;
    }
  | {
      type: "marquee";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      additive: boolean;
    }
  | {
      type: "path-points-rotate";
      id: string;
      startAngle: number;
      cx: number;
      cy: number;
      basePoints: PathPoint[];
      baseHoles?: PathPoint[][];
    }
  | {
      type: "path-points-scale";
      id: string;
      handle: ResizeHandle;
      basePoints: PathPoint[];
      baseHoles?: PathPoint[][];
    }
  | {
      type: "path-points-align";
      id: string;
      edge: AlignEdge;
    }
  | {
      type: "path-points-dist";
      id: string;
      axis: "h" | "v";
      center: number;
      count: number;
      initialGap: number;
    }
  | {
      type: "layer-dist";
      axis: "h" | "v";
      center: number;
      count: number;
      total: number;
    }
  | {
      type: "path-points-flip";
      id: string;
      axis: "x" | "y" | "xy";
    }
  | {
      type: "path-handle-length";
      id: string;
      index: number;
      arm: "in" | "out";
      hole?: number;
      baseVec: { x: number; y: number };
      started: boolean;
    }
  | { type: "knife"; startX: number; startY: number; endX?: number; endY?: number };

function snapGap(gap: number, shift: boolean): number {
  const step = shift ? 5 : 1;
  return Math.max(0, Math.round(gap / step) * step);
}

function snap15(deg: number, force: boolean) {
  if (!force) return deg;
  return Math.round(deg / 15) * 15;
}

function localDelta(n: DesignNode, dx: number, dy: number) {
  const r = -degToRad(n.rotation);
  return {
    dx: dx * Math.cos(r) - dy * Math.sin(r),
    dy: dx * Math.sin(r) + dy * Math.cos(r),
  };
}

export default function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragKind | null>(null);
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const opacityScrubId = useDesign((s) => s.opacityScrubId);
  const axisScrubTag = useDesign((s) => s.axisScrubTag);
  const axisHoverTag = useDesign((s) => s.axisHoverTag);
  const filterHoverKey = useDesign((s) => s.filterHoverKey);
  const typeHoverKey = useDesign((s) => s.typeHoverKey);
  const cropHoverKey = useDesign((s) => s.cropHoverKey);
  const pathDashHoverKey = useDesign((s) => s.pathDashHoverKey);
  const gradientHoverKey = useDesign((s) => s.gradientHoverKey);
  const gradientHoverStop = useDesign((s) => s.gradientHoverStop);
  const radiusScrubId = useDesign((s) => s.radiusScrubId);
  const shadowBlurScrubId = useDesign((s) => s.shadowBlurScrubId);
  const rotationScrubId = useDesign((s) => s.rotationScrubId);
  const shadowOxScrubId = useDesign((s) => s.shadowOxScrubId);
  const shadowOyScrubId = useDesign((s) => s.shadowOyScrubId);
  const shadowSpreadScrubId = useDesign((s) => s.shadowSpreadScrubId);
  const strokeWidthScrubId = useDesign((s) => s.strokeWidthScrubId);
  const strokeDashScrubId = useDesign((s) => s.strokeDashScrubId);
  const strokeDashOffsetScrubId = useDesign((s) => s.strokeDashOffsetScrubId);
  const miterLimitScrubId = useDesign((s) => s.miterLimitScrubId);
  const gradientAngleScrubId = useDesign((s) => s.gradientAngleScrubId);
  const radialR0ScrubId = useDesign((s) => s.radialR0ScrubId);
  const radialCentreScrubId = useDesign((s) => s.radialCentreScrubId);
  const radialFocalScrubId = useDesign((s) => s.radialFocalScrubId);
  const sidesScrubId = useDesign((s) => s.sidesScrubId);
  const headScaleScrubId = useDesign((s) => s.headScaleScrubId);
  const strokeGhost = useDesign((s) => s.strokeGhost);
  const tool = useDesign((s) => s.tool);
  const viewport = useDesign((s) => s.viewport);
  const color = useDesign((s) => s.color);
  const viewIntent = useDesign((s) => s.viewIntent);
  const pathEditHit = useDesign((s) => s.pathEditHit);
  const pathPointSelection = useDesign((s) => s.pathPointSelection);
  const pathPointAlignPreview = useDesign((s) => s.pathPointAlignPreview);
  const pathPointNumericPreview = useDesign((s) => s.pathPointNumericPreview);
  const pathPointHandleNumericPreview = useDesign((s) => s.pathPointHandleNumericPreview);
  const showTangentLengths = useDesign((s) => s.showTangentLengths);
  const distributePreview = useSyncExternalStore(subscribeDistributePreview, getDistributePreview, getDistributePreview);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [knifeStroke, setKnifeStroke] = useState<{ ax: number; ay: number; bx: number; by: number } | null>(null);
  const [knifeHover, setKnifeHover] = useState<{ x: number; y: number } | null>(null);
  const [eyedropperPreview, setEyedropperPreview] = useState<{ sx: number; sy: number; hex: string | null; alpha: number } | null>(null);
  const [stopColorTarget, setStopColorTarget] = useState<{
    id: string;
    stopIndex: number;
    color: string;
    sx: number;
    sy: number;
  } | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [knifeResidual, setKnifeResidual] = useState<KnifeResidual | null>(null);
  const [flushPulse, setFlushPulse] = useState(0);
  const [flushPulseLag, setFlushPulseLag] = useState(0);
  const [flushPulseRotate, setFlushPulseRotate] = useState(0);
  const [flushPulseSlow, setFlushPulseSlow] = useState(0);
  const [flushPulseTrail, setFlushPulseTrail] = useState(0);

  useEffect(() => {
    if (stopColorTarget && colorInputRef.current) {
      // open native picker immediately
      colorInputRef.current.click();
    }
  }, [stopColorTarget]);
  const [scaleFlip, setScaleFlip] = useState<{ x: boolean; y: boolean } | null>(null);
  const [rotateAngle, setRotateAngle] = useState<number | null>(null);
  const [rotateHover, setRotateHover] = useState<{
    cx: number;
    cy: number;
    radius: number;
  } | null>(null);
  const [scaleHover, setScaleHover] = useState<ResizeHandle | null>(null);
  const [distHover, setDistHover] = useState<"h" | "v" | null>(null);
  const [distCursorLabel, setDistCursorLabel] = useState<{
    x: number;
    y: number;
    gap: number;
    axis: "h" | "v";
  } | null>(null);
  const [flipHover, setFlipHover] = useState<"x" | "y" | "xy" | null>(null);
  const [alignHover, setAlignHover] = useState<AlignEdge | null>(null);
  const [lengthHover, setLengthHover] = useState<{
    nodeId: string;
    index: number;
    arm: "in" | "out";
    hole?: number;
    length: number;
    lx: number;
    ly: number;
  } | null>(null);
  const setViewport = useDesign((s) => s.setViewport);
  const select = useDesign((s) => s.select);
  const updateNodes = useDesign((s) => s.updateNodes);
  const addNode = useDesign((s) => s.addNode);
  const setTool = useDesign((s) => s.setTool);
  const commit = useDesign((s) => s.commit);
  const replaceNode = useDesign((s) => s.replaceNode);

  // Fit on first doc or viewIntent
  useEffect(() => {
    if (!doc || !wrapRef.current) return;
    const el = wrapRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w < 8 || h < 8) return;
    if (viewIntent?.type === "fit" || (viewport.x === 0 && viewport.y === 0 && viewport.zoom === 0.4)) {
      const fit = fitViewport(doc.artboard.width, doc.artboard.height, w, h);
      setViewport(fit);
      useDesign.setState({ viewIntent: null });
    } else if (viewIntent?.type === "zoom") {
      const z = Math.max(0.05, Math.min(8, viewIntent.zoom));
      // Keep the artboard center roughly in view when zooming
      const cx = w / 2;
      const cy = h / 2;
      const docX = (cx - viewport.x) / viewport.zoom;
      const docY = (cy - viewport.y) / viewport.zoom;
      setViewport({
        zoom: z,
        x: cx - docX * z,
        y: cy - docY * z,
      });
      useDesign.setState({ viewIntent: null });
    } else if (viewIntent?.type === "fit-sel" && selection.length) {
      const nodes = doc.nodes.filter((n) => selection.includes(n.id));
      if (nodes.length) {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const n of nodes) {
          minX = Math.min(minX, n.x);
          minY = Math.min(minY, n.y);
          maxX = Math.max(maxX, n.x + n.w);
          maxY = Math.max(maxY, n.y + n.h);
        }
        const box = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        const fit = fitViewport(box.w, box.h, w, h, 64);
        setViewport({
          zoom: fit.zoom,
          x: w / 2 - (box.x + box.w / 2) * fit.zoom,
          y: h / 2 - (box.y + box.h / 2) * fit.zoom,
        });
      }
      useDesign.setState({ viewIntent: null });
    }
  }, [doc?.id, viewIntent, setViewport, selection, doc, viewport.x, viewport.y, viewport.zoom]);

  // Residual linger animation — re-draw until fade completes
  useEffect(() => {
    if (!knifeResidual) return;
    let raf = 0;
    const tick = () => {
      const age = performance.now() - knifeResidual.t0;
      if (age >= knifeResidual.duration + 16) {
        setKnifeResidual(null);
        return;
      }
      setKnifeResidual({ ...knifeResidual });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [knifeResidual?.t0]);

  // Flush diamond contact pulse — only while a near-zero distribute preview is live
  useEffect(() => {
    const plan = distributePreview;
    if (!plan || plan.gap > 1.5) {
      setFlushPulse(0);
      setFlushPulseLag(0);
      setFlushPulseRotate(0);
      setFlushPulseSlow(0);
      setFlushPulseTrail(0);
      return;
    }
    let raf = 0;
    const tick = () => {
      // Shared phase clock: primary breath, lag stroke, and trail sparks derive from one phi
      const phi = performance.now() * 0.004;
      setFlushPulse(0.5 + 0.5 * Math.sin(phi));
      // Lag stroke trails the primary by ~60°
      const lagOffset = 1.05;
      setFlushPulseLag(0.5 + 0.5 * Math.sin(phi - lagOffset));
      // Shared slow phase so lag and counter arcs orbit together
      setFlushPulseRotate((performance.now() * 0.00055) % (Math.PI * 2));
      // Second slower harmonic so the diamond breathes on two timescales
      const tSlow = performance.now() * 0.0016;
      setFlushPulseSlow(0.5 + 0.5 * Math.sin(tSlow));
      // Trail sparks share the same clock, only ~26° behind the lag stroke
      setFlushPulseTrail(0.5 + 0.5 * Math.sin(phi - lagOffset - 0.45));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [distributePreview]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !doc) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 8 || h < 8) return;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDocument(ctx, doc, { viewport, dpr });
    drawSelection(ctx, doc.nodes, selection, viewport, dpr, pathEditHit, pathPointSelection, scaleFlip, showTangentLengths, rotateAngle, alignHover);
    if (selection.length === 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
      if (n && n.visible && isBitmap(n)) {
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.zoom, viewport.zoom);
        drawCropHandles(ctx, n, viewport.zoom);
        ctx.restore();
      }
    }
    drawOpacityScrubEdge(ctx, doc.nodes, opacityScrubId, selection, viewport, dpr);
    drawAxisScrubChips(ctx, doc.nodes, axisScrubTag, selection, viewport, dpr);
    drawAxisHoverChips(ctx, doc.nodes, axisHoverTag, selection, viewport, dpr);
    drawFilterHoverChips(ctx, doc.nodes, filterHoverKey, selection, viewport, dpr);
    drawTypeHoverChips(ctx, doc.nodes, typeHoverKey, selection, viewport, dpr);
    drawCropHoverChips(ctx, doc.nodes, cropHoverKey, selection, viewport, dpr);
    drawRadiusScrubChips(ctx, doc.nodes, radiusScrubId, selection, viewport, dpr);
    drawShadowBlurScrubChips(ctx, doc.nodes, shadowBlurScrubId, selection, viewport, dpr);
    drawRotationScrubChips(ctx, doc.nodes, rotationScrubId, selection, viewport, dpr);
    drawShadowOxScrubChips(ctx, doc.nodes, shadowOxScrubId, selection, viewport, dpr);
    drawShadowOyScrubChips(ctx, doc.nodes, shadowOyScrubId, selection, viewport, dpr);
    drawShadowSpreadScrubChips(ctx, doc.nodes, shadowSpreadScrubId, selection, viewport, dpr);
    drawStrokeWidthScrubChips(ctx, doc.nodes, strokeWidthScrubId, selection, viewport, dpr);
    drawStrokeDashScrubChips(ctx, doc.nodes, strokeDashScrubId, selection, viewport, dpr);
    drawStrokeDashOffsetScrubChips(ctx, doc.nodes, strokeDashOffsetScrubId, selection, viewport, dpr);
    drawMiterLimitScrubChips(ctx, doc.nodes, miterLimitScrubId, selection, viewport, dpr);
    drawGradientAngleScrubChips(ctx, doc.nodes, gradientAngleScrubId, selection, viewport, dpr, gradientHoverKey);
    drawRadialR0ScrubChips(ctx, doc.nodes, radialR0ScrubId, selection, viewport, dpr, gradientHoverKey === "r0" ? "r0" : null);
    drawRadialCentreScrubChips(ctx, doc.nodes, radialCentreScrubId, selection, viewport, dpr, gradientHoverKey === "centre" ? "centre" : null);
    drawRadialFocalScrubChips(ctx, doc.nodes, radialFocalScrubId, selection, viewport, dpr, gradientHoverKey === "focal" ? "focal" : null);
    drawSidesScrubChips(ctx, doc.nodes, sidesScrubId, selection, viewport, dpr);
    drawHeadScaleScrubChips(ctx, doc.nodes, headScaleScrubId, selection, viewport, dpr);
    if (pathDashHoverKey) {
      const hoverId = selection[0] ?? null;
      if (pathDashHoverKey === "miter") drawMiterLimitScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr);
      else if (pathDashHoverKey === "sides") drawSidesScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr);
      else if (pathDashHoverKey === "headScale") drawHeadScaleScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr);
      else if (pathDashHoverKey === "offset") drawStrokeDashOffsetScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr);
    }
    if (gradientHoverKey === "angle" || gradientHoverKey === "length" || gradientHoverKey === "offset" || gradientHoverKey === "angle-only" || gradientHoverKey === "length-only") {
      const hoverId = selection[0] ?? null;
      drawGradientAngleScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr, gradientHoverKey);
    }
    if (gradientHoverKey === "r0" || gradientHoverKey === "centre" || gradientHoverKey === "focal") {
      const hoverId = selection[0] ?? null;
      if (gradientHoverKey === "r0") drawRadialR0ScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr, "r0");
      else if (gradientHoverKey === "centre") drawRadialCentreScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr, "centre");
      else if (gradientHoverKey === "focal") drawRadialFocalScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr, "focal");
    }
    const focusedStop = drag.current?.type === "gradient-stop" ? { id: drag.current.id, index: drag.current.stopIndex } : null;
    drawGradientAngleHandle(ctx, doc.nodes, selection, viewport, dpr, gradientHoverKey, focusedStop, gradientHoverStop);
    drawGradientRadialHandle(ctx, doc.nodes, selection, viewport, dpr, gradientHoverKey, focusedStop, gradientHoverStop);
    if (strokeGhost) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);
      const outlines = doc.nodes.filter((n) => selection.includes(n.id));
      drawStrokeGhosts(ctx, outlines, strokeGhost, viewport.zoom);
      ctx.restore();
      drawStrokeCapJoinChips(ctx, doc.nodes, strokeGhost, selection, viewport, dpr);
    }
    const distPlan = getDistributePreview();
    if (distPlan) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);
      drawDistributePreview(ctx, distPlan, viewport.zoom, flushPulse, flushPulseLag, flushPulseRotate, flushPulseSlow, flushPulseTrail);
      ctx.restore();
    }
    if (pathPointAlignPreview) drawPathPointAlignPreview(ctx, pathPointAlignPreview, doc, viewport, dpr);
    if (pathPointNumericPreview) drawPathPointNumericPreview(ctx, pathPointNumericPreview, doc, viewport, dpr);
    if (pathPointHandleNumericPreview) drawPathPointHandleNumericPreview(ctx, pathPointHandleNumericPreview, doc, viewport, dpr);
    if (marquee) drawMarquee(ctx, marquee, viewport, dpr);

    if (lengthHover && showTangentLengths) {
      const { lx, ly, length } = lengthHover;
      const zoom = viewport.zoom;
      const label = String(length);
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(zoom, zoom);
      ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const pad = 5 / zoom;
      const tw = ctx.measureText(label).width;
      const bw = tw + pad * 2;
      const bh = 14 / zoom;
      // Hover preview: slightly more transparent phosphor plate
      ctx.fillStyle = "rgba(6, 23, 15, 0.72)";
      ctx.strokeStyle = "rgba(63, 198, 255, 0.75)";
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 3 / zoom);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(63, 198, 255, 0.9)";
      ctx.fillText(label, lx, ly);
      ctx.restore();
    }
    if (rotateHover) {
      const { cx, cy, radius } = rotateHover;
      const zoom = viewport.zoom;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(zoom, zoom);
      // Phosphor ghost arc around selection center — soft fill + arrowheads
      ctx.beginPath();
      // ~270° arc starting near top, clockwise-ish for rotation hint
      const start = -Math.PI * 0.85;
      const end = Math.PI * 0.65;
      ctx.arc(cx, cy, radius, start, end);
      ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
      ctx.lineWidth = 2.2 / zoom;
      ctx.lineCap = "round";
      ctx.stroke();
      // Soft fill wedge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius * 0.92, start, end);
      ctx.closePath();
      ctx.fillStyle = "rgba(63, 198, 255, 0.08)";
      ctx.fill();
      // Arrowheads at both ends
      const arrowLen = 10 / zoom;
      const arrowAng = 0.45;
      for (const ang of [start, end]) {
        const ax = cx + Math.cos(ang) * radius;
        const ay = cy + Math.sin(ang) * radius;
        const dir = ang === start ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(
          ax - Math.cos(ang - dir * arrowAng) * arrowLen,
          ay - Math.sin(ang - dir * arrowAng) * arrowLen,
        );
        ctx.moveTo(ax, ay);
        ctx.lineTo(
          ax - Math.cos(ang + dir * arrowAng) * arrowLen,
          ay - Math.sin(ang + dir * arrowAng) * arrowLen,
        );
        ctx.strokeStyle = "rgba(126, 224, 255, 0.8)";
        ctx.lineWidth = 1.6 / zoom;
        ctx.stroke();
      }
      ctx.restore();
    }

    if (scaleHover && selection.length === 1 && pathPointSelection.length > 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
      if (n && isPath(n)) {
        const coords: { x: number; y: number }[] = [];
        for (const sel of pathPointSelection) {
          const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
          const pt = ring?.[sel.index];
          if (pt) coords.push({ x: pt.x, y: pt.y });
        }
        if (coords.length > 1) {
          const xs = coords.map((c) => c.x);
          const ys = coords.map((c) => c.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const pad = 6 / viewport.zoom;
          const boxX = n.x + minX - pad;
          const boxY = n.y + minY - pad;
          const boxW = maxX - minX + pad * 2;
          const boxH = maxY - minY + pad * 2;
          const zoom = viewport.zoom;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(viewport.x, viewport.y);
          ctx.scale(zoom, zoom);
          const nc = nodeCenter(n);
          if (n.rotation) {
            ctx.translate(nc.x, nc.y);
            ctx.rotate(degToRad(n.rotation));
            ctx.translate(-nc.x, -nc.y);
          }
          // Soft phosphor ghost box
          ctx.beginPath();
          ctx.rect(boxX, boxY, boxW, boxH);
          ctx.fillStyle = "rgba(63, 198, 255, 0.06)";
          ctx.fill();
          ctx.strokeStyle = "rgba(63, 198, 255, 0.45)";
          ctx.lineWidth = 1.8 / zoom;
          ctx.setLineDash([6 / zoom, 4 / zoom]);
          ctx.stroke();
          ctx.setLineDash([]);
          // Highlight the hovered handle with a larger corner marker
          const hp = handlePoint({ x: boxX, y: boxY, w: boxW, h: boxH }, scaleHover);
          const mark = 11 / zoom;
          ctx.beginPath();
          ctx.arc(hp.x, hp.y, mark / 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(63, 198, 255, 0.25)";
          ctx.fill();
          ctx.strokeStyle = "rgba(126, 224, 255, 0.85)";
          ctx.lineWidth = 1.6 / zoom;
          ctx.stroke();
          // Small cross or corner ticks
          const tick = 5 / zoom;
          ctx.beginPath();
          ctx.moveTo(hp.x - tick, hp.y);
          ctx.lineTo(hp.x + tick, hp.y);
          ctx.moveTo(hp.x, hp.y - tick);
          ctx.lineTo(hp.x, hp.y + tick);
          ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
          ctx.lineWidth = 1.2 / zoom;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    if ((distHover || flipHover || alignHover) && selection.length === 1 && pathPointSelection.length > 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
      if (n && isPath(n)) {
        const coords: { x: number; y: number }[] = [];
        for (const sel of pathPointSelection) {
          const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
          const pt = ring?.[sel.index];
          if (pt) coords.push({ x: pt.x, y: pt.y });
        }
        if (coords.length > 1) {
          const xs = coords.map((c) => c.x);
          const ys = coords.map((c) => c.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const pad = 6 / viewport.zoom;
          const boxX = n.x + minX - pad;
          const boxY = n.y + minY - pad;
          const boxW = maxX - minX + pad * 2;
          const boxH = maxY - minY + pad * 2;
          const zoom = viewport.zoom;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(viewport.x, viewport.y);
          ctx.scale(zoom, zoom);
          const nc = nodeCenter(n);
          if (n.rotation) {
            ctx.translate(nc.x, nc.y);
            ctx.rotate(degToRad(n.rotation));
            ctx.translate(-nc.x, -nc.y);
          }
          const cx = boxX + boxW / 2;
          const cy = boxY + boxH / 2;
          ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
          ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
          ctx.lineWidth = 1.6 / zoom;
          ctx.setLineDash([5 / zoom, 4 / zoom]);
          if (distHover === "h") {
            // Horizontal distribute guide with arrowheads + equal-spacing ticks
            const y = cy;
            drawPhosphorGuideLine(ctx, boxX - 8 / zoom, y, boxX + boxW + 8 / zoom, y, zoom);
            // Arrowheads
            const al = 7 / zoom;
            ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
            ctx.beginPath();
            ctx.moveTo(boxX - 8 / zoom, y);
            ctx.lineTo(boxX - 8 / zoom + al, y - 2.5 / zoom);
            ctx.lineTo(boxX - 8 / zoom + al, y + 2.5 / zoom);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(boxX + boxW + 8 / zoom, y);
            ctx.lineTo(boxX + boxW + 8 / zoom - al, y - 2.5 / zoom);
            ctx.lineTo(boxX + boxW + 8 / zoom - al, y + 2.5 / zoom);
            ctx.closePath();
            ctx.fill();
            // Equal spacing ticks + gap badges
            if (coords.length >= 3) {
              const sortedX = coords.map((c) => c.x).sort((a, b) => a - b);
              const start = n.x + sortedX[0]!;
              const end = n.x + sortedX[sortedX.length - 1]!;
              const gap = (end - start) / (sortedX.length - 1);
              drawEqualGapTicks(ctx, "h", start, y - 1, end - start, 2, coords.length, zoom);
              if (gap > 0.5) {
                drawGapBadges(ctx, "h", start, y - 1, end - start, 2, coords.length, zoom, formatDistributeGap(gap));
              }
            }
          } else if (distHover === "v") {
            const x = cx;
            drawPhosphorGuideLine(ctx, x, boxY - 8 / zoom, x, boxY + boxH + 8 / zoom, zoom);
            const al = 7 / zoom;
            ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
            ctx.beginPath();
            ctx.moveTo(x, boxY - 8 / zoom);
            ctx.lineTo(x - 2.5 / zoom, boxY - 8 / zoom + al);
            ctx.lineTo(x + 2.5 / zoom, boxY - 8 / zoom + al);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x, boxY + boxH + 8 / zoom);
            ctx.lineTo(x - 2.5 / zoom, boxY + boxH + 8 / zoom - al);
            ctx.lineTo(x + 2.5 / zoom, boxY + boxH + 8 / zoom - al);
            ctx.closePath();
            ctx.fill();
            // Equal spacing ticks + gap badges
            if (coords.length >= 3) {
              const sortedY = coords.map((c) => c.y).sort((a, b) => a - b);
              const start = n.y + sortedY[0]!;
              const end = n.y + sortedY[sortedY.length - 1]!;
              const gap = (end - start) / (sortedY.length - 1);
              drawEqualGapTicks(ctx, "v", x - 1, start, 2, end - start, coords.length, zoom);
              if (gap > 0.5) {
                drawGapBadges(ctx, "v", x - 1, start, 2, end - start, coords.length, zoom, formatDistributeGap(gap));
              }
            }
          }
          if (flipHover === "x" || flipHover === "xy") {
            // Vertical mirror line for X flip
            drawPhosphorGuideLine(ctx, cx, boxY - 10 / zoom, cx, boxY + boxH + 10 / zoom, zoom);
          }
          if (flipHover === "y" || flipHover === "xy") {
            // Horizontal mirror line for Y flip
            drawPhosphorGuideLine(ctx, boxX - 10 / zoom, cy, boxX + boxW + 10 / zoom, cy, zoom);
          }
          if (flipHover === "xy") {
            // Small cross at center
            ctx.setLineDash([]);
            const xl = 6 / zoom;
            ctx.beginPath();
            ctx.moveTo(cx - xl, cy - xl);
            ctx.lineTo(cx + xl, cy + xl);
            ctx.moveTo(cx + xl, cy - xl);
            ctx.lineTo(cx - xl, cy + xl);
            ctx.stroke();
          }
          if (alignHover) {
            // Ghost edge guide for align — soft outer dual phosphor rings matching tip / chip ghosts
            const al = 7 / zoom;
            if (alignHover === "left") {
              const x = boxX;
              drawPhosphorGuideLine(ctx, x, boxY - 10 / zoom, x, boxY + boxH + 10 / zoom, zoom);
              // inward arrows (pointing right)
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(x, cy);
              ctx.lineTo(x + al, cy - 2.5 / zoom);
              ctx.lineTo(x + al, cy + 2.5 / zoom);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "right") {
              const x = boxX + boxW;
              drawPhosphorGuideLine(ctx, x, boxY - 10 / zoom, x, boxY + boxH + 10 / zoom, zoom);
              // inward arrows (pointing left)
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(x, cy);
              ctx.lineTo(x - al, cy - 2.5 / zoom);
              ctx.lineTo(x - al, cy + 2.5 / zoom);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "center") {
              const x = boxX + boxW / 2;
              drawPhosphorGuideLine(ctx, x, boxY - 10 / zoom, x, boxY + boxH + 10 / zoom, zoom);
              // inward arrows from both sides
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(x - al, cy);
              ctx.lineTo(x, cy - 2.5 / zoom);
              ctx.lineTo(x, cy + 2.5 / zoom);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(x + al, cy);
              ctx.lineTo(x, cy - 2.5 / zoom);
              ctx.lineTo(x, cy + 2.5 / zoom);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "top") {
              const y = boxY;
              drawPhosphorGuideLine(ctx, boxX - 10 / zoom, y, boxX + boxW + 10 / zoom, y, zoom);
              // inward arrows (pointing down)
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(cx, y);
              ctx.lineTo(cx - 2.5 / zoom, y + al);
              ctx.lineTo(cx + 2.5 / zoom, y + al);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "bottom") {
              const y = boxY + boxH;
              drawPhosphorGuideLine(ctx, boxX - 10 / zoom, y, boxX + boxW + 10 / zoom, y, zoom);
              // inward arrows (pointing up)
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(cx, y);
              ctx.lineTo(cx - 2.5 / zoom, y - al);
              ctx.lineTo(cx + 2.5 / zoom, y - al);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "middle") {
              const y = boxY + boxH / 2;
              drawPhosphorGuideLine(ctx, boxX - 10 / zoom, y, boxX + boxW + 10 / zoom, y, zoom);
              // inward arrows from both sides
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(cx, y - al);
              ctx.lineTo(cx - 2.5 / zoom, y);
              ctx.lineTo(cx + 2.5 / zoom, y);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(cx, y + al);
              ctx.lineTo(cx - 2.5 / zoom, y);
              ctx.lineTo(cx + 2.5 / zoom, y);
              ctx.closePath();
              ctx.fill();
            }
          }
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }

    if (knifeStroke) drawKnifeStroke(ctx, knifeStroke, doc, viewport, dpr);
    else if (knifeHover) drawKnifeHover(ctx, knifeHover, doc, viewport, dpr);
    if (knifeResidual) drawKnifeResidual(ctx, knifeResidual, viewport, dpr);
    if (distCursorLabel) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);
      const z = Math.max(viewport.zoom, 0.01);
      // Near-zero gaps pack the ghosts tight — push the live plate further clear.
      const flush = distCursorLabel.gap <= 1.5;
      const ox = (flush ? 22 : 14) / z;
      const oy = (flush ? 28 : 18) / z;
      const lx = distCursorLabel.x + ox;
      const ly = distCursorLabel.y - oy;
      const text = flush
        ? `flush · ${formatDistributeGap(distCursorLabel.gap)} px`
        : `${formatDistributeGap(distCursorLabel.gap)} px`;
      ctx.font = `${11 / z}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const metrics = ctx.measureText(text);
      const padX = 5 / z;
      const padY = 3 / z;
      const bw = metrics.width + padX * 2;
      const bh = 14 / z;
      ctx.fillStyle = "rgba(6, 23, 15, 0.78)";
      ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
      ctx.lineWidth = 1 / z;
      ctx.beginPath();
      ctx.roundRect(lx - padX, ly - bh / 2, bw, bh, 3 / z);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(63, 198, 255, 0.95)";
      ctx.fillText(text, lx, ly);
      ctx.restore();
    }
  }, [doc, selection, viewport, pathEditHit, pathPointSelection, marquee, knifeStroke, knifeHover, knifeResidual, scaleFlip, pathPointAlignPreview, pathPointNumericPreview, pathPointHandleNumericPreview, showTangentLengths, rotateAngle, lengthHover, rotateHover, scaleHover, distHover, flipHover, alignHover, distributePreview, distCursorLabel, flushPulse, flushPulseLag, flushPulseRotate, flushPulseSlow, flushPulseTrail, opacityScrubId, axisScrubTag, axisHoverTag, filterHoverKey, typeHoverKey, cropHoverKey, radiusScrubId, shadowBlurScrubId, rotationScrubId, shadowOxScrubId, shadowOyScrubId, shadowSpreadScrubId, strokeWidthScrubId, strokeDashScrubId, strokeDashOffsetScrubId, miterLimitScrubId, gradientAngleScrubId, radialR0ScrubId, radialCentreScrubId, radialFocalScrubId, sidesScrubId, headScaleScrubId, pathDashHoverKey, gradientHoverKey, gradientHoverStop, strokeGhost]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas || !doc) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w < 8 || h < 8) return;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawDocument(ctx, doc, { viewport, dpr });
      drawSelection(ctx, doc.nodes, selection, viewport, dpr, pathEditHit, pathPointSelection, scaleFlip, showTangentLengths, rotateAngle, alignHover);
      if (selection.length === 1) {
        const n = doc.nodes.find((x) => x.id === selection[0]);
        if (n && n.visible && isBitmap(n)) {
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(viewport.x, viewport.y);
          ctx.scale(viewport.zoom, viewport.zoom);
          drawCropHandles(ctx, n, viewport.zoom);
          ctx.restore();
        }
      }
    drawOpacityScrubEdge(ctx, doc.nodes, opacityScrubId, selection, viewport, dpr);
    drawAxisScrubChips(ctx, doc.nodes, axisScrubTag, selection, viewport, dpr);
    drawAxisHoverChips(ctx, doc.nodes, axisHoverTag, selection, viewport, dpr);
    drawFilterHoverChips(ctx, doc.nodes, filterHoverKey, selection, viewport, dpr);
    drawTypeHoverChips(ctx, doc.nodes, typeHoverKey, selection, viewport, dpr);
    drawCropHoverChips(ctx, doc.nodes, cropHoverKey, selection, viewport, dpr);
    drawRadiusScrubChips(ctx, doc.nodes, radiusScrubId, selection, viewport, dpr);
    drawShadowBlurScrubChips(ctx, doc.nodes, shadowBlurScrubId, selection, viewport, dpr);
    drawRotationScrubChips(ctx, doc.nodes, rotationScrubId, selection, viewport, dpr);
    drawShadowOxScrubChips(ctx, doc.nodes, shadowOxScrubId, selection, viewport, dpr);
    drawShadowOyScrubChips(ctx, doc.nodes, shadowOyScrubId, selection, viewport, dpr);
    drawShadowSpreadScrubChips(ctx, doc.nodes, shadowSpreadScrubId, selection, viewport, dpr);
    drawStrokeWidthScrubChips(ctx, doc.nodes, strokeWidthScrubId, selection, viewport, dpr);
    drawStrokeDashScrubChips(ctx, doc.nodes, strokeDashScrubId, selection, viewport, dpr);
    drawStrokeDashOffsetScrubChips(ctx, doc.nodes, strokeDashOffsetScrubId, selection, viewport, dpr);
    drawMiterLimitScrubChips(ctx, doc.nodes, miterLimitScrubId, selection, viewport, dpr);
    drawGradientAngleScrubChips(ctx, doc.nodes, gradientAngleScrubId, selection, viewport, dpr, gradientHoverKey);
    drawRadialR0ScrubChips(ctx, doc.nodes, radialR0ScrubId, selection, viewport, dpr, gradientHoverKey === "r0" ? "r0" : null);
    drawRadialCentreScrubChips(ctx, doc.nodes, radialCentreScrubId, selection, viewport, dpr, gradientHoverKey === "centre" ? "centre" : null);
    drawRadialFocalScrubChips(ctx, doc.nodes, radialFocalScrubId, selection, viewport, dpr, gradientHoverKey === "focal" ? "focal" : null);
    drawSidesScrubChips(ctx, doc.nodes, sidesScrubId, selection, viewport, dpr);
    drawHeadScaleScrubChips(ctx, doc.nodes, headScaleScrubId, selection, viewport, dpr);
    if (pathDashHoverKey) {
      const hoverId = selection[0] ?? null;
      if (pathDashHoverKey === "miter") drawMiterLimitScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr);
      else if (pathDashHoverKey === "sides") drawSidesScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr);
      else if (pathDashHoverKey === "headScale") drawHeadScaleScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr);
      else if (pathDashHoverKey === "offset") drawStrokeDashOffsetScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr);
    }
    if (gradientHoverKey === "angle" || gradientHoverKey === "length" || gradientHoverKey === "offset" || gradientHoverKey === "angle-only" || gradientHoverKey === "length-only") {
      const hoverId = selection[0] ?? null;
      drawGradientAngleScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr, gradientHoverKey);
    }
    if (gradientHoverKey === "r0" || gradientHoverKey === "centre" || gradientHoverKey === "focal") {
      const hoverId = selection[0] ?? null;
      if (gradientHoverKey === "r0") drawRadialR0ScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr, "r0");
      else if (gradientHoverKey === "centre") drawRadialCentreScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr, "centre");
      else if (gradientHoverKey === "focal") drawRadialFocalScrubChips(ctx, doc.nodes, hoverId, selection, viewport, dpr, "focal");
    }
    const focusedStop = drag.current?.type === "gradient-stop" ? { id: drag.current.id, index: drag.current.stopIndex } : null;
    drawGradientAngleHandle(ctx, doc.nodes, selection, viewport, dpr, gradientHoverKey, focusedStop, gradientHoverStop);
    drawGradientRadialHandle(ctx, doc.nodes, selection, viewport, dpr, gradientHoverKey, focusedStop, gradientHoverStop);
    if (strokeGhost) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);
      const outlines = doc.nodes.filter((n) => selection.includes(n.id));
      drawStrokeGhosts(ctx, outlines, strokeGhost, viewport.zoom);
      ctx.restore();
      drawStrokeCapJoinChips(ctx, doc.nodes, strokeGhost, selection, viewport, dpr);
    }
    const distPlan = getDistributePreview();
    if (distPlan) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);
      drawDistributePreview(ctx, distPlan, viewport.zoom, flushPulse, flushPulseLag, flushPulseRotate, flushPulseSlow, flushPulseTrail);
      ctx.restore();
    }
    if (pathPointAlignPreview) drawPathPointAlignPreview(ctx, pathPointAlignPreview, doc, viewport, dpr);
    if (pathPointNumericPreview) drawPathPointNumericPreview(ctx, pathPointNumericPreview, doc, viewport, dpr);
    if (pathPointHandleNumericPreview) drawPathPointHandleNumericPreview(ctx, pathPointHandleNumericPreview, doc, viewport, dpr);
      if (marquee) drawMarquee(ctx, marquee, viewport, dpr);

      if (lengthHover && showTangentLengths) {
      const { lx, ly, length } = lengthHover;
      const zoom = viewport.zoom;
      const label = String(length);
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(zoom, zoom);
      ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const pad = 5 / zoom;
      const tw = ctx.measureText(label).width;
      const bw = tw + pad * 2;
      const bh = 14 / zoom;
      // Hover preview: slightly more transparent phosphor plate
      ctx.fillStyle = "rgba(6, 23, 15, 0.72)";
      ctx.strokeStyle = "rgba(63, 198, 255, 0.75)";
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 3 / zoom);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(63, 198, 255, 0.9)";
      ctx.fillText(label, lx, ly);
      ctx.restore();
    }
      if (rotateHover) {
        const { cx, cy, radius } = rotateHover;
        const zoom = viewport.zoom;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(zoom, zoom);
        ctx.beginPath();
        const start = -Math.PI * 0.85;
        const end = Math.PI * 0.65;
        ctx.arc(cx, cy, radius, start, end);
        ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
        ctx.lineWidth = 2.2 / zoom;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius * 0.92, start, end);
        ctx.closePath();
        ctx.fillStyle = "rgba(63, 198, 255, 0.08)";
        ctx.fill();
        const arrowLen = 10 / zoom;
        const arrowAng = 0.45;
        for (const ang of [start, end]) {
          const ax = cx + Math.cos(ang) * radius;
          const ay = cy + Math.sin(ang) * radius;
          const dir = ang === start ? -1 : 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(
            ax - Math.cos(ang - dir * arrowAng) * arrowLen,
            ay - Math.sin(ang - dir * arrowAng) * arrowLen,
          );
          ctx.moveTo(ax, ay);
          ctx.lineTo(
            ax - Math.cos(ang + dir * arrowAng) * arrowLen,
            ay - Math.sin(ang + dir * arrowAng) * arrowLen,
          );
          ctx.strokeStyle = "rgba(126, 224, 255, 0.8)";
          ctx.lineWidth = 1.6 / zoom;
          ctx.stroke();
        }
        ctx.restore();
      }

    if (scaleHover && selection.length === 1 && pathPointSelection.length > 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
      if (n && isPath(n)) {
        const coords: { x: number; y: number }[] = [];
        for (const sel of pathPointSelection) {
          const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
          const pt = ring?.[sel.index];
          if (pt) coords.push({ x: pt.x, y: pt.y });
        }
        if (coords.length > 1) {
          const xs = coords.map((c) => c.x);
          const ys = coords.map((c) => c.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const pad = 6 / viewport.zoom;
          const boxX = n.x + minX - pad;
          const boxY = n.y + minY - pad;
          const boxW = maxX - minX + pad * 2;
          const boxH = maxY - minY + pad * 2;
          const zoom = viewport.zoom;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(viewport.x, viewport.y);
          ctx.scale(zoom, zoom);
          const nc = nodeCenter(n);
          if (n.rotation) {
            ctx.translate(nc.x, nc.y);
            ctx.rotate(degToRad(n.rotation));
            ctx.translate(-nc.x, -nc.y);
          }
          // Soft phosphor ghost box
          ctx.beginPath();
          ctx.rect(boxX, boxY, boxW, boxH);
          ctx.fillStyle = "rgba(63, 198, 255, 0.06)";
          ctx.fill();
          ctx.strokeStyle = "rgba(63, 198, 255, 0.45)";
          ctx.lineWidth = 1.8 / zoom;
          ctx.setLineDash([6 / zoom, 4 / zoom]);
          ctx.stroke();
          ctx.setLineDash([]);
          // Highlight the hovered handle with a larger corner marker
          const hp = handlePoint({ x: boxX, y: boxY, w: boxW, h: boxH }, scaleHover);
          const mark = 11 / zoom;
          ctx.beginPath();
          ctx.arc(hp.x, hp.y, mark / 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(63, 198, 255, 0.25)";
          ctx.fill();
          ctx.strokeStyle = "rgba(126, 224, 255, 0.85)";
          ctx.lineWidth = 1.6 / zoom;
          ctx.stroke();
          // Small cross or corner ticks
          const tick = 5 / zoom;
          ctx.beginPath();
          ctx.moveTo(hp.x - tick, hp.y);
          ctx.lineTo(hp.x + tick, hp.y);
          ctx.moveTo(hp.x, hp.y - tick);
          ctx.lineTo(hp.x, hp.y + tick);
          ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
          ctx.lineWidth = 1.2 / zoom;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    if ((distHover || flipHover || alignHover) && selection.length === 1 && pathPointSelection.length > 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
      if (n && isPath(n)) {
        const coords: { x: number; y: number }[] = [];
        for (const sel of pathPointSelection) {
          const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
          const pt = ring?.[sel.index];
          if (pt) coords.push({ x: pt.x, y: pt.y });
        }
        if (coords.length > 1) {
          const xs = coords.map((c) => c.x);
          const ys = coords.map((c) => c.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const pad = 6 / viewport.zoom;
          const boxX = n.x + minX - pad;
          const boxY = n.y + minY - pad;
          const boxW = maxX - minX + pad * 2;
          const boxH = maxY - minY + pad * 2;
          const zoom = viewport.zoom;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(viewport.x, viewport.y);
          ctx.scale(zoom, zoom);
          const nc = nodeCenter(n);
          if (n.rotation) {
            ctx.translate(nc.x, nc.y);
            ctx.rotate(degToRad(n.rotation));
            ctx.translate(-nc.x, -nc.y);
          }
          const cx = boxX + boxW / 2;
          const cy = boxY + boxH / 2;
          ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
          ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
          ctx.lineWidth = 1.6 / zoom;
          ctx.setLineDash([5 / zoom, 4 / zoom]);
          if (distHover === "h") {
            // Horizontal distribute guide with arrowheads + equal-spacing ticks
            const y = cy;
            drawPhosphorGuideLine(ctx, boxX - 8 / zoom, y, boxX + boxW + 8 / zoom, y, zoom);
            // Arrowheads
            const al = 7 / zoom;
            ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
            ctx.beginPath();
            ctx.moveTo(boxX - 8 / zoom, y);
            ctx.lineTo(boxX - 8 / zoom + al, y - 2.5 / zoom);
            ctx.lineTo(boxX - 8 / zoom + al, y + 2.5 / zoom);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(boxX + boxW + 8 / zoom, y);
            ctx.lineTo(boxX + boxW + 8 / zoom - al, y - 2.5 / zoom);
            ctx.lineTo(boxX + boxW + 8 / zoom - al, y + 2.5 / zoom);
            ctx.closePath();
            ctx.fill();
            // Equal spacing ticks + gap badges
            if (coords.length >= 3) {
              const sortedX = coords.map((c) => c.x).sort((a, b) => a - b);
              const start = n.x + sortedX[0]!;
              const end = n.x + sortedX[sortedX.length - 1]!;
              const gap = (end - start) / (sortedX.length - 1);
              drawEqualGapTicks(ctx, "h", start, y - 1, end - start, 2, coords.length, zoom);
              if (gap > 0.5) {
                drawGapBadges(ctx, "h", start, y - 1, end - start, 2, coords.length, zoom, formatDistributeGap(gap));
              }
            }
          } else if (distHover === "v") {
            const x = cx;
            drawPhosphorGuideLine(ctx, x, boxY - 8 / zoom, x, boxY + boxH + 8 / zoom, zoom);
            const al = 7 / zoom;
            ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
            ctx.beginPath();
            ctx.moveTo(x, boxY - 8 / zoom);
            ctx.lineTo(x - 2.5 / zoom, boxY - 8 / zoom + al);
            ctx.lineTo(x + 2.5 / zoom, boxY - 8 / zoom + al);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x, boxY + boxH + 8 / zoom);
            ctx.lineTo(x - 2.5 / zoom, boxY + boxH + 8 / zoom - al);
            ctx.lineTo(x + 2.5 / zoom, boxY + boxH + 8 / zoom - al);
            ctx.closePath();
            ctx.fill();
            // Equal spacing ticks + gap badges
            if (coords.length >= 3) {
              const sortedY = coords.map((c) => c.y).sort((a, b) => a - b);
              const start = n.y + sortedY[0]!;
              const end = n.y + sortedY[sortedY.length - 1]!;
              const gap = (end - start) / (sortedY.length - 1);
              drawEqualGapTicks(ctx, "v", x - 1, start, 2, end - start, coords.length, zoom);
              if (gap > 0.5) {
                drawGapBadges(ctx, "v", x - 1, start, 2, end - start, coords.length, zoom, formatDistributeGap(gap));
              }
            }
          }
          if (flipHover === "x" || flipHover === "xy") {
            ctx.beginPath();
            ctx.moveTo(cx, boxY - 10 / zoom);
            ctx.lineTo(cx, boxY + boxH + 10 / zoom);
            ctx.stroke();
          }
          if (flipHover === "y" || flipHover === "xy") {
            ctx.beginPath();
            ctx.moveTo(boxX - 10 / zoom, cy);
            ctx.lineTo(boxX + boxW + 10 / zoom, cy);
            ctx.stroke();
          }
          if (flipHover === "xy") {
            ctx.setLineDash([]);
            const xl = 6 / zoom;
            ctx.beginPath();
            ctx.moveTo(cx - xl, cy - xl);
            ctx.lineTo(cx + xl, cy + xl);
            ctx.moveTo(cx + xl, cy - xl);
            ctx.lineTo(cx - xl, cy + xl);
            ctx.stroke();
          }
          if (alignHover) {
            // Ghost edge guide for align — soft outer dual phosphor rings matching tip / chip ghosts
            const al = 7 / zoom;
            if (alignHover === "left") {
              const x = boxX;
              drawPhosphorGuideLine(ctx, x, boxY - 10 / zoom, x, boxY + boxH + 10 / zoom, zoom);
              // inward arrows (pointing right)
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(x, cy);
              ctx.lineTo(x + al, cy - 2.5 / zoom);
              ctx.lineTo(x + al, cy + 2.5 / zoom);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "right") {
              const x = boxX + boxW;
              drawPhosphorGuideLine(ctx, x, boxY - 10 / zoom, x, boxY + boxH + 10 / zoom, zoom);
              // inward arrows (pointing left)
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(x, cy);
              ctx.lineTo(x - al, cy - 2.5 / zoom);
              ctx.lineTo(x - al, cy + 2.5 / zoom);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "center") {
              const x = boxX + boxW / 2;
              drawPhosphorGuideLine(ctx, x, boxY - 10 / zoom, x, boxY + boxH + 10 / zoom, zoom);
              // inward arrows from both sides
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(x - al, cy);
              ctx.lineTo(x, cy - 2.5 / zoom);
              ctx.lineTo(x, cy + 2.5 / zoom);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(x + al, cy);
              ctx.lineTo(x, cy - 2.5 / zoom);
              ctx.lineTo(x, cy + 2.5 / zoom);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "top") {
              const y = boxY;
              drawPhosphorGuideLine(ctx, boxX - 10 / zoom, y, boxX + boxW + 10 / zoom, y, zoom);
              // inward arrows (pointing down)
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(cx, y);
              ctx.lineTo(cx - 2.5 / zoom, y + al);
              ctx.lineTo(cx + 2.5 / zoom, y + al);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "bottom") {
              const y = boxY + boxH;
              drawPhosphorGuideLine(ctx, boxX - 10 / zoom, y, boxX + boxW + 10 / zoom, y, zoom);
              // inward arrows (pointing up)
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(cx, y);
              ctx.lineTo(cx - 2.5 / zoom, y - al);
              ctx.lineTo(cx + 2.5 / zoom, y - al);
              ctx.closePath();
              ctx.fill();
            } else if (alignHover === "middle") {
              const y = boxY + boxH / 2;
              drawPhosphorGuideLine(ctx, boxX - 10 / zoom, y, boxX + boxW + 10 / zoom, y, zoom);
              // inward arrows from both sides
              ctx.fillStyle = "rgba(63, 198, 255, 0.12)";
              ctx.beginPath();
              ctx.moveTo(cx, y - al);
              ctx.lineTo(cx - 2.5 / zoom, y);
              ctx.lineTo(cx + 2.5 / zoom, y);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(cx, y + al);
              ctx.lineTo(cx - 2.5 / zoom, y);
              ctx.lineTo(cx + 2.5 / zoom, y);
              ctx.closePath();
              ctx.fill();
            }
          }
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }

      if (knifeStroke) drawKnifeStroke(ctx, knifeStroke, doc, viewport, dpr);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [doc, selection, viewport, pathEditHit, pathPointSelection, marquee, knifeStroke, scaleFlip, pathPointAlignPreview, pathPointNumericPreview, pathPointHandleNumericPreview, showTangentLengths, rotateAngle, lengthHover, rotateHover, scaleHover, distHover, flipHover, alignHover, distributePreview, flushPulse, flushPulseLag, flushPulseRotate, flushPulseSlow, flushPulseTrail, opacityScrubId, axisScrubTag, axisHoverTag, filterHoverKey, typeHoverKey, cropHoverKey, radiusScrubId, shadowBlurScrubId, rotationScrubId, shadowOxScrubId, shadowOyScrubId, shadowSpreadScrubId, strokeWidthScrubId, strokeDashScrubId, strokeDashOffsetScrubId, miterLimitScrubId, gradientAngleScrubId, radialR0ScrubId, radialCentreScrubId, radialFocalScrubId, sidesScrubId, headScaleScrubId, pathDashHoverKey, gradientHoverKey, gradientHoverStop, strokeGhost]);

  function onDoubleClick(e: React.MouseEvent) {
    if (!doc) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const docPt = { x: (sx - viewport.x) / viewport.zoom, y: (sy - viewport.y) / viewport.zoom };
    const selected = doc.nodes.filter((n) => selection.includes(n.id) && n.visible);
    if (selected.length === 0) return;

    // Linear gradient stops
    const linears = selected.filter((n) => typeof n.fill === "object" && n.fill != null && n.fill.type === "linear");
    if (linears.length === selected.length && linears.length > 0) {
      const fillStr = JSON.stringify(linears[0]!.fill);
      if (linears.every((n) => JSON.stringify(n.fill) === fillStr)) {
        // Prefer existing stop circles for color pick
        for (const n of linears.slice().reverse()) {
          const sw = linearStopWorld(n, viewport.zoom);
          if (!sw) continue;
          const hitR = 7 / viewport.zoom;
          for (let i = 0; i < sw.stops.length; i++) {
            const st = sw.stops[i]!;
            const ddx = docPt.x - st.x;
            const ddy = docPt.y - st.y;
            if (ddx * ddx + ddy * ddy < hitR * hitR) {
              setStopColorTarget({
                id: n.id,
                stopIndex: i,
                color: st.color,
                sx,
                sy,
              });
              setStudioStatus(`Stop ${i + 1} colour`);
              return;
            }
          }
        }
        for (const n of linears.slice().reverse()) {
          const sw = linearStopWorld(n, viewport.zoom);
          if (!sw) continue;
          const h = sw.h;
          const dx = h.ex - h.cx;
          const dy = h.ey - h.cy;
          const len2 = dx * dx + dy * dy;
          if (len2 < 1e-6) continue;
          const px = docPt.x - h.cx;
          const py = docPt.y - h.cy;
          const t = Math.max(-1, Math.min(1, (px * dx + py * dy) / len2));
          const projX = h.cx + t * dx;
          const projY = h.cy + t * dy;
          const dist = Math.hypot(docPt.x - projX, docPt.y - projY);
          if (dist < 8 / viewport.zoom) {
            let offset = 0.5 + t * 0.5;
            offset = Math.max(0, Math.min(1, offset));
            let nearest = (n.fill as any).stops[0];
            let best = 1;
            for (const s of (n.fill as any).stops) {
              const d = Math.abs(s.offset - offset);
              if (d < best) { best = d; nearest = s; }
            }
            const newStops = sortedStops([...(n.fill as any).stops, { offset, color: nearest.color }]);
            const ids = selection.length > 1 ? selection : [n.id];
            useDesign.getState().updateNodes(ids, { fill: { ...(n.fill as any), stops: newStops } }, true);
            setStudioStatus(`Added stop at ${Math.round(offset * 100)}%`);
            return;
          }
        }
      }
    }

    // Radial gradient stops
    const radials = selected.filter((n) => typeof n.fill === "object" && n.fill != null && n.fill.type === "radial");
    if (radials.length === selected.length && radials.length > 0) {
      const fillStr = JSON.stringify(radials[0]!.fill);
      if (radials.every((n) => JSON.stringify(n.fill) === fillStr)) {
        // Prefer existing stop circles for color pick
        for (const n of radials.slice().reverse()) {
          const sw = radialStopWorld(n, viewport.zoom);
          if (!sw) continue;
          const hitR = 7 / viewport.zoom;
          for (let i = 0; i < sw.stops.length; i++) {
            const st = sw.stops[i]!;
            const ddx = docPt.x - st.x;
            const ddy = docPt.y - st.y;
            if (ddx * ddx + ddy * ddy < hitR * hitR) {
              setStopColorTarget({
                id: n.id,
                stopIndex: i,
                color: st.color,
                sx,
                sy,
              });
              setStudioStatus(`Stop ${i + 1} colour`);
              return;
            }
          }
        }
        // Double-click near the radial ray to add a stop
        for (const n of radials.slice().reverse()) {
          const sw = radialStopWorld(n, viewport.zoom);
          if (!sw) continue;
          const px = docPt.x - sw.focal.x;
          const py = docPt.y - sw.focal.y;
          const t = px * sw.ux + py * sw.uy;
          const projX = sw.focal.x + sw.ux * t;
          const projY = sw.focal.y + sw.uy * t;
          const dist = Math.hypot(docPt.x - projX, docPt.y - projY);
          const span = Math.max(1e-3, sw.outer - sw.innerR);
          const offset = Math.max(0, Math.min(1, (t - sw.innerR) / span));
          if (dist < 8 / viewport.zoom && t >= sw.innerR - 4 / viewport.zoom && t <= sw.outer + 4 / viewport.zoom) {
            let nearest = (n.fill as any).stops[0];
            let best = 1;
            for (const s of (n.fill as any).stops) {
              const d = Math.abs(s.offset - offset);
              if (d < best) { best = d; nearest = s; }
            }
            const newStops = sortedStops([...(n.fill as any).stops, { offset, color: nearest.color }]);
            const ids = selection.length > 1 ? selection : [n.id];
            useDesign.getState().updateNodes(ids, { fill: { ...(n.fill as any), stops: newStops } }, true);
            setStudioStatus(`Added stop at ${Math.round(offset * 100)}%`);
            return;
          }
        }
      }
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!doc || e.button > 1) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const docPt = screenToDoc(sx, sy, viewport);

    if (tool === "hand" || e.button === 1 || (e.button === 0 && e.altKey && tool === "select")) {
      drag.current = { type: "pan", startX: sx, startY: sy, vx: viewport.x, vy: viewport.y };
      return;
    }

    // Eyedropper: sample rendered canvas colour onto selected fill (Shift: stroke)
    if (tool === "eyedropper" && e.button === 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const px = Math.floor(sx * dpr);
      const py = Math.floor(sy * dpr);
      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) {
        setStudioStatus("Eyedropper: outside canvas");
        return;
      }
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      const r = pixel[0] ?? 0;
      const g = pixel[1] ?? 0;
      const b = pixel[2] ?? 0;
      const a = pixel[3] ?? 0;
      if (a < 16) {
        setStudioStatus("Eyedropper: transparent");
        return;
      }
      const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      rememberColor(hex);
      const alphaPct = Math.round((a / 255) * 100);
      const alphaNote = alphaPct < 100 ? ` · ${alphaPct}%` : "";
      const state = useDesign.getState();
      const sel = state.selection;
      if (sel.length) {
        if (e.shiftKey) {
          const first = state.doc?.nodes.find((n) => n.id === sel[0]);
          const sw = Math.max(first?.strokeWidth ?? 1, 1);
          state.updateNodes(sel, { stroke: hex, strokeWidth: sw }, true);
          holdStudioStatus(`Eyedropper → stroke ${hex}${alphaNote}`);
        } else {
          state.updateNodes(sel, { fill: hex }, true);
          holdStudioStatus(`Eyedropper → fill ${hex}${alphaNote}`);
        }
      } else {
        holdStudioStatus(`Eyedropper sampled ${hex}${alphaNote}`);
      }
      state.setTool("select");
      return;
    }

    // Pen tool: continue path / close / start
    if (tool === "pen" && e.button === 0) {
      const sel = selection[0] ? doc.nodes.find((n) => n.id === selection[0]) : null;
      if (sel && isPath(sel) && !sel.closed && sel.points.length >= 1) {
        const first = sel.points[0]!;
        const fx = sel.x + first.x;
        const fy = sel.y + first.y;
        if (sel.points.length >= 3 && nearPenClose(docPt.x, docPt.y, fx, fy, viewport.zoom)) {
          commit();
          replaceNode(sel.id, closePathWithCubic(sel), false);
          setPathEditHit({ index: 0, arm: "anchor" });
          setStudioStatus("Path closed");
          setTool("select");
          return;
        }
        if (joinSelectedPathToNearest(docPt.x, docPt.y, viewport.zoom)) {
          setStudioStatus("Paths joined");
          return;
        }
      }
      const id = appendPenPoint(docPt.x, docPt.y);
      if (id) {
        const n = useDesign.getState().doc?.nodes.find((x) => x.id === id);
        if (n && isPath(n)) {
          setPathEditHit({ index: n.points.length - 1, arm: "anchor" });
          setStudioStatus(`Point ${n.points.length}`);
        }
      }
      return;
    }

    // Knife tool: live stroke cut
    if (tool === "knife" && e.button === 0) {
      drag.current = { type: "knife", startX: docPt.x, startY: docPt.y };
      setKnifeStroke({ ax: docPt.x, ay: docPt.y, bx: docPt.x, by: docPt.y });
      setKnifeHover(null);
      setStudioStatus("Knife · drag to cut");
      return;
    }

    if (tool === "select") {
      const selected = doc.nodes.filter((n) => selection.includes(n.id));

      // Path points group rotation handle (when 2+ points selected on a single path)
      if (selection.length === 1 && pathPointSelection.length > 1) {
        const n = selected[0];
        if (n && isPath(n)) {
          const coords: { x: number; y: number }[] = [];
          for (const sel of pathPointSelection) {
            const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
            const pt = ring?.[sel.index];
            if (pt) coords.push({ x: pt.x, y: pt.y });
          }
          if (coords.length > 1) {
            const xs = coords.map((c) => c.x);
            const ys = coords.map((c) => c.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const lcx = (minX + maxX) / 2;
            const lcy = (minY + maxY) / 2;
            // Handle in local: top center of bbox, offset up
            const pad = 6 / viewport.zoom;
            const handleLocalX = n.x + lcx;
            const handleLocalY = n.y + minY - pad - 28 / viewport.zoom;
            // Convert to world (apply node rotation around node center)
            const nc = nodeCenter(n);
            const worldHandle = n.rotation
              ? rotatePoint(handleLocalX, handleLocalY, nc.x, nc.y, n.rotation)
              : { x: handleLocalX, y: handleLocalY };
            const worldCenter = n.rotation
              ? rotatePoint(n.x + lcx, n.y + lcy, nc.x, nc.y, n.rotation)
              : { x: n.x + lcx, y: n.y + lcy };
            const dist = Math.hypot(docPt.x - worldHandle.x, docPt.y - worldHandle.y);
            const hitR = 18 / viewport.zoom;
            if (dist <= hitR + 4 / viewport.zoom) {
              const ang = Math.atan2(docPt.y - worldCenter.y, docPt.x - worldCenter.x);
              drag.current = {
                type: "path-points-rotate",
                id: n.id,
                startAngle: ang,
                cx: worldCenter.x,
                cy: worldCenter.y,
                basePoints: n.points.map((p) => ({ ...p, in: p.in ? { ...p.in } : p.in, out: p.out ? { ...p.out } : p.out })),
                baseHoles: n.holes?.map((ring) => ring.map((p) => ({ ...p, in: p.in ? { ...p.in } : p.in, out: p.out ? { ...p.out } : p.out }))),
              };
              commit();
              setStudioStatus("Rotate path points");
              setRotateAngle(0);
              setRotateHover(null);
              return;
            }

            // Scale handles on the group bounding box (local space after node rotation)
            const box = {
              x: n.x + minX - pad,
              y: n.y + minY - pad,
              w: maxX - minX + pad * 2,
              h: maxY - minY + pad * 2,
            };
            // Transform docPt into the node's local frame (undo rotation)
            const localPt = n.rotation
              ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation)
              : docPt;
            const scaleHit = hitResizeHandle(box, localPt.x, localPt.y, viewport.zoom);
            if (scaleHit) {
              drag.current = {
                type: "path-points-scale",
                id: n.id,
                handle: scaleHit,
                basePoints: n.points.map((p) => ({ ...p, in: p.in ? { ...p.in } : p.in, out: p.out ? { ...p.out } : p.out })),
                baseHoles: n.holes?.map((ring) => ring.map((p) => ({ ...p, in: p.in ? { ...p.in } : p.in, out: p.out ? { ...p.out } : p.out }))),
              };
              commit();
              setStudioStatus("Scale path points");
              setScaleHover(null);
              return;
            }

            // Alignment handles (outward mid-edge circles + center/middle further out)
            const alignOff = 16 / viewport.zoom;
            const centerOff = 24 / viewport.zoom;
            const alignHitR = 14 / viewport.zoom;
            const alignHandles: { x: number; y: number; edge: AlignEdge }[] = [
              { x: box.x - alignOff, y: box.y + box.h / 2, edge: "left" },
              { x: box.x + box.w + alignOff, y: box.y + box.h / 2, edge: "right" },
              { x: box.x + box.w / 2, y: box.y - alignOff, edge: "top" },
              { x: box.x + box.w / 2, y: box.y + box.h + alignOff, edge: "bottom" },
              { x: box.x - centerOff, y: box.y + box.h / 2, edge: "center" },
              { x: box.x + box.w + centerOff, y: box.y + box.h / 2, edge: "center" },
              { x: box.x + box.w / 2, y: box.y - centerOff, edge: "middle" },
              { x: box.x + box.w / 2, y: box.y + box.h + centerOff, edge: "middle" },
            ];
            for (const ah of alignHandles) {
              const d = Math.hypot(localPt.x - ah.x, localPt.y - ah.y);
              if (d <= alignHitR) {
                previewAlignSelectedPathPoints(ah.edge);
                drag.current = { type: "path-points-align", id: n.id, edge: ah.edge };
                setStudioStatus(`Align ${ah.edge} · drag to snap`);
                return;
              }
            }

            // Distribute handles (further out, 3+ points)
            if (pathPointSelection.length >= 3) {
              const distOff = 32 / viewport.zoom;
              const distHitR = 14 / viewport.zoom;
              const distHandles: { x: number; y: number; axis: "h" | "v" }[] = [
                { x: box.x - distOff, y: box.y + box.h / 2, axis: "h" },
                { x: box.x + box.w + distOff, y: box.y + box.h / 2, axis: "h" },
                { x: box.x + box.w / 2, y: box.y - distOff, axis: "v" },
                { x: box.x + box.w / 2, y: box.y + box.h + distOff, axis: "v" },
              ];
              for (const dh of distHandles) {
                const d = Math.hypot(localPt.x - dh.x, localPt.y - dh.y);
                if (d <= distHitR) {
                  const sorted = coords.slice().sort((a, b) => (dh.axis === "h" ? a.x - b.x : a.y - b.y));
                  const first = sorted[0]!;
                  const last = sorted[sorted.length - 1]!;
                  const start = dh.axis === "h" ? first.x : first.y;
                  const end = dh.axis === "h" ? last.x : last.y;
                  const center = (start + end) / 2;
                  const count = sorted.length;
                  const initialGap = count > 1 ? (end - start) / (count - 1) : 0;
                  previewDistributeWithGap(dh.axis, initialGap);
                  drag.current = { type: "path-points-dist", id: n.id, axis: dh.axis, center, count, initialGap };
                  setDistCursorLabel({ x: docPt.x, y: docPt.y, gap: Math.max(0, initialGap), axis: dh.axis });
                  setStudioStatus(`Gap ${formatDistributeGap(initialGap)} · drag to snap`);
                  setDistHover(null);
                  setFlipHover(null);
                  setAlignHover(null);
                  return;
                }
              }
            }

            // Flip handles (further out): H on left/right, V on top/bottom, XY on corners
            const flipOff = 48 / viewport.zoom;
            const flipHitR = 14 / viewport.zoom;
            const flipHandles: { x: number; y: number; axis: "x" | "y" | "xy" }[] = [
              { x: box.x - flipOff, y: box.y + box.h / 2, axis: "x" },
              { x: box.x + box.w + flipOff, y: box.y + box.h / 2, axis: "x" },
              { x: box.x + box.w / 2, y: box.y - flipOff, axis: "y" },
              { x: box.x + box.w / 2, y: box.y + box.h + flipOff, axis: "y" },
              { x: box.x - flipOff, y: box.y - flipOff, axis: "xy" },
              { x: box.x + box.w + flipOff, y: box.y - flipOff, axis: "xy" },
              { x: box.x - flipOff, y: box.y + box.h + flipOff, axis: "xy" },
              { x: box.x + box.w + flipOff, y: box.y + box.h + flipOff, axis: "xy" },
            ];
            for (const fh of flipHandles) {
              const d = Math.hypot(localPt.x - fh.x, localPt.y - fh.y);
              if (d <= flipHitR) {
                previewFlipSelectedPathPoints(fh.axis);
                drag.current = { type: "path-points-flip", id: n.id, axis: fh.axis };
                setStudioStatus(`Flip ${fh.axis.toUpperCase()} · drag to apply`);
                setDistHover(null);
                setFlipHover(null);
                setAlignHover(null);
                return;
              }
            }
          }
        }
      }

      // Layer distribute handles (3+ selected layers, no path points)
      if (selection.length >= 3 && pathPointSelection.length === 0) {
        const roots = doc.nodes.filter((n) => selection.includes(n.id) && !n.locked && n.visible);
        if (roots.length >= 3) {
          const boxes = roots.map((n) => ({ n, box: { x: n.x, y: n.y, w: n.w, h: n.h } }));
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const { box } of boxes) {
            minX = Math.min(minX, box.x);
            minY = Math.min(minY, box.y);
            maxX = Math.max(maxX, box.x + box.w);
            maxY = Math.max(maxY, box.y + box.h);
          }
          const ux = minX, uy = minY, uw = maxX - minX, uh = maxY - minY;
          const distOff = 36 / viewport.zoom;
          const distHitR = 16 / viewport.zoom;
          const distHandles: { x: number; y: number; axis: "h" | "v" }[] = [
            { x: ux - distOff, y: uy + uh / 2, axis: "h" },
            { x: ux + uw + distOff, y: uy + uh / 2, axis: "h" },
            { x: ux + uw / 2, y: uy - distOff, axis: "v" },
            { x: ux + uw / 2, y: uy + uh + distOff, axis: "v" },
          ];
          for (const dh of distHandles) {
            const d = Math.hypot(docPt.x - dh.x, docPt.y - dh.y);
            if (d <= distHitR) {
              const axis = dh.axis;
              const sorted = boxes.slice().sort((a, b) => (axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y));
              const first = sorted[0]!.box;
              const last = sorted[sorted.length - 1]!.box;
              const start0 = axis === "h" ? first.x : first.y;
              const end0 = axis === "h" ? last.x + last.w : last.y + last.h;
              const center = (start0 + end0) / 2;
              const total = sorted.reduce((s, item) => s + (axis === "h" ? item.box.w : item.box.h), 0);
              const initialGap = sorted.length > 1 ? ((end0 - start0) - total) / (sorted.length - 1) : 0;
              setLiveDistributePreview(axis, Math.max(0, initialGap));
              drag.current = { type: "layer-dist", axis, center, count: sorted.length, total };
              setDistCursorLabel({ x: docPt.x, y: docPt.y, gap: Math.max(0, initialGap), axis });
              setStudioStatus(`Gap ${formatDistributeGap(Math.max(0, initialGap))} · drag to snap`);
              return;
            }
          }
        }
      }

      // On-canvas length label drag (when Len mode / showTangentLengths)
      if (showTangentLengths && pathEditHit) {
        for (const n of selected) {
          if (!isPath(n) || !n.points.length) continue;
          const labelHit = hitPathLengthLabel(n, docPt.x, docPt.y, viewport.zoom, pathEditHit);
          if (
            labelHit &&
            labelHit.index === pathEditHit.index &&
            (labelHit.hole ?? undefined) === (pathEditHit.hole ?? undefined)
          ) {
            const ring = labelHit.hole == null ? n.points : (n.holes?.[labelHit.hole] ?? []);
            const pt = ring[labelHit.index];
            const h = labelHit.arm === "in" ? pt?.in : pt?.out;
            if (h && (Math.abs(h.x) > 0.2 || Math.abs(h.y) > 0.2)) {
              drag.current = {
                type: "path-handle-length",
                id: n.id,
                index: labelHit.index,
                arm: labelHit.arm,
                hole: labelHit.hole,
                baseVec: { x: h.x, y: h.y },
                started: false,
              };
              setStudioStatus(`Length ${labelHit.arm} · ${labelHit.length}`);
              return;
            }
          }
        }
      }

      // Path point / handle hit on selected path first
      for (const n of selected) {
        if (!isPath(n) || !n.points.length) continue;
        const hit = hitPathNode(n, docPt.x, docPt.y, viewport.zoom);
        if (hit) {
          if (e.shiftKey && hit.arm === "anchor") {
            togglePathPointSelection(hit.index, hit.hole);
            setStudioStatus(`Path points · ${useDesign.getState().pathPointSelection.length} selected`);
          } else {
            setPathEditHit(hit);
            if (hit.arm === "anchor") {
              setPathPointSelection([{ index: hit.index, hole: hit.hole }]);
            } else {
              setPathPointSelection([]);
            }
            const arm = hit.arm === "anchor" ? "anchor" : hit.arm;
            setStudioStatus(`Path ${arm}${hit.hole != null ? ` · hole ${hit.hole + 1}` : ""}`);
          }
          drag.current = {
            type: "path-point",
            id: n.id,
            hit,
            keepSmooth: !e.altKey,
            started: false,
          };
          return;
        }
      }

      // Crop handles on single selected bitmap take priority over regular resize
      if (selected.length === 1) {
        const n = selected[0];
        if (n && isBitmap(n)) {
          const ch = hitCropHandle(n, docPt.x, docPt.y, viewport.zoom);
          if (ch) {
            const source = sourceBoxFor(n);
            drag.current = {
              type: "crop",
              id: n.id,
              handle: ch,
              startX: docPt.x,
              startY: docPt.y,
              orig: { ...n },
              source,
            };
            setStudioStatus(`Crop ${ch} · Shift locks aspect`);
            return;
          }
        }
      }

      // On-canvas linear gradient angle handle (uniform selection, single or mixed)
      {
        const linears = selected.filter(
          (n) => n && typeof n.fill === "object" && n.fill != null && n.fill.type === "linear",
        );
        if (linears.length === selected.length && linears.length > 0) {
          const fillStr = JSON.stringify(linears[0]!.fill);
          const uniform = linears.every((n) => JSON.stringify(n.fill) === fillStr);
          if (uniform) {
            // Prefer topmost first
            for (const n of linears.slice().reverse()) {
              const handle = gradientAngleHandle(n, viewport.zoom);
              if (handle) {
                const dx = docPt.x - handle.ex;
                const dy = docPt.y - handle.ey;
                const hitR = 10 / viewport.zoom;
                if (dx * dx + dy * dy < hitR * hitR) {
                  const fill = n.fill as { angle?: number; llen?: number };
                  drag.current = {
                    type: "gradient-angle",
                    id: n.id,
                    cx: handle.cx,
                    cy: handle.cy,
                    origAngle: fill.angle ?? 0,
                    origLlen: fill.llen ?? 1,
                  };
                  useDesign.getState().setGradientAngleScrubId(n.id);
                  const modeKey = e.altKey ? "angle-only" : (e.ctrlKey || e.metaKey) ? "length-only" : "length";
                  useDesign.getState().setGradientHoverKey(modeKey);
                  const ang = Math.round(fill.angle ?? 0);
                  setStudioStatus(e.altKey ? `Angle only · ${ang}°` : (e.ctrlKey || e.metaKey) ? `Length only` : `Gradient · ${ang}°`);
                  return;
                }
                // Centre offset handle
                const cdx = docPt.x - handle.cx;
                const cdy = docPt.y - handle.cy;
                const cHitR = 8 / viewport.zoom;
                if (cdx * cdx + cdy * cdy < cHitR * cHitR) {
                  drag.current = { type: "gradient-linear-offset", id: n.id };
                  useDesign.getState().setGradientAngleScrubId(n.id); // reuse for chip
                  useDesign.getState().setGradientHoverKey("offset");
                  setStudioStatus(`Gradient offset`);
                  return;
                }
                // Stop handles (multi-stop on-canvas)
                const sw = linearStopWorld(n, viewport.zoom);
                if (sw) {
                  const stopHitR = 7 / viewport.zoom;
                  for (let i = 0; i < sw.stops.length; i++) {
                    const st = sw.stops[i]!;
                    const sdx = docPt.x - st.x;
                    const sdy = docPt.y - st.y;
                    if (sdx * sdx + sdy * sdy < stopHitR * stopHitR) {
                      if (e.altKey && sw.stops.length > 2) {
                        const newStops = (n.fill as any).stops.filter((_: any, j: number) => j !== i);
                        const ids = selection.length > 1 ? selection : [n.id];
                        useDesign.getState().updateNodes(ids, { fill: { ...(n.fill as any), stops: newStops } }, true);
                        setStudioStatus(`Removed stop · ${newStops.length} left`);
                        return;
                      }
                      drag.current = { type: "gradient-stop", id: n.id, stopIndex: i, origOffset: st.offset };
                      useDesign.getState().setGradientAngleScrubId(n.id);
                      setStudioStatus(`Stop ${Math.round(st.offset * 100)}%`);
                      return;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // On-canvas radial gradient r0 + focal + centre handles (uniform selection, single or mixed)
      {
        const radials = selected.filter(
          (n) => n && typeof n.fill === "object" && n.fill != null && n.fill.type === "radial",
        );
        if (radials.length === selected.length && radials.length > 0) {
          const fillStr = JSON.stringify(radials[0]!.fill);
          const uniform = radials.every((n) => JSON.stringify(n.fill) === fillStr);
          if (uniform) {
            // Prefer stop circles first (multi-stop on-canvas), then r0 / focal / centre
            for (const n of radials.slice().reverse()) {
              const sw = radialStopWorld(n, viewport.zoom);
              if (sw) {
                const stopHitR = 7 / viewport.zoom;
                for (let i = 0; i < sw.stops.length; i++) {
                  const st = sw.stops[i]!;
                  const sdx = docPt.x - st.x;
                  const sdy = docPt.y - st.y;
                  if (sdx * sdx + sdy * sdy < stopHitR * stopHitR) {
                    if (e.altKey && sw.stops.length > 2) {
                      const newStops = (n.fill as any).stops.filter((_: any, j: number) => j !== i);
                      const ids = selection.length > 1 ? selection : [n.id];
                      useDesign.getState().updateNodes(ids, { fill: { ...(n.fill as any), stops: newStops } }, true);
                      setStudioStatus(`Removed stop · ${newStops.length} left`);
                      return;
                    }
                    drag.current = { type: "gradient-stop", id: n.id, stopIndex: i, origOffset: st.offset };
                    useDesign.getState().setGradientAngleScrubId(n.id);
                    setStudioStatus(`Stop ${Math.round(st.offset * 100)}%`);
                    return;
                  }
                }
              }
            }
            // Prefer r0, then focal, then centre; check topmost first
            for (const n of radials.slice().reverse()) {
              const r0h = radialR0Handle(n, viewport.zoom);
              if (r0h) {
                const dx = docPt.x - r0h.x;
                const dy = docPt.y - r0h.y;
                const hitR = 11 / viewport.zoom;
                if (dx * dx + dy * dy < hitR * hitR) {
                  drag.current = { type: "gradient-radial-r0", id: n.id };
                  useDesign.getState().setRadialR0ScrubId(n.id);
                  useDesign.getState().setGradientHoverKey("r0");
                  setStudioStatus(`Radial inner radius ${(r0h.r0 * 100).toFixed(0)}%`);
                  return;
                }
              }
              const focal = radialFocal(n);
              if (focal) {
                const dx = docPt.x - focal.x;
                const dy = docPt.y - focal.y;
                const hitR = 9 / viewport.zoom;
                if (dx * dx + dy * dy < hitR * hitR) {
                  drag.current = { type: "gradient-radial-focal", id: n.id };
                  useDesign.getState().setRadialFocalScrubId(n.id);
                  useDesign.getState().setGradientHoverKey("focal");
                  const fx = n.fill.fx ?? n.fill.cx ?? 0.5;
                  const fy = n.fill.fy ?? n.fill.cy ?? 0.5;
                  setStudioStatus(`Radial focal ${(fx * 100).toFixed(0)}%, ${(fy * 100).toFixed(0)}%`);
                  return;
                }
              }
              const centre = radialCentre(n);
              if (centre) {
                const dx = docPt.x - centre.x;
                const dy = docPt.y - centre.y;
                const hitR = 12 / viewport.zoom;
                if (dx * dx + dy * dy < hitR * hitR) {
                  drag.current = { type: "gradient-radial", id: n.id };
                  useDesign.getState().setRadialCentreScrubId(n.id);
                  useDesign.getState().setGradientHoverKey("centre");
                  setStudioStatus(
                    `Radial centre ${((n.fill.cx ?? 0.5) * 100).toFixed(0)}%, ${((n.fill.cy ?? 0.5) * 100).toFixed(0)}%`,
                  );
                  return;
                }
              }
            }
          }
        }
      }

      let hitH: { node: DesignNode; handle: Handle } | null = null;
      for (const n of selected) {
        const h = hitHandle(n, docPt.x, docPt.y, viewport.zoom);
        if (h) {
          hitH = { node: n, handle: h };
          break;
        }
      }
      if (hitH) {
        const n = hitH.node;
        if (hitH.handle === "rotate") {
          const c = nodeCenter(n);
          const ang = Math.atan2(docPt.y - c.y, docPt.x - c.x);
          drag.current = { type: "rotate", id: n.id, startAngle: ang, origRot: n.rotation, cx: c.x, cy: c.y };
          setStudioStatus(`Rotate ${Math.round(n.rotation)}°`);
        } else if (hitH.handle === "move") {
          drag.current = { type: "move", id: n.id, startX: docPt.x, startY: docPt.y, ox: n.x, oy: n.y };
        } else {
          drag.current = {
            type: "resize",
            id: n.id,
            handle: hitH.handle,
            startX: docPt.x,
            startY: docPt.y,
            orig: { ...n },
          };
        }
        return;
      }
      const hit = hitTop(doc.nodes, docPt.x, docPt.y);
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      if (hit) {
        select([hit.id], additive);
        if (isPath(hit)) {
          const ph = hitPathNode(hit, docPt.x, docPt.y, viewport.zoom);
          setPathEditHit(ph);
        } else {
          setPathEditHit(null);
        }
        drag.current = { type: "move", id: hit.id, startX: docPt.x, startY: docPt.y, ox: hit.x, oy: hit.y };
      } else {
        // Start marquee on empty canvas (click-drag selects; pure click clears)
        drag.current = {
          type: "marquee",
          startX: docPt.x,
          startY: docPt.y,
          endX: docPt.x,
          endY: docPt.y,
          additive: e.shiftKey || e.metaKey || e.ctrlKey,
        };
        setMarquee({ x1: docPt.x, y1: docPt.y, x2: docPt.x, y2: docPt.y });
      }
      return;
    }

    // Shape / text create
    if (["rect", "ellipse", "line", "polygon", "star", "arrow", "text"].includes(tool)) {
      drag.current = { type: "create", tool, startX: docPt.x, startY: docPt.y, id: null };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!doc) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const docPt = screenToDoc(sx, sy, viewport);

    // Eyedropper live preview chip under cursor
    if (tool === "eyedropper") {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      let hex: string | null = null;
      let alpha = 0;
      if (canvas && ctx) {
        const dpr = window.devicePixelRatio || 1;
        const px = Math.floor(sx * dpr);
        const py = Math.floor(sy * dpr);
        if (px >= 0 && py >= 0 && px < canvas.width && py < canvas.height) {
          const pixel = ctx.getImageData(px, py, 1, 1).data;
          alpha = pixel[3] ?? 0;
          if (alpha >= 16) {
            const r = pixel[0] ?? 0;
            const g = pixel[1] ?? 0;
            const b = pixel[2] ?? 0;
            hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
          }
        }
      }
      setEyedropperPreview({ sx, sy, hex, alpha });
    } else if (eyedropperPreview) {
      setEyedropperPreview(null);
    }

    // On-canvas hover over linear gradient stops → emphasize chip
    if (!drag.current && tool === "select") {
      let hitStop: number | null = null;
      const selected = doc.nodes.filter((n) => selection.includes(n.id) && n.visible);
      const linears = selected.filter((n) => typeof n.fill === "object" && n.fill != null && n.fill.type === "linear");
      if (linears.length === selected.length && linears.length > 0) {
        const fillStr = JSON.stringify(linears[0]!.fill);
        if (linears.every((n) => JSON.stringify(n.fill) === fillStr)) {
          for (const n of linears.slice().reverse()) {
            const sw = linearStopWorld(n, viewport.zoom);
            if (sw) {
              const stopHitR = 8 / viewport.zoom;
              for (let i = 0; i < sw.stops.length; i++) {
                const st = sw.stops[i]!;
                const sdx = docPt.x - st.x;
                const sdy = docPt.y - st.y;
                if (sdx * sdx + sdy * sdy < stopHitR * stopHitR) {
                  hitStop = i;
                  break;
                }
              }
            }
            if (hitStop != null) break;
          }
        }
      }
      // also hover radial stops if no linear hit
      if (hitStop == null) {
        const radials = selected.filter((n) => typeof n.fill === "object" && n.fill != null && n.fill.type === "radial");
        if (radials.length === selected.length && radials.length > 0) {
          const fillStr = JSON.stringify(radials[0]!.fill);
          if (radials.every((n) => JSON.stringify(n.fill) === fillStr)) {
            for (const n of radials.slice().reverse()) {
              const sw = radialStopWorld(n, viewport.zoom);
              if (sw) {
                const stopHitR = 8 / viewport.zoom;
                for (let i = 0; i < sw.stops.length; i++) {
                  const st = sw.stops[i]!;
                  const sdx = docPt.x - st.x;
                  const sdy = docPt.y - st.y;
                  if (sdx * sdx + sdy * sdy < stopHitR * stopHitR) {
                    hitStop = i;
                    break;
                  }
                }
              }
              if (hitStop != null) break;
            }
          }
        }
      }
      if (hitStop !== useDesign.getState().gradientHoverStop) {
        useDesign.getState().setGradientHoverStop(hitStop);
      }
    } else if (useDesign.getState().gradientHoverStop != null) {
      useDesign.getState().setGradientHoverStop(null);
    }

    // Knife hover preview (point cut) when not dragging
    if (tool === "knife" && !drag.current) {
      let best: { x: number; y: number; dist: number } | null = null;
      const preferred = selection[0];
      const paths: DesignNode[] = [];
      for (const n of doc.nodes) {
        if (!n.visible || n.locked) continue;
        const p = asEditablePath(n);
        if (p && p.points.length >= 2) paths.push(p);
      }
      const ordered = preferred
        ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[]
        : paths;
      for (const n of ordered) {
        const p = asEditablePath(n);
        if (!p) continue;
        const local = pathWorldToLocal(p, docPt.x, docPt.y);
        const mark = knifePreviewPoint(p, local.x, local.y, viewport.zoom);
        if (mark) {
          const d = Math.hypot(mark.x - docPt.x, mark.y - docPt.y);
          if (!best || d < best.dist) best = { x: mark.x, y: mark.y, dist: d };
        }
      }
      if (best && best.dist < 20 / viewport.zoom) {
        setKnifeHover(best);
        let pieceNote = "";
        // Compute piece count for status (same path logic as draw)
        const preferred = selection[0];
        const paths: DesignNode[] = [];
        for (const n of doc.nodes) {
          if (!n.visible || n.locked) continue;
          const p = asEditablePath(n);
          if (p && p.points.length >= 2) paths.push(p);
        }
        const ordered = preferred
          ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[]
          : paths;
        for (const n of ordered) {
          const p = asEditablePath(n);
          if (!p) continue;
          const local = pathWorldToLocal(p, best.x, best.y);
          const pieces = knifePointSplitPieces(p, local.x, local.y, viewport.zoom);
          const valid = pieces.filter((pc) => pc.length >= 2).length;
          if (valid > 1) {
            pieceNote = ` · ${valid} pieces`;
            break;
          }
        }
        setStudioStatus(`Knife · cut here${pieceNote}`);
      } else {
        setKnifeHover(null);
        setStudioStatus("Knife · drag to cut");
      }
      return;
    }


    // Length badge hover preview (Len mode) before drag
    if (showTangentLengths && !drag.current && tool === "select" && selection.length === 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
      if (n && isPath(n)) {
        const hit = hitPathNode(n, docPt.x, docPt.y, viewport.zoom);
        if (hit && (hit.arm === "in" || hit.arm === "out")) {
          const ring = hit.hole == null ? n.points : (n.holes?.[hit.hole] ?? []);
          const pt = ring[hit.index];
          const h = hit.arm === "in" ? pt?.in : pt?.out;
          if (h && (Math.abs(h.x) > 0.2 || Math.abs(h.y) > 0.2)) {
            const ax = n.x + pt.x;
            const ay = n.y + pt.y;
            const hx = ax + h.x;
            const hy = ay + h.y;
            const c = nodeCenter(n);
            const va = n.rotation ? rotatePoint(ax, ay, c.x, c.y, n.rotation) : { x: ax, y: ay };
            const vh = n.rotation ? rotatePoint(hx, hy, c.x, c.y, n.rotation) : { x: hx, y: hy };
            const dx = vh.x - va.x;
            const dy = vh.y - va.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const off = 14 / viewport.zoom;
            const lx = vh.x + ux * off;
            const ly = vh.y + uy * off;
            const length = Math.round(len);
            setLengthHover({
              nodeId: n.id,
              index: hit.index,
              arm: hit.arm,
              hole: hit.hole,
              length,
              lx,
              ly,
            });
            setStudioStatus(`Length ${hit.arm} · ${length}`);
            return;
          }
        }
      }
      if (lengthHover) setLengthHover(null);
    } else if (lengthHover) {
      setLengthHover(null);
    }

    // Rotate handle hover preview (select tool, multi path points)
    if (tool === "select" && !drag.current && selection.length === 1 && pathPointSelection.length > 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
      if (n && isPath(n)) {
        const coords: { x: number; y: number }[] = [];
        for (const sel of pathPointSelection) {
          const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
          const pt = ring?.[sel.index];
          if (pt) coords.push({ x: pt.x, y: pt.y });
        }
        if (coords.length > 1) {
          const xs = coords.map((c) => c.x);
          const ys = coords.map((c) => c.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const lcx = (minX + maxX) / 2;
          const lcy = (minY + maxY) / 2;
          const pad = 6 / viewport.zoom;
          const handleLocalX = n.x + lcx;
          const handleLocalY = n.y + minY - pad - 28 / viewport.zoom;
          const nc = nodeCenter(n);
          const worldHandle = n.rotation
            ? rotatePoint(handleLocalX, handleLocalY, nc.x, nc.y, n.rotation)
            : { x: handleLocalX, y: handleLocalY };
          const worldCenter = n.rotation
            ? rotatePoint(n.x + lcx, n.y + lcy, nc.x, nc.y, n.rotation)
            : { x: n.x + lcx, y: n.y + lcy };
          const dist = Math.hypot(docPt.x - worldHandle.x, docPt.y - worldHandle.y);
          const hitR = 18 / viewport.zoom;
          if (dist <= hitR + 4 / viewport.zoom) {
            // Radius from center to handle, or a nice visual radius
            const radius = Math.max(36 / viewport.zoom, Math.hypot(worldHandle.x - worldCenter.x, worldHandle.y - worldCenter.y) * 0.85);
            setRotateHover({ cx: worldCenter.x, cy: worldCenter.y, radius });
            setStudioStatus("Rotate path points");
          } else if (rotateHover) {
            setRotateHover(null);
          }
        } else if (rotateHover) {
          setRotateHover(null);
        }
      } else if (rotateHover) {
        setRotateHover(null);
      }
    } else if (rotateHover) {
      setRotateHover(null);
    }

    // Scale handle hover preview (select tool, multi path points)
    if (tool === "select" && !drag.current && selection.length === 1 && pathPointSelection.length > 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
      if (n && isPath(n)) {
        const coords: { x: number; y: number }[] = [];
        for (const sel of pathPointSelection) {
          const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
          const pt = ring?.[sel.index];
          if (pt) coords.push({ x: pt.x, y: pt.y });
        }
        if (coords.length > 1) {
          const xs = coords.map((c) => c.x);
          const ys = coords.map((c) => c.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const pad = 6 / viewport.zoom;
          const box = {
            x: n.x + minX - pad,
            y: n.y + minY - pad,
            w: maxX - minX + pad * 2,
            h: maxY - minY + pad * 2,
          };
          const nc = nodeCenter(n);
          const localPt = n.rotation
            ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation)
            : docPt;
          const scaleHit = hitResizeHandle(box, localPt.x, localPt.y, viewport.zoom);
          if (scaleHit) {
            setScaleHover(scaleHit);
            setStudioStatus("Scale path points");
          } else if (scaleHover) {
            setScaleHover(null);
          }
        } else if (scaleHover) {
          setScaleHover(null);
        }
      } else if (scaleHover) {
        setScaleHover(null);
      }
    } else if (scaleHover) {
      setScaleHover(null);
    }

    // Alignment handle hover preview (select tool, multi path points)
    if (tool === "select" && !drag.current && selection.length === 1 && pathPointSelection.length > 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
      if (n && isPath(n)) {
        const coords: { x: number; y: number }[] = [];
        for (const sel of pathPointSelection) {
          const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
          const pt = ring?.[sel.index];
          if (pt) coords.push({ x: pt.x, y: pt.y });
        }
        if (coords.length > 1) {
          const xs = coords.map((c) => c.x);
          const ys = coords.map((c) => c.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const pad = 6 / viewport.zoom;
          const box = {
            x: n.x + minX - pad,
            y: n.y + minY - pad,
            w: maxX - minX + pad * 2,
            h: maxY - minY + pad * 2,
          };
          const nc = nodeCenter(n);
          const localPt = n.rotation
            ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation)
            : docPt;
          const alignOff = 16 / viewport.zoom;
          const centerOff = 24 / viewport.zoom;
          const hitR = 14 / viewport.zoom;
          const alignHandles: { x: number; y: number; edge: AlignEdge }[] = [
            { x: box.x - alignOff, y: box.y + box.h / 2, edge: "left" },
            { x: box.x + box.w + alignOff, y: box.y + box.h / 2, edge: "right" },
            { x: box.x + box.w / 2, y: box.y - alignOff, edge: "top" },
            { x: box.x + box.w / 2, y: box.y + box.h + alignOff, edge: "bottom" },
            { x: box.x - centerOff, y: box.y + box.h / 2, edge: "center" },
            { x: box.x + box.w + centerOff, y: box.y + box.h / 2, edge: "center" },
            { x: box.x + box.w / 2, y: box.y - centerOff, edge: "middle" },
            { x: box.x + box.w / 2, y: box.y + box.h + centerOff, edge: "middle" },
          ];
          let hitEdge: AlignEdge | null = null;
          for (const ah of alignHandles) {
            if (Math.hypot(localPt.x - ah.x, localPt.y - ah.y) <= hitR) {
              hitEdge = ah.edge;
              break;
            }
          }
          if (hitEdge) {
            previewAlignSelectedPathPoints(hitEdge);
            setAlignHover(hitEdge);
            setDistHover(null);
            setFlipHover(null);
          } else {
            if (alignHover) setAlignHover(null);
            let handled = false;
            if (pathPointSelection.length >= 3) {
              const distOff = 32 / viewport.zoom;
              const distHitR = 14 / viewport.zoom;
              const distHandles: { x: number; y: number; axis: "h" | "v" }[] = [
                { x: box.x - distOff, y: box.y + box.h / 2, axis: "h" },
                { x: box.x + box.w + distOff, y: box.y + box.h / 2, axis: "h" },
                { x: box.x + box.w / 2, y: box.y - distOff, axis: "v" },
                { x: box.x + box.w / 2, y: box.y + box.h + distOff, axis: "v" },
              ];
              let hitAxis: "h" | "v" | null = null;
              for (const dh of distHandles) {
                if (Math.hypot(localPt.x - dh.x, localPt.y - dh.y) <= distHitR) {
                  hitAxis = dh.axis;
                  break;
                }
              }
              if (hitAxis) {
                previewDistributeSelectedPathPoints(hitAxis);
                setDistHover(hitAxis);
                setFlipHover(null);
                setAlignHover(null);
                handled = true;
              } else if (distHover) {
                setDistHover(null);
              }
            }
            if (!handled) {
              // Flip handles (further out): H on left/right, V on top/bottom, XY on corners
              const flipOff = 48 / viewport.zoom;
              const flipHitR = 14 / viewport.zoom;
              const flipHandles: { x: number; y: number; axis: "x" | "y" | "xy" }[] = [
                { x: box.x - flipOff, y: box.y + box.h / 2, axis: "x" },
                { x: box.x + box.w + flipOff, y: box.y + box.h / 2, axis: "x" },
                { x: box.x + box.w / 2, y: box.y - flipOff, axis: "y" },
                { x: box.x + box.w / 2, y: box.y + box.h + flipOff, axis: "y" },
                { x: box.x - flipOff, y: box.y - flipOff, axis: "xy" },
                { x: box.x + box.w + flipOff, y: box.y - flipOff, axis: "xy" },
                { x: box.x - flipOff, y: box.y + box.h + flipOff, axis: "xy" },
                { x: box.x + box.w + flipOff, y: box.y + box.h + flipOff, axis: "xy" },
              ];
              let hitFlip: "x" | "y" | "xy" | null = null;
              for (const fh of flipHandles) {
                if (Math.hypot(localPt.x - fh.x, localPt.y - fh.y) <= flipHitR) {
                  hitFlip = fh.axis;
                  break;
                }
              }
              if (hitFlip) {
                previewFlipSelectedPathPoints(hitFlip);
                setFlipHover(hitFlip);
                setDistHover(null);
                setAlignHover(null);
              } else {
                clearPathPointAlignPreview();
                if (flipHover) setFlipHover(null);
                if (distHover) setDistHover(null);
                if (alignHover) setAlignHover(null);
              }
            }
          }
        }
      }
    } else {
      if (distHover) setDistHover(null);
      if (flipHover) setFlipHover(null);
      if (alignHover) setAlignHover(null);
    }

    if (!drag.current) return;
    const d = drag.current;

    if (d.type === "pan") {
      setViewport({ x: d.vx + (sx - d.startX), y: d.vy + (sy - d.startY) });
      return;
    }
    if (d.type === "knife") {
      d.endX = docPt.x;
      d.endY = docPt.y;
      setKnifeStroke({ ax: d.startX, ay: d.startY, bx: docPt.x, by: docPt.y });
      const dx = docPt.x - d.startX;
      const dy = docPt.y - d.startY;
      const len = Math.hypot(dx, dy);
      const ang = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const lenStr = len < 10 ? len.toFixed(1) : Math.round(len).toString();
      const cuts = knifeCutCount(d.startX, d.startY, docPt.x, docPt.y, doc.nodes);
      const cutStr = cuts === 0 ? "miss" : cuts === 1 ? "1 cut" : `${cuts} cuts`;
      let pieces = 0;
      for (const n of doc.nodes) {
        if (!n.visible || n.locked) continue;
        const ep = asEditablePath(n);
        if (ep) pieces += knifeSplitPieces(ep, d.startX, d.startY, docPt.x, docPt.y).length;
      }
      const pieceStr = pieces > 1 ? ` · ${pieces} pieces` : "";
      setStudioStatus(`Knife · ${lenStr}px · ${Math.round(ang)}° · ${cutStr}${pieceStr}`);
      return;
    }
    if (d.type === "move") {
      const dx = docPt.x - d.startX;
      const dy = docPt.y - d.startY;
      updateNodes([d.id], { x: d.ox + dx, y: d.oy + dy }, false);
      return;
    }
    if (d.type === "resize") {
      const local = localDelta(d.orig, docPt.x - d.startX, docPt.y - d.startY);
      const patch = applyHandle(d.orig, d.handle, local.dx, local.dy);
      updateNodes([d.id], patch, false);
      return;
    }
    if (d.type === "crop") {
      const local = localDelta(d.orig, docPt.x - d.startX, docPt.y - d.startY);
      const lock = e.shiftKey && (d.handle === "nw" || d.handle === "ne" || d.handle === "se" || d.handle === "sw");
      const patch = applyCropHandle(d.orig as any, d.handle, local.dx, local.dy, d.source, lock);
      updateNodes([d.id], patch, false);
      const pctW = Math.round((patch.crop?.w ?? 1) * 100);
      const pctH = Math.round((patch.crop?.h ?? 1) * 100);
      setStudioStatus(lock ? `Crop ${d.handle} · ${pctW}%×${pctH}% · locked` : `Crop ${d.handle} · ${pctW}%×${pctH}%`);
      return;
    }
    if (d.type === "path-points-rotate") {
      const ang = Math.atan2(docPt.y - d.cy, docPt.x - d.cx);
      let deg = ((ang - d.startAngle) * 180) / Math.PI;
      deg = snap15(deg, e.shiftKey);
      rotateSelectedPathPoints(deg, d.basePoints, d.baseHoles);
      setRotateAngle(deg);
      return;
    }
    if (d.type === "path-points-align") {
      // Preview already set on down; nothing to update during drag
      return;
    }
    if (d.type === "path-points-dist") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || !isPath(n)) return;
      const nc = nodeCenter(n);
      const localPt = n.rotation
        ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation)
        : docPt;
      const mouseLocal = d.axis === "h" ? localPt.x - n.x : localPt.y - n.y;
      const halfSpan = Math.abs(mouseLocal - d.center);
      const proposedSpan = halfSpan * 2;
      const proposedGap = d.count > 1 ? proposedSpan / (d.count - 1) : 0;
      const snapped = snapGap(proposedGap, e.shiftKey);
      previewDistributeWithGap(d.axis, snapped);
      setDistCursorLabel({ x: docPt.x, y: docPt.y, gap: snapped, axis: d.axis });
      setStudioStatus(snapped <= 1.5 ? `Flush · ${formatDistributeGap(snapped)} px · drag to snap` : `Gap ${formatDistributeGap(snapped)} · drag to snap`);
      return;
    }
    if (d.type === "layer-dist") {
      const mouse = d.axis === "h" ? docPt.x : docPt.y;
      const halfSpan = Math.abs(mouse - d.center);
      const proposedSpan = halfSpan * 2;
      const proposedGap = d.count > 1 ? (proposedSpan - d.total) / (d.count - 1) : 0;
      const snapped = snapGap(Math.max(0, proposedGap), e.shiftKey);
      setLiveDistributePreview(d.axis, snapped);
      setDistCursorLabel({ x: docPt.x, y: docPt.y, gap: snapped, axis: d.axis });
      setStudioStatus(snapped <= 1.5 ? `Flush · ${formatDistributeGap(snapped)} px · drag to snap` : `Gap ${formatDistributeGap(snapped)} · drag to snap`);
      return;
    }
    if (d.type === "path-points-scale") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || !isPath(n)) return;
      const nc = nodeCenter(n);
      const localPt = n.rotation
        ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation)
        : docPt;
      // local relative to node origin for the scale function
      const mouseLocalX = localPt.x - n.x;
      const mouseLocalY = localPt.y - n.y;
      scaleSelectedPathPoints(
        d.handle,
        mouseLocalX,
        mouseLocalY,
        e.shiftKey,
        e.altKey,
        d.basePoints,
        d.baseHoles,
      );
      setScaleFlip({ x: lastPathScale.sx < 0, y: lastPathScale.sy < 0 });
      return;
    }
    if (d.type === "rotate") {
      const ang = Math.atan2(docPt.y - d.cy, docPt.x - d.cx);
      let deg = d.origRot + ((ang - d.startAngle) * 180) / Math.PI;
      deg = snap15(deg, e.shiftKey);
      updateNodes([d.id], { rotation: deg }, false);
      setStudioStatus(`Rotate ${Math.round(deg)}°`);
      return;
    }
    if (d.type === "gradient-angle") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || typeof n.fill !== "object" || n.fill?.type !== "linear") return;
      const worldAng = (Math.atan2(docPt.y - d.cy, docPt.x - d.cx) * 180) / Math.PI;
      let localAng = worldAng - n.rotation;
      localAng = ((localAng % 360) + 360) % 360;
      if (e.shiftKey) localAng = Math.round(localAng / 15) * 15;
      // Also compute length from distance
      const dist = Math.hypot(docPt.x - d.cx, docPt.y - d.cy);
      const baseLen = Math.max(Math.abs(n.w), Math.abs(n.h));
      let llen = baseLen > 0 ? dist / (baseLen * 0.42) : 1;
      llen = Math.max(0.2, Math.min(3, llen));
      if (e.shiftKey) llen = Math.round(llen * 10) / 10;
      // Modifier modes: Alt = angle only, Ctrl/Cmd = length only, else both
      let finalAng = localAng;
      let finalLen = llen;
      let focus: "angle" | "length" | "angle-only" | "length-only" | null = "length";
      if (e.altKey) {
        finalLen = d.origLlen;
        focus = "angle-only";
      } else if (e.ctrlKey || e.metaKey) {
        finalAng = d.origAngle;
        focus = "length-only";
      }
      useDesign.getState().setGradientHoverKey(focus);
      const ids = selection.length > 1 ? selection : [d.id];
      updateNodes(ids, { fill: { ...n.fill, angle: finalAng, llen: finalLen } }, false);
      const angStr = Math.round(finalAng);
      const lenStr = (finalLen * 100).toFixed(0);
      const snap = e.shiftKey ? " · Shift snap" : "";
      if (e.altKey) setStudioStatus(`Angle only ${angStr}°${snap}`);
      else if (e.ctrlKey || e.metaKey) setStudioStatus(`Length only ${lenStr}%${snap}`);
      else setStudioStatus(`Gradient ${angStr}° · ${lenStr}%${snap}`);
      return;
    }
    if (d.type === "gradient-linear-offset") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || typeof n.fill !== "object" || n.fill?.type !== "linear") return;
      const c = nodeCenter(n);
      const local = n.rotation
        ? rotatePoint(docPt.x, docPt.y, c.x, c.y, -n.rotation)
        : { x: docPt.x, y: docPt.y };
      let ox = (local.x - n.x) / n.w;
      let oy = (local.y - n.y) / n.h;
      ox = Math.max(0, Math.min(1, ox));
      oy = Math.max(0, Math.min(1, oy));
      if (e.shiftKey) {
        ox = Math.round(ox * 20) / 20;
        oy = Math.round(oy * 20) / 20;
      }
      const ids = selection.length > 1 ? selection : [d.id];
      updateNodes(ids, { fill: { ...n.fill, lox: ox, loy: oy } }, false);
      setStudioStatus(`Gradient offset ${(ox * 100).toFixed(0)}%, ${(oy * 100).toFixed(0)}%`);
      return;
    }
    if (d.type === "gradient-stop") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || typeof n.fill !== "object" || !n.fill) return;
      let offset = 0;
      if (n.fill.type === "linear") {
        const sw = linearStopWorld(n, viewport.zoom);
        if (!sw) return;
        const h = sw.h;
        const dx = h.ex - h.cx;
        const dy = h.ey - h.cy;
        const len2 = dx * dx + dy * dy;
        if (len2 < 1e-6) return;
        const px = docPt.x - h.cx;
        const py = docPt.y - h.cy;
        let tFromCenter = (px * dx + py * dy) / len2;
        offset = 0.5 + tFromCenter * 0.5;
      } else if (n.fill.type === "radial") {
        const sw = radialStopWorld(n, viewport.zoom);
        if (!sw) return;
        const px = docPt.x - sw.focal.x;
        const py = docPt.y - sw.focal.y;
        const t = px * sw.ux + py * sw.uy;
        const span = Math.max(1e-3, sw.outer - sw.innerR);
        offset = (t - sw.innerR) / span;
      } else return;
      offset = Math.max(0, Math.min(1, offset));
      if (e.shiftKey) offset = Math.round(offset * 20) / 20;
      const rawStops = (n.fill as any).stops as { offset: number; color: string }[];
      const updated = rawStops.map((s, j) =>
        j === d.stopIndex ? { ...s, offset } : s
      );
      const moved = updated[d.stopIndex]!;
      const sorted = sortedStops(updated);
      const newIndex = sorted.indexOf(moved);
      const ids = selection.length > 1 ? selection : [d.id];
      updateNodes(ids, { fill: { ...(n.fill as any), stops: sorted } }, false);
      if (drag.current && drag.current.type === "gradient-stop") {
        drag.current.stopIndex = newIndex >= 0 ? newIndex : d.stopIndex;
      }
      setStudioStatus(`Stop ${Math.round(offset * 100)}%`);
      return;
    }
    if (d.type === "gradient-radial") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || typeof n.fill !== "object" || n.fill?.type !== "radial") return;
      // Map world point back to local node space (undo rotation)
      const c = nodeCenter(n);
      const local = n.rotation
        ? rotatePoint(docPt.x, docPt.y, c.x, c.y, -n.rotation)
        : { x: docPt.x, y: docPt.y };
      let ox = (local.x - n.x) / n.w;
      let oy = (local.y - n.y) / n.h;
      ox = Math.max(0, Math.min(1, ox));
      oy = Math.max(0, Math.min(1, oy));
      if (e.shiftKey) {
        ox = Math.round(ox * 20) / 20;
        oy = Math.round(oy * 20) / 20;
      }
      const ids = selection.length > 1 ? selection : [d.id];
      updateNodes(ids, { fill: { ...n.fill, cx: ox, cy: oy } }, false);
      setStudioStatus(`Radial centre ${(ox * 100).toFixed(0)}%, ${(oy * 100).toFixed(0)}%`);
      return;
    }
    if (d.type === "gradient-radial-focal") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || typeof n.fill !== "object" || n.fill?.type !== "radial") return;
      const c = nodeCenter(n);
      const local = n.rotation
        ? rotatePoint(docPt.x, docPt.y, c.x, c.y, -n.rotation)
        : { x: docPt.x, y: docPt.y };
      let fx = (local.x - n.x) / n.w;
      let fy = (local.y - n.y) / n.h;
      fx = Math.max(0, Math.min(1, fx));
      fy = Math.max(0, Math.min(1, fy));
      if (e.shiftKey) {
        fx = Math.round(fx * 20) / 20;
        fy = Math.round(fy * 20) / 20;
      }
      const ids = selection.length > 1 ? selection : [d.id];
      updateNodes(ids, { fill: { ...n.fill, fx, fy } }, false);
      setStudioStatus(`Radial focal ${(fx * 100).toFixed(0)}%, ${(fy * 100).toFixed(0)}%`);
      return;
    }
    if (d.type === "gradient-radial-r0") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || typeof n.fill !== "object" || n.fill?.type !== "radial") return;
      const focal = radialFocal(n);
      if (!focal) return;
      const outer = radialOuterRadius(n);
      const dist = Math.hypot(docPt.x - focal.x, docPt.y - focal.y);
      let r0 = dist / outer;
      r0 = Math.max(0, Math.min(0.95, r0));
      if (e.shiftKey) r0 = Math.round(r0 * 20) / 20;
      const ids = selection.length > 1 ? selection : [d.id];
      updateNodes(ids, { fill: { ...n.fill, r0 } }, false);
      setStudioStatus(`Radial inner radius ${(r0 * 100).toFixed(0)}%`);
      return;
    }
    if (d.type === "path-handle-length") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || !isPath(n)) return;
      if (!d.started) {
        commit();
        drag.current = { ...d, started: true };
      }
      const ring = d.hole == null ? n.points : (n.holes?.[d.hole] ?? []);
      const pt = ring[d.index];
      if (!pt) return;
      const ax = n.x + pt.x;
      const ay = n.y + pt.y;
      const c = nodeCenter(n);
      const worldAnchor = n.rotation ? rotatePoint(ax, ay, c.x, c.y, n.rotation) : { x: ax, y: ay };
      const dx = docPt.x - worldAnchor.x;
      const dy = docPt.y - worldAnchor.y;
      const newLen = Math.max(0, Math.hypot(dx, dy));
      const baseLen = Math.hypot(d.baseVec.x, d.baseVec.y) || 1;
      const scale = newLen / baseLen;
      const next = { x: d.baseVec.x * scale, y: d.baseVec.y * scale };
      const s = useDesign.getState();
      const mirrorKey = `${d.id}:${d.hole ?? ""}:${d.index}`;
      const mir = !!(s.mirrorPoints && s.mirrorPoints[mirrorKey]);
      const nextPt = { ...pt };
      if (mir) {
        const mirrored = mirrorHandle(next);
        if (d.arm === "in") {
          nextPt.in = next;
          nextPt.out = mirrored;
        } else {
          nextPt.out = next;
          nextPt.in = mirrored;
        }
      } else {
        if (d.arm === "in") nextPt.in = next;
        else nextPt.out = next;
      }
      const nextRing = ring.map((p, i) => (i === d.index ? nextPt : p));
      const nextNode =
        d.hole == null
          ? { ...n, points: nextRing }
          : { ...n, holes: (n.holes ?? []).map((h, i) => (i === d.hole ? nextRing : h)) };
      replaceNode(d.id, nextNode, false);
      setPathEditHit({ index: d.index, arm: d.arm, hole: d.hole });
      setStudioStatus(`Length ${d.arm} · ${Math.round(newLen)}`);
      return;
    }
    if (d.type === "path-point") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || !isPath(n)) return;
      if (!d.started) {
        commit();
        drag.current = { ...d, started: true };
      }
      const local = pathWorldToLocal(n, docPt.x, docPt.y);
      editPathHit(d.id, d.hit, local.x, local.y, d.keepSmooth && !e.altKey, false);
      if (d.hit.arm === "anchor") {
        setStudioStatus(`Point ${d.hit.index + 1} · ${Math.round(local.x)}, ${Math.round(local.y)}`);
      } else {
        setStudioStatus(`Handle ${d.hit.arm} · point ${d.hit.index + 1}`);
      }
      return;
    }
    if (d.type === "marquee") {
      drag.current = { ...d, endX: docPt.x, endY: docPt.y };
      setMarquee({ x1: d.startX, y1: d.startY, x2: docPt.x, y2: docPt.y });
      return;
    }
    if (d.type === "create") {
      const x0 = Math.min(d.startX, docPt.x);
      const y0 = Math.min(d.startY, docPt.y);
      const w = Math.abs(docPt.x - d.startX);
      const h = Math.abs(docPt.y - d.startY);
      if (!d.id) {
        if (w < 2 && h < 2 && d.tool !== "text") return;
        if (d.tool === "text") {
          const node = makeText(d.startX, d.startY, color);
          addNode(node, true);
          drag.current = { ...d, id: node.id };
          setTool("select");
          return;
        }
        const node = makeShape(d.tool, x0, y0, Math.max(w, 4), Math.max(h, 4), color);
        addNode(node, true);
        drag.current = { ...d, id: node.id };
      } else if (d.tool !== "text") {
        updateNodes([d.id], { x: x0, y: y0, w: Math.max(w, 4), h: Math.max(h, 4) }, false);
      }
    }
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setMarquee(null);
    setScaleFlip(null);
    setRotateAngle(null);
    setLengthHover(null);
    setRotateHover(null);
    setScaleHover(null);
    setDistHover(null);
    setDistCursorLabel(null);
    setFlipHover(null);
    setAlignHover(null);
    if (d?.type === "path-points-align") {
      alignSelectedPathPoints(d.edge);
      clearPathPointAlignPreview();
      return;
    }
    if (d?.type === "path-points-dist") {
      // Use the last preview gap; recompute from current mouse if needed, but since preview is set, apply with the gap from status or store last
      // For simplicity, recompute the snapped gap from the final mouse position (but we don't have it here easily)
      // Instead, extract gap from the preview if possible, or store it. For now, apply with initial if no move, but better to track.
      // Since previewDistributeWithGap sets the preview, we can compute gap from the preview points.
      const preview = useDesign.getState().pathPointAlignPreview;
      let finalGap = d.initialGap;
      if (preview && preview.points.length >= 2 && (preview.edge === "dist-h" || preview.edge === "dist-v")) {
        const sorted = preview.points.slice().sort((a, b) => (d.axis === "h" ? a.toX - b.toX : a.toY - b.toY));
        const start = d.axis === "h" ? sorted[0]!.toX : sorted[0]!.toY;
        const end = d.axis === "h" ? sorted[sorted.length - 1]!.toX : sorted[sorted.length - 1]!.toY;
        finalGap = (end - start) / (sorted.length - 1);
      }
      applyDistributeWithGap(d.axis, finalGap);
      clearPathPointAlignPreview();
      return;
    }
    if (d?.type === "layer-dist") {
      commitDistributePreview();
      return;
    }
    if (d?.type === "path-points-flip") {
      flipSelectedPathPoints(d.axis);
      clearPathPointAlignPreview();
      return;
    }
    if (d?.type === "knife") {
      const bx = d.endX ?? d.startX;
      const by = d.endY ?? d.startY;
      const ok = knifeCutStroke(d.startX, d.startY, bx, by, viewport.zoom);
      if (ok) {
        const residual = collectKnifeResidual(doc, d.startX, d.startY, bx, by, viewport.zoom);
        if (residual) {
          setKnifeResidual(residual);
          const pieces = residual.pieces.length;
          setStudioStatus(pieces > 1 ? `Knife · ${pieces} pieces` : "Knife · cut");
        } else {
          setStudioStatus("Knife · cut");
        }
      } else {
        setStudioStatus("Knife · miss");
      }
      setKnifeStroke(null);
      return;
    }
    if (d?.type === "create" && d.id && d.tool !== "text") {
      setTool("select");
    }
    if (d?.type === "path-point") {
      // final state already live; nothing to commit again
    }
    if (d?.type === "crop") {
      commit();
      setStudioStatus("Crop committed");
    }
    if (d?.type === "gradient-angle") {
      commit();
      useDesign.getState().setGradientAngleScrubId(null);
      useDesign.getState().setGradientHoverKey(null);
      setStudioStatus("Gradient angle committed");
    }
    if (d?.type === "gradient-linear-offset") {
      commit();
      useDesign.getState().setGradientAngleScrubId(null);
      useDesign.getState().setGradientHoverKey(null);
      setStudioStatus("Gradient offset committed");
    }
    if (d?.type === "gradient-stop") {
      // Ensure stops are sorted by offset on commit
      const n = doc.nodes.find((x) => x.id === d.id);
      if (n && typeof n.fill === "object" && n.fill && (n.fill.type === "linear" || n.fill.type === "radial")) {
        const sorted = sortedStops((n.fill as any).stops);
        const ids = selection.length > 1 ? selection : [d.id];
        useDesign.getState().updateNodes(ids, { fill: { ...(n.fill as any), stops: sorted } }, false);
      }
      commit();
      useDesign.getState().setGradientAngleScrubId(null);
      setStudioStatus("Stop offset committed");
    }
    if (d?.type === "gradient-radial") {
      commit();
      useDesign.getState().setRadialCentreScrubId(null);
      setStudioStatus("Radial centre committed");
    }
    if (d?.type === "gradient-radial-focal") {
      commit();
      useDesign.getState().setRadialFocalScrubId(null);
      setStudioStatus("Radial focal committed");
    }
    if (d?.type === "gradient-radial-r0") {
      commit();
      useDesign.getState().setRadialR0ScrubId(null);
      setStudioStatus("Radial inner radius committed");
    }
    if (d?.type === "marquee") {
      const dx = Math.abs(d.endX - d.startX);
      const dy = Math.abs(d.endY - d.startY);
      if (dx < 3 && dy < 3) {
        // Pure click on empty: clear
        if (!d.additive) {
          select([]);
          setPathEditHit(null);
          setPathPointSelection([]);
        }
        return;
      }
      const minX = Math.min(d.startX, d.endX);
      const minY = Math.min(d.startY, d.endY);
      const maxX = Math.max(d.startX, d.endX);
      const maxY = Math.max(d.startY, d.endY);
      const mq = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };

      // Prefer path-point marquee when a single path is selected
      if (selection.length === 1) {
        const n = doc?.nodes.find((x) => x.id === selection[0]);
        if (n && isPath(n)) {
          const picked: { index: number; hole?: number }[] = [];
          const c = nodeCenter(n);
          const consider = (ring: typeof n.points, hole?: number) => {
            ring.forEach((pt, index) => {
              const localWx = n.x + pt.x;
              const localWy = n.y + pt.y;
              const world = n.rotation
                ? rotatePoint(localWx, localWy, c.x, c.y, n.rotation)
                : { x: localWx, y: localWy };
              if (world.x >= minX && world.x <= maxX && world.y >= minY && world.y <= maxY) {
                picked.push({ index, hole });
              }
            });
          };
          consider(n.points);
          (n.holes ?? []).forEach((ring, hole) => consider(ring, hole));
          if (d.additive) {
            const cur = useDesign.getState().pathPointSelection ?? [];
            const key = (p: { index: number; hole?: number }) => `${p.hole ?? ""}:${p.index}`;
            const seen = new Set(cur.map(key));
            for (const p of picked) if (!seen.has(key(p))) cur.push(p);
            setPathPointSelection(cur);
          } else {
            setPathPointSelection(picked);
          }
          if (picked.length) {
            setPathEditHit({ index: picked[0]!.index, arm: "anchor", hole: picked[0]!.hole });
          }
          setStudioStatus(`Marquee · ${picked.length} path point${picked.length === 1 ? "" : "s"}`);
          return;
        }
      }

      // Otherwise select nodes
      const ids = nodesInMarquee(doc?.nodes ?? [], mq, "intersect");
      if (d.additive) {
        const cur = new Set(selection);
        for (const id of ids) cur.add(id);
        select(Array.from(cur));
      } else {
        select(ids);
      }
      setPathEditHit(null);
      setPathPointSelection([]);
      setStudioStatus(`Marquee · ${ids.length} layer${ids.length === 1 ? "" : "s"}`);
    }
  }

  function onWheel(e: React.WheelEvent) {
    if (!doc) return;
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const docPt = screenToDoc(sx, sy, viewport);
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const nextZ = Math.max(0.05, Math.min(8, viewport.zoom * factor));
    setViewport({
      zoom: nextZ,
      x: sx - docPt.x * nextZ,
      y: sy - docPt.y * nextZ,
    });
  }

  if (!doc) return <div className="h-full w-full bg-ground" />;

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-ground">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
      {eyedropperPreview && (
        <div
          className="pointer-events-none absolute z-50 flex items-center gap-1.5 rounded border border-phosphor/70 bg-ground/95 px-1.5 py-1 text-[11px] text-ink shadow-lg"
          style={{
            left: Math.min(Math.max(eyedropperPreview.sx + 18, 8), (wrapRef.current?.clientWidth ?? 800) - 120),
            top: Math.min(Math.max(eyedropperPreview.sy + 18, 8), (wrapRef.current?.clientHeight ?? 600) - 36),
          }}
        >
          <div
            className="size-5 rounded border border-phosphor/40"
            style={{
              background: eyedropperPreview.hex
                ? eyedropperPreview.hex
                : "repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 8px 8px",
              opacity: eyedropperPreview.hex ? eyedropperPreview.alpha / 255 : 1,
            }}
          />
          <span className="font-mono tracking-tight">
            {eyedropperPreview.hex ?? "transparent"}
            {eyedropperPreview.hex && eyedropperPreview.alpha < 255
              ? ` ${Math.round((eyedropperPreview.alpha / 255) * 100)}%`
              : ""}
          </span>
        </div>
      )}
      {stopColorTarget && (
        <input
          ref={colorInputRef}
          type="color"
          value={stopColorTarget.color}
          onChange={(ev) => {
            const hex = ev.target.value;
            const node = doc?.nodes.find((nn) => nn.id === stopColorTarget.id);
            if (!node || typeof node.fill !== "object" || node.fill == null || node.fill.type !== "linear") {
              setStopColorTarget(null);
              return;
            }
            const stops = (node.fill as any).stops.map((s: any, j: number) =>
              j === stopColorTarget.stopIndex ? { ...s, color: hex } : s,
            );
            const ids = selection.length > 1 ? selection : [stopColorTarget.id];
            useDesign.getState().updateNodes(ids, { fill: { ...(node.fill as any), stops } }, true);
            rememberColor(hex);
            setStopColorTarget((prev) => (prev ? { ...prev, color: hex } : null));
            setStudioStatus(`Stop ${stopColorTarget.stopIndex + 1} · ${hex}`);
          }}
          onBlur={() => setStopColorTarget(null)}
          className="absolute z-[60] size-8 cursor-pointer rounded-full border-2 border-phosphor bg-ground opacity-0"
          style={{
            left: Math.min(Math.max(stopColorTarget.sx - 16, 4), (wrapRef.current?.clientWidth ?? 800) - 40),
            top: Math.min(Math.max(stopColorTarget.sy - 16, 4), (wrapRef.current?.clientHeight ?? 600) - 40),
          }}
        />
      )}
    </div>
  );
}

function drawMarquee(
  ctx: CanvasRenderingContext2D,
  mq: { x1: number; y1: number; x2: number; y2: number },
  vp: Viewport,
  dpr: number,
) {
  const x = Math.min(mq.x1, mq.x2);
  const y = Math.min(mq.y1, mq.y2);
  const w = Math.abs(mq.x2 - mq.x1);
  const h = Math.abs(mq.y2 - mq.y1);
  if (w < 1 && h < 1) return;
  const zoom = vp.zoom;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(zoom, zoom);

  // dual soft outer phosphor rings matching measurement ghosts and value chips
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
  ctx.lineWidth = 3.2 / zoom;
  ctx.setLineDash([5 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.rect(x - 1.6 / zoom, y - 1.6 / zoom, w + 3.2 / zoom, h + 3.2 / zoom);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 5.5 / zoom;
  ctx.beginPath();
  ctx.rect(x - 3.2 / zoom, y - 3.2 / zoom, w + 6.4 / zoom, h + 6.4 / zoom);
  ctx.stroke();
  ctx.restore();

  // main precise marquee
  ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
  ctx.fillStyle = "rgba(63,198,255,0.06)";
  ctx.lineWidth = 1.4 / zoom;
  ctx.setLineDash([4 / zoom, 3 / zoom]);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPathPointAlignPreview(
  ctx: CanvasRenderingContext2D,
  preview: NonNullable<PathPointAlignPreview>,
  doc: DesignDocument,
  vp: Viewport,
  dpr: number,
) {
  const n = doc.nodes.find((x) => x.id === preview.nodeId);
  if (!n || !isPath(n)) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const c = nodeCenter(n);
  if (n.rotation) {
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
  }
  const phosphor = "#3fc6ff";
  ctx.strokeStyle = phosphor;
  ctx.fillStyle = "rgba(63,198,255,0.35)";
  ctx.lineWidth = 1 / vp.zoom;
  ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
  const r = 5 / vp.zoom;
  const targets: { x: number; y: number }[] = [];
  for (const pt of preview.points) {
    const fx = n.x + pt.fromX;
    const fy = n.y + pt.fromY;
    const tx = n.x + pt.toX;
    const ty = n.y + pt.toY;
    targets.push({ x: tx, y: ty });
    // dashed line from current to target
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    // ghost circle at target
    ctx.beginPath();
    ctx.arc(tx, ty, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Phosphor spine for distribute previews
  if (preview.edge === "dist-h" || preview.edge === "dist-v") {
    const axis = preview.edge === "dist-h" ? "h" : "v";
    drawDistTargetSpine(ctx, axis, targets, vp.zoom);
    // Live gap badges on the target spine
    if (targets.length >= 3) {
      const sorted = targets.slice().sort((a, b) => (axis === "h" ? a.x - b.x : a.y - b.y));
      const start = axis === "h" ? sorted[0]!.x : sorted[0]!.y;
      const end = axis === "h" ? sorted[sorted.length - 1]!.x : sorted[sorted.length - 1]!.y;
      const gap = (end - start) / (sorted.length - 1);
      if (gap > 0.5) {
        const mid = sorted.reduce((s, p) => s + (axis === "h" ? p.y : p.x), 0) / sorted.length;
        if (axis === "h") {
          drawGapBadges(ctx, "h", start, mid - 1, end - start, 2, targets.length, vp.zoom, formatDistributeGap(gap));
        } else {
          drawGapBadges(ctx, "v", mid - 1, start, 2, end - start, targets.length, vp.zoom, formatDistributeGap(gap));
        }
      }
    }
  }
  ctx.restore();
}

function drawPathPointNumericPreview(
  ctx: CanvasRenderingContext2D,
  preview: NonNullable<PathPointNumericPreview>,
  doc: DesignDocument,
  vp: Viewport,
  dpr: number,
) {
  const n = doc.nodes.find((x) => x.id === preview.nodeId);
  if (!n || !isPath(n)) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const c = nodeCenter(n);
  if (n.rotation) {
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
  }
  const phosphor = "#3fc6ff";
  ctx.strokeStyle = phosphor;
  ctx.fillStyle = "rgba(63,198,255,0.45)";
  ctx.lineWidth = 1 / vp.zoom;
  // denser dash so point X/Y ghosts read as precise measurements, matching handle previews
  ctx.setLineDash([2 / vp.zoom, 2 / vp.zoom]);
  const r = 3.5 / vp.zoom;
  const fx = n.x + preview.fromX;
  const fy = n.y + preview.fromY;
  const tx = n.x + preview.toX;
  const ty = n.y + preview.toY;
  // dashed line from current to proposed
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  // ghost circle at proposed — tighter tip
  ctx.beginPath();
  ctx.arc(tx, ty, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // dual phosphor glow rings for precise tip
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 3 / vp.zoom;
  ctx.beginPath();
  ctx.arc(tx, ty, r + 2 / vp.zoom, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 5 / vp.zoom;
  ctx.beginPath();
  ctx.arc(tx, ty, r + 4 / vp.zoom, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // longer axis-aligned measurement tick with soft outer glow
  const tick = 6 / vp.zoom;
  ctx.beginPath();
  if (preview.axis === "x") {
    ctx.moveTo(tx, ty - tick);
    ctx.lineTo(tx, ty + tick);
  } else {
    ctx.moveTo(tx - tick, ty);
    ctx.lineTo(tx + tick, ty);
  }
  ctx.stroke();
  // soft outer glow on the tick
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2.5 / vp.zoom;
  ctx.beginPath();
  if (preview.axis === "x") {
    ctx.moveTo(tx, ty - tick);
    ctx.lineTo(tx, ty + tick);
  } else {
    ctx.moveTo(tx - tick, ty);
    ctx.lineTo(tx + tick, ty);
  }
  ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);

  // Live phosphor value chip next to the proposed point
  const zoom = vp.zoom;
  const val = Math.round(preview.axis === "x" ? preview.toX : preview.toY);
  const label = `${preview.axis.toUpperCase()} ${val}`;
  ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  const tw = ctx.measureText(label).width;
  const chipW = tw + 8 / zoom;
  const chipH = 14 / zoom;
  const pad = 6 / zoom;
  let cx = tx + pad;
  let cy = ty - pad;
  // soft outer glow on the chip plate — dual phosphor rings matching tip ghosts
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
  ctx.lineWidth = 3.2 / zoom;
  ctx.beginPath();
  ctx.roundRect(cx - 1.6 / zoom, cy - chipH - 1.6 / zoom, chipW + 3.2 / zoom, chipH + 3.2 / zoom, 4.2 / zoom);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 5.5 / zoom;
  ctx.beginPath();
  ctx.roundRect(cx - 3.2 / zoom, cy - chipH - 3.2 / zoom, chipW + 6.4 / zoom, chipH + 6.4 / zoom, 5.5 / zoom);
  ctx.stroke();
  ctx.restore();
  // keep chip roughly on-canvas relative to node
  ctx.fillStyle = "rgba(6, 23, 15, 0.82)";
  ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.roundRect(cx, cy - chipH, chipW, chipH, 3 / zoom);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(63, 198, 255, 0.95)";
  ctx.fillText(label, cx + 4 / zoom, cy - 2 / zoom);

  ctx.restore();
}


function drawPathPointHandleNumericPreview(
  ctx: CanvasRenderingContext2D,
  preview: NonNullable<PathPointHandleNumericPreview>,
  doc: DesignDocument,
  vp: Viewport,
  dpr: number,
) {
  const n = doc.nodes.find((x) => x.id === preview.nodeId);
  if (!n || !isPath(n)) return;
  const ring = preview.hole == null ? n.points : n.holes?.[preview.hole];
  const pt = ring?.[preview.index];
  if (!pt) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const c = nodeCenter(n);
  if (n.rotation) {
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
  }
  const phosphor = "#3fc6ff";
  ctx.strokeStyle = phosphor;
  ctx.fillStyle = "rgba(63,198,255,0.45)";
  ctx.lineWidth = 1 / vp.zoom;
  const isLen = preview.axis === "len";
  const isAxis = preview.axis === "x" || preview.axis === "y";
  // denser dash so both length and axis ghosts read as precise measurements
  ctx.setLineDash([2 / vp.zoom, 2 / vp.zoom]);
  const ax = n.x + pt.x;
  const ay = n.y + pt.y;
  const tx = ax + preview.toX;
  const ty = ay + preview.toY;
  // dashed line from anchor to proposed handle tip
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  // ghost circle at proposed tip — tighter for both length and axis
  const r = 3.5 / vp.zoom;
  ctx.beginPath();
  ctx.arc(tx, ty, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // dual phosphor glow rings for precise tip
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 3 / vp.zoom;
  ctx.beginPath();
  ctx.arc(tx, ty, r + 2 / vp.zoom, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 5 / vp.zoom;
  ctx.beginPath();
  ctx.arc(tx, ty, r + 4 / vp.zoom, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  if (isLen) {
    // perpendicular length tick at tip
    const dx = preview.toX;
    const dy = preview.toY;
    const hyp = Math.hypot(dx, dy) || 1;
    const px = -dy / hyp;
    const py = dx / hyp;
    const tick = 4.5 / vp.zoom;
    ctx.beginPath();
    ctx.moveTo(tx - px * tick, ty - py * tick);
    ctx.lineTo(tx + px * tick, ty + py * tick);
    ctx.stroke();
  } else if (isAxis) {
    // axis-aligned measurement tick: vertical for X, horizontal for Y
    const tick = 4.5 / vp.zoom;
    ctx.beginPath();
    if (preview.axis === "x") {
      ctx.moveTo(tx, ty - tick);
      ctx.lineTo(tx, ty + tick);
    } else {
      ctx.moveTo(tx - tick, ty);
      ctx.lineTo(tx + tick, ty);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Live phosphor value chip next to the proposed handle tip
  const zoom = vp.zoom;
  let label: string;
  if (preview.axis === "len") {
    const len = Math.round(Math.hypot(preview.toX, preview.toY));
    label = `Len ${len}`;
  } else {
    const val = Math.round(preview.axis === "x" ? preview.toX : preview.toY);
    label = `${preview.axis.toUpperCase()} ${val}`;
  }
  ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  const tw = ctx.measureText(label).width;
  const chipW = tw + 8 / zoom;
  const chipH = 14 / zoom;
  const pad = 5 / zoom;
  const cx = tx + pad;
  const cy = ty - pad;
  // soft outer glow on the chip plate — dual phosphor rings matching point and tip ghosts
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
  ctx.lineWidth = 3.2 / zoom;
  ctx.beginPath();
  ctx.roundRect(cx - 1.6 / zoom, cy - chipH - 1.6 / zoom, chipW + 3.2 / zoom, chipH + 3.2 / zoom, 4.2 / zoom);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 5.5 / zoom;
  ctx.beginPath();
  ctx.roundRect(cx - 3.2 / zoom, cy - chipH - 3.2 / zoom, chipW + 6.4 / zoom, chipH + 6.4 / zoom, 5.5 / zoom);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "rgba(6, 23, 15, 0.82)";
  ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.roundRect(cx, cy - chipH, chipW, chipH, 3 / zoom);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(63, 198, 255, 0.95)";
  ctx.fillText(label, cx + 4 / zoom, cy - 2 / zoom);

  ctx.restore();
}

/** Phosphor value chip with dual outer glow rings, matching path-point / handle tip ghosts. */
function drawPhosphorValueChip(
  ctx: CanvasRenderingContext2D,
  label: string,
  cx: number,
  cy: number,
  zoom: number,
  emphasize = false,
  denser = false,
) {
  const fontPx = denser
    ? Math.max(8, 9.5 / zoom)
    : emphasize
      ? Math.max(10, 13.5 / zoom)
      : Math.max(9, 11 / zoom);
  ctx.font = `${fontPx}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  const tw = ctx.measureText(label).width;
  const padX = (denser ? 5 : emphasize ? 10 : 8) / zoom;
  const chipW = tw + padX;
  const chipH = (denser ? 11 : emphasize ? 16.5 : 14) / zoom;

  // soft outer glow — dual phosphor rings matching tip ghosts (stronger / denser when emphasized)
  const g1 = denser ? 0.22 : emphasize ? 0.55 : 0.28;
  const g2 = denser ? 0.1 : emphasize ? 0.28 : 0.12;
  const lw1 = (denser ? 2.4 : emphasize ? 4.4 : 3.2) / zoom;
  const lw2 = (denser ? 4.2 : emphasize ? 7.2 : 5.5) / zoom;
  const off1 = (denser ? 1.2 : emphasize ? 2.2 : 1.6) / zoom;
  const off2 = (denser ? 2.4 : emphasize ? 4.2 : 3.2) / zoom;
  ctx.save();
  ctx.globalAlpha = g1;
  ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
  ctx.lineWidth = lw1;
  ctx.beginPath();
  ctx.roundRect(cx - off1, cy - chipH - off1, chipW + off1 * 2, chipH + off1 * 2, (denser ? 3.2 : emphasize ? 4.8 : 4.2) / zoom);
  ctx.stroke();
  ctx.globalAlpha = g2;
  ctx.lineWidth = lw2;
  ctx.beginPath();
  ctx.roundRect(cx - off2, cy - chipH - off2, chipW + off2 * 2, chipH + off2 * 2, (denser ? 4.2 : emphasize ? 6.2 : 5.5) / zoom);
  ctx.stroke();
  ctx.restore();

  const bgAlpha = denser ? 0.78 : emphasize ? 0.92 : 0.82;
  const strokeAlpha = denser ? 0.65 : emphasize ? 0.95 : 0.7;
  const textAlpha = denser ? 0.9 : emphasize ? 1 : 0.95;
  ctx.fillStyle = `rgba(6, 23, 15, ${bgAlpha})`;
  ctx.strokeStyle = `rgba(63, 198, 255, ${strokeAlpha})`;
  ctx.lineWidth = (denser ? 0.8 : emphasize ? 1.4 : 1) / zoom;
  ctx.beginPath();
  ctx.roundRect(cx, cy - chipH, chipW, chipH, (denser ? 2.5 : emphasize ? 3.5 : 3) / zoom);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(63, 198, 255, ${textAlpha})`;
  const textPad = (denser ? 2.5 : emphasize ? 5 : 4) / zoom;
  ctx.fillText(label, cx + textPad, cy - 1.5 / zoom);
}

/** Dual phosphor outer glow + main stroke for measurement guide lines (align, distribute, etc.). */
function drawPhosphorGuideLine(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  zoom: number,
) {
  // dual outer phosphor rings
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
  ctx.lineWidth = 3.2 / zoom;
  ctx.setLineDash([5 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 5.5 / zoom;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.restore();

  // main precise guide
  ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
  ctx.lineWidth = 1.6 / zoom;
  ctx.setLineDash([5 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Dual soft outer phosphor rings + main stroke for selection bounding boxes and similar outlines. */
function drawPhosphorSelectionOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom: number,
  dashed = false,
) {
  // dual outer phosphor rings
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
  ctx.lineWidth = 3.2 / zoom;
  if (dashed) ctx.setLineDash([5 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.rect(x - 1.6 / zoom, y - 1.6 / zoom, w + 3.2 / zoom, h + 3.2 / zoom);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 5.5 / zoom;
  ctx.beginPath();
  ctx.rect(x - 3.2 / zoom, y - 3.2 / zoom, w + 6.4 / zoom, h + 6.4 / zoom);
  ctx.stroke();
  ctx.restore();

  // main precise outline
  ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
  ctx.lineWidth = 1.4 / zoom;
  if (dashed) ctx.setLineDash([5 / zoom, 4 / zoom]);
  else ctx.setLineDash([]);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Dual soft outer phosphor rings around a resize handle square. */
function drawPhosphorHandle(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  size: number,
  zoom: number,
) {
  const half = size / 2;
  // dual outer rings
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
  ctx.lineWidth = 2.4 / zoom;
  ctx.beginPath();
  ctx.rect(hx - half - 1.4 / zoom, hy - half - 1.4 / zoom, size + 2.8 / zoom, size + 2.8 / zoom);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 4 / zoom;
  ctx.beginPath();
  ctx.rect(hx - half - 2.8 / zoom, hy - half - 2.8 / zoom, size + 5.6 / zoom, size + 5.6 / zoom);
  ctx.stroke();
  ctx.restore();

  // solid handle
  ctx.fillStyle = "#06170f";
  ctx.strokeStyle = "#3fc6ff";
  ctx.lineWidth = 1.2 / zoom;
  ctx.fillRect(hx - half, hy - half, size, size);
  ctx.strokeRect(hx - half, hy - half, size, size);
}

function drawStrokeCapJoinChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  ghost: NonNullable<import("@/lib/design/stroke-ghost").StrokeGhost>,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  const hasCap = ghost.lineCap != null;
  const hasJoin = ghost.lineJoin != null;
  const hasFillRule = ghost.fillRule != null;
  const hasInset = ghost.shadowInset != null;
  const hasFill = ghost.fill != null;
  const hasOpacity = ghost.opacity != null;
  const hasStroke = ghost.stroke != null;
  const hasBlend = ghost.blend != null;
  const hasVisible = ghost.visible != null;
  const hasLocked = ghost.locked != null;
  if (
    !hasCap &&
    !hasJoin &&
    !hasFillRule &&
    !hasInset &&
    !hasFill &&
    !hasOpacity &&
    !hasStroke &&
    !hasBlend &&
    !hasVisible &&
    !hasLocked
  )
    return;

  let targets = nodes.filter((n) => selection.includes(n.id) && n.visible);
  if (hasFillRule) {
    targets = targets.filter((n) => isPath(n) && (n.holes?.length ?? 0) > 0);
  } else if (hasInset || hasFill || hasOpacity || hasBlend || hasVisible || hasLocked) {
    // Inset / fill / opacity / blend / visibility / lock apply to selected visible nodes
  } else {
    // Cap / join / stroke: outline nodes
    targets = targets.filter((n) => ["path", "rect", "ellipse", "line", "polygon", "star", "arrow"].includes(n.kind));
  }
  if (!targets.length) return;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    // Transient phosphor edge
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);

    const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    let label = "";
    if (hasFill) {
      label = fillChipLabel(ghost.fill!);
    } else if (hasOpacity) {
      label = `${Math.round((ghost.opacity ?? 1) * 100)}%`;
    } else if (hasStroke) {
      label = strokeChipLabel(ghost.stroke!, ghost.strokeWidth ?? 1);
    } else if (hasFillRule) {
      label = ghost.fillRule === "evenodd" ? "Even-odd" : "Nonzero";
    } else if (hasInset) {
      label = ghost.shadowInset ? "Inset" : "Drop";
    } else if (hasBlend) {
      const mode = ghost.blend!;
      const pretty =
        mode === "source-over"
          ? "Normal"
          : mode
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
      label = pretty;
    } else if (hasVisible) {
      label = ghost.visible ? "Shown" : "Hidden";
    } else if (hasLocked) {
      label = ghost.locked ? "Locked" : "Open";
    } else if (hasCap && hasJoin) {
      label = `Cap ${title(ghost.lineCap!)} · Join ${title(ghost.lineJoin!)}`;
    } else if (hasCap) {
      label = `Cap ${title(ghost.lineCap!)}`;
    } else {
      label = `Join ${title(ghost.lineJoin!)}`;
    }

    ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const chipW = tw + 8 / zoom;
    const cx = x + w - chipW;
    const cy = y - 2 / zoom;
    drawPhosphorValueChip(ctx, label, cx, cy, zoom);
  }
  ctx.restore();
}

function drawOpacityScrubEdge(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  if (!scrubId) return;
  const multi = selection.length > 1 && selection.includes(scrubId);
  const targets = multi
    ? nodes.filter((n) => selection.includes(n.id) && n.visible)
    : nodes.filter((n) => n.id === scrubId && n.visible);
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    // Transient phosphor edge: soft outer + crisp inner
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    // Live percent chip near top-right of the node
    const pct = Math.round((n.opacity ?? 1) * 100);
    const label = `${pct}%`;
    ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const chipW = tw + 8 / zoom;
    const cx = x + w - chipW;
    const cy = y - 2 / zoom;
    drawPhosphorValueChip(ctx, label, cx, cy, zoom);
  }
  ctx.restore();
}


function drawAxisScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubTag: FontAxisTag | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  if (!scrubTag) return;
  const labels: Record<string, string> = {
    opsz: "Optical",
    wdth: "Width",
    slnt: "Slant",
    ital: "Italic",
    GRAD: "Grade",
    SOFT: "Softness",
    WONK: "Wonk",
  };
  const targets = nodes.filter((n): n is TextNode => isText(n) && selection.includes(n.id) && n.visible && Boolean(faceAxis(n.fontFamily, scrubTag)));
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const axis = faceAxis(n.fontFamily, scrubTag)!;
    const raw = nodeAxisValue(n, scrubTag);
    const clamped = scrubTag === "opsz"
      ? clampAxis(axis, raw, n.fontSize)
      : clampAxis(axis, raw);
    const display = Math.round(clamped * 100) / 100;
    const label = `${labels[scrubTag] ?? scrubTag} ${display}`;
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    // Transient phosphor edge
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    // Live value chip near top-right
    ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const chipW = tw + 8 / zoom;
    const cx = x + w - chipW;
    const cy = y - 2 / zoom;
    drawPhosphorValueChip(ctx, label, cx, cy, zoom);
  }
  ctx.restore();
}

function drawAxisHoverChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  hoverTag: FontAxisTag | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  if (!hoverTag) return;
  // Reuse the scrub drawer so hover matches live drag feedback
  drawAxisScrubChips(ctx, nodes, hoverTag, selection, vp, dpr);
}

function drawFilterHoverChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  hoverKey: "brightness" | "contrast" | "saturate" | "blur" | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  if (!hoverKey) return;
  const labels: Record<string, string> = {
    brightness: "Bright",
    contrast: "Contrast",
    saturate: "Saturate",
    blur: "Blur",
  };
  const targets = nodes.filter(
    (n) => selection.includes(n.id) && n.visible && (n.kind === "image" || n.kind === "paint"),
  );
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const filters = (n as ImageNode | PaintNode).filters;
    const raw = filters?.[hoverKey] ?? (hoverKey === "blur" ? 0 : 1);
    const display = hoverKey === "blur" ? Math.round(raw) : Math.round(raw * 100);
    const label = `${labels[hoverKey] ?? hoverKey} ${display}${hoverKey === "blur" ? "" : "%"}`;
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    // Transient phosphor edge
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    // Live value chip near top-right
    ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const chipW = tw + 8 / zoom;
    const cx = x + w - chipW;
    const cy = y - 2 / zoom;
    drawPhosphorValueChip(ctx, label, cx, cy, zoom);
  }
  ctx.restore();
}


function drawTypeHoverChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  hoverKey: "size" | "leading" | "weight" | "tracking" | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  if (!hoverKey) return;
  const targets = nodes.filter(
    (n) => selection.includes(n.id) && n.visible && n.kind === "text",
  );
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const t = n as import("@/lib/design/types").TextNode;
    let label = "";
    if (hoverKey === "size") {
      label = `Size ${Math.round(t.fontSize)}`;
    } else if (hoverKey === "leading") {
      label = `Leading ${t.lineHeight.toFixed(2)}`;
    } else if (hoverKey === "weight") {
      label = `Weight ${t.fontWeight}`;
    } else {
      label = `Track ${t.letterSpacing.toFixed(2)}`;
    }
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    // Transient phosphor edge
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    // Live value chip near top-right
    ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const chipW = tw + 8 / zoom;
    const cx = x + w - chipW;
    const cy = y - 2 / zoom;
    drawPhosphorValueChip(ctx, label, cx, cy, zoom);
  }
  ctx.restore();
}

function drawCropHoverChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  hoverKey: "x" | "y" | "w" | "h" | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  if (!hoverKey) return;
  const targets = nodes.filter(
    (n) => selection.includes(n.id) && n.visible && (n.kind === "image" || n.kind === "paint"),
  );
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const img = n as import("@/lib/design/types").ImageNode | import("@/lib/design/types").PaintNode;
    const crop = img.crop ?? { x: 0, y: 0, w: 1, h: 1 };
    const raw = crop[hoverKey] ?? (hoverKey === "x" || hoverKey === "y" ? 0 : 1);
    const pct = Math.round(raw * 100);
    const labels: Record<string, string> = { x: "X", y: "Y", w: "W", h: "H" };
    const label = `Crop ${labels[hoverKey]} ${pct}%`;
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    // Transient phosphor edge
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    // Live value chip near top-right
    ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const chipW = tw + 8 / zoom;
    const cx = x + w - chipW;
    const cy = y - 2 / zoom;
    drawPhosphorValueChip(ctx, label, cx, cy, zoom);
  }
  ctx.restore();
}

function drawRadiusScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  if (!scrubId) return;
  const multi = selection.length > 1 && selection.includes(scrubId);
  const targets = multi
    ? nodes.filter((n) => selection.includes(n.id) && n.visible && n.kind === "rect")
    : nodes.filter((n) => n.id === scrubId && n.visible && n.kind === "rect");
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    // Transient phosphor edge
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    // Live radius chip near top-right
    const label = `Radius ${Math.round(n.radius)}`;
    ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const chipW = tw + 8 / zoom;
    const cx = x + w - chipW;
    const cy = y - 2 / zoom;
    drawPhosphorValueChip(ctx, label, cx, cy, zoom);
  }
  ctx.restore();
}

function drawShadowBlurScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  if (!scrubId) return;
  const multi = selection.length > 1 && selection.includes(scrubId);
  const targets = multi
    ? nodes.filter((n) => selection.includes(n.id) && n.visible && n.shadow)
    : nodes.filter((n) => n.id === scrubId && n.visible && n.shadow);
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    const blur = n.shadow?.blur ?? 0;
    const label = `Blur ${Math.round(blur)}`;
    ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const chipW = tw + 8 / zoom;
    const cx = x + w - chipW;
    const cy = y - 2 / zoom;
    drawPhosphorValueChip(ctx, label, cx, cy, zoom);
  }
  ctx.restore();
}

function drawLiveScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
  filter: (n: DesignNode) => boolean,
  labelFor: (n: DesignNode) => string,
) {
  if (!scrubId) return;
  const multi = selection.length > 1 && selection.includes(scrubId);
  const targets = multi
    ? nodes.filter((n) => selection.includes(n.id) && n.visible && filter(n))
    : nodes.filter((n) => n.id === scrubId && n.visible && filter(n));
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    const label = labelFor(n);
    ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tw = ctx.measureText(label).width;
    const chipW = tw + 8 / zoom;
    const cx = x + w - chipW;
    const cy = y - 2 / zoom;
    drawPhosphorValueChip(ctx, label, cx, cy, zoom);
  }
  ctx.restore();
}

function drawRotationScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(ctx, nodes, scrubId, selection, vp, dpr, () => true, (n) => `Rotate ${Math.round(n.rotation)}°`);
}

function drawShadowOxScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(
    ctx,
    nodes,
    scrubId,
    selection,
    vp,
    dpr,
    (n) => Boolean(n.shadow),
    (n) => `X ${Math.round(n.shadow?.ox ?? 0)}`,
  );
}

function drawShadowOyScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(
    ctx,
    nodes,
    scrubId,
    selection,
    vp,
    dpr,
    (n) => Boolean(n.shadow),
    (n) => `Y ${Math.round(n.shadow?.oy ?? 0)}`,
  );
}

function drawShadowSpreadScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(
    ctx,
    nodes,
    scrubId,
    selection,
    vp,
    dpr,
    (n) => Boolean(n.shadow),
    (n) => `Spread ${Math.round(n.shadow?.spread ?? 0)}`,
  );
}

function drawStrokeWidthScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(
    ctx,
    nodes,
    scrubId,
    selection,
    vp,
    dpr,
    (n) => "strokeWidth" in n && typeof (n as { strokeWidth?: number }).strokeWidth === "number",
    (n) => `Width ${Math.round(((n as { strokeWidth?: number }).strokeWidth) ?? 0)}`,
  );
}

function drawStrokeDashScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(
    ctx,
    nodes,
    scrubId,
    selection,
    vp,
    dpr,
    (n) => "strokeDash" in n,
    (n) => `Dash ${Math.round(((n as { strokeDash?: number }).strokeDash) ?? 0)}`,
  );
}

function drawStrokeDashOffsetScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(
    ctx,
    nodes,
    scrubId,
    selection,
    vp,
    dpr,
    (n) => "strokeDashOffset" in n,
    (n) => `Offset ${Math.round(((n as { strokeDashOffset?: number }).strokeDashOffset) ?? 0)}`,
  );
}

function drawMiterLimitScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(
    ctx,
    nodes,
    scrubId,
    selection,
    vp,
    dpr,
    (n) => "miterLimit" in n,
    (n) => `Miter ${Math.round(((n as { miterLimit?: number }).miterLimit) ?? 4)}`,
  );
}

function gradientAngleHandle(n: DesignNode, zoom: number) {
  if (typeof n.fill !== "object" || n.fill == null || n.fill.type !== "linear") return null;
  const ox = n.fill.lox ?? 0.5;
  const oy = n.fill.loy ?? 0.5;
  const lx = n.x + n.w * ox;
  const ly = n.y + n.h * oy;
  const c = nodeCenter(n);
  const world = n.rotation ? rotatePoint(lx, ly, c.x, c.y, n.rotation) : { x: lx, y: ly };
  const ang = degToRad(n.fill.angle + n.rotation);
  const baseLen = Math.max(Math.abs(n.w), Math.abs(n.h));
  const llen = n.fill.llen ?? 1;
  const visualLen = Math.max(36 / zoom, baseLen * llen * 0.42);
  return {
    cx: world.x,
    cy: world.y,
    ex: world.x + Math.cos(ang) * visualLen,
    ey: world.y + Math.sin(ang) * visualLen,
    len: visualLen,
    llen,
  };
}


function linearStopWorld(n: DesignNode, zoom: number) {
  if (typeof n.fill !== "object" || n.fill == null || n.fill.type !== "linear") return null;
  const h = gradientAngleHandle(n, zoom);
  if (!h) return null;
  const stops = n.fill.stops.map((s) => {
    const t = s.offset;
    const dx = h.ex - h.cx;
    const dy = h.ey - h.cy;
    const x = h.cx + dx * (t - 0.5) * 2;
    const y = h.cy + dy * (t - 0.5) * 2;
    return { ...s, x, y };
  });
  return { h, stops };
}

function sortedStops(stops: { offset: number; color: string }[]) {
  return [...stops].sort((a, b) => a.offset - b.offset);
}

/** World positions of radial gradient stops along the +x (rotated) ray from focal. */
function radialStopWorld(n: DesignNode, zoom: number) {
  if (typeof n.fill !== "object" || n.fill == null || n.fill.type !== "radial") return null;
  const focal = radialFocal(n);
  if (!focal) return null;
  const outer = radialOuterRadius(n);
  const r0 = Math.max(0, Math.min(0.95, n.fill.r0 ?? 0));
  const innerR = r0 * outer;
  const ang = degToRad(n.rotation || 0);
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const stops = (n.fill.stops || []).map((s) => {
    const r = innerR + Math.max(0, Math.min(1, s.offset)) * (outer - innerR);
    return {
      x: focal.x + ux * r,
      y: focal.y + uy * r,
      offset: s.offset,
      color: s.color,
    };
  });
  return { stops, focal, ux, uy, innerR, outer };
}


function drawGradientAngleHandle(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  selection: string[],
  vp: Viewport,
  dpr: number,
  hoverKey: "angle" | "length" | "offset" | "angle-only" | "length-only" | null = null,
  focusedStop: { id: string; index: number } | null = null,
  hoveredStop: number | null = null,
) {
  const selected = nodes.filter((n) => selection.includes(n.id) && n.visible);
  if (selected.length === 0) return;
  const linears = selected.filter(
    (n) => n && typeof n.fill === "object" && n.fill != null && n.fill.type === "linear",
  );
  if (linears.length !== selected.length || linears.length === 0) return;
  const fillStr = JSON.stringify(linears[0]!.fill);
  if (!linears.every((n) => JSON.stringify(n.fill) === fillStr)) return;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([4 / zoom, 3 / zoom]);

  for (const n of linears) {
    const h = gradientAngleHandle(n, zoom);
    if (!h) continue;
    const activeLenOrAng = hoverKey === "length" || hoverKey === "angle" || hoverKey === "angle-only" || hoverKey === "length-only";
    ctx.beginPath();
    ctx.moveTo(h.cx, h.cy);
    ctx.lineTo(h.ex, h.ey);
    if (activeLenOrAng) {
      ctx.strokeStyle = "rgba(126, 224, 255, 0.95)";
      ctx.lineWidth = 2.2 / zoom;
    } else {
      ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
      ctx.lineWidth = 1.5 / zoom;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // Denser connecting line ticks when length/angle focused
    if (activeLenOrAng) {
      const len = Math.hypot(h.ex - h.cx, h.ey - h.cy);
      if (len > 8 / zoom) {
        const ux = (h.ex - h.cx) / len;
        const uy = (h.ey - h.cy) / len;
        const px = -uy;
        const py = ux;
        const tickCount = Math.max(3, Math.min(7, Math.round(len / (28 / zoom))));
        ctx.save();
        ctx.strokeStyle = "rgba(168, 240, 255, 0.72)";
        ctx.lineWidth = 1.15 / zoom;
        ctx.lineCap = "round";
        for (let i = 1; i < tickCount; i++) {
          const t = i / tickCount;
          const tx = h.cx + (h.ex - h.cx) * t;
          const ty = h.cy + (h.ey - h.cy) * t;
          const tl = 3.4 / zoom;
          ctx.beginPath();
          ctx.moveTo(tx - px * tl, ty - py * tl);
          ctx.lineTo(tx + px * tl, ty + py * tl);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    ctx.fillStyle = activeLenOrAng ? "#7ee0ff" : "#3fc6ff";
    ctx.strokeStyle = "#7ee0ff";
    ctx.lineWidth = 1.2 / zoom;
    const r = 5 / zoom;
    const endR = activeLenOrAng ? r * 1.85 : r;
    ctx.beginPath();
    ctx.arc(h.ex, h.ey, endR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (activeLenOrAng) {
      // soft outer glow ring — color shifts by mode
      const isAngleOnly = hoverKey === "angle-only" || hoverKey === "angle";
      const isLengthOnly = hoverKey === "length-only";
      ctx.beginPath();
      ctx.arc(h.ex, h.ey, endR + 4.5 / zoom, 0, Math.PI * 2);
      if (isAngleOnly) {
        ctx.strokeStyle = "rgba(255, 196, 120, 0.55)";
      } else if (isLengthOnly) {
        ctx.strokeStyle = "rgba(120, 255, 196, 0.55)";
      } else {
        ctx.strokeStyle = "rgba(63, 198, 255, 0.45)";
      }
      ctx.lineWidth = 2.5 / zoom;
      ctx.stroke();

      // Mode glyph on the handle itself
      ctx.save();
      ctx.lineCap = "round";
      if (isAngleOnly) {
        // small rotation arc
        ctx.beginPath();
        ctx.arc(h.ex, h.ey, endR * 0.48, -Math.PI * 0.75, Math.PI * 0.35);
        ctx.strokeStyle = "#ffd27e";
        ctx.lineWidth = 1.7 / zoom;
        ctx.stroke();
        // tiny arrow head
        const ax = h.ex + Math.cos(Math.PI * 0.35) * endR * 0.48;
        const ay = h.ey + Math.sin(Math.PI * 0.35) * endR * 0.48;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 2.2 / zoom, ay - 1.4 / zoom);
        ctx.lineTo(ax - 1.1 / zoom, ay + 1.8 / zoom);
        ctx.closePath();
        ctx.fillStyle = "#ffd27e";
        ctx.fill();
      } else if (isLengthOnly) {
        // small double-headed length bar
        ctx.strokeStyle = "#a8f0ff";
        ctx.lineWidth = 1.6 / zoom;
        ctx.beginPath();
        ctx.moveTo(h.ex - endR * 0.42, h.ey);
        ctx.lineTo(h.ex + endR * 0.42, h.ey);
        ctx.stroke();
        // arrow heads
        ctx.beginPath();
        ctx.moveTo(h.ex - endR * 0.42, h.ey);
        ctx.lineTo(h.ex - endR * 0.28, h.ey - 1.6 / zoom);
        ctx.lineTo(h.ex - endR * 0.28, h.ey + 1.6 / zoom);
        ctx.closePath();
        ctx.fillStyle = "#a8f0ff";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(h.ex + endR * 0.42, h.ey);
        ctx.lineTo(h.ex + endR * 0.28, h.ey - 1.6 / zoom);
        ctx.lineTo(h.ex + endR * 0.28, h.ey + 1.6 / zoom);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    // Offset centre handle (phosphor diamond)
    ctx.setLineDash([]);
    const activeOff = hoverKey === "offset";
    ctx.fillStyle = activeOff ? "#a8f0ff" : "#3fc6ff";
    ctx.strokeStyle = "#7ee0ff";
    ctx.lineWidth = activeOff ? 2.4 / zoom : 1.2 / zoom;
    const s = activeOff ? 7.2 / zoom : 4 / zoom;
    ctx.beginPath();
    ctx.moveTo(h.cx, h.cy - s);
    ctx.lineTo(h.cx + s, h.cy);
    ctx.lineTo(h.cx, h.cy + s);
    ctx.lineTo(h.cx - s, h.cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (activeOff) {
      // soft outer glow for diamond
      const gs = s + 3.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(h.cx, h.cy - gs);
      ctx.lineTo(h.cx + gs, h.cy);
      ctx.lineTo(h.cx, h.cy + gs);
      ctx.lineTo(h.cx - gs, h.cy);
      ctx.closePath();
      ctx.strokeStyle = "rgba(63, 198, 255, 0.4)";
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
      // denser offset diamond ticks: short perpendicular phosphor ticks at each vertex
      ctx.save();
      ctx.strokeStyle = "rgba(168, 240, 255, 0.78)";
      ctx.lineWidth = 1.2 / zoom;
      ctx.lineCap = "round";
      const tickLen = 3.6 / zoom;
      const verts = [
        { x: h.cx, y: h.cy - s },
        { x: h.cx + s, y: h.cy },
        { x: h.cx, y: h.cy + s },
        { x: h.cx - s, y: h.cy },
      ];
      const dirs = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
      ];
      for (let i = 0; i < 4; i++) {
        const v = verts[i]!;
        const d = dirs[i]!;
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(v.x + d.x * tickLen, v.y + d.y * tickLen);
        ctx.stroke();
      }
      ctx.restore();
    }
    // Multi-stop handles along the visual gradient line
    const sw = linearStopWorld(n, zoom);
    if (sw) {
      const isFocusedNode = focusedStop && focusedStop.id === n.id;
      // Denser stop circles when a linear dimension is focused so they stay secondary
      const denserStops = hoverKey === "angle" || hoverKey === "length" || hoverKey === "offset" || hoverKey === "angle-only" || hoverKey === "length-only";
      const chipDraws: { label: string; cx: number; cy: number; emphasize: boolean }[] = [];
      for (let si = 0; si < sw.stops.length; si++) {
        const st = sw.stops[si]!;
        const emphasize = !!(isFocusedNode && focusedStop.index === si) || si === hoveredStop;
        const denser = denserStops && !emphasize;
        const sr = (emphasize ? 6.4 : denser ? 2.8 : 4.2) / zoom;
        ctx.beginPath();
        ctx.arc(st.x, st.y, sr, 0, Math.PI * 2);
        ctx.fillStyle = st.color;
        ctx.fill();
        ctx.strokeStyle = emphasize ? "#a8f0ff" : denser ? "rgba(126, 224, 255, 0.75)" : "#7ee0ff";
        ctx.lineWidth = (emphasize ? 2.2 : denser ? 0.9 : 1.4) / zoom;
        ctx.stroke();
        // dual phosphor outer rings when emphasized
        if (emphasize) {
          ctx.save();
          ctx.globalAlpha = 0.42;
          ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
          ctx.lineWidth = 3.2 / zoom;
          ctx.beginPath();
          ctx.arc(st.x, st.y, sr + 3.8 / zoom, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.18;
          ctx.lineWidth = 5.6 / zoom;
          ctx.beginPath();
          ctx.arc(st.x, st.y, sr + 6.4 / zoom, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(st.x, st.y, sr + (denser ? 1.4 : 2.2) / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = denser ? "rgba(63, 198, 255, 0.35)" : "rgba(63, 198, 255, 0.55)";
          ctx.lineWidth = (denser ? 0.7 : 1.2) / zoom;
          ctx.stroke();
        }
        // Percent chip next to stop (emphasized when this stop is the focused/dragged one)
        const pct = Math.round(st.offset * 100);
        const label = `${pct}%`;
        // offset chip perpendicular to the gradient line so it stays clear of the handle
        const dx = h.ex - h.cx;
        const dy = h.ey - h.cy;
        const len = Math.hypot(dx, dy) || 1;
        const px = -dy / len;
        const py = dx / len;
        const off = 14 / zoom;
        const cx = st.x + px * off;
        const cy = st.y + py * off;
        chipDraws.push({ label, cx, cy, emphasize });
      }
      // Draw non-emphasized chips first, then emphasized last (stronger dual-glow on top)
      // Denser stop percent chips when a linear dimension is focused so they stay secondary
      for (const c of chipDraws.filter((c) => !c.emphasize)) {
        drawPhosphorValueChip(ctx, c.label, c.cx, c.cy, zoom, false, denserStops);
      }
      for (const c of chipDraws.filter((c) => c.emphasize)) {
        drawPhosphorValueChip(ctx, c.label, c.cx, c.cy, zoom, true, false);
      }
      // Denser linear dimension chips when a stop is focused or hovered
      if (isFocusedNode || hoveredStop != null) {
        const fill = n.fill as { angle?: number; llen?: number; lox?: number; loy?: number };
        const denser = true;
        const angle = Math.round(fill.angle ?? 0);
        const llen = Math.round((fill.llen ?? 1) * 100);
        const lox = Math.round((fill.lox ?? 0.5) * 100);
        const loy = Math.round((fill.loy ?? 0.5) * 100);
        drawPhosphorValueChip(ctx, `∠${angle}°`, h.cx + 6 / zoom, h.cy - 4 / zoom, zoom, false, denser);
        drawPhosphorValueChip(ctx, `${llen}%`, h.ex + 6 / zoom, h.ey - 4 / zoom, zoom, false, denser);
        drawPhosphorValueChip(ctx, `${lox},${loy}`, h.cx - 22 / zoom, h.cy + 12 / zoom, zoom, false, denser);
      }
    }
    ctx.setLineDash([4 / zoom, 3 / zoom]);
  }
  ctx.restore();
}

function radialCentre(n: DesignNode) {
  if (typeof n.fill !== "object" || n.fill == null || n.fill.type !== "radial") return null;
  const ox = n.fill.cx ?? 0.5;
  const oy = n.fill.cy ?? 0.5;
  const lx = n.x + n.w * ox;
  const ly = n.y + n.h * oy;
  const c = nodeCenter(n);
  if (n.rotation) {
    const world = rotatePoint(lx, ly, c.x, c.y, n.rotation);
    return world;
  }
  return { x: lx, y: ly };
}

function radialFocal(n: DesignNode) {
  if (typeof n.fill !== "object" || n.fill == null || n.fill.type !== "radial") return null;
  const ox = n.fill.cx ?? 0.5;
  const oy = n.fill.cy ?? 0.5;
  const fx = n.fill.fx ?? ox;
  const fy = n.fill.fy ?? oy;
  const lx = n.x + n.w * fx;
  const ly = n.y + n.h * fy;
  const c = nodeCenter(n);
  if (n.rotation) {
    const world = rotatePoint(lx, ly, c.x, c.y, n.rotation);
    return world;
  }
  return { x: lx, y: ly };
}

function radialOuterRadius(n: DesignNode): number {
  if (typeof n.fill !== "object" || n.fill == null || n.fill.type !== "radial") return 1;
  const ox = n.fill.cx ?? 0.5;
  const oy = n.fill.cy ?? 0.5;
  const cx = n.x + n.w * ox;
  const cy = n.y + n.h * oy;
  const corners: [number, number][] = [
    [n.x, n.y],
    [n.x + n.w, n.y],
    [n.x + n.w, n.y + n.h],
    [n.x, n.y + n.h],
  ];
  let r = 0;
  for (const [px, py] of corners) {
    r = Math.max(r, Math.hypot(px - cx, py - cy));
  }
  return Math.max(r, 1);
}

/** World position of the r0 handle (along rotated local +x from focal). Visual offset is at least a grab radius. */
function radialR0Handle(n: DesignNode, zoom: number) {
  if (typeof n.fill !== "object" || n.fill == null || n.fill.type !== "radial") return null;
  const focal = radialFocal(n);
  if (!focal) return null;
  const outer = radialOuterRadius(n);
  const r0 = Math.max(0, Math.min(0.95, n.fill.r0 ?? 0));
  const innerR = r0 * outer;
  const minVis = 10 / zoom;
  const visR = Math.max(innerR, minVis);
  const ang = degToRad(n.rotation || 0);
  const dx = Math.cos(ang) * visR;
  const dy = Math.sin(ang) * visR;
  return {
    x: focal.x + dx,
    y: focal.y + dy,
    innerR,
    outer,
    r0,
    focal,
    dx,
    dy,
  };
}

function drawGradientRadialHandle(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  selection: string[],
  vp: Viewport,
  dpr: number,
  hoverKey: "angle" | "length" | "offset" | "centre" | "focal" | "r0" | null = null,
  focusedStop: { id: string; index: number } | null = null,
  hoveredStop: number | null = null,
) {
  const selected = nodes.filter((x) => selection.includes(x.id) && x.visible);
  if (!selected.length) return;
  const radials = selected.filter(
    (n) => typeof n.fill === "object" && n.fill != null && n.fill.type === "radial",
  );
  if (radials.length !== selected.length || radials.length === 0) return;
  const fillStr = JSON.stringify(radials[0]!.fill);
  if (!radials.every((n) => JSON.stringify(n.fill) === fillStr)) return;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;

  for (const n of radials) {
    const centre = radialCentre(n);
    if (!centre) continue;
    const focal = radialFocal(n);
    // Centre cross (outer)
    const activeCentre = hoverKey === "centre";
    const r = activeCentre ? 9.5 / zoom : 6 / zoom;
    ctx.strokeStyle = activeCentre ? "rgba(126, 224, 255, 0.95)" : "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = activeCentre ? 2.2 / zoom : 1.4 / zoom;
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centre.x - r * 1.6, centre.y);
    ctx.lineTo(centre.x + r * 1.6, centre.y);
    ctx.moveTo(centre.x, centre.y - r * 1.6);
    ctx.lineTo(centre.x, centre.y + r * 1.6);
    ctx.stroke();
    ctx.fillStyle = activeCentre ? "#a8f0ff" : "#3fc6ff";
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, activeCentre ? 3.4 / zoom : 2.2 / zoom, 0, Math.PI * 2);
    ctx.fill();
    if (activeCentre) {
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, r + 5 / zoom, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(63, 198, 255, 0.45)";
      ctx.lineWidth = 2.8 / zoom;
      ctx.stroke();
      // denser centre cross ticks: short phosphor ticks radiate from each arm end
      ctx.save();
      ctx.strokeStyle = "rgba(168, 240, 255, 0.78)";
      ctx.lineWidth = 1.2 / zoom;
      ctx.lineCap = "round";
      const tickLen = 3.6 / zoom;
      const arm = r * 1.6;
      const ends = [
        { x: centre.x - arm, y: centre.y, dx: -1, dy: 0 },
        { x: centre.x + arm, y: centre.y, dx: 1, dy: 0 },
        { x: centre.x, y: centre.y - arm, dx: 0, dy: -1 },
        { x: centre.x, y: centre.y + arm, dx: 0, dy: 1 },
      ];
      for (const e of ends) {
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + e.dx * tickLen, e.y + e.dy * tickLen);
        ctx.stroke();
      }
      ctx.restore();
    }
    // Focal point (inner) — smaller filled diamond
    if (focal) {
      const activeFocal = hoverKey === "focal";
      const fr = activeFocal ? 7.2 / zoom : 4.5 / zoom;
      ctx.strokeStyle = activeFocal ? "rgba(168, 240, 255, 0.95)" : "rgba(126, 224, 255, 0.9)";
      ctx.fillStyle = activeFocal ? "#a8f0ff" : "#7ee0ff";
      ctx.lineWidth = activeFocal ? 2.2 / zoom : 1.2 / zoom;
      ctx.beginPath();
      ctx.moveTo(focal.x, focal.y - fr);
      ctx.lineTo(focal.x + fr, focal.y);
      ctx.lineTo(focal.x, focal.y + fr);
      ctx.lineTo(focal.x - fr, focal.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (activeFocal) {
        ctx.beginPath();
        ctx.arc(focal.x, focal.y, fr + 4.5 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(63, 198, 255, 0.4)";
        ctx.lineWidth = 2.4 / zoom;
        ctx.stroke();
        // denser focal diamond ticks: short phosphor ticks radiate from each vertex
        ctx.save();
        ctx.strokeStyle = "rgba(168, 240, 255, 0.78)";
        ctx.lineWidth = 1.2 / zoom;
        ctx.lineCap = "round";
        const tickLen = 3.6 / zoom;
        const verts = [
          { x: focal.x, y: focal.y - fr },
          { x: focal.x + fr, y: focal.y },
          { x: focal.x, y: focal.y + fr },
          { x: focal.x - fr, y: focal.y },
        ];
        const dirs = [
          { x: 0, y: -1 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
        ];
        for (let i = 0; i < 4; i++) {
          const v = verts[i]!;
          const d = dirs[i]!;
          ctx.beginPath();
          ctx.moveTo(v.x, v.y);
          ctx.lineTo(v.x + d.x * tickLen, v.y + d.y * tickLen);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    // Inner radius (r0) — dashed circle + phosphor handle to the right of focal
    const r0h = radialR0Handle(n, zoom);
    if (r0h && r0h.innerR > 0.5) {
      ctx.save();
      ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.beginPath();
      ctx.arc(r0h.focal.x, r0h.focal.y, r0h.innerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (r0h) {
      const activeR0 = hoverKey === "r0";
      const hr = activeR0 ? 8.5 / zoom : 5 / zoom;
      ctx.strokeStyle = activeR0 ? "rgba(126, 224, 255, 0.95)" : "rgba(63, 198, 255, 0.95)";
      ctx.fillStyle = activeR0 ? "#7ee0ff" : "#3fc6ff";
      ctx.lineWidth = activeR0 ? 2.2 / zoom : 1.4 / zoom;
      ctx.beginPath();
      ctx.arc(r0h.x, r0h.y, hr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (activeR0) {
        ctx.beginPath();
        ctx.arc(r0h.x, r0h.y, hr + 4.5 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(63, 198, 255, 0.45)";
        ctx.lineWidth = 2.5 / zoom;
        ctx.stroke();
      }
      // small tick inward toward focal along the direction
      const len = Math.hypot(r0h.dx, r0h.dy) || 1;
      const ux = r0h.dx / len;
      const uy = r0h.dy / len;
      ctx.beginPath();
      ctx.moveTo(r0h.x - ux * hr * 1.4, r0h.y - uy * hr * 1.4);
      ctx.lineTo(r0h.x - ux * hr * 0.2, r0h.y - uy * hr * 0.2);
      ctx.stroke();
    }
    // On-canvas radial stops along the same ray (phosphor circles + percent chips)
    const sw = radialStopWorld(n, zoom);
    if (sw && sw.stops.length) {
      // faint ray from inner to outer so the stop line is visible
      const endX = sw.focal.x + sw.ux * sw.outer;
      const endY = sw.focal.y + sw.uy * sw.outer;
      const startX = sw.focal.x + sw.ux * sw.innerR;
      const startY = sw.focal.y + sw.uy * sw.innerR;
      ctx.save();
      const denserRay = hoverKey === "centre" || hoverKey === "focal" || hoverKey === "r0";
      ctx.strokeStyle = denserRay ? "rgba(126, 224, 255, 0.75)" : "rgba(63, 198, 255, 0.35)";
      ctx.lineWidth = denserRay ? 1.6 / zoom : 1 / zoom;
      ctx.setLineDash(denserRay ? [2.2 / zoom, 2.2 / zoom] : [3 / zoom, 3 / zoom]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
      // Denser handle ticks along the ray when a radial dimension is focused
      if (denserRay) {
        const rayLen = Math.hypot(endX - startX, endY - startY);
        if (rayLen > 12 / zoom) {
          const ux = (endX - startX) / rayLen;
          const uy = (endY - startY) / rayLen;
          const px = -uy;
          const py = ux;
          const tickCount = Math.max(3, Math.min(6, Math.round(rayLen / (32 / zoom))));
          ctx.strokeStyle = "rgba(168, 240, 255, 0.68)";
          ctx.lineWidth = 1.05 / zoom;
          ctx.lineCap = "round";
          for (let i = 1; i < tickCount; i++) {
            const t = i / tickCount;
            const tx = startX + (endX - startX) * t;
            const ty = startY + (endY - startY) * t;
            const tl = 2.8 / zoom;
            ctx.beginPath();
            ctx.moveTo(tx - px * tl, ty - py * tl);
            ctx.lineTo(tx + px * tl, ty + py * tl);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
      const isFocusedNode = focusedStop && focusedStop.id === n.id;
      // Denser stop circles when a radial dimension is focused so they stay secondary
      const denserStops = hoverKey === "centre" || hoverKey === "focal" || hoverKey === "r0";
      const chipDraws: { label: string; cx: number; cy: number; emphasize: boolean }[] = [];
      for (let si = 0; si < sw.stops.length; si++) {
        const st = sw.stops[si]!;
        const emphasize = !!(isFocusedNode && focusedStop.index === si) || si === hoveredStop;
        const denser = denserStops && !emphasize;
        const sr = (emphasize ? 6.4 : denser ? 2.8 : 4.2) / zoom;
        ctx.beginPath();
        ctx.arc(st.x, st.y, sr, 0, Math.PI * 2);
        ctx.fillStyle = st.color;
        ctx.fill();
        ctx.strokeStyle = emphasize ? "#a8f0ff" : denser ? "rgba(126, 224, 255, 0.75)" : "#7ee0ff";
        ctx.lineWidth = (emphasize ? 2.2 : denser ? 0.9 : 1.4) / zoom;
        ctx.stroke();
        // dual phosphor outer rings when emphasized
        if (emphasize) {
          ctx.save();
          ctx.globalAlpha = 0.42;
          ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
          ctx.lineWidth = 3.2 / zoom;
          ctx.beginPath();
          ctx.arc(st.x, st.y, sr + 3.8 / zoom, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.18;
          ctx.lineWidth = 5.6 / zoom;
          ctx.beginPath();
          ctx.arc(st.x, st.y, sr + 6.4 / zoom, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(st.x, st.y, sr + (denser ? 1.4 : 2.2) / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = denser ? "rgba(63, 198, 255, 0.35)" : "rgba(63, 198, 255, 0.55)";
          ctx.lineWidth = (denser ? 0.7 : 1.2) / zoom;
          ctx.stroke();
        }
        const pct = Math.round(st.offset * 100);
        const label = `${pct}%`;
        // chip offset perpendicular to the ray
        const off = 14 / zoom;
        const cx = st.x - sw.uy * off;
        const cy = st.y + sw.ux * off;
        chipDraws.push({ label, cx, cy, emphasize });
      }
      // Draw non-emphasized chips first, then emphasized last (stronger dual-glow on top)
      // Denser stop percent chips when a radial dimension is focused so they stay secondary
      for (const c of chipDraws.filter((c) => !c.emphasize)) {
        drawPhosphorValueChip(ctx, c.label, c.cx, c.cy, zoom, false, denserStops);
      }
      for (const c of chipDraws.filter((c) => c.emphasize)) {
        drawPhosphorValueChip(ctx, c.label, c.cx, c.cy, zoom, true, false);
      }
      // Denser radial dimension chips when a stop is focused or hovered
      if (isFocusedNode || hoveredStop != null) {
        const fill = n.fill as { cx?: number; cy?: number; fx?: number; fy?: number; r0?: number };
        const denser = true;
        if (centre) {
          const cxp = Math.round((fill.cx ?? 0.5) * 100);
          const cyp = Math.round((fill.cy ?? 0.5) * 100);
          drawPhosphorValueChip(ctx, `${cxp},${cyp}`, centre.x + 5 / zoom, centre.y - 3 / zoom, zoom, false, denser);
        }
        if (focal) {
          const ox = fill.cx ?? 0.5;
          const oy = fill.cy ?? 0.5;
          const fxp = Math.round((fill.fx ?? ox) * 100);
          const fyp = Math.round((fill.fy ?? oy) * 100);
          drawPhosphorValueChip(ctx, `${fxp},${fyp}`, focal.x + 5 / zoom, focal.y - 3 / zoom, zoom, false, denser);
        }
        const r0h = radialR0Handle(n, zoom);
        if (r0h) {
          const r0 = Math.round((fill.r0 ?? 0) * 100);
          drawPhosphorValueChip(ctx, `In${r0}%`, r0h.x + 5 / zoom, r0h.y - 3 / zoom, zoom, false, denser);
        }
      }
    }
  }
  ctx.restore();
}

function drawGradientAngleScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
  focusKey: "angle" | "length" | "offset" | "angle-only" | "length-only" | null = null,
) {
  const effectiveFocus = focusKey === "angle-only" ? "angle" : focusKey === "length-only" ? "length" : focusKey;
  if (!scrubId) return;
  const multi = selection.length > 1 && selection.includes(scrubId);
  const targets = multi
    ? nodes.filter((n) => selection.includes(n.id) && n.visible && typeof n.fill === "object" && n.fill != null && "angle" in n.fill)
    : nodes.filter((n) => n.id === scrubId && n.visible && typeof n.fill === "object" && n.fill != null && "angle" in n.fill);
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    const fill = n.fill as { angle?: number; llen?: number; lox?: number; loy?: number };
    const angle = Math.round(fill.angle ?? 0);
    const llen = Math.round((fill.llen ?? 1) * 100);
    const lox = Math.round((fill.lox ?? 0.5) * 100);
    const loy = Math.round((fill.loy ?? 0.5) * 100);
    const hnd = gradientAngleHandle(n, zoom);
    if (hnd) {
      // Denser separate chips attached to handles. Focused dimension last (on top), slightly larger/brighter.
      const chips = [
        { key: "angle" as const, label: `∠${angle}°`, x: hnd.cx + 8 / zoom, y: hnd.cy - 6 / zoom },
        { key: "length" as const, label: `${llen}%`, x: hnd.ex + 8 / zoom, y: hnd.ey - 6 / zoom },
        { key: "offset" as const, label: `${lox},${loy}`, x: hnd.cx - 28 / zoom, y: hnd.cy + 18 / zoom },
      ];
      const ordered = effectiveFocus
        ? [...chips.filter((c) => c.key !== effectiveFocus), ...chips.filter((c) => c.key === effectiveFocus)]
        : chips;
      for (const c of ordered) {
        drawPhosphorValueChip(ctx, c.label, c.x, c.y, zoom, c.key === effectiveFocus);
      }
    } else {
      const label = `∠${angle}° · ${llen}% · ${lox},${loy}`;
      ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
      const tw = ctx.measureText(label).width;
      const chipW = tw + 8 / zoom;
      drawPhosphorValueChip(ctx, label, x + w - chipW, y - 2 / zoom, zoom);
    }
  }
  ctx.restore();
}

function drawRadialR0ScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
  focusKey: "centre" | "focal" | "r0" | null = null,
) {
  if (!scrubId) return;
  const multi = selection.length > 1 && selection.includes(scrubId);
  const targets = multi
    ? nodes.filter((n) => selection.includes(n.id) && n.visible && typeof n.fill === "object" && n.fill != null && n.fill.type === "radial")
    : nodes.filter((n) => n.id === scrubId && n.visible && typeof n.fill === "object" && n.fill != null && n.fill.type === "radial");
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    const fill = n.fill as { r0?: number };
    const r0 = Math.round((fill.r0 ?? 0) * 100);
    const r0h = radialR0Handle(n, zoom);
    const emphasize = focusKey === "r0";
    if (r0h) {
      drawPhosphorValueChip(ctx, `Inner ${r0}%`, r0h.x + 10 / zoom, r0h.y - 6 / zoom, zoom, emphasize);
    } else {
      const label = `Inner ${r0}%`;
      const tw = ctx.measureText(label).width;
      drawPhosphorValueChip(ctx, label, x + w - (tw + 8 / zoom), y - 2 / zoom, zoom, emphasize);
    }
  }
  ctx.restore();
}

function drawRadialCentreScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
  focusKey: "centre" | "focal" | "r0" | null = null,
) {
  if (!scrubId) return;
  const multi = selection.length > 1 && selection.includes(scrubId);
  const targets = multi
    ? nodes.filter((n) => selection.includes(n.id) && n.visible && typeof n.fill === "object" && n.fill != null && n.fill.type === "radial")
    : nodes.filter((n) => n.id === scrubId && n.visible && typeof n.fill === "object" && n.fill != null && n.fill.type === "radial");
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    const fill = n.fill as { cx?: number; cy?: number };
    const cxp = Math.round((fill.cx ?? 0.5) * 100);
    const cyp = Math.round((fill.cy ?? 0.5) * 100);
    const centre = radialCentre(n);
    const emphasize = focusKey === "centre";
    if (centre) {
      drawPhosphorValueChip(ctx, `Centre ${cxp}%, ${cyp}%`, centre.x + 10 / zoom, centre.y - 8 / zoom, zoom, emphasize);
    } else {
      const label = `Centre ${cxp}%, ${cyp}%`;
      const tw = ctx.measureText(label).width;
      drawPhosphorValueChip(ctx, label, x + w - (tw + 8 / zoom), y - 2 / zoom, zoom, emphasize);
    }
  }
  ctx.restore();
}

function drawRadialFocalScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
  focusKey: "centre" | "focal" | "r0" | null = null,
) {
  if (!scrubId) return;
  const multi = selection.length > 1 && selection.includes(scrubId);
  const targets = multi
    ? nodes.filter((n) => selection.includes(n.id) && n.visible && typeof n.fill === "object" && n.fill != null && n.fill.type === "radial")
    : nodes.filter((n) => n.id === scrubId && n.visible && typeof n.fill === "object" && n.fill != null && n.fill.type === "radial");
  if (!targets.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const zoom = vp.zoom;
  for (const n of targets) {
    const pad = 4 / zoom;
    const x = n.x - pad;
    const y = n.y - pad;
    const w = n.w + pad * 2;
    const h = n.h + pad * 2;
    ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
    ctx.lineWidth = 6 / zoom;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);
    const fill = n.fill as { fx?: number; fy?: number; cx?: number; cy?: number };
    const ox = fill.cx ?? 0.5;
    const oy = fill.cy ?? 0.5;
    const fx = Math.round((fill.fx ?? ox) * 100);
    const fy = Math.round((fill.fy ?? oy) * 100);
    const focal = radialFocal(n);
    const emphasize = focusKey === "focal";
    if (focal) {
      drawPhosphorValueChip(ctx, `Focal ${fx}%, ${fy}%`, focal.x + 10 / zoom, focal.y - 8 / zoom, zoom, emphasize);
    } else {
      const label = `Focal ${fx}%, ${fy}%`;
      const tw = ctx.measureText(label).width;
      drawPhosphorValueChip(ctx, label, x + w - (tw + 8 / zoom), y - 2 / zoom, zoom, emphasize);
    }
  }
  ctx.restore();
}

function drawSidesScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(
    ctx,
    nodes,
    scrubId,
    selection,
    vp,
    dpr,
    (n) => "sides" in n && typeof (n as { sides?: number }).sides === "number",
    (n) => `Sides ${Math.round(((n as { sides?: number }).sides) ?? 5)}`,
  );
}

function drawHeadScaleScrubChips(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  scrubId: string | null,
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  drawLiveScrubChips(
    ctx,
    nodes,
    scrubId,
    selection,
    vp,
    dpr,
    (n) => "headScale" in n && typeof (n as { headScale?: number }).headScale === "number",
    (n) => {
      const h = ((n as { headScale?: number }).headScale) ?? 1;
      return `Head ${Math.round(h * 100)}%`;
    },
  );
}


function drawSelection(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  selection: string[],
  vp: Viewport,
  dpr: number,
  pathEditHit: PathEditHit | null,
  pathPointSelection: { index: number; hole?: number }[] = [],
  scaleFlip: { x: boolean; y: boolean } | null = null,
  showLengths = false,
  rotateAngle: number | null = null,
  alignHover: AlignEdge | null = null,
) {
  const selected = nodes.filter((n) => selection.includes(n.id) && n.visible);
  if (!selected.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const phosphor = "#3fc6ff";
  for (const n of selected) {
    if (isPath(n) && n.points.length) {
      drawPathNodeTangents(ctx, n, vp.zoom, pathEditHit, showLengths);
      // Multi-selected point highlights (phosphor fill)
      if (pathPointSelection.length > 1) {
        ctx.save();
        const c = nodeCenter(n);
        if (n.rotation) {
          ctx.translate(c.x, c.y);
          ctx.rotate(degToRad(n.rotation));
          ctx.translate(-c.x, -c.y);
        }
        ctx.fillStyle = "rgba(63,198,255,0.9)";
        ctx.strokeStyle = "#7ee0ff";
        const r = 4.5 / vp.zoom;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const sel of pathPointSelection) {
          const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
          const pt = ring?.[sel.index];
          if (!pt) continue;
          const ax = n.x + pt.x;
          const ay = n.y + pt.y;
          // world for box (rotation already applied by the save/restore transform above? wait)
          // The transform is around center, so points are drawn in rotated space.
          // For box we want axis-aligned in the current (rotated) context? Or world.
          // Simpler: compute local min/max then draw in the transformed space.
          minX = Math.min(minX, ax);
          minY = Math.min(minY, ay);
          maxX = Math.max(maxX, ax);
          maxY = Math.max(maxY, ay);
          ctx.beginPath();
          ctx.arc(ax, ay, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1 / vp.zoom;
          ctx.stroke();
        }
        if (Number.isFinite(minX) && pathPointSelection.length > 1) {
          const pad = 6 / vp.zoom;
          const boxX = minX - pad;
          const boxY = minY - pad;
          const boxW = maxX - minX + pad * 2;
          const boxH = maxY - minY + pad * 2;
          drawPhosphorSelectionOutline(ctx, boxX, boxY, boxW, boxH, vp.zoom, true);

          // Flip feedback: reverse-arrow indicators on individual flipped axes
          if (scaleFlip && (scaleFlip.x || scaleFlip.y)) {
            ctx.save();
            ctx.strokeStyle = "#ff6b6b";
            ctx.fillStyle = "#ff6b6b";
            ctx.lineWidth = 1.5 / vp.zoom;
            ctx.setLineDash([]);
            const bx = minX - pad;
            const by = minY - pad;
            const bw = maxX - minX + pad * 2;
            const bh = maxY - minY + pad * 2;
            const cx = bx + bw / 2;
            const cy = by + bh / 2;
            const arrowLen = Math.min(bw, bh) * 0.25;
            const head = 6 / vp.zoom;

            function drawArrowhead(ax: number, ay: number, angle: number) {
              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(ax + Math.cos(angle + 2.4) * head, ay + Math.sin(angle + 2.4) * head);
              ctx.lineTo(ax + Math.cos(angle - 2.4) * head, ay + Math.sin(angle - 2.4) * head);
              ctx.closePath();
              ctx.fill();
            }

            if (scaleFlip.x) {
              // Horizontal reverse arrows (pointing inward)
              const left = cx - arrowLen;
              const right = cx + arrowLen;
              ctx.beginPath();
              ctx.moveTo(left + head * 0.6, cy);
              ctx.lineTo(right - head * 0.6, cy);
              ctx.stroke();
              drawArrowhead(left, cy, Math.PI); // pointing left
              drawArrowhead(right, cy, 0); // pointing right
            }
            if (scaleFlip.y) {
              // Vertical reverse arrows (pointing inward)
              const top = cy - arrowLen;
              const bot = cy + arrowLen;
              ctx.beginPath();
              ctx.moveTo(cx, top + head * 0.6);
              ctx.lineTo(cx, bot - head * 0.6);
              ctx.stroke();
              drawArrowhead(cx, top, -Math.PI / 2); // pointing up
              drawArrowhead(cx, bot, Math.PI / 2); // pointing down
            }
            ctx.restore();
          }

          // Scale handles (corners + mid-edges)
          const size = 8 / vp.zoom;
          const half = size / 2;
          const handles: [number, number][] = [
            [boxX, boxY],
            [boxX + boxW / 2, boxY],
            [boxX + boxW, boxY],
            [boxX + boxW, boxY + boxH / 2],
            [boxX + boxW, boxY + boxH],
            [boxX + boxW / 2, boxY + boxH],
            [boxX, boxY + boxH],
            [boxX, boxY + boxH / 2],
          ];
          for (const [hx, hy] of handles) {
            drawPhosphorHandle(ctx, hx, hy, size, vp.zoom);
            // Cross the handle if both axes flipped
            if (scaleFlip && scaleFlip.x && scaleFlip.y) {
              ctx.strokeStyle = "#ff6b6b";
              ctx.beginPath();
              ctx.moveTo(hx - half + 1 / vp.zoom, hy - half + 1 / vp.zoom);
              ctx.lineTo(hx + half - 1 / vp.zoom, hy + half - 1 / vp.zoom);
              ctx.moveTo(hx + half - 1 / vp.zoom, hy - half + 1 / vp.zoom);
              ctx.lineTo(hx - half + 1 / vp.zoom, hy + half - 1 / vp.zoom);
              ctx.stroke();
              ctx.strokeStyle = "#3fc6ff";
            }
          }

          // Shared rotation handle at top center of the group box
          const lcx = (minX + maxX) / 2;
          const top = minY - pad;
          const ry = top - 28 / vp.zoom;
          // dual soft outer phosphor on the rotation stem
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
          ctx.lineWidth = 3.2 / vp.zoom;
          ctx.beginPath();
          ctx.moveTo(lcx, top);
          ctx.lineTo(lcx, ry);
          ctx.stroke();
          ctx.globalAlpha = 0.12;
          ctx.lineWidth = 5.5 / vp.zoom;
          ctx.beginPath();
          ctx.moveTo(lcx, top);
          ctx.lineTo(lcx, ry);
          ctx.stroke();
          ctx.restore();
          ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
          ctx.lineWidth = 1.4 / vp.zoom;
          ctx.beginPath();
          ctx.moveTo(lcx, top);
          ctx.lineTo(lcx, ry);
          ctx.stroke();
          // rotation circle with dual outer rings
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
          ctx.lineWidth = 3.2 / vp.zoom;
          ctx.beginPath();
          ctx.arc(lcx, ry, 7 / vp.zoom + 1.6 / vp.zoom, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.12;
          ctx.lineWidth = 5.5 / vp.zoom;
          ctx.beginPath();
          ctx.arc(lcx, ry, 7 / vp.zoom + 3.2 / vp.zoom, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          ctx.beginPath();
          ctx.arc(lcx, ry, 7 / vp.zoom, 0, Math.PI * 2);
          ctx.fillStyle = "#06170f";
          ctx.fill();
          ctx.strokeStyle = "#3fc6ff";
          ctx.lineWidth = 1.2 / vp.zoom;
          ctx.stroke();

          // Live angle badge while rotating the path-point group
          if (rotateAngle != null) {
            const label = `${Math.round(rotateAngle)}°`;
            const offX = 22 / vp.zoom;
            const lx = lcx + offX;
            const ly = ry;
            ctx.save();
            ctx.font = `${Math.max(9, 11 / vp.zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const pad = 5 / vp.zoom;
            const tw = ctx.measureText(label).width;
            const bw = tw + pad * 2;
            const bh = 14 / vp.zoom;
            ctx.fillStyle = "rgba(6, 23, 15, 0.95)";
            ctx.strokeStyle = "#7ee0ff";
            ctx.lineWidth = 1.5 / vp.zoom;
            ctx.beginPath();
            ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 3 / vp.zoom);
            ctx.fill();
            ctx.stroke();
            // small phosphor core
            ctx.fillStyle = "#3fc6ff";
            ctx.beginPath();
            ctx.arc(lx, ly, 1.2 / vp.zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#7ee0ff";
            ctx.fillText(label, lx, ly);
            ctx.restore();
          }

          // Alignment handles: small phosphor circles outward from mid-edges + center/middle
          const alignOff = 16 / vp.zoom;
          const centerOff = 24 / vp.zoom;
          const ar = 5 / vp.zoom;
          const aligns = [
            { x: boxX - alignOff, y: boxY + boxH / 2, edge: "left" as const },
            { x: boxX + boxW + alignOff, y: boxY + boxH / 2, edge: "right" as const },
            { x: boxX + boxW / 2, y: boxY - alignOff, edge: "top" as const },
            { x: boxX + boxW / 2, y: boxY + boxH + alignOff, edge: "bottom" as const },
            { x: boxX - centerOff, y: boxY + boxH / 2, edge: "center" as const },
            { x: boxX + boxW + centerOff, y: boxY + boxH / 2, edge: "center" as const },
            { x: boxX + boxW / 2, y: boxY - centerOff, edge: "middle" as const },
            { x: boxX + boxW / 2, y: boxY + boxH + centerOff, edge: "middle" as const },
          ];
          ctx.fillStyle = "#3fc6ff";
          ctx.strokeStyle = "#06170f";
          ctx.lineWidth = 1 / vp.zoom;
          for (const a of aligns) {
            const r = a.edge === alignHover ? ar * 1.6 : ar;
            // dual soft outer phosphor rings
            ctx.save();
            ctx.globalAlpha = 0.28;
            ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
            ctx.lineWidth = 2.4 / vp.zoom;
            ctx.beginPath();
            ctx.arc(a.x, a.y, r + 1.6 / vp.zoom, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 0.12;
            ctx.lineWidth = 4 / vp.zoom;
            ctx.beginPath();
            ctx.arc(a.x, a.y, r + 3.2 / vp.zoom, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            ctx.beginPath();
            ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            if (a.edge === alignHover) {
              // extra phosphor ring on hover
              ctx.strokeStyle = "rgba(63,198,255,0.9)";
              ctx.lineWidth = 1.5 / vp.zoom;
              ctx.beginPath();
              ctx.arc(a.x, a.y, r + 2 / vp.zoom, 0, Math.PI * 2);
              ctx.stroke();
              ctx.strokeStyle = "#06170f";
              ctx.lineWidth = 1 / vp.zoom;
            }
          }

          // Distribute handles (further out, only when 3+ points): squares with triple-dot motifs
          if (pathPointSelection.length >= 3) {
            const distOff = 32 / vp.zoom;
            const dists = [
              { x: boxX - distOff, y: boxY + boxH / 2, axis: "h" as const }, // left H
              { x: boxX + boxW + distOff, y: boxY + boxH / 2, axis: "h" as const }, // right H
              { x: boxX + boxW / 2, y: boxY - distOff, axis: "v" as const }, // top V
              { x: boxX + boxW / 2, y: boxY + boxH + distOff, axis: "v" as const }, // bottom V
            ];
            for (const d of dists) {
              drawDistHandle(ctx, d.x, d.y, d.axis, vp.zoom);
            }
          }

          // Flip handles (further out): small diamonds with reverse arrows; corners are XY
          const flipOff = 48 / vp.zoom;
          const fs = 7 / vp.zoom;
          const flips = [
            { x: boxX - flipOff, y: boxY + boxH / 2, axis: "x" as const },
            { x: boxX + boxW + flipOff, y: boxY + boxH / 2, axis: "x" as const },
            { x: boxX + boxW / 2, y: boxY - flipOff, axis: "y" as const },
            { x: boxX + boxW / 2, y: boxY + boxH + flipOff, axis: "y" as const },
            { x: boxX - flipOff, y: boxY - flipOff, axis: "xy" as const },
            { x: boxX + boxW + flipOff, y: boxY - flipOff, axis: "xy" as const },
            { x: boxX - flipOff, y: boxY + boxH + flipOff, axis: "xy" as const },
            { x: boxX + boxW + flipOff, y: boxY + boxH + flipOff, axis: "xy" as const },
          ];
          ctx.fillStyle = "#3fc6ff";
          ctx.strokeStyle = "#06170f";
          ctx.lineWidth = 1 / vp.zoom;
          for (const f of flips) {
            // dual soft outer phosphor rings around diamond
            ctx.save();
            ctx.globalAlpha = 0.28;
            ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
            ctx.lineWidth = 2.4 / vp.zoom;
            ctx.beginPath();
            const outer = fs + 1.6 / vp.zoom;
            ctx.moveTo(f.x, f.y - outer);
            ctx.lineTo(f.x + outer, f.y);
            ctx.lineTo(f.x, f.y + outer);
            ctx.lineTo(f.x - outer, f.y);
            ctx.closePath();
            ctx.stroke();
            ctx.globalAlpha = 0.12;
            ctx.lineWidth = 4 / vp.zoom;
            ctx.beginPath();
            const outer2 = fs + 3.2 / vp.zoom;
            ctx.moveTo(f.x, f.y - outer2);
            ctx.lineTo(f.x + outer2, f.y);
            ctx.lineTo(f.x, f.y + outer2);
            ctx.lineTo(f.x - outer2, f.y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();

            // diamond
            ctx.beginPath();
            ctx.moveTo(f.x, f.y - fs);
            ctx.lineTo(f.x + fs, f.y);
            ctx.lineTo(f.x, f.y + fs);
            ctx.lineTo(f.x - fs, f.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // simple reverse arrows or X inside
            ctx.strokeStyle = "#06170f";
            ctx.lineWidth = 1.2 / vp.zoom;
            const al = 3.5 / vp.zoom;
            if (f.axis === "x") {
              ctx.beginPath();
              ctx.moveTo(f.x - al, f.y);
              ctx.lineTo(f.x + al, f.y);
              ctx.moveTo(f.x - al + 1.2 / vp.zoom, f.y - 1.5 / vp.zoom);
              ctx.lineTo(f.x - al, f.y);
              ctx.lineTo(f.x - al + 1.2 / vp.zoom, f.y + 1.5 / vp.zoom);
              ctx.moveTo(f.x + al - 1.2 / vp.zoom, f.y - 1.5 / vp.zoom);
              ctx.lineTo(f.x + al, f.y);
              ctx.lineTo(f.x + al - 1.2 / vp.zoom, f.y + 1.5 / vp.zoom);
              ctx.stroke();
            } else if (f.axis === "y") {
              ctx.beginPath();
              ctx.moveTo(f.x, f.y - al);
              ctx.lineTo(f.x, f.y + al);
              ctx.moveTo(f.x - 1.5 / vp.zoom, f.y - al + 1.2 / vp.zoom);
              ctx.lineTo(f.x, f.y - al);
              ctx.lineTo(f.x + 1.5 / vp.zoom, f.y - al + 1.2 / vp.zoom);
              ctx.moveTo(f.x - 1.5 / vp.zoom, f.y + al - 1.2 / vp.zoom);
              ctx.lineTo(f.x, f.y + al);
              ctx.lineTo(f.x + 1.5 / vp.zoom, f.y + al - 1.2 / vp.zoom);
              ctx.stroke();
            } else {
              // XY: small X
              const xl = 2.8 / vp.zoom;
              ctx.beginPath();
              ctx.moveTo(f.x - xl, f.y - xl);
              ctx.lineTo(f.x + xl, f.y + xl);
              ctx.moveTo(f.x + xl, f.y - xl);
              ctx.lineTo(f.x - xl, f.y + xl);
              ctx.stroke();
            }
            ctx.strokeStyle = "#06170f";
            ctx.lineWidth = 1 / vp.zoom;
          }
        }
        ctx.restore();
      }
      continue;
    }
    ctx.save();
    const c = nodeCenter(n);
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
    // Single selected bitmaps use dedicated crop handles drawn later
    const isSingleBitmap = selection.length === 1 && isBitmap(n);
    if (!isSingleBitmap) {
      drawPhosphorSelectionOutline(ctx, n.x, n.y, n.w, n.h, vp.zoom);
    }
    const size = 8 / vp.zoom;
    const half = size / 2;
    if (!isSingleBitmap) {
      const pts = [
        [n.x, n.y],
        [n.x + n.w / 2, n.y],
        [n.x + n.w, n.y],
        [n.x + n.w, n.y + n.h / 2],
        [n.x + n.w, n.y + n.h],
        [n.x + n.w / 2, n.y + n.h],
        [n.x, n.y + n.h],
        [n.x, n.y + n.h / 2],
      ];
      for (const [px, py] of pts) {
        drawPhosphorHandle(ctx, px!, py!, size, vp.zoom);
      }
    }
    const ry = n.y - 28 / vp.zoom;
    const rx = n.x + n.w / 2;
    // dual soft outer phosphor on the rotation stem
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 3.2 / vp.zoom;
    ctx.beginPath();
    ctx.moveTo(rx, n.y);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 5.5 / vp.zoom;
    ctx.beginPath();
    ctx.moveTo(rx, n.y);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = "rgba(63, 198, 255, 0.9)";
    ctx.lineWidth = 1.4 / vp.zoom;
    ctx.beginPath();
    ctx.moveTo(rx, n.y);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    // rotation circle with dual outer rings
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "rgba(63, 198, 255, 0.85)";
    ctx.lineWidth = 3.2 / vp.zoom;
    ctx.beginPath();
    ctx.arc(rx, ry, 7 / vp.zoom + 1.6 / vp.zoom, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 5.5 / vp.zoom;
    ctx.beginPath();
    ctx.arc(rx, ry, 7 / vp.zoom + 3.2 / vp.zoom, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(rx, ry, 7 / vp.zoom, 0, Math.PI * 2);
    ctx.fillStyle = "#06170f";
    ctx.fill();
    ctx.strokeStyle = "#3fc6ff";
    ctx.lineWidth = 1.2 / vp.zoom;
    ctx.stroke();
    ctx.restore();
  }
  // Layer distribute handles for 3+ selected layers
  if (selection.length >= 3 && pathPointSelection.length === 0) {
    const roots = nodes.filter((n) => selection.includes(n.id) && !n.locked && n.visible);
    if (roots.length >= 3) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of roots) {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + n.w);
        maxY = Math.max(maxY, n.y + n.h);
      }
      const ux = minX, uy = minY, uw = maxX - minX, uh = maxY - minY;
      const distOff = 36 / vp.zoom;
      const distHandles: { x: number; y: number; axis: "h" | "v" }[] = [
        { x: ux - distOff, y: uy + uh / 2, axis: "h" },
        { x: ux + uw + distOff, y: uy + uh / 2, axis: "h" },
        { x: ux + uw / 2, y: uy - distOff, axis: "v" },
        { x: ux + uw / 2, y: uy + uh + distOff, axis: "v" },
      ];
      const hs = 9 / vp.zoom;
      for (const dh of distHandles) {
        drawDistHandle(ctx, dh.x, dh.y, dh.axis, vp.zoom);
      }
    }
  }
  ctx.restore();
}


/** Count unique cut marks a knife stroke would make on visible editable paths. */
function knifeCutCount(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  nodes: DesignNode[],
): number {
  const preferred = useDesign.getState().selection[0];
  const paths: DesignNode[] = [];
  for (const n of nodes) {
    if (!n.visible || n.locked) continue;
    const ep = asEditablePath(n);
    if (ep && ep.points.length >= 2) paths.push(ep);
  }
  const ordered = preferred
    ? ([paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[])
    : paths;

  const seen = new Set<string>();
  for (const n of ordered) {
    const ep = asEditablePath(n);
    if (!ep) continue;
    const prev = knifeStrokePreview(ep, ax, ay, bx, by);
    for (const m of prev.marks) {
      const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
      seen.add(key);
    }
  }
  return seen.size;
}

function drawKnifeStroke(
  ctx: CanvasRenderingContext2D,
  stroke: { ax: number; ay: number; bx: number; by: number },
  doc: { nodes: DesignNode[] },
  vp: Viewport,
  dpr: number,
) {
  const { ax, ay, bx, by } = stroke;
  const dist = Math.hypot(bx - ax, by - ay);
  if (dist < 1) return;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);

  // Live cut line
  ctx.strokeStyle = "#3fc6ff";
  ctx.lineWidth = 1.5 / vp.zoom;
  ctx.setLineDash([6 / vp.zoom, 4 / vp.zoom]);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);

  // Cut marks on paths the stroke crosses
  const preferred = useDesign.getState().selection[0];
  const paths: DesignNode[] = [];
  for (const n of doc.nodes) {
    if (!n.visible || n.locked) continue;
    const p = asEditablePath(n);
    if (p && p.points.length >= 2) paths.push(p);
  }
  const ordered = preferred
    ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[]
    : paths;

  const marks: { x: number; y: number }[] = [];
  const seen = new Set<string>();
  for (const n of ordered) {
    const p = asEditablePath(n);
    if (!p) continue;
    const prev = knifeStrokePreview(p, ax, ay, bx, by);
    for (const m of prev.marks) {
      const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      marks.push(m);
    }
  }

  const r = 4 / vp.zoom;
  ctx.fillStyle = "#3fc6ff";
  ctx.strokeStyle = "#06170f";
  ctx.lineWidth = 1 / vp.zoom;
  for (const m of marks) {
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // small cross
    ctx.beginPath();
    ctx.moveTo(m.x - r * 0.7, m.y);
    ctx.lineTo(m.x + r * 0.7, m.y);
    ctx.moveTo(m.x, m.y - r * 0.7);
    ctx.lineTo(m.x, m.y + r * 0.7);
    ctx.stroke();
  }

  // Live path-split preview: ghost outlines of the resulting pieces + multi-lobe labels
  // with a light explode offset that grows with stroke length so pieces separate visually.
  // Pieces are ordered by angle around the cut midpoint and explode with a staggered factor
  // so later pieces push further out (piece-order animation).
  ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
  ctx.lineWidth = 1.25 / vp.zoom;
  ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
  type PieceInfo = {
    worldCx: number;
    worldCy: number;
    piece: { x: number; y: number }[];
    nodeX: number;
    nodeY: number;
    angle: number;
  };
  const allPieces: PieceInfo[] = [];
  const cutMidX = (ax + bx) / 2;
  const cutMidY = (ay + by) / 2;
  const baseExplode = Math.min(22 / vp.zoom, Math.max(0, dist - 8) * 0.18);
  for (const n of ordered) {
    const p = asEditablePath(n);
    if (!p) continue;
    const pieces = knifeSplitPieces(p, ax, ay, bx, by);
    for (const piece of pieces) {
      if (piece.length < 2) continue;
      let sx = 0, sy = 0;
      for (const pt of piece) {
        sx += pt.x; sy += pt.y;
      }
      const cnt = piece.length;
      const localCx = sx / cnt;
      const localCy = sy / cnt;
      const worldCx = n.x + localCx;
      const worldCy = n.y + localCy;
      const ang = Math.atan2(worldCy - cutMidY, worldCx - cutMidX);
      allPieces.push({
        worldCx,
        worldCy,
        piece,
        nodeX: n.x,
        nodeY: n.y,
        angle: ang,
      });
    }
  }
  // Order pieces angularly around the cut so labels feel sequential
  allPieces.sort((a, b) => a.angle - b.angle);
  const labeled: { cx: number; cy: number; ox: number; oy: number; label: string }[] = [];
  allPieces.forEach((info, idx) => {
    const stagger = allPieces.length > 1 ? 0.65 + 0.55 * (idx / Math.max(1, allPieces.length - 1)) : 1;
    const explode = baseExplode * stagger;
    let ox = 0, oy = 0;
    if (explode > 0.5) {
      const dx = info.worldCx - cutMidX;
      const dy = info.worldCy - cutMidY;
      const len = Math.hypot(dx, dy) || 1;
      ox = (dx / len) * explode;
      oy = (dy / len) * explode;
    }
    ctx.beginPath();
    const first = info.piece[0]!;
    ctx.moveTo(info.nodeX + first.x + ox, info.nodeY + first.y + oy);
    for (let i = 1; i < info.piece.length; i++) {
      const pt = info.piece[i]!;
      ctx.lineTo(info.nodeX + pt.x + ox, info.nodeY + pt.y + oy);
    }
    ctx.stroke();
    labeled.push({
      cx: info.worldCx,
      cy: info.worldCy,
      ox,
      oy,
      label: String(idx + 1),
    });
  });
  ctx.setLineDash([]);

  // Phosphor piece labels when a drag produces multiple pieces (multi-lobe or multi-cut)
  if (labeled.length > 1) {
    ctx.font = `${Math.max(10, 12 / vp.zoom)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const lab of labeled) {
      const lx = lab.cx + lab.ox;
      const ly = lab.cy + lab.oy;
      // faint original-to-exploded connector
      if (Math.hypot(lab.ox, lab.oy) > 2 / vp.zoom) {
        ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
        ctx.lineWidth = 0.75 / vp.zoom;
        ctx.setLineDash([2 / vp.zoom, 2 / vp.zoom]);
        ctx.beginPath();
        ctx.moveTo(lab.cx, lab.cy);
        ctx.lineTo(lx, ly);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const pad = 6 / vp.zoom;
      const tw = ctx.measureText(lab.label).width;
      const bw = tw + pad * 2;
      const bh = 16 / vp.zoom;
      ctx.fillStyle = "rgba(6, 23, 15, 0.88)";
      ctx.strokeStyle = "#3fc6ff";
      ctx.lineWidth = 1.25 / vp.zoom;
      ctx.beginPath();
      ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 4 / vp.zoom);
      ctx.fill();
      ctx.stroke();
      // small phosphor core
      ctx.fillStyle = "#3fc6ff";
      ctx.beginPath();
      ctx.arc(lx, ly, 1.5 / vp.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(lab.label, lx, ly);
    }
  }

  ctx.restore();
}

function drawKnifeHover(
  ctx: CanvasRenderingContext2D,
  mark: { x: number; y: number },
  doc: { nodes: DesignNode[] },
  vp: Viewport,
  dpr: number,
) {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);

  const r = 5 / vp.zoom;
  ctx.fillStyle = "rgba(63, 198, 255, 0.35)";
  ctx.strokeStyle = "#3fc6ff";
  ctx.lineWidth = 1.25 / vp.zoom;
  ctx.beginPath();
  ctx.arc(mark.x, mark.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // small cross
  ctx.beginPath();
  ctx.moveTo(mark.x - r * 0.8, mark.y);
  ctx.lineTo(mark.x + r * 0.8, mark.y);
  ctx.moveTo(mark.x, mark.y - r * 0.8);
  ctx.lineTo(mark.x, mark.y + r * 0.8);
  ctx.stroke();

  // Single-split ghost outlines for the point cut, ordered by angle with light staggered explode
  const preferred = useDesign.getState().selection[0];
  const paths: DesignNode[] = [];
  for (const n of doc.nodes) {
    if (!n.visible || n.locked) continue;
    const p = asEditablePath(n);
    if (p && p.points.length >= 2) paths.push(p);
  }
  const ordered = preferred
    ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[]
    : paths;

  ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
  ctx.lineWidth = 1.25 / vp.zoom;
  ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
  type HoverPiece = {
    worldCx: number;
    worldCy: number;
    piece: { x: number; y: number }[];
    nodeX: number;
    nodeY: number;
    angle: number;
  };
  const hoverPieces: HoverPiece[] = [];
  for (const n of ordered) {
    const p = asEditablePath(n);
    if (!p) continue;
    const local = pathWorldToLocal(p, mark.x, mark.y);
    const pieces = knifePointSplitPieces(p, local.x, local.y, vp.zoom);
    for (const piece of pieces) {
      if (piece.length < 2) continue;
      let sx = 0, sy = 0;
      for (const pt of piece) { sx += pt.x; sy += pt.y; }
      const cnt = piece.length;
      const worldCx = n.x + sx / cnt;
      const worldCy = n.y + sy / cnt;
      const ang = Math.atan2(worldCy - mark.y, worldCx - mark.x);
      hoverPieces.push({
        worldCx,
        worldCy,
        piece,
        nodeX: n.x,
        nodeY: n.y,
        angle: ang,
      });
    }
  }
  hoverPieces.sort((a, b) => a.angle - b.angle);
  const hoverLabeled: { cx: number; cy: number; label: string }[] = [];
  hoverPieces.forEach((info, idx) => {
    const stagger = hoverPieces.length > 1 ? 0.7 + 0.5 * (idx / Math.max(1, hoverPieces.length - 1)) : 1;
    let ox = 0, oy = 0;
    if (hoverPieces.length > 1) {
      const dx = info.worldCx - mark.x;
      const dy = info.worldCy - mark.y;
      const len = Math.hypot(dx, dy) || 1;
      const e = (10 / vp.zoom) * stagger;
      ox = (dx / len) * e;
      oy = (dy / len) * e;
    }
    ctx.beginPath();
    const first = info.piece[0]!;
    ctx.moveTo(info.nodeX + first.x + ox, info.nodeY + first.y + oy);
    for (let i = 1; i < info.piece.length; i++) {
      const pt = info.piece[i]!;
      ctx.lineTo(info.nodeX + pt.x + ox, info.nodeY + pt.y + oy);
    }
    ctx.stroke();
    hoverLabeled.push({ cx: info.worldCx + ox, cy: info.worldCy + oy, label: String(idx + 1) });
  });
  ctx.setLineDash([]);

  if (hoverLabeled.length > 1) {
    ctx.font = `${Math.max(9, 11 / vp.zoom)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const lab of hoverLabeled) {
      const pad = 5 / vp.zoom;
      const tw = ctx.measureText(lab.label).width;
      const bw = tw + pad * 2;
      const bh = 14 / vp.zoom;
      ctx.fillStyle = "rgba(6, 23, 15, 0.82)";
      ctx.strokeStyle = "#3fc6ff";
      ctx.lineWidth = 1 / vp.zoom;
      ctx.beginPath();
      ctx.roundRect(lab.cx - bw / 2, lab.cy - bh / 2, bw, bh, 3 / vp.zoom);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#3fc6ff";
      ctx.fillText(lab.label, lab.cx, lab.cy);
    }
  }

  ctx.restore();
}
