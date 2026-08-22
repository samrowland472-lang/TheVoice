import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Edges,
  Environment,
  Grid,
  OrbitControls,
  TransformControls,
} from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { evalNode } from "@/lib/studio/eval";
import { objectRegistry, registerObject } from "@/lib/studio/registry";
import { childIds, useStudio } from "@/lib/studio/store";
import type { MeshShape, SceneNode, Shading } from "@/lib/studio/types";

function shapeGeometry(shape: MeshShape, anchor?: "center" | "top"): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;
  switch (shape.type) {
    case "box":
      geo = new THREE.BoxGeometry(shape.w, shape.h, shape.d);
      break;
    case "sphere":
      geo = new THREE.SphereGeometry(shape.r, 32, 24);
      break;
    case "cylinder":
      geo = new THREE.CylinderGeometry(shape.rt, shape.rb, shape.h, 32);
      break;
    case "cone":
      geo = new THREE.ConeGeometry(shape.r, shape.h, 28);
      break;
    case "torus":
      geo = new THREE.TorusGeometry(shape.r, shape.tube, 16, 48);
      break;
    case "plane":
      geo = new THREE.PlaneGeometry(shape.w, shape.h);
      geo.rotateX(-Math.PI / 2);
      break;
    case "capsule":
      geo = new THREE.CapsuleGeometry(shape.r, shape.h, 6, 16);
      break;
    case "disk":
      geo = new THREE.CylinderGeometry(shape.r, shape.r, shape.h, 64);
      break;
    default:
      geo = new THREE.BoxGeometry(1, 1, 1);
  }
  if (anchor === "top") {
    let drop = 0;
    if (shape.type === "capsule") drop = shape.h / 2 + shape.r;
    else if (shape.type === "box") drop = shape.h / 2;
    else if (shape.type === "cylinder" || shape.type === "cone" || shape.type === "disk")
      drop = shape.h / 2;
    if (drop) geo.translate(0, -drop, 0);
  }
  return geo;
}

function MeshBody({
  node,
  shading,
  selected,
}: {
  node: SceneNode;
  shading: Shading;
  selected: boolean;
}) {
  const geometry = useMemo(
    () => (node.shape ? shapeGeometry(node.shape, node.anchor) : null),
    [node.shape, node.anchor],
  );
  useEffect(() => () => geometry?.dispose(), [geometry]);

  const mat = node.material;
  const wire = shading === "wire";
  const solid = shading === "solid";
  const color = solid ? "#c8c2b8" : (mat?.color ?? "#d8d2c8");

  if (!geometry || node.kind !== "mesh") return null;

  return (
    <mesh
      geometry={geometry}
      castShadow={node.castShadow && !wire}
      receiveShadow={node.receiveShadow && !wire}
      renderOrder={selected ? 1 : 0}
    >
      {wire ? (
        <meshBasicMaterial color="#c5cdd6" wireframe />
      ) : (
        <meshStandardMaterial
          color={color}
          roughness={solid ? 0.72 : (mat?.roughness ?? 0.45)}
          metalness={solid ? 0.05 : (mat?.metalness ?? 0.08)}
          emissive={solid ? "#000000" : (mat?.emissive ?? "#000000")}
          emissiveIntensity={solid ? 0 : (mat?.emissiveIntensity ?? 0)}
          transparent={(mat?.opacity ?? 1) < 1}
          opacity={mat?.opacity ?? 1}
          envMapIntensity={shading === "rendered" ? 0.85 : 0.2}
        />
      )}
      {selected ? <Edges color="#8aa4b8" threshold={15} /> : null}
    </mesh>
  );
}

function OnionGhosts({ node }: { node: SceneNode }) {
  const enabled = useStudio((s) => s.onionSkin);
  const geometry = useMemo(
    () => (node.shape ? shapeGeometry(node.shape, node.anchor) : null),
    [node.shape, node.anchor],
  );
  const refs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  useEffect(() => () => geometry?.dispose(), [geometry]);

  useFrame(() => {
    if (!enabled) return;
    const s = useStudio.getState();
    const offsets = [-3, -1, 1, 3];
    offsets.forEach((f, i) => {
      const g = refs.current[i];
      if (!g) return;
      const ev = evalNode(node, s.tracks, s.currentTime + f / s.fps);
      g.position.set(ev.position.x, ev.position.y, ev.position.z);
      g.rotation.set(ev.rotation.x, ev.rotation.y, ev.rotation.z);
      g.scale.set(ev.scale.x, ev.scale.y, ev.scale.z);
    });
  });

  if (!enabled || !geometry || node.kind !== "mesh") return null;
  const colors = ["#d98a74", "#d98a74", "#8aa4b8", "#8aa4b8"];
  const opacities = [0.12, 0.22, 0.22, 0.12];
  return (
    <>
      {colors.map((color, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh geometry={geometry} renderOrder={-1}>
            <meshBasicMaterial
              color={color}
              transparent
              opacity={opacities[i]}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function LightBody({ node, selected }: { node: SceneNode; selected: boolean }) {
  const light = node.light;
  if (!light) return null;
  const color = light.color;
  return (
    <group>
      {light.type === "directional" ? (
        <directionalLight
          color={color}
          intensity={light.intensity}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0002}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
      ) : light.type === "point" ? (
        <pointLight
          color={color}
          intensity={light.intensity}
          distance={light.distance || 12}
          castShadow={false}
        />
      ) : light.type === "spot" ? (
        <spotLight
          color={color}
          intensity={light.intensity}
          distance={light.distance || 16}
          angle={light.angle || 0.4}
          penumbra={light.penumbra || 0.3}
          castShadow
        />
      ) : (
        <hemisphereLight args={[color, "#1a1c20", light.intensity]} />
      )}
      <mesh visible>
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial
          color={color}
          wireframe={!selected}
          transparent
          opacity={selected ? 1 : 0.55}
        />
      </mesh>
    </group>
  );
}

function CameraBody({ selected }: { selected: boolean }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.22, 0.16, 0.28]} />
        <meshBasicMaterial color={selected ? "#ecece8" : "#8b909a"} wireframe />
      </mesh>
      <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.16, 4]} />
        <meshBasicMaterial color={selected ? "#8aa4b8" : "#5c616a"} wireframe />
      </mesh>
    </group>
  );
}

function NodeView({ id }: { id: string }) {
  const node = useStudio((s) => s.nodes[id]);
  const selected = useStudio((s) => s.selectedIds.includes(id) || s.selectedId === id);
  const shading = useStudio((s) => s.shading);
  const onionSkin = useStudio((s) => s.onionSkin);
  const children = useStudio(useShallow((s) => childIds(s.nodes, id)));
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    registerObject(id, groupRef.current);
    return () => registerObject(id, null);
  }, [id]);

  if (!node || !node.visible) return null;

  return (
    <>
      {selected && onionSkin && node.kind === "mesh" ? <OnionGhosts node={node} /> : null}
      <group
        ref={groupRef}
        name={id}
        onPointerDown={(e) => {
          e.stopPropagation();
          useStudio.getState().setSelected(id, {
            additive: e.shiftKey || e.metaKey || e.ctrlKey,
          });
        }}
      >
        {node.kind === "mesh" ? (
          <MeshBody node={node} shading={shading} selected={selected} />
        ) : null}
        {node.kind === "light" ? <LightBody node={node} selected={selected} /> : null}
        {node.kind === "camera" ? <CameraBody selected={selected} /> : null}
        {node.kind === "group" ? (
          <mesh visible={selected}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#8aa4b8" wireframe />
          </mesh>
        ) : null}
        {children.map((cid) => (
          <NodeView key={cid} id={cid} />
        ))}
      </group>
    </>
  );
}

function SceneGraph() {
  const roots = useStudio(
    useShallow((s) =>
      Object.values(s.nodes)
        .filter((n) => n.parentId === null)
        .map((n) => n.id),
    ),
  );
  return (
    <>
      {roots.map((id) => (
        <NodeView key={id} id={id} />
      ))}
    </>
  );
}

function Driver() {
  const { camera, gl } = useThree();
  const lookDir = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const s = useStudio.getState();
    let t = s.currentTime;
    if (s.playing && !s.transforming) {
      t += d * s.speed;
      const a = s.playbackStart;
      const b = s.playbackEnd;
      const span = Math.max(0.0001, b - a);
      if (s.loop) {
        if (t >= b) t = a + ((t - a) % span);
        if (t < a) t = b - ((((a - t) % span) + span) % span || span);
      } else {
        if (t >= b) {
          t = b;
          useStudio.setState({ playing: false, currentTime: t });
        } else if (t < a) {
          t = a;
          useStudio.setState({ playing: false, currentTime: t });
        }
      }
      if (t !== s.currentTime) useStudio.setState({ currentTime: t });
    }

    for (const [id, obj] of objectRegistry) {
      if (s.transforming && id === s.selectedId) continue;
      const node = s.nodes[id];
      if (!node) continue;
      const ev = evalNode(node, s.tracks, t);
      obj.position.set(ev.position.x, ev.position.y, ev.position.z);
      obj.rotation.set(ev.rotation.x, ev.rotation.y, ev.rotation.z);
      obj.scale.set(ev.scale.x, ev.scale.y, ev.scale.z);
      if (node.kind === "light") {
        const intensity = ev.intensity ?? node.light?.intensity ?? 1;
        obj.traverse((child) => {
          const l = child as THREE.Light;
          if (l.isLight) l.intensity = intensity;
        });
      }
      if (node.material && ev.emissiveIntensity !== undefined) {
        obj.traverse((child) => {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
          if (mat && mat.isMeshStandardMaterial) {
            mat.emissiveIntensity = ev.emissiveIntensity ?? mat.emissiveIntensity;
            if (ev.opacity !== undefined) {
              mat.opacity = ev.opacity;
              mat.transparent = ev.opacity < 1;
            }
          }
        });
      }
    }

    if (s.lookThrough) {
      const camNode =
        (s.selectedId && s.nodes[s.selectedId]?.kind === "camera"
          ? s.nodes[s.selectedId]
          : Object.values(s.nodes).find((n) => n.kind === "camera")) ?? null;
      if (camNode) {
        const ev = evalNode(camNode, s.tracks, t);
        camera.position.set(ev.position.x, ev.position.y, ev.position.z);
        const aim = camNode.camera?.aim ?? "free";
        if (aim === "origin") {
          lookDir.current.set(0, 1.05, 0);
          camera.up.copy(up.current);
          camera.lookAt(lookDir.current);
        } else {
          camera.rotation.order = "YXZ";
          camera.rotation.set(ev.rotation.x, ev.rotation.y, ev.rotation.z);
        }
        const persp = camera as THREE.PerspectiveCamera;
        if (persp.isPerspectiveCamera) {
          persp.fov = ev.fov ?? camNode.camera?.fov ?? 35;
          persp.updateProjectionMatrix();
        }
      }
    }

    (gl.domElement as HTMLCanvasElement).dataset.ready = "1";
  });

  return null;
}

function Gizmo() {
  const selectedId = useStudio((s) => s.selectedId);
  const tool = useStudio((s) => s.tool);
  const playing = useStudio((s) => s.playing);
  const welcomeOpen = useStudio((s) => s.welcomeOpen);
  const snap = useStudio((s) => s.snap);
  const space = useStudio((s) => s.transformSpace);
  const [object, setObject] = useState<THREE.Object3D | null>(null);

  useFrame(() => {
    const next = selectedId ? (objectRegistry.get(selectedId) ?? null) : null;
    if (next !== object) setObject(next);
  });

  if (!object || tool === "select" || playing || welcomeOpen) return null;
  const node = selectedId ? useStudio.getState().nodes[selectedId] : null;
  if (!node || node.locked) return null;

  return (
    <TransformControls
      object={object}
      mode={tool}
      size={0.85}
      space={space}
      translationSnap={snap ? 0.25 : undefined}
      rotationSnap={snap ? Math.PI / 12 : undefined}
      scaleSnap={snap ? 0.1 : undefined}
      onMouseDown={() => useStudio.getState().setTransforming(true)}
      onMouseUp={() => {
        const id = useStudio.getState().selectedId;
        const obj = id ? objectRegistry.get(id) : null;
        useStudio.getState().setTransforming(false);
        if (!id || !obj) return;
        useStudio.getState().pushHistory();
        useStudio.getState().updateTransform(id, {
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
          rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
          scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
        });
      }}
    />
  );
}

function Marquee({
  onBox,
}: {
  onBox: (box: { left: number; top: number; width: number; height: number } | null) => void;
}) {
  const { camera, gl } = useThree();
  const start = useRef<{ x: number; y: number; additive: boolean } | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const s = useStudio.getState();
      if (s.tool !== "select") return;
      const p = local(e);
      const ndc = new THREE.Vector2((p.x / p.w) * 2 - 1, -(p.y / p.h) * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      const meshes: THREE.Object3D[] = [];
      for (const obj of objectRegistry.values()) {
        obj?.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) meshes.push(c);
        });
      }
      if (ray.intersectObjects(meshes, false).length) return;
      start.current = { x: p.x, y: p.y, additive: e.shiftKey || e.metaKey || e.ctrlKey };
      last.current = { x: p.x, y: p.y };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onMove = (e: PointerEvent) => {
      const st = start.current;
      if (!st) return;
      const p = local(e);
      last.current = { x: p.x, y: p.y };
      const left = Math.min(st.x, p.x);
      const top = Math.min(st.y, p.y);
      const width = Math.abs(p.x - st.x);
      const height = Math.abs(p.y - st.y);
      if (width > 3 || height > 3) onBox({ left, top, width, height });
    };

    const onUp = () => {
      const st = start.current;
      const end = last.current;
      start.current = null;
      last.current = null;
      onBox(null);
      if (!st || !end) return;
      const left = Math.min(st.x, end.x);
      const right = Math.max(st.x, end.x);
      const top = Math.min(st.y, end.y);
      const bottom = Math.max(st.y, end.y);
      if (right - left < 4 && bottom - top < 4) {
        if (!st.additive) useStudio.getState().setSelected(null);
        return;
      }
      const v = new THREE.Vector3();
      const r = el.getBoundingClientRect();
      const hits: string[] = [];
      for (const [id, obj] of objectRegistry) {
        if (!obj) continue;
        const node = useStudio.getState().nodes[id];
        if (!node?.visible) continue;
        obj.updateWorldMatrix(true, false);
        v.setFromMatrixPosition(obj.matrixWorld);
        v.project(camera);
        if (v.z < -1 || v.z > 1) continue;
        const sx = (v.x * 0.5 + 0.5) * r.width;
        const sy = (-v.y * 0.5 + 0.5) * r.height;
        if (sx >= left && sx <= right && sy >= top && sy <= bottom) hits.push(id);
      }
      const s = useStudio.getState();
      if (st.additive) {
        const next = [...new Set([...s.selectedIds, ...hits])];
        s.setSelectedIds(next);
      } else {
        s.setSelectedIds(hits);
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [camera, gl, onBox]);

  return null;
}

function ViewportScene({
  onBox,
}: {
  onBox: (box: { left: number; top: number; width: number; height: number } | null) => void;
}) {
  const grid = useStudio((s) => s.grid);
  const lookThrough = useStudio((s) => s.lookThrough);
  const shading = useStudio((s) => s.shading);
  const transforming = useStudio((s) => s.transforming);
  const tool = useStudio((s) => s.tool);

  return (
    <>
      <color attach="background" args={["#0b0c0e"]} />
      <fog attach="fog" args={["#0b0c0e", 14, 32]} />
      <ambientLight intensity={0.12} />
      {shading === "rendered" ? (
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.38} />
        </Suspense>
      ) : null}
      <SceneGraph />
      <Driver />
      <Gizmo />
      <Marquee onBox={onBox} />
      {grid ? (
        <Grid
          infiniteGrid
          fadeDistance={28}
          fadeStrength={1.4}
          cellSize={0.5}
          sectionSize={2}
          cellColor="#1c1f25"
          sectionColor="#2a2e36"
          position={[0, 0.001, 0]}
        />
      ) : null}
      {shading === "rendered" ? (
        <ContactShadows
          position={[0, 0.011, 0]}
          opacity={0.45}
          scale={16}
          blur={2.4}
          far={6}
        />
      ) : null}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enabled={!transforming && !lookThrough}
        enableRotate={tool !== "select"}
        minDistance={1.2}
        maxDistance={40}
      />
    </>
  );
}

export function Viewport() {
  const [mounted, setMounted] = useState(false);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(
    null,
  );
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="relative isolate z-0 h-full min-h-0 w-full bg-bg" />;
  }
  return (
    <div className="relative isolate z-0 h-full min-h-0 w-full touch-none bg-bg">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          preserveDrawingBuffer: true,
        }}
        camera={{ position: [5.6, 3.2, 6.8], fov: 35, near: 0.05, far: 200 }}
        onPointerMissed={(e) => {
          if (e.button !== 0) return;
          if (useStudio.getState().tool === "select") return;
          if (e.shiftKey || e.metaKey || e.ctrlKey) return;
          useStudio.getState().setSelected(null);
        }}
      >
        <ViewportScene onBox={setBox} />
      </Canvas>
      {box && box.width > 3 && box.height > 3 ? (
        <div
          className="pointer-events-none absolute z-10 border border-accent bg-accent/10"
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
        />
      ) : null}
    </div>
  );
}
