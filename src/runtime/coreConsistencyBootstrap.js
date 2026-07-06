import { FRIDGE_BR_CAMPAIGN } from "../levels/fridgePhaserLevel.js";
import { LOCALES, progressStorageKey } from "../i18n/locale.js";

const MIGRATION_TAG = 1;
const LEGACY_PACK_INSERT_AFTER = [2, 4, 6, 8, 10, 12, 14, 16, 18];

function patchFirstLevel() {
  const first = FRIDGE_BR_CAMPAIGN.find((level) => level.id === "fridge-br-1");
  if (!first) return;

  // The authored goal says "place four drinks on the door", so the runtime data
  // must expose exactly those four movable items. Decorative food stays out of the
  // objective instead of silently becoming extra mandatory work.
  first.items = first.items.filter((item) => (
    item.fixed || !["strawberries", "cake"].includes(item.image)
  ));

  // Milk and juice used to require both `zone: door` and `needsCold: true` while
  // the engine defines only chill/drawer as cold zones. That contradiction made
  // the tutorial goal impossible to satisfy truthfully. Level 1 is a door-facing
  // tutorial, so its four drinks use the door rule only.
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
    tags: ["bottle"],
  };

  // Invalidate any saved board state created with the old six-item tutorial.
  first.revision = Math.max(2, Number(first.revision || 1) + 1);
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

  // Current campaign has pantry beats after 2..16. The old final pack beat after
  // fridge 18 no longer exists, so map it to the nearest stable story level.
  const pantryNumber = token.after / 2;
  const pantryIndex = FRIDGE_BR_CAMPAIGN.findIndex((level) => level.id === `pantry-${pantryNumber}`);
  if (pantryIndex >= 0) return pantryIndex;
  const fallback = FRIDGE_BR_CAMPAIGN.findIndex((level) => level.id === `fridge-br-${token.after}`);
  return fallback >= 0 ? fallback : 0;
}

function migrateProgressRecord(key) {
  if (typeof localStorage === "undefined") return;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    if (parsed.coreConsistencyMigration >= MIGRATION_TAG) return;

    // Layout 3 was used by both the nine-pack-insert build and the later pantry
    // build. Their indices are identical through the insert after fridge 16; only
    // the removed insert after fridge 18 diverges. Mapping by stable level token
    // therefore preserves progress while fixing the late-campaign offset.
    if ((parsed.layout || 1) === 3) {
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
      parsed.currentLevelId = FRIDGE_BR_CAMPAIGN[parsed.current]?.id || "fridge-br-1";
    }

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
