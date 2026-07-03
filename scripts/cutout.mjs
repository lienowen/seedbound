import fs from "fs";
import { PNG } from "pngjs";

// Flood-fill the edge-connected near-white background to transparent, leaving
// interior light areas intact. Adds a soft 1px alpha feather at the boundary.
const files = [
  "pack-watermelon",
  "pack-baguette",
  "pack-bottle",
  "pack-cheese",
  "pack-sandwich",
  "pack-jam",
];

const DIR = "public/assets/tidy/";
const THRESH = 236; // pixels brighter than this (all channels) count as background

for (const name of files) {
  const png = PNG.sync.read(fs.readFileSync(DIR + name + ".png"));
  const { width: w, height: h, data } = png;
  const isBg = (i) => data[i] >= THRESH && data[i + 1] >= THRESH && data[i + 2] >= THRESH;

  const visited = new Uint8Array(w * h);
  const stack = [];
  // Seed from all border pixels.
  for (let x = 0; x < w; x++) {
    stack.push([x, 0], [x, h - 1]);
  }
  for (let y = 0; y < h; y++) {
    stack.push([0, y], [w - 1, y]);
  }

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (visited[p]) continue;
    const i = p * 4;
    if (!isBg(i)) continue;
    visited[p] = 1;
    data[i + 3] = 0; // transparent
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Soft feather: any opaque pixel touching a transparent one gets slight alpha
  // reduction to avoid a hard white halo.
  const copyAlpha = Buffer.from(data);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (copyAlpha[i + 3] === 0) continue;
      let nearEmpty = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = ((y + dy) * w + (x + dx)) * 4;
        if (copyAlpha[ni + 3] === 0) nearEmpty = true;
      }
      if (nearEmpty) data[i + 3] = 170;
    }
  }

  fs.writeFileSync(DIR + name + ".png", PNG.sync.write(png));
  const cleared = visited.reduce((a, b) => a + b, 0);
  console.log(name, "cleared", cleared, "px of", w * h);
}
