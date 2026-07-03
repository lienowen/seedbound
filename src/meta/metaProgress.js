// Meta-progression layer for Seedbound.
// A single localStorage-backed store powering four retention hooks:
//   1. Food catalog   -> discovered items (collection book)
//   2. Combo streak    -> consecutive level completions
//   3. Daily rewards   -> login streak + once-per-day claim
//   4. Coin shop       -> owned + equipped fridge skins
// Everything lives under one key so it is easy to inspect and reset while testing.

const STORE_KEY = "seedbound.meta.v1";
const ASSET_BASE = `${import.meta.env.BASE_URL}assets/tidy/`;

// ---- Catalog metadata (localized names + flavor text) -----------------------
// Ordered roughly by when players first meet each item in the campaign.
export const CATALOG_ITEMS = [
  { id: "milk", image: "milk.webp", rarity: "common" },
  { id: "eggs", image: "eggs.webp", rarity: "common" },
  { id: "yogurt", image: "yogurt.webp", rarity: "common" },
  { id: "juice", image: "juice.webp", rarity: "common" },
  { id: "strawberries", image: "strawberries.webp", rarity: "rare" },
  { id: "lettuce", image: "lettuce.webp", rarity: "common" },
  { id: "ketchup", image: "ketchup.webp", rarity: "common" },
  { id: "mustard", image: "mustard.webp", rarity: "common" },
  { id: "green-soda", image: "green-soda.webp", rarity: "rare" },
  { id: "red-soda", image: "red-soda.webp", rarity: "rare" },
  { id: "mealbox", image: "mealbox.webp", rarity: "rare" },
  { id: "cake", image: "cake.webp", rarity: "epic" },
];

export const CATALOG_TEXT = {
  pt: {
    milk: { name: "Leite", desc: "Sempre na porta errada. Hoje não." },
    eggs: { name: "Ovos", desc: "Frágeis, mas essenciais no café da manhã." },
    yogurt: { name: "Iogurte", desc: "Cremoso e feliz na prateleira gelada." },
    juice: { name: "Suco", desc: "Refresco tropical para os dias quentes." },
    strawberries: { name: "Morangos", desc: "Doces e delicados — mantenha bem frios." },
    lettuce: { name: "Alface", desc: "Crocante quando guardada na gaveta." },
    ketchup: { name: "Ketchup", desc: "O melhor amigo da mostarda na porta." },
    mustard: { name: "Mostarda", desc: "Picante e teimosa, adora a porta." },
    "green-soda": { name: "Guaraná", desc: "O clássico verde brasileiro." },
    "red-soda": { name: "Refri", desc: "Borbulhante e vermelho vivo." },
    mealbox: { name: "Marmita", desc: "Almoço pronto, só esquentar." },
    cake: { name: "Bolo", desc: "A estrela da festa — deixe à vista!" },
  },
  en: {
    milk: { name: "Milk", desc: "Always in the wrong door. Not today." },
    eggs: { name: "Eggs", desc: "Fragile, but breakfast royalty." },
    yogurt: { name: "Yogurt", desc: "Creamy and happy on a cold shelf." },
    juice: { name: "Juice", desc: "Tropical refreshment for hot days." },
    strawberries: { name: "Strawberries", desc: "Sweet and delicate — keep them cold." },
    lettuce: { name: "Lettuce", desc: "Crispiest tucked in the crisper drawer." },
    ketchup: { name: "Ketchup", desc: "Mustard's best friend on the door." },
    mustard: { name: "Mustard", desc: "Tangy and stubborn, loves the door." },
    "green-soda": { name: "Green Soda", desc: "The classic Brazilian fizz." },
    "red-soda": { name: "Red Soda", desc: "Bubbly and bright red." },
    mealbox: { name: "Meal Box", desc: "Lunch ready to reheat." },
    cake: { name: "Cake", desc: "The star of the party — keep it visible!" },
  },
  cn: {
    milk: { name: "牛奶", desc: "总被放错门架，今天不会了。" },
    eggs: { name: "鸡蛋", desc: "易碎，却是早餐的主角。" },
    yogurt: { name: "酸奶", desc: "在冷藏层里最开心。" },
    juice: { name: "果汁", desc: "炎炎夏日的热带清凉。" },
    strawberries: { name: "草莓", desc: "香甜娇嫩，要冷藏保鲜。" },
    lettuce: { name: "生菜", desc: "放进保鲜抽屉最爽脆。" },
    ketchup: { name: "番茄酱", desc: "门架上芥末的好搭档。" },
    mustard: { name: "芥末酱", desc: "酸辣又固执，独爱门架。" },
    "green-soda": { name: "瓜拉纳汽水", desc: "巴西经典绿色气泡。" },
    "red-soda": { name: "红汽水", desc: "鲜红又冒泡。" },
    mealbox: { name: "便当", desc: "现成的午餐，热一下就好。" },
    cake: { name: "蛋糕", desc: "派对主角——摆在显眼处！" },
  },
};

// ---- Fridge skins (shop) ----------------------------------------------------
// Each skin recolors the scene background. `price` 0 == owned by default.
export const FRIDGE_SKINS = [
  { id: "cream", price: 0, background: "#ffecc8", swatch: "#ffecc8" },
  { id: "mint", price: 150, background: "#dff3ea", swatch: "#8fe0c2" },
  { id: "sky", price: 250, background: "#e2eefb", swatch: "#8fc0f0" },
  { id: "peach", price: 350, background: "#ffe6df", swatch: "#ffb59e" },
  { id: "lavender", price: 500, background: "#ece4fb", swatch: "#c3aef0" },
  { id: "midnight", price: 800, background: "#dfe4f0", swatch: "#5b6b8c" },
];

export const SKIN_TEXT = {
  pt: {
    cream: "Creme Clássico", mint: "Menta Fresca", sky: "Céu Sereno",
    peach: "Pêssego Suave", lavender: "Lavanda", midnight: "Meia-Noite",
  },
  en: {
    cream: "Classic Cream", mint: "Fresh Mint", sky: "Serene Sky",
    peach: "Soft Peach", lavender: "Lavender", midnight: "Midnight",
  },
  cn: {
    cream: "经典奶油", mint: "清新薄荷", sky: "宁静天空",
    peach: "柔和蜜桃", lavender: "薰衣草", midnight: "午夜蓝",
  },
};

export const DAILY_REWARD_TABLE = [20, 30, 40, 60, 80, 120, 200];

export function catalogImageUrl(image) {
  return `${ASSET_BASE}${image}`;
}

function defaultMeta() {
  return {
    discovered: {}, // itemId -> true
    streak: 0, // consecutive level completions (resets on retry-with-mistakes)
    bestStreak: 0,
    daily: { lastClaim: null, loginStreak: 0 },
    shop: { owned: ["cream"], equipped: "cream" },
    dailyPuzzle: { date: null, completed: false },
  };
}

export function readMeta() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw);
    const base = defaultMeta();
    return {
      ...base,
      ...parsed,
      daily: { ...base.daily, ...(parsed.daily || {}) },
      shop: {
        owned: Array.from(new Set(["cream", ...(parsed.shop?.owned || [])])),
        equipped: parsed.shop?.equipped || "cream",
      },
      dailyPuzzle: { ...base.dailyPuzzle, ...(parsed.dailyPuzzle || {}) },
      discovered: parsed.discovered || {},
    };
  } catch {
    return defaultMeta();
  }
}

export function writeMeta(meta) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(meta));
  } catch {
    // Non-fatal: meta progression should never block gameplay.
  }
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayDiff(a, b) {
  const pa = a.split("-").map(Number);
  const pb = b.split("-").map(Number);
  const da = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const db = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db - da) / 86400000);
}

// Returns { claimable, loginStreak, rewardIndex, reward } for today's daily gift.
export function dailyStatus(meta, date = new Date()) {
  const today = todayKey(date);
  const last = meta.daily.lastClaim;
  let loginStreak = meta.daily.loginStreak || 0;
  if (last === today) {
    const idx = Math.max(0, (loginStreak - 1)) % DAILY_REWARD_TABLE.length;
    return { claimable: false, loginStreak, rewardIndex: idx, reward: DAILY_REWARD_TABLE[idx] };
  }
  // Determine what the streak WOULD become if claimed now.
  let nextStreak = 1;
  if (last && dayDiff(last, today) === 1) nextStreak = loginStreak + 1;
  const idx = (nextStreak - 1) % DAILY_REWARD_TABLE.length;
  return { claimable: true, loginStreak: nextStreak, rewardIndex: idx, reward: DAILY_REWARD_TABLE[idx] };
}

// Mutates + returns { meta, reward } after claiming today's gift.
export function claimDaily(meta, date = new Date()) {
  const status = dailyStatus(meta, date);
  if (!status.claimable) return { meta, reward: 0 };
  const next = {
    ...meta,
    daily: { lastClaim: todayKey(date), loginStreak: status.loginStreak },
  };
  writeMeta(next);
  return { meta: next, reward: status.reward };
}

// Mark an item discovered. Returns { meta, isNew }.
export function discoverItem(meta, itemId) {
  if (!itemId || meta.discovered[itemId]) return { meta, isNew: false };
  const next = { ...meta, discovered: { ...meta.discovered, [itemId]: true } };
  writeMeta(next);
  return { meta: next, isNew: true };
}

// Update the completion streak. cleanRun == no mistakes / no skips used.
export function bumpStreak(meta, cleanRun) {
  const streak = cleanRun ? (meta.streak || 0) + 1 : 0;
  const next = {
    ...meta,
    streak,
    bestStreak: Math.max(meta.bestStreak || 0, streak),
  };
  writeMeta(next);
  return { meta: next, streak };
}

export function buySkin(meta, skinId) {
  const skin = FRIDGE_SKINS.find((s) => s.id === skinId);
  if (!skin || meta.shop.owned.includes(skinId)) return { meta, ok: false };
  const next = {
    ...meta,
    shop: { owned: [...meta.shop.owned, skinId], equipped: meta.shop.equipped },
  };
  writeMeta(next);
  return { meta: next, ok: true };
}

export function equipSkin(meta, skinId) {
  if (!meta.shop.owned.includes(skinId)) return meta;
  const next = { ...meta, shop: { ...meta.shop, equipped: skinId } };
  writeMeta(next);
  return next;
}

export function skinById(id) {
  return FRIDGE_SKINS.find((s) => s.id === id) || FRIDGE_SKINS[0];
}

export function discoveredCount(meta) {
  return Object.keys(meta.discovered || {}).length;
}
