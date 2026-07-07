import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";
import { applyCoreConsistencyPatches } from "../src/runtime/coreConsistencyBootstrap.js";
import { applyEngineConsistency } from "../src/runtime/engineConsistency.js";
import { applyMidCampaignCapacityPolish } from "../src/runtime/midCampaignCapacityPolish.js";

applyCoreConsistencyPatches();
applyMidCampaignCapacityPolish();
applyEngineConsistency();

const NON_BLOCKING = new Set(["mustNeighbor"]);
const WAVE_RULES = {
  "fridge-br-11": [{ after: 2, count: 2 }],
  "fridge-br-13": [{ after: 2, count: 2 }],
  "fridge-br-14": [{ after: 2, count: 3 }],
  "fridge-br-16": [{ after: 2, count: 2 }],
  "fridge-br-18": [{ after: 2, count: 2 }],
  "fridge-br-20": [{ after: 2, count: 2 }],
};

function numberOf(level) {
  return Number(/^fridge-br-(\d+)$/.exec(level.id || "")?.[1] || 0);
}

function truthfulPlacementExists(engine, itemId) {
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
            if (!engine.evaluatePlacement(itemId, placement, engine.state).valid) continue;
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

function capacityErrors(engine) {
  const open = openCapacity(engine);
  const needs = new Map();
  let coldNeed = 0;

  for (const item of engine.level.items.filter((entry) => !entry.fixed)) {
    const size = engine.itemSize(item.id, 0);
    const area = size.w * size.h;
    const rules = engine.itemConstraints(item);
    const zone = rules.find((rule) => rule.type === "zone")?.zone;
    if (zone) needs.set(zone, (needs.get(zone) || 0) + area);
    const cold = rules.some((rule) => rule.type === "cold");
    const coldDoor = item.prefs?.needsCold && item.prefs?.zone === "door";
    if (cold && !coldDoor) coldNeed += area;
  }

  const errors = [];
  for (const [zone, need] of needs) {
    const available = open.get(zone) || 0;
    if (need > available) errors.push(`${zone}:${need}>${available}`);
  }
  const coldOpen = (open.get("chill") || 0) + (open.get("drawer") || 0);
  if (coldNeed > coldOpen) errors.push(`cold:${coldNeed}>${coldOpen}`);
  return errors;
}

function waveErrors(level) {
  const movable = level.items.filter((item) => !item.fixed).length;
  const waves = WAVE_RULES[level.id] || [];
  const hidden = waves.reduce((sum, wave) => sum + wave.count, 0);
  let visible = movable - hidden;
  const errors = [];
  if (visible < 1) errors.push("wave:no-initial-stock");
  for (const wave of waves) {
    if (visible < wave.after) errors.push(`wave:need-${wave.after}-visible-${visible}`);
    visible += wave.count;
  }
  if (visible !== movable) errors.push(`wave:count-${visible}-of-${movable}`);
  return errors;
}

let failed = false;

for (const level of FRIDGE_BR_CAMPAIGN) {
  const number = numberOf(level);
  if (number < 11 || number > 20) continue;

  const engine = new StorageEngine(level, { forceFresh: true, saveId: `__mid_audit_${level.id}` });
  const initial = engine.validate();
  const missing = level.items
    .filter((item) => !item.fixed)
    .filter((item) => !truthfulPlacementExists(engine, item.id))
    .map((item) => item.id);
  const errors = [
    ...(initial.validPlacement ? [] : [`initial:${initial.reason || "invalid"}`]),
    ...missing.map((id) => `no-placement:${id}`),
    ...capacityErrors(engine),
    ...waveErrors(level),
  ];

  const ok = errors.length === 0;
  console.log(`${ok ? "OK" : "FAIL"} ${level.id} ${errors.join(" ") || "release-static-checks"}`);
  if (!ok) failed = true;
}

if (failed) process.exitCode = 1;
