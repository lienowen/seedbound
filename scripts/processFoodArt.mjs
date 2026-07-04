// Offline pipeline that turns raw generated food art (public/assets/tidy/_src/<key>.png,
// square, near-white background, subject sitting near the bottom) into:
//   1. a transparent, 362x362, bottom-aligned WebP at public/assets/tidy/<file>
//   2. a render profile (pivot + contact strip + visible band) printed as JSON,
//      ready to paste into src/levels/itemRenderProfiles.js
//
// Usage: node scripts/processFoodArt.mjs
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import sharp from "sharp";

const DIR = "public/assets/tidy/";
const SRC = path.join(DIR, "_src");
const CANVAS = 362;          // final texture size (matches existing fridge foods)
const BG_THRESH = 232;       // pixels brighter than this (all channels) = background
const ALPHA_MIN = 40;        // alpha above this counts as "opaque" for measuring
const BOTTOM_PAD = 0.02;     // fraction of canvas left below the subject's feet
const CONTACT_BAND = 0.06;   // fraction of subject height used as the contact strip

// key = library key, file = output name, stackable = flat enough to stack on.
const ITEMS = [
  { key: "carrot", file: "carrot.webp", stackable: false },
  { key: "bread", file: "bread.webp", stackable: true },
  { key: "cheese", file: "cheese.webp", stackable: true },
  { key: "apple", file: "apple.webp", stackable: false },
  { key: "broccoli", file: "broccoli.webp", stackable: false },
  { key: "tomato", file: "tomato.webp", stackable: false },
  { key: "butter", file: "butter.webp", stackable: true },
  { key: "watermelon", file: "watermelon.webp", stackable: false },
  { key: "corn", file: "corn.webp", stackable: false },
  { key: "fish", file: "fish.webp", stackable: false },
];

// Flood-fill edge-connected near-white background to transparent (leaves the
// interior of the subject intact), then feather the boundary by one pixel.
function cutout(png) {
  const { width: w, height: h, data } = png;
  // Background = pure near-white OR the neutral-gray drop shadow. Food art is
  // colorful (high chroma), so a low-chroma medium/bright pixel is shadow, not
  // subject. Flood fill only enters from the border so enclosed light highlights
  // inside a colorful subject stay intact.
  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (min >= BG_THRESH) return true;           // near-white paper
    const chroma = max - min;
    const bright = (r + g + b) / 3;
    return chroma <= 22 && bright >= 140;         // soft neutral-gray shadow
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
  return png;
}

// Bounding box of opaque pixels.
function bbox(png) {
  const { width: w, height: h, data } = png;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_MIN) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

// Compute a render profile from the final 362 texture's alpha.
function profile(png, stackable) {
  const { width: w, height: h, data } = png;
  const b = bbox(png);
  const subH = b.maxY - b.minY + 1;
  const contactTopY = b.maxY - Math.round(subH * CONTACT_BAND);
  // Contact strip extents over the bottom band.
  let cl = w, cr = -1, sumX = 0, n = 0;
  for (let y = contactTopY; y <= b.maxY; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_MIN) {
        if (x < cl) cl = x;
        if (x > cr) cr = x;
        sumX += x; n++;
      }
    }
  }
  const contactCenterX = n ? sumX / n : (b.minX + b.maxX) / 2;
  const r = (v) => Number(v.toFixed(4));
  return {
    originX: r(contactCenterX / w),
    originY: r((b.maxY + 1) / h),
    contactLeft: r(cl / w),
    contactRight: r((cr + 1) / w),
    contactCenterX: r(contactCenterX / w),
    contactY: r((b.maxY + 1) / h),
    visibleTopY: r(b.minY / h),
    visibleHeight: r(subH / h),
    supportTopY: r(b.minY / h),
    stackable: !!stackable,
    textureWidth: w,
    textureHeight: h,
  };
}

const profiles = {};

for (const item of ITEMS) {
  const srcPath = path.join(SRC, item.key + ".png");
  if (!fs.existsSync(srcPath)) {
    console.log("skip (no source):", item.key);
    continue;
  }
  // 1) cut out background on the raw art.
  const raw = PNG.sync.read(fs.readFileSync(srcPath));
  cutout(raw);
  const cutBuf = PNG.sync.write(raw);

  // 2) trim transparent margins, resize to fit, bottom-align on a 362 canvas.
  const trimmed = await sharp(cutBuf).trim().toBuffer({ resolveWithObject: true });
  const tw = trimmed.info.width;
  const th = trimmed.info.height;
  const maxContent = Math.round(CANVAS * (1 - BOTTOM_PAD));
  const scale = Math.min((CANVAS * 0.92) / tw, maxContent / th);
  const rw = Math.max(1, Math.round(tw * scale));
  const rh = Math.max(1, Math.round(th * scale));
  const resized = await sharp(trimmed.data).resize(rw, rh).toBuffer();
  const top = CANVAS - rh - Math.round(CANVAS * BOTTOM_PAD);
  const left = Math.round((CANVAS - rw) / 2);
  const composed = await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, top, left }])
    .png()
    .toBuffer();

  // 3) write final webp.
  await sharp(composed).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(DIR, item.file));

  // 4) render profile from the composed alpha.
  const finalPng = PNG.sync.read(composed);
  profiles[item.key] = profile(finalPng, item.stackable);
  console.log("done:", item.key, "->", item.file, `(${rw}x${rh})`);
}

fs.writeFileSync(path.join(SRC, "profiles.json"), JSON.stringify(profiles, null, 2));
console.log("\nProfiles written to", path.join(SRC, "profiles.json"));
console.log(JSON.stringify(profiles, null, 2));
