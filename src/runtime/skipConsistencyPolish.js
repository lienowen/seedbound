import { StorageScene } from "../game/StorageScene.js";
import { solveLevelForSkip } from "./skipSolver.js";

let applied = false;

export function applySkipConsistencyPolish() {
  if (applied) return;
  applied = true;

  StorageScene.prototype.performSkip = function truthfulSkip() {
    const solved = solveLevelForSkip(this.engine);
    if (!solved.solved || !solved.state) {
      this.setToastMessage(this.i18n.ui.hintUnavailable || "Skip unavailable");
      return { ok: false };
    }

    this.engine.state = { ...solved.state, complete: true, chainBonus: 0 };
    this.engine.history = [];
    this.engine.persist();
    this.engine.emit();

    const validation = this.engine.validate();
    if (!validation.complete) return { ok: false };

    this.winSent = true;
    this.completionPolishStarted = true;
    this.playCompletionPolish(1);
    this.time.delayedCall(600, () => {
      const reward = Math.floor((this.level.reward || 50) * 0.5);
      this.game.events.emit("game-success", {
        score: 50,
        gold: reward,
        stars: 1,
        mistakes: 0,
        harmony: validation.totalScore || 0,
      });
    });
    return { ok: true, visited: solved.visited };
  };
}
