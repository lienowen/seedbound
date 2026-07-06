import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";
import { StorageEngine } from "../src/game/StorageEngine.js";

function rotationsFor(engine, itemId) {
  return engine.canRotate(itemId) ? [0, 1] : [0];
}

function legalPlacements(engine, itemId, candidate) {
  const placements = [];

  for (const rot of rotationsFor(engine, itemId)) {
    for (const slot of engine.level.slots) {
      const { cols, rows, stackLayers } = engine.slotGrid(slot);
      const { w, h } = engine.itemSize(itemId, rot);
      if (w > cols || h > rows) continue;

      for (let layer = 0; layer < stackLayers; layer += 1) {
        for (let row = 0; row <= rows - h; row += 1) {
          for (let col = 0; col <= cols - w; col += 1) {
            const placement = { slotId: slot.id, col, row, layer, rot };
            const check = engine.evaluatePlacement(itemId, placement, candidate);
            if (!check.valid) continue;
            const constraints = engine.evaluateConstraints(itemId, placement, candidate);
            placements.push({
              ...placement,
              score: check.score ?? 0,
              constraintsSatisfied: constraints.allSatisfied,
            });
          }
        }
      }
    }
  }

  // Try truthful placements first, then higher-harmony placements. Neighbor rules
  // may become satisfied later, so unsatisfied candidates are still explored.
  placements.sort((a, b) => (
    Number(b.constraintsSatisfied) - Number(a.constraintsSatisfied)
    || b.score - a.score
  ));
  return placements;
}

function solveLevel(level) {
  const engine = new StorageEngine(level, { forceFresh: true, saveId: "__validation__" });
  let working = engine.snapshot();
  const assignment = [];
  let visited = 0;

  function dfs(remainingIds) {
    visited += 1;
    if (!remainingIds.length) {
      // This is the critical truth check: a level is solved only when the exact
      // runtime engine says the final board is complete.
      return engine.validate(working).complete;
    }

    // Minimum-remaining-values ordering keeps the search practical and mirrors
    // the real engine instead of inventing a second tag-based legality system.
    let chosenId = null;
    let chosenPlacements = null;
    for (const itemId of remainingIds) {
      const placements = legalPlacements(engine, itemId, working);
      if (!placements.length) return false;
      if (!chosenPlacements || placements.length < chosenPlacements.length) {
        chosenId = itemId;
        chosenPlacements = placements;
      }
    }

    const rest = remainingIds.filter((id) => id !== chosenId);
    for (const placement of chosenPlacements) {
      const previous = working;
      const next = structuredClone(working);
      next.items[chosenId] = engine.buildPackedEntry(chosenId, placement, next);
      working = next;
      assignment.push({ itemId: chosenId, ...placement });

      if (dfs(rest)) return true;

      assignment.pop();
      working = previous;
    }

    return false;
  }

  const movableIds = level.items.filter((item) => !item.fixed).map((item) => item.id);
  const solved = dfs(movableIds);
  const finalValidation = solved ? engine.validate(working) : null;

  return {
    movableCount: movableIds.length,
    solved,
    assignment: solved ? assignment.slice() : [],
    visited,
    finalValidation,
  };
}

function auditFirstLevel() {
  const first = FRIDGE_BR_CAMPAIGN.find((level) => level.id === "fridge-br-1");
  if (!first) return ["Missing fridge-br-1"];

  const errors = [];
  const movable = first.items.filter((item) => !item.fixed);
  const images = movable.map((item) => item.image);
  const expected = ["green-soda", "red-soda", "juice", "milk"];

  if (movable.length !== 4) {
    errors.push(`fridge-br-1 must expose exactly 4 movable items, found ${movable.length}`);
  }
  for (const image of expected) {
    if (!images.includes(image)) errors.push(`fridge-br-1 missing tutorial drink: ${image}`);
  }
  for (const item of movable) {
    if (item.prefs?.zone === "door" && item.prefs?.needsCold) {
      errors.push(`fridge-br-1 contradictory rule on ${item.id}: door + needsCold`);
    }
  }

  return errors;
}

let hasError = false;
const firstLevelErrors = auditFirstLevel();
for (const error of firstLevelErrors) {
  hasError = true;
  console.error(`FAIL core-consistency ${error}`);
}

for (const level of FRIDGE_BR_CAMPAIGN) {
  const result = solveLevel(level);
  const status = result.solved ? "OK" : "FAIL";
  console.log(
    `${status} ${level.id} phase=${level.phase} movable=${result.movableCount} visited=${result.visited}`,
  );
  if (!result.solved) hasError = true;
  if (result.solved && !result.finalValidation?.complete) {
    hasError = true;
    console.error(`FAIL ${level.id} solver returned a board that runtime does not mark complete`);
  }
}

if (hasError) process.exitCode = 1;
