// Describing a scene instead of building it.
//
// Two engines behind one box. The local one is pure pattern matching — it
// costs nothing, works offline, and handles the shapes of request people
// actually make most often ("three blue circles that fade in"). The remote
// one calls Claude through a server function and handles anything.
//
// The local engine exists so the feature is not a paywall. Someone with no
// API key still gets a working "describe it and it appears" box; the model
// is what you reach for when the description outgrows the patterns.
//
// Everything the model returns is untrusted input. It is schema-constrained
// server-side, but a scene arriving here is still clamped field by field
// before it reaches the renderer — a rogue `scale: 1e9` or a 40-minute
// duration would lock the browser up, and "the model wouldn't do that" is
// not a safety property.

import { direct } from './director.js';

const ENDPOINT_KEY = 'thevoice_agent_endpoint';

export const COLOR_WORDS = {
  red: '#e4483d', crimson: '#d21f3c', orange: '#f08a24', amber: '#f5b301',
  yellow: '#f2d024', lime: '#9fd356', green: '#3fbf72', emerald: '#1f9e6b',
  teal: '#2bb3a3', cyan: '#3fd8e8', blue: '#3fc6ff', azure: '#2f8fe0',
  indigo: '#5a5ae6', purple: '#9a5ae6', violet: '#b06ae8', magenta: '#e055b8',
  pink: '#f06fa8', white: '#f2f7f3', grey: '#8a9490', gray: '#8a9490',
  black: '#0a0d0c', gold: '#e8c14a', silver: '#c8d2cc',
};
// One typo above would ship a broken colour; strip anything that is not a
// valid hex rather than trusting the table by eye.
for (const [k, v] of Object.entries(COLOR_WORDS)) {
  if (!/^#[0-9a-f]{6}$/i.test(v)) COLOR_WORDS[k] = '#3fc6ff';
}



const MESH_TYPES = ['cube', 'sphere', 'pyramid'];

export const MAX_SHAPES = 12;
export const MAX_DURATION = 60;

/** Pull a quoted or capitalised phrase to use as text content. */





/** Which movements were asked for. Several can apply at once. */

let nextLocalId = 1;

/**
 * Build a scene from a description, without a model.
 *
 * Delegates to the director, which parses subject/verb/object and stages
 * real physics. Returns null when the sentence names neither a shape nor an
 * action it recognises, so the caller can hand it to a model rather than
 * inventing something — a confident wrong answer is worse than none.
 */
export function parseLocalCommand(input) {
  const text = String(input || '').trim();
  if (!text) return null;
  try {
    return direct(text);
  } catch {
    // A generator that throws must not take the box down with it.
    return null;
  }
}

const clampNum = (v, lo, hi, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
};

const cleanHex = (v, fallback) =>
  (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v).toLowerCase() : fallback);

const VALID_TYPES = ['circle', 'rect', 'triangle', 'text', 'wave', 'image',
                     'cube', 'sphere', 'pyramid', 'cylinder'];

/**
 * Clamp a scene from the model into something safe to render.
 *
 * The schema guarantees the shape of the JSON, not the sanity of the
 * numbers in it. A scale of 1e9, a negative duration or 400 shapes are all
 * schema-valid and would each hang the browser.
 */
export function validateAgentScene(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, message: 'The agent returned nothing usable.' };
  if (!Array.isArray(raw.shapes) || !raw.shapes.length) {
    return { ok: false, message: 'The agent returned a scene with no shapes in it.' };
  }

  const shapes = [];
  for (const s of raw.shapes.slice(0, MAX_SHAPES)) {
    if (!s || !Array.isArray(s.keyframes) || s.keyframes.length < 1) continue;
    const type = VALID_TYPES.includes(s.type) ? s.type : 'circle';
    const keyframes = s.keyframes
      .slice(0, 60)
      .map((k) => ({
        time: clampNum(k && k.time, 0, MAX_DURATION, 0),
        x: clampNum(k && k.x, -50, 150, 50),
        y: clampNum(k && k.y, -50, 150, 50),
        scale: clampNum(k && k.scale, 0, 8, 1),
        rotation: clampNum(k && k.rotation, -3600, 3600, 0),
        z: clampNum(k && k.z, -200, 400, 0),
        rotX: clampNum(k && k.rotX, -3600, 3600, 0),
        rotY: clampNum(k && k.rotY, -3600, 3600, 0),
        opacity: clampNum(k && k.opacity, 0, 1, 1),
        color: cleanHex(k && k.color, '#3fc6ff'),
        ease: typeof (k && k.ease) === 'string' ? k.ease : 'ease',
      }))
      .sort((a, b) => a.time - b.time);
    if (!keyframes.length) continue;

    shapes.push({
      id: `a${nextLocalId++}`,
      type,
      label: String(s.label || type).slice(0, 40),
      text: String(s.text || '').slice(0, 120),
      extrude: clampNum(s.extrude, 0, 40, type === 'text' ? 8 : 0),
      src: '',
      reactive: !!s.reactive,
      easing: 'ease',
      keyframes,
    });
  }

  if (!shapes.length) return { ok: false, message: 'None of the shapes the agent returned could be used.' };

  // The scene must last at least as long as its last keyframe, or the tail
  // of the animation is unreachable.
  const lastKey = Math.max(...shapes.map((s) => s.keyframes[s.keyframes.length - 1].time));
  const duration = Math.max(1, Math.min(MAX_DURATION, Math.max(clampNum(raw.duration, 1, MAX_DURATION, 5), lastKey)));

  return {
    ok: true,
    scene: {
      duration,
      fps: Math.round(clampNum(raw.fps, 1, 60, 30)),
      background: cleanHex(raw.background, '#0a0d0c'),
      shapes,
    },
    summary: String(raw.summary || '').slice(0, 300),
  };
}

export function getAgentEndpoint() {
  try {
    return localStorage.getItem(ENDPOINT_KEY) || '';
  } catch {
    return '';
  }
}

export function setAgentEndpoint(url) {
  try {
    if (url) localStorage.setItem(ENDPOINT_KEY, String(url).trim());
    else localStorage.removeItem(ENDPOINT_KEY);
  } catch {
    /* private browsing: the local engine still works */
  }
}

/** Derive the function URL from a Supabase project URL, so it need not be typed. */
export function defaultEndpointFor(supabaseUrl) {
  const base = String(supabaseUrl || '').replace(/\/+$/, '');
  return base ? `${base}/functions/v1/scene-agent` : '';
}

export function isAgentConfigured(supabaseUrl) {
  return !!(getAgentEndpoint() || defaultEndpointFor(supabaseUrl));
}

/**
 * Ask the model for a scene.
 *
 * `accessToken` is the signed-in user's Supabase JWT — the function verifies
 * it, which is what keeps the endpoint from being an anonymous relay to a
 * paid API.
 */
export async function requestScene({ prompt, scene = null, endpoint, accessToken, anonKey }) {
  if (!endpoint) return { ok: false, message: 'No scene agent is configured.' };

  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { apikey: anonKey } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ prompt, scene }),
    });
  } catch (err) {
    return { ok: false, message: `Could not reach the scene agent: ${err.message || err}` };
  }

  let body = {};
  try {
    body = await res.json();
  } catch {
    return { ok: false, message: `The scene agent returned an unreadable response (${res.status}).` };
  }

  if (!res.ok) {
    return { ok: false, message: body.error || `The scene agent failed (${res.status}).` };
  }

  const validated = validateAgentScene(body.scene);
  if (!validated.ok) return validated;
  return { ...validated, source: 'model', usage: body.usage || null };
}
