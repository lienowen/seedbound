import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";
import { applyCoreConsistencyPatches } from "../src/runtime/coreConsistencyBootstrap.js";
import { applyEngineConsistency } from "../src/runtime/engineConsistency.js";
import { applyEarlyCampaignLayoutPolish } from "../src/runtime/earlyCampaignLayoutPolish.js";

applyCoreConsistencyPatches();
applyEngineConsistency();
applyEarlyCampaignLayoutPolish();

const NON_BLOCKING = new Set(["mustNeighbor"]);
let failed = false;

function hasTruthfulPlacement(engine, itemId) {
  const rotations = engine.canRotate(itemId) ? [0, 1] : [0];
  for (const rot of rotations) {
    for (const slot of engine.level.slots) {
      const grid = engine.slotGrid(slot);
      const size = engine.itemSize(itemId, rot);
      if (size.w > grid.cols || size.h > grid.rows) continue;
      for (let layer = 0; layer < grid.stackLayers; layer += 1) {
        for (let row = 0; row <= grid.rows - size.h; row += 1) {
          for (let col = 0; col <= grid.cols - size.w; col += 1) {
            const placement = { slotId: slot.id, col, row, layer, rot };
            if (!engine.evaluatePlacement(itemId, placement).valid) continue;
            const report = engine.evaluateConstraints(itemId, placement, engine.state);
            const blockingOk = report.results
              .filter((rule) => !NON_BLOCKING.has(rule.type))
              .every((rule) => rule.satisfied);
            if (blockingOk) return true;
          }
        }
      }
    }
  }
  return false;
}

for (const level of FRIDGE_BR_CAMPAIGN) {
  const match = /^fridge-br-(\d+)$/.exec(level.id || "");
  const number = match ? Number(match[1]) : 0;
  if (number < 1 || number > 10) continue;

  const engine = new StorageEngine(level, { forceFresh: true, saveId: `__audit_${level.id}` });
  const initial = engine.validate();
  const movable = level.items.filter((item) => !item.fixed);
  const missing = movable.filter((item) => !hasTruthfulPlacement(engine, item.id)).map((item) => item.id);

  const ok = initial.validPlacement && missing.length === 0;
  console.log(`${ok ? "OK" : "FAIL"} ${level.id} movable=${movable.length} missing=${missing.join(",") || "none"}`);
  if (!ok) failed = true;
}

if (failed) process.exitCode = 1;
