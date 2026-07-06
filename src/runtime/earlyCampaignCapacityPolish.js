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

  // Level 8 had two fixed meal boxes locking the middle plus a decorative fixed
  // bread occupying the last full shelf. Watermelon (2 cells) + cheese (1 cell)
  // therefore needed three shelf cells while only two remained. Remove the purely
  // decorative blocker so the authored movable set has truthful capacity.
  const level8 = FRIDGE_BR_CAMPAIGN.find((level) => level.id === "fridge-br-8");
  if (level8) {
    level8.items = level8.items.filter((item) => item.id !== "bread_fixed");
    level8.revision = Math.max(11, Number(level8.revision || 1));
  }
}
