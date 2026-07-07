import { StorageScene } from "../game/StorageScene.js";

let applied = false;

function isRestock(scene) {
  return scene?.level?.theme?.key === "restock-cooler";
}

function facingList(shelf) {
  if (Array.isArray(shelf?.facings) && shelf.facings.length) return shelf.facings;
  return (shelf?.products || []).map((image, col) => ({ image, col, width: 1 }));
}

function occupiedCells(scene, slotId) {
  const cells = new Set();
  const snapshot = scene.engine.snapshot();
  for (const entry of Object.values(snapshot.items)) {
    if (entry.status !== "packed" || entry.slotId !== slotId) continue;
    const size = scene.engine.itemSize(entry.itemId, entry.rot || 0);
    const start = Number(entry.col || 0);
    for (let offset = 0; offset < size.w; offset += 1) cells.add(start + offset);
  }
  return cells;
}

export function applySupermarketRestockFacingPolish() {
  if (applied) return;
  applied = true;

  const originalBuildFacingGhosts = StorageScene.prototype.buildFacingGhosts;
  const originalUpdateFacingGhosts = StorageScene.prototype.updateFacingGhosts;
  const originalCheckShelfCompletions = StorageScene.prototype.checkShelfCompletions;

  StorageScene.prototype.buildFacingGhosts = function buildTypedRestockFacingMarkers() {
    if (!isRestock(this)) return originalBuildFacingGhosts.call(this);

    if (this.facingGhosts) this.facingGhosts.forEach((entry) => entry.ghost?.destroy?.());
    this.facingGhosts = [];
    const plan = this.level?.planogram;
    if (!plan?.length || this.editMode) return;

    for (const shelf of plan) {
      const slot = this.findSlot(shelf.slotId);
      if (!slot) continue;

      for (const facing of facingList(shelf)) {
        const def = this.level.items.find((item) => item.id === facing.itemId)
          || this.level.items.find((item) => item.image === facing.image);
        if (!def) continue;

        const col = Number(facing.col || 0);
        const width = Math.max(1, Number(facing.width || def.size?.[0] || 1));
        const anchor = this.engine.placementAnchor({
          slotId: slot.id,
          col,
          row: 0,
          layer: 0,
          rot: 0,
          itemId: def.id,
        });
        const fakeEntry = {
          status: "packed",
          slotId: slot.id,
          col,
          row: 0,
          layer: 0,
          rot: 0,
          x: anchor.x,
          y: anchor.y,
          itemId: def.id,
        };
        const point = this.displayPointFor(def, fakeEntry);
        const cellW = slot.w / Math.max(1, Number(slot.cols || 1));
        const markerW = Math.max(34, Math.min(cellW * width * 0.72, slot.w * 0.78));

        // Shelf-edge vacancy marker scales with the product footprint. Wide meal
        // boxes and produce packs therefore read as wide gaps, not tiny 1x1 ticks.
        const marker = this.add.graphics();
        marker.fillStyle(0x8d7358, 0.17);
        marker.fillRoundedRect(-markerW / 2, -3, markerW, 6, 3);
        marker.fillStyle(0xffffff, 0.34);
        marker.fillRoundedRect(-markerW * 0.36, -2, markerW * 0.72, 2, 1);
        marker.setPosition(point.x, slot.y + 10).setDepth(60);
        this.itemLayer.add(marker);
        this.facingGhosts.push({ slotId: slot.id, col, width, ghost: marker });
      }
    }
    this.updateFacingGhosts();
  };

  StorageScene.prototype.updateFacingGhosts = function updateTypedRestockFacingMarkers() {
    if (!isRestock(this)) return originalUpdateFacingGhosts.call(this);
    if (!this.facingGhosts?.length) return;

    const occupiedBySlot = new Map();
    for (const marker of this.facingGhosts) {
      if (!occupiedBySlot.has(marker.slotId)) occupiedBySlot.set(marker.slotId, occupiedCells(this, marker.slotId));
      const occupied = occupiedBySlot.get(marker.slotId);
      let filled = true;
      for (let offset = 0; offset < marker.width; offset += 1) {
        if (!occupied.has(marker.col + offset)) {
          filled = false;
          break;
        }
      }

      if (filled && marker.ghost.visible) {
        this.tweens.add({
          targets: marker.ghost,
          alpha: 0,
          duration: 150,
          onComplete: () => marker.ghost.setVisible(false),
        });
      } else if (!filled) {
        marker.ghost.setVisible(true).setAlpha(1);
      }
    }
  };

  StorageScene.prototype.checkShelfCompletions = function checkTypedRestockShelfCompletion(slotId) {
    if (!isRestock(this)) return originalCheckShelfCompletions.call(this, slotId);

    const plan = this.level?.planogram;
    if (!plan?.length || slotId == null) return;
    const shelf = plan.find((entry) => entry.slotId === slotId);
    if (!shelf) return;

    this._clearedShelves = this._clearedShelves || new Set();
    if (this._clearedShelves.has(slotId)) return;

    const slot = this.findSlot(slotId);
    if (!slot) return;
    const occupied = occupiedCells(this, slotId);
    const cellCount = Math.max(1, Number(slot.cols || 1));
    for (let col = 0; col < cellCount; col += 1) {
      if (!occupied.has(col)) return;
    }

    this._clearedShelves.add(slotId);
    this._shelfStreak = (this._shelfStreak || 0) + 1;
    const streak = this._shelfStreak;
    const bonus = 15 + (streak - 1) * 10;
    const facings = facingList(shelf);

    this.playShelfClear(slot, facings.length, streak);
    const tag = this.i18n.ui.shelfCleared || "Shelf faced up!";
    this.playCallout(
      streak >= 3 ? this.i18n.ui.shelfClearStreak?.(streak) || tag : tag,
      streak >= 3 ? "fire" : "gold",
    );
    this.setToastMessage(
      (this.i18n.ui.shelfBonus && this.i18n.ui.shelfBonus(bonus)) || `Full shelf! +${bonus} coins`,
    );
    this.events.emit("shelf-clear", { slotId, bonus, streak });
  };
}
