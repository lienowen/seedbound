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

function isFirstFocus(scene) {
  return isRestock(scene) && scene?.level?.id === "fridge-br-1";
}

function firstLevelCopy(locale = "en") {
  if (locale === "cn") {
    return {
      title: "第一批到货",
      goal: "把 3 个饮料补到“饮料”货架。",
      intro: "三个饮料，一排货架。补齐这一排就完成。",
    };
  }
  if (locale === "pt") {
    return {
      title: "Primeira Entrega",
      goal: "Reponha as 3 bebidas na prateleira BEBIDAS.",
      intro: "Tres bebidas, uma fileira. Complete a prateleira.",
    };
  }
  return {
    title: "First Delivery",
    goal: "Restock all 3 drinks on the DRINKS shelf.",
    intro: "Three drinks. One shelf. Fill the row.",
  };
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

function applyFixtureCuts(scene) {
  const fixtures = scene?.level?.stage?.fixtures;
  if (!Array.isArray(fixtures)) return;

  for (const fx of fixtures) {
    if (!fx?.crop || !fx.key) continue;
    const images = scene.children?.list?.filter((child) => child?.texture?.key === fx.key) || [];
    const image = images.find((child) => child.depth === (fx.depth ?? 2)) || images.at(-1);
    if (!image?.setCrop) continue;

    const source = scene.textures.get(fx.key)?.getSourceImage?.();
    const sourceW = source?.width || 1;
    const sourceH = source?.height || 1;
    const x = Math.max(0, Math.min(sourceW - 1, Math.round(fx.crop.x || 0)));
    const y = Math.max(0, Math.min(sourceH - 1, Math.round(fx.crop.y || 0)));
    const w = Math.max(1, Math.min(sourceW - x, Math.round(fx.crop.w || sourceW)));
    const h = Math.max(1, Math.min(sourceH - y, Math.round(fx.crop.h || sourceH)));

    image
      .setCrop(x, y, w, h)
      .setPosition(fx.cx, fx.cy)
      .setOrigin(0.5, fx.originY ?? 0.5)
      .setDisplaySize(fx.w, fx.h);
  }
}

export function applySupermarketRestockScenePolish() {
  if (applied) return;
  applied = true;

  const originalCreate = StorageScene.prototype.create;
  const originalUpdateChrome = StorageScene.prototype.updateChrome;
  const originalHasOnboarded = StorageScene.prototype.hasOnboarded;
  const originalMarkOnboarded = StorageScene.prototype.markOnboarded;
  const originalStartOnboarding = StorageScene.prototype.startOnboarding;
  const originalDisplayScaleFor = StorageScene.prototype.displayScaleFor;
  const originalBuildShelfCategoryTags = StorageScene.prototype.buildShelfCategoryTags;
  const originalBuildFacingGhosts = StorageScene.prototype.buildFacingGhosts;
  const originalLayoutGoalCard = StorageScene.prototype.layoutGoalCard;
  const originalDrawPlacementPreview = StorageScene.prototype.drawPlacementPreview;
  const originalShowWishBubble = StorageScene.prototype.showWishBubble;
  const originalRevealDropZones = StorageScene.prototype.revealDropZones;
  const originalUpdateCampaignControls = StorageScene.prototype.updateCampaignControls;
  const originalSlotHintLabel = StorageScene.prototype.slotHintLabel;
  const originalDrawSettleBar = StorageScene.prototype.drawSettleBar;

  StorageScene.prototype.updateChrome = function updateRestockChrome(patch = {}) {
    if (isFirstFocus(this)) {
      const locale = patch.locale || this.i18n?.locale || this.chromeData?.locale || "en";
      const copy = firstLevelCopy(locale);
      patch = {
        ...patch,
        title: copy.title,
        subtitle: "",
        goal: copy.goal,
        total: 3,
      };
    }
    return originalUpdateChrome.call(this, patch);
  };

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

      if (isFirstFocus(this)) {
        const top = Math.min(...slots.map((slot) => slot.y - slot.h / 2));
        const centerX = slots.reduce((sum, slot) => sum + slot.x, 0) / slots.length;
        const tag = this.add.text(centerX, top - 20, name, {
          fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
          fontSize: 17,
          fontStyle: "bold",
          color: CATEGORY_COLOR[category] || "#745d43",
          backgroundColor: "rgba(255, 250, 240, 0.97)",
          padding: { x: 12, y: 5 },
        }).setOrigin(0.5, 1).setDepth(62);
        this.categoryTags.push(tag);
        continue;
      }

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
    const first = isFirstFocus(this);
    const tutorial = isTutorial(this);
    const twoLine = text.length > (tutorial ? 30 : 38) || text.includes("，") || text.includes("；") || text.includes(";");
    const cardW = first ? 470 : tutorial ? 540 : 620;
    const cardH = first ? 46 : twoLine ? 58 : 48;
    const cardX = 375 - cardW / 2;
    const cardY = first ? 136 : 148;
    const centerY = cardY + cardH / 2;

    this.goalBg?.clear();
    this.goalBg?.fillStyle(0xfffbf2, first ? 0.92 : 0.94);
    this.goalBg?.lineStyle(first ? 1.5 : 2, 0x67bca5, first ? 0.36 : 0.48);
    this.goalBg?.fillRoundedRect(cardX, cardY, cardW, cardH, 18);
    this.goalBg?.strokeRoundedRect(cardX, cardY, cardW, cardH, 18);

    this.goalLabel?.setVisible(false);
    this.goalText
      ?.setOrigin(0.5, 0.5)
      .setPosition(375, centerY)
      .setFontSize(first ? 15 : tutorial ? 16 : 17)
      .setColor("#684f3a")
      .setWordWrapWidth(cardW - 38, true)
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

  StorageScene.prototype.showWishBubble = function showRestockWishBubble(obj, item) {
    if (isTutorial(this)) {
      this.hideWishBubble?.();
      return;
    }
    return originalShowWishBubble.call(this, obj, item);
  };

  StorageScene.prototype.revealDropZones = function revealRestockDropZones(item) {
    if (!isRestock(this)) return originalRevealDropZones.call(this, item);

    this.goodSlotIds = new Set();
    if (!item) return;
    this.slots.forEach((slot) => {
      const good = this.engine.canUseSlot(item, slot);
      if (good) this.goodSlotIds.add(slot.id);
      slot.marker
        .setScale(1)
        .setFillStyle(good ? 0x69b79f : 0x9fb4c9, good ? (isFirstFocus(this) ? 0.03 : 0.045) : 0)
        .setStrokeStyle(good ? 2 : 1, good ? 0x9bd6c5 : 0x9fb4c9, good ? (isFirstFocus(this) ? 0.24 : 0.34) : 0);
    });
  };

  StorageScene.prototype.create = function createRestockScene(data) {
    const result = originalCreate.call(this, data);
    if (!isRestock(this)) return result;

    applyFixtureCuts(this);
    setRootMode(this);
    const copy = coachingCopy(this.i18n?.locale || "en");
    if (this.i18n?.ui) {
      this.i18n.ui.coachTitle = copy.title;
      this.i18n.ui.coachReleased = copy.released;
    }

    this.titleText
      ?.setFontSize(isFirstFocus(this) ? 28 : 32)
      .setColor("#5f402d")
      .setY(isFirstFocus(this) ? 76 : 84);
    this.subtitleText?.setColor("#8b735f");

    if (isTutorial(this)) {
      this.subtitleText?.setVisible(false);
      this.goalLabel?.setVisible(false);
      this.coinPill?.bg?.setVisible(false);
      this.coinPill?.text?.setVisible(false);

      if (isFirstFocus(this)) {
        this.phasePill?.bg?.setVisible(false);
        this.phasePill?.text?.setVisible(false);
        this.progressPill?.bg?.setPosition(250, 0);
        this.progressPill?.text?.setX(645);
      } else {
        this.progressPill?.bg?.setPosition(110, 0);
        this.progressPill?.text?.setX(505);
      }

      if (!isFirstFocus(this)) this.setToastMessage(copy.intro);
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

    if (isFirstFocus(this)) {
      this.onboarding.banner?.setVisible(false);
      this.onboarding.bannerText?.setVisible(false);
      return result;
    }

    this.onboarding.banner?.setPosition(0, -210);
    this.onboarding.bannerText?.setY(292).setFontSize(18);
    return result;
  };

  StorageScene.prototype.displayScaleFor = function restockDisplayScale(item, entry) {
    const base = originalDisplayScaleFor.call(this, item, entry);
    if (!isRestock(this) || !item) return base;

    if (isFirstFocus(this)) {
      return Number((base * (entry?.status === "outside" ? 1.46 : 1.16)).toFixed(3));
    }
    if (entry?.status === "outside") {
      return Number((base * (isTutorial(this) ? 1.38 : 1.26)).toFixed(3));
    }
    return Number((base * 1.06).toFixed(3));
  };

  StorageScene.prototype.updateCampaignControls = function updateRestockCampaignControls() {
    if (!isRestock(this)) return originalUpdateCampaignControls.call(this);

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
      this.harmonyBarBg?.clear();
      this.harmonyBarFill?.clear();
      this.harmonyLabel?.setText("");
      return;
    }
    return originalDrawSettleBar.call(this, count, goal);
  };
}
