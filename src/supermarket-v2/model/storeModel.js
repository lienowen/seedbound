export const DEPARTMENT = Object.freeze({
  BACKROOM: "backroom",
  DRINKS: "drinks",
  DAIRY: "dairy",
  BREAKFAST: "breakfast",
  PRODUCE: "produce",
  READY_MEALS: "ready-meals",
});

export const FIXTURE_KIND = Object.freeze({
  STOCK_CART: "stock-cart",
  WALL_COOLER: "wall-cooler",
  DRY_SHELF: "dry-shelf",
  PRODUCE_BIN: "produce-bin",
  READY_CHILL: "ready-chill",
});

export const TASK_KIND = Object.freeze({
  LOAD_CASE: "load-case",
  REPLENISH: "replenish",
  FACE: "face",
  ROTATE: "rotate",
  BACKSTOCK: "backstock",
  REMOVE_DAMAGE: "remove-damage",
  HELP_CUSTOMER: "help-customer",
});

export const SKU = Object.freeze({
  GREEN_SODA: {
    id: "green-soda",
    label: "Green Soda",
    department: DEPARTMENT.DRINKS,
    footprint: 1,
    fixtureKinds: [FIXTURE_KIND.WALL_COOLER],
  },
  RED_SODA: {
    id: "red-soda",
    label: "Red Soda",
    department: DEPARTMENT.DRINKS,
    footprint: 1,
    fixtureKinds: [FIXTURE_KIND.WALL_COOLER],
  },
  JUICE: {
    id: "juice",
    label: "Orange Juice",
    department: DEPARTMENT.DRINKS,
    footprint: 1,
    fixtureKinds: [FIXTURE_KIND.WALL_COOLER],
  },
  MILK: {
    id: "milk",
    label: "Milk",
    department: DEPARTMENT.DAIRY,
    footprint: 1,
    fixtureKinds: [FIXTURE_KIND.WALL_COOLER],
    dated: true,
  },
  YOGURT: {
    id: "yogurt",
    label: "Yogurt",
    department: DEPARTMENT.DAIRY,
    footprint: 1,
    fixtureKinds: [FIXTURE_KIND.WALL_COOLER],
    dated: true,
  },
  CHEESE: {
    id: "cheese",
    label: "Cheese",
    department: DEPARTMENT.DAIRY,
    footprint: 1,
    fixtureKinds: [FIXTURE_KIND.WALL_COOLER],
    dated: true,
  },
  BREAD: {
    id: "bread",
    label: "Bread",
    department: DEPARTMENT.BREAKFAST,
    footprint: 2,
    fixtureKinds: [FIXTURE_KIND.DRY_SHELF],
  },
});

export function getSku(skuId) {
  return Object.values(SKU).find((sku) => sku.id === skuId) || null;
}

export function fixtureCanTakeSku(fixture, skuId) {
  const sku = getSku(skuId);
  if (!sku || !fixture) return false;
  return fixture.department === sku.department
    && sku.fixtureKinds.includes(fixture.kind);
}

export function createShelfBay({
  id,
  department,
  kind,
  capacity,
  facings = [],
  position,
}) {
  if (!id) throw new Error("Shelf bay id is required");
  if (!Object.values(DEPARTMENT).includes(department)) throw new Error(`Unknown department: ${department}`);
  if (!Object.values(FIXTURE_KIND).includes(kind)) throw new Error(`Unknown fixture kind: ${kind}`);
  if (!Number.isInteger(capacity) || capacity <= 0) throw new Error("Shelf bay capacity must be a positive integer");

  return {
    id,
    department,
    kind,
    capacity,
    facings: [...facings],
    position: { ...position },
  };
}

export function occupiedFacingCells(bay) {
  return (bay?.facings || []).reduce(
    (sum, facing) => sum + Math.max(1, Number(facing?.footprint || 1)),
    0,
  );
}

export function visibleGapCount(bay) {
  return Math.max(0, Number(bay?.capacity || 0) - occupiedFacingCells(bay));
}

export function isShelfFull(bay) {
  return visibleGapCount(bay) === 0;
}
