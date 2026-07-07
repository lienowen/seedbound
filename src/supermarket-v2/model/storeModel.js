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
  sceneId,
  department,
  kind,
  capacity,
  facings = [],
  planogram = [],
  position,
}) {
  if (!id) throw new Error("Shelf bay id is required");
  if (!sceneId) throw new Error(`Shelf bay ${id} requires a sceneId`);
  if (!Object.values(DEPARTMENT).includes(department)) throw new Error(`Unknown department: ${department}`);
  if (!Object.values(FIXTURE_KIND).includes(kind)) throw new Error(`Unknown fixture kind: ${kind}`);
  if (!Number.isInteger(capacity) || capacity <= 0) throw new Error("Shelf bay capacity must be a positive integer");
  if (planogram.length && planogram.length !== capacity) {
    throw new Error(`Shelf bay ${id} planogram must contain exactly ${capacity} cells`);
  }

  return {
    id,
    sceneId,
    department,
    kind,
    capacity,
    facings: facings.map((facing, index) => ({
      ...facing,
      cell: Number.isInteger(facing.cell) ? facing.cell : index,
    })),
    planogram: planogram.length ? [...planogram] : Array.from({ length: capacity }, () => null),
    position: { ...position },
  };
}

export function occupiedCellSet(bay) {
  const cells = new Set();
  for (const facing of bay?.facings || []) {
    const start = Math.max(0, Number(facing?.cell || 0));
    const footprint = Math.max(1, Number(facing?.footprint || 1));
    for (let offset = 0; offset < footprint; offset += 1) {
      const cell = start + offset;
      if (cell < Number(bay?.capacity || 0)) cells.add(cell);
    }
  }
  return cells;
}

export function occupiedFacingCells(bay) {
  return occupiedCellSet(bay).size;
}

export function visibleGapCount(bay) {
  return Math.max(0, Number(bay?.capacity || 0) - occupiedFacingCells(bay));
}

export function planogramAllowsSkuAtCell(bay, skuId, startCell, footprint = 1) {
  if (!Array.isArray(bay?.planogram) || !bay.planogram.length) return true;
  const width = Math.max(1, Number(footprint || 1));
  const start = Number(startCell);
  if (!Number.isInteger(start) || start < 0 || start + width > bay.capacity) return false;

  for (let offset = 0; offset < width; offset += 1) {
    const expectedSkuId = bay.planogram[start + offset];
    if (expectedSkuId && expectedSkuId !== skuId) return false;
  }
  return true;
}

export function firstAvailableCell(bay, footprint = 1, skuId = null) {
  const width = Math.max(1, Number(footprint || 1));
  const capacity = Math.max(0, Number(bay?.capacity || 0));
  const occupied = occupiedCellSet(bay);

  for (let start = 0; start <= capacity - width; start += 1) {
    let available = true;
    for (let offset = 0; offset < width; offset += 1) {
      if (occupied.has(start + offset)) {
        available = false;
        break;
      }
    }
    if (!available) continue;
    if (skuId && !planogramAllowsSkuAtCell(bay, skuId, start, width)) continue;
    return start;
  }
  return -1;
}

export function isShelfFull(bay) {
  return visibleGapCount(bay) === 0;
}
