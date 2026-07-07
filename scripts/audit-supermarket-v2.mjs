import { SUPERMARKET_V2_VERTICAL_SLICE } from "../src/supermarket-v2/data/verticalSlice.js";
import { ShiftEngine } from "../src/supermarket-v2/model/shiftEngine.js";
import {
  DEPARTMENT,
  FIXTURE_KIND,
  fixtureCanTakeSku,
  visibleGapCount,
} from "../src/supermarket-v2/model/storeModel.js";

const errors = [];

function fail(message) {
  errors.push(message);
}

function unitBySku(engine, skuId) {
  return engine.state.cart.find((unit) => unit.skuId === skuId);
}

function expectOk(result, label) {
  if (!result?.ok) fail(`${label}:${result?.reason || "failed"}`);
}

const [shift1, shift2, shift3] = SUPERMARKET_V2_VERTICAL_SLICE;
if (SUPERMARKET_V2_VERTICAL_SLICE.length !== 3) fail(`vertical-slice-count=${SUPERMARKET_V2_VERTICAL_SLICE.length}`);

for (const shift of SUPERMARKET_V2_VERTICAL_SLICE) {
  const serialized = JSON.stringify(shift).toLowerCase();
  for (const legacy of ["door rack", "right-side door", "drawer_left", "door_top_1", "fridge-br-"]) {
    if (serialized.includes(legacy)) fail(`${shift.id}:legacy-token=${legacy}`);
  }
  if (!shift.scenes?.some((scene) => scene.kind === "backroom")) fail(`${shift.id}:missing-backroom`);
  if (!shift.tasks?.some((task) => task.kind === "load-case")) fail(`${shift.id}:missing-load-case-work`);

  const sceneIds = new Set((shift.scenes || []).map((scene) => scene.id));
  for (const bay of shift.bays || []) {
    if (!bay.sceneId || !sceneIds.has(bay.sceneId)) fail(`${shift.id}:${bay.id}:invalid-scene=${bay.sceneId || "missing"}`);
  }
}

// Shift 1: a partially stocked wall bay with three explicit visible gaps.
{
  if (visibleGapCount(shift1.bays[0]) !== 3) fail(`shift1:initial-gaps=${visibleGapCount(shift1.bays[0])}`);
  const cells = shift1.bays[0].facings.map((facing) => facing.cell).join(",");
  if (cells !== "0,2,4") fail(`shift1:existing-cells=${cells}`);

  const engine = new ShiftEngine(shift1);
  expectOk(engine.startShift(), "shift1:start");
  for (const stockCase of shift1.cases) expectOk(engine.loadCase(stockCase.id), `shift1:load:${stockCase.id}`);

  const remoteUnit = unitBySku(engine, "green-soda");
  const remotePlace = engine.placeUnit(remoteUnit.id, "drinks-bay-a");
  if (remotePlace.ok || remotePlace.reason !== "wrong-scene") fail(`shift1:remote-place=${remotePlace.reason}`);

  expectOk(engine.moveToScene("drinks-wall"), "shift1:move-drinks");
  for (const skuId of ["green-soda", "red-soda", "juice"]) {
    const unit = unitBySku(engine, skuId);
    if (!unit) fail(`shift1:missing-unit=${skuId}`);
    else expectOk(engine.placeUnit(unit.id, "drinks-bay-a"), `shift1:place:${skuId}`);
  }
  expectOk(engine.faceBay("drinks-bay-a"), "shift1:face");
  if (visibleGapCount(engine.state.bays["drinks-bay-a"]) !== 0) fail("shift1:row-not-full");
  const finish = engine.finishShift();
  expectOk(finish, "shift1:finish");
  if ((finish.score?.accuracy || 0) !== 100) fail(`shift1:accuracy=${finish.score?.accuracy}`);
}

// Loading must be a real backroom action, not a remote inventory button.
{
  const engine = new ShiftEngine(shift1);
  expectOk(engine.startShift(), "shift1-location:start");
  expectOk(engine.loadCase("case-drinks-1"), "shift1-location:first-load");
  expectOk(engine.moveToScene("drinks-wall"), "shift1-location:move");
  const remoteLoad = engine.loadCase("case-drinks-2");
  if (remoteLoad.ok || remoteLoad.reason !== "must-load-in-backroom") fail(`shift1:remote-load=${remoteLoad.reason}`);
}

// Shift 2: bread and dairy are physically separate and both start partially stocked.
{
  const breakfastBay = shift2.bays.find((bay) => bay.id === "breakfast-bread-bay");
  const dairyBay = shift2.bays.find((bay) => bay.id === "dairy-bay-a");
  if (breakfastBay?.kind !== FIXTURE_KIND.DRY_SHELF || breakfastBay?.department !== DEPARTMENT.BREAKFAST) {
    fail("shift2:breakfast-bay-not-dry-aisle");
  }
  if (dairyBay?.kind !== FIXTURE_KIND.WALL_COOLER || dairyBay?.department !== DEPARTMENT.DAIRY) {
    fail("shift2:dairy-bay-not-wall-cooler");
  }
  if (visibleGapCount(breakfastBay) !== 2) fail(`shift2:breakfast-initial-gaps=${visibleGapCount(breakfastBay)}`);
  if (visibleGapCount(dairyBay) !== 3) fail(`shift2:dairy-initial-gaps=${visibleGapCount(dairyBay)}`);
  if (fixtureCanTakeSku(dairyBay, "bread")) fail("shift2:bread-can-enter-dairy-wall");
  if (fixtureCanTakeSku(breakfastBay, "milk")) fail("shift2:milk-can-enter-breakfast-shelf");

  const departmentScenes = shift2.scenes.filter((scene) => scene.kind === "department");
  if (new Set(departmentScenes.map((scene) => scene.department)).size !== 2) {
    fail("shift2:departments-not-separated");
  }

  const engine = new ShiftEngine(shift2);
  expectOk(engine.startShift(), "shift2:start");
  for (const stockCase of shift2.cases) expectOk(engine.loadCase(stockCase.id), `shift2:load:${stockCase.id}`);

  const breadUnit = unitBySku(engine, "bread");
  const remoteBread = engine.placeUnit(breadUnit.id, "breakfast-bread-bay");
  if (remoteBread.ok || remoteBread.reason !== "wrong-scene") fail(`shift2:remote-bread=${remoteBread.reason}`);

  expectOk(engine.moveToScene("dairy-wall"), "shift2:move-dairy-first");
  const wrong = engine.placeUnit(breadUnit.id, "dairy-bay-a");
  if (wrong.ok || wrong.reason !== "wrong-department-or-fixture") fail(`shift2:wrong-placement-not-rejected=${wrong.reason}`);

  expectOk(engine.moveToScene("breakfast-aisle"), "shift2:move-breakfast");
  expectOk(engine.placeUnit(breadUnit.id, "breakfast-bread-bay", 2), "shift2:place-bread");
  if (visibleGapCount(engine.state.bays["breakfast-bread-bay"]) !== 0) fail("shift2:bread-footprint-not-two-cells");
  expectOk(engine.faceBay("breakfast-bread-bay"), "shift2:face-breakfast");

  expectOk(engine.moveToScene("dairy-wall"), "shift2:move-dairy");
  for (const [skuId, cell] of [["milk", 1], ["yogurt", 3], ["cheese", 5]]) {
    const unit = unitBySku(engine, skuId);
    if (!unit) fail(`shift2:missing-unit=${skuId}`);
    else expectOk(engine.placeUnit(unit.id, "dairy-bay-a", cell), `shift2:place:${skuId}`);
  }
  expectOk(engine.faceBay("dairy-bay-a"), "shift2:face-dairy");
  expectOk(engine.finishShift(), "shift2:finish");
}

// Shift 3: finishing the first dairy recovery automatically triggers a customer
// removal. The spare milk must recover the exact new gap before the worker leaves.
{
  const engine = new ShiftEngine(shift3);
  expectOk(engine.startShift(), "shift3:start");
  expectOk(engine.loadCase("rush-milk"), "shift3:load-milk");
  expectOk(engine.loadCase("rush-juice"), "shift3:load-juice");
  expectOk(engine.moveToScene("dairy-wall-rush"), "shift3:move-dairy");

  for (let i = 0; i < 2; i += 1) {
    const unit = unitBySku(engine, "milk");
    if (!unit) fail(`shift3:missing-milk-unit-${i}`);
    else expectOk(engine.placeUnit(unit.id, "rush-dairy-bay"), `shift3:place-milk-${i}`);
  }

  const faceResult = engine.faceBay("rush-dairy-bay");
  expectOk(faceResult, "shift3:face-dairy");
  if (!faceResult.events?.some((event) => event.id === "customer-removes-milk")) {
    fail("shift3:customer-event-not-triggered");
  }
  if (!engine.state.eventsTriggered.includes("customer-removes-milk")) fail("shift3:event-not-recorded");
  if (visibleGapCount(engine.state.bays["rush-dairy-bay"]) !== 1) fail("shift3:customer-gap-not-created");

  const spareMilk = unitBySku(engine, "milk");
  if (!spareMilk) fail("shift3:missing-spare-milk");
  else {
    const gapCell = faceResult.events?.[0]?.result?.gapCell;
    expectOk(engine.placeUnit(spareMilk.id, "rush-dairy-bay", gapCell), "shift3:recover-customer-gap");
  }
  expectOk(engine.faceBay("rush-dairy-bay"), "shift3:reface-dairy");

  expectOk(engine.moveToScene("drinks-wall-rush"), "shift3:move-drinks");
  for (let i = 0; i < 2; i += 1) {
    const unit = unitBySku(engine, "juice");
    if (!unit) fail(`shift3:missing-juice-unit-${i}`);
    else expectOk(engine.placeUnit(unit.id, "rush-drinks-bay"), `shift3:place-juice-${i}`);
  }
  expectOk(engine.faceBay("rush-drinks-bay"), "shift3:face-drinks");
  expectOk(engine.finishShift(), "shift3:finish");
}

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exitCode = 1;
} else {
  console.log("OK supermarket-v2 shifts=3 backroom=true scenes=physical gaps=explicit customer-event=dynamic capacity=footprint-aware");
}
