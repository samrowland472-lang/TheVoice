# AETHER

Pose. Key. Graph. Play.

The React 3D animation studio inside [The Voice](https://github.com/samrowland472-lang/TheVoice). Pose a figure, key it, edit curves, play nested cycles.

## What it is

- **Viewport** — orbit, pan, dolly; world/local gizmos; onion-skin ghosts; studio HDRI
- **Timeline** — dope sheet, graph editor (bezier tangents, click-to-insert keys), nested cycle expressions
- **Transport** — JKL shuttle, frame step, I/O work range, auto-key
- **Channel box** — translate / rotate (degrees) / scale, interpolation picker, live expressions
- **Outliner** — parent / unparent with world-transform preserve
- **I/O** — project JSON import/export; auto-save in the browser

Work stays on-device (`localStorage` key `aether-project-v1`). No account required.

## Run

From this folder:

```bash
npm install
npm run dev
```

`npm run build` produces the production bundle. `npm run typecheck` checks types.

## Stack

React 19, TanStack Start, React Three Fiber, drei, Zustand, Tailwind v4.

## Shortcuts

| Key | Action |
| --- | --- |
| Space | Play / pause |
| J / K / L | Shuttle reverse / pause / forward |
| ← / → | Step frame |
| S | Key selected |
| W / E / R | Move / rotate / scale gizmo |
| F | Frame selection |
| ⌘Z / ⌘⇧Z | Undo / redo |
