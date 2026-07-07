import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

const ALL_TAGS = ["carton", "dairy", "box", "bottle", "food", "jar", "can", "tube"];
const CATEGORY_ORDER = ["beverages", "dairy", "fresh", "meals", "sauces", "groceries"];

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
  return item?.prefs?.category || "groceries";
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

  // Keep only a few pre-stocked anchors. Too many fixed goods make the player feel
  // like they entered a puzzle already half-obscured by clutter.
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

  // Fallback for large categories: choose the row with the largest free run first,
  // then continue on the nearest row. This remains deterministic and visually calm.
  const picked = [];
  const rowOrder = preferredRows(category, rows.length);
  for (const rowIndex of rowOrder) {
    for (const slot of rows[rowIndex].slots) {
      if (slot.__used) continue;
      picked.push(slot);
      if (picked.length >= slotNeed) return picked;
    }
  }
  return picked;
}

function rebuildPlanogram(level) {
  const slots = structuredClone(level.slots || []);
  for (const slot of slots) {
    slot.zone = "shelf";
    slot.allow = [...ALL_TAGS];
    slot.rows = 1;
    slot.stackLayers = 1;
    slot.category = undefined;
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
    const items = [...byCategory.get(category)].sort((a, b) => Number(!!b.fixed) - Number(!!a.fixed));
    const chunks = [];
    for (let offset = 0; offset < items.length; offset += 2) chunks.push(items.slice(offset, offset + 2));

    const assigned = allocateCategory(rows, category, chunks.length);
    chunks.forEach((chunk, index) => {
      const slot = assigned[index];
      if (!slot) return;
      slot.__used = true;
      slot.category = category;
      slot.empty = false;
      slot.cols = Math.max(1, chunk.length);
      planogram.push({ slotId: slot.id, category, products: chunk.map((item) => item.image) });

      chunk.forEach((item, col) => {
        if (!item.fixed) return;
        item.slot = slot.id;
        item.col = col;
        item.row = 0;
        item.layer = 0;
      });
    });
  }

  for (const slot of slots) delete slot.__used;
  level.slots = slots;
  level.planogram = planogram;
  level.objective = {
    type: "restock-planogram",
    categories: categories,
  };
}

function applyFirstLevelFocus(level) {
  if (level.id !== "fridge-br-1") return;

  // First contact must be one truthful action: three drinks, one shelf, one win.
  // Never split 3 goods into a hidden 2+1 planogram across different cabinet cells.
  level.items = (level.items || [])
    .filter((item) => !item.fixed && item.prefs?.category === "beverages")
    .slice(0, 3)
    .map((item) => ({
      ...item,
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
    allow: [...ALL_TAGS],
    category: "beverages",
    empty: false,
    x: 375,
    y: 565,
    w: 366,
    h: 126,
    cols: 3,
    rows: 1,
    stackLayers: 1,
    baseline: 0.82,
    depth: 150,
    tier: 1,
  }];
  level.planogram = [{
    slotId,
    category: "beverages",
    products: level.items.map((item) => item.image),
  }];
  level.objective = {
    type: "restock-planogram",
    categories: ["beverages"],
    count: 3,
  };
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
    applyEarlyCurve(level, number);
    rebuildPlanogram(level);
    applyFirstLevelFocus(level);
    applyFeelCurve(level, number);
    level.revision = Math.max(33, Number(level.revision || 1));
  }
}
