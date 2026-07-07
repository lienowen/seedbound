import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

const BODY = { x: 70, y: 250, w: 430, h: 560 };
const INNER = { x: 96, y: 276, w: 378, h: 508 };
const DOOR = { x: 510, y: 260, w: 210, h: 550 };
const SHELF_Y = [365, 485, 605];
const DRAWER_Y = 710;
const DOOR_Y = [330, 445, 560, 675];

const SLOT_TEMPLATE = [
  { id: "shelf_top_1", zone: "shelf", allow: ["carton", "dairy", "box", "bottle", "food"], x: 220, y: 365, w: 150, h: 100, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 110 },
  { id: "shelf_top_2", zone: "shelf", allow: ["carton", "dairy", "box", "bottle", "food"], x: 390, y: 365, w: 150, h: 100, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 111 },
  { id: "shelf_mid_1", zone: "shelf", allow: ["food", "box", "dairy", "bottle"], x: 220, y: 485, w: 150, h: 100, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 130 },
  { id: "shelf_mid_2", zone: "shelf", allow: ["food", "box", "dairy", "bottle"], x: 390, y: 485, w: 150, h: 100, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 131 },
  { id: "shelf_low_1", zone: "chill", allow: ["food", "box", "dairy", "bottle"], x: 220, y: 605, w: 150, h: 100, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 150 },
  { id: "shelf_low_2", zone: "chill", allow: ["food", "box", "dairy", "bottle"], x: 390, y: 605, w: 150, h: 100, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 151 },
  { id: "drawer_left", zone: "drawer", allow: ["food", "box", "dairy"], x: 220, y: 710, w: 145, h: 90, cols: 2, rows: 1, stackLayers: 1, baseline: 0.62, depth: 176 },
  { id: "drawer_right", zone: "drawer", allow: ["food", "box", "dairy"], x: 390, y: 710, w: 145, h: 90, cols: 2, rows: 1, stackLayers: 1, baseline: 0.62, depth: 177 },
  { id: "door_top_1", zone: "door", allow: ["bottle", "dairy", "carton"], x: 615, y: 330, w: 120, h: 96, cols: 1, rows: 1, stackLayers: 1, baseline: 0.54, depth: 210 },
  { id: "door_upper_2", zone: "door", allow: ["bottle", "dairy", "carton"], x: 615, y: 445, w: 120, h: 96, cols: 1, rows: 1, stackLayers: 1, baseline: 0.54, depth: 215 },
  { id: "door_mid_1", zone: "door", allow: ["bottle", "dairy", "carton"], x: 615, y: 560, w: 120, h: 96, cols: 1, rows: 1, stackLayers: 1, baseline: 0.55, depth: 220 },
  { id: "door_low_1", zone: "door", allow: ["bottle", "dairy", "carton"], x: 615, y: 675, w: 120, h: 96, cols: 1, rows: 1, stackLayers: 1, baseline: 0.58, depth: 230 },
];

function coolerShapes() {
  const shapes = [
    { kind: "roundedRect", x: 64, y: 790, w: 660, h: 42, r: 22, fill: 0x2a1c0f, alpha: 0.12 },

    // Open door is intentionally obvious: a separate hinged panel with four bottle racks.
    { kind: "roundedRect", x: DOOR.x, y: DOOR.y, w: DOOR.w, h: DOOR.h, r: 26, fill: 0xf7f2eb, line: { width: 4, color: 0xffffff, alpha: 0.72 } },
    { kind: "roundedRect", x: DOOR.x + 14, y: DOOR.y + 16, w: DOOR.w - 28, h: DOOR.h - 32, r: 18, fill: 0xdcebe6, alpha: 0.72, line: { width: 2, color: 0xffffff, alpha: 0.58 } },
    { kind: "roundedRect", x: DOOR.x + 2, y: DOOR.y + 12, w: 18, h: DOOR.h - 24, r: 9, fill: 0xcdbfae, alpha: 0.9 },

    // Main cabinet body and cold interior.
    { kind: "roundedRect", x: BODY.x, y: BODY.y, w: BODY.w, h: BODY.h, r: 30, fill: 0xf7f2eb, line: { width: 4, color: 0xffffff, alpha: 0.72 } },
    { kind: "roundedRect", x: INNER.x, y: INNER.y, w: INNER.w, h: INNER.h, r: 18, fill: 0xe8f4f1, line: { width: 2, color: 0xffffff, alpha: 0.52 } },
    { kind: "roundedRect", x: INNER.x + 10, y: INNER.y + 8, w: INNER.w - 20, h: 22, r: 11, fill: 0xffffff, alpha: 0.58 },
    { kind: "roundedRect", x: BODY.x + BODY.w - 8, y: DOOR.y + 10, w: 18, h: DOOR.h - 20, r: 8, fill: 0xd7cab9, alpha: 0.95 },
  ];

  for (const y of SHELF_Y) {
    shapes.push({ kind: "roundedRect", x: INNER.x + 4, y: y + 12, w: INNER.w - 8, h: 11, r: 5, fill: 0x2a3a36, alpha: 0.1 });
    shapes.push({ kind: "roundedRect", x: INNER.x + 2, y, w: INNER.w - 4, h: 12, r: 6, fill: 0xcfe6df, alpha: 0.72, line: { width: 1.5, color: 0xffffff, alpha: 0.78 } });
  }

  shapes.push({ kind: "roundedRect", x: INNER.x + 18, y: DRAWER_Y - 58, w: INNER.w - 36, h: 116, r: 18, fill: 0xf1f6f4, alpha: 0.94, line: { width: 2, color: 0xffffff, alpha: 0.75 } });
  shapes.push({ kind: "roundedRect", x: INNER.x + 32, y: DRAWER_Y - 44, w: INNER.w - 64, h: 84, r: 14, fill: 0xe2efeb, alpha: 0.74 });
  shapes.push({ kind: "roundedRect", x: 341, y: DRAWER_Y - 52, w: 68, h: 9, r: 5, fill: 0xffffff, alpha: 0.58 });

  for (const y of DOOR_Y) {
    shapes.push({ kind: "roundedRect", x: DOOR.x + 20, y: y + 44, w: DOOR.w - 40, h: 14, r: 7, fill: 0xd9e9e4, alpha: 0.98, line: { width: 1.5, color: 0xffffff, alpha: 0.7 } });
    shapes.push({ kind: "roundedRect", x: DOOR.x + 20, y: y + 58, w: DOOR.w - 40, h: 8, r: 4, fill: 0x2a3a36, alpha: 0.09 });
  }

  // Existing large two-row delivery tray, kept clear of the cabinet.
  shapes.push({ kind: "roundedRect", x: 60, y: 862, w: 630, h: 300, r: 42, fill: 0xfff0ce, alpha: 0.92, line: { width: 3, color: 0xffffff, alpha: 0.62 } });
  for (let r = 0; r < 2; r += 1) {
    for (let i = 0; i < 6; i += 1) {
      shapes.push({ kind: "roundedRect", x: 88 + i * 94, y: 892 + r * 132, w: 82, h: 118, r: 20, fill: 0xffffff, alpha: 0.42, line: { width: 2, color: 0xf3cf94, alpha: 0.4 } });
    }
  }
  return shapes;
}

function coolerFronts() {
  const fronts = SHELF_Y.map((y, index) => ({
    kind: "roundedRect",
    x: INNER.x + 6,
    y,
    w: INNER.w - 12,
    h: 9,
    r: 5,
    fill: 0xb7d8ce,
    alpha: 0.42,
    depth: 340 + index * 20,
    line: { width: 1, color: 0xffffff, alpha: 0.48 },
  }));
  for (const y of DOOR_Y) {
    fronts.push({
      kind: "roundedRect",
      x: DOOR.x + 20,
      y: y + 30,
      w: DOOR.w - 40,
      h: 11,
      r: 6,
      fill: 0xbfd8d0,
      alpha: 0.78,
      depth: 360,
      line: { width: 1, color: 0xffffff, alpha: 0.62 },
    });
  }
  return fronts;
}

function originalCoolerScale(levelId) {
  const scales = [0.56, 0.56, 0.48];
  let sum = 0;
  for (let i = 0; i < levelId.length; i += 1) sum += levelId.charCodeAt(i);
  return scales[sum % scales.length];
}

function restoreItemScale(item, factor) {
  if (!item || item.__openDoorScaleRestored) return item;
  item.scale = Number(((item.scale || 1) * factor).toFixed(4));
  if (item.bounds) {
    item.bounds = {
      w: Math.max(1, Math.round(item.bounds.w * factor)),
      h: Math.max(1, Math.round(item.bounds.h * factor)),
    };
  }
  item.__openDoorScaleRestored = true;
  return item;
}

export function applyOpenDoorCoolerPolish() {
  if (applied) return;
  applied = true;

  for (const level of FRIDGE_BR_CAMPAIGN) {
    if (!level?.id?.startsWith("fridge-br-")) continue;

    const scale = originalCoolerScale(level.id);
    const factor = scale > 0 ? 1 / scale : 1;
    level.items = (level.items || []).map((item) => restoreItemScale(item, factor));
    level.stage = {
      width: 750,
      height: 1334,
      shapes: coolerShapes(),
      fixtures: [],
    };
    level.slots = structuredClone(SLOT_TEMPLATE);
    level.fronts = coolerFronts();
    level.revision = Math.max(21, Number(level.revision || 1));
  }
}
