import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

const TUTORIAL_IDS = new Set(["fridge-br-1", "fridge-br-2", "fridge-br-3"]);

const COOLER_CUTS = {
  // cooler-glass3.png is 980x735. All crops below are calculated against the
  // real source size and keep roughly the same aspect ratio when displayed.
  "fridge-br-1": {
    // Single focused cabinet bay: enough context to read as a cooler, no giant
    // three-door void around a three-item tutorial.
    crop: { x: 285, y: 55, w: 410, h: 590 },
    cx: 375,
    cy: 145,
    w: 500,
    h: 720,
  },
  "fridge-br-2": {
    // Two-bay view for the first two-category lesson.
    crop: { x: 180, y: 70, w: 620, h: 610 },
    cx: 375,
    cy: 165,
    w: 650,
    h: 640,
  },
  "fridge-br-3": {
    // Wider view only when a third category is introduced.
    crop: { x: 90, y: 45, w: 800, h: 640 },
    cx: 375,
    cy: 175,
    w: 690,
    h: 552,
  },
};

function movableItems(level) {
  return (level.items || []).filter((item) => !item.fixed);
}

function rowXs(count, gap) {
  const start = 375 - ((count - 1) * gap) / 2;
  return Array.from({ length: count }, (_, index) => Math.round(start + index * gap));
}

function layoutForCount(count, tutorial = false, firstFocus = false) {
  if (firstFocus) {
    return {
      rows: [3],
      xs: [[265, 375, 485]],
      ys: [918],
      bounds: { x: 165, y: 830, w: 420, h: 170, r: 30 },
      pocket: { w: 94, h: 92, r: 18 },
    };
  }

  if (count <= 3) {
    return {
      rows: [count],
      xs: [rowXs(count, 118)],
      ys: [tutorial ? 920 : 1050],
      bounds: tutorial
        ? { x: 150, y: 830, w: 450, h: 176, r: 32 }
        : { x: 145, y: 942, w: 460, h: 202, r: 34 },
      pocket: { w: 100, h: 96, r: 18 },
    };
  }

  if (count <= 6) {
    const first = Math.ceil(count / 2);
    const second = count - first;
    if (tutorial) {
      return {
        rows: [first, second],
        xs: [rowXs(first, 124), rowXs(second, 124)],
        ys: [868, 964],
        bounds: { x: 102, y: 790, w: 546, h: 254, r: 36 },
        pocket: { w: 100, h: 82, r: 17 },
      };
    }
    return {
      rows: [first, second],
      xs: [rowXs(first, 122), rowXs(second, 122)],
      ys: [980, 1092],
      bounds: { x: 92, y: 886, w: 566, h: 292, r: 38 },
      pocket: { w: 104, h: 96, r: 18 },
    };
  }

  const first = Math.ceil(count / 2);
  const second = count - first;
  const denseXs = (n) => rowXs(n, Math.min(108, 520 / Math.max(1, n - 1)));
  return {
    rows: [first, second],
    xs: [denseXs(first), denseXs(second)],
    ys: [972, 1094],
    bounds: { x: 62, y: 874, w: 626, h: 310, r: 40 },
    pocket: { w: 88, h: 102, r: 17 },
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
        kind: "roundedRect",
        x: cx - pocket.w / 2,
        y: cy - pocket.h / 2,
        w: pocket.w,
        h: pocket.h,
        r: pocket.r,
        fill: 0xffffff,
        alpha: 0.22,
        line: { width: 1.25, color: 0xe6c68f, alpha: 0.24 },
      });
    }
  });

  return shapes;
}

function applyDeliveryLayout(level) {
  const loose = movableItems(level);
  const layout = layoutForCount(
    loose.length,
    TUTORIAL_IDS.has(level.id),
    level.id === "fridge-br-1" || level.firstLevelFocus === true,
  );
  let cursor = 0;

  layout.rows.forEach((rowCount, row) => {
    for (let index = 0; index < rowCount; index += 1) {
      const item = loose[cursor++];
      if (!item) continue;
      item.trayX = layout.xs[row][index];
      item.trayY = layout.ys[row];
    }
  });

  level.stage = {
    ...(level.stage || {}),
    shapes: deliveryShapes(layout),
  };
  level.deliveryLayout = { ...layout.bounds, itemYs: [...layout.ys] };
  level.visualMode = "restock-market";
}

function applyCoolerCut(level) {
  const cut = COOLER_CUTS[level.id];
  if (!cut || !Array.isArray(level.stage?.fixtures) || !level.stage.fixtures.length) return;

  const [first, ...rest] = level.stage.fixtures;
  level.stage.fixtures = [{
    ...first,
    crop: { ...cut.crop },
    cx: cut.cx,
    cy: cut.cy,
    w: cut.w,
    h: cut.h,
    originY: 0,
  }, ...rest];
  level.fixtureCut = true;
}

function softenTutorial(level) {
  if (!TUTORIAL_IDS.has(level.id)) return;
  level.tuning = {
    ...(level.tuning || {}),
    magnetPreviewDistance: level.id === "fridge-br-1" ? 174 : 156,
    snapDistance: level.id === "fridge-br-1" ? 118 : 104,
    snapDuration: 210,
  };
}

export function applySupermarketRestockVisualPolish() {
  if (applied) return;
  applied = true;

  for (const level of FRIDGE_BR_CAMPAIGN) {
    if (level?.theme?.key !== "restock-cooler") continue;
    applyCoolerCut(level);
    applyDeliveryLayout(level);
    softenTutorial(level);
    level.revision = Math.max(35, Number(level.revision || 1));
  }
}
