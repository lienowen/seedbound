import { StorageEngine } from "../src/game/StorageEngine.js";
import { PICNIC_LEVEL } from "../src/levels/fridgePhaserLevel.js";

// Auto-solve the picnic packing level: greedily place each item using the
// engine's own findFirstValidPlacement (which now tries both orientations).
// Proves the level is solvable and that rotation is wired end to end.
const engine = new StorageEngine(structuredClone(PICNIC_LEVEL));
const items = PICNIC_LEVEL.items.map((it) => it.id);

let placed = 0;
const usedRotation = [];
for (const id of items) {
  const spot = engine.findFirstValidPlacement(id);
  if (!spot) {
    console.log("FAIL: no placement for", id);
    continue;
  }
  const res = engine.placeItem(id, spot);
  if (res.ok) {
    placed += 1;
    if (spot.rot % 2 !== 0) usedRotation.push(id);
    console.log(`placed ${id.padEnd(16)} at col${spot.col} row${spot.row} rot${spot.rot} (${engine.itemSize(id, spot.rot).w}x${engine.itemSize(id, spot.rot).h})`);
  } else {
    console.log("FAIL placing", id, res.reason);
  }
}

const validation = engine.validate();
console.log("---");
console.log("placed", placed, "/", items.length);
console.log("rotated items:", usedRotation.join(", ") || "(none)");
console.log("level complete:", validation.complete);
