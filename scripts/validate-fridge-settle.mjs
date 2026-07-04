// Settle-aware campaign validator.
//
// validate-fridge-campaign.mjs only proves every movable item can be PLACED
// legally (capacity/tags/overlap). But the real win condition also requires
// every item with hard rules to have ALL of them satisfied
// (settledCount >= constrainedTotal). This solver searches for an arrangement
// where that is true, so we can guarantee a level is actually completable after
// adding/altering requirement types.
//
// Correctness is calibrated against the original committed levels: they ship as
// winnable, so a correct solver MUST report every one of them solvable.

import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";

function canUse(item, slot) {
  return item.tags.some((tag) => slot.allow.includes(tag));
}

function solveLevel(level) {
  // Packing levels have no zone/temperature rules — placement legality IS the win.
  const winMode = level.winMode;
  const engine = new StorageEngine(level, { forceFresh: true, saveId: "__settle__" });

  // Search most-constrained items first — dramatically prunes the tree.
  const items = level.items
    .filter((item) => !item.fixed)
    .slice()
    .sort((a, b) => engine.itemConstraints(b).length - engine.itemConstraints(a).length);

  let working = engine.snapshot();

  function leafOk() {
    if (winMode === "packing") return true;
    const rep = engine.constraintReport(working);
    return rep.settledCount >= rep.constrainedTotal;
  }

  function dfs(index) {
    if (index >= items.length) return leafOk();
    const item = items[index];
    for (const slot of level.slots) {
      if (!canUse(item, slot)) continue;
      const { cols = 1, rows = 1, stackLayers = 1 } = slot;
      const [width = 1, height = 1] = item.size || [1, 1];
      for (let layer = 0; layer < stackLayers; layer += 1) {
        for (let row = 0; row <= rows - height; row += 1) {
          for (let col = 0; col <= cols - width; col += 1) {
            const placement = { slotId: slot.id, col, row, layer };
            const check = engine.evaluatePlacement(item.id, placement, working);
            if (!check.valid) continue;
            // Prune on this item's own-slot rules (cold/warm/zone/topShelf/visible).
            // Neighbor rules (hates) are verified at the leaf via constraintReport.
            if (winMode !== "packing") {
              const evalc = engine.evaluateConstraints(item.id, placement, working);
              if (!evalc.allSatisfied) continue;
            }
            const nextState = structuredClone(working);
            nextState.items[item.id] = engine.buildPackedEntry(item.id, placement, nextState);
            const prev = working;
            working = nextState;
            if (dfs(index + 1)) return true;
            working = prev;
          }
        }
      }
    }
    return false;
  }

  return { movableCount: items.length, solved: dfs(0) };
}

let hasError = false;
for (const level of FRIDGE_BR_CAMPAIGN) {
  const result = solveLevel(level);
  const status = result.solved ? "OK  " : "FAIL";
  console.log(`${status} ${level.id} movable=${result.movableCount}`);
  if (!result.solved) hasError = true;
}
if (hasError) process.exitCode = 1;
