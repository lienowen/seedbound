const NON_BLOCKING = new Set(["mustNeighbor"]);

function optionsFor(engine, itemId, state) {
  const options = [];
  const rotations = engine.canRotate(itemId) ? [0, 1] : [0];

  for (const rot of rotations) {
    for (const slot of engine.level.slots) {
      const grid = engine.slotGrid(slot);
      const size = engine.itemSize(itemId, rot);
      if (size.w > grid.cols || size.h > grid.rows) continue;

      for (let layer = 0; layer < grid.stackLayers; layer += 1) {
        for (let row = 0; row <= grid.rows - size.h; row += 1) {
          for (let col = 0; col <= grid.cols - size.w; col += 1) {
            const placement = { slotId: slot.id, col, row, layer, rot };
            const fit = engine.evaluatePlacement(itemId, placement, state);
            if (!fit.valid) continue;

            const report = engine.evaluateConstraints(itemId, placement, state);
            const blockingOk = report.results
              .filter((rule) => !NON_BLOCKING.has(rule.type))
              .every((rule) => rule.satisfied);
            if (!blockingOk) continue;

            options.push({
              ...placement,
              settled: report.allSatisfied,
              score: fit.score ?? 0,
            });
          }
        }
      }
    }
  }

  options.sort((a, b) => Number(b.settled) - Number(a.settled) || b.score - a.score);
  return options;
}

export function solveLevelForSkip(engine, visitLimit = 50000) {
  let state = engine.initialState();
  const ids = engine.level.items.filter((item) => !item.fixed).map((item) => item.id);
  let visited = 0;

  function dfs(remaining) {
    visited += 1;
    if (visited > visitLimit) return false;
    if (!remaining.length) return engine.validate(state).complete;

    let chosenId = null;
    let chosenOptions = null;
    for (const itemId of remaining) {
      const options = optionsFor(engine, itemId, state);
      if (!options.length) return false;
      if (!chosenOptions || options.length < chosenOptions.length) {
        chosenId = itemId;
        chosenOptions = options;
      }
    }

    const rest = remaining.filter((id) => id !== chosenId);
    for (const placement of chosenOptions) {
      const previous = state;
      const next = structuredClone(state);
      next.items[chosenId] = {
        ...engine.buildPackedEntry(chosenId, placement, next),
        fixed: false,
      };
      state = next;
      if (dfs(rest)) return true;
      state = previous;
    }
    return false;
  }

  const solved = dfs(ids);
  return {
    solved,
    state: solved ? state : null,
    visited,
  };
}
