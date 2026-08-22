# The Creative

A browser studio with five rooms: **Music**, **Animation**, **Design**, **Voice**, and **Flick AI**.

Everything heavy runs in the visitor's browser. Accounts are optional — use **Enter the studios** to work immediately.

## Rooms

- **Music** — Session, Arrange, DJ Live, piano roll, mixer, command bar (Ctrl/⌘+K)
- **Animation** — Stage, graph, keyframes, 3D, JKL shuttle, onion skin
- **Design** — Press-ready artboard in [`design/`](./design): type, paint, layers, templates, command palette
- **Voice** — Clone, Dub, Shape, Speak (long-form lives here), Talk (72-hour thread), Signal (radio cycle)
- **Flick AI** — Assemble a voice take, a beat, and a scene into one cut. Flick talks to `/api/flick-chat` when `XAI_API_KEY` is set; local commands still run without it.


## Design (artboard studio)

The press-ready Design room lives in [`design/`](./design) — templates, paint, type, layers, present mode. Auto-saves in the browser.

```bash
cd design
npm install
npm run dev
```

## AETHER (React animation studio)

The next-gen 3D animation room lives in [`aether/`](./aether) — pose, key, graph editor, nested cycle expressions. Auto-saves in the browser.

```bash
cd aether
npm install
npm run dev
```

## Open it

Serve the folder so `index.html` and `js/` sit together. `theme.css` and `ui-shell.js` are design-only — they do not change the engines.

- Guest: `index.html?guest=1` or the Enter button
- Hub: `index.html?guest=1&hub=1`
- Direct room: `index.html?guest=1&avenue=music` (music, animation, design, voice, flick)

## Tests

```bash
cd tests
for f in *-test.mjs; do node "$f" || exit 1; done
```

`js/` is the source of truth for engines. `theme.css` + `ui-shell.js` restyle the chrome.

## Deploy

Netlify (preferred, for Flick): set `XAI_API_KEY`. Vercel works as a static host via `vercel.json`.
