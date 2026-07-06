import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";
import { applyCoreConsistencyPatches } from "../src/runtime/coreConsistencyBootstrap.js";
import { applyEngineConsistency } from "../src/runtime/engineConsistency.js";
import { applyEarlyCampaignLayoutPolish } from "../src/runtime/earlyCampaignLayoutPolish.js";
import { applyEarlyCampaignCapacityPolish } from "../src/runtime/earlyCampaignCapacityPolish.js";

applyCoreConsistencyPatches();
applyEngineConsistency();
applyEarlyCampaignLayoutPolish();
applyEarlyCampaignCapacityPolish();

function options(engine, id, state) {
  const out = [];
  for (const slot of engine.level.slots) {
    const grid = engine.slotGrid(slot);
    const size = engine.itemSize(id, 0);
    if (size.w > grid.cols || size.h > grid.rows) continue;
    for (let row = 0; row <= grid.rows - size.h; row += 1) {
      for (let col = 0; col <= grid.cols - size.w; col += 1) {
        const p = { slotId: slot.id, col, row, layer: 0, rot: 0 };
        if (engine.evaluatePlacement(id, p, state).valid) out.push(p);
      }
    }
  }
  return out;
}

function solve(level) {
  const engine = new StorageEngine(level, { forceFresh: true, saveId: `__solve_${level.id}` });
  let state = engine.snapshot();
  const ids = level.items.filter((item) => !item.fixed).map((item) => item.id);
  let visited = 0;

  function dfs(left) {
    visited += 1;
    if (!left.length) return engine.validate(state).complete;
    let id = null;
    let opts = null;
    for (const candidate of left) {
      const next = options(engine, candidate, state);
      if (!next.length) return false;
      if (!opts || next.length < opts.length) { id = candidate; opts = next; }
    }
    for (const p of opts) {
      const prev = state;
      const next = structuredClone(state);
      next.items[id] = engine.buildPackedEntry(id, p, next);
      state = next;
      if (dfs(left.filter((x) => x !== id))) return true;
      state = prev;
    }
    return false;
  }

  return { solved: dfs(ids), visited };
}

let failed = false;
for (const level of FRIDGE_BR_CAMPAIGN) {
  const n = Number(/^fridge-br-(\d+)$/.exec(level.id || "")?.[1] || 0);
  if (n < 1 || n > 10) continue;
  const result = solve(level);
  console.log(`${result.solved ? "OK" : "FAIL"} ${level.id} visited=${result.visited}`);
  if (!result.solved) failed = true;
}
if (failed) process.exitCode = 1;
