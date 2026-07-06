// One-off asset importer for the hand-designed supermarket art.
// The source PNGs ship on a solid WHITE background, so products + fixtures need
// the white knocked out (border flood-fill so interior whites like labels and
// lit fridge interiors survive). Then:
//  - Products: resize to 512², save, compute an alpha-silhouette render profile.
//  - Fixtures: white removed, resize, save (composited over aisle backdrops).
//  - Backgrounds: full opaque scenes, just resize.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const IN = "/tmp/assets_in";
const OUT = "/vercel/share/v0-project/public/assets/tidy";
const ALPHA = 40;

const PRODUCTS = [
  { src: "img_4.png", name: "jar-strawberry", target: 128 },
  { src: "img_5.png", name: "jar-orange", target: 128 },
  { src: "img_6.png", name: "jar-peanut", target: 128 },
  { src: "img_7.png", name: "jar-choco", target: 128 },
  { src: "img_8.png", name: "can-tomato", target: 120 },
  { src: "img_9.png", name: "can-corn", target: 120 },
  { src: "img_10.png", name: "can-peas", target: 120 },
  { src: "img_11.png", name: "can-tuna", target: 104 },
  { src: "img_12.png", name: "box-pasta", target: 146 },
  { src: "img_13.png", name: "box-cereal", target: 146 },
];
const FIXTURES = [
  { src: "img_1.png", name: "cooler-glass3", width: 980, knock: true },
  { src: "img_14.png", name: "cooler-white3", width: 980, knock: true },
  { src: "img_15.png", name: "cooler-black2", width: 980, knock: true },
  { src: "img_16.png", name: "cooler-silver4", width: 980, knock: true },
  { src: "img_2.png", name: "shelf-plain", width: 980, knock: true },
  { src: "img_17.png", name: "shelf-beige", width: 980, knock: true },
  { src: "img_18.png", name: "shelf-wood", width: 980, knock: true },
  { src: "img_19.png", name: "shelf-metal", width: 980, knock: true },
];
const BACKGROUNDS = [
  { src: "img_3.png", name: "shop-aisle-a", width: 750 },
  { src: "img_20.png", name: "shop-aisle-b", width: 750 },
  { src: "img_21.png", name: "shop-front", width: 900 },
];

// Knock out the white background via a flood fill seeded from every border
// pixel. Only white-ish pixels reachable from the border become transparent, so
// interior whites (labels, fridge interiors) are preserved. Returns an RGBA buf.
function knockWhite(data, W, H, { hard = 236, soft = 210 } = {}) {
  const isWhite = (i, thr) => data[i] >= thr && data[i + 1] >= thr && data[i + 2] >= thr;
  const bg = new Uint8Array(W * H); // 1 = background
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (bg[p]) return;
    if (!isWhite(p * 4, soft)) return;
    bg[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  for (let p = 0; p < W * H; p++) {
    if (!bg[p]) continue;
    const i = p * 4;
    // Soft edge: pixels between soft..hard get partial transparency for a
    // clean anti-aliased cutout instead of a hard white fringe.
    const lum = Math.min(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = lum >= hard ? 0 : Math.round(((hard - lum) / (hard - soft)) * 255 * 0.35);
  }
  return data;
}

async function loadRGBA(inPath) {
  const { data, info } = await sharp(inPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}

function alphaProfile(data, W, H) {
  let minX = W, minY = H, maxX = 0, maxY = 0;
  const at = (x, y) => data[(y * W + x) * 4 + 3];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (at(x, y) > ALPHA) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const band = Math.max(minY, maxY - Math.round((maxY - minY) * 0.06));
  let cMinX = W, cMaxX = 0;
  for (let y = band; y <= maxY; y++) for (let x = 0; x < W; x++) {
    if (at(x, y) > ALPHA) { if (x < cMinX) cMinX = x; if (x > cMaxX) cMaxX = x; }
  }
  const f = (n) => Number(n.toFixed(4));
  return {
    originX: f((minX + maxX) / 2 / W), originY: f(maxY / H),
    contactLeft: f(cMinX / W), contactRight: f(cMaxX / W), contactCenterX: f((cMinX + cMaxX) / 2 / W),
    contactY: f(maxY / H), visibleTopY: f(minY / H), visibleHeight: f((maxY - minY) / H),
    supportTopY: f(minY / H), stackable: false, textureWidth: W, textureHeight: H,
    _bbox: { minX, minY, maxX, maxY },
  };
}

const profiles = {}, libEntries = [];

for (const p of PRODUCTS) {
  const raw = await sharp(path.join(IN, p.src)).resize(512, 512, { fit: "contain", background: "#ffffff" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const data = knockWhite(raw.data, raw.info.width, raw.info.height);
  await sharp(data, { raw: { width: 512, height: 512, channels: 4 } }).png().toFile(path.join(OUT, `${p.name}.png`));
  const prof = alphaProfile(data, 512, 512);
  delete prof._bbox;
  profiles[p.name] = prof;
  const scale = Number((p.target / (prof.visibleHeight * prof.textureHeight)).toFixed(4));
  libEntries.push({ name: p.name, file: `${p.name}.png`, target: p.target, scale, vh: prof.visibleHeight, cw: Number((prof.contactRight - prof.contactLeft).toFixed(3)) });
}

for (const fxt of FIXTURES) {
  const { data, W, H } = await loadRGBA(path.join(IN, fxt.src));
  const knocked = knockWhite(data, W, H);
  await sharp(knocked, { raw: { width: W, height: H, channels: 4 } }).resize({ width: fxt.width }).png().toFile(path.join(OUT, `${fxt.name}.png`));
}
for (const bg of BACKGROUNDS) {
  await sharp(path.join(IN, bg.src)).resize({ width: bg.width }).png().toFile(path.join(OUT, `${bg.name}.png`));
}

fs.writeFileSync("/tmp/asset-profiles.json", JSON.stringify({ profiles, libEntries }, null, 2));
console.log("done. product scales/vh/contactWidth:");
for (const e of libEntries) console.log(` ${e.name}\tscale=${e.scale}\tvh=${e.vh}\tcw=${e.cw}`);
