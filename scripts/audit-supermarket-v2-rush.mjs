import { ShiftEngine } from "../src/supermarket-v2/model/shiftEngine.js";
import { visibleGapCount } from "../src/supermarket-v2/model/storeModel.js";
import {
  buildMorningRushShift,
  clearUrgentPriorityWhenDone,
  injectCustomerGapRecovery,
} from "../src/supermarket-v2/data/rushShift.js";

const errors = [];
const fail = (message) => errors.push(message);
const expectOk = (result, label) => {
  if (!result?.ok) fail(`${label}:${result?.reason || "failed"}`);
};

const shift = buildMorningRushShift();
const engine = new ShiftEngine(shift);

expectOk(engine.startShift(), "start");
expectOk(engine.loadCase("rush-milk"), "load-milk");
expectOk(engine.loadCase("rush-juice"), "load-juice");

const milkUnitsAtStart = engine.state.cart.filter((unit) => unit.skuId === "milk").length;
if (milkUnitsAtStart !== 3) fail(`milk-reserve=${milkUnitsAtStart}`);

expectOk(engine.moveToScene("dairy-wall-rush"), "move-dairy");
for (let index = 0; index < 2; index += 1) {
  const unit = engine.state.cart.find((entry) => entry.skuId === "milk");
  if (!unit) fail(`missing-initial-milk-${index}`);
  else expectOk(engine.placeUnit(unit.id, "rush-dairy-bay"), `place-initial-milk-${index}`);
}

if (visibleGapCount(engine.state.bays["rush-dairy-bay"]) !== 0) fail("dairy-not-full-before-face");
expectOk(engine.faceBay("rush-dairy-bay"), "face-dairy-first");

const spareMilk = engine.state.cart.filter((unit) => unit.skuId === "milk").length;
if (spareMilk !== 1) fail(`spare-milk=${spareMilk}`);

if (!injectCustomerGapRecovery(engine)) fail("customer-event-not-injected");
if (visibleGapCount(engine.state.bays["rush-dairy-bay"]) !== 1) fail("customer-gap-not-created");
if (!engine.state.activePriority) fail("urgent-priority-missing");
if (engine.state.tasks.filter((task) => task.urgent).length !== 2) fail("urgent-task-count");

const reserve = engine.state.cart.find((unit) => unit.skuId === "milk");
if (!reserve) fail("reserve-milk-missing");
else expectOk(engine.placeUnit(reserve.id, "rush-dairy-bay"), "recover-milk-gap");

expectOk(engine.faceBay("rush-dairy-bay"), "reface-dairy");
if (!clearUrgentPriorityWhenDone(engine)) fail("urgent-work-still-open");
if (engine.state.activePriority) fail("urgent-priority-not-cleared");

expectOk(engine.moveToScene("drinks-wall-rush"), "move-drinks");
for (let index = 0; index < 2; index += 1) {
  const unit = engine.state.cart.find((entry) => entry.skuId === "juice");
  if (!unit) fail(`missing-juice-${index}`);
  else expectOk(engine.placeUnit(unit.id, "rush-drinks-bay"), `place-juice-${index}`);
}
expectOk(engine.faceBay("rush-drinks-bay"), "face-drinks");
expectOk(engine.finishShift(), "finish");

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exitCode = 1;
} else {
  console.log("OK supermarket-v2-rush reserve=1 customer-gap=1 urgent-recovery=true final-complete=true");
}
