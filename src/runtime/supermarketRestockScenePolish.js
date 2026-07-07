import { StorageScene } from "../game/StorageScene.js";
import "./supermarketRestock.css";

let applied = false;

const CATEGORY_COPY = {
  en: { beverages: "DRINKS", dairy: "DAIRY", fresh: "FRESH", meals: "READY MEALS", sauces: "SAUCES", groceries: "GROCERIES" },
  cn: { beverages: "饮料", dairy: "乳制品", fresh: "生鲜", meals: "即食", sauces: "酱料", groceries: "杂货" },
  pt: { beverages: "BEBIDAS", dairy: "LATICINIOS", fresh: "FRESCOS", meals: "REFEICOES", sauces: "MOLHOS", groceries: "MERCADO" },
};

const TUTORIAL_IDS = new Set(["fridge-br-1", "fridge-br-2", "fridge-br-3"]);
const ONBOARDING_KEY = "cozyshelf_restock_onboarded_v1";

function isRestock(scene) {
  return scene?.level?.theme?.key === "restock-cooler";
}

function isTutorial(scene) {
  return isRestock(scene) && TUTORIAL_IDS.has(scene?.level?.id);
}

function coachingCopy(locale = "en") {
  if (locale === "cn") {
    return {
      title: "拖动商品到同类标签货架",
      released: "很好，松手完成补货",
      intro: "看标签，把商品补到对应货架。",
    };
  }
  if (locale === "pt") {
    return {
      title: "Arraste o produto para a prateleira da categoria",
      released: "Boa — solte para repor",
      intro: "Leia a etiqueta e reponha no lugar certo.",
    };
  }
  return {
    title: "Drag the product to its labeled shelf",
    released: "Nice — release to restock",
    intro: "Read the label and restock the matching shelf.",
  };
}

function setRootMode(scene) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("restock-game", isRestock(scene));
  root.classList.toggle("restock-tutorial", isTutorial(scene));
}

function clearRootMode() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("restock-game", "restock-tutorial");
}

export function applySupermarketRestockScenePolish() {
  if (applied) return;
  applied = true;

  const originalCreate = StorageScene.prototype.create;
  const originalHasOnboarded = StorageScene.prototype.hasOnboarded;
  const originalMarkOnboarded = StorageScene.prototype.markOnboarded;
  const originalUpdateCampaignControls = StorageScene.prototype.updateCampaignControls;
  const originalSlotHintLabel = StorageScene.prototype.slotHintLabel;
  const originalDrawSettleBar = StorageScene.prototype.drawSettleBar;

  StorageScene.prototype.create = function createRestockScene(data) {
    const result = originalCreate.call(this, data);
    if (!isRestock(this)) return result;

    setRootMode(this);
    const copy = coachingCopy(this.i18n?.locale || "en");
    if (this.i18n?.ui) {
      this.i18n.ui.coachTitle = copy.title;
      this.i18n.ui.coachReleased = copy.released;
    }

    if (isTutorial(this)) {
      // First sessions should read as a game, not a dashboard. The goal card and
      // placed/total counter already tell the truth, so remove duplicate subtitle
      // clutter while the player learns drag -> label -> snap.
      this.subtitleText?.setVisible(false);
      this.goalLabel?.setVisible(false);
      this.setToastMessage(copy.intro);
    }

    this.events.once("shutdown", clearRootMode);
    return result;
  };

  StorageScene.prototype.hasOnboarded = function hasRestockOnboarded() {
    if (!isRestock(this)) return originalHasOnboarded.call(this);
    try {
      return localStorage.getItem(ONBOARDING_KEY) === "1";
    } catch {
      return false;
    }
  };

  StorageScene.prototype.markOnboarded = function markRestockOnboarded() {
    if (!isRestock(this)) return originalMarkOnboarded.call(this);
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // Storage failure must never interrupt play.
    }
  };

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
    if (isTutorial(this)) {
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
