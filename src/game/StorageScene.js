import Phaser from "phaser";
import { STORAGE_LEVEL } from "../levels/fridgePhaserLevel.js";
import { StorageEngine } from "./StorageEngine.js";
import { createI18n } from "../i18n/index.js";

const ASSET = `${import.meta.env.BASE_URL}assets/tidy/`;
const PREVIEW_COLORS = {
  good: { fill: 0x67edb8, line: 0xeafff7, fillAlpha: 0.12, lineAlpha: 0.88, lineWidth: 3 },
  bad: { fill: 0xff7d62, line: 0xffefe7, fillAlpha: 0.14, lineAlpha: 0.82, lineWidth: 3 },
};
// Inner-wall regions where the shop skin "liner" wallpaper is tiled. Tuned to
// the realistic fridge board: the main cabinet (shelves/drawers) and the door.
const SKIN_LINER_REGIONS = [
  { x: 150, y: 372, w: 342, h: 620 }, // main cabinet back wall
  { x: 528, y: 360, w: 176, h: 680 }, // door shelf column
];
const ITEM_PLACEHOLDER_COLORS = {
  milk: 0xf5f8ff,
  eggs: 0xfff6dd,
  strawberries: 0xffe3ea,
  mustard: 0xffe58a,
  ketchup: 0xff6b6b,
  juice: 0xffd27a,
  yogurt: 0xf3f0ff,
  lettuce: 0xd8f5c8,
  mealbox: 0xffe8cc,
  cake: 0xffd6ef,
  "green-soda": 0xc8f7c5,
  "red-soda": 0xffb4b4,
};

export class StorageScene extends Phaser.Scene {
  constructor() {
    super("storage");
    this.slots = [];
    this.sprites = new Map();
    this.dragItem = null;
    this.hoverPlacement = null;
    this.editMode = false;
    this.winSent = false;
    this.selectedSlotId = null;
    this.previewSprite = null;
    this.hintTimer = null;
    this.hintFx = null;
    this.remainingSpotlightId = null;
    this.comboCount = 0;
    this.mistakeCount = 0;
    this.comboSparkTimer = null;
  }

  init(data = {}) {
    this.entryData = data;
    this.slots = [];
    this.sprites.clear();
    this.dragItem = null;
    this.hoverPlacement = null;
    this.winSent = false;
    this.selectedSlotId = null;
    this.previewSprite = null;
    this.hintTimer?.remove?.();
    this.hintTimer = null;
    this.hintFx = null;
    this.remainingSpotlightId = null;
    this.comboCount = 0;
    this.mistakeCount = 0;
    this.comboSparkTimer?.remove?.();
    this.comboSparkTimer = null;
    this.phaseButtons = [];
    this.phaseButtonTexts = [];
  }

  preload() {
    const level = this.entryData?.level || this.scene.settings.data?.level || STORAGE_LEVEL;
    this.failedImages = new Set();
    this.load.on("loaderror", (file) => {
      if (file.type === "image") this.failedImages.add(file.key);
    });
    this.loadStageAsset(level.assets?.back);
    this.loadStageAsset(level.assets?.front);
    for (const item of level.items) {
      if (this.textures.exists(item.image)) continue;
      const file = item.file || `${item.image}.png`;
      this.load.image(item.image, `${ASSET}${file}`);
    }
  }

  loadStageAsset(asset) {
    if (!asset?.file) return;
    if (this.textures.exists(asset.key)) return;
    const url = `${ASSET}${asset.file}`;
    if (asset.file.toLowerCase().endsWith(".svg")) {
      this.load.svg(asset.key, url);
    } else {
      this.load.image(asset.key, url);
    }
  }

  textureNeedsPlaceholder(key) {
    if (this.failedImages?.has(key)) return true;
    if (!this.textures.exists(key)) return true;
    return this.textures.get(key).key === "__MISSING";
  }

  ensureItemTextures() {
    for (const item of this.level.items) {
      if (!this.textureNeedsPlaceholder(item.image)) continue;
      const displayW = item.bounds?.w || 96;
      const displayH = item.bounds?.h || 96;
      const width = Math.max(72, Math.round(displayW / (item.scale || 1)));
      const height = Math.max(72, Math.round(displayH / (item.scale || 1)));
      const color = ITEM_PLACEHOLDER_COLORS[item.image] || 0xffd59a;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color, 1);
      g.fillRoundedRect(8, 12, width - 16, height - 20, 14);
      g.lineStyle(3, 0xffffff, 0.55);
      g.strokeRoundedRect(8, 12, width - 16, height - 20, 14);
      g.fillStyle(0xffffff, 0.22);
      g.fillRoundedRect(14, 18, width - 40, Math.min(24, height * 0.18), 10);
      if (this.textures.exists(item.image)) this.textures.remove(item.image);
      g.generateTexture(item.image, width, height);
      g.destroy();
    }
  }

  create(data = {}) {
    const payload = { ...this.entryData, ...data };
    this.editMode = !!payload.editMode;
    this.level = structuredClone(payload.level || STORAGE_LEVEL);
    this.chromeData = structuredClone(payload.uiState || {});
    this.i18n = createI18n(this.chromeData.locale || "pt");
    this.engine = new StorageEngine(this.level, { forceFresh: !!payload.forceFresh });
    this.winSent = this.engine.validate().complete;
    this.completionPolishStarted = false;
    this.cameras.main.setBackgroundColor(this.level.theme.background || "#ffecc8");
    this.ensureItemTextures();
    this.buildStage();
    this.buildSlots();
    this.buildItems();
    this.buildEditor();
    this.unsubscribeEngine = this.engine.subscribe((state, validation) => this.renderState(state, validation));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeEngine?.());
    this.input.on("dragstart", (_, obj) => this.onDragStart(obj));
    this.input.on("drag", (pointer, obj, dragX, dragY) => this.onDrag(pointer, obj, dragX, dragY));
    this.input.on("dragend", (_, obj) => this.onDragEnd(obj));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardownOnboarding());
    this.time.delayedCall(600, () => this.maybeStartOnboarding());
  }

  // ---- FIRST-TIME COACHING ----
  hasOnboarded() {
    try {
      return localStorage.getItem("seedbound_onboarded_v1") === "1";
    } catch {
      return false;
    }
  }

  markOnboarded() {
    try {
      localStorage.setItem("seedbound_onboarded_v1", "1");
    } catch {
      /* storage blocked; coaching just won't persist */
    }
  }

  maybeStartOnboarding() {
    if (this.editMode || this.onboardingActive) return;
    if (this.hasOnboarded()) return;
    if (this.engine.validate().complete) return;
    const hint = this.engine.bestHintForNext();
    if (!hint) return;
    const sprite = this.sprites.get(hint.itemId);
    if (!sprite) return;
    this.startOnboarding(sprite, hint);
  }

  startOnboarding(sprite, hint) {
    this.onboardingActive = true;
    this.onboardingUserGrabbed = false;
    const sx = sprite.x;
    const sy = sprite.y;
    const tx = hint.x;
    const ty = hint.y;

    const layer = this.add.layer().setDepth(955);

    // Pulsing target ring at the ideal slot.
    const targetRing = this.add.circle(tx, ty, 42, 0x67edb8, 0.12).setStrokeStyle(4, 0x67edb8, 0.9);
    layer.add(targetRing);
    this.tweens.add({
      targets: targetRing,
      scale: { from: 0.82, to: 1.16 },
      alpha: { from: 0.95, to: 0.35 },
      duration: 780,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // Looping "touch" indicator: an outer ring + a solid contact dot travelling
    // from the item to its ideal spot, so players see exactly what to do.
    const touch = this.add.container(sx, sy);
    const touchRing = this.add.circle(0, 0, 26, 0xffffff, 0).setStrokeStyle(4, 0xffffff, 0.95);
    const touchDot = this.add.circle(0, 0, 15, 0xffffff, 0.92);
    touch.add([touchRing, touchDot]);
    layer.add(touch);

    // Contact "press" pulse on the ring.
    this.tweens.add({
      targets: touchRing,
      scale: { from: 0.7, to: 1.35 },
      alpha: { from: 0.9, to: 0 },
      duration: 900,
      repeat: -1,
      ease: "Sine.out",
    });
    // Travel from source to target on a gentle loop.
    const travel = this.tweens.add({
      targets: touch,
      x: { from: sx, to: tx },
      y: { from: sy, to: ty },
      duration: 950,
      hold: 380,
      repeatDelay: 650,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // Center instruction card that fades once the player grabs anything.
    const cardW = 440;
    const cardH = 64;
    const cardX = 375 - cardW / 2;
    const cardY = 470;
    const banner = this.add.graphics();
    banner.fillStyle(0x5b2c1d, 0.94);
    banner.lineStyle(3, 0xffffff, 0.85);
    banner.fillRoundedRect(cardX, cardY, cardW, cardH, 18);
    banner.strokeRoundedRect(cardX, cardY, cardW, cardH, 18);
    const bannerText = this.add.text(375, cardY + cardH / 2, this.i18n.ui.coachTitle, {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 20,
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: cardW - 36 },
    }).setOrigin(0.5);
    layer.add(banner);
    layer.add(bannerText);
    banner.setAlpha(0);
    bannerText.setAlpha(0);
    this.tweens.add({ targets: [banner, bannerText], alpha: 1, duration: 260, ease: "Sine.out" });

    this.onboarding = { layer, targetRing, touch, banner, bannerText, travel };
  }

  onboardingUserGrabbed_() {
    if (!this.onboardingActive || !this.onboarding) return;
    this.onboardingUserGrabbed = true;
    const { touch, travel, banner, bannerText } = this.onboarding;
    // Hide the demo hand once the player takes over.
    travel?.remove?.();
    this.tweens.killTweensOf(touch);
    if (touch) this.tweens.add({ targets: touch, alpha: 0, duration: 180, ease: "Sine.in" });
    bannerText?.setText(this.i18n.ui.coachReleased);
    // Keep banner + target ring visible to reinforce where to drop.
    if (banner && bannerText) {
      this.tweens.add({ targets: [banner, bannerText], alpha: { from: 1, to: 0.9 }, duration: 160 });
    }
  }

  finishOnboarding() {
    if (!this.onboardingActive) return;
    this.onboardingActive = false;
    this.markOnboarded();
    this.teardownOnboarding();
  }

  applySkin(skin) {
    // Back-compat: a bare color string still just recolors the camera.
    const background = typeof skin === "string" ? skin : skin?.background;
    const pattern = typeof skin === "string" ? null : skin?.pattern;
    if (background) {
      this.skinBackground = background;
      this.cameras?.main?.setBackgroundColor(background);
    }
    this.applySkinPattern(pattern, background);
  }

  applySkinPattern(patternUrl) {
    // Decorative "liner" wallpaper drawn on the fridge's inner walls: above the
    // realistic back board (depth 0) but below shelves/items (depth 100). MULTIPLY
    // blend lets the board's baked shading show through so it reads as one surface.
    const clearLiners = () => {
      if (this.skinLiners) for (const img of this.skinLiners) img.destroy();
      this.skinLiners = [];
    };
    const place = (key) => {
      clearLiners();
      this.skinLiners = SKIN_LINER_REGIONS.map((r) => {
        const img = this.add.image(r.x + r.w / 2, r.y + r.h / 2, key)
          .setDisplaySize(r.w, r.h)
          .setDepth(1)
          .setAlpha(0.5)
          .setBlendMode(Phaser.BlendModes.MULTIPLY);
        return img;
      });
    };
    if (!patternUrl) {
      clearLiners();
      return;
    }
    const key = `skin:${patternUrl}`;
    if (this.textures.exists(key)) {
      place(key);
      return;
    }
    this.load.image(key, patternUrl);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      if (this.textures.exists(key)) place(key);
    });
    this.load.start();
  }

  teardownOnboarding() {
    if (!this.onboarding) return;
    const { layer, targetRing, touch, banner, bannerText, travel } = this.onboarding;
    travel?.remove?.();
    const targets = [targetRing, touch, banner, bannerText].filter(Boolean);
    this.tweens.killTweensOf(targets);
    this.tweens.add({
      targets,
      alpha: 0,
      duration: 240,
      ease: "Sine.in",
      onComplete: () => layer?.destroy(),
    });
    this.onboarding = null;
  }

  buildStage() {
    const g = this.add.graphics();
    if (this.level.assets?.back) {
      this.add.image(375, 667, this.level.assets.back.key)
        .setDisplaySize(this.level.stage.width, this.level.stage.height)
        .setDepth(0);
    }
    for (const shape of this.level.stage.shapes) this.drawShape(g, shape);
    g.setDepth(0);

    this.itemLayer = this.add.layer().setDepth(100);
    this.frontLayer = this.add.layer().setDepth(300);
    this.uiLayer = this.add.layer().setDepth(500);
    this.previewGraphic = this.add.graphics().setDepth(520);
    this.previewText = this.add.text(0, 0, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 18,
      color: "#ffffff",
      backgroundColor: "rgba(63, 44, 29, .82)",
      padding: { x: 10, y: 6 },
      align: "center",
    }).setDepth(521).setVisible(false).setOrigin(0.5, 1);
    this.uiLayer.add(this.previewGraphic);
    this.uiLayer.add(this.previewText);
    this.buildChrome();

    for (const mask of this.level.fronts) {
      const front = this.add.graphics();
      this.drawShape(front, mask);
      front.setDepth(mask.depth || 300);
      this.frontLayer.add(front);
    }
    if (this.level.assets?.front) {
      this.frontLayer.add(this.add.image(375, 667, this.level.assets.front.key)
        .setDisplaySize(this.level.stage.width, this.level.stage.height)
        .setDepth(this.level.assets.front.depth || 520));
    }
  }

  drawShape(graphics, shape) {
    if (shape.fillGradient) {
      graphics.fillGradientStyle(...shape.fillGradient);
    } else {
      graphics.fillStyle(shape.fill || 0xffffff, shape.alpha ?? 1);
    }
    if (shape.line) graphics.lineStyle(shape.line.width, shape.line.color, shape.line.alpha ?? 1);
    if (shape.kind === "roundedRect") {
      graphics.fillRoundedRect(shape.x, shape.y, shape.w, shape.h, shape.r || 0);
      if (shape.line) graphics.strokeRoundedRect(shape.x, shape.y, shape.w, shape.h, shape.r || 0);
    } else if (shape.kind === "rect") {
      graphics.fillRect(shape.x, shape.y, shape.w, shape.h);
      if (shape.line) graphics.strokeRect(shape.x, shape.y, shape.w, shape.h);
    }
  }

  buildChrome() {
    const pill = (x, y, w, label = "") => {
      const bg = this.add.graphics().setDepth(510);
      bg.fillStyle(0xfff8e6, 0.96);
      bg.lineStyle(4, 0xffffff, 0.72);
      bg.fillRoundedRect(x, y, w, 52, 26);
      bg.strokeRoundedRect(x, y, w, 52, 26);
      const text = this.add.text(x + w / 2, y + 26, label, {
        fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
        fontSize: 22,
        color: "#5b2c1d",
        fontStyle: "bold",
        stroke: "#fffaf0",
        strokeThickness: 1,
      }).setOrigin(0.5);
      this.uiLayer.add(bg);
      this.uiLayer.add(text);
      return { bg, text };
    };

    this.phasePill = pill(16, 14, 104);
    this.coinPill = pill(128, 14, 92);
    this.progressPill = pill(228, 14, 86);
    this.phasePill.text.setDepth(512);
    this.coinPill.text.setDepth(512);
    this.progressPill.text.setDepth(512);
    this.titleText = this.add.text(375, 90, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 38,
      color: "#6a341d",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5, 0);
    this.subtitleText = this.add.text(375, 128, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 15,
      color: "#9d7154",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5, 0);
    // Harmony progress bar
    this.harmonyBarBg = this.add.graphics().setDepth(510);
    this.harmonyBarFill = this.add.graphics().setDepth(511);
    this.harmonyLabel = this.add.text(375, 145, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 12,
      color: "#7a5438",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5, 0).setDepth(512);
    this.goalBg = this.add.graphics().setDepth(510);
    this.goalLabel = this.add.text(62, 184, this.i18n.ui.metaLabel, {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 17,
      color: "#2c9b7f",
      fontStyle: "bold",
    }).setOrigin(0, 0.5).setDepth(512);
    this.goalText = this.add.text(142, 184, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 17,
      color: "#7a5438",
      fontStyle: "bold",
      wordWrap: { width: 498 },
      maxLines: 2,
      lineSpacing: 3,
    }).setOrigin(0, 0.5).setDepth(512);
    this.toastBg = this.add.graphics().setDepth(510);
    this.toastText = this.add.text(375, 1280, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 22,
      color: "#70432a",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 620, useAdvancedWrap: true },
      lineSpacing: 3,
    }).setOrigin(0.5).setDepth(512);
    this.uiLayer.add(this.titleText);
    this.uiLayer.add(this.subtitleText);
    this.uiLayer.add(this.goalBg);
    this.uiLayer.add(this.goalLabel);
    this.uiLayer.add(this.goalText);
    this.uiLayer.add(this.toastBg);
    this.uiLayer.add(this.toastText);
    this.phaseButtons = [];
    this.phaseButtonTexts = [];
    this.updateChrome(this.chromeData);
    this.setToastMessage(this.chromeData.toast || this.level.copy?.intro || this.i18n.ui.dragHint);
  }

  translateReason(reason) {
    return this.i18n.tReason(reason, reason);
  }

  layoutGoalCard(goal = "") {
    const text = goal || "";
    const twoLine = text.length > 24 || text.includes("，") || text.includes("；") || text.includes(";");
    const cardH = twoLine ? 64 : 48;
    const cardY = 150;
    const centerY = cardY + cardH / 2;
    this.goalBg?.clear();
    this.goalBg?.fillStyle(0xffffff, 0.96);
    this.goalBg?.lineStyle(3, 0x2ca184, 0.7);
    this.goalBg?.fillRoundedRect(52, cardY, 646, cardH, 20);
    this.goalBg?.strokeRoundedRect(52, cardY, 646, cardH, 20);
    this.goalLabel?.setY(centerY);
    this.goalText?.setY(centerY);
    this.goalText?.setText(text);
    this.goalCardBottom = cardY + cardH;
  }

  updateChrome(patch = {}) {
    const previousPlaced = this.chromeData?.placed ?? 0;
    const previousCoins = this.chromeData?.coins ?? 0;
    this.chromeData = { ...this.chromeData, ...patch };
    const phase = this.chromeData.phase ?? this.level.phase ?? 1;
    const coins = this.chromeData.coins ?? 0;
    const placed = this.chromeData.placed ?? 0;
    const total = this.chromeData.total ?? this.level.items.filter((item) => !item.fixed).length;
    this.phasePill?.text.setText(this.i18n.ui.phaseLabel(phase));
    this.coinPill?.text.setText(`${coins}`);
    this.progressPill?.text.setText(`${placed}/${total}`);
    this.titleText?.setText(this.chromeData.title || this.level.theme.title || "");
    this.subtitleText?.setText(this.chromeData.subtitle || this.level.theme.subtitle || "");

    const goal = this.chromeData.goal || this.level.copy?.goal || this.level.goal || "";
    this.layoutGoalCard(goal);
    this.updateCampaignControls();
    if (placed > previousPlaced) this.pulseChromeText(this.progressPill?.text);
    if (coins !== previousCoins) this.pulseChromeText(this.coinPill?.text);

    // Happiness meter: how many foods are currently happy vs. the goal.
    const happyCount = patch.happyCount ?? this.chromeData?.happyCount ?? 0;
    const happyGoal = patch.happyGoal ?? this.chromeData?.happyGoal ?? 0;
    this.drawHappyBar(happyCount, happyGoal);
  }

  drawHappyBar(count, goal) {
    this.harmonyBarBg?.clear();
    this.harmonyBarFill?.clear();
    if (!goal) {
      this.harmonyLabel?.setText("");
      return;
    }
    const barW = 176;
    const barH = 10;
    const labelW = 96;
    const groupW = barW + 10 + labelW;
    const barX = 375 - groupW / 2;
    const barY = (this.goalCardBottom ?? 214) + 16;
    const pct = Math.min(1, count / Math.max(1, goal));
    const color = pct >= 1 ? 0x67edb8 : pct >= 0.6 ? 0xffd166 : 0xff9f7d;

    this.harmonyBarBg.fillStyle(0xe8dcc8, 0.6);
    this.harmonyBarBg.fillRoundedRect(barX, barY, barW, barH, 5);
    this.harmonyBarFill.fillStyle(color, 0.95);
    this.harmonyBarFill.fillRoundedRect(barX, barY, Math.max(5, barW * pct), barH, 5);
    this.harmonyLabel?.setOrigin(0, 0.5);
    this.harmonyLabel?.setPosition(barX + barW + 10, barY + barH / 2);
    this.harmonyLabel?.setText(this.i18n.ui.happyMeter(count, goal));
    // Pulse the meter when the count rises so the player feels the progress.
    if (count > (this._lastHappyCount ?? 0)) this.pulseChromeText(this.harmonyLabel);
    this._lastHappyCount = count;
  }

  pulseChromeText(node) {
    if (!node) return;
    this.tweens.killTweensOf(node);
    node.setScale(1);
    this.tweens.add({
      targets: node,
      scaleX: 1.14,
      scaleY: 1.14,
      duration: 95,
      yoyo: true,
      ease: "Back.out(1.4)",
    });
  }

  applyLocale(locale, localizedLevel, uiState = {}) {
    this.i18n = createI18n(locale || "pt");
    if (localizedLevel) {
      this.level = {
        ...this.level,
        theme: { ...this.level.theme, ...localizedLevel.theme },
        copy: { ...this.level.copy, ...localizedLevel.copy },
        items: this.level.items.map((item) => {
          const localizedItem = localizedLevel.items?.find((entry) => entry.id === item.id);
          return localizedItem ? { ...item, name: localizedItem.name } : item;
        }),
      };
    }
    this.updateChrome({ ...uiState, locale: this.i18n.locale });
    if (!this.dragItem) {
      this.setToastMessage(uiState.toast || this.level.copy?.intro || this.i18n.ui.dragHint);
    }
  }

  updateCampaignControls() {
    const phases = this.chromeData.phases || [];
    const unlockedCount = this.chromeData.unlockedCount ?? phases.length;
    const currentIndex = this.chromeData.currentIndex ?? 0;
    const show = !!this.chromeData.showCampaignControls;
    
    this.phaseButtons.forEach((button) => { button?.circle?.setVisible(false); button?.hit?.setVisible(false); });
    this.phaseButtonTexts.forEach((text) => text?.setVisible(false));
    
    if (!show) {
      return;
    }

    while (this.phaseButtonTexts.length < phases.length) {
      const i = this.phaseButtonTexts.length;
      const circle = this.add.circle(46, 0, 18, 0xfffaec, 0.95).setDepth(512).setVisible(false);
      circle.setStrokeStyle(2, 0xffffff, 0.72);
      const hit = this.add.circle(46, 0, 18, 0xffffff, 0.001).setDepth(513).setInteractive({ useHandCursor: true }).setVisible(false);
      const label = this.add.text(46, 0, `${i + 1}`, {
        fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
        fontSize: 18,
        color: "#6e4730",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(514).setVisible(false);
      hit.on("pointerdown", () => {
        if (i < (this.chromeData.unlockedCount ?? 0)) {
          this.events.emit("jump-phase", i);
        }
      });
      this.phaseButtons.push({ circle, hit });
      this.phaseButtonTexts.push(label);
      this.uiLayer.add(circle);
      this.uiLayer.add(hit);
      this.uiLayer.add(label);
    }

    let startIdx = Math.max(0, currentIndex - 2);
    if (startIdx + 5 > phases.length) startIdx = Math.max(0, phases.length - 5);
    const endIdx = Math.min(phases.length - 1, startIdx + 4);

    let visibleRank = 0;
    for (let i = 0; i < phases.length; i += 1) {
      const controls = this.phaseButtons[i];
      const circle = controls?.circle;
      const hit = controls?.hit;
      const label = this.phaseButtonTexts[i];
      if (!circle || !hit || !label) continue;
      
      if (i >= startIdx && i <= endIdx) {
        const locked = i >= unlockedCount;
        const active = i === currentIndex;
        const y = 390 + (visibleRank * 48);
        visibleRank++;
        
        circle.setPosition(46, y).setVisible(true);
        hit.setPosition(46, y).setVisible(true);
        label.setPosition(46, y).setVisible(true);
        
        circle.setFillStyle(active ? 0x2ca184 : 0xfffaec, locked ? 0.45 : 0.95);
        circle.setStrokeStyle(2, active ? 0x56cfaf : 0xffffff, locked ? 0.35 : 0.72);
        label.setText(`${phases[i].phase ?? i + 1}`);
        label.setColor(active ? "#fff4b0" : "#6e4730");
        circle.setScale(active ? 1.15 : 1.0);
        label.setScale(active ? 1.15 : 1.0);
        hit.input.enabled = !locked;
        hit.setAlpha(locked ? 0.5 : 1);
      }
    }
  }

  setToastMessage(message) {
    const text = message || "";
    if (!text) {
      this.hideToast();
      return;
    }
    const twoLine = text.length > 34 || /\s.{16,}\s/.test(text);
    const cardH = twoLine ? 68 : 52;
    const cardW = 560;
    const cardX = 375 - cardW / 2;
    // Sit just below the goal/harmony header so it never collides with the
    // draggable tray or the bottom action bar.
    const cardY = (this.goalCardBottom ?? 214) + 40;
    const centerY = cardY + cardH / 2;
    this.toastBg?.clear();
    this.toastBg?.fillStyle(0x5b2c1d, 0.95);
    this.toastBg?.lineStyle(3, 0xffffff, 0.8);
    this.toastBg?.fillRoundedRect(cardX, cardY, cardW, cardH, 18);
    this.toastBg?.strokeRoundedRect(cardX, cardY, cardW, cardH, 18);
    this.toastText?.setText(text);
    this.toastText?.setFontSize(twoLine ? 18 : 21);
    this.toastText?.setWordWrapWidth(cardW - 40, true);
    this.toastText?.setY(centerY);
    this.toastText?.setColor("#ffffff");

    // Fade the banner in, hold, then auto-hide so it doesn't linger over the fridge.
    const targets = [this.toastBg, this.toastText].filter(Boolean);
    this.tweens.killTweensOf(targets);
    for (const t of targets) t.setAlpha(1);
    this.tweens.add({
      targets,
      alpha: 0,
      delay: 2400,
      duration: 300,
      ease: "Sine.easeIn",
    });
  }

  hideToast() {
    const targets = [this.toastBg, this.toastText].filter(Boolean);
    if (!targets.length) return;
    this.tweens.killTweensOf(targets);
    this.tweens.add({
      targets,
      alpha: 0,
      duration: 260,
      ease: "Sine.easeIn",
    });
  }

  clearHintFx() {
    if (!this.hintFx) return;
    const { layer, sourceSprite, targetSprite, sourceBaseScale, targetBaseScale } = this.hintFx;
    if (sourceSprite) {
      this.tweens.killTweensOf(sourceSprite);
      sourceSprite.clearTint().setAngle(0);
      if (sourceBaseScale != null) sourceSprite.setScale(sourceBaseScale);
      const home = sourceSprite.getData("home");
      const item = sourceSprite.getData("item");
      if (home && item && home.status === "outside") {
        const display = this.displayPointFor(item, home);
        sourceSprite.setPosition(display.x, display.y);
      }
    }
    if (targetSprite) {
      this.tweens.killTweensOf(targetSprite);
      targetSprite.clearTint();
      if (targetBaseScale != null) targetSprite.setScale(targetBaseScale);
    }
    layer?.destroy?.(true);
    this.hintFx = null;
  }

  slotHintLabel(slot) {
    if (!slot) return "";
    const slotLabels = {
      door_top_1: {
        en: "on the top door rack",
        pt: "na prateleira de cima da porta",
        cn: "在冰箱门上层",
      },
      door_upper_2: {
        en: "on the upper-middle door rack",
        pt: "na prateleira alta do meio da porta",
        cn: "在冰箱门上中层",
      },
      door_mid_1: {
        en: "on the middle door rack",
        pt: "na prateleira do meio da porta",
        cn: "在冰箱门中层",
      },
      door_low_1: {
        en: "on the bottom door rack",
        pt: "na prateleira de baixo da porta",
        cn: "在冰箱门下层",
      },
      drawer_left: {
        en: "in the left cold drawer spot",
        pt: "no lado esquerdo da gaveta fria",
        cn: "在左侧冷藏抽屉",
      },
      drawer_right: {
        en: "in the right cold drawer spot",
        pt: "no lado direito da gaveta fria",
        cn: "在右侧冷藏抽屉",
      },
      shelf_top_1: {
        en: "on the top shelf",
        pt: "na prateleira de cima",
        cn: "在上层架子",
      },
      shelf_top_2: {
        en: "on the top shelf",
        pt: "na prateleira de cima",
        cn: "在上层架子",
      },
      shelf_mid_1: {
        en: "on the middle shelf",
        pt: "na prateleira do meio",
        cn: "在中层架子",
      },
      shelf_mid_2: {
        en: "on the middle shelf",
        pt: "na prateleira do meio",
        cn: "在中层架子",
      },
      shelf_low_1: {
        en: "on the lower shelf",
        pt: "na prateleira de baixo",
        cn: "在下层架子",
      },
      shelf_low_2: {
        en: "on the lower shelf",
        pt: "na prateleira de baixo",
        cn: "在下层架子",
      },
    };
    const locale = this.i18n?.locale || "en";
    return slotLabels[slot.id]?.[locale] || "";
  }

  playHintGuidance(item, hint) {
    this.clearHintFx();
    const sourceSprite = this.sprites.get(item.id);
    const targetSprite = this.previewSprite?.visible ? this.previewSprite : null;
    const layer = this.add.layer().setDepth(958);
    const sourceBaseScale = sourceSprite ? this.displayScaleFor(item, sourceSprite.getData("home")) : null;
    const targetBaseScale = targetSprite ? targetSprite.scaleX : null;

    if (sourceSprite) {
      const sourceHalo = this.add.circle(sourceSprite.x, sourceSprite.y - 28, 34, 0xfff3c3, 0.2);
      sourceHalo.setStrokeStyle(3, 0xfff9e8, 0.92);
      layer.add(sourceHalo);
      this.tweens.add({
        targets: sourceHalo,
        scale: { from: 0.94, to: 1.18 },
        alpha: { from: 0.82, to: 0.18 },
        duration: 620,
        repeat: 1,
        yoyo: false,
        ease: "Sine.inOut",
      });
      this.tweens.add({
        targets: sourceSprite,
        scaleX: sourceBaseScale * 1.08,
        scaleY: sourceBaseScale * 1.08,
        y: sourceSprite.y - 10,
        angle: { from: -3, to: 3 },
        duration: 170,
        repeat: 3,
        yoyo: true,
        ease: "Sine.inOut",
        onComplete: () => {
          sourceSprite.setAngle(0);
          const home = sourceSprite.getData("home");
          if (home?.status === "outside") {
            const display = this.displayPointFor(item, home);
            sourceSprite.setPosition(display.x, display.y);
          }
          sourceSprite.setScale(sourceBaseScale);
        },
      });
    }

    const guideLine = this.add.graphics();
    guideLine.lineStyle(5, 0xfff8df, 0.76);
    if (sourceSprite) {
      guideLine.beginPath();
      guideLine.moveTo(sourceSprite.x + 18, sourceSprite.y - 18);
      guideLine.quadraticCurveTo((sourceSprite.x + hint.x) / 2 + 28, Math.min(sourceSprite.y, hint.y) - 64, hint.x, hint.y - 22);
      guideLine.strokePath();
    }
    layer.add(guideLine);

    const guideDot = this.add.circle(sourceSprite?.x || hint.x, (sourceSprite?.y || hint.y) - 18, 8, 0xfff7d6, 0.96);
    layer.add(guideDot);
    this.tweens.add({
      targets: guideDot,
      x: hint.x,
      y: hint.y - 18,
      duration: 560,
      ease: "Sine.inOut",
      onComplete: () => guideDot.destroy(),
    });

    if (targetSprite) {
      targetSprite.setTint(0xf8ffe7).setAlpha(0.34);
      this.tweens.add({
        targets: targetSprite,
        scaleX: targetBaseScale * 1.04,
        scaleY: targetBaseScale * 1.04,
        alpha: { from: 0.24, to: 0.38 },
        duration: 240,
        yoyo: true,
        repeat: 2,
        ease: "Sine.inOut",
      });
    }

    this.hintFx = { layer, sourceSprite, targetSprite, sourceBaseScale, targetBaseScale };
  }

  buildSlots() {
    this.slots = this.level.slots.map((slot) => {
      const marker = this.add.rectangle(slot.x, slot.y, slot.w, slot.h, 0x61e7b0, 0.001)
        .setStrokeStyle(3, 0x72efc0, this.editMode ? 0.45 : 0)
        .setData("slot", slot)
        .setDepth(60);
      const guide = this.add.graphics().setDepth(61);
      const label = this.add.text(slot.x, slot.y - slot.h / 2 - 18, slot.id, {
        fontFamily: "monospace",
        fontSize: 12,
        color: "#ffffff",
        backgroundColor: "rgba(82, 49, 24, .72)",
        padding: { x: 6, y: 2 },
      }).setOrigin(0.5, 1).setVisible(this.editMode);
      if (this.editMode) {
        marker.setInteractive({ draggable: true });
        this.input.setDraggable(marker);
        marker.on("pointerdown", () => this.selectSlot(slot.id));
        marker.on("drag", (_pointer, x, y) => {
          slot.x = Math.round(x);
          slot.y = Math.round(y);
          this.syncSlotVisual({ ...slot, marker, guide, label });
          this.emitEditorChange();
        });
      }
      const entry = { ...slot, marker, guide, label };
      this.syncSlotVisual(entry);
      return entry;
    });
    if (this.editMode && this.slots.length) this.selectSlot(this.slots[0].id);
  }

  buildItems() {
    const snapshot = this.engine.snapshot();
    this.introSprites = [];
    for (const item of this.level.items) {
      const entry = snapshot.items[item.id] || {
        x: item.trayX,
        y: item.trayY,
        status: "outside",
      };
      const display = this.displayPointFor(item, entry);
      const displayScale = this.displayScaleFor(item, entry);
      const sprite = this.add.image(display.x, display.y, item.image)
        .setOrigin(item.anchor[0], item.anchor[1])
        .setScale(displayScale)
        .setData("item", item)
        .setData("home", entry)
        .setDepth(item.fixed ? 140 : 420);
      sprite.setAlpha(0);
      sprite.setY(display.y + (entry.status === "outside" ? 18 : 12));
      this.itemLayer.add(sprite);
      this.sprites.set(item.id, sprite);
      this.introSprites.push({ sprite, x: display.x, y: display.y, packed: entry.status === "packed" });
      if (!item.fixed) {
        sprite.setInteractive({ draggable: true, pixelPerfect: false });
        this.input.setDraggable(sprite);
      }
    }
    if (this.level.items.length) {
      const seed = this.level.items[0];
      this.previewSprite = this.add.image(-1000, -1000, seed.image)
        .setOrigin(seed.anchor[0], seed.anchor[1])
        .setScale(seed.scale)
        .setAlpha(0.34)
        .setVisible(false);
      this.itemLayer.add(this.previewSprite);
    }
    this.sortItems();
    this.playLevelIntroPolish();
    this.updateRemainingSpotlight(this.engine.validate());
  }

  playLevelIntroPolish() {
    const introSprites = this.introSprites || [];
    introSprites.forEach(({ sprite, x, y, packed }, index) => {
      this.tweens.add({
        targets: sprite,
        alpha: 1,
        x,
        y,
        duration: packed ? 240 : 220,
        delay: Math.min(index, 7) * 55,
        ease: packed ? "Back.out(1.4)" : "Sine.out",
      });
    });
  }

  buildEditor() {
    if (!this.editMode) return;
    const text = this.add.text(18, 18, "EDIT MODE: drag slots, copy JSON", {
      fontFamily: "monospace",
      fontSize: 20,
      color: "#4d2d1f",
      backgroundColor: "rgba(255,255,255,.72)",
      padding: { x: 10, y: 8 },
    }).setDepth(700);
    this.uiLayer.add(text);
    this.events.emit("editor-ready", true);
    this.emitEditorChange();
  }

  findSlot(id) {
    return this.slots.find((slot) => slot.id === id);
  }

  selectSlot(slotId) {
    this.selectedSlotId = slotId;
    this.refreshSlotVisuals();
    const slot = this.findSlot(slotId);
    if (slot) this.events.emit("editor-selection", this.editorSlotPayload(slot));
  }

  editorSlotPayload(slot) {
    return {
      id: slot.id,
      zone: slot.zone,
      allow: [...slot.allow],
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      baseline: slot.baseline,
      depth: slot.depth,
      cols: slot.cols || 1,
      rows: slot.rows || 1,
    };
  }

  emitEditorChange() {
    this.refreshSlotVisuals();
    this.events.emit("editor-change", this.exportLevel());
    const slot = this.findSlot(this.selectedSlotId);
    if (slot) this.events.emit("editor-selection", this.editorSlotPayload(slot));
  }

  syncSlotVisual(slot) {
    slot.marker.setPosition(slot.x, slot.y).setSize(slot.w, slot.h);
    slot.label.setPosition(slot.x, slot.y - slot.h / 2 - 18);
    slot.guide.clear();
    const cols = slot.cols || 1;
    const rows = slot.rows || 1;
    const left = slot.x - slot.w / 2;
    const top = slot.y - slot.h / 2;
    const baselineY = this.engine.slotBaseline(slot, rows - 1, 1);

    if (!this.editMode) {
      if (rows > 1) {
        slot.guide.lineStyle(1, 0xffffff, 0.18);
        for (let row = 1; row < rows; row += 1) {
          const y = top + (slot.h / rows) * row;
          slot.guide.lineBetween(left + 12, y, left + slot.w - 12, y);
        }
      }
      return;
    }

    slot.guide.lineStyle(2, 0x9ef7d9, 0.65);
    for (let col = 1; col < cols; col += 1) {
      const x = left + (slot.w / cols) * col;
      slot.guide.lineBetween(x, top + 8, x, top + slot.h - 8);
    }
    for (let row = 1; row < rows; row += 1) {
      const y = top + (slot.h / rows) * row;
      slot.guide.lineBetween(left + 8, y, left + slot.w - 8, y);
    }
    slot.guide.lineStyle(2, 0xffcf58, 0.9);
    slot.guide.lineBetween(left + 8, baselineY, left + slot.w - 8, baselineY);
    slot.guide.fillStyle(0xffcf58, 0.9);
    slot.guide.fillCircle(slot.x, baselineY, 5);
  }

  refreshSlotVisuals() {
    for (const slot of this.slots) {
      const selected = slot.id === this.selectedSlotId;
      this.syncSlotVisual(slot);
      slot.marker.setStrokeStyle(selected ? 4 : 3, selected ? 0xffcf58 : 0x72efc0, this.editMode ? (selected ? 0.98 : 0.45) : 0);
      slot.marker.setFillStyle(selected ? 0xffcf58 : 0x61e7b0, selected ? 0.12 : 0.001);
      slot.label.setStyle({
        color: selected ? "#4d2d1f" : "#ffffff",
        backgroundColor: selected ? "rgba(255, 207, 88, .94)" : "rgba(82, 49, 24, .72)",
      });
      slot.guide.alpha = selected ? 1 : 0.55;
    }
  }

  adjustSelectedSlot(patch) {
    if (!this.editMode) return;
    const slot = this.findSlot(this.selectedSlotId);
    if (!slot) return;
    slot.x = Math.round(patch.x ?? slot.x);
    slot.y = Math.round(patch.y ?? slot.y);
    slot.w = Math.max(24, Math.round(patch.w ?? slot.w));
    slot.h = Math.max(24, Math.round(patch.h ?? slot.h));
    slot.baseline = Phaser.Math.Clamp(Number((patch.baseline ?? slot.baseline).toFixed(2)), 0.55, 0.98);
    slot.depth = Math.round(patch.depth ?? slot.depth);
    this.emitEditorChange();
  }

  nudgeSelectedSlot(dx, dy) {
    const slot = this.findSlot(this.selectedSlotId);
    if (!slot) return;
    this.adjustSelectedSlot({ x: slot.x + dx, y: slot.y + dy });
  }

  resizeSelectedSlot(dw, dh) {
    const slot = this.findSlot(this.selectedSlotId);
    if (!slot) return;
    this.adjustSelectedSlot({ w: slot.w + dw, h: slot.h + dh });
  }

  shiftSelectedBaseline(delta) {
    const slot = this.findSlot(this.selectedSlotId);
    if (!slot) return;
    this.adjustSelectedSlot({ baseline: slot.baseline + delta });
  }

  renderNudgeFor(item, entry) {
    const slot = entry?.slotId ? this.findSlot(entry.slotId) : null;
    const slotKey = slot?.id || null;
    const slotModeKey = slotKey ? `${slotKey}:${entry?.status || "packed"}` : null;
    const zoneKey = slot?.zone ? `${slot.zone}:${entry?.status || "packed"}` : null;
    const nudge = item?.renderNudge?.[slotModeKey]
      || item?.renderNudge?.[slotKey]
      || item?.renderNudge?.[zoneKey]
      || item?.renderNudge?.[slot?.zone]
      || item?.renderNudge?.[entry?.status || "packed"]
      || item?.renderNudge
      || {};
    return {
      x: Math.round(nudge.x || 0),
      y: Math.round(nudge.y || 0),
    };
  }

  drawerSeatOffset(item, entry) {
    const slot = entry?.slotId ? this.findSlot(entry.slotId) : null;
    if (entry?.status !== "packed" || slot?.zone !== "drawer") return { x: 0, y: 0 };
    const surface = item?.surface || {};
    const visibleHeight = Math.max(
      item?.bounds?.h || 96,
      Math.round((surface.visibleHeight || 1) * (surface.textureHeight || 362) * (item?.scale || 1)),
    );
    const supportHeight = this.engine.itemSupportHeight(item.id);
    const excessHeight = Math.max(0, Math.max(visibleHeight, supportHeight) - 96);
    return {
      x: 0,
      // Taller items need to sit slightly deeper in the drawer to avoid the
      // pasted-on look that shows up most clearly on the bottom compartment.
      y: -Math.min(14, Math.round(excessHeight * 0.16)),
    };
  }

  itemVisibleMetrics(item) {
    const profile = item?.surface || {};
    const visibleHeight = Math.max(
      item?.bounds?.h || 96,
      Math.round((profile.visibleHeight || 1) * (profile.textureHeight || 362) * (item?.scale || 1)),
    );
    const visibleWidth = Math.max(
      item?.bounds?.w || 48,
      Math.round((((profile.contactRight ?? 0.65) - (profile.contactLeft ?? 0.35)) || 0.3) * (profile.textureWidth || 362) * (item?.scale || 1)),
    );
    return { visibleHeight, visibleWidth };
  }

  doorSeatOffset(item, entry) {
    const slot = entry?.slotId ? this.findSlot(entry.slotId) : null;
    if (entry?.status !== "packed" || slot?.zone !== "door") return { x: 0, y: 0 };
    const { visibleHeight } = this.itemVisibleMetrics(item);
    const perSlot = {
      door_top_1: { x: 8, y: 0 },
      door_upper_2: { x: 10, y: -1 },
      door_mid_1: { x: 12, y: -2 },
      // The bottom door rack has a stronger perspective taper in the front
      // artwork, so items need to sit a little deeper and slightly more to
      // the right to feel inside the rail rather than pasted in front of it.
      door_low_1: { x: 18, y: -6 },
    };
    const base = perSlot[slot.id] || { x: 8, y: -2 };
    const tallNudge = visibleHeight >= 120 ? -1 : 0;
    return {
      x: base.x,
      y: base.y + tallNudge,
    };
  }

  visualOffsetFor(item, entry) {
    const seatOffset = this.drawerSeatOffset(item, entry);
    const doorOffset = this.doorSeatOffset(item, entry);
    const renderNudge = this.renderNudgeFor(item, entry);
    return {
      x: seatOffset.x + doorOffset.x + renderNudge.x,
      y: seatOffset.y + doorOffset.y + renderNudge.y,
    };
  }

  displayPointFor(item, entry) {
    const offset = this.visualOffsetFor(item, entry);
    return {
      x: entry.x + offset.x,
      y: entry.y + offset.y,
    };
  }

  logicalDragPoint(item, x, y, entry) {
    const offset = this.visualOffsetFor(item, entry);
    return {
      x: x - offset.x,
      y: y - offset.y,
    };
  }

  displayScaleFor(item, entry) {
    if (entry?.status === "outside") {
      return Number((item.scale * 1.08).toFixed(3));
    }
    const slot = entry?.slotId ? this.findSlot(entry.slotId) : null;
    if (slot?.zone !== "door") return item.scale;
    const { visibleHeight } = this.itemVisibleMetrics(item);
    if (visibleHeight >= 126) {
      return Number((item.scale * 0.982).toFixed(3));
    }
    return item.scale;
  }

  previewFootprint(item, preview) {
    const surface = item.surface || {};
    const texture = this.textures.get(item.image)?.getSourceImage?.();
    const textureWidth = surface.textureWidth || texture?.width || item.bounds?.w || 128;
    const left = preview.x - ((surface.contactCenterX ?? 0.5) - (surface.contactLeft ?? 0.35)) * textureWidth * item.scale;
    const right = preview.x + ((surface.contactRight ?? 0.65) - (surface.contactCenterX ?? 0.5)) * textureWidth * item.scale;
    return {
      x: left,
      y: preview.y - 6,
      w: Math.max(24, right - left),
      h: 12,
    };
  }

  placementRect(preview) {
    const slot = this.findSlot(preview.slotId);
    if (!slot) return null;
    const cols = slot.cols || 1;
    const rows = slot.rows || 1;
    const cellW = slot.w / cols;
    const cellH = slot.h / rows;
    return {
      x: slot.x - slot.w / 2 + preview.col * cellW + 6,
      y: slot.y - slot.h / 2 + preview.row * cellH + 6,
      w: cellW * preview.width - 12,
      h: cellH * preview.height - 12,
      r: 20,
      baselineY: preview.y,
    };
  }

  previewPlacementLabel(preview) {
    const slot = this.findSlot(preview.slotId);
    if (!slot) return "";
    const parts = [];
    if ((slot.rows || 1) > 1) parts.push((preview.row || 0) === 0 ? this.i18n.ui.previewBack : this.i18n.ui.previewFront);
    if ((slot.stackLayers || 1) > 1 && (preview.layer || 0) > 0) parts.push(this.i18n.ui.previewStacked);
    return parts.join(" / ");
  }

  drawPlacementPreview(item, preview) {
    this.previewGraphic.clear();
    this.previewText.setVisible(false);
    if (this.previewSprite) this.previewSprite.setVisible(false);
    if (!preview) return;
    // Show preview for all placements now, not just valid ones
    if (!preview.inside && !preview.valid) return;
    const rect = this.placementRect(preview);
    if (!rect) return;

    // Score-based color: happy=green, ok=yellow, sad=red
    const sc = preview.score ?? 50;
    let palette;
    if (sc >= 70) {
      palette = { fill: 0x67edb8, line: 0xeafff7, fillAlpha: 0.14, lineAlpha: 0.9, lineWidth: 3 };
    } else if (sc >= 40) {
      palette = { fill: 0xffd166, line: 0xfff6cf, fillAlpha: 0.14, lineAlpha: 0.85, lineWidth: 3 };
    } else {
      palette = { fill: 0xff7d62, line: 0xffefe7, fillAlpha: 0.16, lineAlpha: 0.85, lineWidth: 3 };
    }

    const layerLift = Math.max(0, preview.layer || 0) * 10;
    const drawY = rect.y - layerLift;
    const footprint = this.previewFootprint(item, preview);
    this.previewGraphic.fillStyle(palette.fill, palette.fillAlpha);
    this.previewGraphic.lineStyle(palette.lineWidth, palette.line, palette.lineAlpha);
    this.previewGraphic.fillRoundedRect(rect.x, drawY, rect.w, rect.h, rect.r);
    this.previewGraphic.strokeRoundedRect(rect.x, drawY, rect.w, rect.h, rect.r);
    this.previewGraphic.lineStyle(2, palette.line, palette.lineAlpha * 0.85);
    this.previewGraphic.lineBetween(rect.x + 12, rect.baselineY, rect.x + rect.w - 12, rect.baselineY);
    this.previewGraphic.fillStyle(palette.line, preview.valid ? 0.62 : 0.56);
    this.previewGraphic.fillRoundedRect(footprint.x, footprint.y, footprint.w, footprint.h, 6);
    this.previewGraphic.fillStyle(palette.line, palette.lineAlpha);
    this.previewGraphic.fillCircle(preview.x, preview.y, 4);
    if ((preview.layer || 0) > 0) {
      this.previewGraphic.lineStyle(2, palette.line, palette.lineAlpha * 0.55);
      this.previewGraphic.lineBetween(preview.x, drawY, preview.x, rect.baselineY);
    }
    if (preview.support?.supportEntries?.length) {
      this.previewGraphic.fillStyle(preview.valid ? 0xeafff7 : 0xffefe7, 0.16);
      for (const support of preview.support.supportEntries) {
        this.previewGraphic.fillRoundedRect(support.x - 28, support.topY - 6, 56, 12, 6);
      }
    }

    // Mood emoji label
    const moodEmoji = preview.mood === "happy" ? "😊" : preview.mood === "ok" ? "😐" : "😟";
    const placementLabel = this.previewPlacementLabel(preview);
    const scoreLabel = `${moodEmoji} ${sc}%`;
    const dropHint = this.i18n.ui.dropHere;
    const supportText = preview.valid
      ? `${dropHint} · ${scoreLabel}${placementLabel ? ` · ${placementLabel}` : ""}`
      : (preview.alwaysPlaceable
        ? `${this.i18n.ui.dropHere} ${moodEmoji} ${sc}%`
        : this.translateReason(preview.reason || "reject.generic"));
    this.previewText
      .setText(supportText)
      .setPosition(preview.x, drawY - 8)
      .setVisible(true);
    if (this.previewSprite) {
      const tintColor = preview.mood === "happy" ? 0xa8ffe0 : preview.mood === "ok" ? 0xfff3c0 : 0xffb39f;
      this.previewSprite
        .setTexture(item.image)
        .setOrigin(item.anchor[0], item.anchor[1])
        .setScale(item.scale)
        .setPosition(preview.x, preview.y)
        .setTint(tintColor)
        .setAlpha(0.26)
        .setDepth(960)
        .setVisible(true);
    }
  }

  // ---- KILL-STYLE CALLOUT: big screen text + sound + shake ----
  playCallout(text, { color = "#ffd166", size = 52, shake = 0.004, sound = "fanfare" } = {}) {
    // Big text flying in from center
    const label = this.add.text(375, 500, text, {
      fontFamily: "Trebuchet MS, Impact, sans-serif",
      fontSize: size,
      color,
      fontStyle: "bold",
      stroke: "#1a0a00",
      strokeThickness: 8,
      shadow: { offsetX: 3, offsetY: 3, color: "#00000044", blur: 12, fill: true },
    }).setOrigin(0.5).setDepth(970).setAlpha(0).setScale(0.1);

    // Screen flash
    const flash = this.add.rectangle(375, 667, 750, 1334, 0xffffff, 0).setDepth(965);
    this.tweens.add({
      targets: flash,
      alpha: { from: 0.25, to: 0 },
      duration: 250,
      ease: "Quad.out",
      onComplete: () => flash.destroy(),
    });

    // Animate in
    this.tweens.add({
      targets: label,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.1, to: 1.15 },
      duration: 220,
      ease: "Back.out(3)",
      onComplete: () => {
        // Settle
        this.tweens.add({
          targets: label,
          scale: 1,
          duration: 100,
          ease: "Sine.out",
          onComplete: () => {
            // Hold then fade
            this.tweens.add({
              targets: label,
              alpha: 0,
              y: 440,
              scale: 0.9,
              duration: 500,
              delay: 600,
              ease: "Sine.in",
              onComplete: () => label.destroy(),
            });
          },
        });
      },
    });

    // Camera shake
    if (shake) this.cameras.main.shake(150, shake);

    // Sound
    if (sound === "fanfare") {
      this.events.emit("callout", "fanfare");
    } else if (sound === "snap") {
      this.events.emit("callout", "snap");
    }
  }

  // ---- WISH BUBBLE: makes each item's hidden preference legible on pickup ----
  describeWish(item) {
    const prefs = item.prefs || {};
    const w = this.i18n.ui;
    if (prefs.likesNeighbors && prefs.likesNeighbors.length) {
      const friend = prefs.likesNeighbors.find((k) => this.textures.exists(k)) || prefs.likesNeighbors[0];
      return { kind: "likes", text: w.wishLikes, friendKey: friend };
    }
    if (prefs.needsCold) return { kind: "cold", text: w.wishCold };
    if (prefs.zone && w.wishZone?.[prefs.zone]) return { kind: "zone", text: w.wishZone[prefs.zone] };
    if (prefs.likesVisible) return { kind: "visible", text: w.wishVisible };
    return null;
  }

  buildWishIcon(kind) {
    const g = this.add.graphics();
    if (kind === "cold") {
      g.lineStyle(3, 0x5fa8d3, 1);
      const r = 12;
      for (let i = 0; i < 3; i += 1) {
        const a = (Math.PI / 3) * i;
        g.beginPath();
        g.moveTo(-Math.cos(a) * r, -Math.sin(a) * r);
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        g.strokePath();
      }
    } else if (kind === "likes") {
      const s = 12;
      g.fillStyle(0xff6b8a, 1);
      g.fillCircle(-s * 0.42, -s * 0.18, s * 0.55);
      g.fillCircle(s * 0.42, -s * 0.18, s * 0.55);
      g.fillTriangle(-s * 0.92, s * 0.02, s * 0.92, s * 0.02, 0, s);
    }
    return g;
  }

  showWishBubble(obj, item) {
    this.hideWishBubble();
    const wish = this.describeWish(item);
    if (!wish) return;

    const container = this.add.container(0, 0).setDepth(990);
    const content = this.add.container(0, 0);
    container.add(content);

    const iconSize = 28;
    const thumbSize = 36;
    const gap = 9;
    let cursor = 0;

    if (wish.kind === "cold" || wish.kind === "likes") {
      const icon = this.buildWishIcon(wish.kind);
      icon.setPosition(cursor + iconSize / 2, 0);
      content.add(icon);
      cursor += iconSize + gap;
    }

    const label = this.add.text(cursor, 0, wish.text, {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 23,
      color: "#5b2c1d",
      fontStyle: "bold",
    }).setOrigin(0, 0.5);
    content.add(label);
    const hasThumb = wish.kind === "likes" && wish.friendKey && this.textures.exists(wish.friendKey);
    cursor += label.width + (hasThumb ? gap : 0);

    if (hasThumb) {
      const thumb = this.add.image(cursor + thumbSize / 2, 0, wish.friendKey);
      const scale = thumbSize / Math.max(thumb.width || 1, thumb.height || 1);
      thumb.setScale(scale);
      content.add(thumb);
      cursor += thumbSize;
    }

    const totalW = cursor;
    content.setX(-totalW / 2);

    const padX = 20;
    const halfH = 28;
    const bg = this.add.graphics();
    bg.fillStyle(0xfff8e6, 0.98);
    bg.lineStyle(3, 0xffffff, 0.92);
    bg.fillRoundedRect(-totalW / 2 - padX, -halfH, totalW + padX * 2, halfH * 2, 16);
    bg.strokeRoundedRect(-totalW / 2 - padX, -halfH, totalW + padX * 2, halfH * 2, 16);
    bg.fillStyle(0xfff8e6, 0.98);
    bg.fillTriangle(-10, halfH - 2, 10, halfH - 2, 0, halfH + 12);
    container.addAt(bg, 0);

    this.wishBubble = container;
    this.wishBubbleOffset = 82;
    container.setPosition(obj.x, obj.y - this.wishBubbleOffset);
    container.setScale(0.6);
    container.setAlpha(0);
    this.tweens.add({ targets: container, scale: 1, alpha: 1, duration: 190, ease: "Back.out(2)" });
  }

  updateWishBubble(obj) {
    if (!this.wishBubble) return;
    this.wishBubble.setPosition(obj.x, obj.y - (this.wishBubbleOffset || 82));
  }

  hideWishBubble() {
    if (!this.wishBubble) return;
    const bubble = this.wishBubble;
    this.wishBubble = null;
    this.tweens.killTweensOf(bubble);
    this.tweens.add({
      targets: bubble,
      alpha: 0,
      scale: 0.7,
      duration: 130,
      ease: "Sine.in",
      onComplete: () => bubble.destroy(),
    });
  }

  onDragStart(obj) {
    this.hintTimer?.remove?.();
    this.hintTimer = null;
    this.clearHintFx();
    if (this.onboardingActive) this.onboardingUserGrabbed_();
    this.dragItem = obj;
    obj.setDepth(980);
    this.tweens.add({ targets: obj, scale: obj.scale * 1.06, duration: 90, ease: "Sine.out" });
    const item = obj.getData("item");
    if (item) this.showWishBubble(obj, item);
  }

  onDrag(pointer, obj, x, y) {
    obj.setPosition(x, y);
    const item = obj.getData("item");
    if (!item) return;
    const home = obj.getData("home");
    const previewPoint = this.logicalDragPoint(item, pointer.worldX, pointer.worldY, home);
    const preview = this.engine.previewMove(item.id, previewPoint.x, previewPoint.y, this.level.tuning.magnetPreviewDistance);
    this.hoverPlacement = preview;
    this.drawPlacementPreview(item, preview);
    this.refreshHoverZone(preview?.slotId || null, !!preview?.valid, preview?.score ?? 50);
    this.updateWishBubble(obj, preview);
  }

  onDragEnd(obj) {
    const item = obj.getData("item");
    if (!item) return;
    const preview = this.hoverPlacement;
    this.clearHover();
    this.hideWishBubble();
    if (!preview) return this.returnHome(obj);

    // Only hard-reject for grid overflow / occupied space
    if (!preview.valid && !preview.alwaysPlaceable) {
      this.mistakeCount += 1;
      this.comboCount = 0;
      for (const conflictId of preview.conflicts || []) this.bumpPair(obj, this.sprites.get(conflictId));
      return this.returnHome(obj, this.translateReason(preview.reason || "reject.generic"));
    }

    const result = this.engine.placeItem(item.id, preview);
    if (!result.ok) {
      this.mistakeCount += 1;
      this.comboCount = 0;
      for (const [aId, bId] of result.conflicts || []) this.bumpPair(this.sprites.get(aId), this.sprites.get(bId));
      return this.returnHome(obj, this.translateReason(result.reason || "reject.generic"));
    }

    // Placement accepted — count combo if it's a good placement
    const score = result.score ?? 50;
    if (score >= 70) {
      this.comboCount += 1;
    } else if (score < 40) {
      this.mistakeCount += 1;
      this.comboCount = 0;
    }

    const entry = result.state.items[item.id];
    const display = this.displayPointFor(item, entry);
    const targetScale = this.displayScaleFor(item, entry);
    obj.setData("home", entry);

    // Show mood animation
    const mood = result.mood || "ok";
    this.showItemMood(display.x, display.y, mood, score);

    this.playPlacementPulse(preview.slotId, display.x, display.y, score >= 70 ? this.comboCount : 0);
    this.tweens.add({
      targets: obj,
      x: display.x,
      y: display.y,
      scaleX: targetScale * 1.05,
      scaleY: targetScale * 0.94,
      duration: Math.round(this.level.tuning.snapDuration * 0.72),
      ease: "Quad.out",
      onComplete: () => {
        this.tweens.add({
          targets: obj,
          scaleX: targetScale,
          scaleY: targetScale,
          duration: 90,
          ease: "Back.out",
          onComplete: () => {
            this.dragItem = null;
            this.sortItems();
          },
        });
      },
    });

    if (mood === "happy") {
      if (this.comboCount >= 7) {
        this.playCallout(this.i18n.ui.calloutUnstoppable, "fire");
        this.setToastMessage(this.i18n.ui.comboFire(this.comboCount));
      } else if (this.comboCount >= 5) {
        this.playCallout(this.i18n.ui.calloutOnFire, "fire");
        this.setToastMessage(this.i18n.ui.comboFire(this.comboCount));
      } else if (this.comboCount >= 3) {
        this.playCallout(this.i18n.ui.calloutGreat, "gold");
        this.setToastMessage(this.i18n.ui.comboFire(this.comboCount));
      } else if (this.comboCount >= 2) {
        this.playCallout(this.i18n.ui.calloutNice, "ice");
        this.setToastMessage(this.i18n.ui.comboNice);
      } else {
        this.setToastMessage(this.i18n.ui.snapOk);
      }
    } else if (mood === "sad") {
      this.setToastMessage(this.i18n.ui.placementMeh);
    } else {
      this.setToastMessage(this.i18n.ui.snapOk);
    }
    this.events.emit("snap", { item: item.id, image: item.image, slot: preview.slotId, combo: this.comboCount, score, mood });
    if (this.onboardingActive) this.finishOnboarding();

    // Fire chain reaction animation
    if (result.chain && result.chain.length) {
      this.playChainReaction(result.chain, item.id);
    }
  }

  showItemMood(x, y, mood, score) {
    const emoji = mood === "happy" ? "😊" : mood === "ok" ? "😐" : "😟";
    const color = mood === "happy" ? "#67edb8" : mood === "ok" ? "#ffd166" : "#ff7d62";
    const moodText = this.add.text(x, y - 50, `${emoji} ${score}%`, {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 22,
      color,
      fontStyle: "bold",
      stroke: "#2d1f14",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(955).setAlpha(0);

    // Halo ring
    const haloColor = mood === "happy" ? 0x67edb8 : mood === "ok" ? 0xffd166 : 0xff7d62;
    const halo = this.add.circle(x, y - 14, 20, haloColor, 0.18).setDepth(950);
    halo.setStrokeStyle(2, haloColor, 0.7);

    this.tweens.add({
      targets: [moodText],
      alpha: { from: 0, to: 1 },
      y: y - 70,
      scale: { from: 0.6, to: 1.1 },
      duration: 200,
      ease: "Back.out(1.5)",
      onComplete: () => {
        this.tweens.add({
          targets: [moodText],
          alpha: 0,
          y: y - 100,
          scale: 0.8,
          duration: 500,
          delay: 400,
          ease: "Sine.in",
          onComplete: () => moodText.destroy(),
        });
      },
    });

    this.tweens.add({
      targets: halo,
      alpha: { from: 0.8, to: 0 },
      scale: { from: 1, to: 1.6 },
      duration: 350,
      ease: "Sine.out",
      onComplete: () => halo.destroy(),
    });
  }

  // ---- CALLOUT: big animated text for "Double Kill" moments ----
  playCallout(text, style = "gold") {
    const configs = {
      gold: { color: "#ffd166", stroke: "#6b3a10", glow: 0xffd166, size: 56, shake: 0.003 },
      fire: { color: "#ff6b4a", stroke: "#4a1000", glow: 0xff6b4a, size: 62, shake: 0.005 },
      ice:  { color: "#67edb8", stroke: "#0a3a28", glow: 0x67edb8, size: 48, shake: 0.002 },
    };
    const cfg = configs[style] || configs.gold;

    const calloutLayer = this.add.layer().setDepth(970);
    const centerX = 375, centerY = 500;

    // Dark flash background
    const bgFlash = this.add.rectangle(centerX, centerY, 800, 1400, 0x000000, 0).setDepth(969);
    calloutLayer.add(bgFlash);
    this.tweens.add({
      targets: bgFlash,
      alpha: { from: 0, to: 0.15 },
      duration: 80,
      yoyo: true,
    });

    // Screen shake
    this.cameras.main.shake(150, cfg.shake);
    this.cameras.main.flash(100, cfg.glow >> 16 & 0xff, cfg.glow >> 8 & 0xff, cfg.glow & 0xff, false);

    // Main callout text
    const label = this.add.text(centerX, centerY, text, {
      fontFamily: "Trebuchet MS, Impact, sans-serif",
      fontSize: cfg.size,
      color: cfg.color,
      fontStyle: "bold",
      stroke: cfg.stroke,
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: cfg.color, blur: 20, fill: true },
    }).setOrigin(0.5).setDepth(971).setAlpha(0).setScale(0.2).setAngle(-8);
    calloutLayer.add(label);

    // Fly in
    this.tweens.add({
      targets: label,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.2, to: 1.25 },
      angle: { from: -8, to: 3 },
      duration: 250,
      ease: "Back.out(2.5)",
      onComplete: () => {
        // Settle
        this.tweens.add({
          targets: label,
          scale: 1.08,
          angle: 0,
          duration: 100,
          ease: "Sine.out",
          onComplete: () => {
            // Hold then fade out
            this.tweens.add({
              targets: label,
              alpha: 0,
              scale: 0.9,
              y: centerY - 30,
              duration: 350,
              delay: 500,
              ease: "Sine.in",
              onComplete: () => calloutLayer.destroy(),
            });
          },
        });
      },
    });

    // Glow ring expanding
    const glow = this.add.circle(centerX, centerY, 60, cfg.glow, 0.12).setDepth(970);
    calloutLayer.add(glow);
    this.tweens.add({
      targets: glow,
      alpha: 0,
      scale: 4,
      duration: 700,
      ease: "Sine.out",
      onComplete: () => glow.destroy(),
    });

    // Small sparkles around
    for (let i = 0; i < 10; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 80;
      const spark = this.add.circle(
        centerX + Math.cos(angle) * dist * 0.3,
        centerY + Math.sin(angle) * dist * 0.3,
        2 + Math.random() * 3,
        cfg.glow, 0.9,
      ).setDepth(971);
      calloutLayer.add(spark);
      this.tweens.add({
        targets: spark,
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        alpha: 0,
        duration: 500 + Math.random() * 400,
        delay: Math.random() * 150,
        ease: "Quad.out",
        onComplete: () => spark.destroy(),
      });
    }

    // Emit for sound
    this.game.events.emit("callout", { text, style });
    return calloutLayer;
  }

  playChainReaction(chain, placedItemId) {
    if (!chain || !chain.length) return;

    const chainLayer = this.add.layer().setDepth(948);

    chain.forEach((link, index) => {
      const sprite = this.sprites.get(link.itemId);
      if (!sprite) return;

      const delay = 200 + index * 320;

      // BIG golden ring (2x bigger than before)
      this.time.delayedCall(delay, () => {
        const ring = this.add.circle(sprite.x, sprite.y, 36, 0xffd166, 0.28).setDepth(949);
        ring.setStrokeStyle(4, 0xfff9e8, 0.95);
        chainLayer.add(ring);
        this.tweens.add({
          targets: ring,
          alpha: 0,
          scale: 2.5,
          duration: 550,
          ease: "Sine.out",
          onComplete: () => ring.destroy(),
        });

        // Inner flash
        const flash = this.add.circle(sprite.x, sprite.y, 20, 0xffffff, 0.4).setDepth(950);
        chainLayer.add(flash);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 3,
          duration: 300,
          ease: "Quad.out",
          onComplete: () => flash.destroy(),
        });
      });

      // Item bounce
      this.tweens.add({
        targets: sprite,
        scaleX: sprite.scaleX * 1.2,
        scaleY: sprite.scaleY * 1.2,
        y: sprite.y - 12,
        duration: 150,
        delay,
        yoyo: true,
        ease: "Back.out(2.5)",
      });

      // Big "+15" score popup
      this.time.delayedCall(delay + 40, () => {
        const label = this.add.text(sprite.x, sprite.y - 50, `+${link.bonus}`, {
          fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
          fontSize: 30,
          color: "#ffd166",
          fontStyle: "bold",
          stroke: "#3b2010",
          strokeThickness: 4,
        }).setOrigin(0.5).setDepth(955).setAlpha(0).setScale(0.3);
        chainLayer.add(label);
        this.tweens.add({
          targets: label,
          alpha: { from: 0, to: 1 },
          y: sprite.y - 88,
          scale: { from: 0.3, to: 1.2 },
          duration: 200,
          ease: "Back.out(2)",
          onComplete: () => {
            this.tweens.add({
              targets: label,
              alpha: 0,
              y: sprite.y - 120,
              scale: 0.7,
              duration: 400,
              delay: 300,
              ease: "Sine.in",
              onComplete: () => label.destroy(),
            });
          },
        });
      });
    });

    // BIG center callout for chains
    if (chain.length >= 4) {
      this.time.delayedCall(200 + chain.length * 320, () => {
        this.playCallout(this.i18n.ui.calloutAmazing, "fire");
      });
    } else if (chain.length >= 3) {
      this.time.delayedCall(200 + chain.length * 320, () => {
        this.playCallout(this.i18n.ui.calloutPerfect, "gold");
      });
    } else if (chain.length >= 2) {
      this.time.delayedCall(200 + chain.length * 320, () => {
        this.playCallout(this.i18n.ui.calloutNice, "ice");
      });
      this.setToastMessage(this.i18n.ui.chainNice(chain.length, chain.reduce((s, c) => s + c.bonus, 0)));
    } else {
      this.setToastMessage(this.i18n.ui.chainOne(chain[0].bonus));
    }

    this.time.delayedCall(300 + chain.length * 320 + 1500, () => chainLayer.destroy());
  }

  playMissFeedback(x, y) {
    const ring = this.add.circle(x, y - 18, 12, 0xff8b76, 0.18).setDepth(950);
    ring.setStrokeStyle(3, 0xff8b76, 0.75);
    const crossA = this.add.rectangle(x, y - 18, 18, 3, 0xfff0ea, 0.92).setDepth(951).setAngle(45);
    const crossB = this.add.rectangle(x, y - 18, 18, 3, 0xfff0ea, 0.92).setDepth(951).setAngle(-45);
    this.tweens.add({
      targets: [ring, crossA, crossB],
      alpha: { from: 1, to: 0 },
      scaleX: { from: 1, to: 1.18 },
      scaleY: { from: 1, to: 1.18 },
      y: "-=6",
      duration: 190,
      ease: "Quad.out",
      onComplete: () => {
        ring.destroy();
        crossA.destroy();
        crossB.destroy();
      },
    });
  }

  playPlacementPulse(slotId, x, y, combo = 1) {
    const slot = this.findSlot(slotId);
    const burstLayer = this.add.layer().setDepth(950);
    const isBigCombo = combo >= 5;
    const isMidCombo = combo >= 3;
    const ringRadius = isBigCombo ? 28 : isMidCombo ? 22 : 18;
    const ringColor = isBigCombo ? 0xffd166 : isMidCombo ? 0xffe28c : 0x67edb8;
    const ringLineColor = isBigCombo ? 0xfff6cf : isMidCombo ? 0xfff8df : 0xeafff7;
    const ring = this.add.circle(x, y - 14, ringRadius, ringColor, 0.14);
    ring.setStrokeStyle(isBigCombo ? 5 : 3, ringLineColor, isBigCombo ? 0.95 : 0.88);
    burstLayer.add(ring);

    if (slot) {
      const halo = this.add.graphics();
      halo.fillStyle(ringColor, isBigCombo ? 0.16 : 0.1);
      halo.lineStyle(isBigCombo ? 4 : 3, ringLineColor, isBigCombo ? 0.9 : 0.82);
      halo.fillRoundedRect(slot.x - slot.w / 2 + 8, slot.y - slot.h / 2 + 8, slot.w - 16, slot.h - 16, 18);
      halo.strokeRoundedRect(slot.x - slot.w / 2 + 8, slot.y - slot.h / 2 + 8, slot.w - 16, slot.h - 16, 18);
      burstLayer.add(halo);
      this.tweens.add({
        targets: halo,
        alpha: { from: 0.9, to: 0 },
        duration: isBigCombo ? 320 : 210,
        ease: "Sine.out",
        onComplete: () => halo.destroy(),
      });
    }

    const sparkCount = isBigCombo ? 8 : isMidCombo ? 6 : 4;
    for (let i = 0; i < sparkCount; i += 1) {
      const angle = (Math.PI * 2 * i) / sparkCount - Math.PI / 2;
      const dist = isBigCombo ? 32 + Math.random() * 20 : 26;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const spark = this.add.circle(x, y - 12, isBigCombo ? 5 : isMidCombo ? 4 : 3, 0xfff8df, 0.95).setDepth(951);
      burstLayer.add(spark);
      this.tweens.add({
        targets: spark,
        x: x + dx,
        y: y - 12 + dy,
        alpha: { from: 0.95, to: 0 },
        scale: { from: 1, to: 0.5 },
        duration: isBigCombo ? 280 : 210,
        delay: i * 15,
        ease: "Quad.out",
        onComplete: () => spark.destroy(),
      });
    }

    // Combo number popup for mid+ combos
    if (isMidCombo) {
      const comboText = this.add.text(x, y - 60, `x${combo}`, {
        fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
        fontSize: isBigCombo ? 42 : 34,
        color: isBigCombo ? "#ffd166" : "#ffb85c",
        fontStyle: "bold",
        stroke: "#4a2c16",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(955).setAlpha(0);
      burstLayer.add(comboText);
      this.tweens.add({
        targets: comboText,
        alpha: { from: 0, to: 1 },
        y: y - 80,
        scale: { from: 0.5, to: 1.15 },
        duration: 180,
        ease: "Back.out(1.7)",
        onComplete: () => {
          this.tweens.add({
            targets: comboText,
            alpha: 0,
            y: y - 110,
            scale: 0.8,
            duration: 400,
            delay: 200,
            ease: "Sine.in",
            onComplete: () => comboText.destroy(),
          });
        },
      });
    }

    this.tweens.add({
      targets: ring,
      alpha: { from: 0.9, to: 0 },
      scale: { from: 1, to: isBigCombo ? 2.0 : 1.55 },
      duration: isBigCombo ? 320 : 210,
      ease: "Sine.out",
      onComplete: () => {
        ring.destroy();
        burstLayer.destroy();
      },
    });

    // Camera shake on big combos
    if (combo >= 7) {
      this.cameras.main.shake(100, 0.003);
    } else if (combo >= 5) {
      this.cameras.main.shake(60, 0.0015);
    }
  }

  refreshHoverZone(slotId, valid, score = 50) {
    this.slots.forEach((slot) => {
      const selected = slot.id === slotId;
      let line;
      if (score >= 70) line = 0x65e7b3;
      else if (score >= 40) line = 0xffd166;
      else line = 0xff8667;
      slot.marker
        .setScale(selected ? 1.02 : 1)
        .setFillStyle(selected ? line : 0x61e7b0, selected ? 0.16 : 0.001)
        .setStrokeStyle(selected ? 5 : 3, selected ? line : 0x72efc0, selected ? 0.92 : (this.editMode ? 0.7 : 0));
    });
  }

  bumpPair(a, b) {
    if (!a) return;
    this.tweens.add({ targets: a, x: a.x - 12, duration: 80, yoyo: true, repeat: 1 });
    if (!b) return;
    this.tweens.add({ targets: b, x: b.x + 12, angle: 4, duration: 80, yoyo: true, repeat: 1 });
  }

  returnHome(obj, message = null) {
    const resolved = message || this.i18n.ui.dropCorrect;
    const home = obj.getData("home");
    const item = obj.getData("item");
    const trayHome = home?.status === "outside"
      ? { ...home, x: item.trayX ?? home.x, y: item.trayY ?? home.y }
      : home;
    const display = this.displayPointFor(item, trayHome);
    const targetScale = this.displayScaleFor(item, trayHome);
    if (trayHome.status !== "packed") {
      this.engine.moveOutside(item.id, trayHome.x, trayHome.y);
    }
    obj.setData("home", this.engine.snapshot().items[item.id] || trayHome);
    this.playMissFeedback(obj.x, obj.y);
    this.tweens.add({
      targets: obj,
      x: display.x,
      y: display.y,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 220,
      ease: "Sine.out",
      onComplete: () => { this.dragItem = null; },
    });
    this.setToastMessage(resolved);
    this.events.emit("miss", { message: resolved, reason: message });
  }

  clearHover() {
    this.hintTimer?.remove?.();
    this.hintTimer = null;
    this.clearHintFx();
    this.previewGraphic.clear();
    this.previewText.setVisible(false);
    if (this.previewSprite) this.previewSprite.setVisible(false);
    this.slots.forEach((slot) => {
      slot.marker
        .setScale(1)
        .setFillStyle(0x61e7b0, 0.001)
        .setStrokeStyle(3, 0x72efc0, this.editMode ? 0.7 : 0);
    });
    this.hoverPlacement = null;
    if (this.editMode) this.refreshSlotVisuals();
  }

  showHint() {
    // Reworked hint: instead of solving the puzzle, REVEAL one unsatisfied
    // item's wish and gently spotlight that item. The player still has to
    // reason out WHERE it should go.
    const state = this.engine.snapshot();

    // 1) Prefer an unhappy PLACED item; 2) else a not-yet-placed item.
    const placedRanked = Object.entries(state.items)
      .filter(([, e]) => e.status === "packed" && !e.fixed)
      .map(([id, e]) => ({ id, entry: e, score: this.engine.scorePlacement(id, e, state).score }))
      .filter((r) => r.score < StorageEngine.HAPPY_THRESHOLD)
      .sort((a, b) => a.score - b.score);

    let targetId = placedRanked[0]?.id || null;
    if (!targetId) {
      const outside = this.engine.firstOutsideMovableItem();
      targetId = outside?.id || null;
    }
    if (!targetId) {
      this.setToastMessage(this.i18n.ui.hintUnavailable);
      return { ok: false, message: this.i18n.ui.hintUnavailable };
    }

    const item = this.engine.itemDef(targetId);
    const itemName = item?.name || this.i18n.tItem(item?.image, targetId);
    const sprite = this.sprites.get(targetId);

    // Build the wish description (reuse the pickup wish logic).
    const wish = this.describeWish(item);
    let wishText = wish?.text || this.i18n.ui.wishVisible;
    if (wish?.kind === "likes" && wish.friendKey) {
      wishText = `${wish.text} (${this.i18n.tItem(wish.friendKey, wish.friendKey)})`;
    }
    this.setToastMessage(`${itemName}: ${wishText}`);

    // Gentle golden pulse on the item so the player knows who is talking —
    // but we do NOT show where it should go.
    if (sprite) {
      this.clearRemainingSpotlight();
      const baseScale = this.displayScaleFor(item, sprite.getData("home"));
      this.tweens.add({
        targets: sprite,
        scaleX: baseScale * 1.12,
        scaleY: baseScale * 1.12,
        duration: 200,
        yoyo: true,
        repeat: 1,
        ease: "Sine.inOut",
        onStart: () => sprite.setTint(0xffe08a),
        onComplete: () => { sprite.clearTint(); sprite.setScale(baseScale); },
      });
      const ring = this.add.circle(sprite.x, sprite.y - 14, 26, 0xffd166, 0.16).setDepth(949);
      ring.setStrokeStyle(3, 0xffd166, 0.85);
      this.tweens.add({ targets: ring, alpha: 0, scale: 1.9, duration: 620, ease: "Sine.out", onComplete: () => ring.destroy() });
      // Show the item's wish bubble briefly.
      this.showWishBubble(sprite, item);
      this.hintTimer?.remove?.();
      this.hintTimer = this.time.delayedCall(2200, () => { if (this.dragItem !== sprite) this.hideWishBubble(); });
    }

    return { ok: true, itemId: targetId, revealedWish: true };
  }

  findAlternativePlacement(itemId) {
    const current = this.engine.state.items[itemId];
    if (!current || current.status !== "packed") return null;

    let best = null;
    let bestScore = -1;
    const currentPlacement = { slotId: current.slotId, col: current.col, row: current.row, layer: current.layer };

    for (const slot of this.level.slots) {
      // Skip current slot
      if (slot.id === current.slotId) continue;
      const { cols, rows } = this.engine.slotGrid(slot);
      const { w, h } = this.engine.itemSize(itemId);
      const maxCol = cols - w;
      const maxRow = rows - h;
      if (maxCol < 0 || maxRow < 0) continue;

      for (let row = 0; row <= maxRow; row += 1) {
        for (let col = 0; col <= maxCol; col += 1) {
          const placement = { slotId: slot.id, col, row, layer: 0 };
          const evaluation = this.engine.evaluatePlacement(itemId, placement);
          if (!evaluation.valid) continue;
          const score = evaluation.score ?? 0;
          if (score > bestScore) {
            bestScore = score;
            const anchor = this.engine.placementAnchor({ ...placement, itemId });
            best = {
              slotId: slot.id,
              zoneId: slot.zone,
              col,
              row,
              layer: 0,
              x: anchor.x,
              y: anchor.y,
              width: w,
              height: h,
              valid: true,
              score,
              mood: evaluation.mood,
              inside: true,
            };
          }
        }
      }
    }
    return best;
  }

  performUndo() {
    const result = this.engine.undo();
    if (!result.ok) {
      this.setToastMessage(this.i18n.ui.undoNone);
      return { ok: false };
    }
    const sprite = this.sprites.get(result.itemId);
    if (sprite) {
      const item = sprite.getData("item");
      const display = this.displayPointFor(item, result.entry);
      const targetScale = this.displayScaleFor(item, result.entry);
      sprite.setData("home", result.entry);
      sprite.setTint(0xfff3c0);
      this.tweens.add({
        targets: sprite,
        x: display.x,
        y: display.y,
        scaleX: targetScale,
        scaleY: targetScale,
        duration: 220,
        ease: "Sine.out",
        onComplete: () => {
          sprite.clearTint();
          this.sortItems();
        },
      });
    }
    this.setToastMessage(this.i18n.ui.undoOk);
    this.events.emit("hud", { placed: this.engine.validate().packed, total: this.engine.validate().total });
    return { ok: true };
  }

  performSkip() {
    this.engine.skipLevel();
    const validation = this.engine.validate();
    this.winSent = true;
    this.completionPolishStarted = true;
    this.playCompletionPolish(1);
    this.time.delayedCall(600, () => {
      const reward = Math.floor((this.level.reward || 50) * 0.5);
      window.dispatchEvent(new CustomEvent("game-success", { detail: { score: 50, gold: reward, stars: 1, mistakes: 0, harmony: validation.totalScore || 0 } }));
      this.game.events.emit("game-success", { score: 50, gold: reward, stars: 1, mistakes: 0, harmony: validation.totalScore || 0 });
    });
    return { ok: true };
  }

  showBestSpot() {
    const hint = this.engine.bestHintForNext();
    if (!hint) {
      this.setToastMessage(this.i18n.ui.hintUnavailable);
      return { ok: false, message: this.i18n.ui.hintUnavailable };
    }
    const item = this.level.items.find((entry) => entry.id === hint.itemId);
    if (!item) {
      this.setToastMessage(this.i18n.ui.hintUnavailable);
      return { ok: false, message: this.i18n.ui.hintUnavailable };
    }
    this.drawPlacementPreview(item, hint);
    this.refreshHoverZone(hint.slotId, true, hint.score);
    this.playPlacementPulse(hint.slotId, hint.x, hint.y);

    // Highlight source item
    const sprite = this.sprites.get(hint.itemId);
    if (sprite) {
      const baseScale = sprite.scaleX;
      this.tweens.add({
        targets: sprite,
        scaleX: baseScale * 1.1,
        scaleY: baseScale * 1.1,
        duration: 200,
        yoyo: true,
        repeat: 2,
        ease: "Sine.inOut",
        onStart: () => sprite.setTint(0x67edb8),
        onComplete: () => { sprite.clearTint(); sprite.setScale(baseScale); },
      });
    }
    const itemName = item.name || this.i18n.tItem(item.image, item.image);
    const slot = this.findSlot(hint.slotId);
    const zoneLabel = slot ? this.i18n.tZone(slot.zone) : "";
    this.setToastMessage(this.i18n.ui.bestSpotGuide(itemName, zoneLabel, hint.score));
    this.hintTimer?.remove?.();
    this.hintTimer = this.time.delayedCall(2500, () => { if (!this.dragItem) this.clearHover(); });
    return { ok: true, itemId: hint.itemId, slotId: hint.slotId, score: hint.score };
  }

  clearRemainingSpotlight() {
    if (!this.remainingSpotlightId) return;
    const sprite = this.sprites.get(this.remainingSpotlightId);
    if (sprite) {
      this.tweens.killTweensOf(sprite);
      const item = sprite.getData("item");
      const home = sprite.getData("home");
      const baseScale = this.displayScaleFor(item, home);
      sprite.clearTint().setAlpha(1).setAngle(0).setScale(baseScale);
      if (home?.status === "outside") {
        const display = this.displayPointFor(item, home);
        sprite.setPosition(display.x, display.y);
      }
    }
    this.remainingSpotlightId = null;
  }

  updateRemainingSpotlight(validation) {
    const movable = this.level.items.filter((item) => !item.fixed);
    const remaining = movable.filter((item) => this.engine.state.items[item.id]?.status !== "packed");
    const remainingId = validation.complete || remaining.length !== 1 ? null : remaining[0].id;

    if (this.remainingSpotlightId && this.remainingSpotlightId !== remainingId) {
      this.clearRemainingSpotlight();
    }
    if (!remainingId || this.remainingSpotlightId === remainingId) return;

    const sprite = this.sprites.get(remainingId);
    if (!sprite) return;
    const item = sprite.getData("item");
    const home = sprite.getData("home");
    const baseScale = this.displayScaleFor(item, home);
    this.remainingSpotlightId = remainingId;
    sprite.setTint(0xffefad);
    this.tweens.add({
      targets: sprite,
      scaleX: baseScale * 1.08,
      scaleY: baseScale * 1.08,
      y: sprite.y - 8,
      duration: 620,
      ease: "Sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }

  sortItems() {
    for (const child of this.itemLayer.getChildren()) {
      if (child === this.previewSprite) {
        child.setDepth(960);
        continue;
      }
      const home = child.getData("home");
      const item = child.getData("item");
      const targetScale = this.displayScaleFor(item, home);
      if (child !== this.previewSprite && child.getData("item")?.id !== this.remainingSpotlightId) {
        child.clearTint();
      }
      if (Math.abs(child.scaleX - targetScale) > 0.001 || Math.abs(child.scaleY - targetScale) > 0.001) {
        child.setScale(targetScale);
      }
      if (home?.status === "packed" && home?.depth != null) {
        child.setDepth(home.depth);
        continue;
      }
      if (home?.status === "outside") {
        child.setDepth(420 + (item?.trayY || child.y) * 0.01);
        continue;
      }
      child.setDepth(100 + child.y + ((home?.layer || 0) * 6));
    }
  }

  // ---- MOOD BADGES: persistent face on each placed item so the player can
  // SEE the consequence of every placement (happy / neutral / sad). ----
  buildMoodFace(mood) {
    const c = this.add.container(0, 0);
    const bgColor = mood === "happy" ? 0x67edb8 : mood === "sad" ? 0xff9f8a : 0xffd166;
    const disc = this.add.circle(0, 0, 15, bgColor, 1).setStrokeStyle(3, 0xffffff, 0.95);
    c.add(disc);
    const ink = 0x4a2c1d;
    if (mood === "happy") {
      c.add(this.add.circle(-5, -3, 2.2, ink));
      c.add(this.add.circle(5, -3, 2.2, ink));
      const smile = this.add.graphics();
      smile.lineStyle(2.4, ink, 1);
      smile.beginPath();
      smile.arc(0, 1, 6, 0.15 * Math.PI, 0.85 * Math.PI, false);
      smile.strokePath();
      c.add(smile);
    } else if (mood === "sad") {
      c.add(this.add.circle(-5, -2, 2.2, ink));
      c.add(this.add.circle(5, -2, 2.2, ink));
      const frown = this.add.graphics();
      frown.lineStyle(2.4, ink, 1);
      frown.beginPath();
      frown.arc(0, 8, 6, 1.15 * Math.PI, 1.85 * Math.PI, false);
      frown.strokePath();
      c.add(frown);
    } else {
      c.add(this.add.circle(-5, -2, 2.2, ink));
      c.add(this.add.circle(5, -2, 2.2, ink));
      const line = this.add.graphics();
      line.lineStyle(2.4, ink, 1);
      line.beginPath();
      line.moveTo(-5, 5);
      line.lineTo(5, 5);
      line.strokePath();
      c.add(line);
    }
    return c;
  }

  updateMoodBadges(moods) {
    if (!this.moodBadges) this.moodBadges = new Map();
    const seen = new Set();

    for (const [itemId, mood] of Object.entries(moods)) {
      const sprite = this.sprites.get(itemId);
      if (!sprite) continue;
      // Don't badge the item currently being dragged (its wish bubble shows instead).
      if (this.dragItem === sprite) continue;
      const entry = sprite.getData("home");
      // Only show badges for items actually placed inside the fridge.
      if (!entry || entry.status !== "packed") continue;
      seen.add(itemId);

      let record = this.moodBadges.get(itemId);
      if (!record || record.mood !== mood) {
        record?.container.destroy();
        const container = this.buildMoodFace(mood).setDepth(970);
        this.moodBadges.set(itemId, { container, mood });
        record = this.moodBadges.get(itemId);
        // Pop in when the mood is (re)assigned.
        container.setScale(0);
        this.tweens.add({ targets: container, scale: 1, duration: 220, ease: "Back.out(2.4)" });
      }
      const b = sprite.getBounds();
      record.container.setPosition(b.right - 6, b.top + 8);
    }

    // Remove badges for items no longer placed.
    for (const [itemId, record] of this.moodBadges) {
      if (!seen.has(itemId)) {
        record.container.destroy();
        this.moodBadges.delete(itemId);
      }
    }
  }

  playCompletionPolish(stars = 1) {
    if (this.completionPolishStarted) return;
    this.completionPolishStarted = true;
    this.cameras.main.zoomTo(1.025, 220, "Sine.easeOut");
    this.time.delayedCall(260, () => this.cameras.main.zoomTo(1, 220, "Sine.easeInOut"));
    this.cameras.main.flash(180, 255, 246, 210, false);
    const glow = this.add.graphics().setDepth(540);
    glow.fillGradientStyle(0xffffff, 0xfff4ba, 0xffffff, 0xffe9a5, 0, 0.38, 0, 0.18);
    glow.fillRoundedRect(76, 248, 600, 788, 44);
    glow.setAlpha(0);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0, to: 0.55 },
      duration: 260,
      yoyo: true,
      ease: "Sine.inOut",
      onComplete: () => glow.destroy(),
    });
    this.time.delayedCall(220, () => this.cameras.main.flash(120, 255, 251, 228, false));
    const sweep = this.add.rectangle(-140, 642, 180, 980, 0xffffff, 0.14).setDepth(545);
    sweep.setAngle(-18);
    this.tweens.add({
      targets: sweep,
      x: 900,
      alpha: { from: 0, to: 0.18 },
      duration: 620,
      ease: "Sine.inOut",
      onComplete: () => sweep.destroy(),
    });
    for (const sprite of this.sprites.values()) {
      const home = sprite.getData("home");
      if (home?.status !== "packed") continue;
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 5,
        duration: 150,
        yoyo: true,
        ease: "Sine.inOut",
      });
      this.tweens.add({
        targets: sprite,
        scaleX: sprite.scaleX * 1.03,
        scaleY: sprite.scaleY * 1.03,
        duration: 150,
        yoyo: true,
        ease: "Quad.out",
      });
    }

    // Star reveal animation
    const starLayer = this.add.layer().setDepth(560);
    const starTexts = [];
    for (let i = 0; i < 3; i += 1) {
      const earned = i < stars;
      const starX = 375 + (i - 1) * 64;
      const starY = 260;
      const star = this.add.text(starX, starY, "★", {
        fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
        fontSize: 52,
        color: earned ? "#ffd166" : "#d4c8b8",
        stroke: earned ? "#c8960c" : "#b0a090",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(561).setAlpha(0).setScale(0.3);
      starLayer.add(star);
      starTexts.push({ star, earned, delay: 350 + i * 200 });
    }

    starTexts.forEach(({ star, earned, delay }) => {
      this.tweens.add({
        targets: star,
        alpha: 1,
        scale: earned ? 1.15 : 0.85,
        duration: 280,
        delay,
        ease: "Back.out(2)",
        onComplete: () => {
          if (earned) {
            this.tweens.add({
              targets: star,
              scale: 1,
              duration: 120,
              ease: "Sine.out",
            });
          }
        },
      });
    });

    // Every win deserves a burst — intensity scales with stars so 1-star still
    // feels celebratory and 3-star feels spectacular.
    this.time.delayedCall(650, () => this.burstConfetti(stars));

    this.setToastMessage(stars >= 3 ? this.i18n.ui.successPerfect : this.i18n.ui.successTag);
  }

  // Confetti + streamer burst for level completion. Count/spread scale with stars.
  burstConfetti(stars = 1) {
    const palette = [0xffd166, 0xff6b6b, 0x67edb8, 0x89c4ff, 0xffb347, 0xff8fc7];
    const count = 22 + stars * 16;
    const layer = this.add.layer().setDepth(562);
    // Two side cannons firing toward the center-top, plus a light top sprinkle.
    const cannons = [
      { x: 90, y: 470, vx: 1, spread: 0.5 },
      { x: 660, y: 470, vx: -1, spread: 0.5 },
    ];
    for (let i = 0; i < count; i += 1) {
      const cannon = cannons[i % cannons.length];
      const color = palette[Math.floor(Math.random() * palette.length)];
      const isStrip = Math.random() > 0.45;
      const startX = cannon.x + (Math.random() - 0.5) * 40;
      const startY = cannon.y + (Math.random() - 0.5) * 40;
      const piece = isStrip
        ? this.add.rectangle(startX, startY, 6 + Math.random() * 5, 12 + Math.random() * 8, color, 0.95)
        : this.add.circle(startX, startY, 3 + Math.random() * 4, color, 0.95);
      layer.add(piece);
      const launchX = cannon.vx * (160 + Math.random() * 260);
      const apex = 220 + Math.random() * 160;
      // Arc up-and-out, then fall with gravity-like ease and fade.
      this.tweens.add({
        targets: piece,
        x: startX + launchX,
        y: startY - apex,
        angle: (Math.random() - 0.5) * 540,
        duration: 480 + Math.random() * 220,
        ease: "Quad.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: piece,
            y: startY - apex + 520 + Math.random() * 220,
            x: piece.x + (Math.random() - 0.5) * 120,
            angle: piece.angle + (Math.random() - 0.5) * 540,
            alpha: 0,
            duration: 900 + Math.random() * 500,
            ease: "Quad.easeIn",
            onComplete: () => piece.destroy(),
          });
        },
      });
    }
    this.time.delayedCall(2600, () => layer.destroy());
  }

  renderState(state, validation) {
    this.updateChrome({
      placed: validation.packed,
      total: validation.total,
      harmonyScore: validation.totalScore,
      happyCount: validation.happyCount,
      happyGoal: validation.happyGoal,
    });
    this.updateMoodBadges(validation.moods || {});
    this.events.emit("hud", { placed: validation.packed, total: validation.total });
    for (const [itemId, entry] of Object.entries(state.items)) {
      const sprite = this.sprites.get(itemId);
      if (!sprite || this.dragItem === sprite) continue;
      const item = sprite.getData("item");
      const display = this.displayPointFor(item, entry);
      if (Math.abs(sprite.x - display.x) > 0.5 || Math.abs(sprite.y - display.y) > 0.5) {
        sprite.setPosition(display.x, display.y);
      }
      sprite.setData("home", entry);
    }
    this.sortItems();
    this.updateRemainingSpotlight(validation);
    // If all items placed but target not met, tell the player
    if (validation.allPlaced && !validation.goalMet && !validation.complete && !this.winSent) {
      this.setToastMessage(this.i18n.ui.happyRearrange(validation.happyCount || 0, validation.happyGoal || 0));
    }
    if (validation.complete && !this.winSent) {
      this.clearRemainingSpotlight();
      this.winSent = true;
      // Star rating based on how many foods are happy:
      // 1★ = reached the goal, 2★ = beat it, 3★ = every food is happy.
      const happy = validation.happyCount || 0;
      const goal = validation.happyGoal || 0;
      const all = validation.happyTotal || 0;
      let stars = 1;
      if (happy >= all) stars = 3;
      else if (happy >= goal + 1) stars = 2;
      const score = validation.totalScore || 0;
      this.playCompletionPolish(stars);
      // Kill-style callout on completion
      this.time.delayedCall(400, () => {
        if (stars >= 3) {
          this.playCallout(this.i18n.ui.calloutFlawless, "fire");
        } else if (stars >= 2) {
          this.playCallout(this.i18n.ui.calloutPerfectEnd, "gold");
        }
      });
      this.time.delayedCall(780, () => {
        const reward = this.level.reward || 50;
        const starBonus = (stars - 1) * Math.floor(reward * 0.5);
        const totalGold = reward + starBonus;
        window.dispatchEvent(new CustomEvent("game-success", { detail: { score: 100, gold: totalGold, stars, mistakes: this.mistakeCount, harmony: score } }));
        this.game.events.emit("game-success", { score: 100, gold: totalGold, stars, mistakes: this.mistakeCount, harmony: score });
      });
    }
  }

  exportLevel() {
    return JSON.stringify({
      ...this.level,
      slots: this.slots.map(({ marker, guide, label, ...slot }) => slot),
    }, null, 2);
  }
}
