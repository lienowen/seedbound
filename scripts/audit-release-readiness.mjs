import { CAMPAIGN_CHAPTERS, CAMPAIGN_FINALE, CAMPAIGN_I18N } from "../src/i18n/campaign.js";
import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { applyCoreConsistencyPatches } from "../src/runtime/coreConsistencyBootstrap.js";

applyCoreConsistencyPatches();

const errors = [];
const levelIds = FRIDGE_BR_CAMPAIGN.map((level) => level.id);
const levelIdSet = new Set(levelIds);
const restockLevels = FRIDGE_BR_CAMPAIGN.filter((level) => level.id?.startsWith("fridge-br-"));

if (levelIdSet.size !== levelIds.length) errors.push("duplicate-level-id");
if (restockLevels.length !== 20) errors.push(`restock-level-count:${restockLevels.length}`);
if (FRIDGE_BR_CAMPAIGN.at(-1)?.id !== "fridge-br-20") {
  errors.push(`final-level:${FRIDGE_BR_CAMPAIGN.at(-1)?.id || "missing"}`);
}

for (let number = 1; number <= 20; number += 1) {
  const id = `fridge-br-${number}`;
  if (!levelIdSet.has(id)) errors.push(`missing-level:${id}`);
}

for (const level of FRIDGE_BR_CAMPAIGN) {
  const itemIds = (level.items || []).map((item) => item.id);
  if (new Set(itemIds).size !== itemIds.length) errors.push(`duplicate-item:${level.id}`);
  if (!(level.slots || []).length) errors.push(`no-slots:${level.id}`);
  if (!(level.items || []).some((item) => !item.fixed)) errors.push(`no-movable-items:${level.id}`);

  const slots = new Set((level.slots || []).map((slot) => slot.id));
  for (const item of level.items || []) {
    if (item.fixed && item.slot && !slots.has(item.slot)) {
      errors.push(`missing-fixed-slot:${level.id}:${item.id}:${item.slot}`);
    }
  }

  if (level.id?.startsWith("fridge-br-")) {
    if (level.theme?.key !== "restock-cooler") errors.push(`restock-theme:${level.id}`);
    if (!level.planogram?.length) errors.push(`restock-planogram:${level.id}`);
    if ((level.items || []).some((item) => !item.prefs?.category)) errors.push(`restock-category:${level.id}`);
  }
}

const chapterIds = new Set();
let previousStart = -1;
for (const chapter of CAMPAIGN_CHAPTERS) {
  if (chapterIds.has(chapter.id)) errors.push(`duplicate-chapter:${chapter.id}`);
  chapterIds.add(chapter.id);

  const start = levelIds.indexOf(chapter.startLevelId);
  if (start < 0) errors.push(`chapter-start-missing:${chapter.id}:${chapter.startLevelId}`);
  if (start <= previousStart) errors.push(`chapter-order:${chapter.id}`);
  previousStart = start;

  for (const locale of ["en", "cn", "pt"]) {
    const copy = chapter[locale];
    if (!copy?.title || !copy?.body || !copy?.cta) errors.push(`chapter-copy:${chapter.id}:${locale}`);
  }
}

for (const locale of ["en", "cn", "pt"]) {
  const copy = CAMPAIGN_FINALE[locale];
  if (!copy?.title || !copy?.body || !copy?.cta) errors.push(`finale-copy:${locale}`);
}
if (CAMPAIGN_FINALE.id !== "season-1-restock-finale") errors.push(`finale-id:${CAMPAIGN_FINALE.id}`);
if (!CAMPAIGN_FINALE.image) errors.push("finale-image-missing");

const storyAnchors = ["fridge-br-1", "fridge-br-3", "fridge-br-10", "fridge-br-11", "fridge-br-15", "fridge-br-18", "fridge-br-20"];
for (const locale of ["en", "cn"]) {
  for (const levelId of storyAnchors) {
    const copy = CAMPAIGN_I18N[locale]?.[levelId];
    if (!copy?.title || !copy?.intro || !copy?.goal) errors.push(`story-copy:${locale}:${levelId}`);
  }
}
for (const levelId of storyAnchors) {
  const level = FRIDGE_BR_CAMPAIGN.find((entry) => entry.id === levelId);
  if (!level?.theme?.title || !level?.copy?.intro || !level?.copy?.goal) errors.push(`story-copy:pt:${levelId}`);
}

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(`OK release-readiness campaign=${FRIDGE_BR_CAMPAIGN.length} restock=${restockLevels.length} chapters=${CAMPAIGN_CHAPTERS.length} finale=${CAMPAIGN_FINALE.id}`);
}
