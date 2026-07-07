import { SUPERMARKET_V2_VERTICAL_SLICE } from "./verticalSlice.js";
import { TASK_KIND } from "../model/storeModel.js";

export function buildMorningRushShift() {
  const shift = structuredClone(SUPERMARKET_V2_VERTICAL_SLICE[2]);
  const milkCase = shift.cases.find((entry) => entry.id === "rush-milk");
  if (milkCase) milkCase.quantity = 3;
  return shift;
}

export const CUSTOMER_GAP_EVENT_ID = "customer-removes-milk";

export function injectCustomerGapRecovery(engine) {
  if (engine.state.eventsTriggered.includes(CUSTOMER_GAP_EVENT_ID)) return false;
  const taken = engine.customerTakes("rush-dairy-bay", "milk");
  if (!taken.ok) return false;

  engine.state.tasks.unshift(
    {
      id: "urgent-recover-milk-gap",
      kind: TASK_KIND.REPLENISH,
      bayId: "rush-dairy-bay",
      skuId: "milk",
      target: 1,
      progress: 0,
      complete: false,
      urgent: true,
    },
    {
      id: "urgent-reface-dairy",
      kind: TASK_KIND.FACE,
      bayId: "rush-dairy-bay",
      target: 1,
      progress: 0,
      complete: false,
      urgent: true,
    },
  );

  engine.state.eventsTriggered.push(CUSTOMER_GAP_EVENT_ID);
  engine.state.activePriority = "Customer took milk — recover the new dairy gap before leaving";
  return true;
}

export function clearUrgentPriorityWhenDone(engine) {
  const urgentLeft = engine.state.tasks.some((task) => task.urgent && !task.complete);
  if (!urgentLeft) engine.state.activePriority = null;
  return !urgentLeft;
}
