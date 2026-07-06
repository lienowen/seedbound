import { StorageScene } from "../game/StorageScene.js";

let applied = false;

function packedCount(scene) {
  return scene.level.items
    .filter((item) => !item.fixed)
    .filter((item) => scene.engine.state.items[item.id]?.status === "packed")
    .length;
}

function announce(scene, title, message, tone = "gold") {
  if (!scene.scene.isActive() || scene.engine.validate().complete) return;
  scene.playCallout(title, tone);
  scene.setToastMessage(message);
}

export function applyFinalBossPhasePolish() {
  if (applied) return;
  applied = true;

  const originalCreate = StorageScene.prototype.create;

  StorageScene.prototype.create = function createWithBossPhases(data) {
    const result = originalCreate.call(this, data);
    if (this.level?.id !== "fridge-br-20" || this.editMode) return result;

    const eventState = this.midEventState;
    const waveAlreadyShown = !!eventState?.waves?.[0]?.revealed;
    const pickupAlreadyDone = !!eventState?.pickupDone;
    this.finalBossState = { phase: pickupAlreadyDone ? 3 : waveAlreadyShown ? 2 : 1 };

    const moveToPhase2 = () => {
      if (!this.finalBossState || this.finalBossState.phase >= 2) return;
      this.finalBossState.phase = 2;
      this.time.delayedCall(140, () => announce(this, "SHIFT 2: LAST DELIVERY", "New stock is here. Re-plan without losing the base.", "gold"));
    };

    const moveToPhase3 = () => {
      if (!this.finalBossState || this.finalBossState.phase >= 3) return;
      this.finalBossState.phase = 3;
      this.time.delayedCall(140, () => announce(this, "SHIFT 3: RECOVERY", "One last pickup changed the cabinet. Restore it cleanly.", "ice"));
    };

    const onMidEvent = (event) => {
      if (event?.type === "wave-revealed") moveToPhase2();
      if (event?.type === "customer-pickup") moveToPhase3();
    };

    const onSnap = () => {
      if (this.finalBossState?.phase === 3 && packedCount(this) >= 5 && !this.engine.validate().complete) {
        this.setToastMessage("Final stretch of the night: one clean finish.");
      }
    };

    this.events.on("mid-event", onMidEvent);
    this.events.on("snap", onSnap);
    this.events.once("shutdown", () => {
      this.events.off("mid-event", onMidEvent);
      this.events.off("snap", onSnap);
    });

    this.time.delayedCall(1150, () => {
      const phase = this.finalBossState?.phase || 1;
      if (phase === 1) announce(this, "SHIFT 1: BUILD THE BASE", "Festival night starts now. More stock is coming.", "fire");
      else if (phase === 2) announce(this, "SHIFT 2: LAST DELIVERY", "New stock is active. Re-plan the cabinet.", "gold");
      else announce(this, "SHIFT 3: RECOVERY", "Restore the missing item and finish the night strong.", "ice");
    });
    return result;
  };
}
