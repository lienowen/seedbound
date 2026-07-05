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

// ---- TOP-DOWN PACKING LEVELS -----------------------------------------------
// Generic packing mode: fit differently shaped items into a single grid inside
// a container illustration (picnic basket, suitcase, ...). The container art is
// drawn with `contain` so it keeps its aspect instead of stretching to the
// portrait stage. Rotatable long items force spatial planning.
const PACK_STAGE = {
  width: 750,
  height: 1334,
  shapes: [],
};

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
  eggs: { image: "eggs", file: "eggs.webp", name: "Ovos", tags: ["food", "box"], size: [2, 1], scale: scaleFromVisibleHeight("eggs", 104), anchor: [renderProfile("eggs").originX, renderProfile("eggs").originY], surface: renderProfile("eggs"), bounds: { w: 136, h: 88 }, nudge: { shelf: { x: -4 } }, prefs: { zone: "shelf", needsCold: false, likesNeighbors: ["milk", "strawberries"] } },
  strawberries: { image: "strawberries", file: "strawberries.webp", name: "Morangos", tags: ["food", "box"], size: [2, 1], scale: scaleFromVisibleHeight("strawberries", 106), anchor: [renderProfile("strawberries").originX, renderProfile("strawberries").originY], surface: renderProfile("strawberries"), bounds: { w: 136, h: 90 }, nudge: { shelf: { x: 4 }, chill: { x: 4 } }, prefs: { zone: "chill", needsCold: true, likesNeighbors: ["eggs", "yogurt"] } },
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
    scale: scaleFromVisibleHeight("lettuce", 112),
    anchor: [renderProfile("lettuce").originX, renderProfile("lettuce").originY],
    surface: renderProfile("lettuce"),
    bounds: { w: 128, h: 104 },
    renderNudge: {
      drawer: { x: -6, y: -2 },
    },
    prefs: { zone: "drawer", needsCold: true, hatesNeighbors: ["mealbox", "cake"] },
  },
  mealbox: { image: "mealbox", file: "mealbox.webp", name: "Marmita", tags: ["food", "box"], size: [2, 1], scale: scaleFromVisibleHeight("mealbox", 106), anchor: [renderProfile("mealbox").originX, renderProfile("mealbox").originY], surface: renderProfile("mealbox"), bounds: { w: 132, h: 98 }, nudge: { drawer: { x: -4 } }, prefs: { zone: "chill", needsCold: true, hatesNeighbors: ["lettuce", "cake"] } },
  cake: { image: "cake", file: "cake.webp", name: "Bolo", tags: ["food"], size: [2, 1], scale: scaleFromVisibleHeight("cake", 104), anchor: [renderProfile("cake").originX, renderProfile("cake").originY], surface: renderProfile("cake"), bounds: { w: 106, h: 86 }, nudge: { drawer: { x: 4 } }, prefs: { zone: "shelf", likesVisible: true, hatesNeighbors: ["mustard", "mealbox"] } },
  greenSoda: { image: "green-soda", file: "green-soda.webp", name: "Guarana", tags: ["bottle"], size: [1, 1], scale: ITEM_SCALE.sodaCan, anchor: [renderProfile("green-soda").originX, renderProfile("green-soda").originY], surface: renderProfile("green-soda"), bounds: { w: 48, h: 100 }, nudge: { door: { x: 10, y: -1 } }, prefs: { zone: "door", needsCold: false, likesNeighbors: ["red-soda", "juice"] } },
  redSoda: { image: "red-soda", file: "red-soda.webp", name: "Refri", tags: ["bottle"], size: [1, 1], scale: ITEM_SCALE.sodaCan, anchor: [renderProfile("red-soda").originX, renderProfile("red-soda").originY], surface: renderProfile("red-soda"), bounds: { w: 48, h: 100 }, nudge: { door: { x: 10, y: -1 } }, prefs: { zone: "door", needsCold: false, likesNeighbors: ["green-soda", "juice"] } },

  // ---- EXPANDED FOOD LIBRARY (art via scripts/processFoodArt.mjs) --------
  carrot: { image: "carrot", file: "carrot.webp", name: "Cenoura", tags: ["food"], size: [1, 1], scale: scaleFromVisibleHeight("carrot", 128), anchor: [renderProfile("carrot").originX, renderProfile("carrot").originY], surface: renderProfile("carrot"), bounds: { w: 96, h: 128 }, prefs: { zone: "drawer", needsCold: true, likesNeighbors: ["broccoli", "lettuce"] } },
  bread: { image: "bread", file: "bread.webp", name: "Pao", tags: ["food"], size: [2, 1], scale: scaleFromVisibleHeight("bread", 96), anchor: [renderProfile("bread").originX, renderProfile("bread").originY], surface: renderProfile("bread"), bounds: { w: 166, h: 96 }, prefs: { zone: "shelf", needsWarm: true, likesNeighbors: ["butter", "cheese"] } },
  cheese: { image: "cheese", file: "cheese.webp", name: "Queijo", tags: ["dairy"], size: [1, 1], scale: scaleFromVisibleHeight("cheese", 100), anchor: [renderProfile("cheese").originX, renderProfile("cheese").originY], surface: renderProfile("cheese"), bounds: { w: 100, h: 100 }, prefs: { zone: "shelf", needsCold: false, likesNeighbors: ["butter", "bread"] } },
  apple: { image: "apple", file: "apple.webp", name: "Maca", tags: ["food"], size: [1, 1], scale: scaleFromVisibleHeight("apple", 108), anchor: [renderProfile("apple").originX, renderProfile("apple").originY], surface: renderProfile("apple"), bounds: { w: 92, h: 108 }, prefs: { zone: "drawer", needsCold: false, likesNeighbors: ["tomato"] } },
  broccoli: { image: "broccoli", file: "broccoli.webp", name: "Brocolis", tags: ["food"], size: [1, 1], scale: scaleFromVisibleHeight("broccoli", 120), anchor: [renderProfile("broccoli").originX, renderProfile("broccoli").originY], surface: renderProfile("broccoli"), bounds: { w: 110, h: 120 }, prefs: { zone: "drawer", needsCold: true, likesNeighbors: ["carrot", "lettuce"] } },
  tomato: { image: "tomato", file: "tomato.webp", name: "Tomate", tags: ["food"], size: [1, 1], scale: scaleFromVisibleHeight("tomato", 104), anchor: [renderProfile("tomato").originX, renderProfile("tomato").originY], surface: renderProfile("tomato"), bounds: { w: 100, h: 104 }, prefs: { zone: "shelf", needsWarm: true, likesNeighbors: ["apple", "lettuce"] } },
  butter: { image: "butter", file: "butter.webp", name: "Manteiga", tags: ["dairy"], size: [2, 1], scale: scaleFromVisibleHeight("butter", 70), anchor: [renderProfile("butter").originX, renderProfile("butter").originY], surface: renderProfile("butter"), bounds: { w: 120, h: 70 }, prefs: { zone: "chill", needsCold: true, likesNeighbors: ["cheese", "bread"] } },
  watermelon: { image: "watermelon", file: "watermelon.webp", name: "Melancia", tags: ["food"], size: [2, 1], scale: scaleFromVisibleHeight("watermelon", 116), anchor: [renderProfile("watermelon").originX, renderProfile("watermelon").originY], surface: renderProfile("watermelon"), bounds: { w: 124, h: 116 }, prefs: { zone: "shelf", topShelf: true, likesVisible: true } },
  corn: { image: "corn", file: "corn.webp", name: "Milho", tags: ["food"], size: [2, 1], scale: scaleFromVisibleHeight("corn", 92), anchor: [renderProfile("corn").originX, renderProfile("corn").originY], surface: renderProfile("corn"), bounds: { w: 150, h: 92 }, prefs: { zone: "drawer", needsCold: false, likesNeighbors: ["carrot"] } },
  fish: { image: "fish", file: "fish.webp", name: "Peixe", tags: ["food"], size: [2, 1], scale: scaleFromVisibleHeight("fish", 78), anchor: [renderProfile("fish").originX, renderProfile("fish").originY], surface: renderProfile("fish"), bounds: { w: 200, h: 78 }, prefs: { zone: "chill", needsCold: true, hatesNeighbors: ["cake", "strawberries"] } },

  // ---- PANTRY DRY-GOODS (cupboard-only; never used in the fridge) ---------
  // Narrow [1,1] uprights (jars/cans/tubes) and wide [2,1] low boxes/packs.
  // Their prefs are shelf-friendly by default; pantryPrefs() strips temperature.
  jam: { image: "jam", file: "jam.webp", name: "Geleia", tags: ["jar"], size: [1, 1], scale: scaleFromVisibleHeight("jam", 116), anchor: [renderProfile("jam").originX, renderProfile("jam").originY], surface: renderProfile("jam"), bounds: { w: 96, h: 116 }, prefs: { zone: "shelf", likesNeighbors: ["honey", "peanut"] } },
  honey: { image: "honey", file: "honey.webp", name: "Mel", tags: ["jar"], size: [1, 1], scale: scaleFromVisibleHeight("honey", 116), anchor: [renderProfile("honey").originX, renderProfile("honey").originY], surface: renderProfile("honey"), bounds: { w: 100, h: 116 }, prefs: { zone: "shelf", likesNeighbors: ["jam", "peanut"] } },
  coffee: { image: "coffee", file: "coffee.webp", name: "Cafe", tags: ["can"], size: [1, 1], scale: scaleFromVisibleHeight("coffee", 122), anchor: [renderProfile("coffee").originX, renderProfile("coffee").originY], surface: renderProfile("coffee"), bounds: { w: 92, h: 122 }, prefs: { zone: "shelf", likesNeighbors: ["beans"] } },
  beans: { image: "beans", file: "beans.webp", name: "Enlatado", tags: ["can"], size: [1, 1], scale: scaleFromVisibleHeight("beans", 96), anchor: [renderProfile("beans").originX, renderProfile("beans").originY], surface: renderProfile("beans"), bounds: { w: 100, h: 96 }, prefs: { zone: "shelf", likesNeighbors: ["coffee"] } },
  peanut: { image: "peanut", file: "peanut.webp", name: "Pasta de Amendoim", tags: ["jar"], size: [1, 1], scale: scaleFromVisibleHeight("peanut", 108), anchor: [renderProfile("peanut").originX, renderProfile("peanut").originY], surface: renderProfile("peanut"), bounds: { w: 100, h: 108 }, prefs: { zone: "shelf", likesNeighbors: ["jam", "honey"] } },
  chips: { image: "chips", file: "chips.webp", name: "Batatas", tags: ["tube"], size: [1, 1], scale: scaleFromVisibleHeight("chips", 132), anchor: [renderProfile("chips").originX, renderProfile("chips").originY], surface: renderProfile("chips"), bounds: { w: 76, h: 132 }, prefs: { zone: "shelf", likesVisible: true } },
  crackers: { image: "crackers", file: "crackers.webp", name: "Bolachas", tags: ["box"], size: [2, 1], scale: scaleFromVisibleHeight("crackers", 96), anchor: [renderProfile("crackers").originX, renderProfile("crackers").originY], surface: renderProfile("crackers"), bounds: { w: 170, h: 96 }, prefs: { zone: "shelf" } },
  cookies: { image: "cookies", file: "cookies.webp", name: "Biscoitos", tags: ["box"], size: [2, 1], scale: scaleFromVisibleHeight("cookies", 96), anchor: [renderProfile("cookies").originX, renderProfile("cookies").originY], surface: renderProfile("cookies"), bounds: { w: 168, h: 96 }, prefs: { zone: "shelf", likesVisible: true } },
  pasta: { image: "pasta", file: "pasta.webp", name: "Macarrao", tags: ["box"], size: [2, 1], scale: scaleFromVisibleHeight("pasta", 90), anchor: [renderProfile("pasta").originX, renderProfile("pasta").originY], surface: renderProfile("pasta"), bounds: { w: 172, h: 90 }, prefs: { zone: "shelf" } },

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

  // ---- SUITCASE PACKING ITEMS (travel theme, wide grid) ----
  packClothes: { image: "pack-clothes", file: "pack-clothes.png", name: "Roupas", tags: ["pack"], size: [2, 2], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },
  packTowel: { image: "pack-towel", file: "pack-towel.png", name: "Toalha", tags: ["pack"], size: [3, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, rotatable: true, prefs: {} },
  packShoes: { image: "pack-shoes", file: "pack-shoes.png", name: "Tenis", tags: ["pack"], size: [2, 2], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },
  packToiletry: { image: "pack-toiletry", file: "pack-toiletry.png", name: "Necessaire", tags: ["pack"], size: [2, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, rotatable: true, prefs: {} },
  packCamera: { image: "pack-camera", file: "pack-camera.png", name: "Camera", tags: ["pack"], size: [1, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },
  packSunglasses: { image: "pack-sunglasses", file: "pack-sunglasses.png", name: "Oculos", tags: ["pack"], size: [1, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },

  // ---- BENTO PACKING ITEMS (lunch box theme, 5x3 grid) ----
  packRice: { image: "pack-rice", file: "pack-rice.png", name: "Arroz", tags: ["pack"], size: [2, 2], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },
  packEgg: { image: "pack-egg", file: "pack-egg.png", name: "Tamago", tags: ["pack"], size: [2, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, rotatable: true, prefs: {} },
  packSushi: { image: "pack-sushi", file: "pack-sushi.png", name: "Sushi", tags: ["pack"], size: [3, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, rotatable: true, prefs: {} },
  packBroccoli: { image: "pack-broccoli", file: "pack-broccoli.png", name: "Brocolis", tags: ["pack"], size: [1, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },
  packSausage: { image: "pack-sausage", file: "pack-sausage.png", name: "Salsicha", tags: ["pack"], size: [2, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, rotatable: true, prefs: {} },
  packTomato: { image: "pack-tomato", file: "pack-tomato.png", name: "Tomate", tags: ["pack"], size: [1, 1], scale: 0.12, anchor: [0.5, 0.5], bounds: { w: 128, h: 128 }, topDown: true, prefs: {} },
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

// Width-aware tray layout: each loose item reserves horizontal room based on
// its footprint (long items like baguettes are wide), items flow left-to-right
// and wrap into new centered rows so nothing ever overlaps in the tray. The
// tray cell (~62px) mirrors the scene's compact tray display scale.
function packTrayLayout(items, { y = 1070, rowGap = 128, maxWidth = 660, cellPx = 62, gap = 30, center = 375 } = {}) {
  const widths = items.map((it) => {
    const def = ITEM_LIBRARY[it.key] || {};
    const s = def.size || [1, 1];
    const longCells = Math.max(s[0] || 1, s[1] || 1);
    return Math.max(cellPx, longCells * cellPx);
  });
  // Greedy wrap into rows that stay within maxWidth.
  const rows = [];
  let cur = [];
  let curW = 0;
  items.forEach((_, i) => {
    const w = widths[i];
    const add = cur.length ? gap + w : w;
    if (cur.length && curW + add > maxWidth) {
      rows.push({ idx: cur, w: curW });
      cur = [];
      curW = 0;
    }
    curW += cur.length ? gap + w : w;
    cur.push(i);
  });
  if (cur.length) rows.push({ idx: cur, w: curW });
  // Center each row and space items by their reserved width.
  const positions = new Array(items.length);
  rows.forEach((row, r) => {
    let x = center - row.w / 2;
    row.idx.forEach((i) => {
      positions[i] = { x: Math.round(x + widths[i] / 2), y: y + r * rowGap };
      x += widths[i] + gap;
    });
  });
  return positions;
}

// Generic packing level factory. `container` is the back illustration, `grid`
// is the single packing slot, `items` is the tray set (footprints should total
// the grid cell count for a clean perfect-fit puzzle).
function buildPackingLevel(config) {
  const { id, theme, copy, container, grid, items, harmony, tray, phase, reward } = config;
  const trayPos = packTrayLayout(items, tray);
  return {
    id,
    revision: 1,
    phase: phase || 1,
    reward: reward || 120,
    topDown: true,
    winMode: "packing",
    // Marks a level as a packing puzzle so campaign systems (collection book,
    // hint/best-spot tools, goal copy) can branch without inspecting winMode.
    packing: true,
    harmony: harmony || { target: 300, gold: 420, perfect: 520 },
    copy,
    theme,
    assets: {
      back: { key: container.key, file: container.file, contain: true, size: container.size, y: container.y },
    },
    tuning: { magnetPreviewDistance: 150, snapDistance: 96, snapDuration: 240 },
    stage: structuredClone(PACK_STAGE),
    fronts: [],
    slots: [
      {
        id: "pack",
        zone: "pack",
        allow: ["pack"],
        x: grid.x,
        y: grid.y,
        w: grid.w,
        h: grid.h,
        cols: grid.cols,
        rows: grid.rows,
        stackLayers: 1,
        baseline: 0.5,
        depth: 120,
      },
    ],
    items: items.map((item, index) =>
      buildItem(item.key, {
        id: item.id || `${item.key}_${index + 1}`,
        trayX: trayPos[index].x,
        trayY: trayPos[index].y,
        ...item.overrides,
      })
    ),
  };
}

// ===========================================================================
// PANTRY ROSTER (surface-placement interludes)
// A cozy open cupboard that reuses the fridge's "set items on a shelf" feel in
// a fresh setting. Unlike the old grid-packing beats, there is no rotation or
// perfect-fit pressure — you simply tidy dry goods onto four wooden shelves.
// The cabinet art is drawn `contain` (square) in the upper stage so the loose
// tray still has room below. Slots are aligned to the art's shelf planks.
// ===========================================================================
const PANTRY_STAGE = { width: 750, height: 1334, shapes: [] };

// The cupboard art is square (1024²); it is drawn `contain` sized to the stage
// width and centered low so its shelves fill the play area (spans game-y
// ~192–984) with the loose tray sitting just below. Values were tuned against
// the art's actual shelf planks (measured via luminance profiling in-browser).
const PANTRY_ASSETS = {
  back: { key: "pantry-board", file: "pantry-board.png", contain: true, size: 720, y: 640 },
};

// One wide placement bay per shelf (cols:2 => two items side-by-side, exactly
// like the fridge shelves), across the art's four upper plank surfaces. This
// gives 8 capacity — matching the fullest roster — and, crucially, a generous
// per-item width so items never overflow their cell (the old 120px cols:2 boxes
// squeezed two items into 60px each, which caused the overflow). The top bay
// carries "top" in its id so `topShelf` preferences resolve there. Every zone
// is "shelf" so the natural-lean + shelf-seat-offset logic applies, and no item
// ever needs a cold zone (which the cupboard lacks) to settle.
// The engine seats an item's base at slot.y (like the fridge, whose shelf slots
// sit on the shelf line, e.g. y=425), then shelfSeatOffset lifts it a few px onto
// the plank's top surface. So slot.y is placed directly ON each plank's top
// surface — NOT offset by h/2. The cupboard art has three wooden planks plus the
// cabinet floor, giving four resting surfaces. Their top surfaces (game-y),
// measured from the art via in-browser luminance band detection at size 720 /
// centerY 640: plank1 449, plank2 608, plank3 759, floor 890.
const PANTRY_ALLOW = ["carton", "dairy", "box", "bottle", "food", "jar", "can", "tube"];
// tier is the shelf height index (0 = top … 3 = bottom) used by the weight-gravity
// rule: "heavy" goods must sit on tier >= 2, "light" goods on tier <= 1.
const PANTRY_SLOTS = [
  { id: "pantry_top", zone: "shelf", tier: 0, allow: PANTRY_ALLOW, x: 375, y: 449, w: 300, h: 120, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 110 },
  { id: "pantry_up", zone: "shelf", tier: 1, allow: PANTRY_ALLOW, x: 375, y: 608, w: 300, h: 120, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 130 },
  { id: "pantry_low", zone: "shelf", tier: 2, allow: PANTRY_ALLOW, x: 375, y: 759, w: 300, h: 120, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 150 },
  { id: "pantry_base", zone: "shelf", tier: 3, allow: PANTRY_ALLOW, x: 375, y: 890, w: 300, h: 120, cols: 2, rows: 1, stackLayers: 1, baseline: 0.5, depth: 170 },
];

// The cupboard has no cold zone, so any "needsCold" preference would be
// unsatisfiable and the level unwinnable. This strips temperature rules and
// forces the desired zone to "shelf", while keeping the light-strategy prefs
// (topShelf, hatesNeighbors, likesVisible, likesNeighbors) that DO resolve here.
function pantryPrefs(prefs = {}) {
  const { needsCold, needsWarm, zone, ...rest } = prefs;
  return { ...rest, zone: "shelf" };
}

function pantryCopy(overrides) {
  return {
    intro: "Arrume os mantimentos nas prateleiras.",
    goal: "Coloque tudo nas prateleiras.",
    difficulty: "Normal",
    successTag: "DESPENSA PERFEITA",
    successTitle: "Tudo arrumado!",
    successBody: "Despensa organizada e aconchegante.",
    nextLabel: "Proxima",
    retryLabel: "Repetir",
    ...overrides,
  };
}

// Pantry factory: same surface mechanic as the fridge (harmony/constraint win),
// but on the cupboard art with shelf-only, cold-free prefs so it always solves.
function buildPantryLevel({
  id,
  phase,
  title,
  subtitle,
  reward = 120,
  harmonyTarget = 240,
  harmonyGold = 320,
  harmonyPerfect = 400,
  copy,
  items = [],
  shelves = null,
}) {
  const loose = items.filter((it) => !it.fixed);
  const count = loose.length;
  const row1Count = Math.ceil(count / 2);
  let looseIndex = 0;
  // Apply the per-level shelf→category map (indexed by tier 0..3) onto the slots
  // so the category-sorting rule knows which shelf accepts which goods.
  const slots = structuredClone(PANTRY_SLOTS).map((slot) =>
    shelves && shelves[slot.tier] ? { ...slot, category: shelves[slot.tier] } : slot,
  );
  return {
    id,
    revision: 1,
    phase: phase || 1,
    reward,
    harmony: { target: harmonyTarget, gold: harmonyGold, perfect: harmonyPerfect },
    copy: pantryCopy(copy),
    theme: { key: "pantry", title, subtitle, background: "#f6e6cf" },
    assets: structuredClone(PANTRY_ASSETS),
    tuning: { magnetPreviewDistance: 132, snapDistance: 88, snapDuration: 280 },
    stage: structuredClone(PANTRY_STAGE),
    fronts: [],
    slots,
    items: items.map((item) => {
      if (item.fixed) {
        return buildItem(item.key, { fixed: true, slot: item.slot, id: item.id || item.key, prefs: pantryPrefs(item.prefs) });
      }
      const index = looseIndex++;
      const inFirstRow = index < row1Count;
      const rowCount = inFirstRow ? row1Count : count - row1Count;
      const rowStart = 375 - ((rowCount - 1) * 100) / 2;
      const col = inFirstRow ? index : index - row1Count;
      return buildItem(item.key, {
        id: item.id || `${item.key}_${index + 1}`,
        trayX: rowStart + col * 100,
        trayY: inFirstRow ? 1140 : 1200,
        prefs: pantryPrefs(item.prefs),
      });
    }),
  };
}

// --- PANTRY LEVELS (rising difficulty) --------------------------------------
// Nine cupboard interludes that replace the old grid-packing beats. Each has a
// distinct roster so the surface-tidy beats stay fresh across the campaign.
// Difficulty grows by item count and by how many light prefs are in play
// (topShelf / likesNeighbors / hatesNeighbors) — never by fit pressure. Max 8
// pockets means a roster never exceeds 8 loose items.
//
// PANTRY PUZZLE MODEL — three deductive mechanics, layered in across the arc so
// the cupboard is a real sorting puzzle instead of "drop anything anywhere":
//   1. CATEGORY  — each shelf is labelled (jars/cans/snacks/grains) via `shelves`
//      (indexed by tier 0=top..3=bottom); an item with prefs.category must land
//      on the matching shelf.
//   2. WEIGHT    — prefs.weight "heavy" must ride a lower shelf (tier >= 2),
//      "light" an upper shelf (tier <= 1).
//   3. NEIGHBORS — prefs.mustNeighbors is a HARD "keep us together" rule (friends
//      can only be adjacent within the same shelf); hatesNeighbors keeps a pair
//      apart. (likesNeighbors stays a soft harmony bonus.)
// Dry-goods roster: jars/cans/tubes are narrow [1,1], boxes/packs are wide [2,1]
// (a wide fills a whole 2-column shelf). Every blueprint below has a verified
// solution; difficulty grows by how many mechanics stack at once.
const PANTRY_BLUEPRINTS = [
  // L1 — CATEGORY only, 2 categories. Learn "each shelf has a home".
  {
    tier: "Easy",
    goal: "Sort each item onto its labelled shelf.",
    reward: 110,
    harmony: 200,
    shelves: ["jars", "cans", null, null],
    items: [
      { key: "jam", prefs: { category: "jars", likesNeighbors: ["honey"] } },
      { key: "honey", prefs: { category: "jars", likesNeighbors: ["jam"] } },
      { key: "coffee", prefs: { category: "cans", likesNeighbors: ["beans"] } },
      { key: "beans", prefs: { category: "cans", likesNeighbors: ["coffee"] } },
    ],
  },
  // L2 — CATEGORY, 3 categories.
  {
    tier: "Easy",
    goal: "Match every jar, can and snack to its shelf.",
    reward: 115,
    harmony: 210,
    shelves: ["jars", "cans", "snacks", null],
    items: [
      { key: "jam", prefs: { category: "jars", likesNeighbors: ["honey"] } },
      { key: "honey", prefs: { category: "jars", likesNeighbors: ["jam"] } },
      { key: "coffee", prefs: { category: "cans", likesNeighbors: ["beans"] } },
      { key: "beans", prefs: { category: "cans", likesNeighbors: ["coffee"] } },
      { key: "chips", prefs: { category: "snacks" } },
    ],
  },
  // L3 — CATEGORY, all 4 shelves labelled, wide items included.
  {
    tier: "Easy",
    goal: "Fill all four labelled shelves.",
    reward: 120,
    harmony: 220,
    shelves: ["snacks", "jars", "cans", "grains"],
    items: [
      { key: "cookies", prefs: { category: "snacks" } },
      { key: "jam", prefs: { category: "jars", likesNeighbors: ["honey"] } },
      { key: "honey", prefs: { category: "jars", likesNeighbors: ["jam"] } },
      { key: "coffee", prefs: { category: "cans", likesNeighbors: ["beans"] } },
      { key: "beans", prefs: { category: "cans", likesNeighbors: ["coffee"] } },
      { key: "pasta", prefs: { category: "grains" } },
    ],
  },
  // L4 — WEIGHT gravity only. Heavy sinks, light rises.
  {
    tier: "Normal",
    goal: "Heavy goods down low, light goods up high.",
    reward: 130,
    harmony: 240,
    items: [
      { key: "crackers", prefs: { weight: "heavy" } },
      { key: "pasta", prefs: { weight: "heavy" } },
      { key: "chips", prefs: { weight: "light" } },
      { key: "jam", prefs: { weight: "light", likesNeighbors: ["honey"] } },
      { key: "honey", prefs: { weight: "light", likesNeighbors: ["jam"] } },
    ],
  },
  // L5 — WEIGHT plus a keep-apart pair.
  {
    tier: "Normal",
    goal: "Balance the weight and keep chips off the jam.",
    reward: 140,
    harmony: 255,
    items: [
      { key: "crackers", prefs: { weight: "heavy" } },
      { key: "pasta", prefs: { weight: "heavy" } },
      { key: "chips", prefs: { weight: "light", hatesNeighbors: ["jam"] } },
      { key: "honey", prefs: { weight: "light" } },
      { key: "jam", prefs: { weight: "light", hatesNeighbors: ["chips"] } },
      { key: "peanut", prefs: { weight: "light" } },
    ],
  },
  // L6 — WEIGHT + CATEGORY aligned (light jars up, heavy cans down).
  {
    tier: "Normal",
    goal: "Jars up top, cans down low.",
    reward: 150,
    harmony: 270,
    shelves: ["jars", "jars", "cans", "cans"],
    items: [
      { key: "jam", prefs: { category: "jars", weight: "light", likesNeighbors: ["honey"] } },
      { key: "honey", prefs: { category: "jars", weight: "light", likesNeighbors: ["jam"] } },
      { key: "peanut", prefs: { category: "jars", weight: "light" } },
      { key: "coffee", prefs: { category: "cans", weight: "heavy", likesNeighbors: ["beans"] } },
      { key: "beans", prefs: { category: "cans", weight: "heavy", likesNeighbors: ["coffee"] } },
    ],
  },
  // L7 — CATEGORY + strict NEIGHBORS (pairs must share a shelf).
  {
    tier: "Hard",
    goal: "Keep each pair together on its shelf.",
    reward: 160,
    harmony: 290,
    shelves: ["jars", "cans", "snacks", null],
    items: [
      { key: "jam", prefs: { category: "jars", mustNeighbors: ["honey"] } },
      { key: "honey", prefs: { category: "jars", mustNeighbors: ["jam"] } },
      { key: "coffee", prefs: { category: "cans", mustNeighbors: ["beans"] } },
      { key: "beans", prefs: { category: "cans", mustNeighbors: ["coffee"] } },
      { key: "chips", prefs: { category: "snacks" } },
    ],
  },
  // L8 — WEIGHT + strict NEIGHBORS (two must-pairs, two heavy wides).
  {
    tier: "Hard",
    goal: "Pair up the light goods, sink the heavy packs.",
    reward: 170,
    harmony: 305,
    items: [
      { key: "crackers", prefs: { weight: "heavy" } },
      { key: "pasta", prefs: { weight: "heavy" } },
      { key: "jam", prefs: { weight: "light", mustNeighbors: ["honey"] } },
      { key: "honey", prefs: { weight: "light", mustNeighbors: ["jam"] } },
      { key: "chips", prefs: { weight: "light", mustNeighbors: ["peanut"] } },
      { key: "peanut", prefs: { weight: "light", mustNeighbors: ["chips"] } },
    ],
  },
  // L9 — ALL THREE at once. Category + weight + strict neighbors.
  {
    tier: "Hard",
    goal: "Sort, balance and pair the whole pantry.",
    reward: 180,
    harmony: 320,
    shelves: ["jars", "cans", "snacks", "grains"],
    items: [
      { key: "jam", prefs: { category: "jars", weight: "light", mustNeighbors: ["honey"] } },
      { key: "honey", prefs: { category: "jars", weight: "light", mustNeighbors: ["jam"] } },
      { key: "coffee", prefs: { category: "cans", mustNeighbors: ["beans"] } },
      { key: "beans", prefs: { category: "cans", mustNeighbors: ["coffee"] } },
      { key: "crackers", prefs: { category: "snacks", weight: "heavy" } },
      { key: "pasta", prefs: { category: "grains", weight: "heavy" } },
    ],
  },
];

const PANTRY_LEVELS = PANTRY_BLUEPRINTS.map((bp, i) =>
  buildPantryLevel({
    id: `pantry-${i + 1}`,
    reward: bp.reward,
    harmonyTarget: bp.harmony,
    harmonyGold: Math.round(bp.harmony * 1.3),
    harmonyPerfect: Math.round(bp.harmony * 1.65),
    copy: pantryCopy({ difficulty: bp.tier, goal: bp.goal }),
    items: bp.items,
    shelves: bp.shelves,
  })
);

// ===========================================================================
// PACKING ROSTER
// Three container themes, each with an easy/medium/hard perfect-fill puzzle.
// Difficulty rises via piece count and how many items must be rotated to
// interlock. Every tiling below is a verified perfect fit (see
// scripts/verify-packing.mjs) so no level can be unwinnable.
// ===========================================================================

// Shared per-container geometry (the grid matches each art's visible interior).
const PICNIC_BASE = {
  container: { key: "picnic-basket", file: "picnic-basket.png", size: 720, y: 628 },
  // Grid tuned to sit INSIDE the basket's cream interior (the art is drawn in
  // perspective, so the playable square is smaller and higher than the art center).
  grid: { x: 375, y: 601, w: 326, h: 306, cols: 4, rows: 4 },
  theme: { key: "picnic", title: "Picnic Packing", subtitle: "Tap to rotate · drag to pack", background: "#eaf4d8" },
  tray: { y: 1064, spanX: [150, 600] },
};
const SUITCASE_BASE = {
  container: { key: "suitcase-open", file: "suitcase-open.png", size: 760, y: 470 },
  // Grid tuned to the open suitcase's cream tray interior.
  grid: { x: 375, y: 494, w: 414, h: 250, cols: 6, rows: 3 },
  theme: { key: "suitcase", title: "Suitcase Packing", subtitle: "Tap to rotate · drag to pack", background: "#dfeaf2" },
  tray: { y: 900, rowGap: 122, spanX: [150, 600] },
};
const BENTO_BASE = {
  container: { key: "bento-box", file: "bento-box.png", size: 740, y: 500 },
  // Grid tuned to the bento box's cream interior.
  grid: { x: 380, y: 503, w: 412, h: 222, cols: 5, rows: 3 },
  theme: { key: "bento", title: "Bento Packing", subtitle: "Tap to rotate · drag to pack", background: "#f6ead3" },
  tray: { y: 1000, rowGap: 120, spanX: [150, 600] },
};

function packCopy(overrides) {
  return {
    intro: "Tap an item to rotate it, then drag it in.",
    goal: "Fit everything inside.",
    difficulty: "Normal",
    successTag: "PERFECT FIT",
    successTitle: "All packed!",
    successBody: "Everything fits — nice and tidy.",
    nextLabel: "Next",
    retryLabel: "Retry",
    ...overrides,
  };
}

// --- BENTO (5x3 = 15 cells) --------------------------------------------------
// Easy: rice 2x2(4) + 2x sushi 3x1(3) + egg 2x1(2) + sausage 2x1(2)
// + tomato 1x1(1) = 15. Zero rotation needed.
export const BENTO_LEVEL_EASY = buildPackingLevel({
  ...BENTO_BASE,
  id: "bento-pack-1",
  reward: 100,
  copy: packCopy({ difficulty: "Easy", goal: "Fill the bento box with lunch.", successTag: "BENTO PERFEITO" }),
  items: [
    { key: "packRice" },
    { key: "packSushi", id: "packSushi_a" },
    { key: "packSushi", id: "packSushi_b" },
    { key: "packEgg" },
    { key: "packSausage" },
    { key: "packTomato" },
  ],
});

// Medium: rice 2x2(4) + 2x egg 2x1(2) + sausage 2x1(2) + sushi 3x1(3)
// + broccoli 1x1(1) + tomato 1x1(1) = 15. More small pieces to juggle.
export const BENTO_LEVEL_MED = buildPackingLevel({
  ...BENTO_BASE,
  id: "bento-pack-2",
  reward: 120,
  copy: packCopy({ difficulty: "Normal", goal: "Fill the bento box with lunch.", successTag: "BENTO PERFEITO" }),
  items: [
    { key: "packRice" },
    { key: "packEgg", id: "packEgg_a" },
    { key: "packEgg", id: "packEgg_b" },
    { key: "packSausage" },
    { key: "packSushi" },
    { key: "packBroccoli" },
    { key: "packTomato" },
  ],
});

// Hard: 2x sushi 3x1(3) + rice 2x2(4) + egg 2x1(2) + sausage 2x1(2)
// + tomato 1x1(1) = 15. Sushi must rotate vertical to interlock.
export const BENTO_LEVEL_HARD = buildPackingLevel({
  ...BENTO_BASE,
  id: "bento-pack-3",
  reward: 150,
  copy: packCopy({ difficulty: "Hard", goal: "Squeeze everything into the bento box.", successTag: "BENTO PERFEITO" }),
  items: [
    { key: "packSushi", id: "packSushi_a" },
    { key: "packSushi", id: "packSushi_b" },
    { key: "packRice" },
    { key: "packEgg" },
    { key: "packSausage" },
    { key: "packTomato" },
  ],
});

// --- PICNIC (4x4 = 16 cells) -------------------------------------------------
// Easy: 2x watermelon 2x2(4) + 2x bottle 2x1(2) + 2x cheese 2x1(2) = 16.
// Zero rotation needed.
export const PICNIC_LEVEL_EASY = buildPackingLevel({
  ...PICNIC_BASE,
  id: "picnic-pack-1",
  reward: 110,
  copy: packCopy({ difficulty: "Easy", goal: "Fit every treat inside the picnic basket.", successTag: "CESTA PERFEITA", successBody: "Everything fits — ready for the picnic." }),
  items: [
    { key: "packWatermelon", id: "packWatermelon_a" },
    { key: "packWatermelon", id: "packWatermelon_b" },
    { key: "packBottle", id: "packBottle_a" },
    { key: "packBottle", id: "packBottle_b" },
    { key: "packCheese", id: "packCheese_a" },
    { key: "packCheese", id: "packCheese_b" },
  ],
});

// Medium: watermelon 2x2(4) + 2x baguette 3x1(3) + bottle 2x1(2)
// + cheese 2x1(2) + sandwich 1x1(1) + jam 1x1(1) = 16. Baguettes rotate.
export const PICNIC_LEVEL = buildPackingLevel({
  ...PICNIC_BASE,
  id: "picnic-pack-2",
  reward: 130,
  copy: packCopy({ difficulty: "Normal", goal: "Fit every treat inside the picnic basket.", successTag: "CESTA PERFEITA", successBody: "Everything fits — ready for the picnic." }),
  items: [
    { key: "packWatermelon" },
    { key: "packBaguette", id: "packBaguette_a" },
    { key: "packBaguette", id: "packBaguette_b" },
    { key: "packBottle" },
    { key: "packCheese" },
    { key: "packSandwich" },
    { key: "packJam" },
  ],
});

// Hard: 2x baguette 3x1(3) + watermelon 2x2(4) + bottle 2x1(2)
// + cheese 2x1(2) + sandwich 1x1(1) + jam 1x1(1) = 16. Bottle & cheese rotate.
export const PICNIC_LEVEL_HARD = buildPackingLevel({
  ...PICNIC_BASE,
  id: "picnic-pack-3",
  reward: 160,
  copy: packCopy({ difficulty: "Hard", goal: "Squeeze every treat into the basket.", successTag: "CESTA PERFEITA", successBody: "Everything fits — ready for the picnic." }),
  items: [
    { key: "packBaguette", id: "packBaguette_a" },
    { key: "packBaguette", id: "packBaguette_b" },
    { key: "packWatermelon" },
    { key: "packBottle" },
    { key: "packCheese" },
    { key: "packSandwich" },
    { key: "packJam" },
  ],
});

// --- SUITCASE (6x3 = 18 cells) -----------------------------------------------
// Easy: 2x clothes 2x2(4) + shoes 2x2(4) + 2x towel 3x1(3) = 18.
// Zero rotation needed.
export const SUITCASE_LEVEL_EASY = buildPackingLevel({
  ...SUITCASE_BASE,
  id: "suitcase-pack-1",
  reward: 120,
  copy: packCopy({ difficulty: "Easy", goal: "Fit everything into the suitcase.", successTag: "MALA PERFEITA", successBody: "Everything fits — ready for the trip." }),
  items: [
    { key: "packClothes", id: "packClothes_a" },
    { key: "packClothes", id: "packClothes_b" },
    { key: "packShoes" },
    { key: "packTowel", id: "packTowel_a" },
    { key: "packTowel", id: "packTowel_b" },
  ],
});

// Medium: clothes 2x2(4) + shoes 2x2(4) + 2x towel 3x1(3) + toiletry 2x1(2)
// + camera 1x1(1) + sunglasses 1x1(1) = 18. Towels rotate.
export const SUITCASE_LEVEL = buildPackingLevel({
  ...SUITCASE_BASE,
  id: "suitcase-pack-2",
  reward: 150,
  copy: packCopy({ difficulty: "Normal", goal: "Fit everything into the suitcase.", successTag: "MALA PERFEITA", successBody: "Everything fits — ready for the trip." }),
  items: [
    { key: "packClothes" },
    { key: "packShoes" },
    { key: "packTowel", id: "packTowel_a" },
    { key: "packTowel", id: "packTowel_b" },
    { key: "packToiletry" },
    { key: "packCamera" },
    { key: "packSunglasses" },
  ],
});

// Hard: 2x towel 3x1(3) + clothes 2x2(4) + shoes 2x2(4) + 2x toiletry 2x1(2)
// = 18. Towels must rotate vertical to interlock along the ends.
export const SUITCASE_LEVEL_HARD = buildPackingLevel({
  ...SUITCASE_BASE,
  id: "suitcase-pack-3",
  reward: 180,
  copy: packCopy({ difficulty: "Hard", goal: "Squeeze everything into the suitcase.", successTag: "MALA PERFEITA", successBody: "Everything fits — ready for the trip." }),
  items: [
    { key: "packTowel", id: "packTowel_a" },
    { key: "packTowel", id: "packTowel_b" },
    { key: "packClothes" },
    { key: "packShoes" },
    { key: "packToiletry", id: "packToiletry_a" },
    { key: "packToiletry", id: "packToiletry_b" },
  ],
});

const FRIDGE_LEVELS = [
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
      { key: "butter", slot: "shelf_low_1", id: "butter_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "bread" },
      { key: "cheese" },
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
      { key: "carrot" },
      { key: "broccoli" },
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "milk" },
      { key: "tomato" },
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
      { key: "fish", slot: "shelf_low_1", id: "fish_fixed" },
    ],
    trayItems: [
      { key: "watermelon" },
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
      { key: "corn", slot: "shelf_mid_1", id: "corn_fixed" },
      { key: "eggs", slot: "shelf_low_1", id: "eggs_fixed" },
      { key: "carrot", slot: "drawer_left", id: "carrot_fixed" },
    ],
    trayItems: [
      { key: "greenSoda" },
      { key: "milk" },
      { key: "juice" },
      { key: "cheese" },
      { key: "ketchup" },
      { key: "redSoda" },
      { key: "watermelon" },
      { key: "apple" },
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
      { key: "broccoli", slot: "shelf_top_1", id: "broccoli_fixed" },
      { key: "yogurt", slot: "shelf_top_2", id: "yogurt_fixed" },
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "carrot", slot: "drawer_left", id: "carrot_fixed" },
      { key: "watermelon", slot: "shelf_low_1", id: "watermelon_fixed" },
      { key: "ketchup", slot: "door_mid_1", id: "ketchup_fixed" },
      { key: "juice", slot: "door_low_1", id: "juice_fixed" },
      { key: "tomato", slot: "drawer_right", id: "tomato_fixed" },
    ],
    trayItems: [
      { key: "mealbox" },
      { key: "greenSoda" },
      { key: "mustard" },
      { key: "redSoda" },
      { key: "milk" },
      { key: "eggs" },
      { key: "cheese" },
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
      { key: "apple", slot: "shelf_top_2", id: "apple_fixed" },
      { key: "eggs", slot: "shelf_mid_2", id: "eggs_fixed" },
      { key: "fish", slot: "drawer_left", id: "fish_fixed" },
      { key: "milk", slot: "door_low_1", id: "milk_fixed" },
      { key: "broccoli", slot: "shelf_low_2", id: "broccoli_fixed" },
      { key: "greenSoda", slot: "door_mid_1", id: "greenSoda_fixed" },
    ],
    trayItems: [
      { key: "cheese" },
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
      { key: "bread", slot: "shelf_top_1", id: "bread_fixed" },
      { key: "eggs", slot: "shelf_low_1", id: "eggs_fixed" },
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "carrot", slot: "drawer_right", id: "carrot_fixed" },
      { key: "greenSoda", slot: "door_mid_1", id: "greenSoda_fixed" },
    ],
    trayItems: [
      { key: "watermelon" },
      { key: "ketchup" },
      { key: "mustard" },
      { key: "redSoda" },
      { key: "cheese" },
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
      { key: "tomato", slot: "shelf_top_2", id: "tomato_fixed" },
      { key: "fish", slot: "drawer_left", id: "fish_fixed" },
      { key: "eggs", slot: "shelf_mid_1", id: "eggs_fixed" },
      { key: "ketchup", slot: "door_mid_1", id: "ketchup_fixed" },
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "broccoli", slot: "shelf_low_2", id: "broccoli_fixed" },
      { key: "juice", slot: "door_low_1", id: "juice_fixed" },
    ],
    trayItems: [
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "cheese" },
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
      { key: "corn", slot: "shelf_top_2", id: "corn_fixed" },
      { key: "carrot", slot: "drawer_right", id: "carrot_fixed" },
      { key: "ketchup", slot: "door_mid_1", id: "ketchup_fixed" },
      { key: "juice", slot: "door_low_1", id: "juice_fixed" },
    ],
    trayItems: [
      { key: "apple" },
      { key: "cheese" },
      { key: "redSoda" },
      { key: "mealbox" },
      { key: "watermelon" },
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
      { key: "broccoli", slot: "drawer_right", id: "broccoli_fixed" },
      { key: "greenSoda", slot: "door_low_1", id: "gsoda_fixed" },
    ],
    trayItems: [
      { key: "watermelon" },
      { key: "redSoda" },
      { key: "carrot" },
      { key: "ketchup" },
      { key: "cheese" },
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
      { key: "broccoli", slot: "drawer_left", id: "broccoli_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "cheese" },
      { key: "eggs" },
      { key: "carrot" },
      { key: "tomato" },
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
      { key: "fish", slot: "shelf_mid_2", id: "fish_fixed" },
      { key: "ketchup", slot: "door_mid_1", id: "ketchup_fixed" },
      { key: "greenSoda", slot: "door_low_1", id: "greenSoda_fixed" },
    ],
    trayItems: [
      { key: "mustard" },
      { key: "ketchup" },
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "juice" },
      { key: "corn" },
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
      { key: "carrot", slot: "drawer_left", id: "carrot_fixed" },
      { key: "fish", slot: "shelf_low_1", id: "fish_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "apple" },
      { key: "juice" },
      { key: "cheese" },
      { key: "greenSoda" },
      { key: "broccoli" },
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
      { key: "fish", slot: "drawer_left", id: "fish_fixed" },
      { key: "watermelon", slot: "shelf_low_1", id: "watermelon_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "cheese" },
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "broccoli" },
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
      { key: "watermelon", slot: "drawer_left", id: "watermelon_fixed" },
      { key: "greenSoda", slot: "door_mid_1", id: "greenSoda_fixed" },
      { key: "juice", slot: "door_low_1", id: "juice_fixed" },
    ],
    trayItems: [
      { key: "greenSoda" },
      { key: "redSoda" },
      { key: "juice" },
      { key: "cheese" },
      { key: "apple" },
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
      { key: "cheese", slot: "shelf_top_2", id: "cheese_fixed" },
      { key: "eggs", slot: "shelf_mid_1", id: "eggs_fixed" },
      { key: "juice", slot: "door_mid_1", id: "juice_fixed" },
      { key: "apple", slot: "drawer_left", id: "apple_fixed" },
    ],
    trayItems: [
      { key: "juice" },
      { key: "yogurt" },
      { key: "tomato" },
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
      { key: "carrot", slot: "drawer_left", id: "carrot_fixed" },
    ],
    trayItems: [
      { key: "eggs" },
      { key: "broccoli" },
      { key: "ketchup" },
      { key: "juice" },
      { key: "cheese" },
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
      { key: "broccoli", slot: "drawer_left", id: "broccoli_fixed" },
      { key: "fish", slot: "shelf_low_1", id: "fish_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "watermelon" },
      { key: "ketchup" },
      { key: "juice" },
      { key: "cheese" },
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
      { key: "broccoli", slot: "shelf_top_1", id: "broccoli_fixed" },
      { key: "milk", slot: "door_top_1", id: "milk_fixed" },
      { key: "fish", slot: "shelf_low_1", id: "fish_fixed" },
      { key: "greenSoda", slot: "door_mid_1", id: "greenSoda_fixed" },
      { key: "carrot", slot: "drawer_left", id: "carrot_fixed" },
    ],
    trayItems: [
      { key: "milk" },
      { key: "eggs" },
      { key: "watermelon" },
      { key: "mustard" },
      { key: "juice" },
      { key: "cake" },
    ],
  }),
];

// Interleave pantry (surface-tidy) levels into the single fridge campaign so
// both settings share one linear progression (coins, unlocks, streaks,
// collection). Pantry beats appear after specific fridge levels to vary the
// pacing. Insertion is keyed by the fridge level id it should follow, so
// re-ordering fridge levels keeps the interludes anchored to the right place.
// Difficulty rises with campaign depth (the pantry blueprints are ordered
// easy -> hard) so the cupboard beats always feel fresh and relaxing rather
// than the old grid-packing pressure.
const PANTRY_INSERTS = {
  "fridge-br-2": [PANTRY_LEVELS[0]],
  "fridge-br-4": [PANTRY_LEVELS[1]],
  "fridge-br-6": [PANTRY_LEVELS[2]],
  "fridge-br-8": [PANTRY_LEVELS[3]],
  "fridge-br-10": [PANTRY_LEVELS[4]],
  "fridge-br-12": [PANTRY_LEVELS[5]],
  "fridge-br-14": [PANTRY_LEVELS[6]],
  "fridge-br-16": [PANTRY_LEVELS[7]],
  "fridge-br-18": [PANTRY_LEVELS[8]],
};

function assembleCampaign() {
  const out = [];
  for (const fridge of FRIDGE_LEVELS) {
    out.push(fridge);
    const inserts = PANTRY_INSERTS[fridge.id];
    if (inserts) out.push(...inserts);
  }
  // Renumber phase sequentially so the HUD "Level N" label and the level-select
  // dots stay continuous regardless of authored phase values.
  return out.map((level, index) => ({ ...level, phase: index + 1 }));
}

export const FRIDGE_BR_CAMPAIGN = assembleCampaign();

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
