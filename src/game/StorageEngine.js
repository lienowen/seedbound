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
  }

  initialState() {
    return {
      levelId: this.level.id || "level-1",
      revision: this.level.revision || 1,
      complete: false,
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

  itemSize(itemId) {
    const item = this.itemDef(itemId);
    const [w = 1, h = 1] = item?.size || [1, 1];
    return {
      w: Math.max(1, Math.round(w)),
      h: Math.max(1, Math.round(h)),
    };
  }

  itemPlacementNudge(itemId, placement = null, mode = "packed") {
    const item = this.itemDef(itemId);
    const slot = placement?.slotId ? this.slotById(placement.slotId) : null;
    const zoneKey = slot?.zone ? `${slot.zone}:${mode}` : null;
    const nudge = item?.nudge?.[zoneKey]
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
      const { w, h } = this.itemSize(entry.itemId);
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
    const { w, h } = this.itemSize(itemId);
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
    const { w, h } = this.itemSize(placement.itemId);
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
      return { valid: false, reason: "reject.generic", conflicts: [] };
    }
    if (!this.canUseSlot(item, slot)) {
      return { valid: false, reason: this.placementRejectReason(item, slot), conflicts: [] };
    }

    const { cols, rows, stackLayers } = this.slotGrid(slot);
    const { w, h } = this.itemSize(itemId);
    const col = placement.col ?? 0;
    const row = placement.row ?? 0;
    const layer = placement.layer ?? 0;
    if (col < 0 || row < 0 || col + w > cols || row + h > rows) {
      return { valid: false, reason: "reject.grid.overflow", conflicts: [] };
    }
    if (layer < 0 || layer >= stackLayers) {
      return { valid: false, reason: "reject.height.overflow", conflicts: [] };
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
      };
    }

    const support = this.supportSurfaceForPlacement(itemId, placement, candidate);
    if (!support.supported) {
      return {
        valid: false,
        reason: support.reason,
        conflicts: support.supportIds,
      };
    }

    return {
      valid: true,
      reason: "",
      conflicts: [],
      support,
    };
  }

  placementDistance(itemId, placement, x, y, candidate = this.state) {
    const anchor = this.placementAnchor({ ...placement, itemId }, candidate);
    return Math.hypot(x - anchor.x, y - anchor.y);
  }

  placementFromPoint(itemId, slot, x, y) {
    const { cols, rows, stackLayers } = this.slotGrid(slot);
    const { cellW, cellH } = this.slotCellSize(slot);
    const { w, h } = this.itemSize(itemId);
    const left = this.slotLeft(slot);
    const top = this.slotTop(slot);
    const localX = x - left;
    const localY = y - top;
    const rawCol = Math.floor(localX / cellW);
    const rawRow = Math.floor(localY / cellH);
    const layerBand = slot.h / stackLayers;
    const rawLayer = stackLayers - 1 - Math.floor(localY / layerBand);
    return {
      col: Math.max(0, Math.min(cols - w, rawCol)),
      row: Math.max(0, Math.min(rows - h, rawRow)),
      layer: Math.max(0, Math.min(stackLayers - 1, rawLayer)),
    };
  }

  pointInsideSlot(slot, x, y, padding = 0) {
    const left = this.slotLeft(slot) - padding;
    const right = left + slot.w + padding * 2;
    const top = this.slotTop(slot) - padding;
    const bottom = top + slot.h + padding * 2;
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  previewMove(itemId, x, y, maxDistance = 96) {
    const item = this.itemDef(itemId);
    if (!item) return null;

    for (const slot of this.level.slots) {
      if (!this.pointInsideSlot(slot, x, y, 10) || this.canUseSlot(item, slot)) continue;
      const { w, h } = this.itemSize(itemId);
      const snapped = this.placementFromPoint(itemId, slot, x, y);
      const anchor = this.placementAnchor({ slotId: slot.id, ...snapped, itemId });
      return {
        slotId: slot.id,
        zoneId: slot.zone,
        col: snapped.col,
        row: snapped.row,
        layer: snapped.layer,
        x: anchor.x,
        y: anchor.y,
        width: w,
        height: h,
        distance: this.placementDistance(itemId, { slotId: slot.id, ...snapped }, x, y),
        valid: false,
        reason: this.placementRejectReason(item, slot),
        conflicts: [],
        inside: true,
      };
    }

    const candidates = [];
    for (const slot of this.level.slots) {
      if (!this.canUseSlot(item, slot)) continue;
      const { cols, rows, stackLayers } = this.slotGrid(slot);
      const { w, h } = this.itemSize(itemId);
      const maxCol = cols - w;
      const maxRow = rows - h;
      if (maxCol < 0 || maxRow < 0) continue;

      if (this.pointInsideSlot(slot, x, y, 10)) {
        const snapped = this.placementFromPoint(itemId, slot, x, y);
        const evaluation = this.evaluatePlacement(itemId, { slotId: slot.id, ...snapped });
        const anchor = this.placementAnchor({ slotId: slot.id, ...snapped, itemId });
        candidates.push({
          slotId: slot.id,
          zoneId: slot.zone,
          col: snapped.col,
          row: snapped.row,
          layer: snapped.layer,
          x: anchor.x,
          y: anchor.y,
          width: w,
          height: h,
          distance: this.placementDistance(itemId, { slotId: slot.id, ...snapped }, x, y),
          valid: evaluation.valid,
          reason: evaluation.reason,
          conflicts: evaluation.conflicts,
          support: evaluation.support || anchor.support,
          inside: true,
        });
      }

      for (let layer = 0; layer < stackLayers; layer += 1) {
        for (let row = 0; row <= maxRow; row += 1) {
          for (let col = 0; col <= maxCol; col += 1) {
            const placement = { slotId: slot.id, col, row, layer };
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
              x: anchor.x,
              y: anchor.y,
              width: w,
              height: h,
              distance,
              valid: evaluation.valid,
              reason: evaluation.reason,
              conflicts: evaluation.conflicts,
              support: evaluation.support || anchor.support,
              inside: false,
            });
          }
        }
      }
    }

    candidates.sort((a, b) => {
      if (!!a.inside !== !!b.inside) return a.inside ? -1 : 1;
      if (a.valid !== b.valid) return a.valid ? -1 : 1;
      if (a.distance !== b.distance) return a.distance - b.distance;
      if ((a.layer || 0) !== (b.layer || 0)) return (a.layer || 0) - (b.layer || 0);
      return 0;
    });

    return candidates[0] || null;
  }

  placeItem(itemId, placement) {
    const target = typeof placement === "string" ? { slotId: placement, col: 0, row: 0, layer: 0 } : placement;
    const evaluation = this.evaluatePlacement(itemId, target);
    if (!evaluation.valid) {
      return { ok: false, reason: evaluation.reason, conflicts: evaluation.conflicts.map((id) => [itemId, id]) };
    }

    const next = this.snapshot();
    next.items[itemId] = {
      ...this.buildPackedEntry(itemId, target, next),
      fixed: !!next.items[itemId]?.fixed,
    };
    const result = this.validate(next);
    if (!result.validPlacement) return { ok: false, reason: result.reason, conflicts: result.conflicts };
    this.state = { ...next, complete: result.complete };
    this.persist();
    this.emit();
    return { ok: true, state: this.snapshot(), validation: result };
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

  validate(candidate = this.state) {
    const packed = Object.values(candidate.items).filter((entry) => entry.status === "packed");
    const conflicts = [];
    let illegalReason = "";

    for (const entry of packed) {
      const evaluation = this.evaluatePlacement(entry.itemId, entry, candidate);
      if (!evaluation.valid) {
        illegalReason = evaluation.reason;
        for (const conflictId of evaluation.conflicts) {
          conflicts.push([entry.itemId, conflictId]);
        }
      }
    }

    const movable = this.level.items.filter((item) => !item.fixed);
    const packedMovable = movable.filter((item) => candidate.items[item.id]?.status === "packed");
    const validPlacement = conflicts.length === 0 && !illegalReason;

    return {
      validPlacement,
      complete: validPlacement && packedMovable.length === movable.length,
      packed: packedMovable.length,
      total: movable.length,
      conflicts,
      reason: validPlacement ? "" : illegalReason || "reject.layer.full",
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
