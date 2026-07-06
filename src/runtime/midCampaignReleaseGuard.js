import { StorageScene } from "../game/StorageScene.js";

let applied = false;

function keepDecoyMarked(scene) {
  const state = scene.midEventState;
  if (!state || state.wrongDone) return;
  const decoy = scene.level?.items?.find((item) => item.eventDecoy);
  if (!decoy) return;
  const sprite = scene.sprites?.get(decoy.id);
  if (!sprite?.active || !sprite.visible) return;
  sprite.setTint(0xff8b8b);
}

export function applyMidCampaignReleaseGuard() {
  if (applied) return;
  applied = true;

  const originalSortItems = StorageScene.prototype.sortItems;
  StorageScene.prototype.sortItems = function guardedSortItems() {
    const result = originalSortItems.call(this);
    keepDecoyMarked(this);
    return result;
  };

  const originalSpotlight = StorageScene.prototype.updateRemainingSpotlight;
  StorageScene.prototype.updateRemainingSpotlight = function guardedRemainingSpotlight(validation) {
    const remaining = this.level?.items
      ?.filter((item) => !item.fixed)
      .filter((item) => this.engine.state.items[item.id]?.status !== "packed") || [];
    if (remaining.length === 1 && this.engine.itemDef(remaining[0].id)?.eventHidden) {
      this.clearRemainingSpotlight();
      return;
    }
    return originalSpotlight.call(this, validation);
  };
}
