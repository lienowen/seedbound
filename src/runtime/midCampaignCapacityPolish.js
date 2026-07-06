import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

// Levels 11-20 were authored before door preferences became hard constraints.
// After engineConsistency promotes cold-door items to the same hard door rule,
// a few later levels require more movable door cells than remain after fixed
// items are placed. Relax only the overflowing duplicate/cold drink instances;
// their tag and temperature rules still keep every placement truthful.
const RELAXED_DOOR_PREFS = {
  "fridge-br-13": ["mustard_1", "ketchup_2", "greenSoda_3", "juice_5"],
  "fridge-br-15": ["milk_1"],
  "fridge-br-16": ["juice_3", "milk_6"],
  "fridge-br-18": ["juice_4"],
  "fridge-br-19": ["milk_1", "juice_4", "greenSoda_6"],
  "fridge-br-20": ["milk_1"],
};

function relaxDoorPreference(item) {
  if (item?.prefs?.zone !== "door") return;
  const { zone: _zone, ...prefs } = item.prefs;
  item.prefs = prefs;
}

export function applyMidCampaignCapacityPolish() {
  if (applied) return;
  applied = true;

  for (const [levelId, itemIds] of Object.entries(RELAXED_DOOR_PREFS)) {
    const level = FRIDGE_BR_CAMPAIGN.find((entry) => entry.id === levelId);
    if (!level) continue;

    const ids = new Set(itemIds);
    for (const item of level.items || []) {
      if (!item.fixed && ids.has(item.id)) relaxDoorPreference(item);
    }

    level.revision = Math.max(12, Number(level.revision || 1));
  }
}
