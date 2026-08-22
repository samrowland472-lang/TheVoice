# The Voice

A browser studio: **Speak** (20k-word TTS), **Voice Studio** (mic chain that actually records), **Music** (live Session + Arrange + DJ), **Animate**, Library, Project.

Everything heavy runs in the visitor's browser. Accounts are optional.

## Open it

Serve the folder (any static host) so `index.html` and the `js/` directory sit together:

- Speak — Neural / Browser / cloned voices. Ctrl/⌘+Enter speaks. Esc stops.
- Voice Studio — pick a mic, ride input gain (it hits the file), monitor, pause.
- Music → Session — launch clips, follow actions, preview without launching.
- Music → Arrange — timeline, loop brace, clip volume/cutoff envelopes.
- Music → DJ Live — two decks.
- Command bar in the transport (Ctrl/⌘+K): `play`, `128 bpm`, `mute kick`, `scene 1`.
- Animate — keyframes, 3D, parenting, JKL shuttle, onion skin, driven sine/cosine/ramp keys, nested coprime cycles.

Flick (the spark) talks to `/api/flick-chat` when an `XAI_API_KEY` is set on the host. Without it, local DAW commands still run.

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

`js/` is the source of truth. `build.py` bundles it.

## Deploy

Netlify (preferred, for Flick): set `XAI_API_KEY`. Vercel works as a static host via `vercel.json`.
