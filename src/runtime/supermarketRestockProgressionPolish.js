import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

const CATEGORY_ORDER = ["beverages", "dairy", "fresh", "meals", "sauces", "groceries"];

const SKU_PROFILE = {
  juice: { category: "beverages", size: [1, 1], shelfKind: "beverage-cooler" },
  "green-soda": { category: "beverages", size: [1, 1], shelfKind: "beverage-cooler" },
  "red-soda": { category: "beverages", size: [1, 1], shelfKind: "beverage-cooler" },

  milk: { category: "dairy", size: [1, 1], shelfKind: "dairy-chill" },
  yogurt: { category: "dairy", size: [1, 1], shelfKind: "dairy-chill" },
  cheese: { category: "dairy", size: [1, 1], shelfKind: "dairy-chill" },
  butter: { category: "dairy", size: [2, 1], shelfKind: "dairy-chill" },

  lettuce: { category: "fresh", size: [1, 1], shelfKind: "produce-bin" },
  strawberries: { category: "fresh", size: [2, 1], shelfKind: "produce-bin" },
  apple: { category: "fresh", size: [1, 1], shelfKind: "produce-bin" },
  broccoli: { category: "fresh", size: [1, 1], shelfKind: "produce-bin" },
  tomato: { category: "fresh", size: [1, 1], shelfKind: "produce-bin" },
  carrot: { category: "fresh", size: [1, 1], shelfKind: "produce-bin" },
  watermelon: { category: "fresh", size: [2, 1], shelfKind: "bulk-produce", weight: "heavy" },
  corn: { category: "fresh", size: [2, 1], shelfKind: "produce-bin" },

  eggs: { category: "meals", size: [2, 1], shelfKind: "ready-chill" },
  mealbox: { category: "meals", size: [2, 1], shelfKind: "ready-chill" },
  fish: { category: "meals", size: [2, 1], shelfKind: "ready-chill" },

  mustard: { category: "sauces", size: [1, 1], shelfKind: "condiment-shelf" },
  ketchup: { category: "sauces", size: [1, 1], shelfKind: "condiment-shelf" },

  bread: { category: "groceries", size: [2, 1], shelfKind: "bakery-shelf" },
  cake: { category: "groceries", size: [2, 1], shelfKind: "bakery-shelf" },
};

const CATEGORY_SLOT_PROFILE = {
  beverages: { allow: ["bottle", "carton"], capacity: 3, shelfKind: "beverage-cooler" },
  dairy: { allow: ["dairy", "carton"], capacity: 2, shelfKind: "dairy-chill" },
  fresh: { allow: ["food", "box"], capacity: 2, shelfKind: "produce-bin" },
  meals: { allow: ["food", "box"], capacity: 2, shelfKind: "ready-chill" },
  sauces: { allow: ["bottle", "jar", "tube"], capacity: 3, shelfKind: "condiment-shelf" },
  groceries: { allow: ["food", "box", "jar", "can", "carton"], capacity: 2, shelfKind: "grocery-shelf" },
};

const CURVE = {
  4: { total: 8, fixed: 2 },
  5: { total: 9, fixed: 2 },
  6: { total: 10, fixed: 3 },
  7: { total: 10, fixed: 3 },
  8: { total: 11, fixed: 3 },
  9: { total: 12, fixed: 4 },
  10: { total: 12, fixed: 4 },
};

const ROW_PREFERENCE = {
  beverages: [1, 2, 0, 3],
  dairy: [1, 0, 2, 3],
  fresh: [3, 2, 1, 0],
  meals: [2, 1, 3, 0],
  sauces: [0, 1, 2, 3],
  groceries: [0, 1, 2, 3],
};

function levelNumber(level) {
  const match = /^fridge-br-(\d+)$/.exec(level?.id || "");
  return match ? Number(match[1]) : 0;
}

function categoryOf(item) {
  return item?.prefs?.category || SKU_PROFILE[item?.image]?.category || "groceries";
}

function itemWidth(item) {
  return Math.max(1, Number(item?.size?.[0] || 1));
}

function applySkuReality(level) {
  level.items = (level.items || []).map((item) => {
    const profile = SKU_PROFILE[item.image] || {
      category: categoryOf(item),
      size: item.size || [1, 1],
      shelfKind: "grocery-shelf",
    };
    return {
      ...item,
      size: [...profile.size],
      shelfKind: profile.shelfKind,
      prefs: {
        ...(item.prefs || {}),
        category: profile.category,
        ...(profile.weight ? { weight: profile.weight } : {}),
      },
    };
  });
}

function balancedSelection(items, total) {
  if (items.length <= total) return [...items];

  const buckets = new Map();
  for (const category of CATEGORY_ORDER) buckets.set(category, []);
  for (const item of items) {
    const category = categoryOf(item);
    if (!buckets.has(category)) buckets.set(category, []);
    buckets.get(category).push(item);
  }

  const selected = [];
  const orderedCategories = CATEGORY_ORDER.filter((category) => buckets.get(category)?.length);
  let cursor = 0;
  while (selected.length < total && orderedCategories.length) {
    const category = orderedCategories[cursor % orderedCategories.length];
    const bucket = buckets.get(category);
    const item = bucket.shift();
    if (item) selected.push(item);
    if (!bucket.length) orderedCategories.splice(cursor % orderedCategories.length, 1);
    else cursor += 1;
  }
  return selected;
}

function applyEarlyCurve(level, number) {
  const profile = CURVE[number];
  if (!profile) return;

  const all = (level.items || []).map((item) => structuredClone(item));
  const selected = balancedSelection(all, profile.total);
  const originalFixed = selected.filter((item) => item.fixed);
  const fixedIds = new Set(balancedSelection(originalFixed, profile.fixed).map((item) => item.id));

  level.items = selected.map((item) => ({
    ...item,
    fixed: fixedIds.has(item.id),
    ...(fixedIds.has(item.id)
      ? {}
      : { slot: undefined, col: undefined, row: undefined, layer: undefined }),
  }));
}

function visualRows(slots) {
  const sorted = [...slots].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const rows = [];
  for (const slot of sorted) {
    let row = rows.find((candidate) => Math.abs(candidate.y - slot.y) <= 26);
    if (!row) {
      row = { y: slot.y, slots: [] };
      rows.push(row);
    }
    row.slots.push(slot);
    row.y = row.slots.reduce((sum, entry) => sum + entry.y, 0) / row.slots.length;
  }
  rows.sort((a, b) => a.y - b.y);
  for (const row of rows) row.slots.sort((a, b) => a.x - b.x);
  return rows;
}

function preferredRows(category, rowCount) {
  const raw = ROW_PREFERENCE[category] || [0, 1, 2, 3];
  const unique = [];
  for (const index of raw) {
    const normalized = Math.max(0, Math.min(rowCount - 1, index));
    if (!unique.includes(normalized)) unique.push(normalized);
  }
  for (let index = 0; index < rowCount; index += 1) {
    if (!unique.includes(index)) unique.push(index);
  }
  return unique;
}

function consecutiveFreeRun(row, need) {
  let start = -1;
  let length = 0;
  for (let index = 0; index < row.slots.length; index += 1) {
    if (!row.slots[index].__used) {
      if (start < 0) start = index;
      length += 1;
      if (length >= need) return row.slots.slice(start, start + need);
    } else {
      start = -1;
      length = 0;
    }
  }
  return null;
}

function allocateCategory(rows, category, slotNeed) {
  for (const rowIndex of preferredRows(category, rows.length)) {
    const run = consecutiveFreeRun(rows[rowIndex], slotNeed);
    if (run) return run;
  }

  const picked = [];
  for (const rowIndex of preferredRows(category, rows.length)) {
    for (const slot of rows[rowIndex].slots) {
      if (slot.__used) continue;
      picked.push(slot);
      if (picked.length >= slotNeed) return picked;
    }
  }
  return picked;
}

function packCategory(items, capacity) {
  const chunks = [];
  let current = [];
  let used = 0;

  for (const item of items) {
    const width = Math.min(capacity, itemWidth(item));
    if (current.length && used + width > capacity) {
      chunks.push({ items: current, usedCells: used });
      current = [];
      used = 0;
    }
    current.push(item);
    used += width;
  }
  if (current.length) chunks.push({ items: current, usedCells: used });
  return chunks;
}

function shelfKindForChunk(category, chunk, fallback) {
  const kinds = new Set(chunk.items.map((item) => item.shelfKind).filter(Boolean));
  if (kinds.has("bulk-produce")) return "bulk-produce";
  if (kinds.has("bakery-shelf")) return "bakery-shelf";
  if (kinds.size === 1) return [...kinds][0];
  if (category === "fresh") return "produce-bin";
  if (category === "groceries") return "grocery-shelf";
  return fallback;
}

function rebuildPlanogram(level) {
  const slots = structuredClone(level.slots || []);
  for (const slot of slots) {
    slot.zone = "shelf";
    slot.rows = 1;
    slot.stackLayers = 1;
    slot.category = undefined;
    slot.shelfKind = undefined;
    slot.empty = true;
    slot.cols = 1;
    slot.__used = false;
  }

  const rows = visualRows(slots);
  rows.forEach((row, tier) => row.slots.forEach((slot) => { slot.tier = tier; }));

  const byCategory = new Map();
  for (const item of level.items || []) {
    const category = categoryOf(item);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(item);
  }

  const planogram = [];
  const categories = CATEGORY_ORDER.filter((category) => byCategory.has(category));
  for (const category of categories) {
    const slotProfile = CATEGORY_SLOT_PROFILE[category] || CATEGORY_SLOT_PROFILE.groceries;
    const items = [...byCategory.get(category)].sort((a, b) => {
      const fixedDiff = Number(!!b.fixed) - Number(!!a.fixed);
      if (fixedDiff) return fixedDiff;
      return itemWidth(b) - itemWidth(a);
    });
    const chunks = packCategory(items, slotProfile.capacity);
    const assigned = allocateCategory(rows, category, chunks.length);

    chunks.forEach((chunk, index) => {
      const slot = assigned[index];
      if (!slot) return;
      const shelfKind = shelfKindForChunk(category, chunk, slotProfile.shelfKind);
      slot.__used = true;
      slot.category = category;
      slot.shelfKind = shelfKind;
      slot.allow = [...slotProfile.allow];
      slot.empty = false;
      slot.cols = Math.max(1, chunk.usedCells);

      let col = 0;
      const facings = [];
      for (const item of chunk.items) {
        const width = itemWidth(item);
        facings.push({ itemId: item.id, image: item.image, col, width });
        if (item.fixed) {
          item.slot = slot.id;
          item.col = col;
          item.row = 0;
          item.layer = 0;
        }
        col += width;
      }

      planogram.push({
        slotId: slot.id,
        category,
        shelfKind,
        products: facings.map((facing) => facing.image),
        facings,
      });
    });
  }

  for (const slot of slots) delete slot.__used;
  level.slots = slots;
  level.planogram = planogram;
  level.objective = { type: "restock-planogram", categories };

  const kinds = new Set(planogram.map((entry) => entry.shelfKind));
  if (kinds.has("produce-bin") || kinds.has("bulk-produce")) level.marketFixtureFamily = "produce-cooler";
  else if (kinds.has("grocery-shelf") || kinds.has("condiment-shelf") || kinds.has("bakery-shelf")) level.marketFixtureFamily = "mixed-aisle";
  else if (kinds.has("ready-chill")) level.marketFixtureFamily = "meal-cooler";
  else level.marketFixtureFamily = "cold-aisle";
}

function applyFirstLevelFocus(level) {
  if (level.id !== "fridge-br-1") return;

  level.items = (level.items || [])
    .filter((item) => !item.fixed && item.prefs?.category === "beverages")
    .slice(0, 3)
    .map((item) => ({
      ...item,
      size: [1, 1],
      fixed: false,
      slot: undefined,
      col: undefined,
      row: undefined,
      layer: undefined,
    }));

  const slotId = "restock_drinks_focus";
  level.slots = [{
    id: slotId,
    zone: "shelf",
    allow: [...CATEGORY_SLOT_PROFILE.beverages.allow],
    category: "beverages",
    shelfKind: "beverage-cooler",
    empty: false,
    x: 375,
    y: 610,
    w: 330,
    h: 112,
    cols: 3,
    rows: 1,
    stackLayers: 1,
    baseline: 0.84,
    depth: 150,
    tier: 1,
  }];
  const facings = level.items.map((item, col) => ({ itemId: item.id, image: item.image, col, width: 1 }));
  level.planogram = [{
    slotId,
    category: "beverages",
    shelfKind: "beverage-cooler",
    products: facings.map((facing) => facing.image),
    facings,
  }];
  level.objective = {
    type: "restock-planogram",
    categories: ["beverages"],
    count: 3,
  };
  level.marketFixtureFamily = "cold-aisle";
  level.firstLevelFocus = true;
}

function applyFeelCurve(level, number) {
  const tuning = number <= 3
    ? { magnetPreviewDistance: 156, snapDistance: 104, snapDuration: 220 }
    : number <= 7
      ? { magnetPreviewDistance: 146, snapDistance: 96, snapDuration: 228 }
      : number <= 10
        ? { magnetPreviewDistance: 140, snapDistance: 92, snapDuration: 236 }
        : number <= 15
          ? { magnetPreviewDistance: 136, snapDistance: 90, snapDuration: 240 }
          : { magnetPreviewDistance: 132, snapDistance: 88, snapDuration: 244 };

  level.tuning = { ...(level.tuning || {}), ...tuning };
  level.restockPace = number <= 3 ? "learn" : number <= 7 ? "flow" : number <= 10 ? "plan" : number <= 15 ? "react" : "rush";
}

export function applySupermarketRestockProgressionPolish() {
  if (applied) return;
  applied = true;

  for (const level of FRIDGE_BR_CAMPAIGN) {
    if (level?.theme?.key !== "restock-cooler") continue;
    const number = levelNumber(level);
    applySkuReality(level);
    applyEarlyCurve(level, number);
    rebuildPlanogram(level);
    applyFirstLevelFocus(level);
    applyFeelCurve(level, number);
    level.revision = Math.max(39, Number(level.revision || 1));
  }
}
