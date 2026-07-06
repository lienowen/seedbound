import { StorageEngine } from "../game/StorageEngine.js";

let applied = false;

function moodFor(score) {
  if (score >= 70) return "happy";
  if (score >= 40) return "ok";
  return "sad";
}

function isColdDoorPreference(item) {
  const prefs = item?.prefs || {};
  return prefs.needsCold === true && prefs.zone === "door";
}

export function applyEngineConsistency() {
  if (applied) return;
  applied = true;

  const originalItemConstraints = StorageEngine.prototype.itemConstraints;
  const originalEvaluateConstraints = StorageEngine.prototype.evaluateConstraints;
  const originalScorePlacement = StorageEngine.prototype.scorePlacement;

  StorageEngine.prototype.itemConstraints = function itemConstraintsWithColdDoor(item) {
    const constraints = originalItemConstraints.call(this, item);
    if (!isColdDoorPreference(item)) return constraints;
    if (constraints.some((rule) => rule.type === "zone" && rule.zone === "door")) return constraints;
    return [...constraints, { type: "zone", zone: "door" }];
  };

  StorageEngine.prototype.evaluateConstraints = function evaluateConstraintsWithColdDoor(itemId, placement, candidate = this.state) {
    const report = originalEvaluateConstraints.call(this, itemId, placement, candidate);
    const item = this.itemDef(itemId);
    const slot = this.slotById(placement?.slotId);
    if (!isColdDoorPreference(item) || slot?.zone !== "door") return report;

    const results = report.results.map((rule) => (
      rule.type === "cold" ? { ...rule, satisfied: true } : rule
    ));

    return {
      ...report,
      results,
      allSatisfied: results.every((rule) => rule.satisfied),
    };
  };

  StorageEngine.prototype.scorePlacement = function scorePlacementWithColdDoor(itemId, placement, candidate = this.state) {
    const result = originalScorePlacement.call(this, itemId, placement, candidate);
    const item = this.itemDef(itemId);
    const slot = this.slotById(placement?.slotId);
    if (!isColdDoorPreference(item) || slot?.zone !== "door") return result;

    const correctedScore = Math.min(100, (result.score ?? 0) + 35);
    return {
      ...result,
      score: correctedScore,
      mood: moodFor(correctedScore),
      reasons: [
        ...(result.reasons || []).filter((reason) => reason !== "needsCold"),
        "coldDoorMatch",
      ],
    };
  };
}
