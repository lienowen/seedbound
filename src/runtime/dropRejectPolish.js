import { StorageScene } from "../game/StorageScene.js";

let applied = false;

export function applyDropRejectPolish() {
  if (applied) return;
  applied = true;
  const original = StorageScene.prototype.onDragEnd;

  StorageScene.prototype.onDragEnd = function rejectWrongStaticPlacement(obj) {
    const preview = this.hoverPlacement;
    if (preview?.valid && preview.blockingOk === false) {
      this.clearHover();
      this.hideWishBubble();
      this.setItemLifted(obj, false);
      this.mistakeCount += 1;
      this.comboCount = 0;
      return this.returnHome(obj, this.translateReason("reject.constraint.unmet"));
    }
    return original.call(this, obj);
  };
}
