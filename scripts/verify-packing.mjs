// Safety net: prove every packing level has at least one perfect tiling, so no
// interleaved packing puzzle can ever be unwinnable. Packing win = all items
// placed legally with no overlap; since total item area == grid area, a full
// placement is a perfect tiling. We solve with backtracking (rotations allowed
// for rotatable pieces) and fail loudly if any level is unsolvable.
//
// Run: node scripts/verify-packing.mjs

import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";

// The item library isn't exported by default; fall back to reading sizes off the
// level items themselves (each carries its footprint via the shared library).
function footprintFor(item) {
  // Items in a level reference a library key; the assembled level embeds size.
  const size = item.size || item.footprint;
  if (!size) throw new Error(`item ${item.id || item.image} missing size`);
  return { w: size[0], h: size[1], rotatable: !!item.rotatable };
}

function orientations(piece) {
  const out = [{ w: piece.w, h: piece.h }];
  if (piece.rotatable && piece.w !== piece.h) out.push({ w: piece.h, h: piece.w });
  return out;
}

function solve(cols, rows, pieces) {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const totalCells = cols * rows;
  const pieceArea = pieces.reduce((s, p) => s + p.w * p.h, 0);
  if (pieceArea !== totalCells) {
    return { ok: false, reason: `area ${pieceArea} != grid ${totalCells}` };
  }
  // Sort large-first to prune faster.
  const order = [...pieces].sort((a, b) => b.w * b.h - a.w * a.h);

  function firstEmpty() {
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (!grid[y][x]) return [x, y];
    return null;
  }
  function canPlace(x, y, w, h) {
    if (x + w > cols || y + h > rows) return false;
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (grid[y + dy][x + dx]) return false;
    return true;
  }
  function fill(x, y, w, h, v) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) grid[y + dy][x + dx] = v;
  }
  const used = new Array(order.length).fill(false);

  function backtrack(placed) {
    if (placed === order.length) return true;
    const cell = firstEmpty();
    if (!cell) return false;
    const [cx, cy] = cell;
    for (let i = 0; i < order.length; i++) {
      if (used[i]) continue;
      for (const o of orientations(order[i])) {
        if (canPlace(cx, cy, o.w, o.h)) {
          fill(cx, cy, o.w, o.h, true);
          used[i] = true;
          if (backtrack(placed + 1)) return true;
          used[i] = false;
          fill(cx, cy, o.w, o.h, false);
        }
      }
    }
    return false;
  }
  return { ok: backtrack(0) };
}

let failures = 0;
const packing = FRIDGE_BR_CAMPAIGN.filter((l) => l.packing);
console.log(`Found ${packing.length} packing levels in campaign.\n`);
for (const level of packing) {
  const slot = level.slots.find((s) => s.zone === "pack") || level.slots[0];
  const cols = slot.cols;
  const rows = slot.rows;
  const pieces = level.items.map(footprintFor);
  const res = solve(cols, rows, pieces);
  const tag = `[${level.phase}] ${level.id} (${cols}x${rows}, ${pieces.length} items)`;
  if (res.ok) {
    console.log(`  OK    ${tag}`);
  } else {
    failures++;
    console.error(`  FAIL  ${tag} -> ${res.reason || "no perfect tiling exists"}`);
  }
}
console.log("");
if (failures > 0) {
  console.error(`${failures} packing level(s) are UNSOLVABLE. Fix the tiling before shipping.`);
  process.exit(1);
}
console.log("All packing levels have a verified perfect tiling.");
