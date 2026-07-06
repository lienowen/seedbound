import { StorageScene } from "../game/StorageScene.js";

let applied = false;

function packedCount(scene) {
  return scene.level.items
    .filter((item) => !item.fixed)
    .filter((item) => scene.engine.state.items[item.id]?.status === "packed")
    .length;
}

function announce(scene, title, message, tone = "gold") {
  scene.playCallout(title, tone);
  scene.setToastMessage(message);
}

export function applyFinalBossPhasePolish() {
  if (applied) return;
  applied = true;

  const originalCreate = StorageScene.prototype.create;
  const originalDragEnd = StorageScene.prototype.onDragEnd;

  StorageScene.prototype.create = function createWithBossPhases(data) {
    const result = originalCreate.call(this, data);
    if (this.level?.id !== "fridge-br-20" || this.editMode) return result;

    this.finalBossState = { phase: 1 };
    this.time.delayedCall(1150, () => {
      if (!this.scene.isActive() || this.engine.validate().complete) return;
      announce(this, "BOSS PHASE 1", "Build a stable base. More stock is coming.", "fire");
    });
    return result;
  };

  StorageScene.prototype.onDragEnd = function dragEndWithBossPhases(obj) {
    const result = originalDragEnd.call(this, obj);
    const boss = this.finalBossState;
    if (!boss || this.engine.validate().complete) return result;

    const eventState = this.midEventState;
    const firstWave = eventState?.waves?.[0];

    if (boss.phase === 1 && firstWave?.revealed) {
      boss.phase = 2;
      this.time.delayedCall(180, () => {
        if (this.scene.isActive() && !this.engine.validate().complete) {
          announce(this, "BOSS PHASE 2", "Last delivery! Re-plan around the new stock.", "gold");
        }
      });
      return result;
    }

    if (boss.phase === 2 && eventState?.pickupDone) {
      boss.phase = 3;
      this.time.delayedCall(180, () => {
        if (this.scene.isActive() && !this.engine.validate().complete) {
          announce(this, "FINAL PHASE", "Restore the missing item and close the perfect fridge.", "ice");
        }
      });
      return result;
    }

    if (boss.phase === 3 && packedCount(this) >= 5) {
      this.setToastMessage("Final stretch: one clean finish.");
    }
    return result;
  };
}
