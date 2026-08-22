# The Voice

A browser studio: **Clone**, **Dub**, **Shape**, **Speak**, **Talk**, **Signal**, plus **Music**, **Animate**, Library, Project.

Everything heavy runs in the visitor's browser. Accounts are optional.

## Open it

Serve the folder (any static host) so `index.html` and the `js/` directory sit together:

- Clone — record or drop a take, print a voice (local, or ElevenLabs if a key is set).
- Dub — drop a track, transcribe, translate, render a restyled take.
- Shape — pitch, character, speed on a clip.
- Speak — Neural / Browser / cloned voices. Ctrl/⌘+Enter speaks. Esc stops. Long-form lives here.
- Talk — 72-hour conversation, spoken back.
- Signal — a 72-hour radio cycle.
- Music → Session — launch clips, follow actions, preview without launching.
- Music → Arrange — timeline, loop brace, clip volume/cutoff envelopes.
- Music → DJ Live — two decks.
- Command bar in the transport (Ctrl/⌘+K): `play`, `128 bpm`, `mute kick`, `scene 1`.
- Animate — keyframes, 3D, parenting, JKL shuttle, onion skin, driven sine/cosine/ramp keys, nested coprime cycles.

Flick (the spark) is built into the site — not a separate app. It talks to `/api/flick-chat` when an `XAI_API_KEY` is set on the host. Without it, local commands still run across Clone, Speak, Animate, Library, Project, and Music. Talk, Dub translate, and Signal write through the same endpoint.

## Tests

```bash
cd tests
for f in *-test.mjs; do node "$f" || exit 1; done
```

| File | Covers |
| --- | --- |
| `easing-test.mjs` | Cubic-bezier solver, overshoot, hold/step, curve presets |
| `account-test.mjs` | Supabase URL normalisation, anon/service_role key validation |
| `project-test.mjs` | Mixing voice over a beat, offsets, looping, fades |
| `billing-test.mjs` | Plan resolution, checkout links, upgrade polling |
| `anim-test.mjs` | Keyframes, interpolation, scene serialisation |
| `music-test.mjs` | Sequencer, drum synthesis, songwriting theory |
| `chapters-test.mjs` | Long-form splitting and audio concatenation |
| `mod-test.mjs` | Phase vocoder, pitch and formant shifting |
| `pitch-test.mjs` | YIN pitch detection |
| `speak-script-test.mjs` | Word cap, sentence queue |
| `flick-studio-test.mjs` | Flick directives + natural language for every section |
| `voice-desk-test.mjs` | 72-hour Signal clock, language labels |

`js/` is the source of truth. `build.py` bundles it.

## Deploy

Netlify (preferred, for Flick): set `XAI_API_KEY`. Vercel works as a static host via `vercel.json`.
