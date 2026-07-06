import { StorageScene } from "../game/StorageScene.js";
import {
  bonusChallengeComplete,
  createBonusChallengeState,
  recordBonusPlacement,
} from "./bonusChallengeRules.js";
import { applySkipConsistencyPolish } from "./skipConsistencyPolish.js";
import { applyBonusProgressPolish } from "./bonusProgressPolish.js";

let applied = false;

function stateFor(scene) {
  const levelId = scene.level?.id;
  if (!scene.bonusChallengeState || scene.bonusChallengeState.levelId !== levelId) {
    scene.bonusChallengeState = {
      ...createBonusChallengeState(levelId),
      levelId,
    };
  }
  return scene.bonusChallengeState;
}

function award(scene, state) {
  if (!state.spec || state.completed) return;
  state.completed = true;
  scene.engine.state = {
    ...scene.engine.state,
    chainBonus: Number(scene.engine.state.chainBonus || 0) + state.spec.bonus,
  };
  scene.engine.persist();
  scene.playCallout("SECRET BONUS!", "gold");
  scene.setToastMessage(`+${state.spec.bonus} harmony bonus`);
  scene.events.emit("bonus-challenge", { id: state.spec.id, bonus: state.spec.bonus });
}

export function applyBonusChallengePolish() {
  if (applied) return;
  applied = true;
  applySkipConsistencyPolish();

  const originalCreate = StorageScene.prototype.create;
  const originalDragEnd = StorageScene.prototype.onDragEnd;
  const originalReturnHome = StorageScene.prototype.returnHome;

  StorageScene.prototype.create = function createWithBonusChallenge(data) {
    const result = originalCreate.call(this, data);
    const state = stateFor(this);
    if (state.spec) {
      this.time.delayedCall(1100, () => {
        const current = stateFor(this);
        if (!current.shown && !current.completed) {
          current.shown = true;
          this.setToastMessage(current.spec.text);
        }
      });
    }
    return result;
  };

  StorageScene.prototype.onDragEnd = function dragEndWithBonusChallenge(obj) {
    const item = obj?.getData?.("item");
    const before = item ? this.engine.state.items[item.id]?.status : null;
    const result = originalDragEnd.call(this, obj);
    if (!item) return result;

    const entry = this.engine.state.items[item.id];
    if (before === "packed" || entry?.status !== "packed") return result;

    const state = stateFor(this);
    if (!state.spec || state.completed) return result;
    const zone = this.engine.slotById(entry.slotId)?.zone || "unknown";
    const score = this.engine.scorePlacement(item.id, entry, this.engine.state)?.score ?? 0;
    recordBonusPlacement(state, zone, score);
    if (bonusChallengeComplete(state)) award(this, state);
    return result;
  };

  StorageScene.prototype.returnHome = function returnHomeWithChallengeMiss(obj, message = null) {
    const state = stateFor(this);
    if (state.spec && !state.completed && this.dragItem === obj) state.misses += 1;
    return originalReturnHome.call(this, obj, message);
  };

  applyBonusProgressPolish();
}
