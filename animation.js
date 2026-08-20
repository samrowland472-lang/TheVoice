// Keyframe animation engine.
//
// A scene is a list of shapes; each shape carries keyframes holding its
// properties at given times. Playback interpolates between the surrounding
// keyframes, so a few authored moments produce continuous motion.
//
// Everything renders to a canvas, which means a scene can be exported
// frame by frame — and can react to an audio track, which is what lets
// voice and animation drive each other.

export const SHAPE_TYPES = ['circle', 'rect', 'triangle', 'text', 'wave'];

const EASINGS = {
  linear: (t) => t,
  ease: (t) => t * t * (3 - 2 * t),
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  bounce: (t) => 1 - Math.abs(Math.cos(t * Math.PI * 2)) * (1 - t),
};

export const EASING_NAMES = Object.keys(EASINGS);

let nextId = 1;

export function createShape(type, atTime = 0) {
  return {
    id: `s${nextId++}`,
    type,
    label: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${nextId - 1}`,
    text: type === 'text' ? 'THE VOICE' : '',
    // Whether this shape's scale is driven by the audio track's level.
    reactive: false,
    easing: 'ease',
    keyframes: [
      { time: atTime, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#3fc6ff' },
    ],
  };
}

export function createScene() {
  return { duration: 5, fps: 30, background: '#0a0d0c', shapes: [] };
}

/** Insert or replace a keyframe at `time`, keeping the list time-ordered. */
export function setKeyframe(shape, time, props) {
  const existing = shape.keyframes.find((k) => Math.abs(k.time - time) < 0.001);
  if (existing) {
    Object.assign(existing, props);
    return existing;
  }
  const base = sampleShape(shape, time);
  const kf = { ...base, ...props, time };
  shape.keyframes.push(kf);
  shape.keyframes.sort((a, b) => a.time - b.time);
  return kf;
}

export function removeKeyframe(shape, time) {
  if (shape.keyframes.length <= 1) return false; // a shape must keep one
  const i = shape.keyframes.findIndex((k) => Math.abs(k.time - time) < 0.001);
  if (i === -1) return false;
  shape.keyframes.splice(i, 1);
  return true;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

/** Shape properties at an arbitrary time, interpolated between keyframes. */
export function sampleShape(shape, time) {
  const kfs = shape.keyframes;
  if (!kfs.length) return { x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#3fc6ff' };
  if (time <= kfs[0].time) return { ...kfs[0] };
  if (time >= kfs[kfs.length - 1].time) return { ...kfs[kfs.length - 1] };

  let i = 0;
  while (i < kfs.length - 1 && kfs[i + 1].time <= time) i++;
  const a = kfs[i];
  const b = kfs[i + 1];
  const span = b.time - a.time;
  const raw = span > 0 ? (time - a.time) / span : 0;
  const t = (EASINGS[shape.easing] || EASINGS.linear)(raw);

  return {
    time,
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    scale: lerp(a.scale, b.scale, t),
    rotation: lerp(a.rotation, b.rotation, t),
    opacity: lerp(a.opacity, b.opacity, t),
    color: lerpColor(a.color, b.color, t),
  };
}

/**
 * Draw one frame. `audioLevel` (0..1) scales any shape marked reactive,
 * which is how a voice track visibly drives the animation.
 */
export function renderFrame(ctx, scene, time, width, height, audioLevel = 0) {
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, width, height);

  for (const shape of scene.shapes) {
    const p = sampleShape(shape, time);
    if (p.opacity <= 0.001) continue;

    const cx = (p.x / 100) * width;
    const cy = (p.y / 100) * height;
    const reactBoost = shape.reactive ? 1 + audioLevel * 1.2 : 1;
    const size = Math.min(width, height) * 0.18 * p.scale * reactBoost;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
    ctx.translate(cx, cy);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;

    switch (shape.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'rect':
        ctx.fillRect(-size / 2, -size / 2, size, size);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'text':
        ctx.font = `700 ${size * 0.5}px 'Chakra Petch', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shape.text || '', 0, 0);
        break;
      case 'wave': {
        ctx.lineWidth = Math.max(1, size * 0.05);
        ctx.beginPath();
        const w = size * 2;
        for (let x = -w / 2; x <= w / 2; x += 3) {
          const phase = (x / w) * Math.PI * 4 + time * 4;
          const y = Math.sin(phase) * size * 0.25 * (1 + audioLevel * 2);
          if (x === -w / 2) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }
}

/** Per-frame audio levels, so an export can react without playing anything. */
export function audioLevelTrack(channelData, sampleRate, fps, duration) {
  const frames = Math.ceil(duration * fps);
  const track = new Float32Array(frames);
  const per = Math.floor(sampleRate / fps);
  for (let f = 0; f < frames; f++) {
    const start = f * per;
    let sum = 0;
    let n = 0;
    for (let i = start; i < start + per && i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
      n++;
    }
    track[f] = n ? Math.min(1, Math.sqrt(sum / n) * 3) : 0;
  }
  return track;
}

export function serializeScene(scene) {
  return JSON.stringify(scene, null, 2);
}

export function deserializeScene(json) {
  const scene = typeof json === 'string' ? JSON.parse(json) : json;
  if (!scene || !Array.isArray(scene.shapes)) throw new Error('That file is not a valid scene.');
  for (const s of scene.shapes) {
    if (!Array.isArray(s.keyframes) || !s.keyframes.length) {
      throw new Error('Scene contains a shape with no keyframes.');
    }
  }
  // Keep ids unique against anything already created this session.
  for (const s of scene.shapes) {
    const n = parseInt(String(s.id).replace(/\D/g, ''), 10);
    if (Number.isFinite(n) && n >= nextId) nextId = n + 1;
  }
  return scene;
}
