import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

const TUTORIAL_IDS = new Set(["fridge-br-1", "fridge-br-2", "fridge-br-3"]);

const COOLER_CUTS = {
  "fridge-br-1": { crop: { x: 285, y: 55, w: 410, h: 590 }, cx: 375, cy: 145, w: 500, h: 720 },
  "fridge-br-2": { crop: { x: 180, y: 70, w: 620, h: 610 }, cx: 375, cy: 165, w: 650, h: 640 },
  "fridge-br-3": { crop: { x: 90, y: 45, w: 800, h: 640 }, cx: 375, cy: 175, w: 690, h: 552 },
};

const FAMILY_PALETTE = {
  "cold-aisle": { body: 0xe9f2ef, frame: 0x9dbcb5, accent: 0x6fa99d, header: 0xc9e2dc },
  "produce-cooler": { body: 0xf2e7cd, frame: 0xb88d58, accent: 0x6f9a62, header: 0xd9e6bf },
  "meal-cooler": { body: 0xe8edf1, frame: 0x95a8b5, accent: 0x718b9d, header: 0xd5e0e7 },
  "mixed-aisle": { body: 0xf2e1c4, frame: 0xb7814d, accent: 0xa96841, header: 0xead0a7 },
};

const MODULE_PALETTE = {
  "beverage-cooler": { fill: 0xe5f1ee, rail: 0x9cc9be, line: 0xffffff },
  "dairy-chill": { fill: 0xe8eef5, rail: 0xaabed1, line: 0xffffff },
  "produce-bin": { fill: 0xe6eed8, rail: 0x87a66f, line: 0xfbf7ea },
  "bulk-produce": { fill: 0xead7af, rail: 0xa77b45, line: 0xfff6df },
  "ready-chill": { fill: 0xe8edf0, rail: 0x93a9b6, line: 0xffffff },
  "condiment-shelf": { fill: 0xf4e0bf, rail: 0xb47742, line: 0xfff8e8 },
  "grocery-shelf": { fill: 0xf0dfc2, rail: 0xa9784a, line: 0xfff7e6 },
  "bakery-shelf": { fill: 0xf5e3c9, rail: 0xb88355, line: 0xfff8ea },
};

const SLOT_METRICS = {
  "beverage-cooler": { cell: 82, h: 106, baseline: 0.82 },
  "dairy-chill": { cell: 90, h: 108, baseline: 0.82 },
  "produce-bin": { cell: 92, h: 112, baseline: 0.84 },
  "bulk-produce": { cell: 108, h: 128, baseline: 0.86 },
  "ready-chill": { cell: 98, h: 110, baseline: 0.82 },
  "condiment-shelf": { cell: 76, h: 98, baseline: 0.80 },
  "grocery-shelf": { cell: 94, h: 104, baseline: 0.82 },
  "bakery-shelf": { cell: 104, h: 110, baseline: 0.84 },
};

function movableItems(level) {
  return (level.items || []).filter((item) => !item.fixed);
}

function activeSlots(level) {
  return (level.slots || []).filter((slot) => slot.category && !slot.empty);
}

function rowXs(count, gap) {
  const start = 375 - ((count - 1) * gap) / 2;
  return Array.from({ length: count }, (_, index) => Math.round(start + index * gap));
}

function layoutForCount(count, tutorial = false, firstFocus = false) {
  if (firstFocus) {
    return {
      rows: [3], xs: [[265, 375, 485]], ys: [918],
      bounds: { x: 165, y: 830, w: 420, h: 170, r: 30 }, pocket: { w: 94, h: 92, r: 18 },
    };
  }
  if (count <= 3) {
    return {
      rows: [count], xs: [rowXs(count, 118)], ys: [tutorial ? 920 : 1050],
      bounds: tutorial ? { x: 150, y: 830, w: 450, h: 176, r: 32 } : { x: 145, y: 942, w: 460, h: 202, r: 34 },
      pocket: { w: 100, h: 96, r: 18 },
    };
  }
  if (count <= 6) {
    const first = Math.ceil(count / 2);
    const second = count - first;
    if (tutorial) {
      return {
        rows: [first, second], xs: [rowXs(first, 124), rowXs(second, 124)], ys: [868, 964],
        bounds: { x: 102, y: 790, w: 546, h: 254, r: 36 }, pocket: { w: 100, h: 82, r: 17 },
      };
    }
    return {
      rows: [first, second], xs: [rowXs(first, 122), rowXs(second, 122)], ys: [980, 1092],
      bounds: { x: 92, y: 886, w: 566, h: 292, r: 38 }, pocket: { w: 104, h: 96, r: 18 },
    };
  }
  const first = Math.ceil(count / 2);
  const second = count - first;
  const denseXs = (n) => rowXs(n, Math.min(108, 520 / Math.max(1, n - 1)));
  return {
    rows: [first, second], xs: [denseXs(first), denseXs(second)], ys: [972, 1094],
    bounds: { x: 62, y: 874, w: 626, h: 310, r: 40 }, pocket: { w: 88, h: 102, r: 17 },
  };
}

function deliveryShapes(layout) {
  const { bounds, pocket } = layout;
  const shapes = [
    { kind: "roundedRect", x: bounds.x + 10, y: bounds.y + bounds.h - 8, w: bounds.w - 20, h: 30, r: 15, fill: 0x3c2b1d, alpha: 0.09 },
    { kind: "roundedRect", x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h, r: bounds.r, fill: 0xfff4dc, alpha: 0.96, line: { width: 2, color: 0xffffff, alpha: 0.62 } },
    { kind: "roundedRect", x: bounds.x + 18, y: bounds.y + 14, w: bounds.w - 36, h: 14, r: 7, fill: 0xe8bd79, alpha: 0.28 },
  ];
  layout.rows.forEach((rowCount, row) => {
    const xs = layout.xs[row];
    for (let index = 0; index < rowCount; index += 1) {
      const cx = xs[index];
      const cy = layout.ys[row];
      shapes.push({
        kind: "roundedRect", x: cx - pocket.w / 2, y: cy - pocket.h / 2,
        w: pocket.w, h: pocket.h, r: pocket.r, fill: 0xffffff, alpha: 0.22,
        line: { width: 1.25, color: 0xe6c68f, alpha: 0.24 },
      });
    }
  });
  return shapes;
}

function slotMetric(slot) {
  const metric = SLOT_METRICS[slot.shelfKind] || SLOT_METRICS["grocery-shelf"];
  const cols = Math.max(1, Number(slot.cols || 1));
  return {
    w: Math.max(142, Math.min(282, cols * metric.cell)),
    h: metric.h,
    baseline: metric.baseline,
  };
}

function layoutGeneratedSlots(level) {
  if (TUTORIAL_IDS.has(level.id)) return;
  const slots = activeSlots(level).sort((a, b) => ((a.tier ?? 0) - (b.tier ?? 0)) || (a.x - b.x));
  if (!slots.length) return;

  const rows = [];
  const gap = 18;
  for (const slot of slots) {
    const metric = slotMetric(slot);
    let row = rows.at(-1);
    const nextWidth = row ? row.width + gap + metric.w : metric.w;
    if (!row || row.entries.length >= 3 || nextWidth > 650) {
      row = { entries: [], width: 0 };
      rows.push(row);
    }
    row.entries.push({ slot, metric });
    row.width += (row.entries.length > 1 ? gap : 0) + metric.w;
  }

  const yStart = rows.length === 1 ? 520 : rows.length === 2 ? 410 : rows.length === 3 ? 350 : 320;
  const yEnd = rows.length === 1 ? 520 : rows.length === 2 ? 650 : rows.length === 3 ? 730 : 755;
  const yStep = rows.length <= 1 ? 0 : (yEnd - yStart) / (rows.length - 1);

  rows.forEach((row, rowIndex) => {
    const available = 650 - gap * Math.max(0, row.entries.length - 1);
    const rawWidth = row.entries.reduce((sum, entry) => sum + entry.metric.w, 0);
    const scale = Math.min(1, available / Math.max(1, rawWidth));
    const widths = row.entries.map((entry) => Math.round(entry.metric.w * scale));
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
    let cursor = 375 - total / 2;

    row.entries.forEach((entry, index) => {
      const width = widths[index];
      entry.slot.w = width;
      entry.slot.h = entry.metric.h;
      entry.slot.x = Math.round(cursor + width / 2);
      entry.slot.y = Math.round(yStart + yStep * rowIndex);
      entry.slot.baseline = entry.metric.baseline;
      entry.slot.depth = 120 + rowIndex * 28 + index;
      cursor += width + gap;
    });
  });

  level.generatedSlotLayout = true;
}

function applyDeliveryLayout(level) {
  const loose = movableItems(level);
  const layout = layoutForCount(loose.length, TUTORIAL_IDS.has(level.id), level.id === "fridge-br-1" || level.firstLevelFocus === true);
  let cursor = 0;
  layout.rows.forEach((rowCount, row) => {
    for (let index = 0; index < rowCount; index += 1) {
      const item = loose[cursor++];
      if (!item) continue;
      item.trayX = layout.xs[row][index];
      item.trayY = layout.ys[row];
    }
  });
  const incomingShapes = deliveryShapes(layout);
  level.stage = { ...(level.stage || {}), shapes: incomingShapes };
  level.deliveryShapes = incomingShapes;
  level.deliveryLayout = { ...layout.bounds, itemYs: [...layout.ys] };
  level.visualMode = "restock-market";
}

function applyCoolerCut(level) {
  const cut = COOLER_CUTS[level.id];
  if (!cut || !Array.isArray(level.stage?.fixtures) || !level.stage.fixtures.length) return;
  const [first, ...rest] = level.stage.fixtures;
  level.stage.fixtures = [{ ...first, crop: { ...cut.crop }, cx: cut.cx, cy: cut.cy, w: cut.w, h: cut.h, originY: 0 }, ...rest];
  level.fixtureCut = true;
}

function boundsForSlots(slots) {
  if (!slots.length) return { x: 90, y: 250, w: 570, h: 560 };
  const left = Math.min(...slots.map((slot) => slot.x - slot.w / 2));
  const right = Math.max(...slots.map((slot) => slot.x + slot.w / 2));
  const top = Math.min(...slots.map((slot) => slot.y - slot.h / 2));
  const bottom = Math.max(...slots.map((slot) => slot.y + slot.h / 2));
  return { x: Math.max(38, left - 30), y: Math.max(220, top - 52), w: Math.min(674, right - left + 60), h: Math.min(650, bottom - top + 82) };
}

function moduleColors(kind) {
  return MODULE_PALETTE[kind] || MODULE_PALETTE["grocery-shelf"];
}

function marketFixtureShapes(level) {
  const slots = activeSlots(level);
  const family = level.marketFixtureFamily || "cold-aisle";
  const palette = FAMILY_PALETTE[family] || FAMILY_PALETTE["cold-aisle"];
  const bounds = boundsForSlots(slots);
  const shapes = [
    { kind: "roundedRect", x: bounds.x + 8, y: bounds.y + bounds.h - 2, w: bounds.w - 16, h: 30, r: 15, fill: 0x2e241c, alpha: 0.10 },
    { kind: "roundedRect", x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h, r: 28, fill: palette.body, alpha: 0.98, line: { width: 3, color: 0xffffff, alpha: 0.62 } },
    { kind: "roundedRect", x: bounds.x + 16, y: bounds.y + 14, w: bounds.w - 32, h: 30, r: 15, fill: palette.header, alpha: 0.96 },
    { kind: "roundedRect", x: bounds.x + 28, y: bounds.y + 23, w: Math.max(72, bounds.w * 0.28), h: 10, r: 5, fill: palette.accent, alpha: 0.52 },
  ];

  for (const slot of slots) {
    const colors = moduleColors(slot.shelfKind);
    const left = slot.x - slot.w / 2;
    const top = slot.y - slot.h / 2;
    const kind = slot.shelfKind;
    if (kind === "produce-bin" || kind === "bulk-produce") {
      const deep = kind === "bulk-produce";
      shapes.push({ kind: "roundedRect", x: left - 7, y: top - 8, w: slot.w + 14, h: slot.h + 24, r: deep ? 18 : 15, fill: colors.fill, alpha: 0.98, line: { width: 2, color: colors.line, alpha: 0.58 } });
      shapes.push({ kind: "roundedRect", x: left + 4, y: slot.y + slot.h * 0.12, w: slot.w - 8, h: deep ? 28 : 20, r: deep ? 12 : 9, fill: colors.rail, alpha: deep ? 0.42 : 0.34 });
      continue;
    }
    shapes.push({ kind: "roundedRect", x: left - 6, y: top - 10, w: slot.w + 12, h: slot.h + 20, r: 14, fill: colors.fill, alpha: 0.96, line: { width: 2, color: colors.line, alpha: 0.58 } });
    shapes.push({ kind: "roundedRect", x: left + 5, y: top + 5, w: slot.w - 10, h: 12, r: 6, fill: 0xffffff, alpha: kind.includes("chill") || kind.includes("cooler") ? 0.28 : 0.16 });
  }
  return shapes;
}

function marketFronts(level) {
  const fronts = [];
  for (const slot of activeSlots(level)) {
    const colors = moduleColors(slot.shelfKind);
    const left = slot.x - slot.w / 2;
    const kind = slot.shelfKind;
    if (kind === "produce-bin" || kind === "bulk-produce") {
      const deep = kind === "bulk-produce";
      fronts.push({ kind: "roundedRect", x: left - 4, y: slot.y + slot.h / 2 - (deep ? 20 : 14), w: slot.w + 8, h: deep ? 30 : 22, r: deep ? 12 : 9, fill: colors.rail, alpha: deep ? 0.88 : 0.78, line: { width: 1.5, color: colors.line, alpha: 0.58 }, depth: 310 });
      continue;
    }
    fronts.push({ kind: "roundedRect", x: left - 3, y: slot.y + slot.h / 2 - 7, w: slot.w + 6, h: 14, r: 7, fill: colors.rail, alpha: kind === "condiment-shelf" || kind === "grocery-shelf" || kind === "bakery-shelf" ? 0.88 : 0.76, line: { width: 1.3, color: colors.line, alpha: 0.62 }, depth: 310 });
  }
  return fronts;
}

function applyMarketFixtureFamily(level) {
  if (TUTORIAL_IDS.has(level.id)) return;
  level.stage = { ...(level.stage || {}), fixtures: [], shapes: [...marketFixtureShapes(level), ...(level.deliveryShapes || [])] };
  level.fronts = marketFronts(level);
  level.visualMode = `restock-${level.marketFixtureFamily || "cold-aisle"}`;
}

function applyFirstFocusFront(level) {
  if (level.id !== "fridge-br-1") return;
  level.fronts = [
    { kind: "roundedRect", x: 210, y: 646, w: 330, h: 14, r: 7, fill: 0xd8e7e5, alpha: 0.94, line: { width: 1.5, color: 0xffffff, alpha: 0.72 }, depth: 310 },
    { kind: "roundedRect", x: 224, y: 649, w: 302, h: 4, r: 2, fill: 0xffffff, alpha: 0.42, depth: 311 },
  ];
}

function softenTutorial(level) {
  if (!TUTORIAL_IDS.has(level.id)) return;
  level.tuning = { ...(level.tuning || {}), magnetPreviewDistance: level.id === "fridge-br-1" ? 174 : 156, snapDistance: level.id === "fridge-br-1" ? 118 : 104, snapDuration: 210 };
}

export function applySupermarketRestockVisualPolish() {
  if (applied) return;
  applied = true;
  for (const level of FRIDGE_BR_CAMPAIGN) {
    if (level?.theme?.key !== "restock-cooler") continue;
    applyCoolerCut(level);
    layoutGeneratedSlots(level);
    applyDeliveryLayout(level);
    applyMarketFixtureFamily(level);
    applyFirstFocusFront(level);
    softenTutorial(level);
    level.revision = Math.max(41, Number(level.revision || 1));
  }
}
