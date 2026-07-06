import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

export function applyEarlyCampaignCapacityPolish() {
  if (applied) return;
  applied = true;

  for (const level of FRIDGE_BR_CAMPAIGN) {
    const match = /^fridge-br-(\d+)$/.exec(level.id || "");
    const number = match ? Number(match[1]) : 0;
    if (number < 1 || number > 10) continue;

    for (const slot of level.slots || []) {
      if (slot.zone !== "door") continue;
      slot.cols = 2;
      slot.rows = 1;
      slot.stackLayers = 1;
    }
  }
}
