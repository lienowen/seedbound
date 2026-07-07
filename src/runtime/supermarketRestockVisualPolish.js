import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

const TUTORIAL_IDS = new Set(["fridge-br-1", "fridge-br-2", "fridge-br-3"]);

function movableItems(level) {
  return (level.items || []).filter((item) => !item.fixed);
}

function layoutForCount(count, tutorial = false) {
  if (count <= 3) {
    return {
      rows: [count],
      xs: [[245, 375, 505].slice(0, count)],
      ys: [1050],
      bounds: { x: 145, y: 942, w: 460, h: 202, r: 34 },
      pocket: { w: 108, h: 118, r: 20 },
    };
  }

  if (count <= 6) {
    const first = Math.ceil(count / 2);
    const second = count - first;
    const rowXs = (n) => {
      const gap = tutorial ? 132 : 122;
      const start = 375 - ((n - 1) * gap) / 2;
      return Array.from({ length: n }, (_, index) => Math.round(start + index * gap));
    };
    return {
      rows: [first, second],
      xs: [rowXs(first), rowXs(second)],
      ys: [980, 1092],
      bounds: { x: 92, y: 886, w: 566, h: 292, r: 38 },
      pocket: { w: 104, h: 96, r: 18 },
    };
  }

  const first = Math.ceil(count / 2);
  const second = count - first;
  const rowXs = (n) => {
    const gap = Math.min(108, 520 / Math.max(1, n - 1));
    const start = 375 - ((n - 1) * gap) / 2;
    return Array.from({ length: n }, (_, index) => Math.round(start + index * gap));
  };
  return {
    rows: [first, second],
    xs: [rowXs(first), rowXs(second)],
    ys: [972, 1094],
    bounds: { x: 62, y: 874, w: 626, h: 310, r: 40 },
    pocket: { w: 88, h: 102, r: 17 },
  };
}

function deliveryShapes(layout) {
  const { bounds, pocket } = layout;
  const shapes = [
    // Grounding shadow gives the delivery cart physical weight without a heavy frame.
    { kind: "roundedRect", x: bounds.x + 10, y: bounds.y + bounds.h - 8, w: bounds.w - 20, h: 34, r: 17, fill: 0x3c2b1d, alpha: 0.10 },
    // Warm neutral cart surface. No loud border, no debug-grid feeling.
    { kind: "roundedRect", x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h, r: bounds.r, fill: 0xfff4dc, alpha: 0.96, line: { width: 2, color: 0xffffff, alpha: 0.68 } },
    // Slim delivery header rail; visually separates incoming stock from the playfield.
    { kind: "roundedRect", x: bounds.x + 18, y: bounds.y + 16, w: bounds.w - 36, h: 18, r: 9, fill: 0xe8bd79, alpha: 0.34 },
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
        alpha: 0.28,
        line: { width: 1.5, color: 0xe6c68f, alpha: 0.30 },
      });
    }
  });

  return shapes;
}

function applyDeliveryLayout(level) {
  const loose = movableItems(level);
  const layout = layoutForCount(loose.length, TUTORIAL_IDS.has(level.id));
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
  level.visualMode = "restock-market";
}

function softenTutorial(level) {
  if (!TUTORIAL_IDS.has(level.id)) return;
  level.tuning = {
    ...(level.tuning || {}),
    magnetPreviewDistance: 156,
    snapDistance: 104,
    snapDuration: 220,
  };
}

export function applySupermarketRestockVisualPolish() {
  if (applied) return;
  applied = true;

  for (const level of FRIDGE_BR_CAMPAIGN) {
    if (level?.theme?.key !== "restock-cooler") continue;
    applyDeliveryLayout(level);
    softenTutorial(level);
    level.revision = Math.max(31, Number(level.revision || 1));
  }
}
