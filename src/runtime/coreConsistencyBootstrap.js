import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";
import { LOCALES, progressStorageKey } from "../i18n/locale.js";

const MIGRATION_TAG = 2;
const LEGACY_PACK_INSERT_AFTER = [2, 4, 6, 8, 10, 12, 14, 16, 18];

function patchFirstLevel() {
  const first = FRIDGE_BR_CAMPAIGN.find((level) => level.id === "fridge-br-1");
  if (!first) return;

  first.items = first.items.filter((item) => (
    item.fixed || !["strawberries", "cake"].includes(item.image)
  ));

  first.items = first.items.map((item) => {
    if (item.fixed || !["milk", "juice"].includes(item.image)) return item;
    return {
      ...item,
      prefs: {
        ...(item.prefs || {}),
        zone: "door",
        needsCold: false,
      },
    };
  });

  first.objective = {
    type: "fill-zone",
    zone: "door",
    count: 4,
    itemImages: ["green-soda", "red-soda", "juice", "milk"],
  };

  first.revision = Math.max(2, Number(first.revision || 1));
}

function buildLegacyLayout() {
  const sequence = [];
  for (let fridge = 1; fridge <= 20; fridge += 1) {
    sequence.push({ type: "fridge", fridge });
    if (LEGACY_PACK_INSERT_AFTER.includes(fridge)) {
      sequence.push({ type: "insert", after: fridge });
    }
  }
  return sequence;
}

function currentIndexForLegacyToken(token) {
  if (!token) return 0;
  if (token.type === "fridge") {
    const index = FRIDGE_BR_CAMPAIGN.findIndex((level) => level.id === `fridge-br-${token.fridge}`);
    return index >= 0 ? index : 0;
  }

  const pantryNumber = token.after / 2;
  const pantryIndex = FRIDGE_BR_CAMPAIGN.findIndex((level) => level.id === `pantry-${pantryNumber}`);
  if (pantryIndex >= 0) return pantryIndex;
  const fallback = FRIDGE_BR_CAMPAIGN.findIndex((level) => level.id === `fridge-br-${token.after}`);
  return fallback >= 0 ? fallback : 0;
}

function clampCurrent(parsed) {
  parsed.current = Math.max(0, Math.min(FRIDGE_BR_CAMPAIGN.length - 1, Number(parsed.current || 0)));
  parsed.unlocked = Math.max(1, Math.min(FRIDGE_BR_CAMPAIGN.length, Number(parsed.unlocked || 1)));
}

function migrateLegacyLayout3(parsed) {
  const legacy = buildLegacyLayout();
  const oldCurrent = Math.max(0, Math.min(legacy.length - 1, Number(parsed.current || 0)));
  const current = currentIndexForLegacyToken(legacy[oldCurrent]);

  const oldUnlocked = Math.max(1, Math.min(legacy.length, Number(parsed.unlocked || 1)));
  let unlocked = 1;
  for (const token of legacy.slice(0, oldUnlocked)) {
    unlocked = Math.max(unlocked, currentIndexForLegacyToken(token) + 1);
  }

  parsed.current = Math.max(0, Math.min(FRIDGE_BR_CAMPAIGN.length - 1, current));
  parsed.unlocked = Math.max(1, Math.min(FRIDGE_BR_CAMPAIGN.length, unlocked));
}

function migrateProgressRecord(key) {
  if (typeof localStorage === "undefined") return;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    if (parsed.coreConsistencyMigration >= MIGRATION_TAG) return;

    const currentIds = new Set(FRIDGE_BR_CAMPAIGN.map((level) => level.id));
    const starIds = Object.keys(parsed.stars && typeof parsed.stars === "object" ? parsed.stars : {});
    const stableCurrentId = typeof parsed.currentLevelId === "string" && currentIds.has(parsed.currentLevelId)
      ? parsed.currentLevelId
      : null;
    const hasPantryProgress = starIds.some((id) => id.startsWith("pantry-"));
    const hasUnknownStarLevel = starIds.some((id) => !currentIds.has(id));
    const hasUnknownCurrentId = typeof parsed.currentLevelId === "string" && !currentIds.has(parsed.currentLevelId);
    const explicitLegacyEvidence = hasUnknownStarLevel || hasUnknownCurrentId;

    if (stableCurrentId) {
      const stableIndex = FRIDGE_BR_CAMPAIGN.findIndex((level) => level.id === stableCurrentId);
      parsed.current = Math.max(0, stableIndex);
      parsed.unlocked = Math.max(
        parsed.current + 1,
        Math.max(1, Math.min(FRIDGE_BR_CAMPAIGN.length, Number(parsed.unlocked || 1))),
      );
    } else if ((parsed.layout || 1) === 3 && !hasPantryProgress && explicitLegacyEvidence) {
      migrateLegacyLayout3(parsed);
    } else {
      // Layout 3 is ambiguous: both the old pack-insert build and the current pantry
      // build used it. Without positive legacy evidence, preserving the current index
      // is safer than guessing and moving a valid modern save to another level.
      clampCurrent(parsed);
    }

    parsed.currentLevelId = FRIDGE_BR_CAMPAIGN[parsed.current]?.id || "fridge-br-1";
    parsed.coreConsistencyMigration = MIGRATION_TAG;
    localStorage.setItem(key, JSON.stringify(parsed));
  } catch {
    // Broken or blocked storage must never stop the game from booting.
  }
}

function migrateSavedProgress() {
  if (typeof window === "undefined") return;
  const keys = new Set(LOCALES.map((locale) => progressStorageKey(locale)));
  for (const key of keys) migrateProgressRecord(key);
}

export function applyCoreConsistencyPatches() {
  patchFirstLevel();
  migrateSavedProgress();
}
