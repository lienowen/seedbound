// Detect horizontal shelf-plank lines inside a fixture PNG.
// Strategy: for each row, measure a "darkness+edge" score across the middle
// horizontal band (ignoring outer frame). Shelf planks show up as local maxima
// of a sustained dark horizontal band. We report the normalized Y (0..1) of the
// detected planks plus the fixture's opaque bounding box.
import sharp from "sharp";
import path from "node:path";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node detect-shelves.mjs <png>...");
  process.exit(1);
}

async function analyze(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const at = (x, y) => {
    const i = (y * W + x) * C;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };
  // Opaque bbox
  let minX = W, maxX = 0, minY = H, maxY = 0;
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (at(x, y).a > 40) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  // Row darkness score across central 60% width band.
  const x0 = Math.round(minX + (maxX - minX) * 0.2);
  const x1 = Math.round(minX + (maxX - minX) * 0.8);
  const rowScore = [];
  for (let y = 0; y < H; y++) {
    let dark = 0, n = 0;
    for (let x = x0; x <= x1; x += 2) {
      const p = at(x, y);
      if (p.a < 40) continue;
      n++;
      const lum = (p.r * 0.299 + p.g * 0.587 + p.b * 0.114);
      if (lum < 120) dark++;
    }
    rowScore[y] = n > 0 ? dark / n : 0;
  }
  // Find peaks: rows where dark ratio is high (a shelf edge/shadow band).
  const peaks = [];
  const thresh = 0.45;
  for (let y = minY; y <= maxY; y++) {
    if (rowScore[y] >= thresh) {
      // group consecutive
      let end = y;
      while (end + 1 <= maxY && rowScore[end + 1] >= thresh) end++;
      const mid = Math.round((y + end) / 2);
      peaks.push(mid);
      y = end + 8; // skip ahead to avoid duplicates
    }
  }
  const norm = (v, lo, hi) => +( (v - lo) / (hi - lo) ).toFixed(4);
  console.log("\n=== " + path.basename(file) + " (" + W + "x" + H + ") ===");
  console.log("bbox frac: x[" + norm(minX,0,W) + "," + norm(maxX,0,W) + "] y[" + norm(minY,0,H) + "," + norm(maxY,0,H) + "]");
  console.log("shelf lines (frac of full H):", peaks.map((p) => +(p / H).toFixed(4)).join(", "));
  console.log("shelf lines (frac of bbox):", peaks.map((p) => norm(p, minY, maxY)).join(", "));
}

for (const f of files) await analyze(f);
