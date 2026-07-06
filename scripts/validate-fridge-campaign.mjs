import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";

const firstLevel = FRIDGE_BR_CAMPAIGN.find((level) => level.id === "fridge-br-1");
if (firstLevel) {
  firstLevel.items = firstLevel.items
    .filter((item) => item.fixed || !["strawberries", "cake"].includes(item.image))
    .map((item) => (
      !item.fixed && ["milk", "juice"].includes(item.image)
        ? { ...item, prefs: { ...(item.prefs || {}), zone: "door", needsCold: false } }
        : item
    ));
}

function rotationsFor(engine, itemId) {
  return engine.canRotate(itemId) ? [0, 1] : [0];
}

function legalPlacements(engine, itemId, candidate) {
  const placements = [];
  for (const rot of rotationsFor(engine, itemId)) {
    for (const slot of engine.level.slots) {
      const { cols, rows, stackLayers } = engine.slotGrid(slot);
      const { w, h } = engine.itemSize(itemId, rot);
      if (w > cols || h > rows) continue;
      for (let layer = 0; layer < stackLayers; layer += 1) {
        for (let row = 0; row <= rows - h; row += 1) {
          for (let col = 0; col <= cols - w; col += 1) {
            const placement = { slotId: slot.id, col, row, layer, rot };
            const check = engine.evaluatePlacement(itemId, placement, candidate);
            if (!check.valid) continue;
            const rules = engine.evaluateConstraints(itemId, placement, candidate);
            placements.push({ ...placement, score: check.score ?? 0, settled: rules.allSatisfied });
          }
        }
      }
    }
  }
  placements.sort((a, b) => Number(b.settled) - Number(a.settled) || b.score - a.score);
  return placements;
}

function solveLevel(level) {
  const engine = new StorageEngine(level, { forceFresh: true, saveId: "__validation__" });
  let working = engine.snapshot();
  let visited = 0;
  const movableIds = level.items.filter((item) => !item.fixed).map((item) => item.id);

  function dfs(remainingIds) {
    visited += 1;
    if (!remainingIds.length) return engine.validate(working).complete;

    let chosenId = null;
    let chosenPlacements = null;
    for (const itemId of remainingIds) {
      const placements = legalPlacements(engine, itemId, working);
      if (!placements.length) return false;
      if (!chosenPlacements || placements.length < chosenPlacements.length) {
        chosenId = itemId;
        chosenPlacements = placements;
      }
    }

    const rest = remainingIds.filter((id) => id !== chosenId);
    for (const placement of chosenPlacements) {
      const previous = working;
      const next = structuredClone(working);
      next.items[chosenId] = engine.buildPackedEntry(chosenId, placement, next);
      working = next;
      if (dfs(rest)) return true;
      working = previous;
    }
    return false;
  }

  const solved = dfs(movableIds);
  return {
    solved,
    visited,
    movableCount: movableIds.length,
    finalValidation: solved ? engine.validate(working) : null,
  };
}

let hasError = false;
for (const level of FRIDGE_BR_CAMPAIGN) {
  const result = solveLevel(level);
  console.log(`${result.solved ? "OK" : "FAIL"} ${level.id} phase=${level.phase} movable=${result.movableCount} visited=${result.visited}`);
  if (!result.solved || !result.finalValidation?.complete) hasError = true;
}

if (hasError) process.exitCode = 1;
