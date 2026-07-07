import {
  DEPARTMENT,
  FIXTURE_KIND,
  TASK_KIND,
  createShelfBay,
} from "../model/storeModel.js";

export const SUPERMARKET_V2_VERTICAL_SLICE = [
  {
    id: "shift-1-first-top-up",
    title: "First Top-Up",
    startSceneId: "backroom-small",
    briefing: {
      clock: "07:00",
      role: "Morning Replenishment",
      priorities: ["Drinks wall: recover 3 visible gaps"],
    },
    scenes: [
      { id: "backroom-small", kind: "backroom", travelSeconds: 0 },
      { id: "drinks-wall", kind: "department", department: DEPARTMENT.DRINKS, travelSeconds: 5 },
    ],
    cases: [
      { id: "case-drinks-1", skuId: "green-soda", quantity: 1 },
      { id: "case-drinks-2", skuId: "red-soda", quantity: 1 },
      { id: "case-drinks-3", skuId: "juice", quantity: 1 },
    ],
    initialCart: [],
    bays: [
      createShelfBay({
        id: "drinks-bay-a",
        sceneId: "drinks-wall",
        department: DEPARTMENT.DRINKS,
        kind: FIXTURE_KIND.WALL_COOLER,
        capacity: 6,
        facings: [
          { unitId: "existing-green-1", skuId: "green-soda", footprint: 1, cell: 0, expiryDay: null },
          { unitId: "existing-red-1", skuId: "red-soda", footprint: 1, cell: 2, expiryDay: null },
          { unitId: "existing-juice-1", skuId: "juice", footprint: 1, cell: 4, expiryDay: null },
        ],
        position: { x: 375, y: 510, width: 420, height: 132, wallMounted: true },
      }),
    ],
    tasks: [
      { id: "load-drinks-a", kind: TASK_KIND.LOAD_CASE, caseId: "case-drinks-1", target: 1, progress: 0 },
      { id: "load-drinks-b", kind: TASK_KIND.LOAD_CASE, caseId: "case-drinks-2", target: 1, progress: 0 },
      { id: "load-drinks-c", kind: TASK_KIND.LOAD_CASE, caseId: "case-drinks-3", target: 1, progress: 0 },
      { id: "stock-green", kind: TASK_KIND.REPLENISH, bayId: "drinks-bay-a", skuId: "green-soda", target: 1, progress: 0 },
      { id: "stock-red", kind: TASK_KIND.REPLENISH, bayId: "drinks-bay-a", skuId: "red-soda", target: 1, progress: 0 },
      { id: "stock-juice", kind: TASK_KIND.REPLENISH, bayId: "drinks-bay-a", skuId: "juice", target: 1, progress: 0 },
      { id: "face-drinks", kind: TASK_KIND.FACE, bayId: "drinks-bay-a", target: 1, progress: 0 },
    ],
  },
  {
    id: "shift-2-breakfast-run",
    title: "Breakfast Run",
    startSceneId: "backroom-breakfast",
    briefing: {
      clock: "07:15",
      role: "Morning Replenishment",
      priorities: [
        "Breakfast aisle: recover the bread gap",
        "Dairy wall: recover 3 chilled gaps",
      ],
    },
    scenes: [
      { id: "backroom-breakfast", kind: "backroom", travelSeconds: 0 },
      { id: "breakfast-aisle", kind: "department", department: DEPARTMENT.BREAKFAST, travelSeconds: 4 },
      { id: "dairy-wall", kind: "department", department: DEPARTMENT.DAIRY, travelSeconds: 6 },
    ],
    cases: [
      { id: "tray-bread", skuId: "bread", quantity: 1 },
      { id: "crate-milk", skuId: "milk", quantity: 1, expiryDay: 10 },
      { id: "crate-yogurt", skuId: "yogurt", quantity: 1, expiryDay: 9 },
      { id: "crate-cheese", skuId: "cheese", quantity: 1, expiryDay: 14 },
    ],
    initialCart: [],
    bays: [
      createShelfBay({
        id: "breakfast-bread-bay",
        sceneId: "breakfast-aisle",
        department: DEPARTMENT.BREAKFAST,
        kind: FIXTURE_KIND.DRY_SHELF,
        capacity: 4,
        facings: [
          { unitId: "existing-bread-1", skuId: "bread", footprint: 2, cell: 0, expiryDay: null },
        ],
        position: { x: 375, y: 500, width: 390, height: 136, againstWall: true },
      }),
      createShelfBay({
        id: "dairy-bay-a",
        sceneId: "dairy-wall",
        department: DEPARTMENT.DAIRY,
        kind: FIXTURE_KIND.WALL_COOLER,
        capacity: 6,
        facings: [
          { unitId: "existing-milk-1", skuId: "milk", footprint: 1, cell: 0, expiryDay: 7 },
          { unitId: "existing-yogurt-1", skuId: "yogurt", footprint: 1, cell: 2, expiryDay: 8 },
          { unitId: "existing-cheese-1", skuId: "cheese", footprint: 1, cell: 4, expiryDay: 12 },
        ],
        position: { x: 375, y: 500, width: 430, height: 146, wallMounted: true },
      }),
    ],
    tasks: [
      { id: "load-bread", kind: TASK_KIND.LOAD_CASE, caseId: "tray-bread", target: 1, progress: 0 },
      { id: "load-milk", kind: TASK_KIND.LOAD_CASE, caseId: "crate-milk", target: 1, progress: 0 },
      { id: "load-yogurt", kind: TASK_KIND.LOAD_CASE, caseId: "crate-yogurt", target: 1, progress: 0 },
      { id: "load-cheese", kind: TASK_KIND.LOAD_CASE, caseId: "crate-cheese", target: 1, progress: 0 },
      { id: "stock-bread", kind: TASK_KIND.REPLENISH, bayId: "breakfast-bread-bay", skuId: "bread", target: 1, progress: 0 },
      { id: "face-breakfast", kind: TASK_KIND.FACE, bayId: "breakfast-bread-bay", target: 1, progress: 0 },
      { id: "stock-milk", kind: TASK_KIND.REPLENISH, bayId: "dairy-bay-a", skuId: "milk", target: 1, progress: 0 },
      { id: "stock-yogurt", kind: TASK_KIND.REPLENISH, bayId: "dairy-bay-a", skuId: "yogurt", target: 1, progress: 0 },
      { id: "stock-cheese", kind: TASK_KIND.REPLENISH, bayId: "dairy-bay-a", skuId: "cheese", target: 1, progress: 0 },
      { id: "face-dairy", kind: TASK_KIND.FACE, bayId: "dairy-bay-a", target: 1, progress: 0 },
    ],
  },
  {
    id: "shift-3-morning-rush",
    title: "Morning Rush",
    startSceneId: "backroom-rush",
    briefing: {
      clock: "08:00",
      role: "Opening Rush",
      priorities: [
        "Recover dairy gaps",
        "Keep dairy recovered if customers create new gaps",
        "Top up drinks before commuter rush",
      ],
    },
    scenes: [
      { id: "backroom-rush", kind: "backroom", travelSeconds: 0 },
      { id: "dairy-wall-rush", kind: "department", department: DEPARTMENT.DAIRY, travelSeconds: 5 },
      { id: "drinks-wall-rush", kind: "department", department: DEPARTMENT.DRINKS, travelSeconds: 5 },
    ],
    cases: [
      { id: "rush-milk", skuId: "milk", quantity: 3, expiryDay: 12 },
      { id: "rush-juice", skuId: "juice", quantity: 2 },
    ],
    initialCart: [],
    bays: [
      createShelfBay({
        id: "rush-dairy-bay",
        sceneId: "dairy-wall-rush",
        department: DEPARTMENT.DAIRY,
        kind: FIXTURE_KIND.WALL_COOLER,
        capacity: 3,
        facings: [
          { unitId: "existing-milk-1", skuId: "milk", footprint: 1, cell: 0, expiryDay: 8 },
        ],
        position: { x: 375, y: 500, width: 360, height: 140, wallMounted: true },
      }),
      createShelfBay({
        id: "rush-drinks-bay",
        sceneId: "drinks-wall-rush",
        department: DEPARTMENT.DRINKS,
        kind: FIXTURE_KIND.WALL_COOLER,
        capacity: 3,
        facings: [
          { unitId: "existing-juice-1", skuId: "juice", footprint: 1, cell: 0, expiryDay: null },
        ],
        position: { x: 375, y: 500, width: 340, height: 130, wallMounted: true },
      }),
    ],
    tasks: [
      { id: "load-rush-milk", kind: TASK_KIND.LOAD_CASE, caseId: "rush-milk", target: 1, progress: 0 },
      { id: "load-rush-juice", kind: TASK_KIND.LOAD_CASE, caseId: "rush-juice", target: 1, progress: 0 },
      { id: "stock-rush-milk", kind: TASK_KIND.REPLENISH, bayId: "rush-dairy-bay", skuId: "milk", target: 2, progress: 0 },
      { id: "face-rush-dairy", kind: TASK_KIND.FACE, bayId: "rush-dairy-bay", target: 1, progress: 0 },
      { id: "recover-customer-milk", kind: TASK_KIND.REPLENISH, bayId: "rush-dairy-bay", skuId: "milk", target: 1, progress: 0 },
      { id: "reface-rush-dairy", kind: TASK_KIND.FACE, bayId: "rush-dairy-bay", target: 1, progress: 0 },
      { id: "stock-rush-juice", kind: TASK_KIND.REPLENISH, bayId: "rush-drinks-bay", skuId: "juice", target: 2, progress: 0 },
      { id: "face-rush-drinks", kind: TASK_KIND.FACE, bayId: "rush-drinks-bay", target: 1, progress: 0 },
    ],
    events: [
      {
        id: "customer-removes-milk",
        trigger: { afterTaskId: "face-rush-dairy" },
        action: { type: "customer-takes", bayId: "rush-dairy-bay", skuId: "milk" },
        createsPriority: "Customer took a milk. Recover the new dairy gap before leaving.",
      },
    ],
  },
];

export function getVerticalSliceShift(shiftId) {
  return SUPERMARKET_V2_VERTICAL_SLICE.find((shift) => shift.id === shiftId) || null;
}
