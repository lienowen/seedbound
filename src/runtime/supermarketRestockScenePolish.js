import { StorageScene } from "../game/StorageScene.js";

let applied = false;

const CATEGORY_COPY = {
  en: { beverages: "DRINKS", dairy: "DAIRY", fresh: "FRESH", meals: "READY MEALS", sauces: "SAUCES", groceries: "GROCERIES" },
  cn: { beverages: "饮料", dairy: "乳制品", fresh: "生鲜", meals: "即食", sauces: "酱料", groceries: "杂货" },
  pt: { beverages: "BEBIDAS", dairy: "LATICINIOS", fresh: "FRESCOS", meals: "REFEICOES", sauces: "MOLHOS", groceries: "MERCADO" },
};

function isRestock(scene) {
  return scene?.level?.theme?.key === "restock-cooler";
}

export function applySupermarketRestockScenePolish() {
  if (applied) return;
  applied = true;

  const originalUpdateCampaignControls = StorageScene.prototype.updateCampaignControls;
  const originalSlotHintLabel = StorageScene.prototype.slotHintLabel;
  const originalDrawSettleBar = StorageScene.prototype.drawSettleBar;

  StorageScene.prototype.updateCampaignControls = function updateRestockCampaignControls() {
    if (!isRestock(this)) return originalUpdateCampaignControls.call(this);

    // The vertical 1..5 jump dots made the playfield look like a debug navigator.
    // The real level map already handles navigation, so keep the active game clean.
    this.phaseButtons?.forEach((button) => {
      button?.circle?.setVisible(false);
      button?.hit?.setVisible(false);
    });
    this.phaseButtonTexts?.forEach((text) => text?.setVisible(false));
  };

  StorageScene.prototype.slotHintLabel = function restockSlotHintLabel(slot) {
    if (isRestock(this) && slot?.category) {
      const locale = this.i18n?.locale || "en";
      const label = CATEGORY_COPY[locale]?.[slot.category] || slot.category;
      if (locale === "cn") return `“${label}”货架`;
      if (locale === "pt") return `na prateleira ${label}`;
      return `on the ${label} shelf`;
    }
    return originalSlotHintLabel.call(this, slot);
  };

  StorageScene.prototype.drawSettleBar = function drawRestockProgress(count, goal) {
    if (isRestock(this) && ["fridge-br-1", "fridge-br-2", "fridge-br-3"].includes(this.level?.id)) {
      // Early tutorial levels already have a truthful placed/total counter. Hiding
      // the second meter keeps the first screen focused on drag -> snap -> row clear.
      this.harmonyBarBg?.clear();
      this.harmonyBarFill?.clear();
      this.harmonyLabel?.setText("");
      return;
    }
    return originalDrawSettleBar.call(this, count, goal);
  };
}
