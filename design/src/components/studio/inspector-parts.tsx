import { clearRecentColors, loadRecentColors, rememberColor } from "@/lib/design/persist";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { nextFromRangeKey } from "./range-keys";
import { CANVAS_FONTS } from "@/lib/design/fonts";
import { paletteFromSrc, paletteName } from "@/lib/design/palette";
import { bestInk, contrastRatio, solidHex, wcagLevel } from "@/lib/design/contrast";
import {
  DEFAULT_SHADOW,
  shadowInset,
  shadowPreviewCss,
  shadowSpread,
  stampShadowBlur,
  stampShadowColor,
  stampShadowInset,
  stampShadowOx,
  stampShadowOy,
  stampShadowSpread,
} from "@/lib/design/shadow";
import { useDesign } from "@/lib/design/store";
import { setStudioStatus } from "@/lib/design/studio-status";
import type { Align, DesignNode, GradientFill, ImageNode, TextNode } from "@/lib/design/types";
import { isGradient } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";

export function FillEditor({ node }: { node: DesignNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const fill = node.fill;
  const gradient = isGradient(fill);

  function toggle() {
    if (gradient) {
      updateNodes([node.id], { fill: fill.stops[0]?.color ?? "#d9f5e3" }, true);
    } else {
      const c = typeof fill === "string" && fill !== "transparent" ? fill : "#3fc6ff";
      updateNodes(
        [node.id],
        {
          fill: {
            type: "linear",
            angle: 180,
            stops: [
              { offset: 0, color: c },
              { offset: 1, color: "#0a0d0c" },
            ],
          } satisfies GradientFill,
        },
        true,
      );
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-dim">Fill</span>
        <button type="button" className="text-[10px] text-phosphor" onClick={toggle}>
          {gradient ? "Solid" : "Gradient"}
        </button>
      </div>
      {!gradient && (
        <input
          type="color"
          className="h-8 w-full rounded-[8px] border border-border"
          value={typeof fill === "string" && fill !== "transparent" ? fill : "#d9f5e3"}
          onChange={(e) => {
            const hex = e.target.value;
            rememberColor(hex);
            updateNodes([node.id], { fill: hex }, true);
          }}
        />
      )}
      {!gradient && (
        <RecentSwatches
          onPick={(hex) => {
            rememberColor(hex);
            updateNodes([node.id], { fill: hex }, true);
          }}
        />
      )}
      {gradient && (
        <div className="flex flex-col gap-2">
          <Field label={`Angle ${fill.angle}°`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={0}
              max={360}
              value={fill.angle}
              onChange={(e) =>
                updateNodes([node.id], { fill: { ...fill, angle: Number(e.target.value) } }, false)
              }
              onPointerDown={() => useDesign.getState().setGradientAngleScrubId(node.id)}
              onPointerUp={() => {
                useDesign.getState().setGradientAngleScrubId(null);
                useDesign.getState().commit();
              }}
              onPointerCancel={() => useDesign.getState().setGradientAngleScrubId(null)}
              onLostPointerCapture={() => useDesign.getState().setGradientAngleScrubId(null)}
              onMouseEnter={() => useDesign.getState().setGradientHoverKey("angle")}
              onFocus={() => useDesign.getState().setGradientHoverKey("angle")}
              onMouseLeave={() => { if (!useDesign.getState().gradientAngleScrubId) useDesign.getState().setGradientHoverKey(null); }}
              onBlur={() => useDesign.getState().setGradientHoverKey(null)}
            />
          </Field>
          {fill.stops.map((stop, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-12 rounded-[8px] border border-border"
                value={stop.color}
                onChange={(e) => {
                  const hex = e.target.value;
                  rememberColor(hex);
                  const stops = fill.stops.map((s, j) => (j === i ? { ...s, color: hex } : s));
                  updateNodes([node.id], { fill: { ...fill, stops } }, true);
                }}
              />
              <input
                type="range"
                className="range-phosphor flex-1"
                min={0}
                max={1}
                step={0.01}
                value={stop.offset}
                onChange={(e) => {
                  const stops = fill.stops.map((s, j) => (j === i ? { ...s, offset: Number(e.target.value) } : s));
                  updateNodes([node.id], { fill: { ...fill, stops } }, false);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function CapIcon({ cap }: { cap: CanvasLineCap }) {
  const common = "stroke-phosphor fill-none";
  if (cap === "round") {
    return (
      <svg width="16" height="8" viewBox="0 0 16 8" className={common} aria-hidden>
        <line x1="2" y1="4" x2="14" y2="4" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (cap === "square") {
    return (
      <svg width="16" height="8" viewBox="0 0 16 8" className={common} aria-hidden>
        <line x1="2" y1="4" x2="14" y2="4" strokeWidth="3" strokeLinecap="square" />
      </svg>
    );
  }
  return (
    <svg width="16" height="8" viewBox="0 0 16 8" className={common} aria-hidden>
      <line x1="3" y1="4" x2="13" y2="4" strokeWidth="3" strokeLinecap="butt" />
    </svg>
  );
}

function JoinIcon({ join }: { join: CanvasLineJoin }) {
  const common = "stroke-phosphor fill-none";
  if (join === "round") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className={common} aria-hidden>
        <path d="M2 12 L7 2 L12 12" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (join === "bevel") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className={common} aria-hidden>
        <path d="M2 12 L7 2 L12 12" strokeWidth="2.5" strokeLinejoin="bevel" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={common} aria-hidden>
      <path d="M2 12 L7 2 L12 12" strokeWidth="2.5" strokeLinejoin="miter" />
    </svg>
  );
}

export function StrokeEditor({ node }: { node: DesignNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const stroke = node.stroke;
  const width = node.strokeWidth;
  const dash = node.strokeDash ?? 0;
  const offset = node.strokeDashOffset ?? 0;
  const cap = node.lineCap ?? "round";
  const join = node.lineJoin ?? "round";
  const miter = node.miterLimit ?? 4;

  const CAPS: CanvasLineCap[] = ["butt", "round", "square"];
  const JOINS: CanvasLineJoin[] = ["miter", "round", "bevel"];

  return (
    <>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-ink-dim">Stroke</span>
      </div>
      <input
        type="color"
        className="h-8 w-full rounded-[8px] border border-border"
        value={stroke === "transparent" || !stroke ? "#3fc6ff" : stroke}
        onChange={(e) => {
          const hex = e.target.value;
          rememberColor(hex);
          updateNodes([node.id], { stroke: hex, strokeWidth: Math.max(width, 1) }, true);
        }}
      />
      <RecentSwatches
        onPick={(hex) => {
          rememberColor(hex);
          updateNodes([node.id], { stroke: hex, strokeWidth: Math.max(width, 1) }, true);
        }}
      />
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[10px] text-ink-dim">Width</span>
        <NumField
          className="field w-16 font-mono"
          value={width}
          min={0}
          aria-label="stroke width"
          onCommit={(n) => updateNodes([node.id], { strokeWidth: n }, true)}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-1" aria-label="stroke width presets">
        {[
          { id: 1, label: "Hair" },
          { id: 2, label: "Fine" },
          { id: 4, label: "Medium" },
          { id: 8, label: "Bold" },
        ].map((preset) => {
          const active = Math.abs(width - preset.id) < 0.05;
          return (
            <button
              key={preset.id}
              type="button"
              className={cn(
                "flex h-7 items-center gap-1 rounded border px-2 text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply ${preset.label} stroke width (${preset.id})`}
              aria-label={`Apply ${preset.label} stroke width`}
              aria-pressed={active}
              onClick={() => {
                updateNodes([node.id], { strokeWidth: preset.id }, true);
                useDesign.getState().setStrokeGhost(null);
                setStudioStatus(`Width · ${preset.label}`);
              }}
              onMouseEnter={() => useDesign.getState().setStrokeGhost({ strokeWidth: preset.id })}
              onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
              onFocus={() => useDesign.getState().setStrokeGhost({ strokeWidth: preset.id })}
              onBlur={() => useDesign.getState().setStrokeGhost(null)}
            >
              <span className="font-mono">{preset.id}</span>
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex flex-wrap gap-1" aria-label="stroke width numeric chips">
        {[0.5, 1.5, 3, 6].map((w) => {
          const active = Math.abs(width - w) < 0.05;
          return (
            <button
              key={w}
              type="button"
              className={cn(
                "flex h-7 items-center justify-center rounded border px-2 font-mono text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply stroke width ${w}`}
              aria-label={`Apply stroke width ${w}`}
              aria-pressed={active}
              onClick={() => {
                updateNodes([node.id], { strokeWidth: w }, true);
                useDesign.getState().setStrokeGhost(null);
                setStudioStatus(`Width · ${w}`);
              }}
              onMouseEnter={() => useDesign.getState().setStrokeGhost({ strokeWidth: w })}
              onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
              onFocus={() => useDesign.getState().setStrokeGhost({ strokeWidth: w })}
              onBlur={() => useDesign.getState().setStrokeGhost(null)}
            >
              {w}
            </button>
          );
        })}
      </div>

      <Field label={`Dash ${Math.round(dash)}`}>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className="range-phosphor min-w-0 flex-1"
            min={0}
            max={48}
            step={1}
            aria-label="stroke dash"
            value={dash}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateNodes([node.id], { strokeDash: v });
              useDesign.getState().setStrokeGhost({ strokeDash: v });
            }}
            onPointerDown={() => useDesign.getState().setStrokeDashScrubId(node.id)}
            onPointerUp={() => {
              useDesign.getState().setStrokeDashScrubId(null);
              useDesign.getState().commit();
              useDesign.getState().setStrokeGhost(null);
            }}
            onPointerCancel={() => useDesign.getState().setStrokeDashScrubId(null)}
            onLostPointerCapture={() => useDesign.getState().setStrokeDashScrubId(null)}
          />
          <NumField
            className="field w-16 font-mono"
            value={dash}
            min={0}
            max={96}
            aria-label="stroke dash"
            onCommit={(n) => updateNodes([node.id], { strokeDash: n }, true)}
          />
        </div>
      </Field>

      <div className="mt-1 flex flex-wrap gap-1" aria-label="dash named presets">
        {[
          { label: "Solid", dash: 0, offset: 0 },
          { label: "Dash", dash: 8, offset: 0 },
          { label: "Dot", dash: 2, offset: 0 },
          { label: "Long", dash: 16, offset: 0 },
          { label: "Gap", dash: 4, offset: 4 },
        ].map((preset) => {
          const active = Math.abs(dash - preset.dash) < 0.05 && Math.abs(offset - preset.offset) < 0.05;
          return (
            <button
              key={preset.label}
              type="button"
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply ${preset.label} dash`}
              aria-label={`Apply ${preset.label} dash preset`}
              aria-pressed={active}
              onClick={() => {
                updateNodes([node.id], { strokeDash: preset.dash, strokeDashOffset: preset.offset }, true);
                useDesign.getState().setStrokeGhost(null);
                setStudioStatus(`${preset.label} dash`);
              }}
              onMouseEnter={() => useDesign.getState().setStrokeGhost({ strokeDash: preset.dash, strokeDashOffset: preset.offset })}
              onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
              onFocus={() => useDesign.getState().setStrokeGhost({ strokeDash: preset.dash, strokeDashOffset: preset.offset })}
              onBlur={() => useDesign.getState().setStrokeGhost(null)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="mt-1 flex flex-wrap gap-1" aria-label="dash pattern numeric chips">
        {[0, 4, 8, 16].map((d) => {
          const active = Math.abs(dash - d) < 0.05;
          return (
            <button
              key={d}
              type="button"
              className={cn(
                "flex h-7 items-center justify-center rounded border px-2 font-mono text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply dash ${d}`}
              aria-label={`Apply dash ${d}`}
              aria-pressed={active}
              onClick={() => {
                updateNodes([node.id], { strokeDash: d }, true);
                useDesign.getState().setStrokeGhost(null);
                setStudioStatus(`Dash · ${d}`);
              }}
              onMouseEnter={() => useDesign.getState().setStrokeGhost({ strokeDash: d })}
              onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
              onFocus={() => useDesign.getState().setStrokeGhost({ strokeDash: d })}
              onBlur={() => useDesign.getState().setStrokeGhost(null)}
            >
              {d}
            </button>
          );
        })}
      </div>

      <Field label={`Offset ${Math.round(offset)}`}>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className="range-phosphor min-w-0 flex-1"
            min={-48}
            max={48}
            step={1}
            aria-label="stroke dash offset"
            value={offset}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateNodes([node.id], { strokeDashOffset: v });
              useDesign.getState().setStrokeGhost({ strokeDashOffset: v });
            }}
            onPointerDown={() => useDesign.getState().setStrokeDashOffsetScrubId(node.id)}
            onPointerUp={() => {
              useDesign.getState().setStrokeDashOffsetScrubId(null);
              useDesign.getState().commit();
              useDesign.getState().setStrokeGhost(null);
            }}
            onPointerCancel={() => useDesign.getState().setStrokeDashOffsetScrubId(null)}
            onLostPointerCapture={() => useDesign.getState().setStrokeDashOffsetScrubId(null)}
          />
          <NumField
            className="field w-16 font-mono"
            value={offset}
            min={-96}
            max={96}
            aria-label="stroke dash offset"
            onCommit={(n) => updateNodes([node.id], { strokeDashOffset: n }, true)}
          />
        </div>
      </Field>

      <div className="mt-1 flex flex-wrap gap-1" aria-label="dash offset numeric chips">
        {[0, 2, 4, 8, -4].map((o) => {
          const active = Math.abs(offset - o) < 0.05;
          return (
            <button
              key={o}
              type="button"
              className={cn(
                "flex h-7 items-center justify-center rounded border px-2 font-mono text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply dash offset ${o}`}
              aria-label={`Apply dash offset ${o}`}
              aria-pressed={active}
              onClick={() => {
                updateNodes([node.id], { strokeDashOffset: o }, true);
                useDesign.getState().setStrokeGhost(null);
                setStudioStatus(`Offset · ${o}`);
              }}
              onMouseEnter={() => useDesign.getState().setStrokeGhost({ strokeDashOffset: o })}
              onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
              onFocus={() => useDesign.getState().setStrokeGhost({ strokeDashOffset: o })}
              onBlur={() => useDesign.getState().setStrokeGhost(null)}
            >
              {o}
            </button>
          );
        })}
      </div>

      <Field label="Cap">
        <select
          className="field"
          value={cap}
          aria-label="stroke line cap"
          onChange={(e) => {
            const v = e.target.value as CanvasLineCap;
            updateNodes([node.id], { lineCap: v }, true);
            useDesign.getState().setStrokeGhost({ lineCap: v });
          }}
          onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
          onBlur={() => useDesign.getState().setStrokeGhost(null)}
        >
          {CAPS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <div className="mt-1 flex flex-wrap gap-1" aria-label="line cap presets">
        {([
          { id: "butt" as const, label: "Butt" },
          { id: "round" as const, label: "Round" },
          { id: "square" as const, label: "Square" },
        ] as const).map((preset) => {
          const active = cap === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={cn(
                "flex h-7 items-center gap-1 rounded border px-1.5 text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply ${preset.label} line cap`}
              aria-label={`Apply ${preset.label} line cap`}
              aria-pressed={active}
              onClick={() => {
                updateNodes([node.id], { lineCap: preset.id }, true);
                useDesign.getState().setStrokeGhost(null);
                setStudioStatus(`Cap · ${preset.label}`);
              }}
              onMouseEnter={() => useDesign.getState().setStrokeGhost({ lineCap: preset.id })}
              onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
              onFocus={() => useDesign.getState().setStrokeGhost({ lineCap: preset.id })}
              onBlur={() => useDesign.getState().setStrokeGhost(null)}
            >
              <CapIcon cap={preset.id} />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      <Field label="Join">
        <select
          className="field"
          value={join}
          aria-label="stroke line join"
          onChange={(e) => {
            const v = e.target.value as CanvasLineJoin;
            updateNodes([node.id], { lineJoin: v }, true);
            useDesign.getState().setStrokeGhost({ lineJoin: v });
          }}
          onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
          onBlur={() => useDesign.getState().setStrokeGhost(null)}
        >
          {JOINS.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
      </Field>
      <div className="mt-1 flex flex-wrap gap-1" aria-label="line join presets">
        {([
          { id: "miter" as const, label: "Miter" },
          { id: "round" as const, label: "Round" },
          { id: "bevel" as const, label: "Bevel" },
        ] as const).map((preset) => {
          const active = join === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={cn(
                "flex h-7 items-center gap-1 rounded border px-1.5 text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply ${preset.label} line join`}
              aria-label={`Apply ${preset.label} line join`}
              aria-pressed={active}
              onClick={() => {
                updateNodes([node.id], { lineJoin: preset.id }, true);
                useDesign.getState().setStrokeGhost(null);
                setStudioStatus(`Join · ${preset.label}`);
              }}
              onMouseEnter={() => useDesign.getState().setStrokeGhost({ lineJoin: preset.id })}
              onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
              onFocus={() => useDesign.getState().setStrokeGhost({ lineJoin: preset.id })}
              onBlur={() => useDesign.getState().setStrokeGhost(null)}
            >
              <JoinIcon join={preset.id} />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {join === "miter" && (
        <Field label={`Miter ${Math.round(miter)}`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className="range-phosphor min-w-0 flex-1"
              min={1}
              max={20}
              step={0.5}
              aria-label="stroke miter limit"
              value={miter}
              onChange={(e) => {
                const v = Number(e.target.value);
                updateNodes([node.id], { miterLimit: v });
                useDesign.getState().setStrokeGhost({ miterLimit: v });
              }}
              onPointerDown={() => useDesign.getState().setMiterLimitScrubId(node.id)}
              onPointerUp={() => {
                useDesign.getState().setMiterLimitScrubId(null);
                useDesign.getState().commit();
                useDesign.getState().setStrokeGhost(null);
              }}
              onPointerCancel={() => useDesign.getState().setMiterLimitScrubId(null)}
              onLostPointerCapture={() => useDesign.getState().setMiterLimitScrubId(null)}
            />
            <NumField
              className="field w-16 font-mono"
              value={miter}
              min={1}
              max={32}
              aria-label="stroke miter limit"
              onCommit={(n) => updateNodes([node.id], { miterLimit: n }, true)}
            />
          </div>
        </Field>
      )}
      {join === "miter" && (
        <div className="mt-1 flex flex-wrap gap-1" aria-label="miter limit presets">
          {[
            { label: "Soft", value: 2 },
            { label: "Default", value: 4 },
            { label: "Sharp", value: 10 },
            { label: "Hard", value: 20 },
          ].map((preset) => {
            const active = Math.abs(miter - preset.value) < 0.05;
            return (
              <button
                key={preset.label}
                type="button"
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] transition-colors",
                  active
                    ? "border-phosphor bg-phosphor/15 text-phosphor"
                    : "border-border text-ink-dim hover:bg-surface hover:text-ink",
                )}
                title={`Apply ${preset.label} miter limit (${preset.value})`}
                aria-label={`Apply ${preset.label} miter limit`}
                aria-pressed={active}
                onClick={() => {
                  updateNodes([node.id], { miterLimit: preset.value, lineJoin: "miter" }, true);
                  useDesign.getState().setStrokeGhost(null);
                  setStudioStatus(`${preset.label} miter · ${preset.value}`);
                }}
                onMouseEnter={() => useDesign.getState().setStrokeGhost({ miterLimit: preset.value, lineJoin: "miter" })}
                onMouseLeave={() => useDesign.getState().setStrokeGhost(null)}
                onFocus={() => useDesign.getState().setStrokeGhost({ miterLimit: preset.value, lineJoin: "miter" })}
                onBlur={() => useDesign.getState().setStrokeGhost(null)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export function RecentSwatches({ onPick }: { onPick: (hex: string) => void }) {
  const [colors, setColors] = useState<string[]>(() => loadRecentColors());
  useEffect(() => {
    const sync = () => setColors(loadRecentColors());
    sync();
    window.addEventListener("voice-design:recent-colors", sync);
    return () => window.removeEventListener("voice-design:recent-colors", sync);
  }, []);
  if (!colors.length) return null;
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] tracking-[0.12em] text-ink-faint uppercase">Recent</span>
        <button
          type="button"
          className="text-[9px] text-ink-faint hover:text-phosphor"
          onClick={() => clearRecentColors()}
          aria-label="Clear recent colours"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((hex) => (
          <button
            key={hex}
            type="button"
            className="size-6 rounded-full border border-border ring-offset-1 hover:ring-1 hover:ring-phosphor/60"
            style={{ background: hex }}
            onClick={() => onPick(hex)}
            aria-label={hex}
            title={hex}
          />
        ))}
      </div>
    </div>
  );
}

export function ShadowEditor({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const mapNodes = useDesign((s) => s.mapNodes);
  const commit = () => useDesign.getState().commit();
  const node = nodes[nodes.length - 1];
  if (!node) return null;
  const ids = nodes.map((n) => n.id);
  const multi = nodes.length > 1;
  const sh = node.shadow;
  const ghost = sh ?? DEFAULT_SHADOW;
  const inset = shadowInset(sh);
  const spread = shadowSpread(sh);
  const mixedOn = multi && new Set(nodes.map((n) => Boolean(n.shadow))).size > 1;
  const mixedColor =
    multi && new Set(nodes.map((n) => n.shadow?.color ?? DEFAULT_SHADOW.color)).size > 1;
  const mixedBlur =
    multi && new Set(nodes.map((n) => n.shadow?.blur ?? DEFAULT_SHADOW.blur)).size > 1;
  const mixedOx =
    multi && new Set(nodes.map((n) => n.shadow?.ox ?? DEFAULT_SHADOW.ox)).size > 1;
  const mixedOy =
    multi && new Set(nodes.map((n) => n.shadow?.oy ?? DEFAULT_SHADOW.oy)).size > 1;
  const mixedSpread = multi && new Set(nodes.map((n) => shadowSpread(n.shadow))).size > 1;
  const mixedInset = multi && new Set(nodes.map((n) => shadowInset(n.shadow))).size > 1;
  const anyOn = nodes.some((n) => n.shadow);

  function stampAll(map: (shadow: DesignNode["shadow"]) => NonNullable<DesignNode["shadow"]>, commitNow = false) {
    mapNodes(
      ids,
      (layer) => ({
        ...layer,
        shadow: map(layer.shadow),
      }),
      commitNow,
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-dim">
          {mixedOn
            ? "Shadow \u00b7 mixed"
            : sh
              ? inset
                ? "Shadow \u00b7 inset"
                : "Shadow \u00b7 drop"
              : "Shadow off"}
        </span>
        <div className="flex items-center gap-2">
          {(sh || mixedOn) && (
            <span
              aria-hidden="true"
              title={inset ? "Inset preview" : "Drop preview"}
              className="inline-block size-7 shrink-0 rounded-[6px] border border-border bg-surface-alt"
              data-shadow-preview={inset ? "inset" : "drop"}
              style={{ boxShadow: shadowPreviewCss(ghost) }}
            />
          )}
          <button
            type="button"
            className="text-[10px] text-phosphor"
            onClick={() => updateNodes(ids, { shadow: anyOn ? null : { ...DEFAULT_SHADOW } }, true)}
          >
            {anyOn ? "Clear" : "Add"}
          </button>
        </div>
      </div>
      {(sh || multi) && (
        <div className="mt-2 flex flex-col gap-2">
          <Field label={mixedColor ? "Colour \u00b7 mixed" : "Colour"}>
            <input
              type="color"
              className={cn("h-8 w-full rounded-[8px] border border-border", mixedColor && "opacity-70")}
              value={ghost.color}
              aria-label={mixedColor ? "layer shadow colour mixed" : "layer shadow colour"}
              onChange={(e) => { rememberColor(e.target.value); stampAll((cur) => stampShadowColor(cur, e.target.value)); }}
              onPointerUp={commit}
            />
          </Field>
          <Field label={mixedBlur ? "Blur \u00b7 mixed" : `Blur ${ghost.blur}`}>
            <input
              type="range"
              className={cn("range-phosphor w-full", mixedBlur && "opacity-70")}
              data-fill-range="shadow-blur"
              style={{ "--fill-percent": String(Math.max(0, Math.min(1, (mixedBlur ? 0 : ghost.blur) / 80))) } as CSSProperties}
              min={0}
              max={80}
              value={mixedBlur ? 0 : ghost.blur}
              aria-label={mixedBlur ? "layer shadow blur mixed" : "layer shadow blur"}
              onChange={(e) => stampAll((cur) => stampShadowBlur(cur, Number(e.target.value)))}
              onPointerDown={() => useDesign.getState().setShadowBlurScrubId(nodes[0]?.id ?? null)}
              onPointerUp={() => {
                useDesign.getState().setShadowBlurScrubId(null);
                commit();
              }}
              onPointerCancel={() => useDesign.getState().setShadowBlurScrubId(null)}
              onLostPointerCapture={() => useDesign.getState().setShadowBlurScrubId(null)}
              onKeyDown={(e) => {
                const curVal = mixedBlur ? 0 : ghost.blur;
                const next = nextFromRangeKey(e, curVal, 0, 80, 1);
                if (next != null) {
                  stampAll((cur) => stampShadowBlur(cur, next));
                  commit();
                }
              }}
            />
          </Field>
          <Field label={mixedOx ? "X \u00b7 mixed" : `X ${ghost.ox}`}>
            <input
              type="range"
              className={cn("range-phosphor w-full", mixedOx && "opacity-70")}
              min={-40}
              max={40}
              value={mixedOx ? 0 : ghost.ox}
              aria-label={mixedOx ? "layer shadow x mixed" : "layer shadow x"}
              onChange={(e) => stampAll((cur) => stampShadowOx(cur, Number(e.target.value)))}
              onPointerDown={() => useDesign.getState().setShadowOxScrubId(nodes[0]?.id ?? null)}
              onPointerUp={() => {
                useDesign.getState().setShadowOxScrubId(null);
                commit();
              }}
              onPointerCancel={() => useDesign.getState().setShadowOxScrubId(null)}
              onLostPointerCapture={() => useDesign.getState().setShadowOxScrubId(null)}
            />
          </Field>
          <Field label={mixedOy ? "Y \u00b7 mixed" : `Y ${ghost.oy}`}>
            <input
              type="range"
              className={cn("range-phosphor w-full", mixedOy && "opacity-70")}
              min={-40}
              max={40}
              value={mixedOy ? 0 : ghost.oy}
              aria-label={mixedOy ? "layer shadow y mixed" : "layer shadow y"}
              onChange={(e) => stampAll((cur) => stampShadowOy(cur, Number(e.target.value)))}
              onPointerDown={() => useDesign.getState().setShadowOyScrubId(nodes[0]?.id ?? null)}
              onPointerUp={() => {
                useDesign.getState().setShadowOyScrubId(null);
                commit();
              }}
              onPointerCancel={() => useDesign.getState().setShadowOyScrubId(null)}
              onLostPointerCapture={() => useDesign.getState().setShadowOyScrubId(null)}
            />
          </Field>
          <Field label={mixedSpread ? "Spread \u00b7 mixed" : `Spread ${spread}`}>
            <input
              type="range"
              className={cn("range-phosphor w-full", mixedSpread && "opacity-70")}
              min={0}
              max={40}
              value={mixedSpread ? 0 : spread}
              aria-label={mixedSpread ? "layer shadow spread mixed" : "layer shadow spread"}
              onChange={(e) => stampAll((cur) => stampShadowSpread(cur, Number(e.target.value)))}
              onPointerDown={() => useDesign.getState().setShadowSpreadScrubId(nodes[0]?.id ?? null)}
              onPointerUp={() => {
                useDesign.getState().setShadowSpreadScrubId(null);
                commit();
              }}
              onPointerCancel={() => useDesign.getState().setShadowSpreadScrubId(null)}
              onLostPointerCapture={() => useDesign.getState().setShadowSpreadScrubId(null)}
            />
          </Field>
          <Field label={mixedInset ? "Inset \u00b7 mixed" : inset ? "Inset" : "Drop"}>
            <label className="flex items-center gap-2 text-[11px] text-ink-dim">
              <input
                type="checkbox"
                checked={mixedInset ? false : inset}
                aria-label={mixedInset ? "layer shadow inset mixed" : "layer shadow inset"}
                onChange={(e) => stampAll((cur) => stampShadowInset(cur, e.target.checked), true)}
              />
              Inset
            </label>
          </Field>
        </div>
      )}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] text-ink-dim">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

export function Swatches({ colors, onPick }: { colors: { name: string; hex: string }[]; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <button
          key={c.hex}
          type="button"
          className="size-6 rounded-full border border-border"
          style={{ background: c.hex }}
          onClick={() => onPick(c.hex)}
          aria-label={c.name}
          title={c.name}
        />
      ))}
    </div>
  );
}
