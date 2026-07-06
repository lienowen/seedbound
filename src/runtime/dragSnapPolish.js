import Phaser from "phaser";
import { StorageScene } from "../game/StorageScene.js";
import { applyEarlyCampaignLayoutPolish } from "./earlyCampaignLayoutPolish.js";
import { applyEarlyCampaignCopyPolish } from "./earlyCampaignCopyPolish.js";
import { applyEarlyCampaignCapacityPolish } from "./earlyCampaignCapacityPolish.js";
import { applyDropRejectPolish } from "./dropRejectPolish.js";

let applied = false;

function samePlacement(a, b) {
  return !!a && !!b && a.slotId === b.slotId
    && (a.col || 0) === (b.col || 0)
    && (a.row || 0) === (b.row || 0)
    && (a.layer || 0) === (b.layer || 0)
    && (a.rot || 0) === (b.rot || 0);
}

export function applyDragSnapPolish() {
  if (applied) return;
  applied = true;
  applyEarlyCampaignLayoutPolish();
  applyEarlyCampaignCapacityPolish();
  applyEarlyCampaignCopyPolish();
  applyDropRejectPolish();

  const start = StorageScene.prototype.onDragStart;
  const finish = StorageScene.prototype.onDragEnd;
  const goHome = StorageScene.prototype.returnHome;

  StorageScene.prototype.onDragStart = function smoothDragStart(obj) {
    const item = obj.getData?.("item");
    const home = obj.getData?.("home");
    this.dragLockedPreview = null;
    this.tweens.killTweensOf(obj);
    if (item) obj.setScale(this.displayScaleFor(item, home));
    return start.call(this, obj);
  };

  StorageScene.prototype.onDrag = function smoothDrag(pointer, obj, x, y) {
    obj.setPosition(x, y);
    const item = obj.getData("item");
    if (!item) return;

    const home = obj.getData("home");
    const point = this.logicalDragPoint(item, pointer.worldX, pointer.worldY, home);
    let preview = this.engine.previewMove(
      item.id,
      point.x,
      point.y,
      this.level.tuning.magnetPreviewDistance,
      this.dragRot || 0,
    );

    const locked = this.dragLockedPreview;
    if (locked && !samePlacement(locked, preview)) {
      const target = this.snapTargetPoint(item, locked);
      const release = this.topDown ? 74 : 82;
      const distance = target ? Math.hypot(pointer.worldX - target.x, pointer.worldY - target.y) : Infinity;
      if (distance <= release) preview = locked;
      else this.dragLockedPreview = null;
    }

    if (preview?.inside && preview.valid) this.dragLockedPreview = preview;
    this.hoverPlacement = preview;

    if (preview?.inside) {
      const target = this.snapTargetPoint(item, preview);
      if (target) {
        const distance = Math.hypot(target.x - obj.x, target.y - obj.y);
        const near = 1 - Math.min(1, distance / (this.topDown ? 150 : 170));
        const strength = Phaser.Math.Clamp(0.18 + near * 0.48, 0.18, 0.66);
        obj.x = Phaser.Math.Linear(obj.x, target.x, strength);
        obj.y = Phaser.Math.Linear(obj.y, target.y, strength);
      }
    }

    this.drawPlacementPreview(item, preview);
    this.refreshHoverZone(preview?.slotId || null, !!preview?.valid, preview?.score ?? 50);
    if (!this.topDown) this.updateWishBubble(obj, preview);
  };

  StorageScene.prototype.onDragEnd = function smoothDragEnd(obj) {
    this.dragLockedPreview = null;
    return finish.call(this, obj);
  };

  StorageScene.prototype.returnHome = function smoothReturnHome(obj, message = null) {
    this.tweens.killTweensOf(obj);
    this.dragLockedPreview = null;
    return goHome.call(this, obj, message);
  };
}
