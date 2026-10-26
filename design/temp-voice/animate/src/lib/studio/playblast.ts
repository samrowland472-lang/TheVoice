import { Muxer, ArrayBufferTarget } from "webm-muxer";
import * as THREE from "three";
import { applyEvaluatedPose, applyShotCamera } from "./pose";
import { useStudio } from "./store";
import type { SceneNode } from "./types";

export type PlayblastFormat = "webm" | "png";
export type PlayblastSize = "viewport" | "720" | "1080";
export type PlayblastRange = "playback" | "full";

export type PlayblastOpts = {
  format: PlayblastFormat;
  size: PlayblastSize;
  range: PlayblastRange;
  shotCamera: boolean;
  hideGrid: boolean;
};

type CaptureCtx = {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
};

let capture: CaptureCtx | null = null;
let cancelled = false;

export function registerCapture(next: CaptureCtx | null) {
  capture = next;
}

export function cancelPlayblast() {
  cancelled = true;
}

const MAX_FRAMES = 720;

function even(n: number) {
  return n & ~1;
}

function slug(name: string) {
  return name.replace(/[^\w]+/g, "-").toLowerCase() || "the-voice";
}

function download(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function applySceneAtTime(t: number, shotCamera: boolean) {
  applyEvaluatedPose(t);
  if (!shotCamera || !capture) return;
  const s = useStudio.getState();
  const camNode: SceneNode | undefined =
    (s.selectedId && s.nodes[s.selectedId]?.kind === "camera"
      ? s.nodes[s.selectedId]
      : Object.values(s.nodes).find((n) => n.kind === "camera")) ?? undefined;
  if (!camNode) return;
  applyShotCamera(capture.camera, t, camNode);
}

function resolveSize(src: HTMLCanvasElement, size: PlayblastSize): { w: number; h: number } {
  if (size === "720") return { w: 1280, h: 720 };
  if (size === "1080") return { w: 1920, h: 1080 };
  return { w: even(src.width), h: even(src.height) };
}

function blit(src: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const c = off.getContext("2d");
  if (!c) return src;
  c.fillStyle = "#0b0c0e";
  c.fillRect(0, 0, w, h);
  const scale = Math.min(w / src.width, h / src.height);
  const dw = src.width * scale;
  const dh = src.height * scale;
  c.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return off;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not encode frame"));
    }, type);
  });
}

async function pickVideoCodec(
  width: number,
  height: number,
  fps: number,
): Promise<{ encoder: string; mux: string } | null> {
  if (typeof VideoEncoder === "undefined") return null;
  const candidates: { encoder: string; mux: string }[] = [
    { encoder: "vp09.00.10.08", mux: "V_VP9" },
    { encoder: "vp8", mux: "V_VP8" },
  ];
  for (const c of candidates) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec: c.encoder,
        width,
        height,
        framerate: fps,
        bitrate: Math.max(1_200_000, width * height * 4),
      });
      if (support.supported) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function runPlayblast(opts: PlayblastOpts) {
  if (!capture) throw new Error("Viewport is not ready");
  cancelled = false;
  const s = useStudio.getState();
  const start = opts.range === "full" ? 0 : s.playbackStart;
  const end = opts.range === "full" ? s.duration : s.playbackEnd;
  const span = Math.max(1 / s.fps, end - start);
  const total = Math.min(MAX_FRAMES, Math.max(1, Math.round(span * s.fps)));
  const dt = span / total;

  const restore = {
    playing: s.playing,
    grid: s.grid,
    onionSkin: s.onionSkin,
    lookThrough: s.lookThrough,
    currentTime: s.currentTime,
    welcomeOpen: s.welcomeOpen,
  };

  useStudio.setState({
    playing: false,
    playblasting: true,
    playblastFrame: 0,
    playblastTotal: total,
    welcomeOpen: false,
    onionSkin: false,
    lookThrough: opts.shotCamera ? true : s.lookThrough,
    grid: opts.hideGrid ? false : s.grid,
  });

  const src = capture.gl.domElement;
  const { w, h } = resolveSize(src, opts.size);

  try {
    if (opts.format === "png") {
      const files: { name: string; data: Uint8Array }[] = [];
      for (let i = 0; i < total; i++) {
        if (cancelled) break;
        const t = start + i * dt;
        useStudio.setState({ currentTime: t, playblastFrame: i + 1, playblastTotal: total });
        applySceneAtTime(t, opts.shotCamera);
        capture.gl.render(capture.scene, capture.camera);
        const frame = blit(src, w, h);
        const blob = await canvasToBlob(frame, "image/png");
        files.push({
          name: `${slug(s.name)}.${String(i + 1).padStart(4, "0")}.png`,
          data: new Uint8Array(await blob.arrayBuffer()),
        });
        await yieldUi();
      }
      if (!cancelled && files.length) {
        download(zipStore(files), `${slug(s.name)}-playblast.zip`);
      }
      return;
    }

    const codec = await pickVideoCodec(w, h, s.fps);
    if (!codec) throw new Error("This browser cannot encode WebM. Use PNG sequence.");

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: codec.mux, width: w, height: h, frameRate: s.fps },
    });
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta);
      },
      error: (err) => {
        throw err;
      },
    });
    encoder.configure({
      codec: codec.encoder,
      width: w,
      height: h,
      framerate: s.fps,
      bitrate: Math.max(1_200_000, w * h * 4),
    });

    for (let i = 0; i < total; i++) {
      if (cancelled) break;
      const t = start + i * dt;
      useStudio.setState({ currentTime: t, playblastFrame: i + 1, playblastTotal: total });
      applySceneAtTime(t, opts.shotCamera);
      capture.gl.render(capture.scene, capture.camera);
      const frameCanvas = blit(src, w, h);
      const bitmap = await createImageBitmap(frameCanvas);
      const frame = new VideoFrame(bitmap, {
        timestamp: Math.round((i * 1e6) / s.fps),
        duration: Math.round(1e6 / s.fps),
      });
      encoder.encode(frame, { keyFrame: i % Math.max(1, s.fps) === 0 });
      frame.close();
      bitmap.close();
      await yieldUi();
    }

    if (!cancelled) {
      await encoder.flush();
      encoder.close();
      muxer.finalize();
      const buffer = target.buffer;
      if (buffer) {
        download(new Blob([buffer], { type: "video/webm" }), `${slug(s.name)}.webm`);
      }
    } else {
      try {
        encoder.close();
      } catch {
        /* already closed */
      }
    }
  } finally {
    useStudio.setState({
      playing: restore.playing,
      grid: restore.grid,
      onionSkin: restore.onionSkin,
      lookThrough: restore.lookThrough,
      currentTime: restore.currentTime,
      welcomeOpen: restore.welcomeOpen,
      playblasting: false,
      playblastFrame: 0,
      playblastTotal: 0,
    });
  }
}

function yieldUi() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n: number) {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n: number) {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

function zipStore(files: { name: string; data: Uint8Array }[]): Blob {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      name,
      file.data,
    ]);
    const central = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralSize),
    u32(offset),
    u16(0),
  ]);
  return new Blob([concat([...locals, ...centrals, end])], { type: "application/zip" });
}

function concat(parts: Uint8Array[]) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
