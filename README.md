# Tests

Pure-logic tests, no browser or build step needed:

```bash
cd tests
for f in *.mjs; do node "$f"; done
```

Each file prints one line per assertion and exits non-zero on failure.

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
