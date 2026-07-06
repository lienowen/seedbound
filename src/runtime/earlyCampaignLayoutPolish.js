import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";

let applied = false;

const ART_LAYOUTS = {
  "fx-cooler-glass3": {
    cols: 3,
    colFracs: [0.207, 0.5, 0.793],
    rowFracs: [0.355, 0.485, 0.615, 0.735],
    cells: {
      shelf_top_1: [0, 0], shelf_top_2: [1, 0], door_top_1: [2, 0],
      shelf_mid_1: [0, 1], shelf_mid_2: [1, 1], door_upper_2: [2, 1],
      shelf_low_1: [0, 2], shelf_low_2: [1, 2], door_mid_1: [2, 2],
      drawer_left: [0, 3], drawer_right: [1, 3], door_low_1: [2, 3],
    },
  },
  "fx-cooler-white3": {
    cols: 3,
    colFracs: [0.207, 0.5, 0.793],
    rowFracs: [0.345, 0.475, 0.605, 0.725],
    cells: {
      shelf_top_1: [0, 0], shelf_top_2: [1, 0], door_top_1: [2, 0],
      shelf_mid_1: [0, 1], shelf_mid_2: [1, 1], door_upper_2: [2, 1],
      shelf_low_1: [0, 2], shelf_low_2: [1, 2], door_mid_1: [2, 2],
      drawer_left: [0, 3], drawer_right: [1, 3], door_low_1: [2, 3],
    },
  },
  "fx-cooler-silver4": {
    cols: 4,
    colFracs: [0.163, 0.388, 0.612, 0.837],
    rowFracs: [0.375, 0.535, 0.695],
    cells: {
      shelf_top_1: [0, 0], shelf_top_2: [1, 0], shelf_mid_1: [2, 0], door_top_1: [3, 0],
      shelf_mid_2: [0, 1], shelf_low_1: [1, 1], shelf_low_2: [2, 1], door_upper_2: [3, 1],
      drawer_left: [0, 2], drawer_right: [1, 2], door_mid_1: [2, 2], door_low_1: [3, 2],
    },
  },
};

function patchLevel(level) {
  const fixture = level.stage?.fixtures?.[0];
  const layout = fixture ? ART_LAYOUTS[fixture.key] : null;
  if (!fixture || !layout) return;

  const left = fixture.cx - fixture.w / 2;
  const cellW = Math.round((fixture.w / layout.cols) * 0.8);
  for (const slot of level.slots) {
    const cell = layout.cells[slot.id];
    if (!cell) continue;
    const [col, row] = cell;
    slot.x = Math.round(left + layout.colFracs[col] * fixture.w);
    slot.y = Math.round(fixture.cy + layout.rowFracs[row] * fixture.h);
    slot.w = cellW;
    slot.h = 112;
    slot.rows = 1;
    slot.stackLayers = 1;
    slot.baseline = 0.5;
    slot.depth = 110 + row * 20 + col;
  }

  level.tuning = {
    ...(level.tuning || {}),
    magnetPreviewDistance: 118,
    snapDistance: 82,
    snapDuration: 200,
  };
}

export function applyEarlyCampaignLayoutPolish() {
  if (applied) return;
  applied = true;
  for (const level of FRIDGE_BR_CAMPAIGN) {
    const match = /^fridge-br-(\d+)$/.exec(level.id || "");
    const number = match ? Number(match[1]) : 0;
    if (number >= 1 && number <= 10) patchLevel(level);
  }
}
