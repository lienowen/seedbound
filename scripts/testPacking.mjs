import { StorageEngine } from "../src/game/StorageEngine.js";
import { PICNIC_LEVEL, SUITCASE_LEVEL } from "../src/levels/fridgePhaserLevel.js";

// Auto-solve each packing level: greedily place each item using the engine's
// own findFirstValidPlacement (which tries both orientations). Proves each
// level is solvable and that rotation is wired end to end.
function solve(level) {
  const engine = new StorageEngine(structuredClone(level));
  const items = level.items.map((it) => it.id);
  let placed = 0;
  const usedRotation = [];
  for (const id of items) {
    const spot = engine.findFirstValidPlacement(id);
    if (!spot) {
      console.log("  FAIL: no placement for", id);
      continue;
    }
    const res = engine.placeItem(id, spot);
    if (res.ok) {
      placed += 1;
      if (spot.rot % 2 !== 0) usedRotation.push(id);
      console.log(`  placed ${id.padEnd(18)} col${spot.col} row${spot.row} rot${spot.rot} (${engine.itemSize(id, spot.rot).w}x${engine.itemSize(id, spot.rot).h})`);
    } else {
      console.log("  FAIL placing", id, res.reason);
    }
  }
  const validation = engine.validate();
  console.log(`  => placed ${placed}/${items.length} | rotated: ${usedRotation.join(", ") || "(none)"} | complete: ${validation.complete}`);
  return validation.complete && placed === items.length;
}

let ok = true;
for (const level of [PICNIC_LEVEL, SUITCASE_LEVEL]) {
  console.log(`\n[${level.id}]`);
  ok = solve(level) && ok;
}
console.log("\nALL LEVELS SOLVABLE:", ok);
