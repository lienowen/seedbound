import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;
const TUTORIAL_IDS = new Set(["fridge-br-1", "fridge-br-2", "fridge-br-3"]);

export function applySupermarketRestockNudgePolish() {
  if (applied) return;
  applied = true;

  for (const level of FRIDGE_BR_CAMPAIGN) {
    if (level?.theme?.key !== "restock-cooler") continue;
    if (TUTORIAL_IDS.has(level.id)) continue;

    for (const item of level.items || []) {
      // Generated supermarket fixtures no longer share the old fridge door/drawer
      // geometry. Legacy slot-specific offsets such as door_top_1 would otherwise
      // shift products away from the real planogram cell.
      item.nudge = {};
      item.renderNudge = {};
    }
    level.legacyFixtureNudgesCleared = true;
  }
}
