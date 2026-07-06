import { StorageEngine } from "../game/StorageEngine.js";

let applied = false;
const NON_BLOCKING = new Set(["mustNeighbor"]);

export function applyPreviewConstraintPolish() {
  if (applied) return;
  applied = true;
  const original = StorageEngine.prototype.previewMove;

  StorageEngine.prototype.previewMove = function previewWithConstraints(itemId, x, y, maxDistance = 96, rot = 0) {
    const preview = original.call(this, itemId, x, y, maxDistance, rot);
    if (!preview?.slotId) return preview;

    const report = this.evaluateConstraints(itemId, preview, this.state);
    const blockingOk = report.results
      .filter((rule) => !NON_BLOCKING.has(rule.type))
      .every((rule) => rule.satisfied);
    const neighborPending = report.results.some((rule) => rule.type === "mustNeighbor" && !rule.satisfied);

    let score = preview.score ?? 50;
    let mood = preview.mood || "ok";
    if (!preview.valid || !blockingOk) {
      score = Math.min(score, preview.valid ? 35 : 25);
      mood = "sad";
    } else if (neighborPending) {
      score = Math.max(40, Math.min(score, 69));
      mood = "ok";
    }

    return {
      ...preview,
      score,
      mood,
      blockingOk,
      neighborPending,
      constraintResults: report.results,
    };
  };
}
