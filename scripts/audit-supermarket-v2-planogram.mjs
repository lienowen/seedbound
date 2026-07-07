import { SUPERMARKET_V2_VERTICAL_SLICE } from "../src/supermarket-v2/data/verticalSlice.js";
import { ShiftEngine } from "../src/supermarket-v2/model/shiftEngine.js";
import { planogramAllowsSkuAtCell } from "../src/supermarket-v2/model/storeModel.js";

const errors = [];
const [shift1, shift2] = SUPERMARKET_V2_VERTICAL_SLICE;

function fail(message) {
  errors.push(message);
}

function expectReason(result, reason, label) {
  if (result?.ok || result?.reason !== reason) fail(`${label}:${result?.reason || "unexpected-success"}`);
}

// Drinks wall: each missing cell belongs to the neighboring SKU facing.
{
  const bay = shift1.bays[0];
  if (bay.planogram.join(",") !== "green-soda,green-soda,red-soda,red-soda,juice,juice") {
    fail(`shift1:planogram=${bay.planogram.join(",")}`);
  }
  if (!planogramAllowsSkuAtCell(bay, "green-soda", 1, 1)) fail("shift1:green-correct-cell-rejected");
  if (planogramAllowsSkuAtCell(bay, "green-soda", 3, 1)) fail("shift1:green-can-enter-red-facing");

  const engine = new ShiftEngine(shift1);
  engine.startShift();
  shift1.cases.forEach((stockCase) => engine.loadCase(stockCase.id));
  engine.moveToScene("drinks-wall");
  const green = engine.state.cart.find((unit) => unit.skuId === "green-soda");
  expectReason(engine.placeUnit(green.id, "drinks-bay-a", 3), "wrong-planogram-facing", "shift1:wrong-green-facing");
}

// Dairy wall: milk/yogurt/cheese facings are distinct even though the fixture and
// department are both valid for all three SKUs.
{
  const dairyBay = shift2.bays.find((bay) => bay.id === "dairy-bay-a");
  if (dairyBay.planogram.join(",") !== "milk,milk,yogurt,yogurt,cheese,cheese") {
    fail(`shift2:dairy-planogram=${dairyBay.planogram.join(",")}`);
  }

  const engine = new ShiftEngine(shift2);
  engine.startShift();
  shift2.cases.forEach((stockCase) => engine.loadCase(stockCase.id));
  engine.moveToScene("dairy-wall");
  const milk = engine.state.cart.find((unit) => unit.skuId === "milk");
  expectReason(engine.placeUnit(milk.id, "dairy-bay-a", 3), "wrong-planogram-facing", "shift2:milk-in-yogurt-facing");
}

// A two-cell product must start where two contiguous cells are available.
{
  const breadBay = shift2.bays.find((bay) => bay.id === "breakfast-bread-bay");
  const engine = new ShiftEngine(shift2);
  engine.startShift();
  shift2.cases.forEach((stockCase) => engine.loadCase(stockCase.id));
  engine.moveToScene("breakfast-aisle");
  const bread = engine.state.cart.find((unit) => unit.skuId === "bread");
  expectReason(engine.placeUnit(bread.id, "breakfast-bread-bay", 3), "no-contiguous-shelf-gap", "shift2:bread-overflow");
  const correct = engine.placeUnit(bread.id, "breakfast-bread-bay", 2);
  if (!correct.ok) fail(`shift2:bread-correct-gap=${correct.reason}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exitCode = 1;
} else {
  console.log("OK supermarket-v2-planogram sku-facing=true footprint-contiguous=true");
}
