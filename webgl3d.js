// The WebGL renderer.
//
// The canvas renderer proved the model: scenes are already three-dimensional,
// lit, and camera-driven. What it cannot give is a depth buffer — painter
// sorting is per shape, so two solids passing through each other draw
// wrongly — or smooth shading, or hundreds of objects. This renderer is the
// swap the data model was built for: it consumes exactly the same resolved
// frame as the canvas path (same sampled camera, same light, same
// interpolated shapes) and differs only in how pixels go down.
//
// Deliberate constraints:
// - WebGL1, one shader program, no extensions: runs on effectively every
//   device that has a GPU at all.
// - The projection is required to agree with camera3d's project() to the
//   pixel — pinned by a parity test — so switching renderers never moves
//   anything on screen.
// - Failure anywhere returns null and the caller stays on the canvas path.
//   A renderer that almost works is worse than the one that always does.

import { framingDistance } from './camera3d.js';
import { MESHES, meshFor, isMeshType } from './mesh3d.js';
import { resolveFrame, getImage, textSlices } from './animation.js';

const VERT = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aUV;
uniform mat4 uMVP;
uniform mat4 uModel;
varying vec3 vNormal;
varying vec2 vUV;
void main() {
  vNormal = mat3(uModel[0].xyz, uModel[1].xyz, uModel[2].xyz) * aNormal;
  vUV = aUV;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
uniform vec3 uLightDir;
uniform float uAmbient;
uniform vec3 uTint;
uniform float uUnlit;
uniform float uUseTex;
uniform sampler2D uTex;
varying vec3 vNormal;
varying vec2 vUV;
void main() {
  vec3 n = normalize(vNormal);
  // Two-sided: culling is off (the depth buffer already handles closed
  // solids), so a face seen from behind lights as if its normal faced us.
  if (!gl_FrontFacing) n = -n;
  float lit = uAmbient + (1.0 - uAmbient) * max(0.0, dot(n, -uLightDir));
  vec3 shade = mix(uTint * lit, vec3(1.0), uUnlit);
  vec4 tex = mix(vec4(1.0), texture2D(uTex, vUV), uUseTex);
  float a = uOpacity * tex.a;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor * tex.rgb * shade, a);
}`;

/* ---------- Small column-major mat4 kit ---------- */

export function mat4Identity() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

export function mat4Multiply(a, b) {
  const out = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1]
                     + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

export function mat4Translate(x, y, z) {
  const m = mat4Identity();
  m[12] = x; m[13] = y; m[14] = z;
  return m;
}

export function mat4Scale(s) {
  return [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1];
}

const RAD = Math.PI / 180;

export function mat4RotX(deg) {
  const c = Math.cos(deg * RAD), s = Math.sin(deg * RAD);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

export function mat4RotY(deg) {
  const c = Math.cos(deg * RAD), s = Math.sin(deg * RAD);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

export function mat4RotZ(deg) {
  const c = Math.cos(deg * RAD), s = Math.sin(deg * RAD);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/**
 * Standard GL perspective. Verified against camera3d.project(): a point
 * pushed through view+projection+viewport must land on the same pixel as
 * the maths renderer puts it, or the two renderers would disagree about
 * where things are the moment one replaced the other.
 */
export function mat4Perspective(fovDeg, aspect, near, far) {
  const f = 1 / Math.tan((fovDeg / 2) * RAD);
  const nf = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ];
}

/**
 * World -> GL camera space.
 *
 * Matches toCameraSpace exactly — translate, then the camera's rotation
 * inverted in Z, Y, X order — followed by diag(1,-1,-1), which maps the
 * scene's axes (y down, z away) onto GL's (y up, z toward the viewer).
 * That diagonal has determinant +1: it flips two axes, so handedness and
 * triangle winding both survive.
 */
export function mat4View(camera) {
  const flip = [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1];
  let m = mat4Multiply(mat4RotZ(-camera.rotZ || 0), mat4Translate(-camera.x, -camera.y, -camera.z));
  m = mat4Multiply(mat4RotY(-camera.rotY || 0), m);
  m = mat4Multiply(mat4RotX(-camera.rotX || 0), m);
  return mat4Multiply(flip, m);
}

/** Shape instance -> world, matching transformVertices: T · S · Rx · Ry · Rz. */
export function mat4Model({ x, y, z = 0, size = 1, rotX = 0, rotY = 0, rotZ = 0 }) {
  let m = mat4Multiply(mat4RotY(rotY), mat4RotZ(rotZ));
  m = mat4Multiply(mat4RotX(rotX), m);
  m = mat4Multiply(mat4Scale(size), m);
  return mat4Multiply(mat4Translate(x, y, z), m);
}

/** Push one world point through the full GL pipeline to screen pixels. */
export function glProjectPoint(point, camera, width, height) {
  const v = mat4Multiply(mat4View(camera), mat4Translate(point.x, point.y, point.z));
  const p = mat4Perspective(camera.fov, width / height, camera.near, 5000);
  const m = mat4Multiply(p, v);
  const cx = m[12], cy = m[13], cw = m[15];
  if (cw <= 0) return { visible: false, x: 0, y: 0 };
  return {
    visible: true,
    x: (cx / cw + 1) / 2 * width,
    y: (1 - (cy / cw + 1) / 2) * height,
  };
}

/* ---------- Geometry ---------- */

/**
 * A mesh as one buffer per material.
 *
 * The shader takes a single colour per draw call, so an imported model
 * whose parts use different materials is split into one group per colour
 * rather than flattened to whichever material happened to come first.
 * Real models have a handful of materials, so this is a handful of draw
 * calls — and a mesh with no materials at all comes back as the single
 * group everything used to be, with a null colour meaning "the shape's
 * own", which is what keeps the built-ins byte-for-byte unchanged.
 */
function meshToGroups(mesh, smooth) {
  const groups = new Map();
  const colours = mesh.faceColours;
  for (let fi = 0; fi < mesh.faces.length; fi++) {
    const key = (colours && colours[fi]) || null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(fi);
  }
  return [...groups.entries()].map(([color, faces]) => ({
    color,
    data: meshToBuffer(mesh, smooth, faces),
  }));
}

function meshToBuffer(mesh, smooth, only = null) {
  const data = [];
  const indices = only || mesh.faces.map((_, i) => i);
  for (const fi of indices) {
    const face = mesh.faces[fi];
    for (let i = 1; i < face.length - 1; i++) {
      for (const idx of [face[0], face[i], face[i + 1]]) {
        const v = mesh.vertices[idx];
        let n;
        if (smooth) {
          // A unit sphere's smooth normal is its own position direction.
          const len = Math.hypot(v.x, v.y, v.z) || 1;
          n = { x: v.x / len, y: v.y / len, z: v.z / len };
        } else {
          const a = mesh.vertices[face[0]];
          const b = mesh.vertices[face[1]];
          const c = mesh.vertices[face[2]];
          const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
          const w = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
          const cr = { x: u.y * w.z - u.z * w.y, y: u.z * w.x - u.x * w.z, z: u.x * w.y - u.y * w.x };
          const len = Math.hypot(cr.x, cr.y, cr.z) || 1;
          n = { x: cr.x / len, y: cr.y / len, z: cr.z / len };
        }
        data.push(v.x, v.y, v.z, n.x, n.y, n.z, 0, 0);
      }
    }
  }
  return data;
}

function circleGeometry(segments = 28) {
  const data = [];
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    data.push(0, 0, 0, 0, 0, -1, 0.5, 0.5,
      Math.cos(a0) * 0.5, Math.sin(a0) * 0.5, 0, 0, 0, -1, 0, 0,
      Math.cos(a1) * 0.5, Math.sin(a1) * 0.5, 0, 0, 0, -1, 0, 0);
  }
  return data;
}

function quadGeometry(hw = 0.5, hh = 0.5) {
  // Two triangles, UVs with v=0 at the top — matching FLIP_Y uploads.
  return [
    -hw, -hh, 0, 0, 0, -1, 0, 0,  hw, -hh, 0, 0, 0, -1, 1, 0,  hw, hh, 0, 0, 0, -1, 1, 1,
    -hw, -hh, 0, 0, 0, -1, 0, 0,  hw, hh, 0, 0, 0, -1, 1, 1,  -hw, hh, 0, 0, 0, -1, 0, 1,
  ];
}

function triangleGeometry() {
  return [
    0, -0.5, 0, 0, 0, -1, 0.5, 0,
    0.5, 0.5, 0, 0, 0, -1, 1, 1,
    -0.5, 0.5, 0, 0, 0, -1, 0, 1,
  ];
}

function waveGeometry(samples = 48) {
  // A sine ribbon spanning x -1..1, matching the canvas wave's proportions.
  const data = [];
  const amp = 0.25, half = 0.035;
  for (let i = 0; i < samples; i++) {
    const x0 = -1 + (2 * i) / samples;
    const x1 = -1 + (2 * (i + 1)) / samples;
    const y0 = Math.sin(x0 * Math.PI * 2) * amp;
    const y1 = Math.sin(x1 * Math.PI * 2) * amp;
    data.push(
      x0, y0 - half, 0, 0, 0, -1, 0, 0,  x1, y1 - half, 0, 0, 0, -1, 0, 0,  x1, y1 + half, 0, 0, 0, -1, 0, 0,
      x0, y0 - half, 0, 0, 0, -1, 0, 0,  x1, y1 + half, 0, 0, 0, -1, 0, 0,  x0, y0 + half, 0, 0, 0, -1, 0, 0,
    );
  }
  return data;
}

/* ---------- Renderer ---------- */

function hexToRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex));
  const n = m ? parseInt(m[1], 16) : 0x3fc6ff;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function createGLRenderer(canvas) {
  let gl;
  try {
    gl = canvas.getContext('webgl', {
      // Needed so exported frames can be read back after the rAF that drew
      // them; without it the buffer may already be cleared at toBlob time.
      preserveDrawingBuffer: true,
      antialias: true,
      alpha: false,
    });
  } catch {
    return null;
  }
  if (!gl) return null;

  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || 'shader failed');
    }
    return sh;
  };

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  } catch {
    return null;
  }
  gl.useProgram(prog);

  const locs = {
    aPos: gl.getAttribLocation(prog, 'aPos'),
    aNormal: gl.getAttribLocation(prog, 'aNormal'),
    aUV: gl.getAttribLocation(prog, 'aUV'),
  };
  for (const name of ['uMVP', 'uModel', 'uColor', 'uOpacity', 'uLightDir',
                      'uAmbient', 'uTint', 'uUnlit', 'uUseTex', 'uTex']) {
    locs[name] = gl.getUniformLocation(prog, name);
  }

  const upload = (data) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return { buf, count: data.length / 8 };
  };

  const geo = {
    circle: upload(circleGeometry()),
    rect: upload(quadGeometry()),
    triangle: upload(triangleGeometry()),
    wave: upload(waveGeometry()),
    quad: upload(quadGeometry()),
  };

  // Every mesh gets a buffer, derived from MESHES rather than hand-listed —
  // a hand-listed subset means adding a shape silently breaks the GPU path,
  // which is exactly how the cylinder shipped without one.
  for (const name of Object.keys(MESHES)) {
    // Smooth normals only for the sphere: it is the one shape whose
    // faceting is a defect rather than a look.
    geo[name] = upload(meshToBuffer(MESHES[name], name === 'sphere'));
  }

  // Imported meshes arrive after the renderer exists, so their buffers are
  // uploaded the first time a frame asks for one and cached from then on.
  // Building them eagerly would mean re-creating the renderer on every
  // import, which throws away every texture with it.
  const meshGroups = new Map();

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  return { gl, prog, locs, geo, canvas, textures: new Map(), meshGroups, upload };
}

/**
 * Every buffer needed to draw one mesh type, uploaded on first use.
 *
 * A built-in resolves to its single pre-uploaded buffer with no colour of
 * its own. An imported model resolves to one group per material, cached
 * against the type so the upload happens once rather than every frame.
 * A type this session has never loaded resolves to nothing, and the caller
 * draws nothing — a scene naming a model you have not imported should
 * come up missing that object, not throw mid-frame.
 */
function meshGroupsFor(r, type) {
  if (r.geo[type]) return [{ geo: r.geo[type], color: null }];
  const cached = r.meshGroups.get(type);
  if (cached) return cached;
  const mesh = meshFor(type);
  if (!mesh) return [];
  const groups = meshToGroups(mesh, false)
    .map((g) => ({ geo: r.upload(g.data), color: g.color }));
  r.meshGroups.set(type, groups);
  return groups;
}

function bindGeometry(r, g) {
  const { gl, locs } = r;
  gl.bindBuffer(gl.ARRAY_BUFFER, g.buf);
  gl.enableVertexAttribArray(locs.aPos);
  gl.vertexAttribPointer(locs.aPos, 3, gl.FLOAT, false, 32, 0);
  gl.enableVertexAttribArray(locs.aNormal);
  gl.vertexAttribPointer(locs.aNormal, 3, gl.FLOAT, false, 32, 12);
  gl.enableVertexAttribArray(locs.aUV);
  gl.vertexAttribPointer(locs.aUV, 2, gl.FLOAT, false, 32, 24);
}

/** A white-glyph texture for a piece of text, cached. */
function textTexture(r, text) {
  const key = `t:${text}`;
  const hit = r.textures.get(key);
  if (hit) return hit;

  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = "700 96px 'Chakra Petch', sans-serif";
  ctx.font = font;
  const w = Math.max(4, Math.ceil(ctx.measureText(text).width));
  c.width = w + 24;
  c.height = 128;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, c.width / 2, c.height / 2 + 6);

  const entry = { tex: makeTexture(r, c), aspect: c.width / c.height };
  cacheTexture(r, key, entry);
  return entry;
}

function imageTexture(r, src) {
  const key = `i:${src.slice(0, 80)}:${src.length}`;
  const hit = r.textures.get(key);
  if (hit) return hit;
  const img = getImage(src);
  if (!img || !img.width) return null;
  const entry = { tex: makeTexture(r, img), aspect: img.width / img.height };
  cacheTexture(r, key, entry);
  return entry;
}

function makeTexture(r, source) {
  const { gl } = r;
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  // Non-power-of-two textures in WebGL1 require clamp + no mipmaps.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

function cacheTexture(r, key, entry) {
  // The cache is bounded the blunt way: text edits mint textures per
  // keystroke, and a Map that only grows is a leak with a GPU attached.
  if (r.textures.size > 64) {
    for (const old of r.textures.values()) r.gl.deleteTexture(old.tex);
    r.textures.clear();
  }
  r.textures.set(key, entry);
}

function drawCall(r, g, mvp, model, { color, opacity, unlit, tex, light }) {
  const { gl, locs } = r;
  bindGeometry(r, g);
  gl.uniformMatrix4fv(locs.uMVP, false, new Float32Array(mvp));
  gl.uniformMatrix4fv(locs.uModel, false, new Float32Array(model));
  gl.uniform3fv(locs.uColor, color);
  gl.uniform1f(locs.uOpacity, opacity);
  gl.uniform1f(locs.uUnlit, unlit ? 1 : 0);
  gl.uniform3fv(locs.uLightDir, light ? [light.dir.x, light.dir.y, light.dir.z] : [0, 0, 1]);
  gl.uniform1f(locs.uAmbient, light ? light.ambient : 1);
  gl.uniform3fv(locs.uTint, light ? [light.tint.r, light.tint.g, light.tint.b] : [1, 1, 1]);
  gl.uniform1f(locs.uUseTex, tex ? 1 : 0);
  if (tex) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(locs.uTex, 0);
  }
  gl.drawArrays(gl.TRIANGLES, 0, g.count);
}

/**
 * Render one frame of a 3D scene.
 *
 * Consumes resolveFrame — the same sampled camera, light and shapes as the
 * canvas renderer — and returns false for anything it cannot render (no
 * camera, lost context), so the caller can fall back rather than show black.
 */
export function glRenderFrame(r, scene, time, audioLevel = 0) {
  const { gl, canvas } = r;
  if (gl.isContextLost && gl.isContextLost()) return false;
  const frame = resolveFrame(scene, time);
  if (!frame.camera) return false;

  const width = canvas.width;
  const height = canvas.height;
  const camera = frame.camera;
  const light = frame.light;

  gl.viewport(0, 0, width, height);
  const [br, bg2, bb] = hexToRgb(scene.background);
  gl.clearColor(br, bg2, bb, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(r.prog);

  const view = mat4View(camera);
  const proj = mat4Perspective(camera.fov, width / height, camera.near, 5000);
  const vp = mat4Multiply(proj, view);

  // Already far-to-near from resolveFrame: opaque work is depth-tested
  // anyway, and the blended shapes need exactly this order.
  for (const entry of frame.order) {
    const shape = entry.shape;
    const p = entry.p;
    if (p.opacity <= 0.001) continue;
    const boost = shape.reactive ? 1 + audioLevel * 1.2 : 1;
    const size = 18 * p.scale * boost;
    if (size <= 0) continue;

    const opaque = p.opacity >= 0.999;
    const color = hexToRgb(p.color);

    if (isMeshType(shape.type)) {
      const groups = meshGroupsFor(r, shape.type);
      if (!groups.length) continue;
      gl.depthMask(opaque);
      const mvp = mat4Multiply(vp, mat4Model({
        x: p.x, y: p.y, z: p.z || 0, size,
        rotX: p.rotX || 0, rotY: p.rotY || 0, rotZ: p.rotation || 0,
      }));
      const normalModel = mat4Model({
        x: 0, y: 0, z: 0, size: 1,
        rotX: p.rotX || 0, rotY: p.rotY || 0, rotZ: p.rotation || 0,
      });
      for (const group of groups) {
        // A material on the mesh replaces the shape's colour rather than
        // tinting it — the same rule the canvas renderer follows, which is
        // what keeps the two paths showing the same picture.
        drawCall(r, group.geo, mvp, normalModel, {
          color: group.color ? hexToRgb(group.color) : color,
          opacity: p.opacity, unlit: false, tex: null, light,
        });
      }
      continue;
    }

    if (shape.type === 'text') {
      const entry2 = textTexture(r, shape.text || ' ');
      // The same slice geometry as the canvas path — one source of truth
      // for where the extrusion sits in space — but here each slice is a
      // real quad in the depth buffer, so solids occlude it correctly.
      const slices = textSlices(p, shape.extrude || 0, camera, width, height);
      gl.depthMask(false);
      const h = size * 0.5;
      const axisModelBase = { rotX: p.rotX || 0, rotY: p.rotY || 0, rotZ: p.rotation || 0 };
      for (const slice of slices) {
        drawCall(r, r.geo.quad, mat4Multiply(vp, mat4Multiply(
          mat4Model({ x: slice.wx, y: slice.wy, z: slice.wz, size: 1, ...axisModelBase }),
          [entry2.aspect * h, 0, 0, 0, 0, h, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        )), mat4Identity(),
        { color: color.map((c) => c * slice.shade), opacity: p.opacity, unlit: true, tex: entry2.tex, light });
      }
      gl.depthMask(true);
      continue;
    }

    if (shape.type === 'image') {
      const texEntry = imageTexture(r, shape.src);
      if (!texEntry) continue;
      const box = size * 1.6;
      const w = texEntry.aspect >= 1 ? box : box * texEntry.aspect;
      const hh = texEntry.aspect >= 1 ? box / texEntry.aspect : box;
      gl.depthMask(false);
      drawCall(r, r.geo.quad, mat4Multiply(vp, mat4Multiply(
        mat4Model({ x: p.x, y: p.y, z: p.z || 0, size: 1,
                    rotX: p.rotX || 0, rotY: p.rotY || 0, rotZ: p.rotation || 0 }),
        [w, 0, 0, 0, 0, hh, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      )), mat4Identity(),
      { color: [1, 1, 1], opacity: p.opacity, unlit: true, tex: texEntry.tex, light });
      gl.depthMask(true);
      continue;
    }

    // Flat billboards: unlit colour, genuinely oriented in space.
    gl.depthMask(opaque);
    drawCall(r, r.geo[shape.type] || r.geo.rect, mat4Multiply(vp, mat4Model({
      x: p.x, y: p.y, z: p.z || 0, size,
      rotX: p.rotX || 0, rotY: p.rotY || 0, rotZ: p.rotation || 0,
    })), mat4Identity(),
    { color, opacity: p.opacity, unlit: true, tex: null, light });
  }
  gl.depthMask(true);
  return true;
}
