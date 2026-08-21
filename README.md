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
2. Leave them blank and connect a project from the **Connect Supabase**
   button on the entry gate.

**Use the Project URL, not the REST endpoint.** The dashboard shows several
addresses and the one under "Connect" or in the API docs is
`https://<ref>.supabase.co/rest/v1/`, which is for querying tables. What
this app needs is the bare origin:

    https://<ref>.supabase.co

The quickest way to read it is off the dashboard's own address bar —
`supabase.com/dashboard/project/<ref>` — where `<ref>` plus `.supabase.co`
is your Project URL. Pasting the wrong one is handled anyway: any Supabase
endpoint URL is reduced to its origin on entry, and an already-saved bad one
is repaired on load.

The anon key is public by design — Supabase enforces access server-side
through row level security — so shipping it in the page is expected. The
**service-role key must never go here**: it bypasses row level security
entirely, so putting it in a web page hands every visitor full read/write
access to the database. Pasting one is refused with an explanation.

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

## Layout

    index.html          the page
    style.css           all styles
    js/                 ES modules, one concern each
    tests/              pure-logic tests (node, no browser)
    supabase/           database schema + Stripe webhook
    build.py            bundles js/ into the single-file build
    the-voice.html      the single-file build, ready to deploy

`js/` is the source of truth. `index.html` loads the modules directly, so
editing a module and reloading is the whole development loop — no build step
while working.

## Tests

    cd tests && for f in *.mjs; do node "$f"; done

The audio, animation, easing and billing logic is written as pure functions
over plain data specifically so it can be tested this way, without a browser
or a build.

## Building the single file

    python3 build.py

Merges the modules and inlines the CSS to produce `build/`. Copy
`build/speakscape-standalone.html` over `the-voice.html` to update the
deployable single file.

The build refuses to run if two modules declare the same top-level name.
Modules each have their own scope and a bundle does not, so a duplicate that
works perfectly in development dies at parse time once merged — taking the
whole app down rather than just that feature.
