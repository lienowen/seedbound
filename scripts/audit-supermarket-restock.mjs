import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";
import { applyCoreConsistencyPatches } from "../src/runtime/coreConsistencyBootstrap.js";

applyCoreConsistencyPatches();

const errors = [];
const restockLevels = FRIDGE_BR_CAMPAIGN.filter((level) => level.id?.startsWith("fridge-br-"));
const forbiddenPrefs = ["zone", "needsCold", "needsWarm", "topShelf", "likesVisible", "mustNeighbors", "hatesNeighbors"];

function truthfulPlacementExists(engine, item) {
  for (const slot of engine.level.slots) {
    if (slot.category !== item.prefs?.category) continue;
    const grid = engine.slotGrid(slot);
    const size = engine.itemSize(item.id, 0);
    if (size.w > grid.cols || size.h > grid.rows) continue;
    for (let row = 0; row <= grid.rows - size.h; row += 1) {
      for (let col = 0; col <= grid.cols - size.w; col += 1) {
        const placement = { slotId: slot.id, col, row, layer: 0, rot: 0 };
        const legal = engine.evaluatePlacement(item.id, placement, engine.state);
        const rules = engine.evaluateConstraints(item.id, placement, engine.state);
        if (legal.valid && rules.allSatisfied) return true;
      }
    }
  }
  return false;
}

for (const level of restockLevels) {
  if (level.theme?.key !== "restock-cooler") errors.push(`${level.id}:theme=${level.theme?.key || "missing"}`);
  if (!Array.isArray(level.planogram) || !level.planogram.length) errors.push(`${level.id}:missing-planogram`);

  const categoryCapacity = new Map();
  for (const slot of level.slots || []) {
    if (slot.zone !== "shelf") errors.push(`${level.id}:${slot.id}:legacy-zone=${slot.zone}`);
    if (!slot.category) continue;
    categoryCapacity.set(slot.category, (categoryCapacity.get(slot.category) || 0) + Math.max(1, Number(slot.cols || 1)));
  }

  const categoryNeed = new Map();
  for (const item of level.items || []) {
    const category = item.prefs?.category;
    if (!category) errors.push(`${level.id}:${item.id}:missing-category`);
    else categoryNeed.set(category, (categoryNeed.get(category) || 0) + 1);

    if (JSON.stringify(item.size || []) !== JSON.stringify([1, 1])) {
      errors.push(`${level.id}:${item.id}:facing-size=${JSON.stringify(item.size)}`);
    }
    for (const key of forbiddenPrefs) {
      if (item.prefs && Object.prototype.hasOwnProperty.call(item.prefs, key)) {
        errors.push(`${level.id}:${item.id}:legacy-pref=${key}`);
      }
    }
  }

  for (const [category, need] of categoryNeed) {
    const capacity = categoryCapacity.get(category) || 0;
    if (capacity < need) errors.push(`${level.id}:${category}:capacity=${capacity}<${need}`);
  }

  const engine = new StorageEngine(level, { forceFresh: true, saveId: `__restock_audit_${level.id}` });
  for (const item of level.items.filter((entry) => !entry.fixed)) {
    if (!truthfulPlacementExists(engine, item)) errors.push(`${level.id}:${item.id}:no-truthful-placement`);
  }

  for (const item of level.items.filter((entry) => entry.fixed)) {
    const slot = level.slots.find((entry) => entry.id === item.slot);
    if (!slot) errors.push(`${level.id}:${item.id}:missing-fixed-slot`);
    else if (slot.category !== item.prefs?.category) {
      errors.push(`${level.id}:${item.id}:fixed-category=${slot.category}/${item.prefs?.category}`);
    }
  }
}

const first = restockLevels.find((level) => level.id === "fridge-br-1");
if (!first) errors.push("fridge-br-1:missing");
else {
  const movable = first.items.filter((item) => !item.fixed);
  if (movable.length !== 3) errors.push(`fridge-br-1:tutorial-count=${movable.length}`);
  if (movable.some((item) => item.prefs?.category !== "beverages")) errors.push("fridge-br-1:not-drinks-only");
}

if (restockLevels.length !== 20) errors.push(`restock-level-count=${restockLevels.length}`);

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(`OK supermarket-restock levels=${restockLevels.length} tutorial=drinks-only category-model=clean`);
}
