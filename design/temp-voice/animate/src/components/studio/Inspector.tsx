import { KeyRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { evalNode, getChannelValue } from "@/lib/studio/eval";
import { channelShort, formatCompact, interpLabel } from "@/lib/studio/format";
import { chainForNode } from "@/lib/studio/ik";
import { wouldCycle, useStudio } from "@/lib/studio/store";
import { INTERPS, type Channel, type Interp, type Track } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

function NumField({
  label,
  channel,
  value,
  onChange,
  step = 0.01,
  displayMul = 1,
}: {
  label: string;
  channel?: Channel;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  displayMul?: number;
}) {
  const shown = value * displayMul;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(shown));
  const drag = useRef<{ x: number; v: number } | null>(null);

  useEffect(() => {
    if (!editing) setDraft(formatCompact(shown, 3));
  }, [shown, editing]);

  return (
    <label className="flex h-7 items-center gap-1.5">
      <span
        className="w-7 shrink-0 cursor-ew-resize select-none text-2xs font-medium text-subtle"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, v: value };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          onChange(drag.current.v + dx * step);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        {label}
      </span>
      {editing ? (
        <input
          className="h-7 min-w-0 flex-1 rounded-sm border border-border bg-bg px-1.5 font-mono text-xs text-fg outline-none ring-0 focus:border-accent"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const n = parseFloat(draft);
            if (Number.isFinite(n)) onChange(displayMul === 1 ? n : n * (1 / displayMul));
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") setEditing(false);
          }}
        />
      ) : (
        <button
          type="button"
          className="h-7 min-w-0 flex-1 rounded-sm border border-transparent bg-bg px-1.5 text-left font-mono text-xs text-fg hover:border-border"
          onClick={() => {
            setDraft(formatCompact(shown, 3));
            setEditing(true);
          }}
        >
          {formatCompact(shown, 3)}
        </button>
      )}
      {channel ? (
        <button
          type="button"
          className="grid size-6 place-items-center rounded-sm text-subtle hover:text-key"
          title="Set keyframe"
          onClick={() => {
            const id = useStudio.getState().selectedId;
            if (id) useStudio.getState().insertKey(id, channel, undefined, value);
          }}
        >
          <KeyRound className="size-3" />
        </button>
      ) : null}
    </label>
  );
}

function VecGroup({
  title,
  prefix,
  x,
  y,
  z,
  degrees,
  onAxis,
}: {
  title: string;
  prefix: "position" | "rotation" | "scale";
  x: number;
  y: number;
  z: number;
  degrees?: boolean;
  onAxis: (axis: "x" | "y" | "z", v: number) => void;
}) {
  const mul = degrees ? RAD2DEG : 1;
  const step = degrees ? DEG2RAD : prefix === "scale" ? 0.01 : 0.01;
  return (
    <div className="space-y-1">
      <div className="text-2xs font-medium uppercase tracking-wider text-subtle">
        {title}
        {degrees ? " °" : ""}
      </div>
      <NumField
        label="X"
        channel={`${prefix}.x`}
        value={x}
        displayMul={mul}
        step={step}
        onChange={(v) => onAxis("x", v)}
      />
      <NumField
        label="Y"
        channel={`${prefix}.y`}
        value={y}
        displayMul={mul}
        step={step}
        onChange={(v) => onAxis("y", v)}
      />
      <NumField
        label="Z"
        channel={`${prefix}.z`}
        value={z}
        displayMul={mul}
        step={step}
        onChange={(v) => onAxis("z", v)}
      />
    </div>
  );
}

function ExprEditor({ track }: { track: Track }) {
  const expr = track.expr;
  if (!expr) return null;
  if (expr.kind === "ramp") {
    const period = Math.abs((Math.PI * 2) / Math.max(Math.abs(expr.rate), 1e-6));
    return (
      <div className="space-y-1 rounded-md border border-border bg-bg p-2">
        <div className="flex items-center justify-between text-2xs text-muted">
          <span>Spin · {period.toFixed(2)}s / turn</span>
          <button
            type="button"
            className="text-subtle hover:text-fg"
            onClick={() => useStudio.getState().clearExpression(track.id)}
          >
            Remove
          </button>
        </div>
        <NumField
          label="Rate"
          value={expr.rate}
          step={0.05}
          onChange={(v) => useStudio.getState().updateExpr(track.id, { rate: v })}
        />
        <NumField
          label="Off"
          value={expr.offset}
          step={0.02}
          onChange={(v) => useStudio.getState().updateExpr(track.id, { offset: v })}
        />
      </div>
    );
  }
  return (
    <div className="space-y-1 rounded-md border border-border bg-bg p-2">
      <div className="flex items-center justify-between text-2xs text-muted">
        <span className="capitalize">
          {expr.kind} · {expr.period.toFixed(2)}s
        </span>
        <button
          type="button"
          className="text-subtle hover:text-fg"
          onClick={() => useStudio.getState().clearExpression(track.id)}
        >
          Remove
        </button>
      </div>
      <NumField
        label="Amp"
        value={expr.amp}
        step={0.02}
        onChange={(v) => useStudio.getState().updateExpr(track.id, { amp: v })}
      />
      <NumField
        label="Per"
        value={expr.period}
        step={0.05}
        onChange={(v) => useStudio.getState().updateExpr(track.id, { period: Math.max(0.05, v) })}
      />
      <NumField
        label="Phs"
        value={expr.phase}
        step={0.05}
        onChange={(v) => useStudio.getState().updateExpr(track.id, { phase: v })}
      />
      <NumField
        label="Off"
        value={expr.offset}
        step={0.02}
        onChange={(v) => useStudio.getState().updateExpr(track.id, { offset: v })}
      />
    </div>
  );
}

function IkPanel({ nodeId }: { nodeId: string }) {
  const chain = useStudio((s) => chainForNode(s.ikChains, nodeId));
  if (!chain) return null;
  const role =
    chain.targetId === nodeId ? "handle" : chain.poleId === nodeId ? "pole" : "driven";
  return (
    <div className="space-y-1.5 rounded-md border border-border bg-bg px-2 py-2">
      <div className="text-2xs font-medium uppercase tracking-wider text-subtle">IK · {chain.name}</div>
      <p className="text-2xs text-muted">
        {role === "handle"
          ? "Move this handle. The limb follows."
          : role === "pole"
            ? "Pole vector — aim the elbow / knee."
            : "This joint is driven. Move the IK handle instead."}
      </p>
      <label className="flex h-7 items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={chain.enabled}
          onChange={() => useStudio.getState().toggleIk(chain.id)}
        />
        Enable IK
      </label>
      {chain.enabled ? (
        <button
          type="button"
          className="h-7 rounded-sm px-2 text-2xs text-muted hover:text-fg"
          onClick={() => useStudio.getState().snapIkToFk(chain.id)}
        >
          Snap handle to FK
        </button>
      ) : null}
    </div>
  );
}

export function Inspector() {
  const selectedId = useStudio((s) => s.selectedId);
  const node = useStudio((s) => (selectedId ? s.nodes[selectedId] : undefined));
  const nodes = useStudio((s) => s.nodes);
  const tracks = useStudio((s) => s.tracks);
  const lookThrough = useStudio((s) => s.lookThrough);
  const selectedTrackId = useStudio((s) => s.selectedTrackId);
  const selectedKeyIndex = useStudio((s) => s.selectedKeyIndex);
  const [time, setTime] = useState(() => useStudio.getState().currentTime);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(useStudio.getState().currentTime);
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  if (!node) {
    return (
      <div className="flex h-full flex-col bg-surface">
        <div className="flex h-8 items-center border-b border-border px-3">
          <span className="text-2xs font-medium uppercase tracking-wider text-subtle">Channel box</span>
        </div>
        <p className="px-3 py-4 text-xs text-muted">Select an object to edit attributes.</p>
      </div>
    );
  }

  const ev = evalNode(node, tracks, time);
  const objectTracks = tracks.filter((t) => t.objectId === node.id);
  const selectedTrack = objectTracks.find((t) => t.id === selectedTrackId) ?? objectTracks.find((t) => t.expr);
  const selectedKey =
    selectedTrack && selectedKeyIndex !== null ? selectedTrack.keys[selectedKeyIndex] : undefined;
  const parents = Object.values(nodes).filter(
    (n) => n.id !== node.id && !wouldCycle(nodes, node.id, n.id),
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-8 items-center border-b border-border px-3">
        <span className="text-2xs font-medium uppercase tracking-wider text-subtle">Channel box</span>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3">
        <input
          className="h-8 w-full rounded-md border border-border bg-bg px-2 text-sm font-medium text-fg outline-none focus:border-accent"
          value={node.name}
          onChange={(e) => useStudio.getState().renameNode(node.id, e.target.value)}
        />
        {node.geometry ? (
          <p className="text-2xs text-subtle">
            Imported mesh · {Math.round(node.geometry.position.length / 3).toLocaleString()} verts
          </p>
        ) : null}

        <IkPanel nodeId={node.id} />

        <label className="block space-y-1">
          <span className="text-2xs font-medium uppercase tracking-wider text-subtle">Parent</span>
          <select
            className="h-8 w-full rounded-md border border-border bg-bg px-2 text-xs text-fg outline-none focus:border-accent"
            value={node.parentId ?? ""}
            onChange={(e) =>
              useStudio.getState().setParent(node.id, e.target.value === "" ? null : e.target.value)
            }
          >
            <option value="">Scene root</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <VecGroup
          title="Translate"
          prefix="position"
          x={ev.position.x}
          y={ev.position.y}
          z={ev.position.z}
          onAxis={(axis, v) =>
            useStudio.getState().setChannelRest(node.id, `position.${axis}` as Channel, v)
          }
        />
        <VecGroup
          title="Rotate"
          prefix="rotation"
          x={ev.rotation.x}
          y={ev.rotation.y}
          z={ev.rotation.z}
          degrees
          onAxis={(axis, v) =>
            useStudio.getState().setChannelRest(node.id, `rotation.${axis}` as Channel, v)
          }
        />
        <VecGroup
          title="Scale"
          prefix="scale"
          x={ev.scale.x}
          y={ev.scale.y}
          z={ev.scale.z}
          onAxis={(axis, v) =>
            useStudio.getState().setChannelRest(node.id, `scale.${axis}` as Channel, v)
          }
        />

        {node.material ? (
          <div className="space-y-1.5">
            <div className="text-2xs font-medium uppercase tracking-wider text-subtle">Material</div>
            <label className="flex h-7 items-center gap-2 text-xs text-muted">
              Color
              <input
                type="color"
                className="h-6 w-10 cursor-pointer rounded-sm border border-border bg-bg"
                value={node.material.color}
                onChange={(e) =>
                  useStudio.getState().updateMaterial(node.id, { color: e.target.value })
                }
              />
            </label>
            <label className="flex h-7 items-center gap-2 text-xs text-muted">
              Emit
              <input
                type="color"
                className="h-6 w-10 cursor-pointer rounded-sm border border-border bg-bg"
                value={node.material.emissive}
                onChange={(e) =>
                  useStudio.getState().updateMaterial(node.id, { emissive: e.target.value })
                }
              />
            </label>
            <NumField
              label="Rgh"
              value={node.material.roughness}
              step={0.005}
              onChange={(v) =>
                useStudio.getState().updateMaterial(node.id, {
                  roughness: Math.min(1, Math.max(0, v)),
                })
              }
            />
            <NumField
              label="Met"
              value={node.material.metalness}
              step={0.005}
              onChange={(v) =>
                useStudio.getState().updateMaterial(node.id, {
                  metalness: Math.min(1, Math.max(0, v)),
                })
              }
            />
            <NumField
              label="Em"
              channel="emissiveIntensity"
              value={ev.emissiveIntensity ?? node.material.emissiveIntensity}
              step={0.01}
              onChange={(v) =>
                useStudio.getState().setChannelRest(node.id, "emissiveIntensity", v)
              }
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                ["Ceramic", { color: "#e8e0d4", roughness: 0.38, metalness: 0.06 }],
                ["Charcoal", { color: "#2a2e36", roughness: 0.55, metalness: 0.18 }],
                ["Steel", { color: "#8aa4b8", roughness: 0.32, metalness: 0.62 }],
                ["Rubber", { color: "#3a3d44", roughness: 0.9, metalness: 0 }],
              ].map(([name, patch]) => (
                <button
                  key={name as string}
                  type="button"
                  className="h-6 rounded-sm border border-border px-2 text-2xs text-muted hover:text-fg"
                  onClick={() =>
                    useStudio.getState().updateMaterial(node.id, patch as { color: string; roughness: number; metalness: number })
                  }
                >
                  {name as string}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {node.light ? (
          <div className="space-y-1.5">
            <div className="text-2xs font-medium uppercase tracking-wider text-subtle">Light</div>
            <label className="flex h-7 items-center gap-2 text-xs text-muted">
              Color
              <input
                type="color"
                className="h-6 w-10 cursor-pointer rounded-sm border border-border bg-bg"
                value={node.light.color}
                onChange={(e) =>
                  useStudio.getState().updateLight(node.id, { color: e.target.value })
                }
              />
            </label>
            <NumField
              label="Int"
              channel="intensity"
              value={ev.intensity ?? node.light.intensity}
              step={0.02}
              onChange={(v) => useStudio.getState().setChannelRest(node.id, "intensity", v)}
            />
          </div>
        ) : null}

        {node.kind === "camera" && node.camera ? (
          <div className="space-y-1.5">
            <div className="text-2xs font-medium uppercase tracking-wider text-subtle">Camera</div>
            <NumField
              label="FOV"
              channel="fov"
              value={ev.fov ?? node.camera.fov}
              step={0.2}
              onChange={(v) => useStudio.getState().setChannelRest(node.id, "fov", v)}
            />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={lookThrough}
                onChange={(e) => useStudio.getState().setLookThrough(e.target.checked)}
              />
              Look through this camera
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              Aim
              <select
                className="h-7 rounded-sm border border-border bg-bg px-1.5 text-xs text-fg"
                value={node.camera.aim ?? "free"}
                onChange={(e) =>
                  useStudio.getState().updateCamera(node.id, {
                    aim: e.target.value as "free" | "origin",
                  })
                }
              >
                <option value="free">Rotation</option>
                <option value="origin">Look at origin</option>
              </select>
            </label>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <div className="text-2xs font-medium uppercase tracking-wider text-subtle">Tracks</div>
          {objectTracks.length === 0 ? (
            <p className="text-xs text-muted">No animation. Pose and press S to key.</p>
          ) : (
            objectTracks.map((tr) => (
              <button
                key={tr.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-1.5 py-1 text-left text-xs",
                  selectedTrackId === tr.id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
                )}
                onClick={() => useStudio.getState().selectKey(tr.id, null)}
              >
                <span>
                  {channelShort(tr.channel)}
                  {tr.expr ? " · expr" : ` · ${tr.keys.length}k`}
                </span>
                <span className="font-mono text-2xs text-subtle">
                  {tr.cycle || tr.expr ? "loop" : "once"}
                </span>
              </button>
            ))
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {(
              [
                ["Sine", "sin"],
                ["Cosine", "cos"],
                ["Spin", "ramp"],
              ] as const
            ).map(([label, kind]) => (
              <button
                key={kind}
                type="button"
                className="h-6 rounded-sm border border-border px-2 text-2xs text-muted hover:text-fg"
                onClick={() =>
                  useStudio.getState().addExpression(node.id, "position.y", kind)
                }
              >
                + {label}
              </button>
            ))}
          </div>
        </div>

        {selectedTrack?.expr ? <ExprEditor track={selectedTrack} /> : null}

        {selectedKey && selectedTrackId && selectedKeyIndex !== null ? (
          <div className="space-y-1.5">
            <div className="text-2xs font-medium uppercase tracking-wider text-subtle">Key</div>
            <label className="flex items-center gap-2 text-xs text-muted">
              Interp
              <select
                className="h-7 flex-1 rounded-sm border border-border bg-bg px-1.5 text-xs text-fg"
                value={selectedKey.interp}
                onChange={(e) =>
                  useStudio
                    .getState()
                    .setKeyInterp(selectedTrackId, selectedKeyIndex, e.target.value as Interp)
                }
              >
                {INTERPS.map((i) => (
                  <option key={i} value={i}>
                    {interpLabel(i)}
                  </option>
                ))}
              </select>
            </label>
            {selectedKey.interp === "bezier" || selectedKey.tanOut || selectedKey.tanIn ? (
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={Boolean(selectedKey.broken)}
                  onChange={(e) =>
                    useStudio.getState().setKeyBroken(selectedTrackId, selectedKeyIndex, e.target.checked)
                  }
                />
                Broken tangents
              </label>
            ) : (
              <p className="text-2xs text-subtle">Curves tab: double-click to insert, drag handles for bezier.</p>
            )}
          </div>
        ) : null}

        <div className="text-2xs text-subtle">
          Rest TX {formatCompact(getChannelValue(node, "position.x"))}
        </div>
      </div>
    </div>
  );
}
