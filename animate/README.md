# The Voice

Pose. Key. Graph. Play.

A browser 3D animation studio. Pose a figure, key it, edit curves, play nested cycles. Built to sit beside [The Voice](https://github.com/samrowland472-lang/TheVoice) (Speak / Music / Animate), [The Voice Studio](https://github.com/samrowland472-lang/TheVoice-Studio), and [The Voice Design](https://github.com/samrowland472-lang/TheVoice-Design).

## What it is

- **Viewport** — orbit, pan, dolly; world/local gizmos; onion-skin ghosts; studio HDRI
- **Timeline** — dope sheet, graph editor (bezier tangents, click-to-insert keys), nested cycle expressions
- **Transport** — JKL shuttle, frame step, I/O work range, auto-key
- **Channel box** — translate / rotate (degrees) / scale, interpolation picker, live expressions
- **Outliner** — parent / unparent with world-transform preserve; shift-click multi-select
- **I/O** — project JSON import/export; auto-save in the browser

Work stays on-device (`localStorage`). No account required.

## Run

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
| Q then drag | Box-select objects |
| Shift-click | Add to selection |
| W / E / R | Move / rotate / scale gizmo |
| F | Frame selection |
| ⌘A | Select all |
| File → Import glTF | .glb / .gltf meshes + hierarchy, fitted to the stage |
| File → Playblast | WebM or PNG sequence of the in–out range |
| ⌘Z / ⌘⇧Z | Undo / redo |
