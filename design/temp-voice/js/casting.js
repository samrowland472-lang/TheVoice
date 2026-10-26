// Making the agent talk about the scene you already have.
//
// Until now every instruction built a scene from nothing, out of
// primitives. That is fine for "three blue circles", and useless the
// moment you have imported a dragon: "the dragon smashes into the tower"
// produced a fresh sphere and a fresh cube and ignored both models sitting
// right there.
//
// This is the missing half. It reads the sentence's noun phrases against
// what is actually in the scene, decides which existing objects the words
// name, and then stages the action onto *those* — appending keyframes to
// objects that already exist rather than replacing everything.
//
// The matching is deliberately conservative. A confident wrong cast — the
// agent animating the floor because the word "ground" appeared in a label
// — is worse than admitting it did not recognise anything and letting the
// sentence build a new scene instead.

import { parseInstruction, ACTIONS, SOLID_TYPES } from './verbs.js';
import { sampleShape, worldTransforms } from './animation.js';
import { selectionRoots } from './selection.js';
import { ancestorsOf, childrenOf, composeTransform, relativeTransform }
  from './scenegraph.js';
import {
  ballistic, shatter, impactTime, directionTo, approach, seedFrom,
} from './physics.js';

/** Words that mean "whatever is selected" rather than naming anything. */
const DEICTIC = new Set(['it', 'this', 'that', 'them', 'these', 'those',
                         'thing', 'things', 'object', 'objects', 'shape', 'shapes']);

const words = (text) => String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/**
 * Every word that appears in a scene's object names.
 *
 * Handed to the parser so a sentence about a dragon parses at all. Without
 * it "the dragon smashes into the tower" contains no shape word and comes
 * back as nothing — which is precisely the sentence someone types once
 * they have imported a dragon.
 */
export function sceneNames(scene) {
  const out = new Set();
  for (const shape of (scene && scene.shapes) || []) {
    for (const w of words(shape.label)) {
      // Two-letter fragments match far too much to be worth a lookup.
      if (w.length >= 3) out.add(w);
    }
  }
  return out;
}

/**
 * Score how well a shape answers to a noun phrase.
 *
 * Returns 0 for no match at all, so a caller can tell "nothing here is
 * called that" from "here is a poor match".
 */
export function matchScore(shape, phrase, raw) {
  if (!shape || !phrase) return 0;
  const label = String(shape.label || '').toLowerCase();

  if (phrase.name) {
    // The word the parser resolved to *this* role. It outranks everything,
    // and a miss must not fall back to scanning the whole sentence: in
    // "the barrel smashes into the wall" both words are present, and
    // letting either match either role casts them backwards.
    if (label === phrase.name) return 100;
    if (new RegExp(`\\b${phrase.name}`).test(label)) return 70;
  } else {
    // No name was resolved, so any content word in the sentence is fair
    // game — this is what lets "smash the anvil" reach an object called
    // "Anvil" even though "anvil" is not in the shape vocabulary.
    const wanted = words(raw).filter((w) => !DEICTIC.has(w) && w.length >= 3);
    let named = 0;
    for (const w of wanted) {
      if (label === w) { named = Math.max(named, 100); continue; }
      if (new RegExp(`\\b${w}`).test(label)) named = Math.max(named, 60);
    }
    if (named) return named;
  }

  // Otherwise the shape's kind: "the cube" matches a cube.
  if (shape.type === phrase.type) return 25;
  // An imported model is not a cube or a sphere, so a bare solid noun
  // should still be able to reach it — weakly, and only when nothing else
  // in the scene answers better.
  if (!SOLID_TYPES.includes(shape.type) && String(shape.type).startsWith('model:')
      && SOLID_TYPES.includes(phrase.type)) {
    return 8;
  }
  return 0;
}

/**
 * Which existing objects a sentence is talking about.
 *
 * Roots win over their own children: "the dragon" means the model, not one
 * of its toes, and animating a toe when someone said the creature's name
 * is the kind of wrong that looks like the feature is broken.
 */
export function castActors(scene, plan, { selectedIds = null } = {}) {
  const shapes = (scene && scene.shapes) || [];
  if (!shapes.length || !plan) {
    return { subject: null, object: null, subjectScore: 0, objectScore: 0 };
  }

  const rank = (phrase) => {
    if (!phrase) return [];
    return shapes
      .map((shape) => {
        let score = matchScore(shape, phrase, plan.text);
        if (!score) return null;
        // A top-level object outranks a part of one at the same score.
        if (ancestorsOf(scene, shape.id).length === 0) score += 6;
        // Something with children is more likely to be the thing named.
        if (childrenOf(scene, shape.id).length) score += 3;
        return { shape, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  };

  // "move it", "spin this": the word points rather than names, so the
  // selection is what it points at — and it outranks any lookup, because
  // the person is looking at the thing they mean.
  const selected = selectedIds ? selectionRoots(scene, selectedIds) : [];
  const pointing = (phrase) => !!(phrase && phrase.vague) && selected.length > 0;

  const subjectRanked = rank(plan.subject);
  let subject = pointing(plan.subject) ? selected[0] : null;
  if (!subject && subjectRanked.length) subject = subjectRanked[0].shape;

  const objectRanked = rank(plan.object).filter((r) => !subject || r.shape.id !== subject.id);
  let object = null;
  if (pointing(plan.object)) {
    object = selected.find((s) => !subject || s.id !== subject.id) || null;
  }
  if (!object && objectRanked.length) object = objectRanked[0].shape;

  return {
    subject: subject || null,
    object: object || null,
    // How confident this is, for a caller deciding whether to use it.
    subjectScore: subjectRanked.length ? subjectRanked[0].score : 0,
    objectScore: objectRanked.length ? objectRanked[0].score : 0,
  };
}

/** Where a shape actually is, in world space, at a moment. */
function placeOf(scene, shape, time) {
  const p = worldTransforms(scene, time).get(shape.id) || sampleShape(shape, time);
  return { x: p.x, y: p.y, z: p.z || 0, scale: p.scale === undefined ? 1 : p.scale };
}

/**
 * The frame a shape's own keyframes are measured in, at a moment.
 *
 * A root's channels are world coordinates. A child's are relative to its
 * parent, with the bind offset in between — which is why staging cannot
 * just write world positions into whatever shape it picked.
 */
function parentFrameAt(scene, shape, time) {
  if (!shape.parent) return null;
  const pw = worldTransforms(scene, time).get(shape.parent);
  if (!pw) return null;
  return shape.bind ? composeTransform(pw, shape.bind) : pw;
}

/**
 * Replace a shape's keyframes with a staged performance.
 *
 * The staging works in world space — a ball travels to where the wall
 * actually appears — but a child's keyframes hold a *local* transform.
 * Writing world values straight in adds the parent's transform a second
 * time, so a barrel on a cart lands nowhere near the wall it was aimed at.
 * Each key is converted back into the shape's own frame, at its own time,
 * because the parent may itself be moving.
 *
 * Every generated keyframe is an ordinary one, so anything the agent
 * arranges can be re-timed, re-eased and re-coloured by hand afterwards —
 * the same constraint the from-scratch generator works under.
 */
function perform(scene, shape, keys) {
  if (!keys.length) return;
  const colour = shape.keyframes.length ? shape.keyframes[0].color : '#3fc6ff';
  shape.keyframes = keys.map((k) => {
    const world = {
      x: k.x, y: k.y, z: k.z || 0,
      scale: k.scale === undefined ? 1 : k.scale,
      rotation: k.rotation || 0, rotX: k.rotX || 0, rotY: k.rotY || 0,
      opacity: k.opacity === undefined ? 1 : k.opacity,
    };
    const frame = parentFrameAt(scene, shape, k.time);
    const local = frame ? relativeTransform(frame, world) : world;
    return {
      time: k.time,
      x: local.x, y: local.y, z: local.z || 0,
      scale: local.scale, rotation: local.rotation || 0,
      rotX: local.rotX || 0, rotY: local.rotY || 0,
      opacity: Math.max(0, Math.min(1, local.opacity)),
      color: k.color || colour,
      ...(k.ease ? { ease: k.ease } : {}),
    };
  }).sort((a, b) => a.time - b.time);
}

/**
 * Stage an instruction onto the scene that already exists.
 *
 * Returns null when the sentence does not name anything present — the
 * caller then falls back to building a scene from scratch, which is the
 * right answer for "three blue circles" and the wrong one for "make the
 * dragon jump".
 *
 * The scene is mutated in place; callers that want undo should snapshot
 * first, exactly as they do for a hand edit.
 */
export function actOnScene(scene, text, { selectedIds = null, mintId = null } = {}) {
  const plan = parseInstruction(text, { names: sceneNames(scene) });
  if (!plan) return null;

  const cast = castActors(scene, plan, { selectedIds });
  if (!cast.subject) return null;
  const spec = ACTIONS[plan.action] || {};
  // A verb that needs a victim, with no victim in the scene, is not
  // something to guess at: inventing one would put a stray cube in a scene
  // the user has been arranging by hand.
  if (spec.needsTarget && !cast.object) return null;

  const duration = Math.max(scene.duration || 5, plan.duration);
  scene.duration = duration;
  const force = plan.intensity;
  const seed = seedFrom(plan.text);
  const mint = mintId || (() => `a${Math.floor(Math.random() * 1e9).toString(36)}`);

  const subject = cast.subject;
  const from = placeOf(scene, subject, 0);

  if (spec.needsTarget && cast.object) {
    const object = cast.object;
    const to = placeOf(scene, object, 0);
    const hit = impactTime(duration);
    const dir = directionTo(from, to);

    // The aggressor: in from where it stands, then through or away.
    const inbound = approach({
      from, to, startTime: 0, endTime: hit,
      colour: subject.keyframes[0].color, scale: from.scale,
    });
    const after = spec.passThrough === false
      ? ballistic({
          from: to, velocity: { x: -dir.x * 20 * force, y: -18 * force, z: -dir.z * 20 * force },
          startTime: hit, endTime: duration, colour: subject.keyframes[0].color,
          spin: { x: 0, y: 0, z: -180 * force }, fadeOut: false, samples: 5,
        })
      : ballistic({
          from: to,
          velocity: { x: dir.x * 24 * force * (spec.speed || 1), y: -6,
                      z: dir.z * 24 * force * (spec.speed || 1) },
          startTime: hit, endTime: duration, colour: subject.keyframes[0].color,
          spin: { x: 0, y: 120 * force, z: 0 }, fadeOut: false, samples: 5,
        });
    perform(scene, subject, [...inbound, ...after.slice(1)].map((k) => ({ ...k, scale: from.scale })));

    if (!plan.destroys) {
      // An intact target is knocked back rather than broken.
      perform(scene, object, [
        { time: 0, ...to, scale: to.scale, opacity: 1 },
        { time: hit, ...to, scale: to.scale, opacity: 1 },
        ...ballistic({
          from: to,
          velocity: { x: dir.x * 36 * force, y: -20 * force, z: dir.z * 36 * force },
          startTime: hit, endTime: duration, colour: object.keyframes[0].color,
          spin: { x: 140 * force, y: 200 * force, z: 0 }, fadeOut: false, samples: 6,
        }).slice(1).map((k) => ({ ...k, scale: to.scale })),
      ]);
      return { scene, cast, action: plan.action, added: 0 };
    }

    if (spec.flatten) {
      perform(scene, object, [
        { time: 0, ...to, scale: to.scale },
        { time: hit, ...to, scale: to.scale },
        { time: Math.min(duration, hit + 0.35), x: to.x, y: to.y + 6, z: to.z,
          scale: to.scale * 0.55, ease: 'quartOut' },
        { time: duration, x: to.x, y: to.y + 8, z: to.z, scale: to.scale * 0.42,
          ease: 'linear' },
      ]);
      return { scene, cast, action: plan.action, added: 0 };
    }

    // Destroyed: the target vanishes on impact and its debris takes over.
    perform(scene, object, [
      { time: 0, ...to, scale: to.scale },
      { time: hit, ...to, scale: to.scale },
      { time: hit + 0.001, ...to, scale: 0.001, opacity: 0, ease: 'hold' },
      { time: duration, ...to, scale: 0.001, opacity: 0, ease: 'linear' },
    ]);

    // Debris inherits the victim's own look, so breaking a red tower does
    // not produce grey rubble.
    const debrisColour = object.keyframes[0].color;
    const debrisType = SOLID_TYPES.includes(object.type) ? object.type : 'cube';
    const pieces = shatter({
      centre: to,
      count: Math.min(20, Math.round((spec.pieces || 10) * (0.7 + 0.3 * force))),
      impact: dir, force, startTime: hit, endTime: duration,
      colour: debrisColour, type: debrisType, seed, profile: spec,
    });
    let added = 0;
    for (const piece of pieces) {
      scene.shapes.push({
        id: mint(),
        type: piece.type,
        label: `Debris ${++added}`,
        text: '', src: '', reactive: false, easing: 'ease', smoothPath: false,
        parent: null,
        keyframes: [
          { time: 0, x: to.x, y: to.y, z: to.z, scale: 0.001, rotation: 0,
            rotX: 0, rotY: 0, opacity: 0, color: debrisColour, ease: 'hold' },
          { time: hit, x: to.x, y: to.y, z: to.z, scale: 0.001, rotation: 0,
            rotX: 0, rotY: 0, opacity: 0, color: debrisColour, ease: 'hold' },
          ...piece.keys.map((k) => ({
            time: k.time, x: k.x, y: k.y, z: k.z || 0,
            scale: k.scale * piece.scale * to.scale,
            rotation: k.rotation || 0, rotX: k.rotX || 0, rotY: k.rotY || 0,
            opacity: k.opacity === undefined ? 1 : k.opacity,
            color: piece.colour, ...(k.ease ? { ease: k.ease } : {}),
          })),
        ],
      });
    }
    return { scene, cast, action: plan.action, added };
  }

  // Single-object verbs: the object performs where it stands.
  perform(scene, subject, soloKeys(plan.action, from, duration, force, seed, spec));
  return { scene, cast, action: plan.action, added: 0 };
}

/**
 * Keyframes for a verb with no victim, anchored where the object already
 * is rather than at the middle of the stage.
 */
function soloKeys(action, at, duration, force, seed, spec) {
  const base = (over) => ({
    x: at.x, y: at.y, z: at.z, scale: at.scale,
    rotation: 0, rotX: 0, rotY: 0, opacity: 1, ...over,
  });

  switch (action) {
    case 'explode':
    case 'shatter':
    case 'vaporise': {
      const burst = Math.max(0.15, duration * 0.22);
      return [
        { time: 0, ...base({}) },
        { time: burst * 0.7, ...base({ scale: at.scale * 1.18, ease: 'quartIn' }) },
        { time: burst, ...base({ scale: 0.001, opacity: 0, ease: 'hold' }) },
        { time: duration, ...base({ scale: 0.001, opacity: 0, ease: 'linear' }) },
      ];
    }
    case 'spin': {
      const turns = 360 * Math.max(1, Math.round(force));
      return [{ time: 0, ...base({ ease: 'linear' }) },
              { time: duration, ...base({ rotY: turns }) }];
    }
    case 'tumble':
      return [{ time: 0, ...base({ ease: 'linear' }) },
              { time: duration, ...base({ rotX: 360 * force, rotY: 540 * force,
                                          rotation: 180 * force }) }];
    case 'bounce': {
      const keys = [];
      const bounces = Math.max(2, Math.round(2 + force));
      for (let i = 0; i <= bounces; i++) {
        const f = i / bounces;
        keys.push({ time: f * duration,
          ...base({ y: at.y - (i % 2 ? 26 * force * (1 - f * 0.6) : 0), ease: 'bounce' }) });
      }
      return keys;
    }
    case 'fall':
      return ballistic({
        from: at, velocity: { x: 0, y: 0, z: 0 },
        startTime: 0, endTime: duration, colour: '#ffffff', fadeOut: false, samples: 6,
      }).map((k) => ({ ...k, scale: at.scale }));
    case 'rise':
      return [{ time: 0, ...base({}) },
              { time: duration, ...base({ y: at.y - 30 * force, ease: 'expoOut' }) }];
    case 'grow':
      return [{ time: 0, ...base({ ease: 'backOut' }) },
              { time: duration, ...base({ scale: at.scale * (1 + 0.6 * force) }) }];
    case 'shrink':
      return [{ time: 0, ...base({ ease: 'quartIn' }) },
              { time: duration, ...base({ scale: at.scale * 0.25 }) }];
    case 'fadeIn':
      return [{ time: 0, ...base({ opacity: 0, ease: 'settle' }) },
              { time: duration, ...base({}) }];
    case 'fadeOut':
      return [{ time: 0, ...base({ ease: 'quartIn' }) },
              { time: duration, ...base({ opacity: 0 }) }];
    case 'pulse': {
      const keys = [];
      const beats = Math.max(2, Math.round(duration * force));
      for (let i = 0; i <= beats; i++) {
        keys.push({ time: (i / beats) * duration,
          ...base({ scale: at.scale * (i % 2 ? 1 + 0.4 * force : 0.9), ease: 'easeInOut' }) });
      }
      return keys;
    }
    case 'shake': {
      const keys = [];
      const steps = Math.max(8, Math.round(duration * 8));
      let s = seed || 1;
      const rand = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
      for (let i = 0; i <= steps; i++) {
        keys.push({ time: (i / steps) * duration, ...base({
          x: at.x + (rand() - 0.5) * 8 * force,
          y: at.y + (rand() - 0.5) * 8 * force,
          rotation: (rand() - 0.5) * 20 * force, ease: 'linear' }) });
      }
      return keys;
    }
    default: {
      // Anything else drifts: a small, obviously-alive motion is a better
      // answer to an unusual verb than standing perfectly still.
      const keys = [];
      for (let i = 0; i <= 4; i++) {
        const f = i / 4;
        keys.push({ time: f * duration, ...base({
          x: at.x + Math.sin(f * Math.PI * 2) * 9 * force,
          y: at.y + Math.cos(f * Math.PI * 1.5) * 7 * force,
          ease: 'easeInOut' }) });
      }
      return keys;
    }
  }
}
