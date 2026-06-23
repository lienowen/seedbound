# Pocket Civilization Autopilot

Use this project-local workflow to continue the god-simulation prototype automatically.

## Goal

Build a 2.5D isometric god-view civilization vertical slice:

1. Barren continent.
2. Divine toolbox.
3. Rain power lands with strong feedback.
4. Soil becomes wet and riverbeds fill.
5. Grass, trees, animals, and settlers appear.
6. Settlers move, gather, build a camp, and expose simple state.

## Project

- Root: `D:\develop\me\seedbound`
- Main files:
  - `src/App.jsx`
  - `src/PixiValley.jsx`
  - `src/simulation.js`
  - `src/styles.css`
  - `public/assets/isometric/`
- Prefer PixiJS for this god-sim direction.
- Do not continue the old side-scroller unless explicitly requested.

## Autopilot Loop

For each development pass:

1. Inspect the current browser screenshot and source files.
2. Pick the highest-impact visual or gameplay weakness.
3. Make a focused change.
4. Run `npm run build`.
5. Open/refresh the local app, preferably `http://127.0.0.1:4174/`.
6. Check console errors and screenshot.
7. If the screenshot still looks like debug UI, repeated tiles, or flat stickers, iterate again.
8. Report only when the pass is genuinely ready for user review.

## Visual Standards

- The map must look like a miniature 2.5D continent, not a grid.
- Continuous terrain base is preferred over full-detail repeated tiles.
- Overlays should show state changes only: wet soil, grass, trees, buildings, fire, frost.
- Powers need impact within 150 ms: shockwave, rain, glow, camera/energy feedback.
- People and animals must be visible, animated entities.

## Build Command

```powershell
cd D:\develop\me\seedbound
npm run build
```

## Dev Server

```powershell
cd D:\develop\me\seedbound
npm run dev -- --port 4174
```
