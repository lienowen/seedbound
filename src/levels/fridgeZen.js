export const ASSET = "/assets/tidy/";

export const ZONES = [
  { id: "shelf_top", label: "Prateleira alta", type: "shelf", x: 34, y: 28.6, w: 30, h: 10.5, cols: 4, rows: 1, depth: 2, scale: 0.98, itemOffsetY: 1.1 },
  { id: "shelf_mid", label: "Prateleira media", type: "shelf", x: 33, y: 42.4, w: 32, h: 10.8, cols: 4, rows: 1, depth: 3, scale: 1, itemOffsetY: 0.5 },
  { id: "shelf_low", label: "Prateleira baixa", type: "shelf", x: 32, y: 56.4, w: 34, h: 10.8, cols: 4, rows: 1, depth: 4, scale: 1.03, itemOffsetY: 0.4 },
  { id: "drawer", label: "Gaveta fresca", type: "drawer", x: 35, y: 61.6, w: 29, h: 10.4, cols: 3, rows: 1, depth: 5, scale: 0.9 },
  { id: "door_top", label: "Porta alta", type: "door", x: 62.2, y: 32.5, w: 14.2, h: 9.2, cols: 2, rows: 1, depth: 6, scale: 1.02, tilt: -2, itemOffsetY: 0.8 },
  { id: "door_mid", label: "Porta media", type: "door", x: 62.2, y: 48.3, w: 14.4, h: 9.2, cols: 2, rows: 1, depth: 7, scale: 1.05, tilt: -2, itemOffsetY: 0.8 },
  { id: "door_low", label: "Porta baixa", type: "door", x: 61.8, y: 64.4, w: 14.6, h: 9.5, cols: 2, rows: 1, depth: 8, scale: 1.05, tilt: -2, itemOffsetY: 0.7 },
];

export const FRONT_CUTS = [
  { id: "drawer_front", x: 34.5, y: 66.8, w: 31.5, h: 7.2, z: 42 },
  { id: "door_top_front", x: 61.3, y: 39.5, w: 17, h: 5.2, z: 43 },
  { id: "door_mid_front", x: 61.1, y: 55.4, w: 17.2, h: 5.2, z: 44 },
  { id: "door_low_front", x: 60.7, y: 71.2, w: 17.4, h: 5.4, z: 45 },
];

export const CLEAN_STAGE = {
  zones: [
    { id: "shelf_top", label: "Prateleira alta", type: "shelf", x: 13, y: 20, w: 51, h: 12.4, cols: 4, rows: 1, depth: 2, scale: 0.82, baseline: 0.93, itemOffsetY: 0 },
    { id: "shelf_mid", label: "Prateleira media", type: "shelf", x: 13, y: 36, w: 51, h: 12.4, cols: 4, rows: 1, depth: 3, scale: 0.95, baseline: 0.93, itemOffsetY: 0 },
    { id: "shelf_low", label: "Prateleira baixa", type: "shelf", x: 13, y: 52, w: 51, h: 12.4, cols: 4, rows: 1, depth: 4, scale: 0.96, baseline: 0.93, itemOffsetY: 0 },
    { id: "drawer", label: "Gaveta fresca", type: "drawer", x: 15, y: 68.4, w: 47, h: 11.6, cols: 3, rows: 1, depth: 5, scale: 0.92, baseline: 0.84, itemOffsetY: 0.2 },
    { id: "door_top", label: "Porta alta", type: "door", x: 71, y: 25, w: 17, h: 10.8, cols: 2, rows: 1, depth: 6, scale: 1.04, baseline: 0.84, itemOffsetY: 0.2 },
    { id: "door_mid", label: "Porta media", type: "door", x: 71, y: 44.5, w: 17, h: 10.8, cols: 2, rows: 1, depth: 7, scale: 1.04, baseline: 0.84, itemOffsetY: 0.2 },
    { id: "door_low", label: "Porta baixa", type: "door", x: 71, y: 64, w: 17, h: 10.8, cols: 2, rows: 1, depth: 8, scale: 1.04, baseline: 0.84, itemOffsetY: 0.2 },
  ],
  frontCuts: [],
};

export const ITEMS = [
  { id: "milk", name: "Leite", image: "milk.png", size: [1, 1], visual: [1.3, 1.62], anchor: [0.5, 0.99], zones: ["shelf"], sound: "carton" },
  { id: "eggs", name: "Ovos", image: "eggs.png", size: [2, 1], visual: [1.92, 1.02], anchor: [0.5, 0.96], zones: ["shelf"], sound: "soft" },
  { id: "strawberries", name: "Morangos", image: "strawberries.png", size: [2, 1], visual: [1.92, 1.04], anchor: [0.5, 0.97], zones: ["shelf", "drawer"], sound: "soft" },
  { id: "yogurt", name: "Iogurte", image: "yogurt.png", size: [1, 1], visual: [0.92, 1.05], anchor: [0.5, 0.98], zones: ["shelf", "door"], sound: "soft" },
  { id: "red-soda", name: "Refri", image: "red-soda.png", size: [1, 1], visual: [0.95, 1.75], zones: ["door", "shelf"], sound: "can" },
  { id: "green-soda", name: "Guarana", image: "green-soda.png", size: [1, 1], visual: [0.95, 1.75], zones: ["door", "shelf"], sound: "can" },
  { id: "lettuce", name: "Alface", image: "lettuce.png", size: [1, 1], visual: [1.45, 1.35], zones: ["drawer"], sound: "soft" },
  { id: "cake", name: "Bolo", image: "cake.png", size: [2, 1], visual: [1.86, 1], anchor: [0.5, 0.96], zones: ["shelf"], sound: "soft" },
  { id: "mustard", name: "Mostarda", image: "mustard.png", size: [1, 1], visual: [0.94, 1.64], anchor: [0.5, 0.94], zones: ["door"], sound: "bottle" },
  { id: "ketchup", name: "Ketchup", image: "ketchup.png", size: [1, 1], visual: [0.94, 1.64], anchor: [0.5, 0.94], zones: ["door"], sound: "bottle" },
  { id: "mealbox", name: "Marmita", image: "mealbox.png", size: [2, 1], visual: [1.92, 1.18], anchor: [0.5, 0.88], zones: ["shelf", "drawer"], sound: "plastic" },
  { id: "juice", name: "Suco", image: "juice.png", size: [1, 1], visual: [0.94, 1.64], anchor: [0.5, 0.94], zones: ["door", "shelf"], sound: "bottle" },
];

export const LEVELS = [
  {
    title: "Geladeira Zen",
    subtitle: "Primeiro: so encaixe e relaxe.",
    itemIds: ["eggs", "strawberries", "yogurt", "cake"],
    fixed: [
      { id: "milk", zoneId: "shelf_top", col: 0, row: 0 },
      { id: "red-soda", zoneId: "door_top", col: 0, row: 0 },
      { id: "green-soda", zoneId: "door_top", col: 1, row: 0 },
    ],
  },
  {
    title: "Porta e Molhos",
    subtitle: "Agora use a porta.",
    itemIds: ["mustard", "ketchup", "juice", "yogurt"],
    fixed: [
      { id: "milk", zoneId: "shelf_top", col: 0, row: 0 },
      { id: "eggs", zoneId: "shelf_mid", col: 0, row: 0 },
      { id: "strawberries", zoneId: "shelf_mid", col: 2, row: 0 },
    ],
  },
  {
    title: "Porta Lotada",
    subtitle: "Bebidas e molhos sem cair.",
    itemIds: ["red-soda", "green-soda", "juice", "mustard", "ketchup", "yogurt"],
    fixed: [
      { id: "eggs", zoneId: "shelf_mid", col: 0, row: 0 },
      { id: "cake", zoneId: "shelf_mid", col: 2, row: 0 },
      { id: "mealbox", zoneId: "shelf_low", col: 0, row: 0 },
    ],
  },
  {
    title: "Marmitas Fit",
    subtitle: "Planeje a semana sem bagunca.",
    itemIds: ["mealbox", "mealbox", "strawberries", "lettuce", "juice"],
    fixed: [
      { id: "milk", zoneId: "shelf_top", col: 0, row: 0 },
      { id: "eggs", zoneId: "shelf_mid", col: 0, row: 0 },
      { id: "red-soda", zoneId: "door_top", col: 0, row: 0 },
      { id: "green-soda", zoneId: "door_top", col: 1, row: 0 },
    ],
  },
];
