// Auto-calibrate slot positions by analyzing fridge-board.png pixels
import { readFileSync } from 'fs';
import { createCanvas, loadImage } from 'canvas';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imgPath = resolve(__dirname, '../public/assets/tidy/fridge-board.png');

async function main() {
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Game canvas size vs image size
  const GAME_W = 750, GAME_H = 1334;
  const scaleX = GAME_W / img.width;
  const scaleY = GAME_H / img.height;

  function gameY(imgY) { return Math.round(imgY * scaleY); }
  function gameX(imgX) { return Math.round(imgX * scaleX); }

  // Sample pixel brightness at image coords
  function brightness(imgX, imgY) {
    const p = ctx.getImageData(Math.round(imgX), Math.round(imgY), 1, 1).data;
    return (p[0] + p[1] + p[2]) / 3;
  }

  // Find shelf surface: scan down a column, find bright→dark transition
  // (shelf surface is bright, area below is darker)
  function findShelfSurface(imgX, imgYStart, imgYEnd) {
    let lastBright = brightness(imgX, imgYStart) > 180;
    let surfaceY = null;
    for (let y = imgYStart + 1; y < imgYEnd; y++) {
      const bright = brightness(imgX, y) > 180;
      // Bright → Dark = top of shelf front (where surface ends)
      if (lastBright && !bright && surfaceY === null) {
        surfaceY = gameY(y);
      }
      lastBright = bright;
    }
    return surfaceY;
  }

  // Define analysis columns in image coordinates
  // Main compartment ~ center at 40% of image width
  const shelfCol1 = Math.round(img.width * 0.33);  // Left shelf column
  const shelfCol2 = Math.round(img.width * 0.52);  // Right shelf column
  const doorCol = Math.round(img.width * 0.76);     // Door column

  // Scan ranges in image Y
  const topRange = [Math.round(img.height * 0.22), Math.round(img.height * 0.36)];
  const midRange = [Math.round(img.height * 0.36), Math.round(img.height * 0.52)];
  const lowRange = [Math.round(img.height * 0.52), Math.round(img.height * 0.68)];

  console.log('=== Pixel Analysis ===');
  console.log(`Image: ${img.width}x${img.height}, Game: ${GAME_W}x${GAME_H}`);
  console.log(`Scale: X=${scaleX.toFixed(4)} Y=${scaleY.toFixed(4)}`);

  // Find shelf surfaces
  const shelfTopY1 = findShelfSurface(shelfCol1, ...topRange);
  const shelfTopY2 = findShelfSurface(shelfCol2, ...topRange);
  const shelfMidY1 = findShelfSurface(shelfCol1, ...midRange);
  const shelfMidY2 = findShelfSurface(shelfCol2, ...midRange);
  const doorTopY = findShelfSurface(doorCol, ...topRange);
  const doorMidY = findShelfSurface(doorCol, ...midRange);
  const doorLowY = findShelfSurface(doorCol, ...lowRange);

  console.log('\nDetected shelf surfaces (game Y):');
  console.log(`  shelf_top:  ${shelfTopY1} / ${shelfTopY2} → avg ${Math.round((shelfTopY1 + shelfTopY2) / 2)}`);
  console.log(`  shelf_mid:  ${shelfMidY1} / ${shelfMidY2} → avg ${Math.round((shelfMidY1 + shelfMidY2) / 2)}`);
  console.log(`  door_top:   ${doorTopY}`);
  console.log(`  door_mid:   ${doorMidY}`);
  console.log(`  door_low:   ${doorLowY}`);

  // Generate slot config
  const topY = Math.round((shelfTopY1 + shelfTopY2) / 2);
  const midY = Math.round((shelfMidY1 + shelfMidY2) / 2);

  // Slot X positions (centered in their columns)
  const shelf1CX = gameX(shelfCol1);
  const shelf2CX = gameX(shelfCol2);
  const doorCX = gameX(doorCol);

  console.log('\n=== Generated FRIDGE_SLOTS ===');
  const slots = [
    { id: "shelf_top_1", zone: "shelf", allow: ["carton","dairy","box","bottle","food"], x: shelf1CX - 70, y: topY - 35, w: 140, h: 120, baseline: 0.5, anchorX: shelf1CX, anchorY: topY, depth: 110 },
    { id: "shelf_top_2", zone: "shelf", allow: ["carton","dairy","box","bottle","food"], x: shelf2CX - 70, y: topY - 35, w: 140, h: 120, baseline: 0.5, anchorX: shelf2CX, anchorY: topY, depth: 111 },
    { id: "shelf_mid_1", zone: "shelf", allow: ["food","box","dairy","bottle"], x: shelf1CX - 80, y: midY - 35, w: 160, h: 120, baseline: 0.5, anchorX: shelf1CX, anchorY: midY, depth: 130 },
    { id: "shelf_mid_2", zone: "shelf", allow: ["food","box","dairy","bottle"], x: shelf2CX - 80, y: midY - 35, w: 160, h: 120, baseline: 0.5, anchorX: shelf2CX, anchorY: midY, depth: 131 },
    { id: "door_top_1", zone: "door", allow: ["bottle","dairy","carton"], x: doorCX - 35, y: doorTopY - 30, w: 70, h: 110, baseline: 0.5, anchorX: doorCX, anchorY: doorTopY, depth: 160 },
    { id: "door_mid_1", zone: "door", allow: ["bottle","dairy","carton"], x: doorCX - 35, y: doorMidY - 30, w: 70, h: 110, baseline: 0.5, anchorX: doorCX, anchorY: doorMidY, depth: 170 },
    { id: "door_low_1", zone: "door", allow: ["bottle","dairy","carton"], x: doorCX - 35, y: doorLowY - 30, w: 70, h: 110, baseline: 0.5, anchorX: doorCX, anchorY: doorLowY, depth: 180 },
  ];

  console.log(JSON.stringify(slots, null, 2));

  // Also verify by sampling brightness at each anchor
  console.log('\n=== Verification (brightness at anchor) ===');
  for (const s of slots) {
    const ix = Math.round(s.anchorX / scaleX);
    const iy = Math.round(s.anchorY / scaleY);
    const b = brightness(ix, iy);
    console.log(`  ${s.id}: anchor(${s.anchorX},${s.anchorY}) brightness=${b.toFixed(0)} ${b > 150 ? '✓ bright (on shelf)' : '✗ dark (off shelf)'}`);
  }
}

main().catch(console.error);
