import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";

function canUse(item, slot) {
  return item.tags.some((tag) => slot.allow.includes(tag));
}

function solveLevel(level) {
  const engine = new StorageEngine(level, { forceFresh: true, saveId: "__validation__" });
  const items = level.items
    .filter((item) => !item.fixed)
    .slice()
    .sort((a, b) => level.slots.filter((slot) => canUse(a, slot)).length - level.slots.filter((slot) => canUse(b, slot)).length);

  const assignment = [];
  let working = engine.snapshot();

  function dfs(index) {
    if (index >= items.length) return true;
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
            const nextState = structuredClone(working);
            nextState.items[item.id] = engine.buildPackedEntry(item.id, placement, nextState);
            assignment.push({ itemId: item.id, slotId: slot.id, col, row, layer });
            const prev = working;
            working = nextState;
            if (dfs(index + 1)) return true;
            working = prev;
            assignment.pop();
          }
        }
      }
    }
    return false;
  }

  const initialOccupancy = engine.buildOccupancy(working);
  const capacity = level.slots.reduce((sum, slot) => {
    const cols = slot.cols || 1;
    const rows = slot.rows || 1;
    const stackLayers = slot.stackLayers || 1;
    let open = 0;
    for (let layer = 0; layer < stackLayers; layer += 1) {
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (!initialOccupancy.has(`${slot.id}:${layer}:${col}:${row}`)) open += 1;
        }
      }
    }
    return sum + open;
  }, 0);

  return {
    movableCount: items.length,
    emptySlotCount: capacity,
    solved: dfs(0),
    assignment,
  };
}

let hasError = false;

for (const level of FRIDGE_BR_CAMPAIGN) {
  const result = solveLevel(level);
  const status = result.solved ? "OK" : "FAIL";
  console.log(
    `${status} ${level.id} phase=${level.phase} movable=${result.movableCount} emptySlots=${result.emptySlotCount}`,
  );
  if (!result.solved) {
    hasError = true;
  }
}

if (hasError) {
  process.exitCode = 1;
}
