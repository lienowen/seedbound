import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;
const TUTORIAL_IDS = new Set(["fridge-br-1", "fridge-br-2", "fridge-br-3"]);
const MIN_GAP = 64;

export function applySupermarketRestockSpacingPolish() {
  if (applied) return;
  applied = true;

  for (const level of FRIDGE_BR_CAMPAIGN) {
    if (level?.theme?.key !== "restock-cooler") continue;
    if (TUTORIAL_IDS.has(level.id)) continue;

    const activeSlots = (level.slots || []).filter((slot) => slot.category && !slot.empty);
    if (!activeSlots.length) continue;

    const deliveryTop = Number(level.deliveryLayout?.y ?? Infinity);
    if (!Number.isFinite(deliveryTop)) continue;

    const fixtureBottom = Math.max(...activeSlots.map((slot) => slot.y + slot.h / 2));
    const gap = deliveryTop - fixtureBottom;
    const shift = Math.max(0, Math.ceil(MIN_GAP - gap));

    if (shift > 0) {
      for (const slot of activeSlots) slot.y -= shift;

      const deliveryShapes = new Set(level.deliveryShapes || []);
      for (const shape of level.stage?.shapes || []) {
        if (deliveryShapes.has(shape)) continue;
        if (Number.isFinite(shape.y)) shape.y -= shift;
      }

      for (const front of level.fronts || []) {
        if (Number.isFinite(front.y)) front.y -= shift;
      }
    }

    const adjustedBottom = Math.max(...activeSlots.map((slot) => slot.y + slot.h / 2));
    level.fixtureSpacingAdjusted = shift;
    level.fixtureDeliveryGap = deliveryTop - adjustedBottom;
  }
}
