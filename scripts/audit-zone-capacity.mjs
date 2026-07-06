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

let failed = false;

function openCapacity(engine) {
  const occupied = engine.buildOccupancy(engine.state);
  const byZone = new Map();
  for (const slot of engine.level.slots) {
    const grid = engine.slotGrid(slot);
    let open = 0;
    for (let layer = 0; layer < grid.stackLayers; layer += 1) {
      for (let row = 0; row < grid.rows; row += 1) {
        for (let col = 0; col < grid.cols; col += 1) {
          if (!occupied.has(`${slot.id}:${layer}:${col}:${row}`)) open += 1;
        }
      }
    }
    byZone.set(slot.zone, (byZone.get(slot.zone) || 0) + open);
  }
  return byZone;
}

for (const level of FRIDGE_BR_CAMPAIGN) {
  const number = Number(/^fridge-br-(\d+)$/.exec(level.id || "")?.[1] || 0);
  if (number < 1 || number > 10) continue;

  const engine = new StorageEngine(level, { forceFresh: true, saveId: `__capacity_${level.id}` });
  const open = openCapacity(engine);
  const needs = new Map();
  let coldNeed = 0;

  for (const item of level.items.filter((entry) => !entry.fixed)) {
    const area = engine.itemSize(item.id, 0).w * engine.itemSize(item.id, 0).h;
    const rules = engine.itemConstraints(item);
    const zone = rules.find((rule) => rule.type === "zone")?.zone;
    if (zone) needs.set(zone, (needs.get(zone) || 0) + area);
    const cold = rules.some((rule) => rule.type === "cold");
    const coldDoor = item.prefs?.needsCold && item.prefs?.zone === "door";
    if (cold && !coldDoor) coldNeed += area;
  }

  const errors = [];
  for (const [zone, need] of needs) {
    if (need > (open.get(zone) || 0)) errors.push(`${zone}:${need}>${open.get(zone) || 0}`);
  }
  const coldOpen = (open.get("chill") || 0) + (open.get("drawer") || 0);
  if (coldNeed > coldOpen) errors.push(`cold:${coldNeed}>${coldOpen}`);

  const ok = errors.length === 0;
  console.log(`${ok ? "OK" : "FAIL"} ${level.id} ${errors.join(" ")}`);
  if (!ok) failed = true;
}

if (failed) process.exitCode = 1;
