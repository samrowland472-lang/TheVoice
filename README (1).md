# The Voice

A voice and animation studio that runs entirely in the browser. Neural
speech synthesis, recording with live analysis, pitch/formant modulation,
long-form audiobook rendering, and keyframe animation that can be driven
by a voice track.

## Why it scales cheaply

Every heavy operation — speech synthesis, modulation, spectral analysis,
animation rendering — runs in the visitor's own browser. There is no
inference server to pay for or scale, so hosting cost stays flat whether
ten people use it or ten thousand.

## Deploy

Static hosting; no build step.

**Netlify** — drag the folder onto netlify.com/drop, or connect the repo
(`netlify.toml` is already configured).

**Vercel** — `vercel deploy` in this directory (`vercel.json` included).

**Anything else** — serve the folder. `index.html` is the entry point.
`the-voice.html` is the same app as a single self-contained file if you
prefer one file with no dependencies.

## Accounts

Sign-in uses Supabase. Either:

1. Fill in `BACKEND_URL` / `BACKEND_KEY` at the top of `js/account.js`, or
2. Leave them blank and connect a project at runtime via the small `·`
   button at the bottom-right of the entry gate.

The anon key is public by design — Supabase enforces access server-side
through row level security — so shipping it in the page is expected. Never
put a service-role key here.

For Google/Apple sign-in, enable those providers in your Supabase
dashboard under Authentication → Providers.

## Payments

Plans link to Stripe Payment Links, set under Settings. Payment Links need
no server. For automatic plan upgrades after payment you would add a
Stripe webhook writing the plan to the user's Supabase record.

## Layout

- `index.html` / `style.css` — shell and styling
- `js/` — one module per concern:
  - `modulation.js` — phase vocoder, independent pitch and formant shift
  - `pitch.js` — YIN fundamental frequency detection
  - `animation.js` — keyframe scenes, voice-reactive rendering
  - `chapters.js` — long-form text splitting
  - `tts-neural.js` / `tts-browser.js` / `tts-elevenlabs.js` — voice engines
  - `account.js` / `billing.js` — auth and plans
- `the-voice.html` — generated single-file build

## Browser support

Chrome and Edge are the primary targets. Recording and live transcription
need a secure context (https, or a local file opened directly) — the
microphone is blocked in embedded iframes.
