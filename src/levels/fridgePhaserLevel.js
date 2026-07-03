import { ITEM_RENDER_PROFILES } from "./itemRenderProfiles.js";

const FRIDGE_STAGE = {
  width: 750,
  height: 1334,
  shapes: [
    { kind: "roundedRect", x: 160, y: 798, w: 292, h: 152, r: 24, fill: 0xf8f4ee, alpha: 0.94, line: { width: 3, color: 0xf2fbf8, alpha: 0.6 } },
    { kind: "roundedRect", x: 176, y: 816, w: 260, h: 116, r: 18, fill: 0xfffcf7, alpha: 0.96, line: { width: 2, color: 0xffffff, alpha: 0.8 } },
    { kind: "roundedRect", x: 68, y: 1040, w: 614, h: 142, r: 38, fill: 0xfff0ce, alpha: 0.84, line: { width: 3, color: 0xffffff, alpha: 0.62 } },
    { kind: "roundedRect", x: 94, y: 1068, w: 82, h: 76, r: 20, fill: 0xffffff, alpha: 0.38, line: { width: 2, color: 0xf3cf94, alpha: 0.34 } },
    { kind: "roundedRect", x: 188, y: 1068, w: 82, h: 76, r: 20, fill: 0xffffff, alpha: 0.38, line: { width: 2, color: 0xf3cf94, alpha: 0.34 } },
    { kind: "roundedRect", x: 282, y: 1068, w: 82, h: 76, r: 20, fill: 0xffffff, alpha: 0.38, line: { width: 2, color: 0xf3cf94, alpha: 0.34 } },
    { kind: "roundedRect", x: 376, y: 1068, w: 82, h: 76, r: 20, fill: 0xffffff, alpha: 0.38, line: { width: 2, color: 0xf3cf94, alpha: 0.34 } },
    { kind: "roundedRect", x: 470, y: 1068, w: 82, h: 76, r: 20, fill: 0xffffff, alpha: 0.38, line: { width: 2, color: 0xf3cf94, alpha: 0.34 } },
    { kind: "roundedRect", x: 564, y: 1068, w: 82, h: 76, r: 20, fill: 0xffffff, alpha: 0.38, line: { width: 2, color: 0xf3cf94, alpha: 0.34 } },
  ],
};

const FRIDGE_FRONTS = [
  { kind: "roundedRect", x: 132, y: 425, w: 348, h: 9, r: 5, fill: 0xb7d8ce, alpha: 0.32, depth: 340, line: { width: 1, color: 0xffffff, alpha: 0.35 } },
  { kind: "roundedRect", x: 132, y: 575, w: 348, h: 9, r: 5, fill: 0xb7d8ce, alpha: 0.32, depth: 360, line: { width: 1, color: 0xffffff, alpha: 0.35 } },
  { kind: "roundedRect", x: 132, y: 735, w: 348, h: 9, r: 5, fill: 0xb7d8ce, alpha: 0.32, depth: 380, line: { width: 1, color: 0xffffff, alpha: 0.35 } },
  { kind: "roundedRect", x: 132, y: 846, w: 348, h: 10, r: 5, fill: 0xbcded5, alpha: 0.42, depth: 400, line: { width: 1, color: 0xffffff, alpha: 0.44 } },
];

const FRIDGE_SLOTS = [
  { id: "shelf_top_1", zone: "shelf", allow: ["carton", "dairy", "box", "bottle", "food"], x: 247, y: 425, w: 160, h: 100, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 110 },
  { id: "shelf_top_2", zone: "shelf", allow: ["carton", "dairy", "box", "bottle", "food"], x: 390, y: 425, w: 160, h: 100, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 111 },
  { id: "shelf_mid_1", zone: "shelf", allow: ["food", "box", "dairy", "bottle"], x: 247, y: 575, w: 170, h: 102, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 130 },
  { id: "shelf_mid_2", zone: "shelf", allow: ["food", "box", "dairy", "bottle"], x: 390, y: 575, w: 170, h: 102, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 131 },
  { id: "shelf_low_1", zone: "chill", allow: ["food", "box", "dairy", "bottle"], x: 247, y: 735, w: 170, h: 102, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 150 },
  { id: "shelf_low_2", zone: "chill", allow: ["food", "box", "dairy", "bottle"], x: 390, y: 735, w: 170, h: 102, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 151 },
  { id: "drawer_left", zone: "drawer", allow: ["food", "box", "dairy"], x: 243, y: 890, w: 148, h: 96, cols: 2, rows: 1, stackLayers: 1, baseline: 0.62, depth: 176 },
  { id: "drawer_right", zone: "drawer", allow: ["food", "box", "dairy"], x: 389, y: 890, w: 148, h: 96, cols: 2, rows: 1, stackLayers: 1, baseline: 0.62, depth: 177 },
  { id: "door_top_1", zone: "door", allow: ["bottle", "dairy", "carton"], x: 578, y: 404, w: 102, h: 104, cols: 1, rows: 1, baseline: 0.54, depth: 210 },
  { id: "door_upper_2", zone: "door", allow: ["bottle", "dairy", "carton"], x: 579, y: 583, w: 102, h: 104, cols: 1, rows: 1, baseline: 0.54, depth: 215 },
  { id: "door_mid_1", zone: "door", allow: ["bottle", "dairy", "carton"], x: 581, y: 762, w: 104, h: 104, cols: 1, rows: 1, baseline: 0.55, depth: 220 },
  { id: "door_low_1", zone: "door", allow: ["bottle", "dairy", "carton"], x: 589, y: 971, w: 118, h: 106, cols: 1, rows: 1, baseline: 0.58, depth: 230 },
];

const FRIDGE_ASSETS = {
  back: { key: "fridge-board", file: "fridge-board.webp" },
  front: { key: "fridge-door-front", file: "fridge-door-front.webp", depth: 430 },
};

// ---- PACKING PROTOTYPE: top-down picnic basket ------------------------------
// A single large 4x4 grid inside a square basket illustration. The basket art
// is drawn with `contain` so it keeps its square aspect instead of being
// stretched to the tall portrait stage.
const PICNIC_ASSETS = {
  back: { key: "picnic-basket", file: "picnic-basket.png", contain: true, size: 700, y: 628 },
};

const PICNIC_STAGE = {
  width: 750,
  height: 1334,
  shapes: [],
};

// One big grid slot centered on the basket interior. 4 cols x 4 rows of
// 124px cells => 496x496, sitting inside the woven rim.
const PICNIC_SLOTS = [
  {
    id: "basket",
    zone: "basket",
    allow: ["pack"],
    x: 375,
    y: 628,
    w: 496,
    h: 496,
    cols: 4,
    rows: 4,
    stackLayers: 1,
    baseline: 0.5,
    depth: 120,
  },
];

function renderProfile(key) {
  return ITEM_RENDER_PROFILES[key] || {
    originX: 0.5,
    originY: 1,
    contactLeft: 0.35,
    contactRight: 0.65,
    contactCenterX: 0.5,
    contactY: 1,
    visibleTopY: 0,
    visibleHeight: 1,
    textureHeight: 362,
  };
}

function scaleFromVisibleHeight(key, targetHeight) {
  const profile = renderProfile(key);
  const visibleHeight = Math.max(1, (profile.visibleHeight || 1) * (profile.textureHeight || 362));
  return Number((targetHeight / visibleHeight).toFixed(3));
}

const ITEM_SCALE = {
  cartonTall: scaleFromVisibleHeight("milk", 132),
  sauceBottle: scaleFromVisibleHeight("juice", 120),
  sodaCan: scaleFromVisibleHeight("green-soda", 112),
  dairyCup: scaleFromVisibleHeight("yogurt", 116),
  produceWide: 0.432,
  mealWide: 0.404,
  dessertWide: 0.35,
  leafyProduce: 0.562,
};

const ITEM_LIBRARY = {
  milk: {
    image: "milk",
    file: "milk.webp",
    name: "Leite",
    tags: ["carton", "dairy"],
    size: [1, 1],
    scale: ITEM_SCALE.cartonTall,
    anchor: [renderProfile("milk").originX, renderProfile("milk").originY],
    surface: renderProfile("milk"),
    bounds: { w: 90, h: 116 },
    nudge: {
      door_top_1: { x: 12, y: -3 },
      door_upper_2: { x: 13, y: -4 },
      door_mid_1: { x: 15, y: -6 },
      door_low_1: { x: 22, y: -8 },
    },
    renderNudge: {
      drawer: { x: 4, y: -2 },
    },
    prefs: { zone: "door", needsCold: true, likesNeighbors: ["yogurt", "eggs"] },
  },
  eggs: { image: "eggs", file: "eggs.webp", name: "Ovos", tags: ["food", "box"], size: [2, 1], scale: ITEM_SCALE.produceWide, anchor: [renderProfile("eggs").originX, renderProfile("eggs").originY], surface: renderProfile("eggs"), bounds: { w: 136, h: 88 }, nudge: { shelf: { x: -4 } }, prefs: { zone: "shelf", needsCold: false, likesNeighbors: ["milk", "strawberries"] } },
  strawberries: { image: "strawberries", file: "strawberries.webp", name: "Morangos", tags: ["food", "box"], size: [2, 1], scale: ITEM_SCALE.produceWide, anchor: [renderProfile("strawberries").originX, renderProfile("strawberries").originY], surface: renderProfile("strawberries"), bounds: { w: 136, h: 90 }, nudge: { shelf: { x: 4 }, chill: { x: 4 } }, prefs: { zone: "chill", needsCold: true, likesNeighbors: ["eggs", "yogurt"] } },
  mustard: { image: "mustard", file: "mustard.webp", name: "Mostarda", tags: ["bottle"], size: [1, 1], scale: ITEM_SCALE.sauceBottle, anchor: [renderProfile("mustard").originX, renderProfile("mustard").originY], surface: renderProfile("mustard"), bounds: { w: 48, h: 100 }, nudge: { door: { x: 12, y: -4 } }, prefs: { zone: "door", needsCold: false, likesNeighbors: ["ketchup", "juice"], hatesNeighbors: ["cake"] } },
  ketchup: { image: "ketchup", file: "ketchup.webp", name: "Ketchup", tags: ["bottle"], size: [1, 1], scale: ITEM_SCALE.sauceBottle, anchor: [renderProfile("ketchup").originX, renderProfile("ketchup").originY], surface: renderProfile("ketchup"), bounds: { w: 48, h: 100 }, nudge: { door: { x: 12, y: -4 } }, prefs: { zone: "door", needsCold: false, likesNeighbors: ["mustard", "green-soda"] } },
  juice: { image: "juice", file: "juice.webp", name: "Suco", tags: ["bottle"], size: [1, 1], scale: ITEM_SCALE.sauceBottle, anchor: [renderProfile("juice").originX, renderProfile("juice").originY], surface: renderProfile("juice"), bounds: { w: 48, h: 100 }, nudge: { door: { x: 12, y: -4 } }, prefs: { zone: "door", needsCold: true, likesNeighbors: ["milk", "green-soda"] } },
  yogurt: { image: "yogurt", file: "yogurt.webp", name: "Iogurte", tags: ["dairy"], size: [1, 1], scale: ITEM_SCALE.dairyCup, anchor: [renderProfile("yogurt").originX, renderProfile("yogurt").originY], surface: renderProfile("yogurt"), bounds: { w: 88, h: 86 }, nudge: { door: { x: 10, y: -2 } }, prefs: { zone: "shelf", needsCold: true, likesNeighbors: ["milk", "strawberries"] } },
  lettuce: {
    image: "lettuce",
    file: "lettuce.webp",
    name: "Alface",
    tags: ["food"],
    size: [1, 1],
    scale: ITEM_SCALE.leafyProduce,
    anchor: [renderProfile("lettuce").originX, renderProfile("lettuce").originY],
    surface: renderProfile("lettuce"),
    bounds: { w: 128, h: 104 },
    renderNudge: {
      drawer: { x: -6, y: -2 },
    },
    prefs: { zone: "drawer", needsCold: true, hatesNeighbors: ["mealbox", "cake"] },
  },
  mealbox: { image: "mealbox", file: "mealbox.webp", name: "Marmita", tags: ["food", "box"], size: [2, 1], scale: ITEM_SCALE.mealWide, anchor: [renderProfile("mealbox").originX, renderProfile("mealbox").originY], surface: renderProfile("mealbox"), bounds: { w: 132, h: 98 }, nudge: { drawer: { x: -4 } }, prefs: { zone: "chill", needsCold: true, hatesNeighbors: ["lettuce", "cake"] } },
  cake: { image: "cake", file: "cake.webp", name: "Bolo", tags: ["food"], size: [2, 1], scale: ITEM_SCALE.dessertWide, anchor: [renderProfile("cake").originX, renderProfile("cake").originY], surface: renderProfile("cake"), bounds: { w: 106, h: 86 }, nudge: { drawer: { x: 4 } }, prefs: { zone: "shelf", likesVisible: true, hatesNeighbors: ["mustard", "mealbox"] } },
  greenSoda: { image: "green-soda", file: "green-soda.webp", name: "Guarana", tags: ["bottle"], size: [1, 1], scale: ITEM_SCALE.sodaCan, anchor: [renderProfile("green-soda").originX, renderProfile("green-soda").originY], surface: renderProfile("green-soda"), bounds: { w: 48, h: 100 }, nudge: { door: { x: 10, y: -1 } }, prefs: { zone: "door", needsCold: false, likesNeighbors: ["red-soda", "juice"] } },
  redSoda: { image: "red-soda", file: "red-soda.webp", name: "Refri", tags: ["bottle"], size: [1, 1], scale: ITEM_SCALE.sodaCan, anchor: [renderProfile("red-soda").originX, renderProfile("red-soda").originY], surface: renderProfile("red-soda"), bounds: { w: 48, h: 100 }, nudge: { door: { x: 10, y: -1 } }, prefs: { zone: "door", needsCold: false, likesNeighbors: ["green-soda", "juice"] } },

  // ---- PACKING PROTOTYPE ITEMS (top-down, big + rotatable) --------------
  // These are authored HORIZONTALLY (art lies left-right), so base sizes are
  // wide. Non-square items opt into rotation via `rotatable: true`. They render
  // with a center anchor in the top-down grid mode and carry no zone prefs —
  // the win condition is pure spatial packing.
  packWatermelon: { image: "pack-watermelon", file: "pack-watermelon.png", name: "Melancia", tags: ["pack"], size: [2, 2], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },
  packBaguette: { image: "pack-baguette", file: "pack-baguette.png", name: "Baguete", tags: ["pack"], size: [3, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, rotatable: true, prefs: {} },
  packBottle: { image: "pack-bottle", file: "pack-bottle.png", name: "Suco", tags: ["pack"], size: [2, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, rotatable: true, prefs: {} },
  packCheese: { image: "pack-cheese", file: "pack-cheese.png", name: "Queijo", tags: ["pack"], size: [2, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, rotatable: true, prefs: {} },
  packSandwich: { image: "pack-sandwich", file: "pack-sandwich.png", name: "Sanduiche", tags: ["pack"], size: [1, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },
  packJam: { image: "pack-jam", file: "pack-jam.png", name: "Geleia", tags: ["pack"], size: [1, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },
};

const TRAY_POSITIONS = [
  [148, 1108],
  [240, 1108],
  [332, 1108],
  [424, 1108],
  [516, 1108],
  [608, 1108],
  [194, 1168],
  [286, 1168],
  [378, 1168],
  [470, 1168],
  [562, 1168],
];

function buildItem(key, overrides = {}) {
  return {
    id: overrides.id || key,
    ...structuredClone(ITEM_LIBRARY[key]),
    ...structuredClone(overrides),
  };
}

function buildFridgeLevel({
  id,
  phase,
  title,
  subtitle,
  intro,
  goal,
  difficulty,
  reward = 50,
  harmonyTarget = 300, // ⭐ target — must reach this to pass
  harmonyGold = 380,   // ⭐⭐ 
  harmonyPerfect = 440, // ⭐⭐⭐
  fixedItems = [],
  trayItems = [],
}) {
  return {
    id,
    revision: 10,
    phase,
    reward,
    harmony: { target: harmonyTarget, gold: harmonyGold, perfect: harmonyPerfect },
    copy: {
      intro,
      goal,
      difficulty,
      successTag: "GELADEIRA PERFEITA",
      successTitle: "Boa demais!",
      successBody: "Organizacao pronta para virar video curto.",
      nextLabel: "Proxima fase",
      retryLabel: "Repetir",
    },
    theme: {
      key: "fridge",
      title,
      subtitle,
      background: "#ffecc8",
    },
    assets: structuredClone(FRIDGE_ASSETS),
    tuning: {
      magnetPreviewDistance: 132,
      snapDistance: 88,
      snapDuration: 280,
    },
    stage: structuredClone(FRIDGE_STAGE),
    fronts: structuredClone(FRIDGE_FRONTS),
    slots: structuredClone(FRIDGE_SLOTS),
    items: [
      ...fixedItems.map((item) => buildItem(item.key, { fixed: true, slot: item.slot, id: item.id || item.key })),
      ...trayItems.map((item, index) => {
        // Dynamic tray: spread items across 2 rows, even spacing
        const count = trayItems.length;
        const row1Count = Math.ceil(count / 2);
        const row2Count = count - row1Count;
        const row1Start = 375 - ((row1Count - 1) * 100) / 2;
        const row2Start = 375 - ((row2Count - 1) * 100) / 2;
        const inFirstRow = index < row1Count;
        const col = inFirstRow ? index : index - row1Count;
        const trayX = inFirstRow ? row1Start + col * 100 : row2Start + col * 100;
        const trayY = inFirstRow ? 1140 : 1200;
        return buildItem(item.key, {
          id: item.id || `${item.key}_${index + 1}`,
          trayX,
          trayY,
          ...item.overrides,
        });
      }),
    ],
  };
}

function buildPicnicLevel() {
  const trayItems = [
    { key: "packWatermelon" },
    { key: "packBaguette" },
    { key: "packBottle" },
    { key: "packCheese" },
    { key: "packSandwich" },
    { key: "packJam" },
  ];
  const row1 = [148, 300, 452, 604];
  const row2 = [224, 376, 528];
  return {
    id: "picnic-pack-1",
    revision: 1,
    phase: 1,
    reward: 120,
    topDown: true,
    winMode: "packing",
    harmony: { target: 300, gold: 420, perfect: 520 },
    copy: {
      intro: "Pack the basket! Tap an item to rotate it, then drag it in.",
      goal: "Fit every treat inside the picnic basket.",
      difficulty: "Prototype",
      successTag: "CESTA PERFEITA",
      successTitle: "All packed!",
      successBody: "Everything fits — ready for the picnic.",
      nextLabel: "Next",
      retryLabel: "Retry",
    },
    theme: {
      key: "picnic",
      title: "Picnic Packing",
      subtitle: "Tap to rotate · drag to pack",
      background: "#eaf4d8",
    },
    assets: structuredClone(PICNIC_ASSETS),
    tuning: {
      magnetPreviewDistance: 150,
      snapDistance: 96,
      snapDuration: 240,
    },
    stage: structuredClone(PICNIC_STAGE),
    fronts: [],
    slots: structuredClone(PICNIC_SLOTS),
    items: trayItems.map((item, index) => {
      const inFirstRow = index < row1.length;
      const trayX = inFirstRow ? row1[index] : row2[index - row1.length];
      const trayY = inFirstRow ? 1070 : 1180;
      return buildItem(item.key, {
        id: item.id || `${item.key}_${index + 1}`,
        trayX,
        trayY,
        ...item.overrides,
      });
    }),
  };
}

// Standalone packing prototype, reachable via ?theme=pack (kept out of the
// main fridge campaign so progression is unaffected).
export const PICNIC_LEVEL = buildPicnicLevel();

export const FRIDGE_BR_CAMPAIGN = [
  // ====== Level 1: Ad Showcase — "looks lived-in, needs your touch" ======
  buildFridgeLevel({
    id: "fridge-br-1",
    phase: 1,
    reward: 150,
    harmonyTarget: 300,   // 6 items × 50 base, easy pass
    harmonyGold: 400,     // 2★
    harmonyPerfect: 480,   // 3★ — needs chain + good placement
    title: "Your First Fridge",
    subtitle: "Easy, cozy, satisfying.",
    intro: "The fridge already has a few things. Finish the door with four drinks.",
    goal: "Place 4 drinks on the door. They love being next to each other!",
    difficulty: "Cozy",
    fixedItems: [
      // Decorative only — make the fridge look lived-in, don't block door puzzle
      { key: "eggs", slot: "shelf_mid_1", id: "eggs_fixed" },
      { key: "mealbox", slot: "shelf_mid_2", id: "mealbox_fixed" },
      { key: "yogurt", slot: "shelf_top_2", id: "yogurt_fixed" },
      { key: "lettuce", slot: "shelf_low_1", id: "lettuce_fixed" },
    ],
    trayItems: [
      // 4 drinks → door (guaranteed chain: all like each other)
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "juice" },
      { key: "milk" },
      // 2 items → fill out the fridge
      { key: "strawberries" },
      { key: "cake" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-2",
    phase: 2,
    title: "Cafe da Manha",
    subtitle: "Leve, rapido e gostoso.",
    intro: "Se os grandes entrarem tarde, a manha trava.",
    goal: "Complete a prateleira do cafe e deixe os frascos pequenos na porta.",
    difficulty: "Suave",
    reward: 60,
    harmonyTarget: 340,
    harmonyGold: 420,
    harmonyPerfect: 500,
    fixedItems: [
      { key: "yogurt", slot: "shelf_top_2", id: "yogurt_fixed" },
      { key: "eggs", slot: "shelf_mid_1", id: "eggs_fixed" },
      { key: "lettuce", slot: "shelf_low_1", id: "lettuce_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "strawberries" },
      { key: "cake" },
      { key: "mustard" },
      { key: "ketchup" },
      { key: "juice" },
      { key: "greenSoda" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-3",
    phase: 3,
    title: "Feira Fresquinha",
    subtitle: "Fresco embaixo, bebidas na porta.",
    intro: "A parte fria de baixo ja salva espaco de verdade.",
    goal: "Se o item grande entrar tarde, o resto trava. Porta para bebidas, frio para a sobra.",
    difficulty: "Medio",
    reward: 70,
    harmonyTarget: 380,
    harmonyGold: 460,
    harmonyPerfect: 540,
    fixedItems: [
      { key: "eggs", slot: "shelf_mid_1", id: "eggs_fixed" },
      { key: "yogurt", slot: "shelf_top_2", id: "yogurt_fixed" },
      { key: "juice", slot: "door_mid_1", id: "juice_fixed" },
    ],
    trayItems: [
      { key: "mealbox" },
      { key: "strawberries" },
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "milk" },
      { key: "cake" },
      { key: "mustard" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-4",
    phase: 4,
    title: "Jantar Corrido",
    subtitle: "Sobrou comida, mas tem que caber.",
    intro: "Grande vai primeiro, ou o resto trava.",
    goal: "Abra o frio de baixo para o bolo e mande as bebidas para a porta.",
    difficulty: "Aperto bom",
    reward: 80,
    fixedItems: [
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "eggs", slot: "shelf_mid_1", id: "eggs_fixed" },
      { key: "mealbox", slot: "shelf_low_1", id: "mealbox_fixed" },
    ],
    trayItems: [
      { key: "cake" },
      { key: "lettuce" },
      { key: "strawberries" },
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "juice" },
      { key: "ketchup" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-5",
    phase: 5,
    title: "Sextou na Geladeira",
    subtitle: "Organize tudo antes da visita chegar.",
    intro: "Aqui ja nao cabe improviso.",
    goal: "Feche uma fileira bonita de bebidas e preserve o espaco grande para comida.",
    difficulty: "Cheia",
    reward: 100,
    fixedItems: [
      { key: "mealbox", slot: "shelf_mid_1", id: "mealbox_fixed" },
      { key: "eggs", slot: "shelf_low_1", id: "eggs_fixed" },
      { key: "lettuce", slot: "drawer_left", id: "lettuce_fixed" },
    ],
    trayItems: [
      { key: "greenSoda" },
      { key: "milk" },
      { key: "juice" },
      { key: "yogurt" },
      { key: "ketchup" },
      { key: "redSoda" },
      { key: "cake" },
      { key: "strawberries" },
    ],
  }),

  // ====== Phase 2: Intermediate (6-10) ======
  buildFridgeLevel({
    id: "fridge-br-6",
    phase: 6,
    title: "Dia de Feira",
    subtitle: "Comprou tudo fresco, agora arruma.",
    intro: "Depois da sexta fase, ignorar a base fria vira erro.",
    goal: "Use baixo, porta e um grande de cada vez; se empilhar errado, o meio sufoca.",
    difficulty: "Medio",
    reward: 110,
    fixedItems: [
      { key: "lettuce", slot: "shelf_top_1", id: "lettuce_fixed" },
      { key: "yogurt", slot: "shelf_top_2", id: "yogurt_fixed" },
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "eggs", slot: "drawer_left", id: "eggs_fixed" },
      { key: "cake", slot: "shelf_low_1", id: "cake_fixed" },
      { key: "ketchup", slot: "door_mid_1", id: "ketchup_fixed" },
      { key: "juice", slot: "door_low_1", id: "juice_fixed" },
      { key: "strawberries", slot: "drawer_right", id: "strawberries_fixed" },
    ],
    trayItems: [
      { key: "mealbox" },
      { key: "greenSoda" },
      { key: "mustard" },
      { key: "redSoda" },
      { key: "milk" },
      { key: "eggs" },
      { key: "yogurt" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-7",
    phase: 7,
    title: "Lanche da Tarde",
    subtitle: "Bolo, fruta e um iogurte.",
    intro: "O doce cabe, mas s贸 se voce separar bem as alturas.",
    goal: "Mantenha bolo e fruta nas prateleiras certas e empurre as bebidas para o canto certo.",
    difficulty: "Medio",
    reward: 120,
    fixedItems: [
      { key: "juice", slot: "door_top_1", id: "juice_fixed" },
      { key: "cake", slot: "shelf_top_1", id: "cake_fixed" },
      { key: "strawberries", slot: "shelf_top_2", id: "strawberries_fixed" },
      { key: "eggs", slot: "shelf_mid_2", id: "eggs_fixed" },
      { key: "mealbox", slot: "drawer_left", id: "mealbox_fixed" },
      { key: "milk", slot: "door_low_1", id: "milk_fixed" },
      { key: "lettuce", slot: "shelf_low_2", id: "lettuce_fixed" },
      { key: "greenSoda", slot: "door_mid_1", id: "greenSoda_fixed" },
    ],
    trayItems: [
      { key: "yogurt" },
      { key: "milk" },
      { key: "redSoda" },
      { key: "mustard" },
      { key: "juice" },
      { key: "cake" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-8",
    phase: 8,
    title: "Marmita da Semana",
    subtitle: "Cinco marmitas pedem espaco.",
    intro: "Duas marmitas ja comem o meio inteiro.",
    goal: "Quando o centro trava, a vit贸ria vem de distribuir bebida, frio e sobra com disciplina.",
    difficulty: "Aperto",
    reward: 130,
    fixedItems: [
      { key: "mealbox", slot: "shelf_mid_1", id: "mealbox_fixed_1" },
      { key: "mealbox", slot: "shelf_mid_2", id: "mealbox_fixed_2" },
      { key: "strawberries", slot: "shelf_top_1", id: "strawberries_fixed" },
      { key: "eggs", slot: "shelf_low_1", id: "eggs_fixed" },
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "lettuce", slot: "drawer_right", id: "lettuce_fixed" },
      { key: "greenSoda", slot: "door_mid_1", id: "greenSoda_fixed" },
    ],
    trayItems: [
      { key: "cake" },
      { key: "ketchup" },
      { key: "mustard" },
      { key: "redSoda" },
      { key: "yogurt" },
      { key: "juice" },
      { key: "milk" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-9",
    phase: 9,
    title: "Visita Surpresa",
    subtitle: "Sogra chegando em 5 minutos.",
    intro: "Rapido nao quer dizer aleatorio.",
    goal: "Se os drinks n茫o forem para a porta e o grande n茫o entrar cedo, o caos vence antes da visita.",
    difficulty: "Correria",
    reward: 140,
    fixedItems: [
      { key: "cake", slot: "shelf_top_1", id: "cake_fixed" },
      { key: "strawberries", slot: "shelf_top_2", id: "strawberries_fixed" },
      { key: "mealbox", slot: "drawer_left", id: "mealbox_fixed" },
      { key: "eggs", slot: "shelf_mid_1", id: "eggs_fixed" },
      { key: "ketchup", slot: "door_mid_1", id: "ketchup_fixed" },
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "lettuce", slot: "shelf_low_2", id: "lettuce_fixed" },
      { key: "juice", slot: "door_low_1", id: "juice_fixed" },
    ],
    trayItems: [
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "yogurt" },
      { key: "mustard" },
      { key: "milk" },
      { key: "cake" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-10",
    phase: 10,
    title: "Fim de Expediente",
    subtitle: "Fase final da primeira temporada.",
    intro: "Agora a geladeira cobra planejamento.",
    goal: "A prova final da temporada: sem distribuir por zona e sem respeitar os grandes, n茫o fecha.",
    difficulty: "Dificil",
    reward: 150,
    fixedItems: [
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "greenSoda", slot: "door_upper_2", id: "greenSoda_fixed" },
      { key: "mealbox", slot: "shelf_mid_1", id: "mealbox_fixed" },
      { key: "eggs", slot: "shelf_low_1", id: "eggs_fixed" },
      { key: "lettuce", slot: "shelf_top_2", id: "lettuce_fixed" },
      { key: "strawberries", slot: "drawer_right", id: "strawberries_fixed" },
      { key: "ketchup", slot: "door_mid_1", id: "ketchup_fixed" },
      { key: "juice", slot: "door_low_1", id: "juice_fixed" },
    ],
    trayItems: [
      { key: "eggs" },
      { key: "yogurt" },
      { key: "redSoda" },
      { key: "mealbox" },
      { key: "cake" },
    ],
  }),

  // ====== Phase 3: Advanced (11-15) ======
  buildFridgeLevel({
    id: "fridge-br-11",
    phase: 11,
    title: "Ressaca de Domingo",
    subtitle: "Sobrou tudo da festa.",
    intro: "Guarda o que presta, joga fora o resto.",
    goal: "Encaixe latinhas e sobras na medida certa.",
    difficulty: "Ressaca",
    reward: 160,
    fixedItems: [
      { key: "cake", slot: "shelf_top_1", id: "cake_fixed" },
      { key: "juice", slot: "door_top_1", id: "juice_fixed" },
      { key: "mealbox", slot: "shelf_mid_1", id: "mealbox_fixed" },
      { key: "lettuce", slot: "drawer_right", id: "lettuce_fixed" },
      { key: "greenSoda", slot: "door_low_1", id: "gsoda_fixed" },
    ],
    trayItems: [
      { key: "cake" },
      { key: "redSoda" },
      { key: "lettuce" },
      { key: "ketchup" },
      { key: "yogurt" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-12",
    phase: 12,
    title: "Dieta Comecou",
    subtitle: "So coisa saudavel na geladeira.",
    intro: "Legumes em cima, laticinios embaixo.",
    goal: "Separe por categoria sem deixar nada na porta errada.",
    difficulty: "Leve mas preciso",
    reward: 170,
    fixedItems: [
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "lettuce", slot: "shelf_top_2", id: "lettuce_fixed" },
      { key: "yogurt", slot: "door_mid_1", id: "yogurt_fixed" },
      { key: "strawberries", slot: "drawer_left", id: "strawberries_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "yogurt" },
      { key: "eggs" },
      { key: "strawberries" },
      { key: "mealbox" },
      { key: "juice" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-13",
    phase: 13,
    title: "Churrasco Amanha",
    subtitle: "Carne na caixa, molho na porta.",
    intro: "Prepare a geladeira pro churrasco.",
    goal: "Garanta que todos os molhos fiquem faceis de pegar.",
    difficulty: "Medio",
    reward: 180,
    fixedItems: [
      { key: "mustard", slot: "door_top_1", id: "mustard_fixed" },
      { key: "mealbox", slot: "shelf_mid_2", id: "mealbox_fixed" },
      { key: "ketchup", slot: "door_mid_1", id: "ketchup_fixed" },
      { key: "greenSoda", slot: "door_low_1", id: "greenSoda_fixed" },
    ],
    trayItems: [
      { key: "mustard" },
      { key: "ketchup" },
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "juice" },
      { key: "lettuce" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-14",
    phase: 14,
    title: "Volta das Ferias",
    subtitle: "Geladeira vazia, mercado lotado.",
    intro: "Comprou demais. Da um jeito.",
    goal: "Distribua 8 itens sem deixar sobrar nenhum canto.",
    difficulty: "Apertado",
    reward: 190,
    fixedItems: [
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "strawberries", slot: "drawer_left", id: "strawberries_fixed" },
      { key: "lettuce", slot: "shelf_low_1", id: "lettuce_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "strawberries" },
      { key: "juice" },
      { key: "yogurt" },
      { key: "greenSoda" },
      { key: "lettuce" },
      { key: "cake" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-15",
    phase: 15,
    title: "Geladeira Gourmet",
    subtitle: "Ingredientes nobres, organizacao impecavel.",
    intro: "Cada coisa no seu lugar, sem excecao.",
    goal: "Monte uma geladeira digna de revista.",
    difficulty: "Chef",
    reward: 200,
    fixedItems: [
      { key: "cake", slot: "shelf_top_1", id: "cake_fixed" },
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "juice", slot: "door_mid_1", id: "juice_fixed" },
      { key: "strawberries", slot: "drawer_left", id: "strawberries_fixed" },
      { key: "lettuce", slot: "shelf_low_1", id: "lettuce_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "strawberries" },
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "lettuce" },
    ],
  }),

  // ====== Phase 4: Expert (16-20) ======
  buildFridgeLevel({
    id: "fridge-br-16",
    phase: 16,
    title: "Aniversario em Casa",
    subtitle: "Bolo, refrigerante e convidados.",
    intro: "Geladeira de festa: tudo a mao.",
    goal: "Posicione para facilitar o acesso dos convidados.",
    difficulty: "Festa",
    reward: 220,
    fixedItems: [
      { key: "cake", slot: "shelf_top_2", id: "cake_fixed" },
      { key: "strawberries", slot: "drawer_left", id: "strawberries_fixed" },
      { key: "greenSoda", slot: "door_mid_1", id: "greenSoda_fixed" },
      { key: "juice", slot: "door_low_1", id: "juice_fixed" },
    ],
    trayItems: [
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "juice" },
      { key: "yogurt" },
      { key: "strawberries" },
      { key: "milk" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-17",
    phase: 17,
    title: "Madrugada Vazia",
    subtitle: "So o basico, mas bem arrumado.",
    intro: "Menos e mais: voltando ao essencial.",
    goal: "Poucos itens, mas cada um no lugar perfeito.",
    difficulty: "Zen",
    reward: 230,
    fixedItems: [
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "yogurt", slot: "shelf_top_2", id: "yogurt_fixed" },
      { key: "eggs", slot: "shelf_mid_1", id: "eggs_fixed" },
      { key: "juice", slot: "door_mid_1", id: "juice_fixed" },
      { key: "strawberries", slot: "drawer_left", id: "strawberries_fixed" },
    ],
    trayItems: [
      { key: "juice" },
      { key: "yogurt" },
      { key: "strawberries" },
      { key: "greenSoda" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-18",
    phase: 18,
    title: "Tudo ao Mesmo Tempo",
    subtitle: "A geladeira mais cheia do ano.",
    intro: "A geladeira esta cheia de verdade. Use tambem a parte de baixo.",
    goal: "Encaixe estrategico: cada escolha bloqueia outra.",
    difficulty: "Logica pura",
    reward: 250,
    fixedItems: [
      { key: "milk", slot: "shelf_top_1", id: "milk_fixed" },
      { key: "greenSoda", slot: "door_top_1", id: "greenSoda_fixed" },
      { key: "redSoda", slot: "door_mid_1", id: "redSoda_fixed" },
      { key: "strawberries", slot: "drawer_left", id: "strawberries_fixed" },
    ],
    trayItems: [
      { key: "eggs" },
      { key: "strawberries" },
      { key: "ketchup" },
      { key: "juice" },
      { key: "yogurt" },
      { key: "greenSoda" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-19",
    phase: 19,
    title: "V茅spera de Reveillon",
    subtitle: "Ultima organizacao do ano.",
    intro: "Ano novo, geladeira nova.",
    goal: "Deixe tudo impecavel para a virada.",
    difficulty: "Premium",
    reward: 280,
    fixedItems: [
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "greenSoda", slot: "door_mid_1", id: "greenSoda_fixed" },
      { key: "strawberries", slot: "drawer_left", id: "strawberries_fixed" },
      { key: "lettuce", slot: "shelf_low_1", id: "lettuce_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "strawberries" },
      { key: "ketchup" },
      { key: "juice" },
      { key: "yogurt" },
      { key: "greenSoda" },
      { key: "redSoda" },
    ],
  }),
  buildFridgeLevel({
    id: "fridge-br-20",
    phase: 20,
    title: "Geladeira Perfeita",
    subtitle: "A prova final. Tudo ou nada.",
    intro: "Todos os itens, todos os espacos, zero margem.",
    goal: "A geladeira mais desafiadora. So os melhores completam.",
    difficulty: "Master",
    reward: 300,
    fixedItems: [
      { key: "lettuce", slot: "shelf_top_1", id: "lettuce_fixed" },
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "mealbox", slot: "shelf_low_1", id: "mealbox_fixed" },
      { key: "greenSoda", slot: "door_mid_1", id: "greenSoda_fixed" },
      { key: "strawberries", slot: "drawer_left", id: "strawberries_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "eggs" },
      { key: "strawberries" },
      { key: "mustard" },
      { key: "juice" },
      { key: "cake" },
    ],
  }),
];

export const STORAGE_LEVEL = FRIDGE_BR_CAMPAIGN[0];

export const MAKEUP_LEVEL = {
  ...structuredClone(STORAGE_LEVEL),
  id: "makeup-core-1",
  assets: null,
  theme: {
    key: "makeup",
    title: "Caixa Zen",
    subtitle: "Organize a necessaire.",
    background: "#ffe3ee",
  },
  stage: {
    ...structuredClone(FRIDGE_STAGE),
    shapes: [
      { kind: "rect", x: 0, y: 0, w: 750, h: 1334, fillGradient: [0xfff2f7, 0xfff2f7, 0xffbdcf, 0xffbdcf, 1] },
      { kind: "roundedRect", x: 75, y: 310, w: 600, h: 700, r: 64, fill: 0xffffff, alpha: 0.95, line: { width: 10, color: 0xffffff, alpha: 0.9 } },
      { kind: "roundedRect", x: 120, y: 380, w: 520, h: 455, r: 42, fill: 0xffedf4, alpha: 1, line: { width: 8, color: 0xffffff, alpha: 0.9 } },
      { kind: "roundedRect", x: 55, y: 1085, w: 640, h: 150, r: 32, fill: 0xfff5f8, alpha: 0.96, line: { width: 8, color: 0xffffff, alpha: 0.9 } },
    ],
  },
  fronts: [
    { kind: "roundedRect", x: 120, y: 530, w: 520, h: 14, r: 8, fill: 0xf3abc4, alpha: 0.82, depth: 350, line: { width: 2, color: 0xffffff, alpha: 0.75 } },
    { kind: "roundedRect", x: 120, y: 695, w: 520, h: 14, r: 8, fill: 0xf3abc4, alpha: 0.82, depth: 370, line: { width: 2, color: 0xffffff, alpha: 0.75 } },
    { kind: "roundedRect", x: 120, y: 850, w: 520, h: 18, r: 8, fill: 0xf3abc4, alpha: 0.82, depth: 390, line: { width: 2, color: 0xffffff, alpha: 0.75 } },
  ],
  slots: [
    { id: "case_top_1", zone: "tray", allow: ["carton", "dairy", "bottle"], x: 215, y: 475, w: 130, h: 145, cols: 2, rows: 1, baseline: 0.92, depth: 110 },
    { id: "case_top_2", zone: "tray", allow: ["carton", "dairy", "bottle"], x: 405, y: 475, w: 130, h: 145, cols: 2, rows: 1, baseline: 0.92, depth: 111 },
    { id: "case_mid_1", zone: "tray", allow: ["food", "box", "bottle"], x: 215, y: 645, w: 150, h: 140, cols: 2, rows: 1, baseline: 0.92, depth: 130 },
    { id: "case_mid_2", zone: "tray", allow: ["food", "box", "bottle"], x: 425, y: 645, w: 150, h: 140, cols: 2, rows: 1, baseline: 0.92, depth: 131 },
    { id: "case_low_1", zone: "tray", allow: ["bottle", "dairy"], x: 215, y: 800, w: 150, h: 140, cols: 2, rows: 1, baseline: 0.92, depth: 150 },
    { id: "case_low_2", zone: "tray", allow: ["bottle", "dairy"], x: 425, y: 800, w: 150, h: 140, cols: 2, rows: 1, baseline: 0.92, depth: 151 },
  ],
};
