import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";
import { applyCoreConsistencyPatches } from "../src/runtime/coreConsistencyBootstrap.js";
import { applySupermarketRestockProgressionPolish } from "../src/runtime/supermarketRestockProgressionPolish.js";
import { applySupermarketRestockVisualPolish } from "../src/runtime/supermarketRestockVisualPolish.js";

applyCoreConsistencyPatches();
applySupermarketRestockProgressionPolish();
applySupermarketRestockVisualPolish();

const errors = [];
const restockLevels = FRIDGE_BR_CAMPAIGN.filter((level) => level.id?.startsWith("fridge-br-"));
const forbiddenPrefs = ["zone", "needsCold", "needsWarm", "topShelf", "likesVisible", "mustNeighbors", "hatesNeighbors"];
const expectedTotals = new Map([[4, 8], [5, 9], [6, 10], [7, 10], [8, 11], [9, 12], [10, 12]]);
const COOLER_SOURCE = { w: 980, h: 735 };

const EXPECTED_ALLOW = {
  beverages: new Set(["bottle", "carton"]),
  dairy: new Set(["dairy", "carton"]),
  fresh: new Set(["food", "box"]),
  meals: new Set(["food", "box"]),
  sauces: new Set(["bottle", "jar", "tube"]),
  groceries: new Set(["food", "box", "jar", "can", "carton"]),
};

const WIDE_IMAGES = new Set([
  "eggs",
  "strawberries",
  "mealbox",
  "cake",
  "bread",
  "butter",
  "watermelon",
  "corn",
  "fish",
]);

function levelNumber(level) {
  const match = /^fridge-br-(\d+)$/.exec(level?.id || "");
  return match ? Number(match[1]) : 0;
}

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

function rowGroups(slots) {
  const sorted = [...slots].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const rows = [];
  for (const slot of sorted) {
    let row = rows.find((candidate) => Math.abs(candidate.y - slot.y) <= 26);
    if (!row) {
      row = { y: slot.y, slots: [] };
      rows.push(row);
    }
    row.slots.push(slot);
  }
  rows.forEach((row) => row.slots.sort((a, b) => a.x - b.x));
  return rows.sort((a, b) => a.y - b.y);
}

function auditCategoryContinuity(level) {
  const rows = rowGroups((level.slots || []).filter((slot) => slot.category));
  const categoryRows = new Map();

  rows.forEach((row, rowIndex) => {
    const seenSegments = new Set();
    let previous = null;
    for (const slot of row.slots) {
      const category = slot.category;
      if (!category) continue;
      if (!categoryRows.has(category)) categoryRows.set(category, new Set());
      categoryRows.get(category).add(rowIndex);
      if (category !== previous) {
        if (seenSegments.has(category)) errors.push(`${level.id}:${category}:split-segment-row=${rowIndex}`);
        seenSegments.add(category);
        previous = category;
      }
    }
  });

  const number = levelNumber(level);
  if (number <= 10) {
    for (const [category, rowsUsed] of categoryRows) {
      if (rowsUsed.size > 1) errors.push(`${level.id}:${category}:spans-${rowsUsed.size}-rows`);
    }
  }
}

function auditFixtureCut(level) {
  if (!level.fixtureCut) return;
  const fx = level.stage?.fixtures?.find((entry) => entry?.crop);
  if (!fx) {
    errors.push(`${level.id}:fixture-cut-missing`);
    return;
  }
  const { x = 0, y = 0, w = 0, h = 0 } = fx.crop;
  if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > COOLER_SOURCE.w || y + h > COOLER_SOURCE.h) {
    errors.push(`${level.id}:fixture-crop-out-of-bounds=${x},${y},${w},${h}`);
  }
  const cropRatio = w / Math.max(1, h);
  const displayRatio = Number(fx.w || 0) / Math.max(1, Number(fx.h || 0));
  if (Math.abs(cropRatio - displayRatio) > 0.08) {
    errors.push(`${level.id}:fixture-aspect-distortion=${cropRatio.toFixed(3)}/${displayRatio.toFixed(3)}`);
  }
}

function auditPlanogram(level) {
  for (const shelf of level.planogram || []) {
    const slot = level.slots.find((entry) => entry.id === shelf.slotId);
    if (!slot) {
      errors.push(`${level.id}:planogram-slot-missing=${shelf.slotId}`);
      continue;
    }

    const facings = shelf.facings || [];
    if (!facings.length) errors.push(`${level.id}:${shelf.slotId}:missing-facings`);
    const occupied = new Set();
    for (const facing of facings) {
      const item = level.items.find((entry) => entry.id === facing.itemId);
      if (!item) {
        errors.push(`${level.id}:${shelf.slotId}:facing-item-missing=${facing.itemId}`);
        continue;
      }
      const expectedWidth = Math.max(1, Number(item.size?.[0] || 1));
      if (Number(facing.width || 0) !== expectedWidth) {
        errors.push(`${level.id}:${item.id}:facing-width=${facing.width}!=${expectedWidth}`);
      }
      for (let offset = 0; offset < expectedWidth; offset += 1) {
        const cell = Number(facing.col || 0) + offset;
        if (cell < 0 || cell >= Number(slot.cols || 1)) {
          errors.push(`${level.id}:${item.id}:facing-overflow-cell=${cell}`);
        }
        if (occupied.has(cell)) errors.push(`${level.id}:${shelf.slotId}:facing-overlap-cell=${cell}`);
        occupied.add(cell);
      }
    }
    if (occupied.size !== Number(slot.cols || 1)) {
      errors.push(`${level.id}:${shelf.slotId}:planogram-cells=${occupied.size}!=${slot.cols}`);
    }
  }
}

for (const level of restockLevels) {
  const number = levelNumber(level);
  if (level.theme?.key !== "restock-cooler") errors.push(`${level.id}:theme=${level.theme?.key || "missing"}`);
  if (!Array.isArray(level.planogram) || !level.planogram.length) errors.push(`${level.id}:missing-planogram`);
  if (!level.marketFixtureFamily) errors.push(`${level.id}:missing-fixture-family`);

  const expectedTotal = expectedTotals.get(number);
  if (expectedTotal != null && level.items.length !== expectedTotal) {
    errors.push(`${level.id}:comfort-curve-total=${level.items.length}!=${expectedTotal}`);
  }

  const categoryCapacity = new Map();
  for (const slot of level.slots || []) {
    if (slot.zone !== "shelf") errors.push(`${level.id}:${slot.id}:legacy-zone=${slot.zone}`);
    if (!slot.category) continue;
    if (!slot.shelfKind) errors.push(`${level.id}:${slot.id}:missing-shelf-kind`);
    categoryCapacity.set(slot.category, (categoryCapacity.get(slot.category) || 0) + Math.max(1, Number(slot.cols || 1)));

    const expectedAllow = EXPECTED_ALLOW[slot.category];
    if (expectedAllow) {
      const actual = new Set(slot.allow || []);
      for (const tag of expectedAllow) {
        if (!actual.has(tag)) errors.push(`${level.id}:${slot.id}:allow-missing=${tag}`);
      }
    }
  }

  const categoryNeed = new Map();
  for (const item of level.items || []) {
    const category = item.prefs?.category;
    if (!category) errors.push(`${level.id}:${item.id}:missing-category`);
    else categoryNeed.set(category, (categoryNeed.get(category) || 0) + Math.max(1, Number(item.size?.[0] || 1)));

    const width = Math.max(1, Number(item.size?.[0] || 1));
    const expectedWidth = WIDE_IMAGES.has(item.image) ? 2 : 1;
    if (width !== expectedWidth || Number(item.size?.[1] || 1) !== 1) {
      errors.push(`${level.id}:${item.id}:sku-size=${JSON.stringify(item.size)} expected=[${expectedWidth},1]`);
    }
    if (!item.shelfKind) errors.push(`${level.id}:${item.id}:missing-shelf-kind`);

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

  auditCategoryContinuity(level);
  auditFixtureCut(level);
  auditPlanogram(level);

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
  if (first.items.some((item) => item.fixed)) errors.push("fridge-br-1:must-have-no-fixed-clutter");
  if (first.slots.length !== 1) errors.push(`fridge-br-1:target-slot-count=${first.slots.length}`);

  const target = first.slots[0];
  if (target?.category !== "beverages") errors.push(`fridge-br-1:target-category=${target?.category || "missing"}`);
  if (Number(target?.cols || 0) !== 3) errors.push(`fridge-br-1:target-capacity=${target?.cols || 0}`);
  if (first.planogram?.length !== 1 || first.planogram[0]?.facings?.length !== 3) {
    errors.push("fridge-br-1:planogram-must-be-one-row-of-three");
  }

  const itemYs = first.deliveryLayout?.itemYs || [];
  const nearestTrayY = itemYs.length ? Math.min(...itemYs) : Infinity;
  if (!Number.isFinite(nearestTrayY)) errors.push("fridge-br-1:delivery-layout-missing");
  if (Number(first.deliveryLayout?.y || Infinity) > 850) errors.push(`fridge-br-1:delivery-too-low=${first.deliveryLayout?.y}`);
  if (Number.isFinite(nearestTrayY) && Math.abs(nearestTrayY - Number(target?.y || 0)) > 330) {
    errors.push(`fridge-br-1:drag-reach-too-long=${Math.abs(nearestTrayY - Number(target?.y || 0))}`);
  }

  const engine = new StorageEngine(first, { forceFresh: true, saveId: "__restock_first_completion_audit" });
  movable.forEach((item, col) => {
    const result = engine.placeItem(item.id, { slotId: target.id, col, row: 0, layer: 0, rot: 0 });
    if (!result.ok) errors.push(`fridge-br-1:${item.id}:sequential-place-failed-col=${col}`);
  });
  const finalValidation = engine.validate();
  if (!finalValidation.complete) {
    errors.push(`fridge-br-1:sequential-completion-failed=${finalValidation.doneCount}/${finalValidation.doneTotal}`);
  }
}

if (restockLevels.length !== 20) errors.push(`restock-level-count=${restockLevels.length}`);

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(`OK supermarket-restock levels=${restockLevels.length} sku-footprints=real shelves=typed first-level=sequentially-complete`);
}
