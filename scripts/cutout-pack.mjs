// Makes the top-down packing item art transparent IN PLACE.
//
// The pack-*.png assets shipped with a solid white background baked in
// (colorType 2, no alpha), so in the tray they render as ugly white boxes.
// This reuses the same shadow-aware, edge-connected flood fill as
// processFoodArt.mjs: it clears near-white paper AND the neutral-gray drop
// shadow, while enclosed light areas inside a colorful subject (e.g. rice)
// stay intact because the fill only enters from the border.
//
// Dimensions and file format are preserved, so no level/scale code changes.
//
// Usage: node scripts/cutout-pack.mjs
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";

const DIR = "public/assets/tidy/";
// The regenerated art ships with a painted "fake transparency" checkerboard:
// a perfectly neutral gray pattern (r === g === b, chroma 0) ranging dark→light.
// Real rendered food keeps a slight color cast even in whites, so we treat only
// near-perfectly-neutral pixels as background.

const FILES = [
  // bento
  "pack-rice", "pack-egg", "pack-sushi", "pack-broccoli", "pack-sausage", "pack-tomato",
  // picnic
  "pack-watermelon", "pack-baguette", "pack-bottle", "pack-cheese", "pack-sandwich", "pack-jam",
  // suitcase
  "pack-clothes", "pack-towel", "pack-shoes", "pack-toiletry", "pack-camera", "pack-sunglasses",
];

function cutout(png) {
  const { width: w, height: h, data } = png;
  // Reset alpha so the pass is idempotent (a prior run may have zeroed pixels
  // that the current, improved classifier should keep). RGB is left untouched.
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b);
    const chroma = max - Math.min(r, g, b);
    // Near-perfectly-neutral gray = painted checkerboard background. The
    // checkerboard's lightest squares top out around 190, while bright white
    // foods (rice, folded whites, egg white) sit above 225 — so the brightness
    // cap keeps the fill from climbing out of the background into those foods.
    return chroma <= 12 && max <= 205;
  };
  const visited = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y++) stack.push([0, y], [w - 1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (visited[p]) continue;
    const i = p * 4;
    if (!isBg(i)) continue;
    visited[p] = 1;
    data[i + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  // One-pixel feather so opaque edges next to cleared pixels don't keep a hard
  // white halo.
  const copy = Buffer.from(data);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (copy[i + 3] === 0) continue;
      let nearEmpty = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = ((y + dy) * w + (x + dx)) * 4;
        if (copy[ni + 3] === 0) nearEmpty = true;
      }
      if (nearEmpty) data[i + 3] = 170;
    }
  }
  return { visited };
}

for (const name of FILES) {
  const file = DIR + name + ".png";
  if (!fs.existsSync(file)) {
    console.log("skip (missing):", name);
    continue;
  }
  const png = PNG.sync.read(fs.readFileSync(file));
  const { visited } = cutout(png);
  fs.writeFileSync(file, PNG.sync.write(png));
  const cleared = visited.reduce((a, b) => a + b, 0);
  console.log(name, "cleared", cleared, "px of", png.width * png.height);
}
