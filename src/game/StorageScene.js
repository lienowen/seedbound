import Phaser from "phaser";
import { STORAGE_LEVEL } from "../levels/fridgePhaserLevel.js";
import { StorageEngine } from "./StorageEngine.js";
import { createI18n } from "../i18n/index.js";

const ASSET = `${import.meta.env.BASE_URL}assets/tidy/`;
const PREVIEW_COLORS = {
  good: { fill: 0x67edb8, line: 0xeafff7, fillAlpha: 0.12, lineAlpha: 0.88, lineWidth: 3 },
  bad: { fill: 0xff7d62, line: 0xffefe7, fillAlpha: 0.14, lineAlpha: 0.82, lineWidth: 3 },
};
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
      this.load.image(item.image, `${ASSET}${item.image}.png`);
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
    this.titleText = this.add.text(375, 104, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 36,
      color: "#6a341d",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5, 0);
    this.subtitleText = this.add.text(375, 148, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 16,
      color: "#9d7154",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5, 0);
    this.goalBg = this.add.graphics().setDepth(510);
    this.goalLabel = this.add.text(48, 196, this.i18n.ui.metaLabel, {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 18,
      color: "#2c9b7f",
      fontStyle: "bold",
    }).setOrigin(0, 0.5).setDepth(512);
    this.goalText = this.add.text(118, 196, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 18,
      color: "#7a5438",
      fontStyle: "bold",
      wordWrap: { width: 560 },
      maxLines: 2,
      lineSpacing: 4,
    }).setOrigin(0, 0.5).setDepth(512);
    this.toastBg = this.add.graphics().setDepth(510);
    this.toastText = this.add.text(375, 1238, "", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: 24,
      color: "#70432a",
      fontStyle: "bold",
      align: "center",
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
    const cardH = twoLine ? 72 : 54;
    const cardY = 168;
    const centerY = cardY + cardH / 2;
    this.goalBg?.clear();
    this.goalBg?.fillStyle(0xffffff, 1.0);
    this.goalBg?.lineStyle(3, 0x2ca184, 0.8);
    this.goalBg?.fillRoundedRect(34, cardY, 682, cardH, 22);
    this.goalBg?.strokeRoundedRect(34, cardY, 682, cardH, 22);
    this.goalLabel?.setY(centerY);
    this.goalText?.setY(centerY);
    this.goalText?.setText(text);
  }

  updateChrome(patch = {}) {
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
    this.toastBg?.clear();
    this.toastBg?.fillStyle(0x5b2c1d, 0.95);
    this.toastBg?.lineStyle(3, 0xffffff, 0.8);
    this.toastBg?.fillRoundedRect(20, 1208, 710, 60, 20);
    this.toastBg?.strokeRoundedRect(20, 1208, 710, 60, 20);
    this.toastText?.setText(text);
    this.toastText?.setColor("#ffffff");
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
    for (const item of this.level.items) {
      const entry = snapshot.items[item.id] || {
        x: item.trayX,
        y: item.trayY,
        status: "outside",
      };
      const display = this.displayPointFor(item, entry);
      const sprite = this.add.image(display.x, display.y, item.image)
        .setOrigin(item.anchor[0], item.anchor[1])
        .setScale(item.scale)
        .setData("item", item)
        .setData("home", entry)
        .setDepth(item.fixed ? 140 : 420);
      this.itemLayer.add(sprite);
      this.sprites.set(item.id, sprite);
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

  visualOffsetFor() {
    return { x: 0, y: 0 };
  }

  displayPointFor(item, entry) {
    const offset = this.visualOffsetFor(item, entry.status);
    return {
      x: entry.x + offset.x,
      y: entry.y + offset.y,
    };
  }

  logicalDragPoint(item, x, y, status) {
    const offset = this.visualOffsetFor(item, status);
    return {
      x: x - offset.x,
      y: y - offset.y,
    };
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
    if (!preview.valid && !preview.inside) return;
    const rect = this.placementRect(preview);
    if (!rect) return;
    const palette = preview.valid ? PREVIEW_COLORS.good : PREVIEW_COLORS.bad;
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
    const placementLabel = this.previewPlacementLabel(preview);
    const dropHint = this.i18n.ui.dropHere;
    const supportText = preview.valid
      ? (placementLabel ? `${dropHint} · ${placementLabel}` : dropHint)
      : this.translateReason(preview.reason || "reject.generic");
    this.previewText
      .setText(supportText)
      .setPosition(preview.x, drawY - 8)
      .setVisible(true);
    if (this.previewSprite) {
      this.previewSprite
        .setTexture(item.image)
        .setOrigin(item.anchor[0], item.anchor[1])
        .setScale(item.scale)
        .setPosition(preview.x, preview.y)
        .setTint(preview.valid ? 0xa8ffe0 : 0xffb39f)
        .setAlpha(preview.valid ? 0.22 : 0.26)
        .setDepth(960)
        .setVisible(true);
    }
  }

  onDragStart(obj) {
    this.dragItem = obj;
    obj.setDepth(980);
    this.tweens.add({ targets: obj, scale: obj.scale * 1.06, duration: 90, ease: "Sine.out" });
  }

  onDrag(pointer, obj, x, y) {
    obj.setPosition(x, y);
    const item = obj.getData("item");
    if (!item) return;
    const home = obj.getData("home");
    const previewPoint = this.logicalDragPoint(item, pointer.worldX, pointer.worldY, home?.status);
    const preview = this.engine.previewMove(item.id, previewPoint.x, previewPoint.y, this.level.tuning.magnetPreviewDistance);
    this.hoverPlacement = preview;
    this.drawPlacementPreview(item, preview);
    this.refreshHoverZone(preview?.slotId || null, !!preview?.valid);
  }

  onDragEnd(obj) {
    const item = obj.getData("item");
    if (!item) return;
    const preview = this.hoverPlacement;
    this.clearHover();
    if (!preview) return this.returnHome(obj);
    if (!preview.valid) {
      for (const conflictId of preview.conflicts || []) this.bumpPair(obj, this.sprites.get(conflictId));
      return this.returnHome(obj, this.translateReason(preview.reason || "reject.generic"));
    }
    const result = this.engine.placeItem(item.id, preview);
    if (!result.ok) {
      for (const [aId, bId] of result.conflicts || []) this.bumpPair(this.sprites.get(aId), this.sprites.get(bId));
      return this.returnHome(obj, this.translateReason(result.reason || "reject.generic"));
    }

    const entry = result.state.items[item.id];
    const display = this.displayPointFor(item, entry);
    obj.setData("home", entry);
    this.tweens.add({
      targets: obj,
      x: display.x,
      y: display.y,
      scaleX: item.scale * 1.05,
      scaleY: item.scale * 0.94,
      duration: Math.round(this.level.tuning.snapDuration * 0.72),
      ease: "Quad.out",
      onComplete: () => {
        this.tweens.add({
          targets: obj,
          scaleX: item.scale,
          scaleY: item.scale,
          duration: 90,
          ease: "Back.out",
          onComplete: () => {
            this.dragItem = null;
            this.sortItems();
          },
        });
      },
    });
    this.setToastMessage(this.i18n.ui.snapOk);
    this.events.emit("snap", { item: item.id, slot: preview.slotId });
  }

  refreshHoverZone(slotId, valid) {
    this.slots.forEach((slot) => {
      const selected = slot.id === slotId;
      const line = valid ? 0x65e7b3 : 0xff8667;
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
    if (trayHome.status !== "packed") {
      this.engine.moveOutside(item.id, trayHome.x, trayHome.y);
    }
    obj.setData("home", this.engine.snapshot().items[item.id] || trayHome);
    this.tweens.add({
      targets: obj,
      x: display.x,
      y: display.y,
      scaleX: item.scale,
      scaleY: item.scale,
      duration: 220,
      ease: "Sine.out",
      onComplete: () => { this.dragItem = null; },
    });
    this.setToastMessage(resolved);
    this.events.emit("miss", { message: resolved, reason: message });
  }

  clearHover() {
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

  sortItems() {
    for (const child of this.itemLayer.getChildren()) {
      if (child === this.previewSprite) {
        child.setDepth(960);
        continue;
      }
      const home = child.getData("home");
      const item = child.getData("item");
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

  renderState(state, validation) {
    this.updateChrome({
      placed: validation.packed,
      total: validation.total,
    });
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
    if (validation.complete && !this.winSent) {
      this.winSent = true;
      this.time.delayedCall(450, () => {
        const reward = this.level.reward || 50;
        window.dispatchEvent(new CustomEvent("game-success", { detail: { score: 100, gold: reward } }));
        this.game.events.emit("game-success", { score: 100, gold: reward });
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








