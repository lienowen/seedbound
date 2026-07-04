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
const BG_THRESH = 232; // pixels brighter than this (all channels) = white paper

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
  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (min >= BG_THRESH) return true; // near-white paper
    const chroma = max - min;
    const bright = (r + g + b) / 3;
    return chroma <= 22 && bright >= 140; // soft neutral-gray shadow
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
