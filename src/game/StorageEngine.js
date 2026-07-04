const SAVE_PREFIX = "seedbound.storage.";

function clone(value) {
  return structuredClone(value);
}

function uniqueConflicts(conflicts) {
  return [...new Set(conflicts)];
}

export class StorageEngine {
  constructor(level, options = {}) {
    this.level = clone(level);
    this.storageKey = `${SAVE_PREFIX}${options.saveId || this.level.id || "level-1"}`;
    this.state = options.forceFresh
      ? this.initialState()
      : this.normalizeState(this.restore()) || this.initialState();
    this.listeners = new Set();
    this.history = []; // [{ itemId, previousEntry }] for undo
  }

  initialState() {
    return {
      levelId: this.level.id || "level-1",
      revision: this.level.revision || 1,
      complete: false,
      chainBonus: 0,
      items: Object.fromEntries(this.level.items.map((item) => {
        const slot = item.slot ? this.slotById(item.slot) : null;
        const packed = slot
          ? this.buildPackedEntry(item.id, {
            slotId: slot.id,
            col: item.col ?? 0,
            row: item.row ?? 0,
            layer: item.layer ?? 0,
            fixed: !!item.fixed,
          })
          : {
            itemId: item.id,
            zoneId: "outside",
            slotId: null,
            col: null,
            row: null,
            layer: 0,
            x: item.trayX,
            y: item.trayY,
            status: "outside",
            fixed: !!item.fixed,
          };
        return [item.id, packed];
      })),
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot(), this.validate());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return clone(this.state);
  }

  itemDef(itemId) {
    return this.level.items.find((item) => item.id === itemId);
  }

  slotById(slotId) {
    return this.level.slots.find((slot) => slot.id === slotId);
  }

  slotGrid(slot) {
    return {
      cols: Math.max(1, Math.round(slot.cols || 1)),
      rows: Math.max(1, Math.round(slot.rows || 1)),
      stackLayers: Math.max(1, Math.round(slot.stackLayers || 1)),
    };
  }

  slotTop(slot) {
    return slot.y - slot.h / 2;
  }

  slotLeft(slot) {
    return slot.x - slot.w / 2;
  }

  slotCellSize(slot) {
    const grid = this.slotGrid(slot);
    return {
      cellW: slot.w / grid.cols,
      cellH: slot.h / grid.rows,
    };
  }

  // itemSize returns the grid footprint. When an item is rotated 90 or 270
  // degrees (odd rot), width and height swap. rot is 0..3 (each step = 90deg);
  // only its parity affects the footprint.
  itemSize(itemId, rot = 0) {
    const item = this.itemDef(itemId);
    const [w = 1, h = 1] = item?.size || [1, 1];
    const bw = Math.max(1, Math.round(w));
    const bh = Math.max(1, Math.round(h));
    return (Math.round(rot) % 2 !== 0) ? { w: bh, h: bw } : { w: bw, h: bh };
  }

  // An item is rotatable only if it opts in AND is non-square (rotation changes
  // its footprint — rotating a 1x1 or 2x2 would be pointless).
  canRotate(itemId) {
    const item = this.itemDef(itemId);
    if (!item?.rotatable) return false;
    const [w = 1, h = 1] = item.size || [1, 1];
    return Math.round(w) !== Math.round(h);
  }

  normalizeRot(rot = 0) {
    return ((Math.round(rot) % 4) + 4) % 4;
  }

  itemPlacementNudge(itemId, placement = null, mode = "packed") {
    const item = this.itemDef(itemId);
    const slot = placement?.slotId ? this.slotById(placement.slotId) : null;
    const slotKey = slot?.id || null;
    const slotModeKey = slotKey ? `${slotKey}:${mode}` : null;
    const zoneKey = slot?.zone ? `${slot.zone}:${mode}` : null;
    const nudge = item?.nudge?.[slotModeKey]
      || item?.nudge?.[slotKey]
      || item?.nudge?.[zoneKey]
      || item?.nudge?.[slot?.zone]
      || item?.nudge?.[mode]
      || item?.nudge
      || {};
    return {
      x: Math.round(nudge.x || 0),
      y: Math.round(nudge.y || 0),
    };
  }

  itemSupportHeight(itemId) {
    const item = this.itemDef(itemId);
    if (item?.surface?.visibleHeight && item?.surface?.textureHeight) {
      return Math.max(12, Math.round(item.surface.visibleHeight * item.surface.textureHeight * (item?.scale || 1)));
    }
    return Math.max(12, Math.round(item?.supportHeight ?? ((item?.bounds?.h || 64) * (item?.scale || 1))));
  }

  itemSupportTopOffset(itemId) {
    const item = this.itemDef(itemId);
    const surface = item?.surface;
    if (surface?.supportTopY != null && surface?.contactY != null && surface?.textureHeight) {
      return Math.max(8, Math.round((surface.contactY - surface.supportTopY) * surface.textureHeight * (item?.scale || 1)));
    }
    return this.itemSupportHeight(itemId);
  }

  itemSupportSurfaceY(entry) {
    return entry.y - this.itemSupportTopOffset(entry.itemId);
  }

  itemCanSupportStack(itemId) {
    return this.itemDef(itemId)?.surface?.stackable !== false;
  }

  itemTopY(entry) {
    return entry.y - this.itemSupportHeight(entry.itemId);
  }

  canUseSlot(item, slot) {
    return item.tags.some((tag) => slot.allow.includes(tag));
  }

  // ---- Harmony scoring: items can go anywhere, but get scored ----
  _COLD_ZONES = new Set(["chill", "drawer"]);

  scorePlacement(itemId, placement, candidate = this.state) {
    const item = this.itemDef(itemId);
    const slot = this.slotById(placement.slotId);
    if (!item || !slot) return { score: 0, mood: "bad", reasons: [] };

    const prefs = item.prefs || {};
    let score = 50; // neutral baseline
    const reasons = [];

    // 1. Tag match bonus: item tags matching slot allow
    if (this.canUseSlot(item, slot)) {
      score += 25;
      reasons.push("tagMatch");
    }

    // 2. Zone preference
    if (prefs.zone && slot.zone === prefs.zone) {
      score += 20;
      reasons.push("prefZone");
    } else if (prefs.zone && slot.zone !== prefs.zone) {
      score -= 10;
      reasons.push("wrongZone");
    }

    // 3. Temperature: needsCold items suffer in warm zones
    if (prefs.needsCold && !this._COLD_ZONES.has(slot.zone)) {
      score -= 25;
      reasons.push("needsCold");
    } else if (prefs.needsCold && this._COLD_ZONES.has(slot.zone)) {
      score += 10;
      reasons.push("coldMatch");
    }

    // 4. Visibility: likesVisible items prefer upper shelves / door
    if (prefs.likesVisible && (slot.zone === "shelf" || slot.zone === "door")) {
      score += 10;
      reasons.push("visible");
    }

    // 5. Neighbor preferences
    const packedById = this.packedItemsById(candidate);
    const occupancy = this.buildOccupancy(candidate, itemId);
    const { w, h } = this.itemSize(itemId, placement.rot);
    const neighborIds = new Set();

    // Check adjacent cells for neighbors
    const checkCols = [];
    const checkRows = [];
    for (let dc = -1; dc <= w; dc += 1) checkCols.push(placement.col + dc);
    for (let dr = -1; dr <= h; dr += 1) checkRows.push(placement.row + dr);
    for (const nc of checkCols) {
      for (const nr of checkRows) {
        // Skip our own cells
        if (nc >= placement.col && nc < placement.col + w && nr >= placement.row && nr < placement.row + h) continue;
        const nid = occupancy.get(`${slot.id}:${placement.layer || 0}:${nc}:${nr}`);
        if (nid) neighborIds.add(nid);
      }
    }

    for (const nid of neighborIds) {
      const nKey = this.itemDef(nid)?.image || nid;
      if (prefs.likesNeighbors?.includes(nKey)) {
        score += 12;
        reasons.push(`likes_${nKey}`);
      }
      if (prefs.hatesNeighbors?.includes(nKey)) {
        score -= 20;
        reasons.push(`hates_${nKey}`);
      }
    }

    const clamped = Math.max(0, Math.min(100, score));
    let mood = "ok";
    if (clamped >= 70) mood = "happy";
    else if (clamped >= 40) mood = "ok";
    else mood = "sad";

    return { score: clamped, mood, reasons };
  }

  // ---- CONSTRAINT MODEL (prototype) --------------------------------------
  // Turns an item's soft prefs into DISCRETE, binary rules. Each rule is either
  // satisfied or violated — no 0-100 fuzziness. This is what makes the puzzle
  // feel deductive (you can *reason* the answer) instead of a slider you keep
  // nudging. An item with prefs but no hard rules is "easygoing" (place anywhere).
  itemConstraints(item) {
    const prefs = item?.prefs || {};
    const list = [];
    const coldZone = prefs.zone ? this._COLD_ZONES.has(prefs.zone) : false;
    const warmZone = prefs.zone ? !this._COLD_ZONES.has(prefs.zone) : false;
    // Temperature is a hard "WHERE" rule. Cold and warm are mutually exclusive.
    if (prefs.needsCold) list.push({ type: "cold" });
    // Warmth is the inverse of cold: pantry/room-temp foods that spoil or go stale
    // in the chilled zones and must stay on an open shelf or in the door.
    else if (prefs.needsWarm) list.push({ type: "warm" });
    // Zone is hard too — but it yields to temperature when they contradict (a cold
    // item belongs in a cold zone; a warm item belongs in a warm zone) even if its
    // "nice-to-have" zone points the other way.
    if (
      prefs.zone &&
      (!prefs.needsCold || coldZone) &&
      (!prefs.needsWarm || warmZone)
    ) list.push({ type: "zone", zone: prefs.zone });
    // "Up high" — light/showy foods that want a top shelf or the top of the door.
    // Top cells are warm, so this only applies when it doesn't fight the cold rule.
    if (prefs.topShelf && !prefs.needsCold) list.push({ type: "topShelf" });
    // Exclusion ("don't sit next to X") is a hard rule.
    if (prefs.hatesNeighbors?.length) list.push({ type: "hates", keys: prefs.hatesNeighbors });
    // Visibility is hard, but only when it doesn't fight the cold requirement.
    if (prefs.likesVisible && !prefs.needsCold) list.push({ type: "visible" });
    // NOTE: likesNeighbors (adjacency) is intentionally NOT a hard constraint.
    // Positioning items next to each other is the high-effort, fiddly part; making
    // it a win gate is what caused fatigue AND over-constrained levels into being
    // unsolvable. It stays a SOFT bonus that feeds happiness/stars, not the gate.
    return list;
  }

  hasConstraints(item) {
    return this.itemConstraints(item).length > 0;
  }

  // Compute the set of adjacent neighbor item-ids for a placement, using the
  // exact same adjacency rule as scorePlacement so results stay consistent.
  neighborIdsFor(itemId, placement, candidate = this.state) {
    const slot = this.slotById(placement.slotId);
    if (!slot) return new Set();
    const occupancy = this.buildOccupancy(candidate, itemId);
    const { w, h } = this.itemSize(itemId, placement.rot);
    const ids = new Set();
    for (let dc = -1; dc <= w; dc += 1) {
      for (let dr = -1; dr <= h; dr += 1) {
        const nc = placement.col + dc;
        const nr = placement.row + dr;
        if (nc >= placement.col && nc < placement.col + w && nr >= placement.row && nr < placement.row + h) continue;
        const nid = occupancy.get(`${slot.id}:${placement.layer || 0}:${nc}:${nr}`);
        if (nid) ids.add(nid);
      }
    }
    return ids;
  }

  // Evaluate every hard constraint for an item at a placement. Returns discrete
  // per-rule results plus allSatisfied (used for "settling"/locking).
  evaluateConstraints(itemId, placement, candidate = this.state) {
    const item = this.itemDef(itemId);
    const slot = this.slotById(placement?.slotId);
    const constraints = this.itemConstraints(item);
    if (!item || !slot || !constraints.length) {
      return { constraints: [], results: [], allSatisfied: true, easygoing: !constraints.length };
    }

    const neighborKeys = new Set();
    for (const nid of this.neighborIdsFor(itemId, placement, candidate)) {
      neighborKeys.add(this.itemDef(nid)?.image || nid);
    }

    const results = constraints.map((c) => {
      let satisfied = false;
      if (c.type === "cold") satisfied = this._COLD_ZONES.has(slot.zone);
      else if (c.type === "warm") satisfied = !this._COLD_ZONES.has(slot.zone);
      else if (c.type === "topShelf") satisfied = typeof slot.id === "string" && slot.id.includes("top");
      else if (c.type === "zone") satisfied = slot.zone === c.zone;
      else if (c.type === "visible") satisfied = slot.zone === "shelf" || slot.zone === "door";
      else if (c.type === "likes") satisfied = c.keys.some((k) => neighborKeys.has(k));
      else if (c.type === "hates") satisfied = !c.keys.some((k) => neighborKeys.has(k));
      return { ...c, satisfied };
    });

    return {
      constraints,
      results,
      allSatisfied: results.every((r) => r.satisfied),
      easygoing: false,
    };
  }

  // Whole-board constraint report: per-item status and settled counts.
  // status: "pending" (not placed) | "violated" | "settled".
  constraintReport(candidate = this.state) {
    const movable = this.movableItems();
    const itemStatus = {};
    let settledCount = 0;
    let constrainedTotal = 0; // items that actually have hard rules

    for (const item of movable) {
      const hasRules = this.hasConstraints(item);
      if (hasRules) constrainedTotal += 1;
      const entry = candidate.items[item.id];
      if (!entry || entry.status !== "packed") {
        itemStatus[item.id] = { status: "pending", easygoing: !hasRules, results: [] };
        continue;
      }
      const evalc = this.evaluateConstraints(item.id, entry, candidate);
      // Placement legality also matters (no overlap/overflow).
      const legal = this.evaluatePlacement(item.id, entry, candidate).valid;
      const settled = legal && evalc.allSatisfied;
      if (settled && hasRules) settledCount += 1;
      itemStatus[item.id] = {
        status: settled ? "settled" : "violated",
        easygoing: !hasRules,
        results: evalc.results,
        legal,
      };
    }

    return { itemStatus, settledCount, constrainedTotal, total: movable.length };
  }

  // ---- Chain Reaction: placed item triggers neighbor happiness cascade ----
  computeChainReaction(itemId, placement, candidate = this.state) {
    const chain = []; // [{ itemId, level, bonus }]
    const visited = new Set([itemId]);
    let totalBonus = 0;
    const maxLevel = 3;
    const PROXIMITY = 240; // pixels — covers adjacent door shelves

    // Resolve the "base key" of an item (strip _1, _fixed etc. suffix)
    const baseKey = (id) => {
      const item = this.itemDef(id);
      return item?.image || id;
    };

    // Find all packed items physically near a given item
    const getNearby = (centerId) => {
      const centerEntry = candidate.items[centerId];
      if (!centerEntry || centerEntry.status !== "packed") return [];

      return Object.entries(candidate.items)
        .filter(([nid, nentry]) => {
          if (visited.has(nid)) return false;
          if (nentry.status !== "packed") return false;
          const dist = Math.hypot((nentry.x ?? 0) - (centerEntry.x ?? 0), (nentry.y ?? 0) - (centerEntry.y ?? 0));
          return dist > 0 && dist < PROXIMITY;
        })
        .map(([nid]) => nid);
    };

    // BFS
    let frontier = [itemId];
    for (let level = 1; level <= maxLevel; level += 1) {
      const nextFrontier = [];
      for (const centerId of frontier) {
        const centerKey = baseKey(centerId);
        const nearby = getNearby(centerId);
        for (const nid of nearby) {
          if (visited.has(nid)) continue;
          const neighborItem = this.itemDef(nid);
          const neighborPrefs = neighborItem?.prefs || {};
          // Match against base key (image name), not suffixed ID
          const likesList = (neighborPrefs.likesNeighbors || []).map((k) => baseKey(k));
          if (likesList.includes(centerKey)) {
            visited.add(nid);
            const bonus = 10 + level * 5;
            totalBonus += bonus;
            chain.push({ itemId: nid, level, bonus, likedItemId: centerId });
            nextFrontier.push(nid);
          }
        }
      }
      frontier = nextFrontier;
      if (!frontier.length) break;
    }

    return { chain, totalBonus };
  }

  placementRejectReason(item, slot) {
    if (!item || !slot) return "reject.generic";
    if (this.canUseSlot(item, slot)) return "";
    if (slot.zone === "door") {
      if (item.tags.some((tag) => tag === "food" || tag === "box")) {
        return "reject.door.foodBox";
      }
      return "reject.door.bottlesOnly";
    }
    if (slot.zone === "drawer" && item.tags.includes("bottle")) {
      return "reject.drawer.bottles";
    }
    if (slot.zone === "drawer") {
      return "reject.drawer.freshOnly";
    }
    return "reject.generic";
  }

  slotBaseline(slot, row = 0, height = 1) {
    const { cellH } = this.slotCellSize(slot);
    const stackBottom = this.slotTop(slot) + (row + height) * cellH;
    const baselineOffset = slot.h * ((slot.baseline ?? 1) - 1);
    return stackBottom + baselineOffset;
  }

  placementX(slot, col = 0, width = 1) {
    const { cellW } = this.slotCellSize(slot);
    return this.slotLeft(slot) + (col + width / 2) * cellW;
  }

  placementDepth(slot, placement) {
    return (slot.depth ?? 100) + ((placement.row ?? 0) * 12) + ((placement.layer ?? 0) * 24);
  }

  packedItemsById(candidate = this.state) {
    return new Map(
      Object.values(candidate.items)
        .filter((entry) => entry.status === "packed")
        .map((entry) => [entry.itemId, entry]),
    );
  }

  buildOccupancy(candidate = this.state, ignoreItemId = null) {
    const occupancy = new Map();
    for (const entry of Object.values(candidate.items)) {
      if (entry.status !== "packed" || entry.itemId === ignoreItemId) continue;
      const slot = this.slotById(entry.slotId);
      if (!slot) continue;
      const { w, h } = this.itemSize(entry.itemId, entry.rot);
      for (let row = entry.row; row < entry.row + h; row += 1) {
        for (let col = entry.col; col < entry.col + w; col += 1) {
          occupancy.set(`${slot.id}:${entry.layer || 0}:${col}:${row}`, entry.itemId);
        }
      }
    }
    return occupancy;
  }

  supportSurfaceForPlacement(itemId, placement, candidate = this.state) {
    const slot = this.slotById(placement.slotId);
    if (!slot) return { supported: false, reason: "reject.slot.missing", supportIds: [] };
    const { w, h } = this.itemSize(itemId, placement.rot);
    const layer = placement.layer ?? 0;
    const baselineY = this.slotBaseline(slot, placement.row ?? 0, h);
    if (layer === 0) {
      return { supported: true, baselineY, supportIds: [], supportTopY: baselineY, supportEntries: [] };
    }

    const packedById = this.packedItemsById(candidate);
    const occupancy = this.buildOccupancy(candidate, itemId);
    const supportIds = [];
    for (let row = placement.row; row < placement.row + h; row += 1) {
      for (let col = placement.col; col < placement.col + w; col += 1) {
        const supportId = occupancy.get(`${slot.id}:${layer - 1}:${col}:${row}`);
        if (!supportId) {
          return { supported: false, reason: "reject.support.needed", supportIds: [] };
        }
        supportIds.push(supportId);
      }
    }

    const uniqueSupportIds = uniqueConflicts(supportIds);
    const supportEntries = uniqueSupportIds.map((id) => packedById.get(id)).filter(Boolean);
    if (!supportEntries.length) {
      return { supported: false, reason: "reject.support.invalid", supportIds: [] };
    }
    if (supportEntries.some((entry) => !this.itemCanSupportStack(entry.itemId))) {
      return { supported: false, reason: "reject.support.notFlat", supportIds: uniqueSupportIds };
    }

    const topYs = supportEntries.map((entry) => this.itemSupportSurfaceY(entry));
    const highestSupport = Math.min(...topYs);
    const lowestSupport = Math.max(...topYs);
    if (lowestSupport - highestSupport > 8) {
      return { supported: false, reason: "reject.support.uneven", supportIds: uniqueSupportIds };
    }

    return {
      supported: true,
      baselineY: highestSupport,
      supportIds: uniqueSupportIds,
      supportTopY: highestSupport,
      supportEntries: supportEntries.map((entry) => ({
        itemId: entry.itemId,
        x: entry.x,
        y: entry.y,
        layer: entry.layer || 0,
        topY: this.itemSupportSurfaceY(entry),
      })),
    };
  }

  placementAnchor(placement, candidate = this.state) {
    const slot = this.slotById(placement.slotId);
    const { w, h } = this.itemSize(placement.itemId, placement.rot);
    const support = this.supportSurfaceForPlacement(placement.itemId, placement, candidate);
    const fallbackY = this.slotBaseline(slot, placement.row ?? 0, h);
    const nudge = this.itemPlacementNudge(placement.itemId, placement, "packed");
    return {
      x: this.placementX(slot, placement.col ?? 0, w) + nudge.x,
      y: (support.baselineY ?? fallbackY) + nudge.y,
      depth: this.placementDepth(slot, placement),
      support,
    };
  }

  buildPackedEntry(itemId, placement, candidate = this.state) {
    const slot = this.slotById(placement.slotId);
    const anchor = this.placementAnchor({ ...placement, itemId }, candidate);
    return {
      itemId,
      zoneId: slot.zone,
      slotId: slot.id,
      col: placement.col ?? 0,
      row: placement.row ?? 0,
      layer: placement.layer ?? 0,
      rot: this.normalizeRot(placement.rot),
      x: anchor.x,
      y: anchor.y,
      depth: anchor.depth,
      status: "packed",
      fixed: !!placement.fixed,
      supportIds: anchor.support.supportIds,
    };
  }

  evaluatePlacement(itemId, placement, candidate = this.state) {
    const item = this.itemDef(itemId);
    const slot = this.slotById(placement.slotId);
    if (!item || !slot) {
      return { valid: false, reason: "reject.generic", conflicts: [], score: 0, mood: "bad" };
    }
    // Tag-matching is now soft — score it, but never block placement
    const harmony = this.scorePlacement(itemId, placement, candidate);

    const { cols, rows, stackLayers } = this.slotGrid(slot);
    const { w, h } = this.itemSize(itemId, placement.rot);
    const col = placement.col ?? 0;
    const row = placement.row ?? 0;
    const layer = placement.layer ?? 0;
    if (col < 0 || row < 0 || col + w > cols || row + h > rows) {
      return { valid: false, reason: "reject.grid.overflow", conflicts: [], score: harmony.score, mood: harmony.mood };
    }
    if (layer < 0 || layer >= stackLayers) {
      return { valid: false, reason: "reject.height.overflow", conflicts: [], score: harmony.score, mood: harmony.mood };
    }

    const occupancy = this.buildOccupancy(candidate, itemId);
    const conflicts = [];
    for (let checkRow = row; checkRow < row + h; checkRow += 1) {
      for (let checkCol = col; checkCol < col + w; checkCol += 1) {
        const occupyingItemId = occupancy.get(`${slot.id}:${layer}:${checkCol}:${checkRow}`);
        if (occupyingItemId) conflicts.push(occupyingItemId);
      }
    }
    if (conflicts.length) {
      return {
        valid: false,
        reason: "reject.slot.full",
        conflicts: uniqueConflicts(conflicts),
        score: harmony.score,
        mood: harmony.mood,
      };
    }

    const support = this.supportSurfaceForPlacement(itemId, placement, candidate);
    if (!support.supported) {
      return {
        valid: false,
        reason: support.reason,
        conflicts: support.supportIds,
        score: harmony.score,
        mood: harmony.mood,
      };
    }

    return {
      valid: true,
      reason: "",
      conflicts: [],
      support,
      score: harmony.score,
      mood: harmony.mood,
    };
  }

  placementDistance(itemId, placement, x, y, candidate = this.state) {
    const anchor = this.placementAnchor({ ...placement, itemId }, candidate);
    return Math.hypot(x - anchor.x, y - anchor.y);
  }

  placementFromPoint(itemId, slot, x, y, rot = 0) {
    const { cols, rows, stackLayers } = this.slotGrid(slot);
    const { cellW, cellH } = this.slotCellSize(slot);
    const { w, h } = this.itemSize(itemId, rot);
    const left = this.slotLeft(slot);
    const top = this.slotTop(slot);
    const localX = x - left;
    const localY = y - top;
    // The pointer tracks the item's CENTER, so map the center to the top-left
    // cell of a w x h footprint (subtract half the footprint). For 1x1 items
    // this is identical to the old floor() behavior; for multi-cell items it
    // fixes an off-by-a-cell drift where pieces landed right/below the target.
    const rawCol = Math.round(localX / cellW - w / 2);
    const rawRow = Math.round(localY / cellH - h / 2);
    const layerBand = slot.h / stackLayers;
    const rawLayer = stackLayers - 1 - Math.floor(localY / layerBand);
    return {
      col: Math.max(0, Math.min(cols - w, rawCol)),
      row: Math.max(0, Math.min(rows - h, rawRow)),
      layer: Math.max(0, Math.min(stackLayers - 1, rawLayer)),
      rot: this.normalizeRot(rot),
    };
  }

  pointInsideSlot(slot, x, y, padding = 0) {
    const left = this.slotLeft(slot) - padding;
    const right = left + slot.w + padding * 2;
    const top = this.slotTop(slot) - padding;
    const bottom = top + slot.h + padding * 2;
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  previewMove(itemId, x, y, maxDistance = 96, rot = 0) {
    const item = this.itemDef(itemId);
    if (!item) return null;

    // Quick preview: find the best slot the pointer is inside.
    // Skip occupied slots — only show previews for actually-placeable positions.
    let bestQuick = null;
    let bestQuickScore = -1;
    for (const slot of this.level.slots) {
      if (!this.pointInsideSlot(slot, x, y, 10)) continue;
      const { w, h } = this.itemSize(itemId, rot);
      const snapped = this.placementFromPoint(itemId, slot, x, y, rot);
      const evaluation = this.evaluatePlacement(itemId, { slotId: slot.id, ...snapped });
      const harmony = evaluation.score ?? 50;
      // Prefer valid placements; among those, prefer higher scores
      const rank = (evaluation.valid ? 1000 : 0) + harmony;
      if (rank > bestQuickScore) {
        bestQuickScore = rank;
        const anchor = this.placementAnchor({ slotId: slot.id, ...snapped, itemId });
        bestQuick = {
          slotId: slot.id,
          zoneId: slot.zone,
          col: snapped.col,
          row: snapped.row,
          layer: snapped.layer,
          rot: snapped.rot,
          x: anchor.x,
          y: anchor.y,
          width: w,
          height: h,
          distance: this.placementDistance(itemId, { slotId: slot.id, ...snapped }, x, y),
          valid: evaluation.valid,
          alwaysPlaceable: true,
          reason: evaluation.reason,
          conflicts: evaluation.conflicts,
          support: evaluation.support || anchor.support,
          score: harmony,
          mood: evaluation.mood,
          inside: true,
        };
      }
    }
    if (bestQuick) return bestQuick;

    const candidates = [];
    for (const slot of this.level.slots) {
      const { cols, rows, stackLayers } = this.slotGrid(slot);
      const { w, h } = this.itemSize(itemId, rot);
      const maxCol = cols - w;
      const maxRow = rows - h;
      if (maxCol < 0 || maxRow < 0) continue;

      if (this.pointInsideSlot(slot, x, y, 10)) {
        const snapped = this.placementFromPoint(itemId, slot, x, y, rot);
        const evaluation = this.evaluatePlacement(itemId, { slotId: slot.id, ...snapped });
        const anchor = this.placementAnchor({ slotId: slot.id, ...snapped, itemId });
        candidates.push({
          slotId: slot.id,
          zoneId: slot.zone,
          col: snapped.col,
          row: snapped.row,
          layer: snapped.layer,
          rot: snapped.rot,
          x: anchor.x,
          y: anchor.y,
          width: w,
          height: h,
          distance: this.placementDistance(itemId, { slotId: slot.id, ...snapped }, x, y),
          valid: evaluation.valid,
          alwaysPlaceable: true,
          reason: evaluation.reason,
          conflicts: evaluation.conflicts,
          support: evaluation.support || anchor.support,
          score: evaluation.score,
          mood: evaluation.mood,
          inside: true,
        });
      }

      for (let layer = 0; layer < stackLayers; layer += 1) {
        for (let row = 0; row <= maxRow; row += 1) {
          for (let col = 0; col <= maxCol; col += 1) {
            const placement = { slotId: slot.id, col, row, layer, rot };
            const distance = this.placementDistance(itemId, placement, x, y);
            if (distance > maxDistance) continue;
            const evaluation = this.evaluatePlacement(itemId, placement);
            const anchor = this.placementAnchor({ ...placement, itemId });
            candidates.push({
              slotId: slot.id,
              zoneId: slot.zone,
              col,
              row,
              layer,
              rot: this.normalizeRot(rot),
              x: anchor.x,
              y: anchor.y,
              width: w,
              height: h,
              distance,
              valid: evaluation.valid,
              alwaysPlaceable: true,
              reason: evaluation.reason,
              conflicts: evaluation.conflicts,
              support: evaluation.support || anchor.support,
              score: evaluation.score,
              mood: evaluation.mood,
              inside: false,
            });
          }
        }
      }
    }

    candidates.sort((a, b) => {
      if (!!a.inside !== !!b.inside) return a.inside ? -1 : 1;
      if (a.valid !== b.valid) return a.valid ? -1 : 1;
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      if (a.distance !== b.distance) return a.distance - b.distance;
      if ((a.layer || 0) !== (b.layer || 0)) return (a.layer || 0) - (b.layer || 0);
      return 0;
    });

    return candidates[0] || null;
  }

  movableItems() {
    return this.level.items.filter((item) => !item.fixed);
  }

  firstOutsideMovableItem() {
    return this.movableItems().find((item) => this.state.items[item.id]?.status !== "packed") || null;
  }

  findFirstValidPlacement(itemId, candidate = this.state) {
    const item = this.itemDef(itemId);
    if (!item) return null;

    let best = null;
    let bestScore = -1;

    // Try each allowed orientation (both 0 and 90deg for rotatable items).
    const rotations = this.canRotate(itemId) ? [0, 1] : [0];

    for (const rot of rotations) {
      for (const slot of this.level.slots) {
        const { cols, rows, stackLayers } = this.slotGrid(slot);
        const { w, h } = this.itemSize(itemId, rot);
        const maxCol = cols - w;
        const maxRow = rows - h;
        if (maxCol < 0 || maxRow < 0) continue;

        for (let layer = 0; layer < stackLayers; layer += 1) {
          for (let row = 0; row <= maxRow; row += 1) {
            for (let col = 0; col <= maxCol; col += 1) {
              const placement = { slotId: slot.id, col, row, layer, rot };
              const evaluation = this.evaluatePlacement(itemId, placement, candidate);
              if (!evaluation.valid) continue;
              const score = evaluation.score ?? 0;
              if (score > bestScore) {
                bestScore = score;
                const anchor = this.placementAnchor({ ...placement, itemId }, candidate);
                best = {
                  itemId,
                  slotId: slot.id,
                  zoneId: slot.zone,
                  col,
                  row,
                  layer,
                  rot: this.normalizeRot(rot),
                  x: anchor.x,
                  y: anchor.y,
                  width: w,
                  height: h,
                  valid: true,
                  reason: "",
                  conflicts: [],
                  support: evaluation.support || anchor.support,
                  score,
                  mood: evaluation.mood,
                  inside: true,
                };
              }
            }
          }
        }
      }
    }
    return best;
  }

  findHintPlacement() {
    for (const item of this.movableItems()) {
      if (this.state.items[item.id]?.status === "packed") continue;
      const placement = this.findFirstValidPlacement(item.id);
      if (placement) return placement;
    }
    return null;
  }

  placeItem(itemId, placement) {
    const target = typeof placement === "string" ? { slotId: placement, col: 0, row: 0, layer: 0 } : placement;
    const evaluation = this.evaluatePlacement(itemId, target);
    if (!evaluation.valid) {
      return { ok: false, reason: evaluation.reason, conflicts: evaluation.conflicts.map((id) => [itemId, id]), score: evaluation.score, mood: evaluation.mood };
    }

    const next = this.snapshot();
    next.items[itemId] = {
      ...this.buildPackedEntry(itemId, target, next),
      fixed: !!next.items[itemId]?.fixed,
    };
    const result = this.validate(next);
    if (!result.validPlacement) return { ok: false, reason: result.reason, conflicts: result.conflicts, score: evaluation.score, mood: evaluation.mood };
    // Compute chain reaction on the would-be state before committing
    const chainResult = this.computeChainReaction(itemId, target, next);
    // Push undo history (before committing)
    const previousEntry = this.state.items[itemId];
    this.history.push({ itemId, previousEntry: clone(previousEntry) });
    this.state = { ...next, complete: result.complete, chainBonus: (this.state.chainBonus || 0) + chainResult.totalBonus };
    this.persist();
    this.emit();
    return { ok: true, state: this.snapshot(), validation: result, score: evaluation.score, mood: evaluation.mood, chain: chainResult.chain, chainBonus: chainResult.totalBonus };
  }

  undo() {
    if (!this.history.length) return { ok: false, reason: "Nothing to undo" };
    const last = this.history.pop();
    const entry = last.previousEntry;
    const next = this.snapshot();
    next.items[last.itemId] = clone(entry);
    next.complete = false;
    this.state = next;
    this.persist();
    this.emit();
    return { ok: true, itemId: last.itemId, entry };
  }

  skipLevel() {
    // Auto-place all remaining movable items to their best slots (1-star pass)
    const next = this.snapshot();
    for (const item of this.movableItems()) {
      if (next.items[item.id]?.status === "packed") continue;
      const placement = this.findFirstValidPlacement(item.id, next);
      if (!placement) continue;
      next.items[item.id] = {
        ...this.buildPackedEntry(item.id, placement, next),
        fixed: false,
      };
    }
    this.state = { ...next, complete: true, chainBonus: 0 };
    this.history = [];
    this.persist();
    this.emit();
    return { ok: true, state: this.snapshot() };
  }

  bestHintForNext() {
    // Find the best tray item + its optimal placement
    let best = null;
    let bestScore = -1;
    for (const item of this.movableItems()) {
      if (this.state.items[item.id]?.status === "packed") continue;
      const placement = this.findFirstValidPlacement(item.id);
      if (!placement || (placement.score ?? 0) <= bestScore) continue;
      bestScore = placement.score ?? 0;
      const anchor = this.placementAnchor({ ...placement, itemId: item.id });
      best = {
        itemId: item.id,
        slotId: placement.slotId,
        zoneId: placement.zoneId,
        col: placement.col,
        row: placement.row,
        layer: placement.layer,
        x: anchor.x,
        y: anchor.y,
        width: placement.width,
        height: placement.height,
        valid: true,
        score: bestScore,
        mood: placement.mood || "happy",
        inside: true,
      };
    }
    return best;
  }

  moveOutside(itemId, x, y) {
    const current = this.state.items[itemId];
    if (!current || current.fixed) return;
    const item = this.itemDef(itemId);
    const targetX = item?.trayX ?? x;
    const targetY = item?.trayY ?? y;
    if (
      current.status === "outside"
      && Math.abs(current.x - targetX) < 1
      && Math.abs(current.y - targetY) < 1
    ) {
      return;
    }
    this.state = {
      ...this.state,
      complete: false,
      items: {
        ...this.state.items,
        [itemId]: {
          ...current,
          zoneId: "outside",
          slotId: null,
          col: null,
          row: null,
          layer: 0,
          x: targetX,
          y: targetY,
          status: "outside",
        },
      },
    };
    this.persist();
    this.emit();
  }

  // Per-item happiness: an item is "happy" when its placement scores high enough.
  static HAPPY_THRESHOLD = 70;

  happyGoalFor(total) {
    // Reachable but never trivial: you must satisfy most items, yet limited good
    // spots mean pleasing EVERYONE (3 stars) requires real optimization.
    if (this.level.harmony?.happyGoal != null) return this.level.harmony.happyGoal;
    return Math.max(2, Math.round(total * 0.6));
  }

  validate(candidate = this.state) {
    const movable = this.level.items.filter((item) => !item.fixed);
    const movableIds = new Set(movable.map((m) => m.id));
    const packed = Object.values(candidate.items).filter((entry) => entry.status === "packed");
    const conflicts = [];
    let illegalReason = "";
    let totalScore = 0;
    let scoredCount = 0;
    let happyCount = 0;
    const moods = {}; // itemId -> "happy" | "ok" | "sad" (for live face badges)

    for (const entry of packed) {
      const evaluation = this.evaluatePlacement(entry.itemId, entry, candidate);
      if (!evaluation.valid) {
        illegalReason = evaluation.reason;
        for (const conflictId of evaluation.conflicts) {
          conflicts.push([entry.itemId, conflictId]);
        }
      }
      // Only count movable items toward harmony/happiness
      if (evaluation.score != null && movableIds.has(entry.itemId)) {
        totalScore += evaluation.score;
        scoredCount += 1;
        const score = evaluation.score;
        const mood = score >= StorageEngine.HAPPY_THRESHOLD ? "happy" : score >= 40 ? "ok" : "sad";
        moods[entry.itemId] = mood;
        // A happy item must also be legally placed (no conflict/overflow).
        if (evaluation.valid && mood === "happy") happyCount += 1;
      }
    }

    // Add accumulated chain bonuses (kept for scoring/analytics only)
    const chainTotal = candidate.chainBonus || 0;
    totalScore += chainTotal;

    const packedMovable = movable.filter((item) => candidate.items[item.id]?.status === "packed");
    const validPlacement = conflicts.length === 0 && !illegalReason;
    const avgScore = scoredCount > 0 ? Math.round(totalScore / Math.max(1, scoredCount)) : 0;
    const allPlaced = packedMovable.length === movable.length;
    const happyTotal = movable.length;
    const happyGoal = this.happyGoalFor(happyTotal);
    const goalMet = happyCount >= happyGoal;

    // CONSTRAINT MODEL (prototype): the real win condition. Every item with hard
    // rules must have ALL of them satisfied. Easygoing items don't gate the win.
    const report = this.constraintReport(candidate);
    // PACKING MODE: pure spatial puzzle — fitting everything in legally IS the win,
    // no zone/happiness requirement (used by the picnic-basket prototype).
    const allSettled = this.level.winMode === "packing"
      ? true
      : (report.constrainedTotal > 0
        ? report.settledCount >= report.constrainedTotal
        : goalMet); // fall back to happiness if a level defines no hard rules
    // Complete = everything placed legally AND every constrained item is settled.
    const complete = allPlaced && validPlacement && allSettled;

    // SINGLE TRUTHFUL PROGRESS METRIC: an item is "ready" when it's placed,
    // legal, and has all its rules satisfied (easygoing placed items count too).
    // doneCount === doneTotal is exactly equivalent to `complete`, so the player
    // sees ONE number that reaches full precisely when they win. This replaces
    // the old confusing pair (placed/total vs settled/constrained).
    const doneCount = Object.values(report.itemStatus).filter((s) => s.status === "settled").length;
    const doneTotal = movable.length;

    return {
      validPlacement,
      complete,
      packed: packedMovable.length,
      total: movable.length,
      conflicts,
      reason: validPlacement ? (allPlaced && !allSettled ? "reject.constraint.unmet" : "") : (illegalReason || "reject.layer.full"),
      harmonyScore: avgScore,
      totalScore,
      scoredCount,
      allPlaced,
      // Happiness model (legacy, kept for coins/analytics)
      happyCount,
      happyGoal,
      happyTotal,
      moods,
      goalMet,
      targetMet: allSettled,
      chainBonus: chainTotal,
      // Constraint model (prototype)
      itemStatus: report.itemStatus,
      settledCount: report.settledCount,
      constrainedTotal: report.constrainedTotal,
      allSettled,
      // Unified progress (see above): use these for all player-facing counters.
      doneCount,
      doneTotal,
    };
  }

  reset() {
    this.state = this.initialState();
    this.persist();
    this.emit();
  }

  persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch {
      // Save failure should never break play.
    }
  }

  restore() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.levelId !== (this.level.id || "level-1")) return null;
      if ((parsed?.revision || 1) !== (this.level.revision || 1)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  normalizeState(restored) {
    if (!restored?.items) return null;
    const baseline = this.initialState();
    const items = { ...baseline.items };

    for (const item of this.level.items) {
      if (item.fixed) continue;
      const saved = restored.items[item.id];
      if (saved?.status !== "packed") continue;
      const evaluation = this.evaluatePlacement(item.id, saved, { ...restored, items });
      if (!evaluation.valid) continue;
      items[item.id] = {
        ...this.buildPackedEntry(item.id, saved, { items }),
        fixed: false,
      };
    }

    const validation = this.validate({ ...baseline, items });
    return {
      ...baseline,
      items,
      complete: validation.complete,
    };
  }

  emit() {
    const validation = this.validate();
    for (const listener of this.listeners) listener(this.snapshot(), validation);
  }
}
