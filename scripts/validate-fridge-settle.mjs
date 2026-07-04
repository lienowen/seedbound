// Stronger validator: proves each level is not just "everything fits" but
// actually WINNABLE — there exists a placement where every constrained tray
// item is fully SETTLED (all hard rules satisfied). The base validator only
// checks capacity/tags/overlap; this one also enforces the win gate.
import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";

function canUse(item, slot) {
  return item.tags.some((tag) => slot.allow.includes(tag));
}

function solveLevel(level) {
  const engine = new StorageEngine(level, { forceFresh: true, saveId: "__settle_validation__" });
  // Hardest-first ordering: fewest legal slots -> fewer branches.
  const items = level.items
    .filter((item) => !item.fixed)
    .slice()
    .sort(
      (a, b) =>
        level.slots.filter((s) => canUse(a, s)).length - level.slots.filter((s) => canUse(b, s)).length,
    );

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
            // WIN GATE: constrained items must be fully settled in this spot.
            const evalc = engine.evaluateConstraints(item.id, placement, nextState);
            if (!evalc.easygoing && !evalc.allSatisfied) continue;
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
  const r = solveLevel(level);
  const status = r.solved ? "WIN " : "FAIL";
  console.log(`${status} ${level.id} phase=${level.phase} movable=${r.movableCount}`);
  if (!r.solved) hasError = true;
}
if (hasError) process.exitCode = 1;
