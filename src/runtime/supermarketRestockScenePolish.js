import { StorageScene } from "../game/StorageScene.js";
import "./supermarketRestock.css";

let applied = false;

const CATEGORY_COPY = {
  en: { beverages: "DRINKS", dairy: "DAIRY", fresh: "FRESH", meals: "READY MEALS", sauces: "SAUCES", groceries: "GROCERIES" },
  cn: { beverages: "饮料", dairy: "乳制品", fresh: "生鲜", meals: "即食", sauces: "酱料", groceries: "杂货" },
  pt: { beverages: "BEBIDAS", dairy: "LATICINIOS", fresh: "FRESCOS", meals: "REFEICOES", sauces: "MOLHOS", groceries: "MERCADO" },
};

const CATEGORY_COLOR = {
  beverages: "#397d79",
  dairy: "#567b9c",
  fresh: "#4f8259",
  meals: "#a5673d",
  sauces: "#a9574e",
  groceries: "#7b674b",
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
  const originalStartOnboarding = StorageScene.prototype.startOnboarding;
  const originalDisplayScaleFor = StorageScene.prototype.displayScaleFor;
  const originalBuildShelfCategoryTags = StorageScene.prototype.buildShelfCategoryTags;
  const originalBuildFacingGhosts = StorageScene.prototype.buildFacingGhosts;
  const originalLayoutGoalCard = StorageScene.prototype.layoutGoalCard;
  const originalDrawPlacementPreview = StorageScene.prototype.drawPlacementPreview;
  const originalUpdateCampaignControls = StorageScene.prototype.updateCampaignControls;
  const originalSlotHintLabel = StorageScene.prototype.slotHintLabel;
  const originalDrawSettleBar = StorageScene.prototype.drawSettleBar;

  StorageScene.prototype.buildShelfCategoryTags = function buildRestockCategoryTags() {
    if (!isRestock(this)) return originalBuildShelfCategoryTags.call(this);

    if (this.categoryTags) this.categoryTags.forEach((tag) => tag.destroy());
    this.categoryTags = [];
    if (this.editMode) return;

    const names = this.i18n?.ui?.shelfCategory || {};
    const groups = new Map();
    for (const slot of this.slots) {
      if (!slot.category) continue;
      const band = Math.round(slot.y / 18);
      const key = `${slot.category}:${band}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(slot);
    }

    for (const slots of groups.values()) {
      const sample = slots[0];
      const category = sample.category;
      const name = names[category] || category;
      const left = Math.min(...slots.map((slot) => slot.x - slot.w / 2));
      const y = Math.min(...slots.map((slot) => slot.y)) + 14;
      const tag = this.add.text(left + 8, y, name, {
        fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
        fontSize: 13,
        fontStyle: "bold",
        color: CATEGORY_COLOR[category] || "#745d43",
        backgroundColor: "rgba(255, 250, 240, 0.96)",
        padding: { x: 8, y: 3 },
      }).setOrigin(0, 0).setDepth(62);
      this.categoryTags.push(tag);
    }
  };

  StorageScene.prototype.buildFacingGhosts = function buildRestockFacingMarkers() {
    if (!isRestock(this)) return originalBuildFacingGhosts.call(this);

    if (this.facingGhosts) this.facingGhosts.forEach((entry) => entry.ghost?.destroy?.());
    this.facingGhosts = [];
    const plan = this.level?.planogram;
    if (!plan?.length || this.editMode) return;

    for (const shelf of plan) {
      const slot = this.findSlot(shelf.slotId);
      if (!slot) continue;
      shelf.products.forEach((imageKey, col) => {
        const def = this.level.items.find((item) => item.image === imageKey);
        if (!def) return;
        const anchor = this.engine.placementAnchor({ slotId: slot.id, col, row: 0, layer: 0, rot: 0, itemId: def.id });
        const fakeEntry = { status: "packed", slotId: slot.id, col, row: 0, layer: 0, rot: 0, x: anchor.x, y: anchor.y, itemId: def.id };
        const point = this.displayPointFor(def, fakeEntry);

        // A small shelf-edge notch reads like a missing facing/price position. It
        // guides the eye without drawing a product-sized collision rectangle.
        const marker = this.add.graphics();
        marker.fillStyle(0x8d7358, isTutorial(this) ? 0.22 : 0.16);
        marker.fillRoundedRect(-19, -3, 38, 6, 3);
        marker.fillStyle(0xffffff, 0.36);
        marker.fillRoundedRect(-14, -2, 28, 2, 1);
        marker.setPosition(point.x, slot.y + 10).setDepth(60);
        this.itemLayer.add(marker);
        this.facingGhosts.push({ slotId: slot.id, col, ghost: marker });
      });
    }
    this.updateFacingGhosts();
  };

  StorageScene.prototype.layoutGoalCard = function layoutRestockGoalCard(goal = "") {
    if (!isRestock(this)) return originalLayoutGoalCard.call(this, goal);

    const text = goal || "";
    const tutorial = isTutorial(this);
    const twoLine = text.length > (tutorial ? 30 : 38) || text.includes("，") || text.includes("；") || text.includes(";");
    const cardW = tutorial ? 540 : 620;
    const cardH = twoLine ? 58 : 48;
    const cardX = 375 - cardW / 2;
    const cardY = 148;
    const centerY = cardY + cardH / 2;

    this.goalBg?.clear();
    this.goalBg?.fillStyle(0xfffbf2, 0.94);
    this.goalBg?.lineStyle(2, 0x67bca5, 0.48);
    this.goalBg?.fillRoundedRect(cardX, cardY, cardW, cardH, 18);
    this.goalBg?.strokeRoundedRect(cardX, cardY, cardW, cardH, 18);

    this.goalLabel?.setVisible(false);
    this.goalText
      ?.setOrigin(0.5, 0.5)
      .setPosition(375, centerY)
      .setFontSize(tutorial ? 16 : 17)
      .setColor("#684f3a")
      .setWordWrapWidth(cardW - 44, true)
      .setText(text);
    this.goalCardBottom = cardY + cardH;
  };

  StorageScene.prototype.drawPlacementPreview = function drawRestockPlacementPreview(item, preview) {
    if (!isRestock(this)) return originalDrawPlacementPreview.call(this, item, preview);

    this.previewGraphic?.clear();
    this.previewText?.setVisible(false);
    this.previewSprite?.setVisible(false);
    if (!preview || (!preview.inside && !preview.valid)) return;

    const rect = this.placementRect(preview);
    if (!rect) return;

    const valid = !!preview.valid;
    const fill = valid ? 0x69b79f : 0xd9796a;
    const line = valid ? 0xbfe7da : 0xf3b4aa;
    const drawY = rect.y - Math.max(0, preview.layer || 0) * 8;

    // A soft shelf glow is enough. No full debug lattice, baseline, center dot or
    // score-colored engineering overlay.
    this.previewGraphic.fillStyle(fill, valid ? 0.10 : 0.11);
    this.previewGraphic.lineStyle(2, line, valid ? 0.58 : 0.64);
    this.previewGraphic.fillRoundedRect(rect.x + 3, drawY + 3, rect.w - 6, rect.h - 6, Math.max(12, rect.r - 4));
    this.previewGraphic.strokeRoundedRect(rect.x + 3, drawY + 3, rect.w - 6, rect.h - 6, Math.max(12, rect.r - 4));

    if (!valid) {
      this.previewText
        ?.setText(this.translateReason(preview.reason || "reject.generic"))
        .setPosition(preview.x, drawY - 6)
        .setVisible(true);
    }
  };

  StorageScene.prototype.create = function createRestockScene(data) {
    const result = originalCreate.call(this, data);
    if (!isRestock(this)) return result;

    setRootMode(this);
    const copy = coachingCopy(this.i18n?.locale || "en");
    if (this.i18n?.ui) {
      this.i18n.ui.coachTitle = copy.title;
      this.i18n.ui.coachReleased = copy.released;
    }

    this.titleText?.setFontSize(32).setColor("#5f402d").setY(84);
    this.subtitleText?.setColor("#8b735f");

    if (isTutorial(this)) {
      // Keep the learning screen calm: level + progress + one goal. Coins and
      // duplicate subtitle copy return after the player understands the loop.
      this.subtitleText?.setVisible(false);
      this.goalLabel?.setVisible(false);
      this.coinPill?.bg?.setVisible(false);
      this.coinPill?.text?.setVisible(false);
      this.progressPill?.bg?.setPosition(110, 0);
      this.progressPill?.text?.setX(505);
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

  StorageScene.prototype.startOnboarding = function startRestockOnboarding(sprite, hint) {
    const result = originalStartOnboarding.call(this, sprite, hint);
    if (!isRestock(this) || !this.onboarding) return result;

    // Move the instruction out of the product area. The animated hand and target
    // already teach the action; the banner should support them, not cover shelves.
    this.onboarding.banner?.setPosition(0, -210);
    this.onboarding.bannerText?.setY(292).setFontSize(18);
    return result;
  };

  StorageScene.prototype.displayScaleFor = function restockDisplayScale(item, entry) {
    const base = originalDisplayScaleFor.call(this, item, entry);
    if (!isRestock(this) || !item) return base;

    // The legacy closed-cooler layout shrank authored item scales. Reusing that
    // exact scale in the delivery tray made real products look like tiny stickers.
    // Tray stock is deliberately larger and easier to grab; shelf stock gets only
    // a small lift so neighboring facings never collide.
    if (entry?.status === "outside") {
      return Number((base * (isTutorial(this) ? 1.38 : 1.26)).toFixed(3));
    }
    return Number((base * 1.06).toFixed(3));
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
