import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { applyCoreConsistencyPatches } from "../src/runtime/coreConsistencyBootstrap.js";
import { applySupermarketRestockProgressionPolish } from "../src/runtime/supermarketRestockProgressionPolish.js";
import { applySupermarketRestockVisualPolish } from "../src/runtime/supermarketRestockVisualPolish.js";

applyCoreConsistencyPatches();
applySupermarketRestockProgressionPolish();
applySupermarketRestockVisualPolish();

const errors = [];
const families = new Set(["cold-aisle", "produce-cooler", "meal-cooler", "mixed-aisle"]);
const tutorials = new Set(["fridge-br-1", "fridge-br-2", "fridge-br-3"]);

for (const level of FRIDGE_BR_CAMPAIGN.filter((entry) => entry.id?.startsWith("fridge-br-"))) {
  if (!families.has(level.marketFixtureFamily)) {
    errors.push(`${level.id}:unknown-family=${level.marketFixtureFamily || "missing"}`);
  }

  for (const shelf of level.planogram || []) {
    const slot = level.slots.find((entry) => entry.id === shelf.slotId);
    if (!slot) errors.push(`${level.id}:missing-slot=${shelf.slotId}`);
    else if (slot.shelfKind !== shelf.shelfKind) {
      errors.push(`${level.id}:${slot.id}:kind=${slot.shelfKind}/${shelf.shelfKind}`);
    }
  }

  if (tutorials.has(level.id)) {
    if (!level.fixtureCut) errors.push(`${level.id}:missing-focused-cut`);
    continue;
  }

  if (!level.generatedSlotLayout) errors.push(`${level.id}:missing-generated-slot-layout`);
  if ((level.stage?.fixtures || []).length) errors.push(`${level.id}:reuses-full-cooler-image`);
  if (level.visualMode !== `restock-${level.marketFixtureFamily}`) {
    errors.push(`${level.id}:visual-mode=${level.visualMode || "missing"}`);
  }

  const activeSlots = (level.slots || []).filter((slot) => slot.category && !slot.empty);
  if ((level.fronts || []).length < activeSlots.length) {
    errors.push(`${level.id}:fronts=${level.fronts?.length || 0}<active=${activeSlots.length}`);
  }
  if ((level.stage?.shapes || []).length <= (level.deliveryShapes?.length || 0)) {
    errors.push(`${level.id}:missing-generated-fixture-shapes`);
  }

  const fixtureBottom = activeSlots.length
    ? Math.max(...activeSlots.map((slot) => slot.y + slot.h / 2))
    : 0;
  const deliveryTop = Number(level.deliveryLayout?.y ?? Infinity);
  if (!Number.isFinite(deliveryTop)) errors.push(`${level.id}:missing-delivery-layout`);
  else if (deliveryTop - fixtureBottom < 60) {
    errors.push(`${level.id}:fixture-delivery-gap=${Math.round(deliveryTop - fixtureBottom)}`);
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exitCode = 1;
} else {
  console.log("OK restock-fixtures tutorials=cropped later-levels=generated families=4 gap>=60");
}
