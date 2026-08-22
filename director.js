// Staging.
//
// The parser says what should happen; physics says how things move. This
// puts them together into a scene: where the actors start, when the event
// lands, what survives it.
//
// The output is always an ordinary scene — plain shapes with plain
// keyframes — so anything generated here can be selected, re-timed, re-eased
// and re-coloured exactly like something drawn by hand. That constraint is
// the whole point: the generator is a first draft, not a black box.

import {
  ballistic, shatter, impactTime, directionTo, approach,
  orbitKeys, shakeKeys, seedFrom,
} from './physics.js';
import { parseInstruction, SOLID_TYPES, ACTIONS } from './verbs.js';

const DEFAULT_COLOUR = '#3fc6ff';
const ACCENT_COLOUR = '#f5b301';

// animation.js owns `nextId`; this generator needs its own counter and
// must not shadow it in the bundle.
let stagedId = 1;
export function resetIds() { stagedId = 1; }

function makeShape(type, colour, keys, extra = {}) {
  return {
    id: `g${stagedId++}`,
    type,
    label: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${stagedId - 1}`,
    text: type === 'text' ? 'THE VOICE' : '',
    src: '',
    reactive: false,
    easing: 'ease',
    smoothPath: false,
    keyframes: keys,
    ...extra,
  };
}

const still = (pos, scale, colour, times) => times.map(([time, over]) => ({
  time,
  x: pos.x, y: pos.y, z: pos.z || 0,
  scale, rotation: 0, rotX: 0, rotY: 0,
  opacity: over === undefined ? 1 : over,
  color: colour,
  ease: 'linear',
}));

/**
 * Lay out `count` instances around a point without stacking them.
 *
 * A ring rather than a row: a row of five reads as a list, a ring reads as
 * a group, and a group is what someone means by "five cubes".
 */
function positions(count, centre, spread) {
  if (count === 1) return [{ ...centre }];
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    out.push({
      x: centre.x + Math.cos(a) * spread,
      y: centre.y + Math.sin(a) * spread * 0.5,
      z: (centre.z || 0) + Math.sin(a) * spread * 0.6,
    });
  }
  return out;
}

/**
 * Build a scene from an instruction.
 *
 * Returns null when the sentence could not be understood, so the caller
 * hands it to a model rather than inventing something.
 */
export function direct(text) {
  const plan = parseInstruction(text);
  if (!plan) return null;

  resetIds();
  const seed = seedFrom(plan.text);
  const duration = plan.duration;
  const force = plan.intensity;
  const shapes = [];

  const subjColour = plan.subject.colour || DEFAULT_COLOUR;
  const objColour = (plan.object && plan.object.colour) || ACCENT_COLOUR;
  const solid = (t) => (SOLID_TYPES.includes(t) ? t : t);

  switch (plan.action) {
    case 'smash':
    case 'obliterate':
    case 'crush':
    case 'collide': {
      const profile = ACTIONS[plan.action] || {};
      // The victim sits centre-stage; the aggressor comes in from the left
      // so the direction of travel reads immediately.
      const targetPos = { x: 60, y: 50, z: 0 };
      const startPos = { x: -15, y: 44, z: -20 };
      const hit = impactTime(duration);
      const dir = directionTo(startPos, targetPos);

      // The aggressor: accelerating in, then either carrying on through the
      // wreckage or rebounding off an intact target.
      const inbound = approach({
        from: startPos, to: targetPos, startTime: 0, endTime: hit,
        colour: subjColour, scale: 1,
      });
      // Whether the aggressor carries on through or stops depends on what
      // it just did: you pass through what you obliterate and bounce off
      // what you merely hit.
      const after = plan.destroys
        ? (profile.passThrough === false
          ? ballistic({
              from: targetPos,
              velocity: { x: 0, y: -8, z: 0 },
              startTime: hit, endTime: duration, colour: subjColour,
              spin: { x: 0, y: 0, z: 0 }, fadeOut: false, samples: 4,
            })
          : ballistic({
              from: targetPos,
              velocity: { x: dir.x * 26 * force * (profile.speed || 1),
                          y: -6, z: dir.z * 26 * force * (profile.speed || 1) },
              startTime: hit, endTime: duration, colour: subjColour,
              spin: { x: 0, y: 120 * force, z: 0 }, fadeOut: false, samples: 5,
            }))
        : ballistic({
            from: targetPos,
            velocity: { x: -34 * force, y: -30 * force, z: -10 },
            startTime: hit, endTime: duration, colour: subjColour,
            spin: { x: 0, y: 0, z: -220 * force }, fadeOut: false, samples: 6,
          });
      shapes.push(makeShape(solid(plan.subject.type), subjColour,
        [...inbound, ...after.slice(1)]));

      if (plan.destroys && profile.flatten) {
        // Crushing does not scatter: the target is driven down and squashed
        // where it stands, which is what the word actually describes.
        shapes.push(makeShape(solid(plan.object.type), objColour, [
          ...still(targetPos, 1, objColour, [[0], [hit]]),
          { time: Math.min(duration, hit + 0.35), x: targetPos.x,
            y: targetPos.y + 6, z: 0, scale: 0.55,
            rotation: 0, rotX: 0, rotY: 0, opacity: 1, color: objColour, ease: 'quartOut' },
          { time: duration, x: targetPos.x, y: targetPos.y + 8, z: 0, scale: 0.42,
            rotation: 0, rotX: 0, rotY: 0, opacity: 1, color: objColour, ease: 'linear' },
        ]));
      } else if (plan.destroys) {
        // The target exists, then does not. Holding scale to the impact and
        // dropping it in a single frame is what makes the swap invisible;
        // fading it out would read as a dissolve, not a break.
        shapes.push(makeShape(solid(plan.object.type), objColour, [
          ...still(targetPos, 1, objColour, [[0], [hit]]),
          { time: hit + 0.001, x: targetPos.x, y: targetPos.y, z: 0,
            scale: 0.001, rotation: 0, rotX: 0, rotY: 0, opacity: 0,
            color: objColour, ease: 'hold' },
          { time: duration, x: targetPos.x, y: targetPos.y, z: 0,
            scale: 0.001, rotation: 0, rotX: 0, rotY: 0, opacity: 0,
            color: objColour, ease: 'linear' },
        ]));

        const pieces = shatter({
          centre: targetPos,
          count: Math.min(20, Math.round((profile.pieces || 10) * (0.7 + 0.3 * force))),
          impact: dir, force,
          startTime: hit, endTime: duration,
          colour: objColour, type: solid(plan.object.type), seed,
          profile,
        });
        for (const piece of pieces) {
          // Debris does not exist before the impact that made it.
          const hidden = still(targetPos, 0.001, objColour, [[0, 0], [hit, 0]]);
          shapes.push(makeShape(piece.type, piece.colour,
            [...hidden, ...piece.keys.map((k) => ({ ...k, scale: k.scale * piece.scale }))]));
        }
      } else {
        // An intact target still reacts: it is knocked back and spun.
        const knock = directionTo(startPos, targetPos);
        shapes.push(makeShape(solid(plan.object.type), objColour, [
          ...still(targetPos, 1, objColour, [[0], [hit]]),
          ...ballistic({
            from: targetPos,
            velocity: { x: knock.x * 40 * force, y: -22 * force, z: knock.z * 40 * force },
            startTime: hit, endTime: duration, colour: objColour,
            spin: { x: 160 * force, y: 220 * force, z: 0 },
            fadeOut: false, samples: 6,
          }).slice(1),
        ]));
      }
      break;
    }

    case 'explode':
    case 'shatter':
    case 'vaporise': {
      const profile = ACTIONS[plan.action] || {};
      const centre = { x: 50, y: 50, z: 0 };
      const burst = Math.max(0.15, duration * 0.22);
      shapes.push(makeShape(solid(plan.subject.type), subjColour, [
        ...still(centre, 1, subjColour, [[0]]),
        // A beat of anticipation: it swells before it goes.
        { time: burst * 0.8, x: centre.x, y: centre.y, z: 0, scale: 1.18,
          rotation: 0, rotX: 0, rotY: 0, opacity: 1, color: subjColour, ease: 'quartIn' },
        { time: burst, x: centre.x, y: centre.y, z: 0, scale: 0.001,
          rotation: 0, rotX: 0, rotY: 0, opacity: 0, color: subjColour, ease: 'hold' },
        { time: duration, x: centre.x, y: centre.y, z: 0, scale: 0.001,
          rotation: 0, rotX: 0, rotY: 0, opacity: 0, color: subjColour, ease: 'linear' },
      ]));
      const pieces = shatter({
        centre, count: Math.min(22, Math.round((profile.pieces || 12) * (0.7 + 0.3 * force))),
        impact: { x: 0, y: 0, z: 0 }, force,
        startTime: burst, endTime: duration,
        colour: subjColour, type: solid(plan.subject.type), seed,
        profile,
      });
      for (const piece of pieces) {
        const hidden = still(centre, 0.001, subjColour, [[0, 0], [burst, 0]]);
        shapes.push(makeShape(piece.type, piece.colour,
          [...hidden, ...piece.keys.map((k) => ({ ...k, scale: k.scale * piece.scale }))]));
      }
      break;
    }

    case 'orbit': {
      const centre = { x: 50, y: 50, z: 0 };
      shapes.push(makeShape(solid(plan.object.type), objColour,
        still(centre, 1.1, objColour, [[0], [duration]])));
      const n = plan.subject.count;
      for (let i = 0; i < n; i++) {
        shapes.push(makeShape(solid(plan.subject.type), subjColour,
          orbitKeys({
            centre, radius: 26, revolutions: Math.max(1, Math.round(force * 1.5)),
            duration, colour: subjColour, scale: 0.5,
            phase: (i / n) * Math.PI * 2,
          })));
      }
      break;
    }

    case 'shake': {
      const centre = { x: 50, y: 50, z: 0 };
      for (const pos of positions(plan.subject.count, centre, 22)) {
        shapes.push(makeShape(solid(plan.subject.type), subjColour,
          shakeKeys({
            centre: pos, duration, amplitude: 4 * force,
            colour: subjColour, seed: seed + stagedId, rate: 12 + 6 * force,
          })));
      }
      break;
    }

    case 'scatter':
    case 'gather': {
      const centre = { x: 50, y: 50, z: 0 };
      const n = Math.max(3, plan.subject.count);
      const ring = positions(n, centre, 34 * force);
      for (let i = 0; i < n; i++) {
        const out = ring[i];
        const from = plan.action === 'scatter' ? centre : out;
        const to = plan.action === 'scatter' ? out : centre;
        shapes.push(makeShape(solid(plan.subject.type), subjColour, [
          { time: 0, x: from.x, y: from.y, z: from.z, scale: 0.6,
            rotation: 0, rotX: 0, rotY: 0, opacity: 1, color: subjColour,
            ease: plan.action === 'scatter' ? 'expoOut' : 'quartIn' },
          { time: duration, x: to.x, y: to.y, z: to.z, scale: 0.6,
            rotation: 180 * force, rotX: 0, rotY: 200 * force, opacity: 1,
            color: subjColour, ease: 'linear' },
        ]));
      }
      break;
    }

    default: {
      // The remaining verbs are single-object motions and share a shape:
      // start somewhere, end somewhere, with the action choosing the
      // difference between the two.
      const centre = { x: 50, y: 50, z: 0 };
      const spots = positions(plan.subject.count, centre, 24);
      const type = solid(plan.subject.type);
      spots.forEach((pos, i) => {
        const keys = simpleMotion(plan.action, pos, duration, force, subjColour, type);
        shapes.push(makeShape(type, subjColour, stagger(keys, i, spots.length, duration)));
      });
      break;
    }
  }

  // Words and audio-reactivity are properties of the request, not of any
  // one verb, so they are applied to whatever the staging produced rather
  // than threaded through every branch above.
  if (plan.label) {
    for (const s of shapes) if (s.type === 'text') s.text = plan.label;
  }
  if (plan.reactive) {
    for (const s of shapes) s.reactive = true;
  }

  return {
    duration,
    fps: 30,
    background: '#0a0d0c',
    shapes,
    // Solids only mean anything under a camera.
    needs3D: shapes.some((s) => SOLID_TYPES.includes(s.type)),
    summary: describe(plan, shapes.length),
    source: 'local',
  };
}

/**
 * Offset one instance of a group so a crowd does not move as one block.
 *
 * The delay is taken out of the front of the motion, not added to the end:
 * every instance still finishes on the last frame, which is what keeps the
 * scene's declared duration honest.
 */
function stagger(keys, index, count, duration) {
  if (count < 2 || index === 0 || duration <= 0) return keys;
  const step = Math.min(0.3, (duration * 0.2) / count);
  const delay = step * index;
  const span = duration - delay;
  if (span <= 0) return keys;
  return keys.map((k) => ({ ...k, time: delay + (k.time / duration) * span }));
}

function simpleMotion(action, pos, duration, force, colour, type = 'circle') {
  const base = (over) => ({
    x: pos.x, y: pos.y, z: pos.z || 0, scale: 1,
    rotation: 0, rotX: 0, rotY: 0, opacity: 1, color: colour, ...over,
  });

  switch (action) {
    case 'spin': {
      // A flat shape has no far side, so turning it about Y is invisible.
      // Spin means "turn in the picture plane" for those, and "turn on the
      // spot" for a solid.
      const turns = 360 * Math.max(1, Math.round(force));
      const axis = SOLID_TYPES.includes(type) ? { rotY: turns } : { rotation: turns };
      return [
        { time: 0, ...base({ ease: 'linear' }) },
        { time: duration, ...base(axis) },
      ];
    }
    case 'tumble':
      return [
        { time: 0, ...base({ ease: 'linear' }) },
        { time: duration, ...base({
          rotX: 360 * force, rotY: 540 * force, rotation: 180 * force }) },
      ];
    case 'flip':
      return [
        { time: 0, ...base({ ease: 'backOut' }) },
        { time: duration, ...base({ rotX: 360 }) },
      ];
    case 'bounce': {
      const keys = [];
      const bounces = Math.max(2, Math.round(2 + force));
      for (let i = 0; i <= bounces; i++) {
        const f = i / bounces;
        keys.push({ time: f * duration,
          ...base({ y: pos.y - (i % 2 ? 26 * force * (1 - f * 0.6) : 0), ease: 'bounce' }) });
      }
      return keys;
    }
    case 'fall':
      return ballistic({
        from: { ...pos, y: pos.y - 40 }, velocity: { x: 0, y: 0, z: 0 },
        startTime: 0, endTime: duration, colour, fadeOut: false, samples: 6,
      });
    case 'rise':
      return [
        { time: 0, ...base({ y: pos.y + 45, opacity: 0, ease: 'expoOut' }) },
        { time: duration, ...base({ y: pos.y - 10 }) },
      ];
    case 'swirl': {
      const keys = [];
      const turns = Math.max(1.5, force * 2);
      for (let i = 0; i <= 24; i++) {
        const f = i / 24;
        const a = f * turns * Math.PI * 2;
        const r = 30 * (1 - f * 0.75);
        keys.push({ time: f * duration, ...base({
          x: pos.x + Math.cos(a) * r,
          y: pos.y + Math.sin(a) * r * 0.5,
          z: (pos.z || 0) + Math.sin(a) * r,
          scale: 1 - f * 0.45, ease: 'linear' }) });
      }
      return keys;
    }
    case 'pulse': {
      const keys = [];
      const beats = Math.max(2, Math.round(duration * force));
      for (let i = 0; i <= beats; i++) {
        keys.push({ time: (i / beats) * duration,
          ...base({ scale: i % 2 ? 1 + 0.4 * force : 0.9, ease: 'easeInOut' }) });
      }
      return keys;
    }
    // An unqualified "grow" ends at natural size — that is what growing
    // into frame means. Only an emphatic one ("grow massively") overshoots,
    // which is why the force term is measured from 1 rather than from 0.
    case 'grow':
      return [{ time: 0, ...base({ scale: 0.15, ease: 'backOut' }) },
              { time: duration, ...base({ scale: Math.max(0.2, 1 + 0.3 * (force - 1)) }) }];
    case 'shrink':
      return [{ time: 0, ...base({ scale: Math.max(0.2, 1 + 0.3 * (force - 1)), ease: 'quartIn' }) },
              { time: duration, ...base({ scale: 0.1 })}];
    case 'fadeIn':
      return [{ time: 0, ...base({ opacity: 0, scale: 0.8, ease: 'settle' }) },
              { time: duration, ...base({}) }];
    case 'fadeOut':
      return [{ time: 0, ...base({ ease: 'quartIn' }) },
              { time: duration, ...base({ opacity: 0, scale: 1.2 }) }];
    case 'slide':
      return [{ time: 0, ...base({ x: -15, ease: 'expoOut' }) },
              { time: duration, ...base({ x: pos.x + 20 }) }];
    case 'chase':
      return [{ time: 0, ...base({ x: -10, ease: 'easeInOut' }) },
              { time: duration * 0.5, ...base({ x: pos.x, y: pos.y - 14 }) },
              { time: duration, ...base({ x: pos.x + 30 }) }];
    case 'drift':
    default: {
      const keys = [];
      for (let i = 0; i <= 4; i++) {
        const f = i / 4;
        keys.push({ time: f * duration, ...base({
          x: pos.x + Math.sin(f * Math.PI * 2) * 9 * force,
          y: pos.y + Math.cos(f * Math.PI * 1.5) * 7 * force,
          ease: 'easeInOut' }) });
      }
      return keys;
    }
  }
}

function describe(plan, shapeCount) {
  const s = plan.subject;
  const o = plan.object;
  const subject = `${s.count > 1 ? `${s.count} ` : ''}${s.type}${s.count > 1 ? 's' : ''}`;
  const verb = plan.action;
  // The preposition belongs to the verb: "orbit into a cube" is not English.
  const PREPOSITION = { orbit: 'around', chase: 'after', gather: 'toward' };
  const prep = PREPOSITION[plan.action] || 'into';
  const target = o && !o.implied
    ? ` ${prep} ${o.count > 1 ? `${o.count} ` : 'a '}${o.type}${o.count > 1 ? 's' : ''}`
    : '';
  return `${subject} ${verb}${target} · ${shapeCount} object${shapeCount === 1 ? '' : 's'} · ${plan.duration}s`;
}
