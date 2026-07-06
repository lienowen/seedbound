import { StorageScene } from "../game/StorageScene.js";

let applied = false;

function textFor(state) {
  const id = state?.spec?.id;
  if (!id) return "";
  if (id === "clean-start") return `Clean start ${Math.min(state.successCount, 4)}/4`;
  if (id === "shelf-first") return `Shelf start ${Math.min(state.successCount, 2)}/2`;
  if (id === "happy-streak") return `Happy streak ${Math.min(state.happyStreak, 3)}/3`;
  if (id === "zone-tour") return `Zone tour ${Math.min(state.zones.size, 3)}/3`;
  if (id === "rack-rush") {
    let streak = 0;
    for (let i = state.recentZones.length - 1; i >= 0 && state.recentZones[i] === "door"; i -= 1) streak += 1;
    return `Rack streak ${Math.min(streak, 3)}/3`;
  }
  if (id === "perfect-five") return `Perfect run ${Math.min(state.successCount, 5)}/5`;
  if (id === "shelf-shelf-rack") return `Pattern ${Math.min(state.recentZones.length, 3)}/3`;
  if (id === "calm-streak") return `Calm streak ${Math.min(state.happyStreak, 4)}/4`;
  if (id === "quick-hands") return `Quick hands ${Math.min(state.successCount, 5)}/5`;
  if (id === "grand-tour") return `Grand tour ${Math.min(state.zones.size, 4)}/4`;
  return "";
}

export function applyBonusProgressPolish() {
  if (applied) return;
  applied = true;
  const original = StorageScene.prototype.onDragEnd;

  StorageScene.prototype.onDragEnd = function dragEndWithBonusProgress(obj) {
    const before = this.bonusChallengeState?.successCount || 0;
    const result = original.call(this, obj);
    const state = this.bonusChallengeState;
    if (!state?.spec || state.completed || state.successCount <= before) return result;
    const text = textFor(state);
    if (text) this.setToastMessage(text);
    return result;
  };
}
