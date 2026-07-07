import { DEPARTMENT, FIXTURE_KIND } from "../model/storeModel.js";

export const SUPERMARKET_V2_SCENES = {
  "backroom-small": {
    id: "backroom-small",
    type: "backroom",
    purpose: "receive-stock",
    visuals: {
      wall: "storage-wall",
      objects: ["stock-cart", "delivery-crates", "barcode-scanner"],
    },
  },

  "drinks-wall": {
    id: "drinks-wall",
    type: "department",
    department: DEPARTMENT.DRINKS,
    fixture: {
      kind: FIXTURE_KIND.WALL_COOLER,
      layout: "wall-mounted-three-facing",
      position: "perimeter-wall",
    },
    visuals: {
      objects: ["glass-door-cooler", "price-rails", "drink-cases"],
    },
  },

  "breakfast-aisle": {
    id: "breakfast-aisle",
    type: "department",
    department: DEPARTMENT.BREAKFAST,
    fixture: {
      kind: FIXTURE_KIND.DRY_SHELF,
      layout: "gondola-wall-bay",
      position: "aisle-side",
    },
    visuals: {
      objects: ["bread-shelf", "promo-card", "dry-goods-cart"],
    },
  },

  "dairy-wall": {
    id: "dairy-wall",
    type: "department",
    department: DEPARTMENT.DAIRY,
    fixture: {
      kind: FIXTURE_KIND.WALL_COOLER,
      layout: "long-wall-cooler",
      position: "perimeter-wall",
    },
    visuals: {
      objects: ["milk-cases", "dairy-price-rails", "cooler-lights"],
    },
  },

  "produce-market": {
    id: "produce-market",
    type: "department",
    department: DEPARTMENT.PRODUCE,
    fixture: {
      kind: FIXTURE_KIND.PRODUCE_BIN,
      layout: "open-crates",
      position: "front-of-store",
    },
    visuals: {
      objects: ["wood-crates", "produce-sign", "scale"],
    },
  },
};

export function getSupermarketV2Scene(sceneId) {
  return SUPERMARKET_V2_SCENES[sceneId] || null;
}
